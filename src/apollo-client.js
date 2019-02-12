const { ApolloClient } = require('apollo-client')
const { InMemoryCache } = require('apollo-cache-inmemory')
const { createHttpLink } = require('apollo-link-http')
const dotenv = require('dotenv')
const fetch = require('node-fetch')

dotenv.config()

const link = new createHttpLink({ uri: process.env.GRAPHQL_URI ? process.env.GRAPHQL_URI : 'http://localhost:4000', fetch: fetch})
const cache = new InMemoryCache()

const client = new ApolloClient({
    link,
    cache
})

module.exports = client
