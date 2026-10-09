"""
Unit & Integration Tests for Combinatorial Shapley Fair-Fare Engine
Verifies:
1. Coalition routing costs c(S) for all non-empty subsets S ⊆ {A, B, C}.
2. Exact axiomatic Shapley formula: phi_i = sum [ |S|!(|N|-|S|-1)! / |N|! ] * [ c(S ∪ {i}) - c(S) ].
3. Penny-level reconciliation: Sum(reconciled) == c(N) within ₹0.01.
4. Individual rationality: phi_i <= solo_fare for all riders.
5. Multi-passenger party sizes and 2-player coalitions.
"""
import pytest
from app.models.simulation import Location, RideRequest, Vehicle
from app.services.shapley_service import shapley_engine, calculate_route_cost

@pytest.fixture
def sample_three_riders():
    """Three compatible commuters along Pune's western/central transit corridor."""
    loc_shivajinagar = Location(lat=18.5314, lng=73.8446, name="Shivajinagar Hub")
    loc_deccan = Location(lat=18.5167, lng=73.8415, name="Deccan Gymkhana")
    loc_aundh = Location(lat=18.5580, lng=73.8075, name="Aundh Parihar Chowk")
    loc_baner = Location(lat=18.5590, lng=73.7868, name="Baner Road")
    loc_hinjewadi = Location(lat=18.5913, lng=73.7389, name="Hinjewadi IT Park")

    req_a = RideRequest(
        request_id="REQ-A",
        passenger_id="PAX-A",
        passenger_name="Aarav Sharma",
        pickup=loc_shivajinagar,
        dropoff=loc_hinjewadi,
        party_size=1,
        request_time="17:40:00",
        solo_eta_sec=1100,
        solo_distance_km=14.0,
        solo_fare_inr=337.0,
    )
    req_b = RideRequest(
        request_id="REQ-B",
        passenger_id="PAX-B",
        passenger_name="Pooja Patil",
        pickup=loc_deccan,
        dropoff=loc_hinjewadi,
        party_size=1,
        request_time="17:41:00",
        solo_eta_sec=1200,
        solo_distance_km=15.5,
        solo_fare_inr=369.0,
    )
    req_c = RideRequest(
        request_id="REQ-C",
        passenger_id="PAX-C",
        passenger_name="Rohan Joshi",
        pickup=loc_aundh,
        dropoff=loc_hinjewadi,
        party_size=1,
        request_time="17:42:00",
        solo_eta_sec=800,
        solo_distance_km=9.8,
        solo_fare_inr=249.0,
    )
    return [req_a, req_b, req_c]

@pytest.fixture
def sample_vehicle():
    return Vehicle(
        vehicle_id="V-101",
        name="Tata Tigor EV",
        capacity=4,
        occupied_seats=0,
        current_location=Location(lat=18.5204, lng=73.8567, name="Pune Center"),
    )

def test_coalition_matrix_seven_rows_for_three_players(sample_three_riders, sample_vehicle):
    """Verify that a 3-rider pool generates exactly 2^3 - 1 = 7 non-empty coalitions."""
    result = shapley_engine.compute_shapley_for_pool(sample_three_riders, sample_vehicle)

    assert len(result.coalition_matrix) == 7
    coalition_keys = [c.coalition_key for c in result.coalition_matrix]
    assert "A" in coalition_keys
    assert "B" in coalition_keys
    assert "C" in coalition_keys
    assert "AB" in coalition_keys
    assert "AC" in coalition_keys
    assert "BC" in coalition_keys
    assert "ABC" in coalition_keys

    # Check grand coalition entry
    grand = next(c for c in result.coalition_matrix if c.coalition_key == "ABC")
    assert grand.is_grand_coalition is True
    assert grand.size == 3
    assert grand.cost_inr == result.grand_coalition_cost_inr
    assert grand.cost_inr > 0

def test_exact_shapley_axiomatic_formula_and_marginal_steps(sample_three_riders, sample_vehicle):
    """
    Verify exact Shapley weights for N=3:
    |S|=0 -> 2/6 (1/3)
    |S|=1 -> 1/6
    |S|=2 -> 2/6 (1/3)
    Sum of weights for each player must equal 1.0.
    """
    result = shapley_engine.compute_shapley_for_pool(sample_three_riders, sample_vehicle)

    for rid, explanation in result.rider_explanations.items():
        assert len(explanation.marginal_steps) == 4  # 2^(3-1) = 4 subsets of N \ {i}
        total_weight = sum(s.weight_float for s in explanation.marginal_steps)
        assert pytest.approx(total_weight, 0.001) == 1.0

        # Verify weights match formula
        step_weights = [round(s.weight_float, 4) for s in explanation.marginal_steps]
        # For |S| in [0, 1, 1, 2], weights are [1/3, 1/6, 1/6, 1/3]
        expected_weights = [round(1/3, 4), round(1/6, 4), round(1/6, 4), round(1/3, 4)]
        assert step_weights == expected_weights

        # Verify manual sum of weighted contributions matches raw Shapley value
        manual_phi = round(sum(s.weight_float * s.marginal_cost_inr for s in explanation.marginal_steps), 2)
        assert pytest.approx(explanation.raw_shapley_fare_inr, 0.05) == manual_phi

