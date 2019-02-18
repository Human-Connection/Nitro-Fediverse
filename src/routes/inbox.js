'use strict'
import express from 'express'
const debug = require('debug')('ea:inbox')

const router = express.Router()

// Shared Inbox endpoint (federated Server)
// For now its only able to handle Note Activities!!
router.post('/', async function (req, res, next) {
  debug(`Content-Type = ${req.get('Content-Type')}`)
  debug(`body = ${JSON.stringify(req.body, null, 2)}`)
  debug(`Request headers = ${JSON.stringify(req.headers, null, 2)}`)

  switch (req.body.type) {
    case 'Create':
      await await req.app.get('ap').handleCreateActivity(req.body).catch(next)
      break
    case 'Undo':
      await await req.app.get('ap').handleUndoActivity(req.body).catch(next)
      break
    case 'Follow':
      debug(`handleFollow`)
      await req.app.get('ap').handleFollowActivity(req.body)
      debug(`handledFollow`)
      break
    case 'Delete':
      await await req.app.get('ap').handleDeleteActivity(req.body).catch(next)
      break
    case 'Update':

    case 'Accept':

    case 'Reject':

    case 'Add':

    case 'Remove':

    case 'Like':

    case 'Announce':
      debug('else!!')
      debug(JSON.stringify(req.body, null, 2))
  }

  res.status(200).end()
})

module.exports = router
