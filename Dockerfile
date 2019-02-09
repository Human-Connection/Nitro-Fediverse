FROM node:10-alpine
LABEL Description="ActivityPub tested specification compliance for the Social Network Human-Connection.org" Vendor="Human Connection gGmbH" Version="0.0.1" Maintainer="Human Connection gGmbH (developer@human-connection.org)"

EXPOSE 4100
ARG WORKDIR=/nitro-fediverse
WORKDIR $WORKDIR
CMD ["yarn", "run", "server"]

RUN apk --no-cache add python make g++
COPY package.json yarn.lock ./
COPY .env.template .env

RUN yarn install --frozen-lockfile --non-interactive
COPY . .
RUN cp .env.template .env
