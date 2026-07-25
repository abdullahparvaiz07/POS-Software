#!/bin/sh
set -e

# Automatically map any Railway MySQL connection variable if DATABASE_URL is missing
if [ -z "$DATABASE_URL" ] || ! echo "$DATABASE_URL" | grep -q "^mysql://"; then
  if [ -n "$MYSQL_URL" ] && echo "$MYSQL_URL" | grep -q "^mysql://"; then
    export DATABASE_URL="$MYSQL_URL"
  elif [ -n "$MYSQLURL" ] && echo "$MYSQLURL" | grep -q "^mysql://"; then
    export DATABASE_URL="$MYSQLURL"
  elif [ -n "$MYSQL_PRIVATE_URL" ] && echo "$MYSQL_PRIVATE_URL" | grep -q "^mysql://"; then
    export DATABASE_URL="$MYSQL_PRIVATE_URL"
  elif [ -n "$MYSQL_PUBLIC_URL" ] && echo "$MYSQL_PUBLIC_URL" | grep -q "^mysql://"; then
    export DATABASE_URL="$MYSQL_PUBLIC_URL"
  fi
fi

echo "[Container] Using DATABASE_URL prefix: $(echo "$DATABASE_URL" | cut -c 1-15)..."

if [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -q "^mysql://"; then
  echo "[Container] Running Prisma database migrations..."
  npx prisma migrate deploy || echo "[Container] Migration warning - continuing server startup"
else
  echo "[Container] WARNING: Valid DATABASE_URL starting with mysql:// not detected. Skipping migrations."
fi

echo "[Container] Starting Node.js server..."
exec node dist/server.js
