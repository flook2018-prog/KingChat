# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server source code
COPY server/ ./

# Copy client source code for static serving
COPY client/ ../client/

# Create uploads directory if needed
RUN mkdir -p uploads

# Expose port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Start the application
CMD ["node", "server-simple.js"]