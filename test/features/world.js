// features/support/world.js
const { setWorldConstructor } = require('cucumber')
const request = require('request')
const debug = require('debug')('hc-ap:world')

class CustomWorld {
  constructor() {
    // webfinger.feature
    this.lastResponse = null
    this.lastContentType = null
    // activity-note.feature
    this.statusCode = null
  }
  get(pathname) {
    return new Promise((resolve, reject) => {
      request(`http://localhost:4100/${this.replaceSlashes(pathname)}`, function (error, response, body) {
        if (!error) {
          debug(`get response = ${response.headers['content-type']}`)
          resolve({ lastResponse: JSON.parse(body), lastContentType: response.headers['content-type'], statusCode: response.statusCode})
        } else {
          reject({})
        }
      })
    })
  }

  replaceSlashes(pathname) {
    return pathname.replace(/^\/+/, '');
  }

  post(pathname, activity) {
    return new Promise((resolve, reject) => {
      request({
        url: `http://localhost:4100/${this.replaceSlashes(pathname)}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/activity+json'
        },
        body: activity
      }, function (error, response, body) {
        if (!error) {
          debug(`post response = ${response.headers['content-type']}`)
          resolve({ lastResponse: JSON.parse(body), lastContentType: response.headers['content-type'], statusCode: response.statusCode})
        } else {
          reject({})
        }
      })
    })
  }
}

setWorldConstructor(CustomWorld)
