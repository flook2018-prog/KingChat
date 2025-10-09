FROM node:18-alpine

WORKDIR /app

COPY . .

WORKDIR /app/server

RUN npm install --production

RUN apk add --no-cache curl

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

CMD ["node", "server-simple.js"]