# FleetOS Pulse — Hackathon Presentation & Demo Guide

Welcome to the **FleetOS Pulse** live demonstration guide for the **SAMARTHA Hackathon**.

FleetOS Pulse is a Trust-Aware Fleet Intelligence & Dynamic Pricing Guardrail platform for Intercity Bus Operations.

---

## 1. Quick Startup Instructions

### Prerequisites
- **Python 3.10+** (with `pip`)
- **Node.js 18+** (with `npm`)

### Option A: Automatic Concurrent Start (Recommended)

From the root directory:
```bash
# Terminal 1: Backend Engine
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2: Frontend Dashboard
cd fleetos-pulse
npm run dev
```

### Server URLs
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI Specs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 2. Database & Demo State Management

### Database Persistence
- FleetOS Pulse uses a persistent **SQLite database** stored at `backend/fleetos_pulse.db`.
- Database schemas & initial seed data auto-initialize on startup.

### Safe Demo Reset
To restore the system to its initial baseline demo state at any time:
1. Click the **"Reset Demo"** button on the top-right header in the web interface, OR
2. Send an HTTP POST request to:
   ```bash
   curl -X POST http://localhost:8000/api/demo/reset
   ```

---

## 3. Recommended 8-Step Presentation Sequence

Follow this step-by-step presentation script to demonstrate the core capabilities:

### Step 1: Fleet Command Center Overview
- **Action**: Navigate to `http://localhost:5173/` (or click Step 1 in Presenter Guide).
- **Narrative**: Highlight real-time fleet occupancy (78.9%), departures needing review, and daily opportunity queue items.

### Step 2: Trips & TrueDemand Inspection (Scenario A - Capacity Shortage)
- **Action**: Click **"A: Shortage"** in the top Scenario Toolbar or navigate to `/trips`.
- **Target Trip**: `TRIP-104` (Tirupati → Chennai).
- **Expected Result**: Departure is sold out (40/40 booked). TrueDemand Engine highlights 48 estimated latent demand requests & unserved demand observation.

### Step 3: Low Demand & Promo Evaluation (Scenario B - Low Demand)
- **Action**: Click **"B: Low Demand"** in the top Scenario Toolbar.
- **Target Trip**: `TRIP-102` (Hyderabad → Vijayawada).
- **Expected Result**: Departure has low occupancy (8/36 booked, 22%). System proposes an automated promo fare reduction to boost booking velocity.

### Step 4: FairFare Price Recommendations & Guardrails
- **Action**: Click `/recommendations` (Step 4/5).
- **Narrative**: Explain algorithmic fare recommendations. Emphasize that recommendations are constrained by strict configured price floors (`minFare`) and price ceilings (`maxFare`).

### Step 5: Operator Approval & Real-Time Sync (Scenario D - Operator Approval)
- **Action**: Click **"D: Approval"** in the Toolbar, then click **"Approve Fare"** on `TRIP-101`.
- **Expected Result**: Approved fare updates dynamically in SQLite database (e.g. ₹680 → ₹760). An audit log entry is written immediately to `/audit`.

### Step 6: Passenger-Facing Transparency
- **Action**: Navigate to `/passenger` (Step 6).
- **Target Trip**: `TRIP-101`.
- **Expected Result**: Passenger view reflects the exact approved fare of ₹760 with transparent price breakdown and zero hidden charges.

### Step 7: Automated Data-Health Safeguard (Scenario C - Stale Data)
- **Action**: Click **"C: Stale Data"** in the top Scenario Toolbar.
- **Target Trip**: `TRIP-105` (Bangalore → Hyderabad).
- **Expected Result**: Feed age exceeds 60 minutes (75 min). **FairFare Guard** automatically blocks recommendations and displays a prominent stale-data warning.

### Step 8: Immutable Audit Trail & Settlement Audit
- **Action**: Navigate to `/audit` (Step 8) & `/leakage`.
- **Expected Result**: Immutable log of operator actions, system guard events, and RedBus/AbhiBus OTA commission discrepancy resolution (`DISC-301`).

---

## 4. Troubleshooting & Connection Guidance

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **"Backend Communication Warning"** banner in UI | Backend server is not running or running on wrong port. | Ensure FastAPI backend is running on `http://localhost:8000`. Run `python main.py` or `uvicorn main:app --port 8000`. |
| `pytest` command not found | `pytest` is installed inside virtual environment. | Run `python -m pytest` instead of `pytest`. |
| Port 8000 or 5173 already in use | Previous process still running in background. | Stop previous process or kill python/node process occupying port. |

---

## 5. Synthetic Data & System Disclaimer

- **Synthetic Data**: Booking trends, latencies, and route demands are generated from the official SAMARTHA hackathon sample dataset.
- **Simulated Projections**: Elasticity curves and revenue diff estimates represent simulated projections based on baseline booking velocity.
- **Guardrails**: Price floors and ceilings are enforced strictly at the database layer (`minFare <= fare <= maxFare`).
