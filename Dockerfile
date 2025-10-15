FROM node:18-alpine

WORKDIR /app

COPY . .

WORKDIR /app/server

RUN npm install --production

# Debug: List files and check server-production.js exists
RUN ls -la && echo "Checking server-production.js:" && ls -la server-production.js

EXPOSE $PORT

# Start the production server with PostgreSQL database
CMD echo "Starting KingChat with server-production.js..." && ls -la && node --version && npm --version && node server-production.js