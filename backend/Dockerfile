FROM node:22-alpine3.23

USER node
WORKDIR /app

COPY --chown=node:node ./package.json /app
COPY --chown=node:node ./package-lock.json /app
RUN npm install --production

COPY --chown=node:node ./src /app/src

CMD ["npx", "tsx", "src/index.ts"]
