#!/bin/bash
# infra/scripts/backup.sh
# Daily PostgreSQL backup to AWS S3 — an EXTRA safety net on top of Neon's
# own built-in point-in-time recovery, not a replacement for it. Dumps
# directly from the Neon DATABASE_URL (no local postgres container to
# exec into since the DB isn't run on this VPS).
# Requires: `apt install postgresql-client` on the VPS (for pg_dump) and
# DATABASE_URL exported in this shell (source /opt/agnisiragu/.env first,
# or add `set -a; source /opt/agnisiragu/.env; set +a` to the crontab line).
# Add to crontab: 0 2 * * * /opt/agnisiragu/infra/scripts/backup.sh >> /var/log/agnisiragu-backup.log 2>&1

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="agnisiragu_backup_${TIMESTAMP}.sql.gz"
BACKUP_DIR="/tmp/backups"
S3_BUCKET="${AWS_S3_BUCKET:-agnisiragu-media}"
S3_PREFIX="backups/postgres"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

echo "[$TIMESTAMP] Starting backup..."

# Dump directly from Neon over the network
pg_dump "${DATABASE_URL}" \
  --no-owner --no-acl \
  | gzip > "$BACKUP_DIR/$BACKUP_FILE"

BACKUP_SIZE=$(du -sh "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo "Backup size: $BACKUP_SIZE"

# Upload to S3
aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" \
  "s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILE}" \
  --storage-class STANDARD_IA

echo "Uploaded to s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_FILE}"

# Delete local file
rm -f "$BACKUP_DIR/$BACKUP_FILE"

# Remove backups older than RETENTION_DAYS from S3
aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" \
  | awk '{print $4}' \
  | while read -r key; do
    FILE_DATE=$(echo "$key" | grep -oP '\d{8}')
    CUTOFF=$(date -d "${RETENTION_DAYS} days ago" +%Y%m%d)
    if [[ "$FILE_DATE" < "$CUTOFF" ]]; then
      aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/${key}"
      echo "Removed old backup: $key"
    fi
  done

echo "[$TIMESTAMP] Backup complete ✅"
