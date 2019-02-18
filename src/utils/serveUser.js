const debug = require('debug')('ea')
import client from '../apollo-client'
import { createActor } from '../utils'
import gql from 'graphql-tag'

module.exports = async function(req, res, next) {
    let name = req.params.name

    if (name.startsWith('@')) {
        name = name.slice(1)
    }

    debug(`name = ${name}`)
    const result = await client.query({
        query: gql`
            query {
                User(slug: "${name}") {
                    publicKey
                }
            }
        `
    })

    if (result.data && Array.isArray(result.data.User) && result.data.User.length > 0) {
        const publicKey = result.data.User[0].publicKey
        const actor = createActor(name, publicKey)

        if(req.accepts('text/html')) {
            // TODO show user's profile page instead of the actor object
            /*const outbox = JSON.parse(result.outbox)
            const posts = outbox.orderedItems.filter((el) => { return el.object.type === 'Note'})
            const actor = result.actor
            debug(posts)*/
            //res.render('user', { user: actor, posts: JSON.stringify(posts)})
            res.contentType('application/activity+json').send(actor)
        } else if (req.accepts(['application/activity+json', 'application/ld+json', 'application/json'])) {
            res.contentType('application/activity+json').send(actor)
        }
    } else {
        debug(`error getting publicKey for actor ${name}`)
        next()
    }
}
