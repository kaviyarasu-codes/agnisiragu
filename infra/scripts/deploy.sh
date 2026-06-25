#!/bin/bash
# infra/scripts/deploy.sh
# Manual zero-downtime deploy — run on server as agnisiragu user
# Usage: ./infra/scripts/deploy.sh [image-tag]

set -euo pipefail

APP_DIR="/opt/agnisiragu"
COMPOSE_FILE="$APP_DIR/infra/docker-compose.prod.yml"
IMAGE_TAG="${1:-latest}"

echo "=== Deploying Agnisiragu backend (tag: $IMAGE_TAG) ==="

cd "$APP_DIR"

# Update image tag
sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$IMAGE_TAG/" .env

# Pull latest image
docker compose -f "$COMPOSE_FILE" pull backend

# Rolling restart (keeps old container alive until new one is healthy)
docker compose -f "$COMPOSE_FILE" up -d --no-deps --force-recreate backend

# Wait for health
echo "Waiting for health check..."
RETRIES=0
MAX_RETRIES=30
until docker inspect --format='{{.State.Health.Status}}' agnisiragu_backend | grep -q "healthy"; do
  RETRIES=$((RETRIES + 1))
  if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
    echo "❌ Health check failed after ${MAX_RETRIES} attempts — rolling back"
    docker compose -f "$COMPOSE_FILE" up -d --no-deps --force-recreate --scale backend=1 backend
    exit 1
  fi
  echo "  Attempt $RETRIES/$MAX_RETRIES..."
  sleep 5
done

echo "✅ Deploy complete — backend is healthy"

# Prune old images (keep last 3)
docker image prune -f
