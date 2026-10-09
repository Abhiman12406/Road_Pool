"""
Combinatorial Shapley Fair-Fare Engine Service
Calculates minimum routing costs c(S) for all non-empty coalitions,
computes exact axiomatic Shapley values, performs penny-level reconciliation,
and produces explainable rider cost breakdowns.
"""
import math
import itertools
import time
import logging
from typing import Dict, List, Tuple, Optional, Set, Any

from app.config import settings
from app.models.simulation import Location, RideRequest, Vehicle, RouteStop
from app.models.shapley import (
    CoalitionEntry,
    MarginalContributionStep,
    RiderFareExplanation,
    ShapleyPoolResult,
)
from app.services.route_optimizer import travel_time_and_dist, STOP_DWELL_SECONDS

logger = logging.getLogger("shapley_service")

PLAYER_LETTERS = ["A", "B", "C", "D", "E", "F"]


def calculate_route_cost(distance_km: float, duration_sec: int) -> float:
    """
    Computes total car trip routing cost in INR.
    Formula: Base Fare (₹40) + (Distance * ₹18/km) + (Time in mins * ₹2.5/min)
    """
    base_fare = float(settings.BASE_FARE_INR)
    dist_fare = distance_km * float(settings.RATE_PER_KM_INR)
    time_fare = (duration_sec / 60.0) * float(settings.RATE_PER_MIN_INR)
    total = max(base_fare, base_fare + dist_fare + time_fare)
    return round(total, 2)


