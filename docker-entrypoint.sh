#!/bin/sh
set -e

echo "[Container] Running Prisma database migrations..."
npx prisma migrate deploy || echo "[Container] Migration warning - continuing server startup"

echo "[Container] Starting Node.js server..."
exec node dist/server.js
