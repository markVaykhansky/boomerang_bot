FROM node:10.16.0-alpine

RUN mkdir -p /usr/src/app

COPY Server/src /usr/src/app/Server/src
COPY Server/index.ts /usr/src/app/Server
COPY Server/package.json /usr/src/app/Server
COPY Server/tsconfig.json /usr/src/app/Server
COPY Model /usr/src/app/Model

WORKDIR /usr/src/app/Server

ENV NODE_ENV=production

RUN npm install

RUN npm run tsc

EXPOSE 4000

CMD [ "node", "dist/Server/index.js" ]

