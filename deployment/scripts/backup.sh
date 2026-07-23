#!/bin/bash
set -e

echo "Starting Database Backup..."
# Ensure backups directory exists
mkdir -p /var/backups/restaurant-pos

BACKUP_FILE="/var/backups/restaurant-pos/db_backup_$(date +%F_%T).sql"

# Assuming credentials are provided via environment or ~/.my.cnf
mysqldump -u root -p${MYSQL_ROOT_PASSWORD} restaurant_pos > "$BACKUP_FILE"

echo "Backup created successfully at $BACKUP_FILE"

# Compress it
gzip "$BACKUP_FILE"
echo "Backup compressed to $BACKUP_FILE.gz"

# Optional: Upload to AWS S3
# aws s3 cp "$BACKUP_FILE.gz" s3://restaurant-pos-backups/
