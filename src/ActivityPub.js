import {
  extractNameFromId,
  extractDomainFromUrl,
  signAndSend
} from './utils'
import {
  isPublicAddressed,
  sendAcceptActivity,
  sendRejectActivity
} from './utils/activity'
import cluster from 'cluster'
import os from 'os'
import request from 'request'
import as from 'activitystrea.ms'
import NitroDataSource from './NitroDataSource'
import router from './routes'
import dotenv from 'dotenv'
import express from 'express'
import http from 'http'
import Collections from './Collections'
const debug = require('debug')('ea')
const numCPUs = os.cpus().length

let activityPub = null

export { activityPub }

export default class ActivityPub {
  constructor (domain, port) {
    if (domain === 'localhost') { this.domain = `${domain}:${port}` } else { this.domain = domain }
    this.port = port
    this.dataSource = new NitroDataSource(this.domain)
    this.collections = new Collections(this.dataSource)
  }
  static init () {
    if (!activityPub) {
      dotenv.config()
      const port = process.env.ACTIVITYPUB_PORT
      activityPub = new ActivityPub(process.env.ACTIVITYPUB_DOMAIN || 'localhost', port || 4100)
      // standalone clustered ActivityPub service
      // TODO make sure cluster is placed right. Maybe need to be placed above the if branch
      if (cluster.isMaster) {
        debug(`master with pid = ${process.pid} is running`)
        for (let i = 0; i < numCPUs; i++) {
          cluster.fork()
        }
        cluster.on('exit', (worker, code, signal) => {
          debug(`worker ${worker.process.pid} died with code ${code} and signal ${signal}`)
        })
      } else {
        const app = express()
        app.set('ap', activityPub)
        app.use(router)
        http.createServer(app).listen(port, () => {
          debug(`ActivityPub express service listening on port ${port}`)
        })
      }
    } else {
      debug('ActivityPub middleware already added to the express service')
    }
  }

  handleFollowActivity (activity) {
    debug(`inside FOLLOW ${activity.actor}`)
    let toActorName = extractNameFromId(activity.object)
    let fromDomain = extractDomainFromUrl(activity.actor)
    const dataSource = this.dataSource

    return new Promise((resolve, reject) => {
      request({
        url: activity.actor,
        headers: {
          'Accept': 'application/activity+json'
        }
      }, async (err, response, toActorObject) => {
        if (err) return reject(err)
        debug(`name = ${toActorName}@${this.domain}`)
        // save shared inbox
        if (toActorObject.endpoints && toActorObject.endpoints['sharedInbox']) {
          await this.dataSource.addSharedInboxEndpoint(toActorObject.endpoints.sharedInbox)
        }

        let followersCollectionPage = await this.dataSource.getFollowersCollectionPage(activity.object)

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
        debug(`toActorObject = ${toActorObject}`)
        toActorObject = typeof toActorObject !== 'object' ? JSON.parse(toActorObject) : toActorObject
        debug(`followers = ${JSON.stringify(followersCollectionPage.orderedItems, null, 2)}`)
        debug(`inbox = ${toActorObject.inbox}`)
        debug(`outbox = ${toActorObject.outbox}`)
        debug(`followers = ${toActorObject.followers}`)
        debug(`following = ${toActorObject.following}`)

        try {
          await dataSource.saveFollowersCollectionPage(followersCollectionPage)
          debug('follow activity saved')
          resolve(sendAcceptActivity(followActivity, toActorName, fromDomain, toActorObject.inbox))
        } catch (e) {
          debug('followers update error!', e)
          resolve(sendRejectActivity(followActivity, toActorName, fromDomain, toActorObject.inbox))
        }
      })
    })
  }

  handleUndoActivity (activity) {
    debug('inside UNDO')
    switch (activity.object.type) {
    case 'Follow':
      const followActivity = activity.object
      return this.dataSource.undoFollowActivity(followActivity.actor, followActivity.object)
    case 'Like':
      return this.dataSource.deleteShouted(activity)
    default:
    }
  }

  handleCreateActivity (activity) {
    debug('inside create')
    switch (activity.object.type) {
    case 'Article':
    case 'Note':
      const articleObject = activity.object
      if (articleObject.inReplyTo) {
        return this.dataSource.createComment(activity)
      } else {
        return this.dataSource.createPost(activity)
      }
    default:
    }
  }

  handleDeleteActivity (activity) {
    debug('inside delete')
    switch (activity.object.type) {
    case 'Article':
    case 'Note':
      return this.dataSource.deletePost(activity)
    default:
    }
  }

  handleUpdateActivity (activity) {
    debug('inside update')
    switch (activity.object.type) {
    case 'Note':
    case 'Article':
      return this.dataSource.updatePost(activity)
    default:
    }
  }

  handleLikeActivity (activity) {
    // TODO differ if activity is an Article/Note/etc.
    return this.dataSource.createShouted(activity)
  }

  handleDislikeActivity (activity) {
    // TODO differ if activity is an Article/Note/etc.
    return this.dataSource.deleteShouted(activity)
  }

  async handleAcceptActivity (activity) {
    debug('inside accept')
    switch (activity.object.type) {
    case 'Follow':
      const followObject = activity.object
      const followingCollectionPage = await this.collections.getFollowingCollectionPage(followObject.actor)
      followingCollectionPage.orderedItems.push(followObject.object)
      await this.dataSource.saveFollowingCollectionPage(followingCollectionPage)
    }
  }

  getActorObject (url) {
    return new Promise((resolve, reject) => {
      request({
        url: url,
        headers: {
          'Accept': 'application/json'
        }
      }, (err, response, body) => {
        if (err) {
          reject(err)
        }
        resolve(JSON.parse(body))
      })
    })
  }

  async sendActivity (activity) {
    delete activity.send
    const fromName = extractNameFromId(activity.actor)
    if (Array.isArray(activity.to) && isPublicAddressed(activity)) {
      const sharedInboxEndpoints = await this.dataSource.getSharedInboxEndpoints()
      // serve shared inbox endpoints
      sharedInboxEndpoints.map((el) => {
        return this.trySend(activity, fromName, new URL(el).host, el)
      })
      activity.to = activity.to.filter((el) => {
        return !(isPublicAddressed({ to: el }))
      })
      // serve the rest
      activity.to.map(async (el) => {
        const actorObject = await this.getActorObject(el)
        return this.trySend(activity, fromName, new URL(el).host, actorObject.inbox)
      })
    } else if (typeof activity.to === 'string') {
      const actorObject = await this.getActorObject(activity.to)
      return this.trySend(activity, fromName, new URL(activity.to).host, actorObject.inbox)
    } else if (Array.isArray(activity.to)) {
      activity.to.map(async (el) => {
        const actorObject = await this.getActorObject(el)
        return this.trySend(activity, fromName, new URL(el).host, actorObject.inbox)
      })
    }
  }

  async trySend (activity, fromName, host, url, tries = 5) {
    try {
      return await signAndSend(activity, fromName, host, url)
    } catch (e) {
      if (tries > 0) {
        setTimeout(function () {
          return this.trySend(activity, fromName, host, url, --tries)
        }, 20000)
      }
    }
  }
}
