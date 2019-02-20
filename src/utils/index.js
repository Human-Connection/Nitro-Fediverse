import crypto from 'crypto'
import { signAndSend } from './signing'
import as from 'activitystrea.ms'
import ap from '../index'
const debug = require('debug')('ea:utils')
const MongoClient = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017';
let db = null
MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
  db = client.db('activitypub')
})
export function extractNameFromId(uri) {
    const urlObject = new URL(uri)
    const pathname = urlObject.pathname
    const splitted = pathname.split('/')

    return splitted[splitted.indexOf('users') + 1]
}

export function extractIdFromActivityId(uri) {
  const urlObject = new URL(uri)
  const pathname = urlObject.pathname
  const splitted = pathname.split('/')

  return splitted[splitted.indexOf('status') + 1]
}

export function constructIdFromName(name, fromDomain = ap.domain) {
    return `https://${fromDomain}/users/${name}`
}

export function extractDomainFromUrl(url) {
    return new URL(url).hostname;
}

export async function saveActorId(actorId) {
  const name = extractNameFromId(actorId)
  const collection = db.collection('actorIds')
  // TODO first check for existence before insert (maybe updateOne)
  const obj = {}
  obj[name] = actorId
  return await collection.insertOne(obj)
}

export async function getActorIdByName(name) {
  const obj = {}
  debug(`name = ${name}`)
  obj[name] = { $exists: true }
  const result = await db.collection('actorIds').find(obj).next()
  debug(`result = ${JSON.stringify(result, null, 2)}`)
  return result[name]
}

export function sendCollection(collectionName, req, res) {
  const name = req.params.name;
  const id = constructIdFromName(name)

  switch (collectionName) {
    case 'followers':
      attachThenCatch(req.app.get('ap').getFollowersCollection(id), res)
      break

    case 'followersPage':
      attachThenCatch(req.app.get('ap').getFollowersCollectionPage(id), res)
      break

    case 'following':
      attachThenCatch(req.app.get('ap').getFollowingCollection(id), res)
      break

    case 'followingPage':
      attachThenCatch(req.app.get('ap').getFollowingCollectionPage(id), res)
      break

    case 'outbox':
      attachThenCatch(req.app.get('ap').getOutboxCollection(id), res)
      break

    case 'outboxPage':
      attachThenCatch(req.app.get('ap').getOutboxCollectionPage(id), res)
      break

    default:
      res.status(500).end();
  }
}

function attachThenCatch(promise, res) {
  return promise
    .then((collection)=>{
      res.status(200).contentType('application/activity+json').send(collection)
    })
    .catch(()=>{
      debug(`error getting a Collection`)
      res.status(500).end();
    })
}

export function createActor(name, pubkey) {
    return {
        '@context': [
            'https://www.w3.org/ns/activitystreams',
            'https://w3id.org/security/v1'
        ],
        'id': `https://${ap.domain}/users/${name}`,
        'type': 'Person',
        'preferredUsername': `${name}`,
        'name': `${name}`,
        'following': `https://${ap.domain}/users/${name}/following`,
        'followers': `https://${ap.domain}/users/${name}/followers`,
        'inbox': `https://${ap.domain}/users/${name}/inbox`,
        'outbox': `https://${ap.domain}/users/${name}/outbox`,
        'url': `https://${ap.domain}/@${name}`,
        'endpoints': {
            'sharedInbox': `https://${ap.domain}/inbox`
        },
        'publicKey': {
            'id': `https://${ap.domain}/users/${name}#main-key`,
            'owner': `https://${ap.domain}/users/${name}`,
            'publicKeyPem': pubkey
        }
    }
}

export function createWebFinger(name) {
    return {
        'subject': `acct:${name}@${ap.domain}`,
        'links': [
            {
                'rel': 'self',
                'type': 'application/activity+json',
                'href': `https://${ap.domain}/users/${name}`
            }
        ]
    }
}

export function createOrderedCollection(name, collectionName) {
    return {
        "@context": "https://www.w3.org/ns/activitystreams",
        "id": `https://${ap.domain}/users/${name}/${collectionName}`,
        "summary": `${name}s ${collectionName} collection`,
        "type": "OrderedCollection",
        "first": `https://${ap.domain}/users/${name}/${collectionName}?page=true`,
        "totalItems": 0
    }
}

export function createOrderedCollectionPage(name, collectionName) {
    return {
        "@context": "https://www.w3.org/ns/activitystreams",
        "id": `https://${ap.domain}/users/${name}/${collectionName}?page=true`,
        "summary": `${name}s ${collectionName} collection`,
        "type": "OrderedCollectionPage",
        "totalItems": 0,
        "partOf": `https://${ap.domain}/users/${name}/${collectionName}`,
        "orderedItems": []
    }
}

export function createNoteActivity(text, name, id, published) {
    const createUuid = crypto.randomBytes(16).toString('hex')

    return {
        '@context': 'https://www.w3.org/ns/activitystreams',
        'id': `https://${ap.domain}/users/${name}/status/${createUuid}`,
        'type': 'Create',
        'actor': `https://${ap.domain}/users/${name}`,
        'object': {
            'id': `https://${ap.domain}/users/${name}/status/${id}`,
            'type': 'Note',
            'published': published,
            'attributedTo': `https://${ap.domain}/users/${name}`,
            'content': text,
            'to': 'https://www.w3.org/ns/activitystreams#Public'
        }
    }
}

export function createArticleActivity(text, name, id, published) {
  const createUuid = crypto.randomBytes(16).toString('hex')

  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id': `https://${ap.domain}/users/${name}/status/${createUuid}`,
    'type': 'Create',
    'actor': `https://${ap.domain}/users/${name}`,
    'object': {
      'id': `https://${ap.domain}/users/${name}/status/${id}`,
      'type': 'Article',
      'published': published,
      'attributedTo': `https://${ap.domain}/users/${name}`,
      'content': text,
      'to': 'https://www.w3.org/ns/activitystreams#Public'
    }
  }
}

export function sendAcceptActivity(theBody, name, targetDomain, url) {
    as.accept()
        .id(`https://${ap.domain}/users/${name}/status/` + crypto.randomBytes(16).toString('hex'))
        .actor(`https://${ap.domain}/users/${name}`)
        .object(theBody)
        .prettyWrite((err, doc) => {
            if (!err) {
                return signAndSend(doc, name, targetDomain, url)
            } else {
                debug(`error serializing Accept object: ${err}`)
                throw new Error(`error serializing Accept object`)
            }
        })
}

export function sendRejectActivity(theBody, name, targetDomain, url) {
    as.reject()
        .id(`https://${ap.domain}/users/${name}/status/` + crypto.randomBytes(16).toString('hex'))
        .actor(`https://${ap.domain}/users/${name}`)
        .object(theBody)
        .prettyWrite((err, doc) => {
            if (!err) {
                return signAndSend(doc, name, targetDomain, url)
            } else {
                debug(`error serializing Accept object: ${err}`)
                throw new Error(`error serializing Accept object`)
            }
        })
}

export function throwErrorIfGraphQLErrorOccurred(result) {
  if (result.error && (result.error.message || result.error.errors)) {
    throw new Error(`${result.error.message ? result.error.message : result.error.errors[0].message}`)
  }
}
