"""
Unit & Integration Tests for Pune Hybrid Router & Solo Fare Estimator
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import settings
from app.services.router_service import (
    calculate_solo_fare,
    pune_calibrated_route,
    router_service,
    PUNE_LANDMARKS
)
from app.models.routing import LocationInput, DirectRouteRequest

def test_fare_calculation_formula():
    # 10.0 km and 20.0 minutes
    # Base: 40.0, Distance: 10 * 18.0 = 180.0, Time: 20 * 2.5 = 50.0 -> Total: 270.0
    fare, breakdown = calculate_solo_fare(distance_km=10.0, duration_sec=1200)
    assert fare == 270.0
    assert breakdown.base_fare == 40.0
    assert breakdown.distance_fare == 180.0
    assert breakdown.time_fare == 50.0
    assert breakdown.total_solo_fare == 270.0
    assert breakdown.currency == "INR"

def test_pune_calibrated_fallback_metrics():
    # Test between Shivajinagar and Hinjewadi
    origin = LocationInput(lat=18.5314, lng=73.8446, name="Shivajinagar Hub")
    dest = LocationInput(lat=18.5913, lng=73.7389, name="Hinjewadi IT Park Phase 1")
    
    result = pune_calibrated_route(origin, dest)
    
    # Distance between Shivajinagar and Hinjewadi is ~15-18 km by road
    assert 13.0 <= result["distance_km"] <= 22.0
    # Travel duration should be realistic for Pune (around 20-30 km/h avg speed)
    assert 1200 <= result["duration_sec"] <= 3600
    # Polyline should be non-empty list of [lat, lng] pairs
    assert len(result["polyline"]) >= 5
    assert result["polyline"][0] == [origin.lat, origin.lng]
    assert result["polyline"][-1] == [dest.lat, dest.lng]

def test_pune_landmarks_catalog():
    landmarks = router_service.get_landmarks()
    assert len(landmarks) >= 6
    names = [lm.name for lm in landmarks]
    assert any("Shivajinagar" in name for name in names)
    assert any("Hinjewadi" in name for name in names)
    assert any("Swargate" in name for name in names)
    assert any("Kothrud" in name for name in names)
    assert any("Viman Nagar" in name for name in names)

@pytest.mark.asyncio
async def test_router_service_cache_and_fallback():
    origin = LocationInput(lat=18.5018, lng=73.8636, name="Swargate Junction")
    dest = LocationInput(lat=18.5679, lng=73.9143, name="Viman Nagar Town Centre")
    
    # Force fallback simulation to test reliable deterministic behavior
    route1 = await router_service.get_route(origin, dest, force_fallback=True)
    assert route1.provider == "pune_calibrated_fallback"
    assert route1.distance_km > 0
    assert route1.duration_sec > 0
    assert route1.solo_fare_inr > 40.0
    assert route1.estimated_pooled_fare_inr < route1.solo_fare_inr
    assert route1.max_detour_cap_pct == 15.0
    assert route1.cached is False
    
    # Query again with same coordinates - should hit in-memory cache
    route2 = await router_service.get_route(origin, dest, force_fallback=True)
    assert route2.cached is True
    assert route2.distance_km == route1.distance_km

@pytest.mark.asyncio
async def test_api_landmarks_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/routing/landmarks")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 6
        assert "name" in data[0]
        assert "lat" in data[0]
        assert "lng" in data[0]

@pytest.mark.asyncio
async def test_api_direct_route_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "origin": {"lat": 18.5314, "lng": 73.8446, "name": "Shivajinagar Hub"},
            "destination": {"lat": 18.5913, "lng": 73.7389, "name": "Hinjewadi IT Park Phase 1"},
            "party_size": 1
        }
        resp = await client.post("/api/v1/routing/direct-route", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "distance_km" in data
        assert "duration_sec" in data
        assert "duration_min" in data
        assert "solo_fare_inr" in data
        assert "fare_breakdown" in data
        assert "polyline" in data
        assert len(data["polyline"]) >= 2
        assert data["solo_fare_inr"] > 40.0
        assert data["max_detour_cap_pct"] == 15.0

@pytest.mark.asyncio
async def test_api_identical_origin_destination_validation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "origin": {"lat": 18.5314, "lng": 73.8446, "name": "Shivajinagar Hub"},
            "destination": {"lat": 18.5314, "lng": 73.8446, "name": "Shivajinagar Hub"},
            "party_size": 1
        }
        resp = await client.post("/api/v1/routing/direct-route", json=payload)
        assert resp.status_code == 400
        assert "distinct" in resp.json()["detail"].lower()
