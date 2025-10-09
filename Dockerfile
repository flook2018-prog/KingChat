# Simple Dockerfile for Railway
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy everything first
COPY . .

# Install dependencies in server directory
WORKDIR /app/server
RUN npm install --production

# Create symlink for client access
RUN ln -sf /app/client /app/server/client || echo "Client link created"

# Expose port
EXPOSE 8080

# Install curl for health check
RUN apk add --no-cache curl

# Health check - เปลี่ยนเป็น simple check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=5 \
    CMD curl -f http://localhost:8080/ || exit 1

# Start the application
CMD ["node", "server-simple.js"]