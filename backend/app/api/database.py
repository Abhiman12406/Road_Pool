"""
Supabase Database API Endpoints
Provides status monitoring, table inspection, and manual sync triggers.
"""
import logging
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from app.config import settings
from app.db.supabase_client import get_supabase_client, is_supabase_enabled
from app.db.repository import db_repository
from app.services.simulation_engine import sim_engine

logger = logging.getLogger("routemates.db.api")
router = APIRouter(prefix="/database", tags=["Database & Supabase"])

@router.get("/status")
async def get_database_status() -> Dict[str, Any]:
    """
    Returns the current Supabase connection health, configuration state,
    and masked endpoint information.
    """
    configured = settings.is_supabase_configured
    connected = is_supabase_enabled()
    
    masked_url = ""
    if settings.SUPABASE_URL:
        # e.g. https://abc***.supabase.co
        parts = settings.SUPABASE_URL.split("//")
        if len(parts) > 1:
            domain = parts[1]
            masked_url = f"{parts[0]}//{domain[:5]}***{domain[-12:]}" if len(domain) > 17 else settings.SUPABASE_URL
        else:
            masked_url = settings.SUPABASE_URL

    return {
        "status": "connected" if connected else ("configured_offline" if configured else "in_memory_mode"),
        "is_configured": configured,
        "is_connected": connected,
        "provider": "Supabase PostgreSQL",
        "supabase_url": masked_url or "Not configured (set SUPABASE_URL & SUPABASE_KEY)",
        "tables": [
            "profiles",
            "vehicles",
            "ride_requests",
            "batches",
            "detour_audits",
            "shapley_pools",
            "mid_trip_joins"
        ],
        "active_memory_requests": len(sim_engine.state.requests),
        "active_memory_vehicles": len(sim_engine.state.vehicles),
        "active_memory_audits": len(sim_engine.state.detourAudits)
    }

@router.post("/sync")
async def sync_memory_to_database():
    """
    Flushes the current in-memory simulation snapshot into Supabase tables.
    Useful after running simulations or loading acceptance scenarios.
    """
    client = get_supabase_client()
    if not client:
        return {
            "status": "skipped",
            "message": "Supabase credentials are not set. State remains safely in-memory."
        }

    synced_vehicles = 0
    synced_requests = 0
    synced_audits = 0

    # 1. Sync Vehicles
    for v in sim_engine.state.vehicles.values():
        ok = await db_repository.upsert_vehicle(v.model_dump())
        if ok:
            synced_vehicles += 1

    # 2. Sync Requests
    for r in sim_engine.state.requests.values():
        ok = await db_repository.upsert_ride_request(r.model_dump())
        if ok:
            synced_requests += 1

    # 3. Sync Detour Audits
    for a in sim_engine.state.detourAudits:
        ok = await db_repository.record_detour_audit(a.model_dump())
        if ok:
            synced_audits += 1

    # 4. Sync Batch
    engine = sim_engine.state.engine
    await db_repository.record_batch(
        window_id=engine.currentWindowId,
        interval_sec=engine.windowIntervalSec,
        threshold=engine.batchThreshold,
        status=engine.batchStatus,
        queued_count=engine.queuedRequestCount,
        trigger_reason=engine.lastDispatchReason
    )

    return {
        "status": "success",
        "synced": {
            "vehicles": synced_vehicles,
            "requests": synced_requests,
            "detour_audits": synced_audits
        }
    }

@router.get("/requests")
async def list_persisted_requests(limit: int = 25):
    """Fetches recently stored ride requests from Supabase."""
    client = get_supabase_client()
    if not client:
        # Fallback to in-memory requests
        reqs = list(sim_engine.state.requests.values())[:limit]
        return {
            "source": "in_memory_fallback",
            "count": len(reqs),
            "data": [r.model_dump() for r in reqs]
        }

    try:
        def _fetch():
            return client.table("ride_requests").select("*").order("created_at", desc=True).limit(limit).execute()

        res = await db_repository._run_in_thread(_fetch)
        return {
            "source": "supabase",
            "count": len(res.data),
            "data": res.data
        }
    except Exception as exc:
        logger.warning(f"Failed to query Supabase ride_requests, falling back to in-memory: {exc}")
        reqs = list(sim_engine.state.requests.values())[:limit]
        return {
            "source": "in_memory_fallback",
            "count": len(reqs),
            "data": [r.model_dump() for r in reqs]
        }

@router.get("/vehicles")
async def list_persisted_vehicles():
    """Fetches vehicles fleet from Supabase."""
    client = get_supabase_client()
    if not client:
        vehs = list(sim_engine.state.vehicles.values())
        return {
            "source": "in_memory_fallback",
            "count": len(vehs),
            "data": [v.model_dump() for v in vehs]
        }

    try:
        def _fetch():
            return client.table("vehicles").select("*").execute()

        res = await db_repository._run_in_thread(_fetch)
        return {
            "source": "supabase",
            "count": len(res.data),
            "data": res.data
        }
    except Exception as exc:
        logger.warning(f"Failed to query Supabase vehicles, falling back to in-memory: {exc}")
        vehs = list(sim_engine.state.vehicles.values())
        return {
            "source": "in_memory_fallback",
            "count": len(vehs),
            "data": [v.model_dump() for v in vehs]
        }
