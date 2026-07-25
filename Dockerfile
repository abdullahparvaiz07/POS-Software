# Stage 1: Build the Node.js TypeScript application
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy server package files and install dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install

# Copy full server source code
WORKDIR /app
COPY server ./server

# Generate Prisma Client
WORKDIR /app/server
RUN npx prisma generate

# Build TypeScript code to dist/
RUN npm run build

# Stage 2: Runtime production environment
FROM node:20-alpine AS runner

WORKDIR /app

# Install required runtime dependencies
RUN apk add --no-cache openssl mysql-client

# Copy built artifacts and dependencies from builder stage
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/server/node_modules ./node_modules
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/prisma ./prisma
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
