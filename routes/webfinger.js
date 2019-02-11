'use strict'
const express = require('express'),
      router = express.Router(),
      client = require('../apollo-client'),
      { createWebFinger } = require('../utils'),
      gql = require('graphql-tag')

router.get('/', async function (req, res) {
  const resource = req.query.resource;
  if (!resource || !resource.includes('acct:')) {
    return res.status(400).send('Bad request. Please make sure "acct:USER@DOMAIN" is what you are sending as the "resource" query parameter.');
  } else {
    const nameAndDomain = resource.replace('acct:','');
    const name = nameAndDomain.split('@')[0];

    const result = await client.query({
      query: gql`
        query {
          User(slug: "${name}") {
            slug
          }
        }
      `
    })

    if (result.data && result.data.User.length > 0) {
      const webFinger = createWebFinger(name, req.app.get('domain'));
      return res.contentType('application/jrd+json').json(webFinger);
    } else {
      return res.status(404).json({ error: `No record found for ${nameAndDomain}.` });
    }
  }
});

module.exports = router;
