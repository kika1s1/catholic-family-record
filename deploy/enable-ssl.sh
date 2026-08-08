#!/usr/bin/env bash
# Run on the VPS AFTER DNS A records point to this server.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/catholic-family-record}"
DOMAIN_WWW="www.catholicfamilyrecord.com"
DOMAIN_APEX="catholicfamilyrecord.com"

echo "==> Checking DNS"
www_ip="$(dig +short "$DOMAIN_WWW" A | tail -n1 || true)"
apex_ip="$(dig +short "$DOMAIN_APEX" A | tail -n1 || true)"
server_ip="$(curl -4 -fsS ifconfig.me || curl -4 -fsS icanhazip.com)"

echo "Server IP: $server_ip"
echo "$DOMAIN_WWW -> ${www_ip:-none}"
echo "$DOMAIN_APEX -> ${apex_ip:-none}"

if [[ "$www_ip" != "$server_ip" || "$apex_ip" != "$server_ip" ]]; then
  echo "ERROR: DNS is not pointing both records to this VPS yet."
  echo "At your registrar (IONOS), set:"
  echo "  A    @      $server_ip"
  echo "  A    www    $server_ip"
  echo "Remove parking/AAAA records that point elsewhere if needed."
  exit 1
fi

mkdir -p /var/www/certbot
apt-get update -qq
apt-get install -y -qq certbot python3-certbot-nginx

certbot --nginx \
  -d "$DOMAIN_WWW" \
  -d "$DOMAIN_APEX" \
  --redirect \
  --non-interactive \
  --agree-tos \
  --register-unsafely-without-email \
  --keep-until-expiring

# Point app CORS/cookies at HTTPS www
ENV_FILE="$APP_DIR/server/.env"
if [[ -f "$ENV_FILE" ]]; then
  sed -i 's|^CLIENT_ORIGIN=.*|CLIENT_ORIGIN=https://www.catholicfamilyrecord.com,https://catholicfamilyrecord.com,http://67.205.132.40|' "$ENV_FILE"
  sed -i 's|^COOKIE_SECURE=.*|COOKIE_SECURE=true|' "$ENV_FILE"
  if ! grep -q '^COOKIE_SECURE=' "$ENV_FILE"; then
    echo 'COOKIE_SECURE=true' >> "$ENV_FILE"
  fi
  pm2 restart cfr --update-env || pm2 startOrReload "$APP_DIR/deploy/ecosystem.config.cjs" --update-env
fi

echo "==> SSL enabled"
curl -fsSI "https://$DOMAIN_WWW" | head -n 5 || true
