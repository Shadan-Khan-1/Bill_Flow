# 🚀 BillFlow Deployment Guide

---

## Option A — Vercel (Frontend) + Render (Backend) [Recommended Free Tier]

### Step 1 — MongoDB Atlas (Database)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → Create free cluster (M0)
2. **Database Access** → Add user with `readWrite` role → note username/password
3. **Network Access** → Allow `0.0.0.0/0` (or Render's IP range)
4. **Connect** → Drivers → copy connection string:
   ```
   mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/billflow
   ```

---

### Step 2 — Render (Backend API)

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
4. Environment Variables (set in Render dashboard):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | your Atlas connection string |
| `JWT_SECRET` | run `make gen-secret` to generate |
| `JWT_REFRESH_SECRET` | run `make gen-secret` again |
| `JWT_EXPIRES_IN` | `7d` |
| `BCRYPT_SALT_ROUNDS` | `12` |
| `ALLOWED_ORIGINS` | `https://your-vercel-app.vercel.app` |
| `COMPANY_NAME` | Your company name |
| `COMPANY_GSTIN` | Your GSTIN |

5. Deploy → copy the live URL (e.g. `https://billflow-api.onrender.com`)

---

### Step 3 — Seed the Database

After backend is deployed, run the seeder once locally:

```bash
cd backend
MONGO_URI="your_atlas_uri" node utils/seeder.js
```

---

### Step 4 — Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) → Import Git Repo
2. Set **Root Directory** to `frontend`
3. Framework preset: **Vite**
4. Environment Variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://billflow-api.onrender.com/api` |
| `VITE_APP_NAME` | `BillFlow` |

5. Deploy → your app is live!

---

## Option B — Docker Compose (Self-Hosted VPS)

### Prerequisites
- VPS with 1GB+ RAM (DigitalOcean, Hetzner, Linode etc.)
- Docker + Docker Compose installed
- Domain name pointing to VPS IP

### Steps

```bash
# 1. Clone repo on your VPS
git clone https://github.com/yourname/billflow.git
cd billflow

# 2. Configure environment
cp .env.docker .env.docker.local
nano .env.docker.local   # fill in your values

# 3. Generate JWT secrets
make gen-secret  # run twice for JWT_SECRET and JWT_REFRESH_SECRET

# 4. Start all services
make docker-up

# 5. Seed the database
docker exec billflow_api node utils/seeder.js

# 6. Check status
docker compose ps
docker compose logs backend --tail=50
```

App runs on port 80. For HTTPS, add Nginx + Let's Encrypt in front.

---

## Option C — AWS (Production Scale)

| Service | AWS Equivalent |
|---------|---------------|
| Frontend | S3 + CloudFront |
| Backend  | ECS Fargate or EC2 |
| Database | DocumentDB or Atlas |
| Secrets  | AWS Secrets Manager |
| Logs     | CloudWatch |
| CI/CD    | CodePipeline or GitHub Actions |

---

## 🔐 Post-Deployment Security Checklist

- [ ] JWT_SECRET is at least 64 random hex chars
- [ ] MONGO_URI uses a dedicated app user (not root)
- [ ] ALLOWED_ORIGINS is set to your exact domain
- [ ] Default demo passwords changed after first login
- [ ] MongoDB Atlas IP whitelist tightened to Render's IPs
- [ ] `NODE_ENV=production` is set
- [ ] HTTPS enabled on all endpoints
- [ ] Run `npm audit` and patch any critical vulnerabilities
- [ ] Set up MongoDB Atlas backups (free tier: manual snapshots)

---

## 📊 Monitoring

Add these free tools after deploying:

| Tool | Purpose |
|------|---------|
| [UptimeRobot](https://uptimerobot.com) | Uptime monitoring (ping `/health`) |
| [Sentry](https://sentry.io) | Error tracking |
| [MongoDB Atlas Monitoring](https://cloud.mongodb.com) | DB metrics |
| [Render Logs](https://render.com) | Backend logs |
| [Vercel Analytics](https://vercel.com/analytics) | Frontend performance |
