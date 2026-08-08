#!/usr/bin/env bash
# Runs ON the VPS after rsync. Preserves server/.env and SQLite data.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/catholic-family-record}"
cd "$APP_DIR"

if [[ ! -f server/.env ]]; then
  echo "ERROR: missing $APP_DIR/server/.env"
  exit 1
fi

echo "==> Install dependencies"
npm ci
npm ci --prefix client
npm ci --prefix server

echo "==> Build"
npm run build --prefix client
npm run build --prefix server

mkdir -p deploy/logs server/data

# Stop legacy OptionC process if still bound to :4000
if pm2 describe optionc-api >/dev/null 2>&1; then
  echo "==> Stopping legacy optionc-api"
  pm2 delete optionc-api || true
fi

echo "==> Start/reload CFR with PM2"
pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save

# Nginx site
if [[ -f deploy/nginx.cfr.conf ]]; then
  echo "==> Updating Nginx"
  cp deploy/nginx.cfr.conf /etc/nginx/sites-available/cfr
  ln -sfn /etc/nginx/sites-available/cfr /etc/nginx/sites-enabled/cfr
  # Remove old optionc site if present
  rm -f /etc/nginx/sites-enabled/optionc
  nginx -t
  systemctl reload nginx
fi

PORT="$(grep -E '^PORT=' server/.env | cut -d= -f2- || echo 4000)"
echo "==> Health"
ok=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/tmp/cfr-health.json 2>/dev/null; then
    cat /tmp/cfr-health.json
    echo
    ok=1
    break
  fi
  sleep 1
done
if [[ "$ok" != "1" ]]; then
  echo "Health check failed"
  pm2 logs cfr --lines 40 --nostream || true
  exit 1
fi
echo "==> Remote deploy complete"
