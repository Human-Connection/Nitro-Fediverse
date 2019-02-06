// features/support/world.js
const { setWorldConstructor } = require('cucumber')
const request = require('request')
const debug = require('debug')('hc-ap:world')

class CustomWorld {
  constructor() {
    this.lastResponse = null
    this.lastContentType = null
  }
  get(route) {
    return new Promise((resolve, reject) => {
      request(`http://localhost:4100/${route.replace(/^\/+/, '')}`, function (error, response, body) {
        if (!error) {
          debug(`response = ${response.headers['content-type']}`)
          resolve({ lastResponse: JSON.parse(body), lastContentType: response.headers['content-type']})
        } else {
          reject({})
        }
      })
    })
  }
}

setWorldConstructor(CustomWorld)
