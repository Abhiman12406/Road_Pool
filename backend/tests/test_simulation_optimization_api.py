"""
Tests for Route Optimization & Detour Guarantee API and Simulation Dispatch Integration
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.simulation_engine import sim_engine

@pytest.fixture(autouse=True)
def reset_engine():
    sim_engine.set_engine_status('reset')

@pytest.mark.asyncio
async def test_batch_dispatch_runs_optimization_and_produces_audits():
    """
    When batch dispatches, RouteOptimizationService executes and populates
    optimizationResult and detourAudits in state and snapshot.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Add 2 requests along the corridor
        sim_engine.create_passenger_request(
            pickup_name="Shivajinagar Hub",
            pickup_lat=18.5314,
            pickup_lng=73.8446,
            dropoff_name="Baner Road",
            dropoff_lat=18.5590,
            dropoff_lng=73.7868,
            party_size=1,
            solo_distance_km=7.5,
            solo_eta_sec=720,
            solo_fare_inr=180.0,
            passenger_name="Corridor Rider 1"
        )

        sim_engine.create_passenger_request(
            pickup_name="Aundh Parihar Chowk",
            pickup_lat=18.5580,
            pickup_lng=73.8075,
            dropoff_name="Baner Road",
            dropoff_lat=18.5590,
            dropoff_lng=73.7868,
            party_size=1,
            solo_distance_km=3.5,
            solo_eta_sec=360,
            solo_fare_inr=90.0,
            passenger_name="Corridor Rider 2"
        )

        # Dispatch batch
        resp_dispatch = await client.post("/api/v1/simulation/batch/dispatch-now")
        assert resp_dispatch.status_code == 200

        # Query optimization endpoint
        resp_opt = await client.get("/api/v1/simulation/optimization")
        assert resp_opt.status_code == 200
        opt_data = resp_opt.json()
        assert "vehicle_plans" in opt_data
        assert "detour_audits" in opt_data
        assert "average_detour_pct" in opt_data
        assert opt_data["average_detour_pct"] <= 15.0

        # Query detour guarantees endpoint
        resp_detour = await client.get("/api/v1/simulation/detour-guarantees")
        assert resp_detour.status_code == 200
        detour_data = resp_detour.json()
        assert "audits" in detour_data
        assert len(detour_data["audits"]) >= 2
        # Check audit fields
        first_audit = detour_data["audits"][0]
        assert "mathematical_proof" in first_audit
        assert "is_compliant" in first_audit
        assert "max_allowable_detour_pct" in first_audit
        assert first_audit["max_allowable_detour_pct"] == 15.0

@pytest.mark.asyncio
async def test_on_demand_solve_endpoint():
    """
    POST /api/v1/simulation/optimization/solve executes on-demand optimization.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/simulation/optimization/solve",
            json={"max_detour_pct": 15.0}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "solver_used" in data
        assert "vehicle_plans" in data
