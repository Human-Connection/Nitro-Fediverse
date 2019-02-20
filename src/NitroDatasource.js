import client from './apollo-client'
import { getActorIdByName, throwErrorIfGraphQLErrorOccurred, createNoteActivity, extractIdFromActivityId, createOrderedCollection, createOrderedCollectionPage, extractNameFromId } from './utils'
const gql = require('graphql-tag')
const debug = require('debug')('ea:nitro-datasource')
import crypto from 'crypto'
export default class NitroDatasource {

  constructor(domain) {
    this.domain = domain
  }

  async getFollowersCollection(actorId) {
    const slug = extractNameFromId(actorId)
    debug(`slug= ${slug}`)
    const result = await client.query({
      query: gql`
        query {
            User(slug: "${slug}") {
                followedByCount
            }  
        }
        `
    })
    debug(`successfully fetched followers`)
    debug(result.data)
    if (result.data) {
      const actor = result.data.User[0]
      const followersCount = actor.followedByCount

      const followersCollection = createOrderedCollection(slug, 'followers')
      followersCollection.totalItems = followersCount

      return followersCollection
    } else {
      throwErrorIfGraphQLErrorOccurred(result)
    }
  }

  async getFollowersCollectionPage(actorId) {
    const slug = extractNameFromId(actorId)
    debug(`getFollowersPage slug = ${slug}`)
    const result = await client.query({
      query: gql`
        query {
            User(slug:"${slug}") {
                followedBy {
                    slug
                }
                followedByCount
            } 
        }
        `
    })


    debug(result.data)
    if (result.data) {
      const actor = result.data.User[0]
      const followers = actor.followedBy
      const followersCount = actor.followedByCount

      const followersCollection = createOrderedCollectionPage(slug, 'followers')
      followersCollection.totalItems = followersCount
      debug(`followers = ${JSON.stringify(followers, null, 2)}`)
      await Promise.all(
        followers.map(async (follower) => {
          followersCollection.orderedItems.push(await getActorIdByName(follower.slug))
        })
      )

      return followersCollection
    } else {
      throwErrorIfGraphQLErrorOccurred(result)
    }

  }

  async getFollowingCollection(actorId) {
    const slug = extractNameFromId(actorId)
    const result = await client.query({
      query: gql`
          query {
              User(slug:"${slug}") {
                  followingCount
              }
          }
      `
    })

    debug(result.data)
    if (result.data) {
      const actor = result.data.User[0]
      const followingCount = actor.followingCount

      const followingCollection = createOrderedCollection(slug, 'following')
      followingCollection.totalItems = followingCount

      return followingCollection
    } else {
      throwErrorIfGraphQLErrorOccurred(result)
    }
  }

  async getFollowingCollectionPage(actorId) {
    const slug = extractNameFromId(actorId)
    const result = await client.query({
      query: gql`
          query {
              User(slug:"${slug}") {
                  following {
                      slug
                  }
                  followingCount
              }
          }
      `
    })

    debug(result.data)
    if (result.data) {
      const actor = result.data.User[0]
      const following = actor.following
      const followingCount = actor.followingCount

      const followingCollection = createOrderedCollectionPage(slug, 'following')
      followingCollection.totalItems = followingCount

      await Promise.all(
        following.map(async (user) => {
          followingCollection.orderedItems.push(await getActorIdByName(user.slug))
        })
      )

      return followingCollection
    } else {
      throwErrorIfGraphQLErrorOccurred(result)
    }
  }

  async getOutboxCollection(actorId) {
    const slug = extractNameFromId(actorId)
    const result = await client.query({
      query: gql`
          query {
              User(slug:"${slug}") {
                  contributions {
                      title
                      slug
                      content
                      contentExcerpt
                      createdAt
                  }
              }
          }
      `
    })

    debug(result.data)
    if (result.data) {
      const actor = result.data.User[0]
      const posts = actor.contributions

      const outboxCollection = createOrderedCollection(slug, 'outbox')
      outboxCollection.totalItems = posts.length

      return outboxCollection
    } else {
      throwErrorIfGraphQLErrorOccurred(result)
    }
  }

  async getOutboxCollectionPage(actorId) {
    const slug = extractNameFromId(actorId)
    const result = await client.query({
      query: gql`
          query {
              User(slug:"${slug}") {
                  contributions {
                      id
                      title
                      slug
                      content
                      contentExcerpt
                      createdAt
                  }
              }
          }
      `
    })

    debug(result.data)
    if (result.data) {
      const actor = result.data.User[0]
      const posts = actor.contributions

      const outboxCollection = createOrderedCollectionPage(slug, 'outbox')
      outboxCollection.totalItems = posts.length
      await Promise.all(
        posts.map((post) => {
          outboxCollection.orderedItems.push(createNoteActivity(post.content, slug, post.id, post.createdAt))
        })
      )

      debug(`after createNote`)
      return outboxCollection
    } else {
      throwErrorIfGraphQLErrorOccurred(result)
    }
  }

