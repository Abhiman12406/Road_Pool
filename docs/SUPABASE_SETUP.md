# Supabase Database Integration & MCP Configuration Guide
**Project:** Road_Pool (RidePool AI / ORoute)  
**Location:** Pune, Maharashtra, India  

---

## 1. Overview
Road_Pool uses **Supabase (PostgreSQL with Realtime)** as its primary production database for:
- Passenger ride requests and lifecycle status transitions (`ride_requests`)
- Autonomous and pooled fleet state (`vehicles`)
- Sliding-window batch optimization records (`batches`)
- Mathematical compliance proofs for the strict $\le 15\%$ Detour Cap (`detour_audits`)
- Game-theoretic 7-coalition Shapley fair-fare allocations (`shapley_pools`)
- Mid-trip dynamic passenger joining & consent audits (`mid_trip_joins`)
- User accounts and roles: Rider, Driver, Dispatcher (`profiles`)

---

## 2. Quick Setup (3 Steps)

### Step 1: Create a Supabase Project
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard) and click **"New Project"**.
2. Give it a name (e.g. `road-pool-pune`) and set your database password.
3. Select a region close to your users (e.g., `ap-south-1` Mumbai for India).

### Step 2: Apply the Database Schema
1. In the Supabase Dashboard, go to **SQL Editor** -> **New Query**.
2. Copy and paste the complete migration script from:
   [`supabase/migrations/20260410000000_init_roadpool_schema.sql`](../supabase/migrations/20260410000000_init_roadpool_schema.sql)
3. Click **"Run"**. All tables, indexes, RLS policies, and initial Pune fleet seed records (`VEH-PUNE-01`, `VEH-PUNE-02`, `VEH-PUNE-03`) will be created instantly.

### Step 3: Populate Environment Variables

#### Backend (`backend/.env`):
```env
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_KEY=<your-service-role-key-or-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```
> **Tip:** Find these under **Project Settings** -> **API** -> **Project URL** & **Project API keys** (`anon` / `service_role`).

#### Frontend (`frontend/.env`):
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws/live
```

---

## 3. Configuring Supabase MCP in Antigravity IDE

To allow AI tools and agents to inspect tables, run queries, and execute SQL migrations directly via the Supabase MCP:

1. Obtain a Supabase Personal Access Token (PAT):
   - Go to [Supabase Account Tokens](https://supabase.com/dashboard/account/tokens).
   - Click **"Generate New Token"**, name it `Antigravity MCP`, and copy the token (starts with `sbp_...`).

2. Update `mcp_config.json` located at `C:\Users\Asus\.gemini\config\mcp_config.json`:
```json
{
  "mcpServers": {
    "supabase": {
      "serverUrl": "https://mcp.supabase.com/mcp",
      "headers": {
        "Authorization": "Bearer sbp_YOUR_PERSONAL_ACCESS_TOKEN"
      }
    }
  }
}
```
*Alternatively, using the official CLI package:*
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_YOUR_PERSONAL_ACCESS_TOKEN"
      }
    }
  }
}
```

Once configured, the AI agent can run:
- `list_projects`
- `list_tables`
- `execute_sql`
- `apply_migration`

---

## 4. Testing & Verifying Supabase Connectivity

Start the backend and verify the database status endpoint:
```bash
# In backend directory:
uvicorn app.main:app --reload
```

1. **Check Database Health:**
   ```bash
   curl http://localhost:8000/api/v1/database/status
   ```
   Output:
   ```json
   {
     "status": "connected",
     "is_configured": true,
     "is_connected": true,
     "provider": "Supabase PostgreSQL",
     "tables": ["profiles", "vehicles", "ride_requests", "batches", "detour_audits", "shapley_pools", "mid_trip_joins"]
   }
   ```

2. **Sync In-Memory State to Supabase:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/database/sync
   ```

3. **Query Stored Records:**
   ```bash
   curl http://localhost:8000/api/v1/database/vehicles
   curl http://localhost:8000/api/v1/database/requests
   ```
