#!/bin/bash
set -e

# Store the current git hash to rollback to in case of failure
PREVIOUS_COMMIT=$(git rev-parse HEAD)
echo "Current commit: $PREVIOUS_COMMIT"

echo "Starting Deployment..."

# 1. Take a DB Backup
bash ./deployment/scripts/backup.sh

# 2. Pull latest code
echo "Pulling latest code from main branch..."
git pull origin main

# 3. Install dependencies
echo "Installing Node.js dependencies..."
cd server
npm ci

# 4. Lint and Build
echo "Building TypeScript..."
npm run build

# 5. Database Migration
echo "Running Prisma Migrations..."
npx prisma migrate deploy || {
  echo "Migration failed! Triggering rollback..."
  cd ..
  bash ./deployment/scripts/rollback.sh "$PREVIOUS_COMMIT"
  exit 1
}
npx prisma generate

# 6. Reload PM2 Cluster with Zero-Downtime
echo "Reloading PM2 Applications..."
pm2 reload ecosystem.config.js --env production || {
  echo "PM2 reload failed! Triggering rollback..."
  cd ..
  bash ./deployment/scripts/rollback.sh "$PREVIOUS_COMMIT"
  exit 1
}

# 7. Health Check Verification
echo "Verifying deployment health..."
sleep 5 # Wait for PM2 workers to fully spin up
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/api/health)

if [ "$STATUS" -eq 200 ]; then
  echo "✅ Deployment successful. System is healthy."
else
  echo "❌ Health check failed with status $STATUS. Triggering rollback..."
  cd ..
  bash ./deployment/scripts/rollback.sh "$PREVIOUS_COMMIT"
  exit 1
fi
