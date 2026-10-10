"""
Supabase Repository
Handles asynchronous and non-blocking database queries, upserts, and logs.
Safely integrates with the simulation engine and background batching loops.
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.db.supabase_client import get_supabase_client

logger = logging.getLogger("ridepool.db.repository")

class SupabaseRepository:
    """Data Access Object for Supabase PostgreSQL tables."""

    @staticmethod
    def _run_in_thread(func, *args, **kwargs):
        """Executes synchronous Supabase SDK calls without blocking asyncio event loop."""
        return asyncio.to_thread(func, *args, **kwargs)

    async def upsert_ride_request(self, request_data: Dict[str, Any]) -> bool:
        """Persists or updates a passenger ride request in Supabase."""
        client = get_supabase_client()
        if not client:
            return False

        try:
            pickup = request_data.get("pickup", {})
            dropoff = request_data.get("dropoff", {})
            payload = {
                "request_id": request_data.get("request_id"),
                "passenger_id": request_data.get("passenger_id", "RIDER-UNKNOWN"),
                "passenger_name": request_data.get("passenger_name", "Passenger"),
                "pickup_lat": pickup.get("lat") if isinstance(pickup, dict) else getattr(pickup, "lat", 0.0),
                "pickup_lng": pickup.get("lng") if isinstance(pickup, dict) else getattr(pickup, "lng", 0.0),
                "pickup_name": pickup.get("name", "Pickup Location") if isinstance(pickup, dict) else getattr(pickup, "name", "Pickup Location"),
                "dropoff_lat": dropoff.get("lat") if isinstance(dropoff, dict) else getattr(dropoff, "lat", 0.0),
                "dropoff_lng": dropoff.get("lng") if isinstance(dropoff, dict) else getattr(dropoff, "lng", 0.0),
                "dropoff_name": dropoff.get("name", "Dropoff Location") if isinstance(dropoff, dict) else getattr(dropoff, "name", "Dropoff Location"),
                "party_size": request_data.get("party_size", 1),
                "solo_eta_sec": request_data.get("solo_eta_sec", 600),
                "solo_distance_km": request_data.get("solo_distance_km", 5.0),
                "solo_fare_inr": request_data.get("solo_fare_inr", 100.0),
                "status": request_data.get("status", "waiting_batch"),
                "assigned_vehicle_id": request_data.get("assigned_vehicle_id"),
                "batch_id": request_data.get("batch_id"),
                "pooled_eta_sec": request_data.get("pooled_eta_sec"),
                "detour_pct": request_data.get("detour_pct"),
                "shapley_fare_inr": request_data.get("shapley_fare_inr"),
                "rejection_reason": request_data.get("rejection_reason"),
                "arrival_deadline": request_data.get("arrival_deadline"),
                "special_requirements": request_data.get("special_requirements"),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }

            def _sync_upsert():
                return client.table("ride_requests").upsert(payload, on_conflict="request_id").execute()

            await self._run_in_thread(_sync_upsert)
            return True
        except Exception as exc:
            logger.warning("[Supabase] Failed to upsert ride_request: %s", exc)
            return False

    async def update_request_status(
        self,
        request_id: str,
        status: str,
        assigned_vehicle_id: Optional[str] = None,
        detour_pct: Optional[float] = None,
        shapley_fare_inr: Optional[float] = None,
        rejection_reason: Optional[str] = None
    ) -> bool:
        """Updates request lifecycle status in Supabase."""
        client = get_supabase_client()
        if not client:
            return False

        try:
            updates: Dict[str, Any] = {
                "status": status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            if assigned_vehicle_id is not None:
                updates["assigned_vehicle_id"] = assigned_vehicle_id
            if detour_pct is not None:
                updates["detour_pct"] = detour_pct
            if shapley_fare_inr is not None:
                updates["shapley_fare_inr"] = shapley_fare_inr
            if rejection_reason is not None:
                updates["rejection_reason"] = rejection_reason

            def _sync_update():
                return client.table("ride_requests").update(updates).eq("request_id", request_id).execute()

            await self._run_in_thread(_sync_update)
            return True
        except Exception as exc:
            logger.warning("[Supabase] Failed to update request status: %s", exc)
            return False

    async def upsert_vehicle(self, vehicle_data: Dict[str, Any]) -> bool:
        """Persists or updates vehicle coordinates and planned stops."""
        client = get_supabase_client()
        if not client:
            return False

        try:
            loc = vehicle_data.get("current_location", {})
            lat = loc.get("lat") if isinstance(loc, dict) else getattr(loc, "lat", 18.5204)
            lng = loc.get("lng") if isinstance(loc, dict) else getattr(loc, "lng", 73.8567)
            loc_name = loc.get("name", "Pune Hub") if isinstance(loc, dict) else getattr(loc, "name", "Pune Hub")

            stops_raw = vehicle_data.get("planned_stops", [])
            stops_json = [s if isinstance(s, dict) else s.model_dump() for s in stops_raw]

            payload = {
                "vehicle_id": vehicle_data.get("vehicle_id"),
                "name": vehicle_data.get("name", "RouteMates Fleet Vehicle"),
                "capacity": vehicle_data.get("capacity", 4),
                "occupied_seats": vehicle_data.get("occupied_seats", 0),
                "current_lat": lat,
                "current_lng": lng,
                "current_location_name": loc_name,
                "status": vehicle_data.get("status", "idle"),
                "heading_deg": vehicle_data.get("heading_deg", 0.0),
                "battery_pct": vehicle_data.get("battery_pct", 90),
                "route_polyline": vehicle_data.get("route_polyline", []),
                "planned_stops": stops_json,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }

            def _sync_upsert():
                return client.table("vehicles").upsert(payload, on_conflict="vehicle_id").execute()

            await self._run_in_thread(_sync_upsert)
            return True
        except Exception as exc:
            logger.warning("[Supabase] Failed to upsert vehicle: %s", exc)
            return False

    async def record_batch(
        self,
        window_id: int,
        interval_sec: int,
        threshold: int,
        status: str,
        queued_count: int,
        trigger_reason: Optional[str] = None,
        dispatched_at: Optional[str] = None
    ) -> bool:
        """Logs dispatch window progress and outcomes."""
        client = get_supabase_client()
        if not client:
            return False

        try:
            payload = {
                "window_id": window_id,
                "window_interval_sec": interval_sec,
                "batch_threshold": threshold,
                "status": status,
                "queued_request_count": queued_count,
                "trigger_reason": trigger_reason,
                "dispatched_at": dispatched_at or datetime.now(timezone.utc).isoformat()
            }

            def _sync_batch():
                return client.table("batches").upsert(payload, on_conflict="window_id").execute()

            await self._run_in_thread(_sync_batch)
            return True
        except Exception as exc:
            logger.warning("[Supabase] Failed to record batch: %s", exc)
            return False

    async def record_detour_audit(self, audit_data: Dict[str, Any]) -> bool:
        """Stores mathematical proof and compliance check for ≤ 15% Detour Cap."""
        client = get_supabase_client()
        if not client:
            return False

        try:
            payload = {
                "request_id": audit_data.get("request_id"),
                "passenger_id": audit_data.get("passenger_id", "RIDER"),
                "passenger_name": audit_data.get("passenger_name", "Passenger"),
                "vehicle_id": audit_data.get("vehicle_id"),
                "pickup_name": audit_data.get("pickup_name", "Pune"),
                "dropoff_name": audit_data.get("dropoff_name", "Pune"),
                "solo_eta_sec": audit_data.get("solo_eta_sec", 600),
                "solo_distance_km": audit_data.get("solo_distance_km", 5.0),
                "pooled_eta_sec": audit_data.get("pooled_eta_sec"),
                "pooled_distance_km": audit_data.get("pooled_distance_km"),
                "actual_detour_pct": audit_data.get("actual_detour_pct"),
                "max_allowable_detour_pct": audit_data.get("max_allowable_detour_pct", 15.0),
                "is_compliant": audit_data.get("is_compliant", True),
                "status": audit_data.get("status", "compliant_accepted"),
                "violation_reason": audit_data.get("violation_reason"),
                "mathematical_proof": audit_data.get("mathematical_proof", ""),
                "delay_margin_sec": audit_data.get("delay_margin_sec"),
            }

            def _sync_audit():
                return client.table("detour_audits").insert(payload).execute()

            await self._run_in_thread(_sync_audit)
            return True
        except Exception as exc:
            logger.warning("[Supabase] Failed to record detour audit: %s", exc)
            return False

    async def record_shapley_pool(self, pool_data: Dict[str, Any]) -> bool:
        """Saves game-theoretic Shapley value coalition matrix and player allocations."""
        client = get_supabase_client()
        if not client:
            return False

        try:
            payload = {
                "vehicle_id": pool_data.get("vehicle_id", "VEH-UNKNOWN"),
                "batch_id": pool_data.get("batch_id"),
                "request_ids": pool_data.get("request_ids", []),
                "grand_coalition_cost_inr": pool_data.get("grand_coalition_cost_inr", 0.0),
                "total_savings_inr": pool_data.get("total_savings_inr", 0.0),
                "player_allocations": pool_data.get("player_allocations", {}),
                "coalition_matrix": pool_data.get("coalition_matrix", []),
            }

            def _sync_pool():
                return client.table("shapley_pools").insert(payload).execute()

            await self._run_in_thread(_sync_pool)
            return True
        except Exception as exc:
            logger.warning("[Supabase] Failed to record Shapley pool: %s", exc)
            return False

db_repository = SupabaseRepository()
