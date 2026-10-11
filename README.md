# FleetOS Pulse — Trust-Aware Fleet Intelligence & Dynamic Pricing Guardrails

**FleetOS Pulse** is an enterprise intercity bus fleet management, latent demand forecasting, and trust-aware dynamic pricing platform built for the **SAMARTHA Hackathon**.

---

## System Architecture

- **GitHub Repository**: [https://github.com/premsai-developer/fleetos-pulse](https://github.com/premsai-developer/fleetos-pulse) (Private)
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Lucide Icons, Recharts (Hosted on Vercel).
- **Backend Engine**: FastAPI, Python 3.11, Pydantic, Uvicorn (Hosted on Render).
- **Database Engine**: SQLite (Local persistent demo) / Render PostgreSQL (Production cloud via `DATABASE_URL`).
- **Containerization**: Docker & Docker Compose.


---

## Quick Local Startup

### 1. Prerequisites
- Python 3.10+ & Node.js 18+

### 2. Launching Backend & Frontend

```bash
# Terminal 1 — Backend FastAPI Server
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend React App
cd fleetos-pulse
npm run dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI Specs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Containerized Startup (Docker)

```bash
docker-compose up --build
```

---

## Release & Deployment Documentation

- **Presentation Script & Walkthrough**: See [`DEMO_GUIDE.md`](./DEMO_GUIDE.md)
- **Production Deployment Guide (Vercel/Render/Railway)**: See [`DEPLOYMENT.md`](./DEPLOYMENT.md)