def test_penny_level_reconciliation_exactness(sample_three_riders, sample_vehicle):
    """
    Verify that the sum of reconciled displayed fares equals the grand coalition cost c(N)
    within ₹0.01 (penny-level efficiency reconciliation).
    """
    result = shapley_engine.compute_shapley_for_pool(sample_three_riders, sample_vehicle)

    grand_cost = result.grand_coalition_cost_inr
    reconciled_sum = sum(exp.reconciled_fare_inr for exp in result.rider_explanations.values())
    reconciled_sum = round(reconciled_sum, 2)

    assert result.reconciled_sum_inr == reconciled_sum
    assert abs(grand_cost - reconciled_sum) <= 0.01
    assert result.efficiency_guaranteed is True
    assert result.penny_discrepancy_inr <= 0.01

def test_individual_rationality_guarantee(sample_three_riders, sample_vehicle):
    """
    Verify that every rider's Shapley fare is strictly less than or equal to their solo fare:
    phi_i <= c({i}).
    """
    result = shapley_engine.compute_shapley_for_pool(sample_three_riders, sample_vehicle)

    for rid, exp in result.rider_explanations.items():
        assert exp.reconciled_fare_inr <= exp.solo_fare_inr
        assert exp.is_individually_rational is True
        assert exp.savings_inr >= 0.0
        assert exp.savings_pct >= 0.0
        assert "Solo Cap" in exp.rationality_proof

    # Overall pool savings must be strictly positive when routes synergize
    assert result.total_pool_savings_inr > 0
    assert result.total_pool_savings_pct > 0

def test_two_player_coalition(sample_three_riders, sample_vehicle):
    """Verify 2-player game generates 3 coalitions and exact 50-50 marginal weights (1/2)."""
    two_riders = sample_three_riders[:2]
    result = shapley_engine.compute_shapley_for_pool(two_riders, sample_vehicle)

    assert len(result.coalition_matrix) == 3
    coalition_keys = [c.coalition_key for c in result.coalition_matrix]
    assert "A" in coalition_keys
    assert "B" in coalition_keys
    assert "AB" in coalition_keys

    for rid, exp in result.rider_explanations.items():
        assert len(exp.marginal_steps) == 2  # 2^(2-1) = 2 subsets
        for step in exp.marginal_steps:
            assert pytest.approx(step.weight_float, 0.001) == 0.5
            assert step.weight_fraction == "1/2"

    reconciled_sum = round(sum(e.reconciled_fare_inr for e in result.rider_explanations.values()), 2)
    assert abs(result.grand_coalition_cost_inr - reconciled_sum) <= 0.01

def test_multi_passenger_party_size(sample_three_riders, sample_vehicle):
    """Verify party_size > 1 is handled properly within vehicle capacity."""
    sample_three_riders[0].party_size = 2  # 2 seats for Aarav
    sample_three_riders[1].party_size = 1  # 1 seat for Pooja
    # Total seats = 3 <= 4
    result = shapley_engine.compute_shapley_for_pool(sample_three_riders[:2], sample_vehicle)

    assert result.rider_explanations["REQ-A"].party_size == 2
    assert result.efficiency_guaranteed is True
    assert result.rider_explanations["REQ-A"].is_individually_rational is True

@pytest.mark.asyncio
async def test_shapley_fares_and_receipt_api():
    """Verify GET /api/v1/fares/{request_id} and simulation Shapley matrix APIs."""
    from httpx import AsyncClient, ASGITransport
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Test /api/v1/fares/REQ-P101
        resp_fare = await client.get("/api/v1/fares/REQ-P101")
        assert resp_fare.status_code == 200
        data_fare = resp_fare.json()
        assert data_fare["status"] == "success"
        assert data_fare["request_id"] == "REQ-P101"
        assert "explanation" in data_fare
        assert "pool" in data_fare
        exp = data_fare["explanation"]
        assert exp["is_individually_rational"] is True
        assert exp["reconciled_fare_inr"] <= exp["solo_fare_inr"]
        assert len(exp["marginal_steps"]) >= 1

        # 2. Test /api/v1/simulation/shapley/matrix
        resp_matrix = await client.get("/api/v1/simulation/shapley/matrix")
        assert resp_matrix.status_code == 200
        data_matrix = resp_matrix.json()
        assert data_matrix["status"] == "success"
        assert "active_pools" in data_matrix
        assert "kpis" in data_matrix
        assert data_matrix["kpis"]["shapleySavingsPct"] > 0

        # 3. Test /api/v1/simulation/shapley/evaluate
        resp_eval = await client.post("/api/v1/simulation/shapley/evaluate", json={
            "request_ids": ["REQ-P101", "REQ-P102"]
        })
        assert resp_eval.status_code == 200
        data_eval = resp_eval.json()
        assert "pool" in data_eval
        assert len(data_eval["pool"]["coalition_matrix"]) == 3
        assert data_eval["pool"]["efficiency_guaranteed"] is True
