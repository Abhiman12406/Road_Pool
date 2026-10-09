"""
Unit and Integration Tests for Issue 06:
Initial Buffer Window with Live Commuter Influx & Fast-Forward Solver.
"""
import pytest
from starlette.testclient import TestClient
from app.main import app
from app.services.simulation_engine import sim_engine

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_engine():
    sim_engine.set_engine_status('reset')
    yield
    sim_engine.set_engine_status('reset')

def test_default_buffer_window_countdown():
    """Verify that the initial buffer window defaults to 45s and decrements correctly."""
    assert sim_engine.state.engine.windowIntervalSec == 45
    assert sim_engine.state.engine.timeRemainingInWindowSec == 45
    assert sim_engine.state.engine.batchStatus == "intake_open"
    
    # Step forward 10s
    sim_engine.step_forward(10)
    assert sim_engine.state.engine.timeRemainingInWindowSec == 35

def test_candidate_commuter_influx_preserves_user_session():
    """
    Verify that when synthetic commuters join the rolling pool,
    the active passenger session is NOT overwritten.
    """
    # 1. User books a ride
    resp_user = client.post(
        "/api/v1/simulation/request",
        json={
            "pickup_name": "Shivajinagar Hub",
            "pickup_lat": 18.5314,
            "pickup_lng": 73.8446,
            "dropoff_name": "Baner Road",
            "dropoff_lat": 18.5590,
            "dropoff_lng": 73.7868,
            "party_size": 2,
            "solo_distance_km": 7.8,
            "solo_eta_sec": 720,
            "solo_fare_inr": 180.0,
            "passenger_name": "Elena Vance (Rider)"
        }
    )
    assert resp_user.status_code == 200
    user_req_id = resp_user.json()["request"]["request_id"]
    assert sim_engine.state.activePassengerSession.activeTripRequestId == user_req_id
    assert sim_engine.state.activePassengerSession.lifecycleStatus == "waiting_batch"
    
    # 2. Candidate commuters influx into the pool
    current_window = sim_engine.state.engine.currentWindowId
    initial_candidates = len([
        r for r in sim_engine.state.requests.values()
        if r.status == 'waiting_batch' and r.batch_id == current_window and r.request_id != user_req_id
    ])

    resp_demand = client.post("/api/v1/simulation/batch/generate-demand", json={"count": 2})
    assert resp_demand.status_code == 200
    
    # 3. Active passenger session still belongs to Elena Vance
    assert sim_engine.state.activePassengerSession.activeTripRequestId == user_req_id
    assert sim_engine.state.activePassengerSession.lifecycleStatus == "waiting_batch"
    
    # Candidate requests are in the current batch
    candidate_reqs = [
        r for r in sim_engine.state.requests.values()
        if r.status == 'waiting_batch' and r.batch_id == current_window and r.request_id != user_req_id
    ]
    assert len(candidate_reqs) == initial_candidates + 2

def test_fast_forward_dispatch_now():
    """Verify that Fast-Forward instantly locks the batch and triggers the solver."""
    # Add user request
    resp_user = client.post(
        "/api/v1/simulation/request",
        json={
            "pickup_name": "Swargate Junction",
            "pickup_lat": 18.5018,
            "pickup_lng": 73.8636,
            "dropoff_name": "Pune Railway Station",
            "dropoff_lat": 18.5289,
            "dropoff_lng": 73.8744,
            "party_size": 1,
            "solo_distance_km": 4.6,
            "solo_eta_sec": 540,
            "solo_fare_inr": 122.0
        }
    )
    user_req_id = resp_user.json()["request"]["request_id"]
    initial_window = sim_engine.state.engine.currentWindowId
    
    # Trigger Fast-Forward
    resp_dispatch = client.post("/api/v1/simulation/batch/dispatch-now")
    assert resp_dispatch.status_code == 200
    assert resp_dispatch.json()["status"] == "success"
    
    # Window should have advanced and user request processed
    assert sim_engine.state.engine.currentWindowId == initial_window + 1
    req = sim_engine.state.requests[user_req_id]
    assert req.status in ["matched", "rejected"]

def test_requeue_request_option():
    """Verify that a request can be re-queued into the active rolling window."""
    # Create request
    req = sim_engine.create_passenger_request(
        pickup_name="Kothrud Stand",
        pickup_lat=18.5074,
        pickup_lng=73.8077,
        dropoff_name="Viman Nagar Town Centre",
        dropoff_lat=18.5679,
        dropoff_lng=73.9143,
        party_size=1,
        solo_distance_km=14.5,
        solo_eta_sec=1500,
        solo_fare_inr=310.0,
        passenger_name="Elena Vance"
    )
    # Simulate a rejection
    req.status = "rejected"
    req.rejection_reason = "No compatible corridor vehicle available"
    sim_engine.state.activePassengerSession.lifecycleStatus = "no_match"
    
    # Call requeue API
    resp_requeue = client.post(f"/api/v1/simulation/request/{req.request_id}/requeue")
    assert resp_requeue.status_code == 200
    updated_req = resp_requeue.json()["request"]
    assert updated_req["status"] == "waiting_batch"
    assert updated_req["rejection_reason"] is None
    assert sim_engine.state.activePassengerSession.lifecycleStatus == "waiting_batch"

def test_switch_to_solo_ride_option():
    """Verify that rider can switch to an immediate solo ride at 0% detour."""
    req = sim_engine.create_passenger_request(
        pickup_name="Baner Road",
        pickup_lat=18.5590,
        pickup_lng=73.7868,
        dropoff_name="Hinjewadi IT Park Phase 1",
        dropoff_lat=18.5913,
        dropoff_lng=73.7389,
        party_size=1,
        solo_distance_km=8.2,
        solo_eta_sec=840,
        solo_fare_inr=185.0,
        passenger_name="Elena Vance"
    )
    req.status = "rejected"
    sim_engine.state.activePassengerSession.lifecycleStatus = "no_match"
    
    # Call solo dispatch API
    resp_solo = client.post(f"/api/v1/simulation/request/{req.request_id}/solo-dispatch")
    assert resp_solo.status_code == 200
    updated_req = resp_solo.json()["request"]
    assert updated_req["status"] == "matched"
    assert updated_req["detour_pct"] == 0.0
    assert updated_req["assigned_vehicle_id"] is not None
    assert updated_req["shapley_fare_inr"] == 185.0
    assert sim_engine.state.activePassengerSession.lifecycleStatus == "matched"
