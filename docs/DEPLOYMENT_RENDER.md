# Render Deployment Guide
**Project:** Road_Pool (RidePool AI / ORoute)  
**Location Profile:** Pune, Maharashtra, India  

---

## Architecture on Render

Road_Pool is designed to support **two deployment modes** on [Render](https://render.com):

1. **Option A (Recommended — Render Blueprint):** Separate **FastAPI Web Service** (backend) + **Static Site** (frontend).
2. **Option B (Free Tier Single-Service):** A single unified Web Service where FastAPI compiles and serves the React SPA directly from `dist/` alongside REST & WebSockets.

---

## Option A: 1-Click Deployment via Render Blueprint (`render.yaml`)

This repository includes a production-ready [`render.yaml`](../render.yaml) blueprint.

### Steps:
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: configure Supabase database and Render deployment"
   git push origin main
   ```
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **"New +"** in the top navigation and select **"Blueprint"**.
4. Connect your GitHub repository (`Abhiman12406/Road_Pool`).
5. Render will automatically detect `render.yaml` and configure two services:
   - `roadpool-backend`: Python 3.11 FastAPI service
   - `roadpool-frontend`: Vite React Static Site
6. Enter your environment variables:
   - `SUPABASE_URL`: `https://your-project-ref.supabase.co`
   - `SUPABASE_KEY`: Your Supabase service role or anon key
   - `VITE_SUPABASE_URL`: `https://your-project-ref.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
7. Click **"Apply"** to deploy both services automatically!

---

## Option B: Unified Single Web Service (Free Tier Friendly)

If you wish to deploy the entire full-stack app (Backend + Frontend) inside **1 single free Web Service** instance:

### In Render Dashboard:
1. Click **"New +"** -> **"Web Service"**.
2. Select your repository.
3. Configure the service settings:
   - **Environment:** `Python 3`
   - **Build Command:** `./render-build.sh`
   - **Start Command:** `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/api/v1/health`
4. Environment variables:
   ```env
   PYTHON_VERSION=3.11.8
   ENVIRONMENT=production
   PORT=8000
   CORS_ORIGINS=*
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_KEY=your-supabase-key
   ```
5. Deploy! FastAPI will serve both:
   - The React SPA at `https://your-app.onrender.com`
   - REST API at `https://your-app.onrender.com/api/v1`
   - WebSockets at `wss://your-app.onrender.com/ws/live`

---

## Option C: Containerized Deployment via Docker

You can also deploy as a Docker service using the included multi-stage [`Dockerfile`](../Dockerfile):
1. In Render Dashboard, click **"New +"** -> **"Web Service"**.
2. Select **"Docker"** environment.
3. Build & deployment runs automatically through the multi-stage Docker build.

---

## Post-Deployment Verification Checklist

Once your Render deployment completes, verify the following endpoints:

| Endpoint | Expected Status | Description |
| :--- | :--- | :--- |
| `GET /api/v1/health` | `200 OK` | Backend health, version, city, active connections |
| `GET /api/v1/database/status` | `200 OK` | Supabase connectivity check |
| `GET /api/v1/simulation/state` | `200 OK` | Fleet & simulation snapshot |
| `WS /ws/live` | `101 Switching Protocols` | Realtime state stream |
| `GET /` | `200 OK` | Loads frontend interactive map and dispatch UI |

---

## Managing CORS and WebSockets on Render

- **CORS:** Controlled by the `CORS_ORIGINS` environment variable. By default, it accepts `*`, or you can specify `https://roadpool-frontend.onrender.com`.
- **WebSockets:** Render natively supports persistent WebSockets on standard Web Services without extra proxy configuration.
- **Port:** Render dynamically assigns the `PORT` environment variable. The backend uses `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, which is already configured.
