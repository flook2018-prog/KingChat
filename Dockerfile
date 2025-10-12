FROM node:18-alpine

WORKDIR /app

COPY . .

WORKDIR /app/server

RUN npm install --production

RUN apk add --no-cache curl

EXPOSE $PORT

CMD ["node", "server-simple.js"]