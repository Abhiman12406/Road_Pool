"""
Unit and integration tests for Issue 05:
Booking Form Capacity Enforcement, Multi-Passenger Stepper, and Timing Constraints.
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

def test_booking_valid_party_sizes():
    """Verify that party sizes between 1 and 4 are accepted and stored correctly."""
    for party_size in [1, 2, 3, 4]:
        resp = client.post(
            "/api/v1/simulation/request",
            json={
                "pickup_name": "Shivajinagar Hub",
                "pickup_lat": 18.5314,
                "pickup_lng": 73.8446,
                "dropoff_name": "Hinjewadi IT Park Phase 1",
                "dropoff_lat": 18.5913,
                "dropoff_lng": 73.7389,
                "party_size": party_size,
                "solo_distance_km": 14.2,
                "solo_eta_sec": 1200,
                "solo_fare_inr": 295.0,
                "passenger_name": f"Rider Group of {party_size}",
                "preferred_pickup_time": "10:30 AM",
                "arrival_deadline": "11:15 AM",
                "special_requirements": "Luggage Space"
            }
        )
        assert resp.status_code == 200, f"Party size {party_size} should be accepted"
        data = resp.json()
        assert data["status"] == "success"
        req = data["request"]
        assert req["party_size"] == party_size
        assert req["preferred_pickup_time"] == "10:30 AM"
        assert req["arrival_deadline"] == "11:15 AM"
        assert req["special_requirements"] == "Luggage Space"

def test_booking_invalid_party_size_rejected():
    """Verify that party size < 1 or > 4 is rejected with HTTP 400 and explanation."""
    for invalid_size in [0, -1, 5, 6]:
        resp = client.post(
            "/api/v1/simulation/request",
            json={
                "pickup_name": "Swargate Junction",
                "pickup_lat": 18.5018,
                "pickup_lng": 73.8636,
                "dropoff_name": "Pune Railway Station",
                "dropoff_lat": 18.5289,
                "dropoff_lng": 73.8744,
                "party_size": invalid_size,
                "solo_distance_km": 4.6,
                "solo_eta_sec": 540,
                "solo_fare_inr": 122.0
            }
        )
        assert resp.status_code == 400
        assert "Party size must be between 1 and 4 seats" in resp.json()["detail"]

def test_booking_three_passengers_reserves_three_seats():
    """Verify that a booking of 3 passengers reserves 3 seats in the intake pool."""
    resp = client.post(
        "/api/v1/simulation/request",
        json={
            "pickup_name": "Kothrud Stand",
            "pickup_lat": 18.5074,
            "pickup_lng": 73.8077,
            "dropoff_name": "Viman Nagar Town Centre",
            "dropoff_lat": 18.5679,
            "dropoff_lng": 73.9143,
            "party_size": 3,
            "solo_distance_km": 14.5,
            "solo_eta_sec": 1500,
            "solo_fare_inr": 310.0,
            "passenger_name": "Elena Vance & Colleagues"
        }
    )
    assert resp.status_code == 200
    state = sim_engine.state
    # Check that queuedSeatsCount reflects the 3 seats
    assert state.engine.queuedSeatsCount >= 3
    # Check that the request itself recorded party_size = 3
    req_id = resp.json()["request"]["request_id"]
    assert state.requests[req_id].party_size == 3
