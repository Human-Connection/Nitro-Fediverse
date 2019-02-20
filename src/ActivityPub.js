import { sendAcceptActivity, sendRejectActivity, extractNameFromId, extractDomainFromUrl } from './utils'
const debug = require('debug')('ea')
import request from 'request'
import as from 'activitystrea.ms'

export default class ActivityPub {
    constructor(domain, port, dataSource) {
        if (domain === 'localhost')
            this.domain = `${domain}:${port}`
        else
            this.domain = domain

        this.port = port
        this.dataSource = dataSource
    }

    async getFollowersCollection(actorId) {
        return await this.dataSource.getFollowersCollection(actorId)
    }

    async getFollowersCollectionPage(actorId) {
        return await this.dataSource.getFollowersCollectionPage(actorId)
    }

    async getFollowingCollection(actorId) {
        return await this.dataSource.getFollowingCollection(actorId)
    }

    async getFollowingCollectionPage(actorId) {
        return await this.dataSource.getFollowingCollectionPage(actorId)
    }

    async getOutboxCollection(actorId) {
        return await this.dataSource.getOutboxCollection(actorId)
    }

    async getOutboxCollectionPage(actorId) {
        return await this.dataSource.getOutboxCollectionPage(actorId)
    }

    handleFollowActivity(activity) {
        debug('inside FOLLOW')
        let toActorName = extractNameFromId(activity.object)
        let fromDomain = extractDomainFromUrl(activity.actor)
        let toActorObject = {}
        const dataSource = this.dataSource

        return new Promise((resolve, reject) => {
            request({
                url: activity.object,
                headers: {
                    'Accept': 'application/activity+json'
                }
            }, async (err, response) => {
                if (err)
                    reject(err)
                debug(`name = ${toActorName}@${this.domain}`)

                let followersCollectionPage = await this.dataSource.getFollowersCollectionPage(activity.object)

                toActorObject = JSON.parse(response.body)

                const followActivity = as.follow()
                  .id(activity.id)
                  .actor(activity.actor)
                  .object(activity.object)

                // add follower if not already in collection
                if (followersCollectionPage.orderedItems.includes(activity.actor)) {
                    debug('follower already in collection!')
                    debug(`inbox = ${toActorObject.inbox}`)
                    resolve(sendRejectActivity(followActivity, toActorName, fromDomain, toActorObject.inbox))
                } else {
                    followersCollectionPage.orderedItems.push(activity.actor)
                }

                debug(`followers = ${JSON.stringify(followersCollectionPage.orderedItems, null, 2)}`)
                debug(`inbox = ${toActorObject.inbox}`)
                debug(`outbox = ${toActorObject.outbox}`)
                debug(`followers = ${toActorObject.followers}`)
                debug(`following = ${toActorObject.following}`)

                // TODO save after accept activity for the corresponding follow is received
                try {
                    await dataSource.saveFollowersCollectionPage(followersCollectionPage)
                    debug(`follow activity saved`)
                    resolve(sendAcceptActivity(followActivity, toActorName, fromDomain, toActorObject.inbox))
                } catch (e) {
                    debug('followers update error!', e)
                    resolve(sendRejectActivity(followActivity, toActorName, fromDomain, toActorObject.inbox))
                }
            })
        })
    }

    async handleUndoActivity(activity) {
        debug('inside UNDO')
        switch (activity.object.type) {
            case 'Follow':
                const followActivity = activity.object
                await this.dataSource.undoFollowActivity(followActivity.object, followActivity.actor)
                break
            default:

        }
    }

    async handleCreateActivity(activity) {
        debug('inside create')
        switch (activity.object.type) {
            case 'Article':
            case 'Note':
                const articleObject = activity.object
                if (articleObject.inReplyTo) {
                  await this.dataSource.createComment(articleObject)
                } else {
                  await this.dataSource.createPost(articleObject)
                }
                break

            default:
        }
    }

    handleDeleteActivity(activity) {
        debug('inside delete')

    }
}
