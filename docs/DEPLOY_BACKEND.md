# Deploy Backend Changes to EC2

Follow these steps every time you make backend changes and want to deploy to production.

---

## 1) Commit and push your changes (local machine)

```bash
git add .
git commit -m "your change description"
git push
```

---

## 2) Pull changes on EC2

SSH into the server:

```bash
ssh -i /path/to/your-key.pem ubuntu@13.63.123.201
```

Pull latest code:

```bash
cd ~/bag-tracker
git pull
```

---

## 3) Rebuild and restart the backend container

```bash
docker compose -f docker-compose.prod.yml up -d --build backend
```

---

## 4) Run Prisma migrations (only if you changed the schema)

```bash
docker compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
```

---

## 5) Verify everything is working

Check containers are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

Check backend logs:

```bash
docker compose -f docker-compose.prod.yml logs --tail=50 backend
```

Test the API health endpoint:

```bash
curl -sS https://api.jcsmartbag.com/api/health
```

---

## Troubleshooting

### Container keeps restarting
```bash
docker compose -f docker-compose.prod.yml logs --tail=200 backend
```

### Force a clean rebuild (if cached layers cause issues)
```bash
docker compose -f docker-compose.prod.yml build --no-cache backend
docker compose -f docker-compose.prod.yml up -d backend
```

### Restart all services
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### Check Nginx logs
```bash
sudo tail -n 100 /var/log/nginx/error.log
sudo tail -n 100 /var/log/nginx/access.log
```

---

## Quick reference

| Task | Command |
|------|---------|
| Pull latest code | `git pull` |
| Rebuild + restart backend | `docker compose -f docker-compose.prod.yml up -d --build backend` |
| Run migrations | `docker compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy` |
| View backend logs | `docker compose -f docker-compose.prod.yml logs -f --tail=100 backend` |
| Check container status | `docker compose -f docker-compose.prod.yml ps` |
| Test API | `curl -sS https://api.jcsmartbag.com/api/health` |
