# AWS Deployment (JC SmartBag)
This document describes the **current AWS setup** for this repo and how to operate it.

## High-level architecture
- **Frontend**: **AWS Amplify Hosting**
  - Public URLs: `https://jcsmartbag.com` and `https://www.jcsmartbag.com`
- **Backend API**: **EC2 (Ubuntu) + Docker Compose**
  - Public URL: `https://api.jcsmartbag.com`
  - App inside container listens on `127.0.0.1:5000` (not publicly exposed)
- **Reverse proxy / TLS**: **Nginx on EC2** + **Let’s Encrypt (Certbot)**
  - Terminates HTTPS on 443, proxies to `http://127.0.0.1:5000`
- **Database**: **Postgres in Docker** on the same EC2 instance
- **DNS provider**: **GoDaddy** (we did **not** move nameservers to Route 53)

## Domains and responsibilities
- **`jcsmartbag.com` / `www.jcsmartbag.com`**: Frontend (Amplify)
- **`api.jcsmartbag.com`**: Backend (EC2)

Important: `https://jcsmartbag.com/api/...` is **not** the API. The API is the **`api.`** subdomain.

## DNS records (GoDaddy)
Add/update these records in GoDaddy DNS. Values are from the Amplify domain setup and our EC2 Elastic IP.

### Frontend (Amplify)
- **ACM validation CNAME** (for TLS verification; “ACM” is not a GoDaddy record type)
  - Type: `CNAME`
  - Name/Host: `_8af7efb36b72101f21225ed3e46cea06`
  - Value: `_70cd35913efb32de20cc379ae027ac2b.jkddzztszm.acm-validations.aws`
- **www**
  - Type: `CNAME`
  - Name/Host: `www`
  - Value: `d3fbl9hmto577z.cloudfront.net`
- **Apex (@)**
  - If GoDaddy supports `ANAME`/`ALIAS`, point `@` to `d3fbl9hmto577z.cloudfront.net` as Amplify instructs.
  - If GoDaddy does **not** support `ANAME`/`ALIAS`, use **301 forwarding** from `jcsmartbag.com` → `https://www.jcsmartbag.com` (and keep `www` on Amplify).

### Backend (EC2)
- **api**
  - Type: `A`
  - Name/Host: `api`
  - Value: `13.63.123.201`

## Frontend configuration (Amplify)
The frontend uses Vite env var `VITE_API_URL` at build time.

### Required value
- `VITE_API_URL=https://api.jcsmartbag.com/api`

This is also present for production builds in:
- `frontend/.env.production`

If you change `VITE_API_URL`, you must **redeploy** in Amplify (Vite bakes env vars into the build).

## Backend configuration (EC2 + Docker)
### Compose file
- Production compose: `docker-compose.prod.yml`

Key points:
- Backend binds to **localhost only**:
  - `127.0.0.1:5000:5000`
- Postgres runs as `db` service and persists in Docker volume `postgres_data`.

### Key environment variables (backend)
In `docker-compose.prod.yml`:
- `DATABASE_URL`: points to `db` service (`postgresql://...@db:5432/...`)
- `JWT_SECRET`: must be a strong secret (do not keep placeholder in production)
- `APP_URL`: should match the **canonical** public site URL used by users
  - Examples: `https://jcsmartbag.com` or `https://www.jcsmartbag.com`
  - This affects links (e.g., password reset) sent from the backend
- `STRIPE_*`, `SMTP_*`: must be set for payments and email flows

### Start/upgrade backend (on EC2)
```bash
cd ~/bag-tracker
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Prisma migrations (on EC2)
Run after deploy (safe to repeat):
```bash
cd ~/bag-tracker
docker compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
```

## Nginx + HTTPS for the API (EC2)
We use Nginx on EC2 to expose the API on 80/443 and proxy to the backend container.

### Nginx site config
Repo file:
- `deploy/ec2-api-nginx.conf`

Install/enable on EC2:
```bash
sudo apt update
sudo apt install -y nginx

cd ~/bag-tracker
sudo cp deploy/ec2-api-nginx.conf /etc/nginx/sites-available/api-jcsmartbag
sudo ln -sf /etc/nginx/sites-available/api-jcsmartbag /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### TLS certificate (Let’s Encrypt)
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.jcsmartbag.com
```

### Verify listeners
```bash
sudo ss -tlnp | egrep ':80 |:443 ' || true
```

## EC2 networking and security
### Elastic IP
- Elastic IP: `13.63.123.201`
- Must remain **associated** to the correct EC2 instance.

Known issue we hit:
- DNS was correct, but HTTPS timed out/refused until the Elastic IP was re-associated.

### Security Group inbound rules (minimum)
- `22/tcp` SSH: **your IP only**
- `80/tcp` HTTP: `0.0.0.0/0`
- `443/tcp` HTTPS: `0.0.0.0/0`
- Do **not** expose `5000` publicly (API is behind Nginx).

## Smoke tests
### DNS
```bash
nslookup api.jcsmartbag.com
```

### API health
From a laptop:
```bash
curl -sS https://api.jcsmartbag.com/api/health
```

On EC2 (direct to backend container):
```bash
curl -sS http://127.0.0.1:5000/api/health
```

On EC2 (through Nginx):
```bash
curl -sS http://127.0.0.1/api/health
```

## Stripe webhook (if enabled)
Set Stripe webhook endpoint to the API domain (not the frontend):
- `https://api.jcsmartbag.com/api/stripe/...` (must match your route path)

Update `STRIPE_WEBHOOK_SECRET` in `docker-compose.prod.yml` and restart:
```bash
docker compose -f docker-compose.prod.yml up -d
```

## Costs (what is chargeable)
- **Amplify Hosting**: build minutes + bandwidth/requests + storage (free tier may apply depending on account)
- **EC2**: instance-hours (free tier may apply for 12 months depending on account)
- **EBS**: disk storage (GB-month) + snapshots (if used)
- **Elastic IP**: typically free **only while attached to a running instance**
- **Data transfer out**: can be a meaningful cost at scale
- **Let’s Encrypt certs (Certbot)**: free

