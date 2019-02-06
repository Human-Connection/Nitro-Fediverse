// features/support/steps.js
const { Given, When, Then } = require('cucumber')
const { expect } = require('chai')


const fediverseUrl = 'http://localhost:4100'

Given('our own server runs at {string}', function (string) {
  // just documenation
});

Given('we have the following users in our database:', function (dataTable) {
  // TODO: connect with neo4j and create users based on dataTable
  // dataTable.hashes().forEach((user) => {
  //   factory.create(user)
  // })
});

When('I send a GET request to {string}', async function (url) {
  const res = await this.get(url)
  this.lastResponse = await res.json()
});

Then('I receive the following', function (docString) {
  expect(this.lastResponse).to.eql(JSON.parse(docString))
});
