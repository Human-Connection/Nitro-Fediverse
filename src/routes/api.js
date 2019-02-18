'use strict'

import express from 'express'
import { createNoteActivity } from '../utils'
import { signAndSend } from '../utils/signing'
import client from '../apollo-client'
import gql from 'graphql-tag'

const router = express.Router()

router.post('/sendMessage', async function (req, res) {
  let domain = req.app.get('domain')
  let acct = req.body.acct
  let apikey = req.body.apikey
  let message = req.body.message
  // check to see if your API key matches
  // TODO Token authentication
  await sendCreateMessage(message, acct, domain, req, res)
})

async function sendCreateMessage(text, name, domain, req, res) {
  let message = createNoteActivity(text, name)

  const result = await client.query({
    query: gql` 
      query {
        User(slug: "${name}") {
            followedBy
        }
      }
      `
  })

  let followers = result.data.User[0].followedBy
  if (followers === null) {
    res.status(400).json({msg: `No followers for account ${name}@${domain}`})
  } else {
    for (let follower of followers) {
      let inbox = follower+'/inbox'
      let myURL = new URL(follower)
      let targetDomain = myURL.hostname
      signAndSend(message, name, domain, req, res, targetDomain, inbox)
    }
    res.status(200).json({msg: 'ok'})
  }
}

module.exports = router
