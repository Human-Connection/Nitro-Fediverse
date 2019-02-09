# Nitro-Fediverse

This repository is maintained by an active community.
We have regular meetings, run pair-programmings and tutorials in our [online learner community at Agile Ventures](https://www.agileventures.org/projects/human-connection).
[Join our Chat here](https://discordapp.com/invite/6ub73U3) and watch our [latest meetings or pair-programmings](https://www.youtube.com/playlist?list=PLH_dEBFTpMp78-QwtsRwVL7l-1kRdhR0P).

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

Run:
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


## Deployment

:construction: Coming soon.


## License

See the [LICENSE](LICENSE-MIT.md) file for license rights and limitations
(MIT).

## Credit

This repository is based on [Darius Kazemi's](https://github.com/dariusk)
[repsitory "express-activitypub"](https://github.com/dariusk/express-activitypub).

