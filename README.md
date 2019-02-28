# Nitro-Fediverse
[![Build Status](https://travis-ci.com/Human-Connection/Nitro-Fediverse.svg?branch=master)](https://travis-ci.com/Human-Connection/Nitro-Fediverse)

This repository is maintained by an active community.
We have regular meetings, run pair-programmings and tutorials in our [online learner community at Agile Ventures](https://www.agileventures.org/projects/human-connection).
[Join our Chat here](https://discordapp.com/invite/6ub73U3) and watch our [latest meetings or pair-programmings](https://www.youtube.com/playlist?list=PLH_dEBFTpMp78-QwtsRwVL7l-1kRdhR0P).


The ActivityPub service has the following abilities:
* receiving __*Article*__ and __*Note*__ Objects at a users inbox
* receiving __*Like*__ and __*Follow*__ Activities at a users inbox
* receiving __*Undo*__ and __*Delete*__ Activities for Articles and Notes at a users inbox
* serving __*Webfinger*__ records and __*Actor*__ Objects
* serving __*Followers*__, __*Following*__ and __*Outbox*__ collections

**->** *It is not differed between a "users" inbox and a "sharedInbox" by invoking service logic!*

## Explanation
**->** This explanation assumes you are using the __*NitroDataSource*__!
  
### Like and Follow

When a __*Like*__ activity is received, it get translated into a GraphQL query to shout a post or up vote a comment.  
The __*Follow*__ activity first creates a user for the sending actor, when no user exists, and then adds a *followedBy* relationship to indicate friendship 

### Article and Note

__*Article's*__ and __*Note's*__ both get translated into a `Post` node. The wrapped create activity ID's are saved along the posts to recreate the activity for serving the outbox etc.

### Undo and Delete

When receiving an __*Undo*__ activity with a follow object, then the follow relationship is removed and with this the follow activity undone.
  
When receiving a __*Delete*__ activity with a Note or Article Object, the `Post` node will be deleted.

### Serving Webfinger and Actor Object

In the `webfinger.feature` you can see how the Webfinger and also the Actor Object response looks like

### Serving Collections

Taking a look into `collections.feature` will show you how, for now, empty collections look like


## Start contributing

Clone the repository:
```sh
git clone https://github.com/Human-Connection/Nitro-Fediverse.git
```
Switch in the folder
```sh
cd Nitro-Fediverse
```

## Installation and Usage without Docker

Make sure you have [node](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/en/) installed:
```sh
$ node --version
v10.15.0
$ yarn --version
1.12.3
```

Run:
```sh
$ cp .env.template .env
```
And change `.env` according to your setup.

Install dependencies:
```sh
yarn install
```

Run:
```
yarn run server
```

Application is running on [localhost:4100](http://localhost:4100/)



## Installation and Usage with Docker

Make sure you have [docker](https://www.docker.com/) and [docker-compose](https://docs.docker.com/compose/)
installed:
```sh
$ docker --version
Docker version 18.09.1-ce, build 4c52b901c6
$ docker-compose --version
docker-compose version 1.23.2, build unknown
```

Start and build containers:

```sh
$ cd Nitro-Fediverse
docker-compose up
```

Application is running on [localhost:4100](http://localhost:4100/)

## Testing
Cucumber features are used to test the acceptance of the API against the Standard.
To run the Acceptance tests first install and start the [backend](https://github.com/Human-Connection/Nitro-Backend/).

Then go ahead and start the seeder API with disabled permissions:
```sh
yarn test:before:seeder
``` 
After that you will be able to run the tests with:
```sh
yarn run test
```


## Exposing the endpoint

You can use a service like [ngrok](https://ngrok.com/) to test things out before
you deploy on a real server.

Run:
```sh
ngrok http 4100
```
Copy the domain name (e.g. `9bab9fd1.ngrok.io`) and run:

```sh
DOMAIN=9bab9fd1.ngrok.io yarn run server
```
or
```sh
DOMAIN=9bab9fd1.ngrok.io docker-compose up
```
depending on your setup.

## Debugging

This repository uses [**debug**](https://www.npmjs.com/package/debug) as logging tool. Just take a look at the imports of a file and search for e.g. `require('debug')('ea:utils')`. If you  want to see the debugging output for this specific file, run one of the above commands prefixed with `DEBUG=ea:utils`.  

You can also __*see*__ all debugging output available by prefixing with `DEBUG=ea*`.

## Deployment

:construction: Coming soon.

## ToDo's:

- [ ] Make all tests run
- [ ] Add Block activity for blocking users to interact with my content
- [ ] Up vote instead of shout for a comment
- [ ] Add Signature verification test
- [ ] Send an Article via ActivityPub when a Post is created
- [ ] Improve README

## License

See the [LICENSE](LICENSE-MIT.md) file for license rights and limitations
(MIT).

## Credit

This repository is based on [Darius Kazemi's](https://github.com/dariusk)
[repsitory "express-activitypub"](https://github.com/dariusk/express-activitypub).

