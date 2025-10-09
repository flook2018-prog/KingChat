# Simple Dockerfile for Railway
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Set working directory to server
WORKDIR /app/server

# Install dependencies
RUN npm install --production

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "server-simple.js"]