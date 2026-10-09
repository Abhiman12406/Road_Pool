"""
TDD Suite: Core Route Optimization & Strict <=15% Detour Validator
Tests for RouteOptimizationService (Greedy Insertion + OR-Tools + Detour Guarantee Validator).
"""
import pytest
from app.models.simulation import Vehicle, Location, RideRequest, RouteStop
from app.services.route_optimizer import (
    RouteOptimizationService,
    compute_detour_pct,
    format_mathematical_proof,
)

@pytest.fixture
def optimizer():
    return RouteOptimizationService()

def test_compute_detour_pct_and_formula():
    """Detour = ((T_pooled - T_solo) / T_solo) * 100%"""
    # 0% detour when pooled matches solo
    assert compute_detour_pct(600, 600) == 0.0
    
    # 10% detour: (660 - 600) / 600 * 100 = 10.0%
    assert compute_detour_pct(600, 660) == 10.0
    
    # 15% detour: exact boundary
    assert compute_detour_pct(600, 690) == 15.0
    
    # 16.67% detour: over limit
    assert round(compute_detour_pct(600, 700), 2) == 16.67


def test_format_mathematical_proof_compliant_and_violation():
    """Generates auditable mathematical proof strings."""
    proof_ok = format_mathematical_proof(
        solo_sec=600,
        pooled_sec=660,
        detour_pct=10.0,
        is_compliant=True,
        cap_pct=15.0
    )
    assert "10.00% <= 15.00%" in proof_ok
    assert "COMPLIANT" in proof_ok
    assert "T_solo = 600s" in proof_ok
    assert "T_pooled = 660s" in proof_ok

    proof_violation = format_mathematical_proof(
        solo_sec=600,
        pooled_sec=720,
        detour_pct=20.0,
        is_compliant=False,
        cap_pct=15.0
    )
    assert "20.00% > 15.00%" in proof_violation
    assert "REJECTED" in proof_violation


def test_solver_enforces_pickup_before_dropoff_precedence(optimizer):
    """
    Solver must place pickup strictly before dropoff in the stop sequence.
    """
    v1 = Vehicle(
        vehicle_id="V-101",
        name="Tata Nexon EV",
        capacity=4,
        occupied_seats=0,
        current_location=Location(lat=18.5204, lng=73.8567, name="FC Road"),
        status="idle",
        planned_stops=[]
    )

    req1 = RideRequest(
        request_id="REQ-TEST-1",
        passenger_id="PAX-1",
        passenger_name="Aarav Sharma",
        pickup=Location(lat=18.5314, lng=73.8446, name="Shivajinagar Hub"),
        dropoff=Location(lat=18.5590, lng=73.7868, name="Baner Road"),
        party_size=1,
        request_time="18:00:00",
        solo_eta_sec=720,
        solo_distance_km=7.5,
        solo_fare_inr=175.0,
        status="waiting_batch"
    )

    result = optimizer.optimize_and_validate_routes(
        vehicles=[v1],
        requests=[req1],
        max_detour_pct=15.0
    )

    assert req1.request_id in result.accepted_request_ids
    plan = result.vehicle_plans["V-101"]
    assert len(plan.stops) == 2
    
    # Precedence check: pickup must precede dropoff
    pickup_idx = next(i for i, s in enumerate(plan.stops) if s.stop_type == "pickup")
    dropoff_idx = next(i for i, s in enumerate(plan.stops) if s.stop_type == "dropoff")
    assert pickup_idx < dropoff_idx


def test_solver_enforces_vehicle_capacity_limit(optimizer):
    """
    Candidate insertions exceeding vehicle capacity must be rejected.
    """
    v1 = Vehicle(
        vehicle_id="V-CAP",
        name="Small EV",
        capacity=2,
        occupied_seats=2,
        current_location=Location(lat=18.5204, lng=73.8567, name="FC Road"),
        status="full",
        planned_stops=[
            RouteStop(
                stop_id="S-EX-1",
                request_id="REQ-EXISTING",
                stop_type="dropoff",
                location=Location(lat=18.5590, lng=73.7868, name="Baner Road"),
                passenger_name="Existing Passenger",
                eta_seconds_from_now=600,
                completed=False
            )
        ]
    )

    # New request requiring 1 seat, but vehicle already has 2 seats occupied until dropoff
    req_overflow = RideRequest(
        request_id="REQ-OVERFLOW",
        passenger_id="PAX-O",
        passenger_name="Overflow Rider",
        pickup=Location(lat=18.5250, lng=73.8500, name="Near FC Road"),
        dropoff=Location(lat=18.5500, lng=73.8000, name="Aundh"),
        party_size=1,
        request_time="18:01:00",
        solo_eta_sec=400,
        solo_distance_km=4.0,
        solo_fare_inr=100.0,
        status="waiting_batch"
    )

    result = optimizer.optimize_and_validate_routes(
        vehicles=[v1],
        requests=[req_overflow],
        max_detour_pct=15.0
    )

    assert req_overflow.request_id in result.rejected_request_ids
    audit = next(a for a in result.detour_audits if a.request_id == req_overflow.request_id)
    assert not audit.is_compliant
    assert audit.status == "capacity_rejected" or "capacity" in audit.violation_reason.lower()