  async undoFollowActivity(fromActorId, toActorId) {
    const fromUserId = await this.ensureUser(fromActorId)
    const toUserId = await this.ensureUser(toActorId)
    const result = await client.mutate({
      mutation: gql`
          mutation {
              RemoveUserFollowedBy(from: {id: "${fromUserId}"}, to: {id: "${toUserId}"}) {
                  from { name }
              }
          }
      `
    })
    debug(`undoFollowActivity result = ${JSON.stringify(result, null, 2)}`)
    throwErrorIfGraphQLErrorOccurred(result)
  }

  async saveFollowersCollectionPage(followersCollection, onlyNewestItem = true) {
    debug(`inside saveFollowers`)
    let orderedItems = followersCollection.orderedItems
    const toUserName = extractNameFromId(followersCollection.id)
    const toUserId = await this.ensureUser(await getActorIdByName(toUserName))
    orderedItems = onlyNewestItem ? [orderedItems.pop()] : orderedItems

    return await Promise.all(
      await Promise.all(orderedItems.map(async (follower) => {
        debug(`follower = ${follower}`)
        const fromUserId = await this.ensureUser(follower)
        debug(`fromUserId = ${fromUserId}`)
        debug(`toUserId = ${toUserId}`)
        const result = await client.mutate({
          mutation: gql`
              mutation {
                  AddUserFollowedBy(from: {id: "${fromUserId}"}, to: {id: "${toUserId}"}) {
                      from { name }
                  }
              }
          `
        })
        debug(`addUserFollowedBy edge = ${JSON.stringify(result, null, 2)}`)
        throwErrorIfGraphQLErrorOccurred(result)
        debug(`saveFollowers: added follow edge successfully`)
      }))
    )
  }

  async createPost(postObject) {
    // TODO how to handle the to field? Now the post is just created, doesn't matter who is the recipient
    // createPost
    const title = postObject.summary ? postObject.summary : postObject.content.split(' ').slice(0, 5).join(' ')
    const id = extractIdFromActivityId(postObject.id)
    let result = await client.mutate({
      mutation: gql`
        mutation {
            CreatePost(content: "${postObject.content}", title: "${title}", id: "${id}") {
                id
            }
        }
      `
    })

    throwErrorIfGraphQLErrorOccurred(result)

    // ensure user and add author to post
    const userId = await this.ensureUser(postObject.attributedTo)
    result = await client.mutate({
      mutation: gql`
        mutation {
            AddPostAuthor(from: {id: "${userId}"}, to: {id: "${id}"})
        }
      `
    })

    throwErrorIfGraphQLErrorOccurred(result)
  }

  async createComment(postObject) {
    let result = await client.mutate({
      mutation: gql`
        mutation {
            CreateComment(content: "${postObject.content}") {
                id
            }
        }
      `
    })

    throwErrorIfGraphQLErrorOccurred(result)
    const postId = extractIdFromActivityId(postObject.inReplyTo)

    result = await client.mutate({
      mutation: gql`
        mutation {
            AddCommentPost(from: { id: "${result.data.CreateComment.id}", to: { id: "${postId}" }}) {
                id
            }
        }
      `
    })

    throwErrorIfGraphQLErrorOccurred(result)
  }

  /**
   * This function will search for user existence and will create a disabled user with a random 16 bytes password when no user is found.
   *
   * @param actorId
   * @returns {Promise<*>}
   */
  async ensureUser(actorId) {
    debug(`inside ensureUser = ${actorId}`)
    const queryResult = await client.query({
      query: gql`
          query {
              User(slug: "${extractNameFromId(actorId)}") {
                  id
              }
          }
      `
    })

    if (queryResult.data && Array.isArray(queryResult.data.User) && queryResult.data.User.length > 0) {
      debug(`ensureUser: user exists.. return id`)
      // user already exists.. return the id
      return queryResult.data.User[0].id
    } else {
      debug(`ensureUser: user not exists.. createUser`)
      // user does not exist.. create it
      const result = await client.mutate({
        mutation: gql`
          mutation {
              CreateUser(password: "${crypto.randomBytes(16).toString('hex')}", slug:"${extractNameFromId(actorId)}", actorId: "${actorId}", name: "${extractNameFromId(actorId)}") {
                  id
              } 
          }
        `
      })
      throwErrorIfGraphQLErrorOccurred(result)

      return result.data.CreateUser.id
    }
  }
}
