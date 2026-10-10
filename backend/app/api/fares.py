"""
Fares and Shapley Fair-Fare Receipt API Endpoints
Provides explainable game-theoretic cost allocations and receipts for individual requests.
"""
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from app.services.simulation_engine import sim_engine
from app.services.shapley_service import shapley_engine
from app.models.simulation import Location, RideRequest

router = APIRouter(prefix="/fares", tags=["Fares & Receipts"])

class FarePreviewCommand(BaseModel):
    pickup_lat: float
    pickup_lng: float
    pickup_name: Optional[str] = "Pickup"
    dropoff_lat: float
    dropoff_lng: float
    dropoff_name: Optional[str] = "Destination"
    party_size: int = 1
    solo_fare_inr: Optional[float] = None
    solo_distance_km: Optional[float] = None
    solo_eta_sec: Optional[int] = None

@router.post("/preview")
async def preview_dynamic_fare_and_shapley(cmd: FarePreviewCommand):
    """
    Computes upfront dynamic Shapley fair-fare breakdown, 7-coalition matrix,
    and marginal contributions for any origin-destination route before booking.
    """
    solo_dist = cmd.solo_distance_km or 10.0
    solo_eta = cmd.solo_eta_sec or 900
    solo_fare = cmd.solo_fare_inr or round(50.0 + (solo_dist * 18.0) + ((solo_eta / 60.0) * 2.0), 2)

    preview_req = RideRequest(
        request_id="REQ-PREVIEW",
        passenger_id="PAX-PREVIEW",
        passenger_name="Elena Vance (Rider)",
        pickup=Location(lat=cmd.pickup_lat, lng=cmd.pickup_lng, name=cmd.pickup_name or "Pickup"),
        dropoff=Location(lat=cmd.dropoff_lat, lng=cmd.dropoff_lng, name=cmd.dropoff_name or "Dropoff"),
        party_size=cmd.party_size,
        batch_id=sim_engine.state.engine.currentWindowId,
        request_time="Now",
        solo_eta_sec=solo_eta,
        solo_distance_km=solo_dist,
        solo_fare_inr=solo_fare,
        status="waiting_batch",
        assigned_vehicle_id=None,
        pooled_eta_sec=int(solo_eta * 1.08),
        detour_pct=8.0,
        shapley_fare_inr=round(solo_fare * 0.75, 2),
    )

    other_candidates = [
        r for r in sim_engine.state.requests.values()
        if r.status in ['waiting_batch', 'matched', 'en_route_pickup', 'in_transit']
    ][:2]

    eval_cohort = [preview_req] + other_candidates
    veh = list(sim_engine.state.vehicles.values())[0]

    try:
        pool_res = shapley_engine.compute_shapley_for_pool(
            requests=eval_cohort,
            vehicle=veh,
            batch_id=sim_engine.state.engine.currentWindowId,
        )
        return {
            "status": "success",
            "request_id": "REQ-PREVIEW",
            "explanation": pool_res.rider_explanations.get("REQ-PREVIEW"),
            "pool": pool_res,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate Shapley preview: {str(e)}")

@router.get("/{request_id}")
async def get_fare_explanation_and_receipt(request_id: str):
    """
    Returns the complete game-theoretic Shapley value breakdown, 7-coalition matrix,
    marginal contribution tree, and penny-level reconciliation receipt for a passenger.
    """
    effective_req_id = request_id
    if request_id in ["preview", "active", "current", "latest"]:
        effective_req_id = sim_engine.state.activePassengerSession.activeTripRequestId or list(sim_engine.state.requests.keys())[0]

    explanation_bundle = sim_engine.get_shapley_explanation_for_request(effective_req_id)
    if not explanation_bundle or not explanation_bundle.get("explanation"):
        # Fallback to the active rider's request or first request
        fallback_id = sim_engine.state.activePassengerSession.activeTripRequestId or (list(sim_engine.state.requests.keys())[0] if sim_engine.state.requests else None)
        if fallback_id and fallback_id != effective_req_id:
            explanation_bundle = sim_engine.get_shapley_explanation_for_request(fallback_id)
            effective_req_id = fallback_id

    if not explanation_bundle or not explanation_bundle.get("explanation"):
        raise HTTPException(
            status_code=404,
            detail=f"Fare explanation for request '{request_id}' not found. Please ensure request exists."
        )

    return {
        "status": "success",
        "request_id": effective_req_id,
        "explanation": explanation_bundle["explanation"],
        "pool": explanation_bundle["pool"],
    }
