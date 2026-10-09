"""
Unit and Integration Tests for Dynamic Sliding-Window Batching Engine
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.simulation_engine import sim_engine

@pytest.fixture(autouse=True)
def reset_simulation_state():
    """Resets simulation engine to clean state before each test."""
    sim_engine.set_engine_status('reset')

def test_default_batching_configuration():
    assert sim_engine.state.engine.windowIntervalSec in [15, 30, 45]
    assert sim_engine.state.engine.batchThreshold == 6
    assert sim_engine.state.engine.currentWindowId >= 101
    assert sim_engine.state.engine.batchStatus == "intake_open"

def test_mid_window_request_queuing_without_dropping():
    initial_count = len(sim_engine.state.requests)
    
    # Add a mid-window request
    req1 = sim_engine.create_passenger_request(
        pickup_name="Swargate Junction",
        pickup_lat=18.5018,
        pickup_lng=73.8636,
        dropoff_name="Pune Railway Station",
        dropoff_lat=18.5289,
        dropoff_lng=73.8744,
        party_size=1,
        solo_distance_km=4.8,
        solo_eta_sec=600,
        solo_fare_inr=126.0,
        passenger_name="Pooja P."
    )
    
    assert req1.status == "waiting_batch"
    assert req1.batch_id == sim_engine.state.engine.currentWindowId
    assert len(sim_engine.state.requests) == initial_count + 1
    assert req1.request_id in sim_engine.state.requests

def test_threshold_trigger_locks_and_dispatches_batch():
    # Set threshold relative to initial state so req1 queues, and req2 triggers
    current_queued = sim_engine.state.engine.queuedRequestCount
    sim_engine.configure_batching(window_interval_sec=30, batch_threshold=current_queued + 2)
    start_window = sim_engine.state.engine.currentWindowId
    
    # Request 1: intake remains open
    req1 = sim_engine.create_passenger_request(
        pickup_name="Kothrud Stand",
        pickup_lat=18.5074,
        pickup_lng=73.8077,
        dropoff_name="Shivajinagar Hub",
        dropoff_lat=18.5314,
        dropoff_lng=73.8446,
        party_size=1,
        solo_distance_km=6.2,
        solo_eta_sec=780,
        solo_fare_inr=155.0,
        passenger_name="Rohan J."
    )
    assert req1.status == "waiting_batch"
    
    # Request 2: reaches threshold (2 requests) -> triggers immediate dispatch and advances window!
    req2 = sim_engine.create_passenger_request(
        pickup_name="Baner Road",
        pickup_lat=18.5590,
        pickup_lng=73.7868,
        dropoff_name="Hinjewadi IT Park Phase 1",
        dropoff_lat=18.5913,
        dropoff_lng=73.7389,
        party_size=1,
        solo_distance_km=8.5,
        solo_eta_sec=900,
        solo_fare_inr=190.0,
        passenger_name="Anita K."
    )
    
    # Active window should have advanced
    assert sim_engine.state.engine.currentWindowId == start_window + 1
    # Requests from previous batch should have been dispatched / admitted
    assert sim_engine.state.requests[req1.request_id].status in ["matched", "en_route_pickup", "in_transit"]
    assert sim_engine.state.requests[req2.request_id].status in ["matched", "en_route_pickup", "in_transit"]

def test_timer_expiration_trigger():
    start_window = sim_engine.state.engine.currentWindowId
    
    # Step past the window duration
    sim_engine.step_forward(seconds=sim_engine.state.engine.windowIntervalSec + 5)
    
    # Window ID should have incremented
    assert sim_engine.state.engine.currentWindowId > start_window
    assert sim_engine.state.engine.timeRemainingInWindowSec > 0

def test_no_double_processing_of_admitted_requests():
    req = sim_engine.create_passenger_request(
        pickup_name="Viman Nagar Town Centre",
        pickup_lat=18.5679,
        pickup_lng=73.9143,
        dropoff_name="Shivajinagar Hub",
        dropoff_lat=18.5314,
        dropoff_lng=73.8446,
        party_size=1,
        solo_distance_km=9.8,
        solo_eta_sec=1100,
        solo_fare_inr=210.0,
        passenger_name="Siddharth M."
    )
    
    # Force dispatch
    sim_engine.lock_and_dispatch_batch(trigger_reason="manual_dispatch")
    assert sim_engine.state.requests[req.request_id].status != "waiting_batch"
    
    # Running dispatch again should not double process or duplicate req
    sim_engine.lock_and_dispatch_batch(trigger_reason="manual_dispatch")
    assert len([r for r in sim_engine.state.requests.values() if r.request_id == req.request_id]) == 1

@pytest.mark.asyncio
async def test_api_batch_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Configure batching
        resp_cfg = await client.post(
            "/api/v1/simulation/batch/configure",
            json={"window_interval_sec": 20, "batch_threshold": 4}
        )
        assert resp_cfg.status_code == 200
        assert resp_cfg.json()["windowIntervalSec"] == 20
        assert resp_cfg.json()["batchThreshold"] == 4
        
        # 2. Generate synthetic demand
        resp_demand = await client.post(
            "/api/v1/simulation/batch/generate-demand",
            json={"count": 2}
        )
        assert resp_demand.status_code == 200
        data = resp_demand.json()
        assert len(data["generated_requests"]) == 2
        
        # 3. Manual Process Batch Now
        resp_dispatch = await client.post("/api/v1/simulation/batch/dispatch-now")
        assert resp_dispatch.status_code == 200
        assert resp_dispatch.json()["status"] == "success"
