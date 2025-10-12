FROM node:18-alpine

WORKDIR /app

COPY . .

WORKDIR /app/server

RUN npm install --production

# Debug: List files and check server-simple.js exists
RUN ls -la && echo "Checking server-simple.js:" && ls -la server-simple.js

EXPOSE $PORT

# Add some debug output
CMD echo "Starting server..." && ls -la && node --version && npm --version && node server-simple.js