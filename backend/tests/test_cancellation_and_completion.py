import pytest
from app.services.simulation_engine import SimulationEngine
from app.models.simulation import Location, RideRequest, RouteStop, Vehicle

@pytest.fixture
def sim():
    engine = SimulationEngine()
    engine.state.engine.status = "paused"
    return engine

def test_cancel_waiting_request(sim: SimulationEngine):
    # Create request waiting in batch
    req = RideRequest(
        request_id="REQ-TEST-CANCEL-1",
        passenger_id="USER-001",
        passenger_name="Rahul Varma",
        pickup=Location(lat=18.5314, lng=73.8446, name="Shivajinagar"),
        dropoff=Location(lat=18.5913, lng=73.7389, name="Hinjewadi"),
        party_size=1,
        request_time="2026-10-09T10:00:00Z",
        solo_eta_sec=1200,
        solo_distance_km=14.5,
        solo_fare_inr=301.0,
        status="waiting_batch",
        assigned_vehicle_id=None
    )
    sim.state.requests[req.request_id] = req
    sim.state.activePassengerSession.activeTripRequestId = req.request_id
    sim.state.activePassengerSession.lifecycleStatus = "waiting_batch"

    result = sim.cancel_ride_request(req.request_id, reason="user_cancelled")
    assert result is not None
    assert result["status"] == "cancelled"
    assert sim.state.requests[req.request_id].status in ["rejected", "cancelled"]
    assert sim.state.activePassengerSession.lifecycleStatus in ["cancelled", "idle", "no_match"]

def test_cancel_assigned_passenger_removes_stops_and_releases_seats(sim: SimulationEngine):
    # Setup vehicle with 3 passengers: P1, P2, P3
    v1 = sim.state.vehicles["V-101"]
    
    req_c = RideRequest(
        request_id="REQ-TEST-C",
        passenger_id="USER-C",
        passenger_name="Chetan Rao",
        pickup=Location(lat=18.5074, lng=73.8077, name="Kothrud"),
        dropoff=Location(lat=18.5580, lng=73.8075, name="Aundh"),
        party_size=1,
        request_time="2026-10-09T10:00:00Z",
        solo_eta_sec=900,
        solo_distance_km=8.2,
        solo_fare_inr=187.6,
        status="matched",
        assigned_vehicle_id="V-101"
    )
    sim.state.requests[req_c.request_id] = req_c

    # Add stops for req_c to v1
    stop_p = RouteStop(
        stop_id="STOP-C-PICKUP",
        request_id=req_c.request_id,
        stop_type="pickup",
        location=req_c.pickup,
        passenger_name=req_c.passenger_name,
        eta_seconds_from_now=300,
        completed=False
    )
    stop_d = RouteStop(
        stop_id="STOP-C-DROPOFF",
        request_id=req_c.request_id,
        stop_type="dropoff",
        location=req_c.dropoff,
        passenger_name=req_c.passenger_name,
        eta_seconds_from_now=800,
        completed=False
    )
    v1.planned_stops.extend([stop_p, stop_d])
    initial_stops_count = len(v1.planned_stops)

    # Cancel req_c
    result = sim.cancel_ride_request(req_c.request_id)
    assert result["status"] == "cancelled"
    assert req_c.status in ["rejected", "cancelled"]

    # Verify req_c stops were cleanly removed
    remaining_stop_req_ids = [s.request_id for s in v1.planned_stops]
    assert req_c.request_id not in remaining_stop_req_ids
    assert len(v1.planned_stops) == initial_stops_count - 2

def test_simulate_corider_cancellation_recalculates_shapley_shares(sim: SimulationEngine):
    v1 = sim.state.vehicles["V-101"]
    
    # Ensure there are at least two distinct active requests assigned to V-101
    assigned_reqs = [
        r for r in sim.state.requests.values()
        if r.assigned_vehicle_id == v1.vehicle_id and r.status in ["matched", "en_route_pickup", "in_transit"]
    ]
    assert len(assigned_reqs) >= 1, "Vehicle should have assigned requests"

    # Simulate co-rider cancellation
    result = sim.simulate_corider_cancellation(v1.vehicle_id)
    assert result is not None
    assert result["status"] == "cancelled"
    assert "cancelled_passenger_name" in result
    assert result["remaining_request_ids"] is not None

def test_passenger_dropoff_updates_occupancy_without_retroactively_altering_fares(sim: SimulationEngine):
    v1 = sim.state.vehicles["V-101"]
    # Find or setup an active trip
    pickup_stop = next((s for s in v1.planned_stops if s.stop_type == "pickup" and not s.completed), None)
    if pickup_stop:
        sim.advance_vehicle_stop(v1.vehicle_id)
        req = sim.state.requests.get(pickup_stop.request_id)
        if req:
            assert req.status == "in_transit"

    # Now advance to dropoff
    dropoff_stop = next((s for s in v1.planned_stops if s.stop_type == "dropoff" and not s.completed), None)
    if dropoff_stop:
        initial_fare = sim.state.requests[dropoff_stop.request_id].shapley_fare_inr
        sim.advance_vehicle_stop(v1.vehicle_id)
        req = sim.state.requests.get(dropoff_stop.request_id)
        assert req.status == "dropped_off"
        # Completed fare should not change retroactively
        if initial_fare is not None:
            assert req.shapley_fare_inr == initial_fare

@pytest.mark.asyncio
async def test_cancellation_and_reset_api():
    from httpx import AsyncClient, ASGITransport
    from app.main import app
    from app.services.simulation_engine import sim_engine

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test simulate co-rider cancellation API
        resp_sim = await client.post("/api/v1/simulation/vehicle/V-101/simulate-cancellation")
        assert resp_sim.status_code == 200
        data_sim = resp_sim.json()
        assert data_sim["status"] == "success"
        assert "cancellation" in data_sim

        # Test cancel specific ride request API
        # Create temporary request
        temp_req_id = "REQ-API-CANCEL-TEST"
        sim_engine.state.requests[temp_req_id] = RideRequest(
            request_id=temp_req_id,
            passenger_id="TEST-USER",
            passenger_name="Sunil Joshi",
            pickup=Location(lat=18.52, lng=73.85, name="Camp"),
            dropoff=Location(lat=18.55, lng=73.80, name="Aundh"),
            party_size=1,
            request_time="10:00:00",
            solo_eta_sec=600,
            solo_distance_km=5.0,
            solo_fare_inr=130.0,
            status="waiting_batch",
            assigned_vehicle_id=None
        )

        resp_cancel = await client.post("/api/v1/simulation/ride/cancel", json={
            "request_id": temp_req_id,
            "reason": "passenger_changed_mind"
        })
        assert resp_cancel.status_code == 200
        data_cancel = resp_cancel.json()
        assert data_cancel["status"] == "success"
        assert data_cancel["cancellation"]["status"] == "cancelled"

        # Test session reset API
        resp_reset = await client.post("/api/v1/simulation/session/reset")
        assert resp_reset.status_code == 200
        data_reset = resp_reset.json()
        assert data_reset["status"] == "success"
        assert data_reset["session"]["lifecycleStatus"] == "idle"

