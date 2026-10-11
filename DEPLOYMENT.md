# FleetOS Pulse — Deployment & Production Release Guide

This document contains step-by-step instructions for deploying the **FleetOS Pulse** platform to production cloud environments (Vercel/Render/Railway) or running containerized via Docker Compose.

---

## 1. System Requirements & Software Prerequisites

| Component | Minimum Version | Recommended |
| :--- | :--- | :--- |
| **Node.js** | 18.x | 20.x LTS |
| **Python** | 3.10 | 3.11 |
| **Docker** (Optional) | 24.0 | Docker Desktop 4.25+ |
| **Database** | SQLite 3 (Local) | PostgreSQL 14+ (Production) |

---

## 2. Environment Variables Matrix

### Backend Environment Variables (`backend/.env`)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | String | `development` | Environment mode (`development`, `demo`, `production`). |
| `PORT` | Integer | `8000` | Port for Uvicorn HTTP server. |
| `DATABASE_URL` | String | `sqlite:///.../fleetos_pulse.db` | Database connection string. Use `postgresql://...` for production. |
| `ALLOWED_ORIGINS` | String | `http://localhost:5173,...` | Comma-separated list or JSON array of CORS allowed origins. |
| `ADMIN_API_KEY` | String | `""` | Key required in `X-Admin-Key` header for demo reset in production. |
| `STALE_THRESHOLD_MINUTES` | Integer | `30` | Minutes before data feed is flagged as stale. |

### Frontend Environment Variables (`fleetos-pulse/.env`)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | String | `http://localhost:8000` | Public backend URL accessible by client browser. |

---

## 3. Local Containerized Deployment (Docker Compose)

To launch the full stack locally in isolated containers:

```bash
# Clone or navigate to root workspace
cd "d:/TBS OS COMPLETE VERSION 1"

# Build and start container services
docker-compose up --build -d

# Verify container statuses
docker-compose ps
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 4. Production Cloud Deployment Guide

### Option A: Railway / Render (Backend + Managed PostgreSQL)

1. **Database Setup**:
   - Create a managed PostgreSQL database on Render or Railway.
   - Copy the provided `Internal Database URL` or `PostgreSQL Connection String`.

2. **Backend Web Service Setup**:
   - Connect repository branch to Railway/Render Web Service.
   - Set **Root Directory**: `backend`
   - Set **Build Command**: `pip install -r requirements.txt`
   - Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add Environment Variables:
     - `ENVIRONMENT=production`
     - `DATABASE_URL=<your_postgres_url>`
     - `ALLOWED_ORIGINS=https://your-frontend-app.vercel.app`
     - `ADMIN_API_KEY=<generate_secure_random_key>`

3. **Verify Deployment**:
   - Test `GET https://your-backend-service.onrender.com/api/health`
   - Expected response: `{"status":"ok","db_status":"connected","environment":"production"}`

---

### Option B: Vercel / Netlify (React Frontend)

1. **Project Setup**:
   - Import `fleetos-pulse` directory as a new project in Vercel or Netlify.
   - Framework Preset: **Vite**
   - Root Directory: `fleetos-pulse`
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Environment Variable Configuration**:
   - Add Environment Variable:
     - `VITE_API_BASE_URL=https://your-backend-service.onrender.com`

3. **Deploy & Verify**:
   - Deploy project.
   - Verify network requests point to remote FastAPI URL without CORS errors.

---

## 5. Security & Guardrail Checklist

- [x] **CORS Origin Whitelisting**: Restricted to production frontend domain in `production` mode.
- [x] **Admin Key Protection**: Demo data wipes (`/api/demo/reset`) require `X-Admin-Key` header when `ENVIRONMENT=production`.
- [x] **Fare Boundaries Enforcement**: Backend enforces `minFare <= approvedFare <= maxFare`.
- [x] **Secret Isolation**: Secrets and database connection strings excluded from git tracking via `.gitignore`.
- [x] **Path Independence**: SQLite fallback uses absolute directory resolution, preventing missing file errors.

---

## 6. Health Monitoring & Rollback Procedures

### Health Check Endpoint
- **URL**: `GET /api/health`
- **Healthy Response**:
  ```json
  {
    "status": "ok",
    "db_status": "connected",
    "service": "FleetOS Pulse API",
    "environment": "production",
    "version": "1.0.0"
  }
  ```

### Database Backup & Rollback
1. **SQLite (Local)**:
   - Backup: Copy `backend/fleetos_pulse.db` to `backend/fleetos_pulse.db.bak`.
   - Restore: Overwrite `fleetos_pulse.db` with `fleetos_pulse.db.bak` and restart server.
2. **PostgreSQL (Cloud)**:
   - Use `pg_dump` to capture database snapshot:
     ```bash
     pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
     ```
   - Restore snapshot:
     ```bash
     psql $DATABASE_URL < backup_20261011.sql
     ```

---

## 7. Common Deployment Troubleshooting

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **CORS Blocked** | `ALLOWED_ORIGINS` mismatch on backend. | Add exact frontend domain (including `https://`) to `ALLOWED_ORIGINS` env var on backend. |
| **SQLAlchemy Dialect Error** | Connection URL starts with `postgres://`. | Updated `database.py` automatically converts `postgres://` to `postgresql://`. |
| **Demo Reset 403 Forbidden** | `ENVIRONMENT=production` set without passing `X-Admin-Key`. | Pass `X-Admin-Key: <ADMIN_API_KEY>` header in request or set `ENVIRONMENT=development` for local demos. |
| **Database Locks on SQLite** | Concurrent writers in multi-threaded environment. | Transition to managed PostgreSQL via `DATABASE_URL` env var. |
