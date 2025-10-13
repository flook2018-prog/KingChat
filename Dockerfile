FROM node:18-alpine

WORKDIR /app

COPY . .

WORKDIR /app/server

RUN npm install --production

# Debug: List files and check server-clean.js exists
RUN ls -la && echo "Checking server-clean.js:" && ls -la server-clean.js

EXPOSE $PORT

# Start the debug server to test Railway routing
CMD echo "Starting debug server for Railway testing..." && ls -la && node --version && npm --version && node debug-server.js