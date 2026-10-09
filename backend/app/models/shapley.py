"""
Game-Theoretic Shapley Fair-Fare Allocation Models
Defines coalition cost matrices, marginal contribution steps,
penny-level reconciliation, and explainability structures.
"""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class CoalitionEntry(BaseModel):
    coalition_key: str  # e.g. "A", "B", "C", "AB", "AC", "BC", "ABC"
    member_ids: List[str]
    member_names: List[str]
    label: str  # e.g. "{Aarav}", "{Aarav, Pooja}", "{Aarav, Pooja, Rohan}"
    size: int
    distance_km: float
    duration_sec: int
    duration_min: float
    cost_inr: float  # c(S)
    stop_order: List[str] = Field(default_factory=list)
    is_grand_coalition: bool = False

class MarginalContributionStep(BaseModel):
    subset_key: str  # e.g. "∅", "{B}", "{C}", "{B, C}"
    subset_label: str
    subset_size: int
    weight_formula: str = "|S|!(|N|-|S|-1)! / |N|!"
    weight_fraction: str  # e.g. "2/6 (1/3)", "1/6"
    weight_float: float
    cost_without_inr: float  # c(S)
    cost_with_inr: float  # c(S ∪ {i})
    marginal_cost_inr: float  # c(S ∪ {i}) - c(S)
    weighted_contribution_inr: float  # weight * marginal_cost

class RiderFareExplanation(BaseModel):
    request_id: str
    passenger_id: str
    passenger_name: str
    party_size: int = 1
    player_letter: str = "A"  # "A", "B", "C", etc.
    pickup_name: str
    dropoff_name: str
    solo_distance_km: float
    solo_duration_sec: int
    solo_fare_inr: float  # c({i})
    raw_shapley_fare_inr: float  # Exact axiomatic Shapley value
    reconciled_fare_inr: float  # Reconciled to exact total trip cost within ₹0.01
    penny_adjustment_inr: float = 0.0  # reconciled - raw
    savings_inr: float
    savings_pct: float
    is_individually_rational: bool = True  # reconciled_fare <= solo_fare
    rationality_proof: str
    marginal_steps: List[MarginalContributionStep] = Field(default_factory=list)

class ShapleyPoolResult(BaseModel):
    pool_id: str
    vehicle_id: Optional[str] = None
    vehicle_name: Optional[str] = None
    batch_id: Optional[int] = None
    request_ids: List[str] = Field(default_factory=list)
    player_letters: Dict[str, str] = Field(default_factory=dict)  # {request_id: "A"}
    grand_coalition_cost_inr: float  # c(N)
    grand_coalition_distance_km: float
    grand_coalition_duration_sec: int
    sum_solo_fares_inr: float  # sum(c({i}))
    total_pool_savings_inr: float  # sum(c({i})) - c(N)
    total_pool_savings_pct: float
    coalition_matrix: List[CoalitionEntry] = Field(default_factory=list)
    rider_explanations: Dict[str, RiderFareExplanation] = Field(default_factory=dict)
    reconciliation_target_inr: float  # c(N)
    reconciled_sum_inr: float  # sum of displayed fares
    penny_discrepancy_inr: float = 0.0  # abs(c(N) - reconciled_sum) <= 0.01
    efficiency_guaranteed: bool = True
    individual_rationality_guaranteed: bool = True
    axioms_summary: Dict[str, bool] = Field(
        default_factory=lambda: {
            "efficiency": True,
            "symmetry": True,
            "dummy_player": True,
            "subadditivity": True,
            "individual_rationality": True,
        }
    )
    timestamp: str = ""
