"""
API Endpoints for Pune Hybrid Routing and Solo Fare Estimation
"""
import math
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.models.routing import (
    DirectRouteRequest,
    DirectRouteResponse,
    PuneLandmark,
)
from app.services.router_service import router_service, haversine_km

router = APIRouter(prefix="/routing", tags=["Routing"])

@router.get("/landmarks", response_model=List[PuneLandmark])
async def get_pune_landmarks():
    """Returns curated Pune transit hubs, IT parks, and landmark stations."""
    return router_service.get_landmarks()

@router.post("/direct-route", response_model=DirectRouteResponse)
async def calculate_direct_route(
    req: DirectRouteRequest,
    force_fallback: Optional[bool] = Query(default=False, description="Simulate OSRM failover to calibrated Pune model")
):
    """
    Computes direct road route, travel time, and solo reference metrics.
    Validates distinct origin/destination, queries live OSRM with caching,
    and seamlessly falls back to calibrated Pune urban model if offline.
    """
    # Check if origin and destination are virtually identical (< 100m)
    dist_km = haversine_km(
        req.origin.lat, req.origin.lng, req.destination.lat, req.destination.lng
    )
    if dist_km < 0.1:
        raise HTTPException(
            status_code=400,
            detail="Origin and destination must be distinct Pune locations (> 100m apart)."
        )

    response = await router_service.get_route(
        origin=req.origin,
        destination=req.destination,
        party_size=req.party_size,
        force_fallback=bool(force_fallback),
    )
    return response
