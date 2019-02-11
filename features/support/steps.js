// features/support/steps.js
const { Given, When, Then } = require('cucumber')
const { expect } = require('chai')
const client = require('../../apollo-client')
const gql = require('graphql-tag')

const fediverseUrl = 'http://localhost:4100'

async function createUser(slug) {
  const res = await client.mutate({
    mutation: gql`
      mutation {
        CreateUser(name: "${slug}", password: "mysecretpw", email: "${slug}@localhost.local", slug: "${slug}") {
          slug
        }
      }
    `
  })

  expect(res.data.CreateUser.slug).to.equal(slug)
}

Given('our own server runs at {string}', function (string) {
  // just documenation
})

Given('we have the following users in our database:', function (dataTable) {
  dataTable.hashes().forEach(async (user) => {
    await createUser(user.Slug)
  })
})

When('I send a GET request to {string}', async function (pathname) {
  const response = await this.get(pathname)
  this.lastResponse = response.lastResponse
  this.lastContentType = response.lastContentType
})

Then('I receive the following json:', function (docString) {
  expect(JSON.parse(docString)).to.eql(this.lastResponse)
})

Then('I expect the Content-Type to be:', function (contentType) {
  expect(contentType).to.equal(this.lastContentType)
})

When('I send an activity to {string}', async function (inboxUrl, activity) {
  const response = await this.post(inboxUrl, activity)
  this.statusCode = response.statusCode
})

Then('the status code is {int}', function (statusCode) {
  expect(statusCode).to.equal(this.statusCode)
})

Then('the activity is added to the users inbox collection', function () {

})

Then('the response body looks like:', function (activity) {

})
