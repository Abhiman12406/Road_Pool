"""
Data models for Pune routing, landmark catalogs, and solo fare estimation.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class LocationInput(BaseModel):
    lat: float
    lng: float
    name: str = "Pune Location"

class DirectRouteRequest(BaseModel):
    origin: LocationInput
    destination: LocationInput
    party_size: int = Field(default=1, ge=1, le=4)

class FareBreakdown(BaseModel):
    base_fare: float
    distance_fare: float
    time_fare: float
    total_solo_fare: float
    currency: str = "INR"
    currency_symbol: str = "₹"

class DirectRouteResponse(BaseModel):
    origin: LocationInput
    destination: LocationInput
    distance_km: float
    duration_sec: int
    duration_min: float
    polyline: List[List[float]]  # List of [lat, lng] coordinates for Leaflet
    solo_fare_inr: float
    fare_breakdown: FareBreakdown
    provider: Literal['osrm', 'pune_calibrated_fallback']
    cached: bool = False
    estimated_pooled_fare_inr: float
    estimated_pooled_savings_inr: float
    max_detour_cap_pct: float = 15.0
    max_detour_buffer_min: float

class PuneLandmark(BaseModel):
    id: str
    name: str
    category: str
    lat: float
    lng: float
    description: str
