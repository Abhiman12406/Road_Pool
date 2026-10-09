# Road_Pool (RidePool AI / ORoute)

**Algorithmic Transit Ride-Pooling, Dynamic Batching & Fair Fare Allocation Engine**  
*Location Profile: Pune, Maharashtra, India*

[![Backend Tests](https://img.shields.io/badge/backend%20tests-63%20passed-brightgreen)](#)
[![Frontend Tests](https://img.shields.io/badge/frontend%20tests-48%20passed-brightgreen)](#)
[![Database](https://img.shields.io/badge/database-Supabase%20PostgreSQL-3ECF8E)](#)
[![Deployment](https://img.shields.io/badge/deploy-Render-46E3B7)](#)

---

## Architecture Overview

- **Optimization Core (Python / FastAPI / OR-Tools):** Solves the Vehicle Routing Problem with Time Windows (VRPTW) under a strict $\le 15\%$ Detour Cap with sliding-window batching and cooperative game theory (Shapley Value) cost allocation.
- **Database (Supabase PostgreSQL):** Persists ride requests, fleet state, batch dispatch windows, mathematical detour proofs, and Shapley fairness coalition matrices.
- **Frontend (Vite / React 19 / TypeScript / Tailwind / Leaflet / GSAP):** Real-time interactive dispatch dashboard, rider booking console, and driver route progression interface.
- **Cloud Deployment (Render):** Configured for 1-click Render Blueprint (`render.yaml`), multi-stage Docker (`Dockerfile`), or unified single-service deployments (`render-build.sh`).

---

## Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Database (Supabase) Setup
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Execute [`supabase/migrations/20260410000000_init_roadpool_schema.sql`](supabase/migrations/20260410000000_init_roadpool_schema.sql) in the Supabase SQL Editor.
3. Configure `backend/.env` with `SUPABASE_URL` and `SUPABASE_KEY`.
4. Configure `frontend/.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. See [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) for full instructions and Supabase MCP setup.

---

## Render Deployment

Deploy to [Render](https://render.com) using the included Blueprint:
1. Connect your repository on the Render dashboard.
2. Select **"Blueprint"** (Render detects [`render.yaml`](render.yaml)).
3. Provide your Supabase environment variables when prompted.
4. Click **"Apply"** to deploy!
5. See [`docs/DEPLOYMENT_RENDER.md`](docs/DEPLOYMENT_RENDER.md) for detailed deployment options.

---

## API Endpoints

- `GET /api/v1/health` - Service health, active WebSockets, and engine status
- `GET /api/v1/database/status` - Supabase connection state and table status
- `POST /api/v1/database/sync` - Flush in-memory state to Supabase tables
- `GET /api/v1/simulation/state` - Current global fleet and passenger snapshot
- `POST /api/v1/simulation/request` - Submit passenger ride request
- `POST /api/v1/simulation/batch/dispatch-now` - Trigger batch optimization immediately
- `GET /api/v1/simulation/shapley/matrix` - Shapley 7-coalition fairness matrix
- `GET /api/v1/simulation/detour-guarantees` - Mathematical detour cap audit logs
- `WS /ws/live` - Live WebSocket broadcast stream