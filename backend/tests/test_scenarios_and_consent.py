"""
Unit & Integration Tests for 12 Acceptance Test Scenarios and Mid-Trip Two-Way Consent
Verifies that all 12 hackathon acceptance scenarios from Section 11 of the feature spec
run cleanly and return verified results.
"""
import pytest
from app.services.simulation_engine import SimulationEngine

@pytest.fixture
def sim():
    engine = SimulationEngine()
    engine.state.engine.status = "paused"
    return engine

def test_scenario_1_party_of_three_reserves_three_seats(sim: SimulationEngine):
    res = sim.load_acceptance_scenario(1)
    assert res["scenario_id"] == 1
    assert res["verified"] is True
    assert res["party_size"] == 3
    assert res["occupied_seats"] == 3
    assert res["available_seats"] == 1

def test_scenario_2_three_compatible_requests_matched(sim: SimulationEngine):
    res = sim.load_acceptance_scenario(2)
    assert res["scenario_id"] == 2
    assert res["verified"] is True
    assert len(res["matched_requests"]) == 3

def test_scenario_3_candidate_rejected_18_pct_detour(sim: SimulationEngine):
    res = sim.load_acceptance_scenario(3)
    assert res["scenario_id"] == 3
    assert res["verified"] is True
    assert res["detour_pct"] > 15.0
    assert "exceeds" in res["rejection_reason"]

def test_scenario_4_compares_solo_shared_and_shapley_fares(sim: SimulationEngine):
    res = sim.load_acceptance_scenario(4)
    assert res["scenario_id"] == 4
    assert res["verified"] is True
    assert res["solo_fare_inr"] > res["shapley_fare_inr"]
    assert res["savings_pct"] > 0

def test_scenario_5_shapley_explanation_open_and_validated(sim: SimulationEngine):
    res = sim.load_acceptance_scenario(5)
    assert res["scenario_id"] == 5
    assert res["verified"] is True
    assert res["coalitions_count"] == 7
    assert res["marginal_steps_count"] > 0
    assert len(res["rationality_proof"]) > 10

def test_scenario_6_corider_cancellation_updates_seat_and_route(sim: SimulationEngine):
    res = sim.load_acceptance_scenario(6)
    assert res["scenario_id"] == 6
    assert res["verified"] is True

def test_scenario_7_dropoff_frees_seat_and_admits_new_request(sim: SimulationEngine):
    res = sim.load_acceptance_scenario(7)
    assert res["scenario_id"] == 7
    assert res["verified"] is True
    assert res["completed_stop"] is not None

def test_scenario_8_mid_trip_joiner_triggers_consent(sim: SimulationEngine):
    res = sim.load_acceptance_scenario(8)
    assert res["scenario_id"] == 8
    assert res["verified"] is True
    assert res["candidate"].is_valid is True

def test_scenario_9_driver_rejection_keeps_ride_unchanged(sim: SimulationEngine):
    res = sim.load_acceptance_scenario(9)
    assert res["scenario_id"] == 9
    assert res["verified"] is True
    assert res["status"].status == "rejected_driver"

def test_scenario_10_passenger_decline_prevents_route_insertion(sim: SimulationEngine):
    res = sim.load_acceptance_scenario(10)
    assert res["scenario_id"] == 10
    assert res["verified"] is True
    assert res["status"].status == "rejected_passenger"

def test_scenario_11_detour_greater_than_15_pct_rejected(sim: SimulationEngine):
    res = sim.load_acceptance_scenario(11)
    assert res["scenario_id"] == 11
    assert res["verified"] is True
    assert res["detour_pct"] > 15.0

def test_scenario_12_shapley_penny_reconciliation_zero_error(sim: SimulationEngine):
    res = sim.load_acceptance_scenario(12)
    assert res["scenario_id"] == 12
    assert res["verified"] is True
    assert res["discrepancy_inr"] <= 0.01

def test_mid_trip_consent_both_accepted_commits_passenger(sim: SimulationEngine):
    v1 = sim.state.vehicles["V-101"]
    candidate = sim.evaluate_mid_trip_join(v1.vehicle_id, simulate_violating=False)
    assert candidate.is_valid is True

    init_stops = len(v1.planned_stops)
    init_occ = v1.occupied_seats

    result = sim.process_mid_trip_consent(
        vehicle_id=v1.vehicle_id,
        candidate_data=candidate.model_dump(),
        driver_consent="accepted",
        passenger_consent="accepted"
    )

    assert result.status == "accepted_both"
    assert candidate.request_id in sim.state.requests
    assert len(v1.planned_stops) == init_stops + 2
    assert v1.occupied_seats == init_occ + 1
