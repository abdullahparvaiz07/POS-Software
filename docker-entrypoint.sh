#!/bin/sh
set -e

# Fallback Railway MySQL connection URL
DEFAULT_RAILWAY_DB_URL="mysql://root:ArdsacUTWxPvrSmnBUrWBBTUdFluAcSy@sakura.proxy.rlwy.net:12584/railway"

# Clean any quotes or extra whitespace from DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
  DATABASE_URL=$(echo "$DATABASE_URL" | tr -d '"' | tr -d "'" | tr -d '\r' | xargs)
fi

# Automatically map any Railway MySQL connection variable if DATABASE_URL is missing or invalid
if [ -z "$DATABASE_URL" ] || ! echo "$DATABASE_URL" | grep -q "^mysql://"; then
  if [ -n "$MYSQL_URL" ] && echo "$MYSQL_URL" | grep -q "^mysql://"; then
    export DATABASE_URL="$MYSQL_URL"
  elif [ -n "$MYSQLURL" ] && echo "$MYSQLURL" | grep -q "^mysql://"; then
    export DATABASE_URL="$MYSQLURL"
  elif [ -n "$MYSQL_PRIVATE_URL" ] && echo "$MYSQL_PRIVATE_URL" | grep -q "^mysql://"; then
    export DATABASE_URL="$MYSQL_PRIVATE_URL"
  elif [ -n "$MYSQL_PUBLIC_URL" ] && echo "$MYSQL_PUBLIC_URL" | grep -q "^mysql://"; then
    export DATABASE_URL="$MYSQL_PUBLIC_URL"
  elif [ -n "$MYSQLHOST" ] && [ -n "$MYSQLUSER" ]; then
    export DATABASE_URL="mysql://${MYSQLUSER}:${MYSQLPASSWORD:-}@${MYSQLHOST}:${MYSQLPORT:-3306}/${MYSQLDATABASE:-railway}"
  else
    echo "[Container] Using fallback Railway database URL."
    export DATABASE_URL="$DEFAULT_RAILWAY_DB_URL"
  fi
else
  export DATABASE_URL="$DATABASE_URL"
fi

echo "[Container] Database URL configured successfully."

echo "[Container] Running Prisma database migrations..."
npx prisma migrate deploy || echo "[Container] Migration warning - continuing server startup"

echo "[Container] Starting Node.js server..."
exec node dist/server.js
