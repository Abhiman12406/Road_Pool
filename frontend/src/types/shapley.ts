export interface CoalitionEntry {
  coalition_key: string; // e.g. "A", "B", "C", "AB", "AC", "BC", "ABC"
  member_ids: string[];
  member_names: string[];
  label: string;
  size: number;
  distance_km: number;
  duration_sec: number;
  duration_min: number;
  cost_inr: number;
  stop_order: string[];
  is_grand_coalition: boolean;
}

export interface MarginalContributionStep {
  subset_key: string;
  subset_label: string;
  subset_size: number;
  weight_formula: string;
  weight_fraction: string;
  weight_float: number;
  cost_without_inr: number;
  cost_with_inr: number;
  marginal_cost_inr: number;
  weighted_contribution_inr: number;
}

export interface RiderFareExplanation {
  request_id: string;
  passenger_id: string;
  passenger_name: string;
  party_size: number;
  player_letter: string;
  pickup_name: string;
  dropoff_name: string;
  solo_distance_km: number;
  solo_duration_sec: number;
  solo_fare_inr: number;
  raw_shapley_fare_inr: number;
  reconciled_fare_inr: number;
  penny_adjustment_inr: number;
  savings_inr: number;
  savings_pct: number;
  is_individually_rational: boolean;
  rationality_proof: string;
  marginal_steps: MarginalContributionStep[];
}

export interface ShapleyPoolResult {
  pool_id: string;
  vehicle_id?: string | null;
  vehicle_name?: string | null;
  batch_id?: number | null;
  request_ids: string[];
  player_letters: Record<string, string>;
  grand_coalition_cost_inr: number;
  grand_coalition_distance_km: number;
  grand_coalition_duration_sec: number;
  sum_solo_fares_inr: number;
  total_pool_savings_inr: number;
  total_pool_savings_pct: number;
  coalition_matrix: CoalitionEntry[];
  rider_explanations: Record<string, RiderFareExplanation>;
  reconciliation_target_inr: number;
  reconciled_sum_inr: number;
  penny_discrepancy_inr: number;
  efficiency_guaranteed: boolean;
  individual_rationality_guaranteed: boolean;
  axioms_summary: {
    efficiency: boolean;
    symmetry: boolean;
    dummy_player: boolean;
    subadditivity: boolean;
    individual_rationality: boolean;
  };
  timestamp: string;
}

export interface ShapleyFareResponse {
  status: string;
  request_id: string;
  explanation: RiderFareExplanation;
  pool: ShapleyPoolResult;
}
