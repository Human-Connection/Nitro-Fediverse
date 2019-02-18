import client from './apollo-client'
import { createNoteActivity, createOrderedCollection, createOrderedCollectionPage, extractNameFromId, constructIdFromName } from './utils'
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
      debug(`error fetching data from graqhql api\n ${result.error}`)
      throw new Error(result.error)
    }
  }

  async getFollowersCollectionPage(actorId) {
    const slug = extractNameFromId(actorId)
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
      await Promise.all([
        followers.map((follower) => {
          followersCollection.orderedItems.push(constructIdFromName(follower.slug))
        })
      ])

      return followersCollection
    } else {
      debug(`error fetching data from graqhql api\n ${result.error}`)
      throw new Error(result.error)
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

      const followingCollection = createOrderedCollection(slug, 'followers')
      followingCollection.totalItems = followingCount

      return followingCollection
    } else {
      debug(`error fetching data from graqhql api\n ${result.error}`)
      throw new Error(result.error)
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

      await Promise.all([
        following.forEach((user) => {
          followingCollection.orderedItems.push(constructIdFromName(user.slug))
        })
      ])

      return followingCollection
    } else {
      debug(`error fetching data from graqhql api\n ${result.error}`)
      throw new Error(result.error)
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
      debug(`error fetching data from graqhql api\n ${result.error}`)
      throw new Error(result.error)
    }
  }

  async getOutboxCollectionPage(actorId) {
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

      const outboxCollection = createOrderedCollectionPage(slug, 'outbox')
      outboxCollection.totalItems = posts.length
      await Promise.all([
        posts.forEach((post) => {
          outboxCollection.orderedItems.push(createNoteActivity(post.content, slug))
        })
      ])

      debug(`after createNote`)
      return outboxCollection
    } else {
      debug(`error fetching data from graqhql api\n ${result.error}`)
      throw new Error(result.error)
    }
  }

  async saveFollowersCollection(followers) {
    const slug = extractNameFromId(followers.id)
    await this.ensureUser(constructIdFromName(slug))
    const totalItems = followers.totalItems
    await client.mutate({
      mutation: gql`
        mutation {
            setFollowingCount(followingCount: ${totalItems}, slug: "${slug}")
        }
      `
    })
  }

  async saveFollowersCollectionPage(followers) {
    const orderedItems = followers.orderedItems
    const toUserName = extractNameFromId(followers.id)
    const toUserId = await this.ensureUser(constructIdFromName(toUserName))

    return Promise.all(
      orderedItems.map(async (follower) => {
        const fromUserId = await this.ensureUser(follower)
        const result = await client.mutate({
          mutation: gql`
              mutation {
                  AddUserFollowedBy(from: {id: "${fromUserId}"}, to: {id: "${toUserId}"}) {
                      from { name }
                  }
              }
          `
        })
        if (result.error && (result.error.message || result.error.errors)) {
          throw new Error(`${result.error.message ? result.error.message : result.error.errors[0].message}`)
        }
      })
    )
  }

  /**
   * This function will search for user existence and will create a disabled user with a random 16 bytes password when no user is found.
   *
   * @param actorId
   * @returns {Promise<*>}
   */
  async ensureUser(actorId) {
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
      // user already exists.. return the id
      return queryResult.data.User[0].id
    } else {
      // user does not exist.. create it
      const createUserResult = await client.mutate({
        mutation: gql`
          mutation {
              CreateUser(password: "${crypto.randomBytes(16).toString('hex')}", slug:"${extractNameFromId(actorId)}", actorId: "${actorId}") {
                  id
              } 
          }
        `
      })

      if (createUserResult.data && createUserResult.data.CreateUser) {
        // user created.. now disable the user
        const userId = createUserResult.data.CreateUser.id
        const result = await client.mutate({
          mutation: gql`
            mutation {
                UpdateUser(id: "${userId}", disabled: true) {
                    name
                }
            }
          `
        })

        if (result.error && (result.error.errors || result.error.message)) {
          throw new Error(result.error.message ? result.error.message : result.error.errors[0].message)
        }

        return userId
      } else if (createUserResult.error && (createUserResult.error.errors || createUserResult.error.message)) {
        throw new Error(createUserResult.error.message ? createUserResult.error.message : createUserResult.error.errors[0].message)
      }
    }
  }
}
