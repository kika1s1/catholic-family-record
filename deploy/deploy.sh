#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Installing dependencies"
npm ci
npm ci --prefix client
npm ci --prefix server

if [[ ! -f server/.env ]]; then
  echo "Missing server/.env — copy server/.env.example and fill production values."
  exit 1
fi

# shellcheck disable=SC1091
set -a
source server/.env
set +a

if [[ "${NODE_ENV:-}" != "production" ]]; then
  echo "Warning: NODE_ENV is not production in server/.env"
fi

echo "==> Building client + server"
npm run build --prefix client
npm run build --prefix server

mkdir -p deploy/logs server/data

if command -v pm2 >/dev/null 2>&1; then
  echo "==> Restarting with PM2"
  pm2 startOrReload deploy/ecosystem.config.cjs --update-env
  pm2 save
  echo "Health check:"
  curl -fsS "http://127.0.0.1:${PORT:-4000}/api/health" || true
  echo
else
  echo "PM2 not found. Start manually:"
  echo "  cd server && NODE_ENV=production node dist/index.js"
fi

echo "==> Deploy complete"
