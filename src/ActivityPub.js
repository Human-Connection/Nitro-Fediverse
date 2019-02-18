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

                let followersCollection = await this.dataSource.getFollowersCollection(activity.object)
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

                followersCollection.totalItems += 1
                followersCollectionPage.totalItems += 1

                debug(`followers = ${JSON.stringify(followersCollectionPage.orderedItems, null, 2)}`)
                debug(`inbox = ${toActorObject.inbox}`)
                debug(`outbox = ${toActorObject.outbox}`)
                debug(`followers = ${toActorObject.followers}`)
                debug(`following = ${toActorObject.following}`)

                try {
                    await dataSource.saveFollowersCollection(followersCollection)
                    await dataSource.saveFollowersCollectionPage(followersCollectionPage)

                    resolve(sendAcceptActivity(followActivity, toActorName, fromDomain, toActorObject.inbox))
                } catch (e) {
                    debug('followers update error!', e)
                    resolve(sendRejectActivity(followActivity, toActorName, fromDomain, toActorObject.inbox))
                }
            })
        })
    }

    handleUndoActivity(activity) {
        debug('inside UNDO')
        const toActorName = extractNameFromId(activity.object.object)
        const fromDomain = extractDomainFromUrl(activity.actor)
        debug(`toActorName = ${JSON.stringify(toActorName)}`)
        debug(`name = ${toActorName}@${this.domain}`)

        // Remove the user to the DB of accounts that follow the account
        // get the followers JSON for the user
        request({
            url: activity.actor,
            headers: {
                'Accept': 'application/activity+json'
            }
        }, (err, response) => {
            if (err)
                return throw new Error(CODES.NOT_FOUND)
            this.db.get('select "followers", "followersPage" from "collections" where "collectionowner" = $name', {$name: `${toActorName}@${this.domain}`}, (err, result) => {
                if (result === undefined) {
                    debug(`No followers found for username = ${toActorName}.`)
                    return throw new Error(CODES.NOT_FOUND)
                } else {
                    // update followers
                    let followers = JSON.parse(result.followers)
                    let followersPage = JSON.parse(result.followersPage)

                    followersPage.orderedItems = followersPage.orderedItems.filter((el) => {
                        return el !== activity.object.actor
                    })

                    followersPage.totalItems = followersPage.orderedItems.length
                    followers.totalItems = followersPage.totalItems

                    let followersString = JSON.stringify(followers)
                    let followersPageString = JSON.stringify(followersPage)

                    debug(`followers = ${JSON.stringify(followersPage.orderedItems, null, 2)}`)
                    // update into DB
                    this.db.run('update "collections" set "followers"=$followers, "followersPage"=$followersPage where "collectionowner" = $name', {
                        $name: `${toActorName}@${this.domain}`,
                        $followers: followersString,
                        $followersPage: followersPageString
                    }, (err, result) => {
                        if (!err) {
                            const toActorObject = JSON.parse(response.body)
                            const inbox = toActorObject.inbox
                            debug('updated followers!', err, result)
                            const followActivity = as.follow()
                              .id(activity.id)
                              .actor(activity.actor)
                              .object(activity.object)
                            return sendAcceptActivity(followActivity, toActorName, fromDomain, inbox)
                        } else {
                            return throw new Error(CODES.SERVER_ERROR)
                        }
                    })
                }
            })
        })
    }

    handleCreateActivity(activity) {
        return new Promise((resolve, reject) => {
            debug('inside create')
            const toActorName = extractNameFromId(activity.object.object ? activity.object.object : activity.object.to)
            debug(`name = ${toActorName}@${this.domain}`)

            this.db.get('select "inbox", "inboxPage" from "collections" where "collectionowner" = $name', {
                $name: `${toActorName}@${this.domain}`
            }, (err, result) => {
                let inbox, inboxPage
                if (result === undefined) {
                    debug(`No inbox for username = ${toActorName}.`)
                    return CODES.NOT_FOUND
                } else {
                    inbox = JSON.parse(new String(result.inbox))
                    inboxPage = JSON.parse(new String(result.inboxPage))
                    debug('Activity count before update: ' + inbox.totalItems)
                }

                inboxPage.orderedItems.push(activity)
                inboxPage.totalItems += 1
                inbox.totalItems += 1
                let inboxString = JSON.stringify(inbox)
                let inboxPageString = JSON.stringify(inboxPage)

                // update inbox collection
                this.db.run('update "collections" set "inbox"=$inbox, "inboxPage"=$inboxPage where "collectionowner" = $name', {
                    $name: `${toActorName}@${this.domain}`,
                    $inbox: inboxString,
                    $inboxPage: inboxPageString
                }, (err, result) => {
                    if (!err) {
                        //sendAcceptMessage(req.body, name, domain, req, res, targetDomain)
                        debug('Add Activity to inbox!', err, result)
                        resolve(CODES.OK)
                    } else {
                        reject(CODES.SERVER_ERROR)
                    }
                })
            })
        })
    }

    handleDeleteActivity(activity) {
        debug('inside delete')

    }
}