class CombinatorialShapleyEngine:
    def __init__(self):
        self.base_fare = float(settings.BASE_FARE_INR)
        self.rate_per_km = float(settings.RATE_PER_KM_INR)
        self.rate_per_min = float(settings.RATE_PER_MIN_INR)

    def evaluate_stop_sequence_cost(
        self,
        stops: List[Tuple[str, Location, str, int]],  # (req_id, location, stop_type, party_size)
        start_location: Optional[Location] = None,
    ) -> Tuple[float, int, List[str]]:
        """
        Calculates cumulative distance, travel time, and stop sequence summary.
        """
        if not stops:
            return 0.0, 0, []

        total_dist_km = 0.0
        total_dur_sec = 0
        stop_names: List[str] = []

        curr_loc = start_location if start_location else stops[0][1]
        start_idx = 0 if start_location else 1

        if not start_location:
            stop_names.append(f"{stops[0][0]} ({stops[0][2]})")

        for idx in range(start_idx, len(stops)):
            hop_stop = stops[idx]
            transit_sec, transit_km = travel_time_and_dist(curr_loc, hop_stop[1])
            total_dist_km += transit_km
            total_dur_sec += transit_sec + STOP_DWELL_SECONDS
            curr_loc = hop_stop[1]
            stop_names.append(f"{hop_stop[0]} ({hop_stop[2]})")

        return round(total_dist_km, 2), total_dur_sec, stop_names

    def find_minimum_routing_cost_for_subset(
        self,
        subset_requests: List[RideRequest],
        start_location: Optional[Location] = None,
        vehicle_capacity: int = 4,
    ) -> Tuple[float, float, int, List[str]]:
        """
        Computes the minimum routing cost c(S) for a given non-empty subset of requests.
        Evaluates valid permutations where pickups precede dropoffs and capacity is preserved.
        Returns: (cost_inr, distance_km, duration_sec, stop_order_summary)
        """
        k = len(subset_requests)
        if k == 0:
            return 0.0, 0.0, 0, []

        # If singleton {i}, route is simply pickup -> dropoff
        if k == 1:
            req = subset_requests[0]
            transit_sec, transit_km = travel_time_and_dist(req.pickup, req.dropoff)
            dist_km = req.solo_distance_km if req.solo_distance_km > 0 else transit_km
            dur_sec = req.solo_eta_sec if req.solo_eta_sec > 0 else transit_sec
            cost = calculate_route_cost(dist_km, dur_sec)
            # Ensure it matches solo_fare_inr if present
            if req.solo_fare_inr and req.solo_fare_inr > 0:
                cost = req.solo_fare_inr
            return cost, dist_km, dur_sec, [f"{req.passenger_name} (Pickup)", f"{req.passenger_name} (Dropoff)"]

        # Build stops: 2k stops (pickup and dropoff for each request)
        stops_by_req: List[Tuple[str, Location, str, int, str]] = []  # (req_id, loc, type, party_size, pax_name)
        for req in subset_requests:
            stops_by_req.append((req.request_id, req.pickup, "Pickup", req.party_size, req.passenger_name))
            stops_by_req.append((req.request_id, req.dropoff, "Dropoff", req.party_size, req.passenger_name))

        # Filter valid permutations
        best_cost = float("inf")
        best_dist = 0.0
        best_dur = 0
        best_stops_summary: List[str] = []

        # For k <= 4, evaluate candidate sequences
        all_indices = list(range(len(stops_by_req)))
        for p in itertools.permutations(all_indices):
            # 1. Precedence check: pickup must come before dropoff
            seen_pickups: Set[str] = set()
            is_valid = True
            current_pax = 0

            for idx in p:
                req_id, loc, st_type, party_sz, _ = stops_by_req[idx]
                if st_type == "Pickup":
                    seen_pickups.add(req_id)
                    current_pax += party_sz
                    if current_pax > vehicle_capacity:
                        is_valid = False
                        break
                elif st_type == "Dropoff":
                    if req_id not in seen_pickups:
                        is_valid = False
                        break
                    current_pax = max(0, current_pax - party_sz)

            if not is_valid:
                continue

            # Valid sequence: evaluate route
            candidate_stops = [(stops_by_req[idx][0], stops_by_req[idx][1], stops_by_req[idx][2], stops_by_req[idx][3]) for idx in p]
            dist_km, dur_sec, _ = self.evaluate_stop_sequence_cost(candidate_stops, start_location=start_location)
            cost = calculate_route_cost(dist_km, dur_sec)

            if cost < best_cost:
                best_cost = cost
                best_dist = dist_km
                best_dur = dur_sec
                best_stops_summary = [f"{stops_by_req[idx][4]} ({stops_by_req[idx][2]})" for idx in p]

        if best_cost == float("inf"):
            # Fallback sum of solo routes
            fallback_cost = sum(r.solo_fare_inr for r in subset_requests)
            fallback_dist = sum(r.solo_distance_km for r in subset_requests)
            fallback_dur = sum(r.solo_eta_sec for r in subset_requests)
            return fallback_cost, fallback_dist, fallback_dur, ["Multiple Disjoint Cabs"]

        return round(best_cost, 2), round(best_dist, 2), best_dur, best_stops_summary

    def compute_all_coalition_costs(
        self,
        requests: List[RideRequest],
        start_location: Optional[Location] = None,
        vehicle_capacity: int = 4,
    ) -> Dict[frozenset, Tuple[float, float, int, List[str]]]:
        """
        Computes minimum routing costs c(S) for all 2^|N| - 1 non-empty subsets S.
        Enforces subadditivity: c(S) <= sum(c(subsets)) as the cheapest feasible plan.
        """
        req_map = {r.request_id: r for r in requests}
        all_ids = [r.request_id for r in requests]
        coalition_costs: Dict[frozenset, Tuple[float, float, int, List[str]]] = {}

        # 1. Compute costs by subset size ascending
        for size in range(1, len(all_ids) + 1):
            for subset in itertools.combinations(all_ids, size):
                subset_set = frozenset(subset)
                sub_reqs = [req_map[rid] for rid in subset]
                cost, dist, dur, stop_order = self.find_minimum_routing_cost_for_subset(
                    sub_reqs,
                    start_location=start_location,
                    vehicle_capacity=vehicle_capacity,
                )

                # Subadditivity check: ensure c(S) <= sum of separate partitions
                if size > 1:
                    # Check if partition into smaller coalitions yields a lower cost
                    for split_size in range(1, size):
                        for sub_part in itertools.combinations(subset, split_size):
                            part1 = frozenset(sub_part)
                            part2 = frozenset(set(subset) - set(sub_part))
                            if part1 in coalition_costs and part2 in coalition_costs:
                                combined_sub_cost = round(coalition_costs[part1][0] + coalition_costs[part2][0], 2)
                                if combined_sub_cost < cost:
                                    cost = combined_sub_cost

                coalition_costs[subset_set] = (cost, dist, dur, stop_order)

        return coalition_costs

    def compute_shapley_for_pool(
        self,
        requests: List[RideRequest],
        vehicle: Optional[Vehicle] = None,
        batch_id: Optional[int] = None,
    ) -> ShapleyPoolResult:
        """
        Computes the complete game-theoretic Shapley fair-fare breakdown for a pool of riders.
        Axiomatic Shapley formula:
        phi_i = sum_{S subseteq N \\ {i}} [ |S|!(|N|-|S|-1)! / |N|! ] * [ c(S cup {i}) - c(S) ]
        """
        n = len(requests)
        if n == 0:
            raise ValueError("Cannot compute Shapley allocation for empty request pool")

        pool_id = f"POOL-{vehicle.vehicle_id if vehicle else 'BATCH'}"
        req_map = {r.request_id: r for r in requests}
        player_letters: Dict[str, str] = {
            r.request_id: PLAYER_LETTERS[idx] if idx < len(PLAYER_LETTERS) else f"P{idx+1}"
            for idx, r in enumerate(requests)
        }

        # 1. Compute all coalition costs c(S)
        start_loc = None
        veh_cap = vehicle.capacity if vehicle else 4
        coalition_data = self.compute_all_coalition_costs(
            requests,
            start_location=start_loc,
            vehicle_capacity=veh_cap,
        )

        grand_coalition_set = frozenset(r.request_id for r in requests)
        grand_cost, grand_dist, grand_dur, _ = coalition_data[grand_coalition_set]

        # 2. Build 7-row coalition matrix table (or 2^n - 1 rows)
        coalition_matrix: List[CoalitionEntry] = []
        # Sort coalitions by size, then by letter
        sorted_subsets = sorted(
            coalition_data.keys(),
            key=lambda s: (len(s), "".join(sorted([player_letters[rid] for rid in s])))
        )

        for s in sorted_subsets:
            c_cost, c_dist, c_dur, c_stops = coalition_data[s]
            letters_in_subset = sorted([player_letters[rid] for rid in s])
            c_key = "".join(letters_in_subset)
            m_names = [req_map[rid].passenger_name for rid in s]
            lbl = "{" + ", ".join(m_names) + "}"

            coalition_matrix.append(
                CoalitionEntry(
                    coalition_key=c_key,
                    member_ids=list(s),
                    member_names=m_names,
                    label=lbl,
                    size=len(s),
                    distance_km=c_dist,
                    duration_sec=c_dur,
                    duration_min=round(c_dur / 60.0, 1),
                    cost_inr=c_cost,
                    stop_order=c_stops,
                    is_grand_coalition=(s == grand_coalition_set),
                )
            )

        # 3. Compute exact Shapley values and marginal contribution steps for each player
        raw_shapley_fares: Dict[str, float] = {}
        player_marginal_steps: Dict[str, List[MarginalContributionStep]] = {}
        rider_explanations: Dict[str, RiderFareExplanation] = {}
        all_ids = [r.request_id for r in requests]

        for req in requests:
            i = req.request_id
            other_ids = [rid for rid in all_ids if rid != i]
            other_n = len(other_ids)
            marginal_steps: List[MarginalContributionStep] = []
            phi_raw = 0.0

            # Iterate through all subsets S of N \ {i}
            for s_size in range(0, other_n + 1):
                for s_tuple in itertools.combinations(other_ids, s_size):
                    s_set = frozenset(s_tuple)
                    s_cup_i = frozenset(set(s_tuple) | {i})

                    cost_without = coalition_data[s_set][0] if s_size > 0 else 0.0
                    cost_with = coalition_data[s_cup_i][0]

                    marginal_cost = round(cost_with - cost_without, 2)

                    # Factorial weight formula: |S|! * (|N| - |S| - 1)! / |N|!
                    s_len = len(s_set)
                    numerator = math.factorial(s_len) * math.factorial(n - s_len - 1)
                    denominator = math.factorial(n)
                    weight_float = numerator / float(denominator)

                    # Fraction label
                    fraction_str = f"{numerator}/{denominator}"
                    if n == 3:
                        if s_len == 0 or s_len == 2:
                            fraction_str = "2/6 (1/3)"
                        else:
                            fraction_str = "1/6"
                    elif n == 2:
                        fraction_str = "1/2"

                    weighted_contrib = round(weight_float * marginal_cost, 4)
                    phi_raw += weighted_contrib

                    # Subset label
                    if s_len == 0:
                        s_key = "∅"
                        s_lbl = "Empty set ∅ (Solo departure)"
                    else:
                        letters = sorted([player_letters[rid] for rid in s_set])
                        s_key = "{" + ", ".join(letters) + "}"
                        names = [req_map[rid].passenger_name for rid in s_set]
                        s_lbl = "{" + ", ".join(names) + "}"

                    marginal_steps.append(
                        MarginalContributionStep(
                            subset_key=s_key,
                            subset_label=s_lbl,
                            subset_size=s_len,
                            weight_formula=f"|S|!({n}-|S|-1)! / {n}!",
                            weight_fraction=fraction_str,
                            weight_float=round(weight_float, 4),
                            cost_without_inr=cost_without,
                            cost_with_inr=cost_with,
                            marginal_cost_inr=marginal_cost,
                            weighted_contribution_inr=round(weighted_contrib, 2),
                        )
                    )

            player_marginal_steps[i] = marginal_steps
            raw_shapley_fares[i] = round(phi_raw, 2)

        # 4. Penny-Level Reconciliation (Sum(reconciled) == c(N))
        # Efficiency Axiom guarantees Sum(phi_i) == c(N).
        # Any residual discrepancy is due to 2-decimal rounding.
        rounded_fares = {rid: round(fare, 2) for rid, fare in raw_shapley_fares.items()}
        current_sum = round(sum(rounded_fares.values()), 2)
        diff = round(grand_cost - current_sum, 2)  # e.g. +0.01 or -0.01

        reconciled_fares = dict(rounded_fares)
        penny_adjustments: Dict[str, float] = {rid: 0.0 for rid in rounded_fares}

        if abs(diff) > 0.0001:
            # Reconcile penny-by-penny: distribute remaining paise to largest contributor(s)
            sorted_riders_by_share = sorted(
                rounded_fares.keys(),
                key=lambda rid: (rounded_fares[rid], req_map[rid].solo_fare_inr),
                reverse=True
            )
            step_cents = int(round(diff * 100))
            direction = 0.01 if step_cents > 0 else -0.01
            for idx in range(abs(step_cents)):
                target_rid = sorted_riders_by_share[idx % len(sorted_riders_by_share)]
                reconciled_fares[target_rid] = round(reconciled_fares[target_rid] + direction, 2)
                penny_adjustments[target_rid] = round(penny_adjustments[target_rid] + direction, 2)

        # 5. Build individual rider fare explanations and verify rationality
        sum_solo = round(sum(r.solo_fare_inr for r in requests), 2)
        total_savings = round(max(0.0, sum_solo - grand_cost), 2)
        total_savings_pct = round((total_savings / sum_solo) * 100.0, 1) if sum_solo > 0 else 0.0

        for req in requests:
            rid = req.request_id
            rec_fare = reconciled_fares[rid]
            solo = req.solo_fare_inr
            is_rational = (rec_fare <= solo)
            savings = round(solo - rec_fare, 2)
            savings_pct = round((savings / solo) * 100.0, 1) if solo > 0 else 0.0

            proof = (
                f"₹{rec_fare:.2f} <= ₹{solo:.2f} Solo Cap "
                f"[SAVINGS: ₹{savings:.2f} (-{savings_pct:.1f}%)]"
                if is_rational else
                f"Subsidized: ₹{rec_fare:.2f} exceeds solo cap ₹{solo:.2f}"
            )

            rider_explanations[rid] = RiderFareExplanation(
                request_id=rid,
                passenger_id=req.passenger_id,
                passenger_name=req.passenger_name,
                party_size=req.party_size,
                player_letter=player_letters[rid],
                pickup_name=req.pickup.name,
                dropoff_name=req.dropoff.name,
                solo_distance_km=req.solo_distance_km,
                solo_duration_sec=req.solo_eta_sec,
                solo_fare_inr=solo,
                raw_shapley_fare_inr=raw_shapley_fares[rid],
                reconciled_fare_inr=rec_fare,
                penny_adjustment_inr=penny_adjustments[rid],
                savings_inr=savings,
                savings_pct=savings_pct,
                is_individually_rational=is_rational,
                rationality_proof=proof,
                marginal_steps=player_marginal_steps[rid],
            )

        final_reconciled_sum = round(sum(reconciled_fares.values()), 2)
        penny_discrepancy = round(abs(grand_cost - final_reconciled_sum), 2)

        return ShapleyPoolResult(
            pool_id=pool_id,
            vehicle_id=vehicle.vehicle_id if vehicle else None,
            vehicle_name=vehicle.name if vehicle else None,
            batch_id=batch_id,
            request_ids=all_ids,
            player_letters=player_letters,
            grand_coalition_cost_inr=grand_cost,
            grand_coalition_distance_km=grand_dist,
            grand_coalition_duration_sec=grand_dur,
            sum_solo_fares_inr=sum_solo,
            total_pool_savings_inr=total_savings,
            total_pool_savings_pct=total_savings_pct,
            coalition_matrix=coalition_matrix,
            rider_explanations=rider_explanations,
            reconciliation_target_inr=grand_cost,
            reconciled_sum_inr=final_reconciled_sum,
            penny_discrepancy_inr=penny_discrepancy,
            efficiency_guaranteed=(penny_discrepancy <= 0.01),
            individual_rationality_guaranteed=all(e.is_individually_rational for e in rider_explanations.values()),
            axioms_summary={
                "efficiency": True,
                "symmetry": True,
                "dummy_player": True,
                "subadditivity": True,
                "individual_rationality": all(e.is_individually_rational for e in rider_explanations.values()),
            },
            timestamp=time.strftime("%H:%M:%S"),
        )


shapley_engine = CombinatorialShapleyEngine()
