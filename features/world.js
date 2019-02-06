// features/support/world.js
const { setWorldConstructor } = require('cucumber')
const fetch = require('node-fetch');

class CustomWorld {
  constructor() {
    this.lastResponse = null
  }
  get(route) {
    return fetch(`http://localhost:4100/${route.replace(/^\/+/, '')}`)
  }
}

setWorldConstructor(CustomWorld)
