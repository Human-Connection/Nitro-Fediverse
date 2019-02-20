// features/support/steps.js
const { Given, When, Then, AfterAll} = require('cucumber')
const { expect } = require('chai')
const client = require('../../../src/apollo-client')
const gql = require('graphql-tag')
const debug = require('debug')('ea:test:steps')

let currentUserIds = []

async function createUser(slug) {
  debug(`creating user ${slug}`)
  const res = await client.mutate({
    mutation: gql`
      mutation {
        CreateUser(name: "${slug}", password: "mysecretpw", email: "${slug}@localhost.local", slug: "${slug}") {
          slug
          id
        }
      }
    `
  })
  expect(res.data.CreateUser.slug).to.equal(slug)
  currentUserIds.push(res.data.CreateUser.id)
  debug(`\nuser created with id = ${res.data.CreateUser.id}`)
}

AfterAll('', function () {
  debug('All the tests are done! Deleting Users --> ' + currentUserIds)
  currentUserIds.forEach(async (id) => {
    await client.mutate({
      mutation: gql`
          mutation {
              DeleteUser(id: "${id}") {
                  name
              }
          }
      `
    })
  })

  currentUserIds = []
})

Given('our own server runs at {string}', function (string) {
  // just documenation
})

Given('we have the following users in our database:', function (dataTable) {
  return new Promise((resolve, reject) => {
    Promise.all(dataTable.hashes().map((user) => {
      return createUser(user.Slug)
    })).then(resolve).catch(reject)
  })
})

When('I send a GET request to {string}', async function (pathname) {
  const response = await this.get(pathname)
  this.lastContentType = response.lastContentType

  this.lastResponses.push(response.lastResponse)
  this.statusCode = response.statusCode
  return
})

When('I send a POST request with the following activity to {string}:', async function (inboxUrl, activity) {
  debug(`inboxUrl = ${inboxUrl}`)
  debug(`activity = ${activity}`)
  this.lastInboxUrl = inboxUrl
  this.lastActivity = activity
  const response = await this.post(inboxUrl, activity)

  this.lastResponses.push(response.lastResponse)
  this.statusCode = response.statusCode
})

Then('I receive the following json:', function (docString) {
  debug(`this = ${JSON.stringify(this, null, 2)}`)
  expect(JSON.parse(docString)).to.eql(JSON.parse(this.lastResponses.shift()))
})

Then('I expect the Content-Type to be {string}', function (contentType) {
  expect(contentType).to.equal(this.lastContentType)
})

Then('I expect the status code to be {int}', function (statusCode) {
  expect(statusCode).to.equal(this.statusCode)
})

Then('the activity is added to the {string} collection', async function (collectionName) {
  const response = await this.get(this.lastInboxUrl.replace('inbox', collectionName) + '?page=true')
  debug(`orderedItems = ${JSON.parse(response.lastResponse).orderedItems}`)
  expect(JSON.parse(response.lastResponse).orderedItems).to.include(JSON.parse(this.lastActivity).object)
})

Then('the follower is added to the followers collection', async function (follower) {
  const response = await this.get(this.lastInboxUrl.replace('inbox', 'followers') + '?page=true')
  const responseObject = JSON.parse(response.lastResponse)
  expect(responseObject.orderedItems).to.include(follower)
})

Then('the follower is removed from the followers collection', async function (follower) {
  const response = await this.get(this.lastInboxUrl.replace('inbox', 'followers') + '?page=true')
  const responseObject = JSON.parse(response.lastResponse)
  expect(responseObject.orderedItems).to.not.include(follower)
})

Then('the activity is added to the users inbox collection', async function () {

})

Then('the post with id {string} to be created', async function (id) {
  const result = await client.query({
    query: gql`
      query {
          Post(id: "${id}") {
              name
          }
      }
    `
  })

  expect(result.data.Post).to.be.an('array').that.is.not.empty
})
