'use strict'
import express from 'express'
import crypto from 'crypto'
import generateRSAKeypair from 'generate-rsa-keypair'
import { createWebfinger, createActor } from '../utils'

const router = express.Router()

router.post('/create', function (req, res) {
  // pass in a name for an account, if the account doesn't exist, create it!
  const account = req.body.account
  if (account === undefined) {
    return res.status(400).json({ msg: 'Bad request. Please make sure "account" is a property in the POST body.' })
  }
  let db = req.app.get('db')
  let domain = req.app.get('domain')
  // create keypair
  var pair = generateRSAKeypair()
  let actorRecord = createActor(account, pair.public)
  let webfingerRecord = createWebfinger(account)
  const apikey = crypto.randomBytes(16).toString('hex')
  db.run('insert or replace into accounts(name, actor, apikey, pubkey, privkey, webfinger) values($name, $actor, $apikey, $pubkey, $privkey, $webfinger)', {
    $name: `${account}@${domain}`,
    $apikey: apikey,
    $pubkey: pair.public,
    $privkey: pair.private,
    $actor: JSON.stringify(actorRecord),
    $webfinger: JSON.stringify(webfingerRecord)
  }, () => {
    res.status(200).json({ msg: 'ok', apikey })
  })
})

module.exports = router