def test_strict_15_percent_detour_rejection_and_audit(optimizer):
    """
    Candidate insertions that would cause > 15.0% detour are rejected
    with explicit mathematical explanation and proof.
    """
    # Vehicle is driving from Shivajinagar to Baner (West)
    v1 = Vehicle(
        vehicle_id="V-101",
        name="Tata Nexon EV",
        capacity=4,
        occupied_seats=1,
        current_location=Location(lat=18.5314, lng=73.8446, name="Shivajinagar Hub"),
        status="en_route",
        planned_stops=[
            RouteStop(
                stop_id="S-1",
                request_id="REQ-EXISTING-1",
                stop_type="dropoff",
                location=Location(lat=18.5590, lng=73.7868, name="Baner Road"),
                passenger_name="Aarav Sharma",
                eta_seconds_from_now=700,
                completed=False
            )
        ]
    )

    # Request located far away to the South-East (Hadapsar to Swargate),
    # which would force a massive detour on this vehicle route
    req_detour_violation = RideRequest(
        request_id="REQ-DETOUR-VIOLATION",
        passenger_id="PAX-FAR",
        passenger_name="Suresh Patil",
        pickup=Location(lat=18.4967, lng=73.9284, name="Hadapsar Gadital"),
        dropoff=Location(lat=18.5018, lng=73.8636, name="Swargate Junction"),
        party_size=1,
        request_time="18:05:00",
        solo_eta_sec=500,
        solo_distance_km=4.5,
        solo_fare_inr=115.0,
        status="waiting_batch"
    )

    result = optimizer.optimize_and_validate_routes(
        vehicles=[v1],
        requests=[req_detour_violation],
        max_detour_pct=15.0
    )

    assert req_detour_violation.request_id in result.rejected_request_ids
    audit = next(a for a in result.detour_audits if a.request_id == req_detour_violation.request_id)
    assert audit.is_compliant is False
    assert audit.status == "violation_rejected"
    assert "> 15.00%" in audit.mathematical_proof
    assert audit.actual_detour_pct is not None
    assert audit.actual_detour_pct > 15.0


def test_compliant_pooling_accepted_with_green_audit(optimizer):
    """
    Candidate insertions with detour <= 15.0% are accepted with compliant audit record.
    """
    v1 = Vehicle(
        vehicle_id="V-101",
        name="Tata Nexon EV",
        capacity=4,
        occupied_seats=0,
        current_location=Location(lat=18.5204, lng=73.8567, name="FC Road"),
        status="idle",
        planned_stops=[]
    )

    # Two requests along the same corridor (FC Road -> Shivajinagar -> Aundh -> Baner)
    req1 = RideRequest(
        request_id="REQ-A",
        passenger_id="PAX-A",
        passenger_name="Rider A",
        pickup=Location(lat=18.5204, lng=73.8567, name="FC Road"),
        dropoff=Location(lat=18.5580, lng=73.8075, name="Aundh"),
        party_size=1,
        request_time="18:00:00",
        solo_eta_sec=600,
        solo_distance_km=5.5,
        solo_fare_inr=130.0,
        status="waiting_batch"
    )

    req2 = RideRequest(
        request_id="REQ-B",
        passenger_id="PAX-B",
        passenger_name="Rider B",
        pickup=Location(lat=18.5314, lng=73.8446, name="Shivajinagar"),
        dropoff=Location(lat=18.5590, lng=73.7868, name="Baner"),
        party_size=1,
        request_time="18:00:10",
        solo_eta_sec=700,
        solo_distance_km=6.8,
        solo_fare_inr=150.0,
        status="waiting_batch"
    )

    result = optimizer.optimize_and_validate_routes(
        vehicles=[v1],
        requests=[req1, req2],
        max_detour_pct=15.0
    )

    assert req1.request_id in result.accepted_request_ids
    assert req2.request_id in result.accepted_request_ids
    assert len(result.vehicle_plans["V-101"].stops) == 4

    for audit in result.detour_audits:
        assert audit.is_compliant is True
        assert audit.actual_detour_pct <= 15.0
        assert "COMPLIANT" in audit.mathematical_proof
