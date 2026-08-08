# The Catholic Family Record

Marketing landing page plus an authenticated partner dashboard (leads, analytics, charts).

## Architecture

```
client/   React (Vite) — landing, login, dashboard
server/   Node/Express — auth, leads, analytics, SQLite
deploy/   VPS helpers (PM2, Nginx, deploy script)
```

- **Landing** `/` — Discovery Session form → `POST /api/leads`
- **Login** `/login` — httpOnly JWT cookie session
- **Dashboard** `/dashboard` — KPIs, charts, inquiry pipeline

In production the Express server serves `client/dist` and `/api/*` on the same origin.

## Local development

```bash
npm install
npm install --prefix client
npm install --prefix server

cp server/.env.example server/.env
# For local use, set NODE_ENV=development and fill JWT_SECRET / ADMIN_* 

npm run seed --prefix server   # optional sample leads
npm run dev                    # API :4000 · Vite :5173
```

Admin credentials come only from `server/.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). They are never shown in the UI.

## VPS deployment

### 1. Server packages

```bash
# Ubuntu/Debian example
sudo apt update
sudo apt install -y nginx git build-essential python3
# Node 22 via NodeSource or nvm, then:
sudo npm i -g pm2
```

`better-sqlite3` needs native build tools (`build-essential`).

### 2. App on the VPS

```bash
git clone <your-repo-url> /var/www/catholic-family-record
cd /var/www/catholic-family-record

cp server/.env.example server/.env
nano server/.env
```

Set at minimum:

```env
NODE_ENV=production
PORT=4000
CLIENT_ORIGIN=https://your-domain.com
JWT_SECRET=<openssl rand -base64 48>
ADMIN_EMAIL=you@yourdiocese.org
ADMIN_PASSWORD=<strong password, 12+ chars>
```

Production refuses weak/placeholder secrets.

### 3. Build & start

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

Or manually:

```bash
npm ci && npm ci --prefix client && npm ci --prefix server
npm run build
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup   # follow the printed command once
```

Health check: `curl http://127.0.0.1:4000/api/health`

### 4. Nginx + TLS

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/cfr
sudo nano /etc/nginx/sites-available/cfr   # set your domain
sudo ln -sf /etc/nginx/sites-available/cfr /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

Point DNS A/AAAA records at the VPS before Certbot.

### 5. Updates

```bash
cd /var/www/catholic-family-record
git pull
./deploy/deploy.sh
```

SQLite data lives in `server/data/` (gitignored). Back it up regularly.

## API surface

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/leads` | public | Landing form |
| POST | `/api/analytics/events` | public | Telemetry |
| POST | `/api/auth/login` | public | Sign in (cookie) |
| POST | `/api/auth/logout` | public | Clear session |
| GET | `/api/auth/me` | cookie | Current user |
| GET | `/api/analytics/dashboard` | cookie | Charts + KPIs |
| GET | `/api/leads` | cookie | List inquiries |
| GET | `/api/leads/:id` | cookie | Lead detail |
| PATCH | `/api/leads/:id/status` | cookie | Update status |

## Security notes

- Session cookie is `httpOnly`, `SameSite=Lax`, and `Secure` in production
- Login response does not return a JWT in JSON (cookie only)
- Set a unique `JWT_SECRET` and strong `ADMIN_PASSWORD` before first production boot
- Keep `server/.env` off the repo and readable only by the deploy user
