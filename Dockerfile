FROM node:18-alpine

WORKDIR /app

COPY . .

WORKDIR /app/server

RUN npm install --production

# Debug: List files and check server-clean.js exists
RUN ls -la && echo "Checking server-clean.js:" && ls -la server-clean.js

EXPOSE $PORT

# Start the test server to verify routing
CMD echo "Starting KingChat with server-test.js..." && ls -la && node --version && npm --version && node server-test.js