FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Copy migration files
COPY src/db/migrations ./src/db/migrations
COPY scripts/setup.sh ./scripts/setup.sh

# Make setup script executable
RUN chmod +x /app/scripts/setup.sh

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Health check - includes database connectivity check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "
    const http = require('http');
    http.get('http://localhost:3001/health', (res) => {
      process.exit(res.statusCode === 200 ? 0 : 1);
    }).on('error', () => process.exit(1));
  " || exit 1

# Entrypoint script for database setup
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]

# Start application
CMD ["node", "src/index.js"]
