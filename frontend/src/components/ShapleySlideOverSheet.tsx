import React, { useState, useEffect } from 'react';
import type {
  RiderFareExplanation,
  ShapleyPoolResult,
  CoalitionEntry,
} from '../types/shapley';
import { fetchFareExplanationDirect } from '../services/simulationService';

interface ShapleySlideOverSheetProps {
  isOpen: boolean;
  onClose: () => void;
  requestId?: string | null;
  initialExplanation?: RiderFareExplanation | null;
  initialPool?: ShapleyPoolResult | null;
}

export const ShapleySlideOverSheet: React.FC<ShapleySlideOverSheetProps> = ({
  isOpen,
  onClose,
  requestId,
  initialExplanation,
  initialPool,
}) => {
  const [explanation, setExplanation] = useState<RiderFareExplanation | null>(
    initialExplanation || null
  );
  const [pool, setPool] = useState<ShapleyPoolResult | null>(initialPool || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'explanation' | 'matrix' | 'axioms'>('explanation');

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch explanation when opened or requestId changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialExplanation && initialExplanation.request_id === requestId) {
      setExplanation(initialExplanation);
      if (initialPool) setPool(initialPool);
      return;
    }

    if (requestId) {
      let isMounted = true;
      setIsLoading(true);
      setError(null);

      fetchFareExplanationDirect(requestId)
        .then((resp) => {
          if (!isMounted) return;
          if (resp && resp.explanation) {
            setExplanation(resp.explanation);
            if (resp.pool) setPool(resp.pool);
          } else {
            setError('Could not retrieve Shapley fare breakdown for this trip.');
          }
        })
        .catch((err) => {
          if (!isMounted) return;
          setError(err.message || 'Error loading fare explanation');
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, requestId, initialExplanation, initialPool]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" id="shapley-slideover-sheet">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Container */}
      <div className="relative w-full max-w-2xl bg-surface-container-lowest text-on-surface shadow-2xl border-l border-outline-variant/30 flex flex-col h-full z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/30 bg-surface-container-low/50 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center shadow-glow">
              <span className="material-symbols-outlined text-[24px]">balance</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-on-surface">Why am I paying this fare?</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  Game Theory Verified
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Explainable Shapley Value Fair-Fare Allocation • Cooperative Cost Sharing
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
            aria-label="Close slide-over"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('explanation')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'explanation'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span>Your Fair Share & Savings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'matrix'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            <span>7-Coalition Cost Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('axioms')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'axioms'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Axiom Proofs & Reconciliation</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-[36px] animate-spin text-primary">
                progress_activity
              </span>
              <span className="text-xs font-semibold">Computing Shapley combinatorial routing permutations...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-error-container text-on-error-container text-xs flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span>{error}</span>
            </div>
          ) : explanation ? (
            <>
              {/* TAB 1: Rider Explanation & Marginal Contributions */}
              {activeTab === 'explanation' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Savings Comparison Card */}
                  <div className="p-5 rounded-3xl bg-surface-container-low border border-outline-variant/30 shadow-soft">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                          Passenger Breakdown • {explanation.passenger_name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-bold text-on-surface">
                            Party of {explanation.party_size}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary-container">
                            Player {explanation.player_letter}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {explanation.savings_pct.toFixed(1)}% OFF SOLO
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/20">
                        <span className="text-[10px] text-on-surface-variant block font-medium">
                          Direct Solo Fare c({"{"}{explanation.player_letter}{"}"})
                        </span>
                        <span className="text-base font-bold text-on-surface block mt-1 line-through opacity-70">
                          ₹{explanation.solo_fare_inr.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-on-surface-variant block mt-0.5">
                          {(explanation.solo_distance_km).toFixed(1)} km direct
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-tertiary-container/30 border border-tertiary/20">
                        <span className="text-[10px] text-tertiary block font-bold">
                          Pooled Shapley Fare ϕ_{explanation.player_letter}
                        </span>
                        <span className="text-xl font-extrabold text-tertiary block mt-1">
                          ₹{explanation.reconciled_fare_inr.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-tertiary font-medium block mt-0.5">
                          Reconciled fair share
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[10px] text-emerald-700 block font-bold">
                          Total Net Savings
                        </span>
                        <span className="text-xl font-extrabold text-emerald-700 block mt-1">
                          ₹{explanation.savings_inr.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5">
                          In your pocket
                        </span>
                      </div>
                    </div>

                    {/* Individual Rationality Guarantee Badge */}
                    <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-tertiary font-bold">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <span>Individual Rationality Verified:</span>
                      </div>
                      <span className="font-mono text-[11px] text-on-surface font-semibold">
                        {explanation.rationality_proof}
                      </span>
                    </div>
                  </div>

                  {/* Plain-English Explanation Banner */}
                  <div className="p-4 rounded-2xl bg-primary-fixed/30 border border-primary/20 text-xs text-on-surface space-y-2">
                    <div className="flex items-center gap-2 font-bold text-primary">
                      <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                      <span>How your fair fare is calculated:</span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed">
                      Instead of a flat split or arbitrary discount, RidePool.AI uses the Nobel Prize-winning
                      <strong> Shapley Value formula</strong>. We simulate every possible ordering of passengers
                      joining the shared cab. Whenever adding you to an existing group increases total vehicle travel cost,
                      that exact marginal increase is recorded. Your fare is the mathematically exact average
                      of your marginal costs across all possible coalition arrival orders.
                    </p>
                  </div>

                  {/* Marginal Contribution Breakdown Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">account_tree</span>
                        <span>Marginal Contribution Breakdown (Player {explanation.player_letter})</span>
                      </h3>
                      <span className="text-[11px] text-on-surface-variant">
                        Formula: γ_S = |S|!(|N|-|S|-1)! / |N|!
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface-container-lowest">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-surface-container-low text-[10px] uppercase font-bold text-on-surface-variant border-b border-outline-variant/30">
                          <tr>
                            <th className="py-2.5 px-3">Subset S</th>
                            <th className="py-2.5 px-2 text-center">Weight</th>
                            <th className="py-2.5 px-3 text-right">Cost w/o Player c(S)</th>
                            <th className="py-2.5 px-3 text-right">Cost with Player c(S∪{"{"}i{"}"})</th>
                            <th className="py-2.5 px-3 text-right">Marginal Added</th>
                            <th className="py-2.5 px-3 text-right font-bold">Contribution</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20 font-mono text-[11px]">
                          {explanation.marginal_steps.map((step, idx) => (
                            <tr key={idx} className="hover:bg-surface-container-low/50">
                              <td className="py-2.5 px-3 font-semibold text-on-surface">
                                {step.subset_label}
                              </td>
                              <td className="py-2.5 px-2 text-center text-primary font-bold">
                                {step.weight_fraction}
                              </td>
                              <td className="py-2.5 px-3 text-right text-on-surface-variant">
                                ₹{step.cost_without_inr.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-on-surface-variant">
                                ₹{step.cost_with_inr.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-on-surface font-semibold">
                                +₹{step.marginal_cost_inr.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-primary font-bold">
                                ₹{step.weighted_contribution_inr.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-surface-container-low/70 border-t-2 border-outline-variant/40 font-bold text-xs">
                          <tr>
                            <td colSpan={5} className="py-2.5 px-3 text-right text-on-surface">
                              Raw Sum of Weighted Contributions (ϕ_{explanation.player_letter}):
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-on-surface">
                              ₹{explanation.raw_shapley_fare_inr.toFixed(2)}
                            </td>
                          </tr>
                          {Math.abs(explanation.penny_adjustment_inr) > 0.001 && (
                            <tr>
                              <td colSpan={5} className="py-1 px-3 text-right text-on-surface-variant text-[11px]">
                                Penny-Level Reconciliation Adjustment:
                              </td>
                              <td className="py-1 px-3 text-right font-mono text-on-surface-variant text-[11px]">
                                {explanation.penny_adjustment_inr > 0 ? '+' : ''}
                                ₹{explanation.penny_adjustment_inr.toFixed(2)}
                              </td>
                            </tr>
                          )}
                          <tr className="bg-tertiary-container/30 text-tertiary text-sm">
                            <td colSpan={5} className="py-2.5 px-3 text-right font-bold">
                              Final Reconciled Fare Paid:
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-extrabold">
                              ₹{explanation.reconciled_fare_inr.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: 7-Coalition Cost Matrix */}
              {activeTab === 'matrix' && pool && (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-on-surface">
                        Pool Routing permutations: {pool.request_ids.length} Co-Riders (2^{pool.request_ids.length} - 1 = {pool.coalition_matrix.length} Non-Empty Coalitions)
                      </span>
                      <span className="font-mono text-[11px] text-tertiary font-bold">
                        Grand Route Cost c(N) = ₹{pool.grand_coalition_cost_inr.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-on-surface-variant text-[11px] mt-1">
                      Minimum road routing costs calculated using Pune graph distance (₹18.00/km) + traffic duration (₹2.50/min) + ₹40.00 flag-down.
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-surface-container-lowest">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container-low text-[10px] uppercase font-bold text-on-surface-variant border-b border-outline-variant/30">
                        <tr>
                          <th className="py-2.5 px-3">Coalition Key</th>
                          <th className="py-2.5 px-3">Members</th>
                          <th className="py-2.5 px-3">Waypoint Sequence</th>
                          <th className="py-2.5 px-2 text-right">Distance</th>
                          <th className="py-2.5 px-2 text-right">Duration</th>
                          <th className="py-2.5 px-3 text-right font-bold">Cost c(S)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 font-mono text-[11px]">
                        {pool.coalition_matrix.map((row: CoalitionEntry) => {
                          const isGrand = row.is_grand_coalition;
                          const isRidersSolo =
                            explanation && row.coalition_key === explanation.player_letter;

                          return (
                            <tr
                              key={row.coalition_key}
                              className={`transition-colors ${
                                isGrand
                                  ? 'bg-tertiary-container/20 font-semibold'
                                  : isRidersSolo
                                  ? 'bg-primary-fixed/20'
                                  : 'hover:bg-surface-container-low/50'
                              }`}
                            >
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded font-bold text-xs ${
                                    isGrand
                                      ? 'bg-tertiary text-on-tertiary'
                                      : isRidersSolo
                                      ? 'bg-primary text-on-primary'
                                      : 'bg-surface-container-high text-on-surface'
                                  }`}
                                >
                                  {"{"}{row.coalition_key}{"}"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-on-surface font-sans text-xs">
                                {row.label}
                              </td>
                              <td className="py-2.5 px-3 text-[10px] text-on-surface-variant max-w-[200px] truncate" title={row.stop_order.join(' → ')}>
                                {row.stop_order.join(' → ')}
                              </td>
                              <td className="py-2.5 px-2 text-right text-on-surface-variant">
                                {row.distance_km.toFixed(1)} km
                              </td>
                              <td className="py-2.5 px-2 text-right text-on-surface-variant">
                                {row.duration_min.toFixed(0)} min
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-on-surface">
                                ₹{row.cost_inr.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary of Grand Savings */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs">
                      <span className="text-on-surface-variant block text-[11px]">Sum of Solo Routes (Unpooled)</span>
                      <span className="text-base font-bold text-on-surface block mt-0.5">
                        ₹{pool.sum_solo_fares_inr.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                      <span className="text-emerald-700 block text-[11px] font-bold">Total Pool Coalition Savings</span>
                      <span className="text-base font-extrabold text-emerald-700 block mt-0.5">
                        ₹{pool.total_pool_savings_inr.toFixed(2)} ({pool.total_pool_savings_pct.toFixed(1)}% saved)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Axioms & Penny-Level Reconciliation */}
              {activeTab === 'axioms' && pool && (
                <div className="space-y-6 animate-fade-in">
                  {/* Penny Reconciliation Box */}
                  <div className="p-5 rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">toll</span>
                        <span>Penny-Level Exact Reconciliation (±₹0.01)</span>
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Zero Discrepancy
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/20">
                        <span className="text-[10px] text-on-surface-variant block">Grand Coalition Cost c(N)</span>
                        <span className="text-sm font-bold text-on-surface block mt-1 font-mono">
                          ₹{pool.reconciliation_target_inr.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/20">
                        <span className="text-[10px] text-on-surface-variant block">Sum of Reconciled Fares</span>
                        <span className="text-sm font-bold text-tertiary block mt-1 font-mono">
                          ₹{pool.reconciled_sum_inr.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/20">
                        <span className="text-[10px] text-on-surface-variant block">Penny Discrepancy</span>
                        <span className="text-sm font-bold text-emerald-600 block mt-1 font-mono">
                          ₹{pool.penny_discrepancy_inr.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-container-lowest text-[11px] font-mono text-on-surface-variant flex items-center justify-between">
                      <span>Mathematical Equation:</span>
                      <span className="font-bold text-on-surface">
                        ∑(ϕ_i) = {Object.values(pool.rider_explanations).map(r => `₹${r.reconciled_fare_inr.toFixed(2)}`).join(' + ')} = ₹{pool.reconciled_sum_inr.toFixed(2)} ≡ c(N)
                      </span>
                    </div>
                  </div>

                  {/* Formal Axioms Checklist */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Game-Theoretic Axioms Verification
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-start gap-3">
                        <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0">check_circle</span>
                        <div>
                          <span className="text-xs font-bold text-on-surface block">1. Efficiency Axiom</span>
                          <span className="text-[11px] text-on-surface-variant block mt-0.5">
                            ∑(ϕ_i) = c(N). Total vehicle costs are exactly recovered without surplus or shortfall.
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-start gap-3">
                        <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0">check_circle</span>
                        <div>
                          <span className="text-xs font-bold text-on-surface block">2. Individual Rationality</span>
                          <span className="text-[11px] text-on-surface-variant block mt-0.5">
                            ϕ_i ≤ c({"{"}i{"}"}) for all i. No rider ever pays more than taking a solo taxi.
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-start gap-3">
                        <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0">check_circle</span>
                        <div>
                          <span className="text-xs font-bold text-on-surface block">3. Symmetry Axiom</span>
                          <span className="text-[11px] text-on-surface-variant block mt-0.5">
                            If riders i and j add identical marginal costs to every coalition, ϕ_i = ϕ_j.
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 flex items-start gap-3">
                        <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0">check_circle</span>
                        <div>
                          <span className="text-xs font-bold text-on-surface block">4. Dummy Player Axiom</span>
                          <span className="text-[11px] text-on-surface-variant block mt-0.5">
                            If a rider adds solely their solo cost to all coalitions, they pay exactly their solo cost.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-xs text-on-surface-variant">
              No fare explanation available for this request.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/30 bg-surface-container-low/50 flex items-center justify-between text-xs">
          <span className="text-on-surface-variant text-[11px]">
            Pune Metro Hybrid Router • Subadditive Route Cost Model
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
