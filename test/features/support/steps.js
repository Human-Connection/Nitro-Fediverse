// features/support/steps.js
const { Given, When, Then, AfterAll} = require('cucumber')
const { expect } = require('chai')
const client = require('../../../src/apollo-client')
const gql = require('graphql-tag')
const debug = require('debug')('ea:test:step')

const fediverseUrl = 'http://localhost:4100'

let currentUserIds = []

async function createUser(slug) {
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
  console.log(`\n\nuser created with id = ${res.data.CreateUser.id}`)
}

AfterAll('', function () {
  console.log('All the tests are done! Deleting Users --> ' + currentUserIds)
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
  const hashes = dataTable.hashes()
  hashes.forEach(async (user) => {
    await createUser(user.Slug)
  })
})

When('I send a GET request to {string}', async function (pathname) {
  const response = await this.get(pathname)
  this.lastResponse = response.lastResponse
  this.lastContentType = response.lastContentType
})

Then('I receive the following json:', function (docString) {
  expect(JSON.parse(docString)).to.eql(JSON.parse(this.lastResponse))
})

Then('I expect the Content-Type to be:', function (contentType) {
  expect(contentType).to.equal(this.lastContentType)
})

When('I send an activity to {string}', async function (inboxUrl, activity) {
  debug(`inboxUrl = ${inboxUrl}`)
  debug(`activity = ${activity}`)
  this.lastInboxUrl = inboxUrl
  this.lastActivity = activity
  const response = await this.post(inboxUrl, activity)
  this.statusCode = response.statusCode
  this.lastResponse = response.lastResponse
})

Then('the status code is {int}', function (statusCode) {
  debug(`lastResponse = ${this.lastResponse}`)
  expect(statusCode).to.equal(this.statusCode)
})

Then('the activity is added to the {string} collection', async function (collectionName) {
  const response = await this.get(this.lastInboxUrl.replace('inbox', collectionName) + '?page=true')
  debug(`lastResponse = ${response.lastResponse}`)
  debug(`orderedItems = ${JSON.parse(response.lastResponse).orderedItems}`)
  expect(JSON.parse(response.lastResponse).orderedItems).to.include(JSON.parse(this.lastActivity).object)
})

Then('the follower is added to the followers collection', async function (follower) {
  const response = await this.get(this.lastInboxUrl.replace('inbox', 'followers') + '?page=true')
  const responseObject = JSON.parse(response.lastResponse)
  expect(responseObject.orderedItems).to.include(follower)
})

Then('the activity is added to the users inbox collection', async function () {

})

Then('the response body looks like:', function (activity) {
  const expected = JSON.parse(activity)
  //const actual = JSON.parse(this.lastResponse)
  delete expected.id
  //delete actual.id
  expect(JSON.stringify(expected, null, 2)).to.equal(JSON.stringify(actual, null, 2))
})
