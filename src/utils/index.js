const crypto = require('crypto')
const { signAndSend } = require('./signing')
const as = require('activitystrea.ms')

module.exports = {
    parseJSON: (text) => {
        try {
            return JSON.parse(text)
        } catch(e) {
            return null
        }
    },
    extractNameFromUrl: (url) => {
        const urlObject = new URL(url)
        const pathname = urlObject.pathname
        const splitted = pathname.split('/')

        return splitted[splitted.length - 1]
    },
    extractDomainFromUrl(url) {
        return new URL(url).hostname;
    },
    createActor(name, domain, pubkey) {
        return {
            '@context': [
                'https://www.w3.org/ns/activitystreams',
                'https://w3id.org/security/v1'
            ],
            'id': `https://${domain}/users/${name}`,
            'type': 'Person',
            'preferredUsername': `${name}`,
            'name': `${name}`,
            'following': `https://${domain}/users/${name}/following`,
            'followers': `https://${domain}/users/${name}/followers`,
            'inbox': `https://${domain}/users/${name}/inbox`,
            'outbox': `https://${domain}/users/${name}/outbox`,
            'url': `https://${domain}/@${name}`,
            'endpoints': {
                'sharedInbox': `https://${domain}/inbox`
            },
            'publicKey': {
                'id': `https://${domain}/users/${name}/keys/1`,
                'owner': `https://${domain}/users/${name}`,
                'publicKeyPem': pubkey
            }
        }
    },
    createWebFinger(name, domain) {
        return {
            'subject': `acct:${name}@${domain}`,
            'links': [
                {
                    'rel': 'self',
                    'type': 'application/activity+json',
                    'href': `http://${domain}/users/${name}`
                }
            ]
        }
    },
    createOrderedCollection(name, domain, collectionName) {
        return {
            "@context": "https://www.w3.org/ns/activitystreams",
            "id": `https://${domain}/users/${name}/${collectionName}`,
            "summary": `${name}s ${collectionName} collection`,
            "type": "OrderedCollection",
            "totalItems": 0,
            "orderedItems": []
        }
    },
    createNoteActivity(text, name, domain) {
        const createUuid = crypto.randomBytes(16).toString('hex')
        const noteUuid = crypto.randomBytes(16).toString('hex')
        let d = new Date()

        return {
            '@context': 'https://www.w3.org/ns/activitystreams',

            'id': `https://${domain}/${createUuid}`,
            'type': 'Create',
            'actor': `https://${domain}/users/${name}`,

            'object': {
                'id': `https://${domain}/${noteUuid}`,
                'type': 'Note',
                'published': d.toISOString(),
                'attributedTo': `https://${domain}/users/${name}`,
                'content': text,
                'to': 'https://www.w3.org/ns/activitystreams#Public'
            }
        }
    },
    sendAcceptActivity(theBody, name, domain, targetDomain, url) {
        as.accept()
            .id(crypto.randomBytes(16).toString('hex'))
            .actor(`https://${domain}/users/${name}`)
            .object(theBody)
            .prettyWrite((err, doc) => {
                if (!err) {
                    return signAndSend(doc, name, domain, targetDomain, url)
                } else {
                    debug(`error serializing Accept object: ${err}`)
                }
            })
    },
    sendRejectActivity(theBody, name, domain, targetDomain, url) {
        as.reject()
            .id(crypto.randomBytes(16).toString('hex'))
            .actor(`https://${domain}/users/${name}`)
            .object(theBody)
            .prettyWrite((err, doc) => {
                if (!err) {
                    return signAndSend(doc, name, domain, targetDomain, url)
                } else {
                    debug(`error serializing Accept object: ${err}`)
                }
            })
    }
}
