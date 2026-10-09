import React, { useState } from 'react';
import type { GlobalSimulationSnapshot } from '../../types/simulation';

interface GuidedStoryViewProps {
  snapshot: GlobalSimulationSnapshot | null;
  onNavigateToView: (view: 'passenger-home' | 'ops-optimization' | 'ops-batches' | 'ops-detour-guarantees') => void;
}

export const GuidedStoryView: React.FC<GuidedStoryViewProps> = ({
  snapshot,
  onNavigateToView,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const kpis = snapshot?.kpis;
  const avgDetour = kpis?.fleetDetourAveragePct ?? 8.4;
  const hardCap = kpis?.hardDetourCapPct ?? 15.0;
  const savingsPct = kpis?.shapleySavingsPct ?? 27.4;

  const steps = [
    {
      num: 1,
      title: 'Passenger Request & Solo Baseline',
      subtitle: 'Capturing origin, destination, and baseline solo trip parameters',
      icon: 'person_pin_circle',
      tag: 'Step 1 of 4',
    },
    {
      num: 2,
      title: 'Dynamic Batching Window (30s Buffer)',
      subtitle: 'Grouping compatible requests without premature vehicle dispatch',
      icon: 'timelapse',
      tag: 'Step 2 of 4',
    },
    {
      num: 3,
      title: 'OR-Tools Routing & ≤15% Detour Guarantee',
      subtitle: 'Pickup & dropoff sequencing with strict mathematical detour verification',
      icon: 'alt_route',
      tag: 'Step 3 of 4',
    },
    {
      num: 4,
      title: 'Shapley Fair-Fare Engine & Receipt',
      subtitle: 'Game-theoretic cooperative cost distribution and transparent passenger bill',
      icon: 'receipt_long',
      tag: 'Step 4 of 4',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12" id="guided-story-container">
      {/* 1. Hero Header */}
      <div className="bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low rounded-3xl p-8 border border-outline-variant/30 shadow-card relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold tracking-wide uppercase mb-3">
            <span className="material-symbols-outlined text-[16px]">school</span>
            Interactive Product Walkthrough
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            How RidePool AI Solves Shared Rides
          </h1>
          <p className="text-on-surface-variant text-sm sm:text-base mt-2 leading-relaxed">
            Follow the 4-step algorithmic pipeline from passenger booking to mathematical detour guarantees and game-theoretic fair fare allocation.
          </p>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-outline-variant/20 z-10 relative">
          <div className="bg-surface-container-lowest/80 backdrop-blur rounded-2xl p-3.5 border border-outline-variant/20">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Detour Guarantee</span>
            <span className="text-lg font-bold text-tertiary">≤{hardCap}% Hard Cap</span>
          </div>
          <div className="bg-surface-container-lowest/80 backdrop-blur rounded-2xl p-3.5 border border-outline-variant/20">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Average Detour</span>
            <span className="text-lg font-bold text-primary">+{avgDetour}% Tested</span>
          </div>
          <div className="bg-surface-container-lowest/80 backdrop-blur rounded-2xl p-3.5 border border-outline-variant/20 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Passenger Savings</span>
            <span className="text-lg font-bold text-secondary">~{savingsPct}% Shared Discount</span>
          </div>
        </div>
      </div>

      {/* 2. Stepper Progress Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((s) => {
          const isActive = currentStep === s.num;
          const isDone = currentStep > s.num;
          return (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              type="button"
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-28 ${
                isActive
                  ? 'bg-primary text-on-primary border-primary shadow-glow ring-2 ring-primary/30'
                  : isDone
                  ? 'bg-surface-container-lowest text-on-surface border-tertiary/40 hover:border-tertiary'
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:border-outline-variant'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                    isActive
                      ? 'bg-on-primary text-primary'
                      : isDone
                      ? 'bg-tertiary text-on-tertiary'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {isDone ? '✓' : s.num}
                </span>
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                  {s.icon}
                </span>
              </div>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isActive ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                  {s.tag}
                </span>
                <span className={`text-xs font-bold line-clamp-1 ${isActive ? 'text-on-primary' : 'text-on-surface'}`}>
                  {s.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Active Step Details Card */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-card space-y-6">
        {/* Step 1 Content */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/20">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Pipeline Stage 1</span>
                <h2 className="text-2xl font-bold text-on-surface">Passenger Request & Solo Baseline</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Before any ride is pooled, RidePool AI computes the optimal direct solo route to establish the baseline distance, travel time, and fair solo fare.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToView('passenger-home')}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-primary-container text-on-primary-container font-semibold text-xs flex items-center gap-2 hover:brightness-105 transition-all shadow-sm"
              >
                <span>Try Booking UI</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 space-y-4">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">trip_origin</span>
                  Passenger A (P1) Sample Request
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                    <span className="text-on-surface-variant">Origin:</span>
                    <span className="font-semibold text-on-surface">Shivaji Nagar Metro Station</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                    <span className="text-on-surface-variant">Destination:</span>
                    <span className="font-semibold text-on-surface">Hinjewadi IT Phase 1</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                    <span className="text-on-surface-variant">Solo Distance:</span>
                    <span className="font-bold text-on-surface">15.4 km (34 mins)</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                    <span className="text-on-surface-variant">Solo Baseline Cost:</span>
                    <span className="font-bold text-error">₹235.00</span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 space-y-4">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">group_add</span>
                  Passenger B (P2) Compatible Request
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                    <span className="text-on-surface-variant">Origin:</span>
                    <span className="font-semibold text-on-surface">Aundh MediPoint</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                    <span className="text-on-surface-variant">Destination:</span>
                    <span className="font-semibold text-on-surface">Wakad Bridge / Hinjewadi</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                    <span className="text-on-surface-variant">Solo Distance:</span>
                    <span className="font-bold text-on-surface">9.8 km (22 mins)</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                    <span className="text-on-surface-variant">Solo Baseline Cost:</span>
                    <span className="font-bold text-error">₹160.00</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-on-surface-variant flex items-start gap-3">
              <span className="material-symbols-outlined text-primary text-[20px]">info</span>
              <div>
                <strong className="text-on-surface font-semibold">Why this matters:</strong> Without a recorded solo baseline, an app cannot mathematically prove whether a shared detour is under 15% or calculate Shapley fair cost-sharing.
              </div>
            </div>
          </div>
        )}

        {/* Step 2 Content */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/20">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Pipeline Stage 2</span>
                <h2 className="text-2xl font-bold text-on-surface">Dynamic Batching Window (30s Rolling Buffer)</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Instead of dispatching immediately, RidePool AI holds requests in a brief 30-second window to find high-compatibility co-riders along identical corridors.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToView('ops-batches')}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-primary-container text-on-primary-container font-semibold text-xs flex items-center gap-2 hover:brightness-105 transition-all shadow-sm"
              >
                <span>Inspect Batch Queue</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 text-center space-y-2">
                <span className="material-symbols-outlined text-primary text-[32px]">timer</span>
                <h4 className="font-bold text-sm text-on-surface">30-Second Rolling Window</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Passengers wait at most 30 seconds for optimal matchmaking before vehicles are routed.
                </p>
              </div>
              <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 text-center space-y-2">
                <span className="material-symbols-outlined text-tertiary text-[32px]">spatial_tracking</span>
                <h4 className="font-bold text-sm text-on-surface">Corridor Spatial Clustering</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Requests along common thoroughfares (e.g., Old Mumbai-Pune Hwy, Hinjewadi flyover) are paired.
                </p>
              </div>
              <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 text-center space-y-2">
                <span className="material-symbols-outlined text-secondary text-[32px]">directions_car</span>
                <h4 className="font-bold text-sm text-on-surface">Instant Solo Fallback</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  If no compatible passenger appears within 30s, the rider dispatches solo without penalty.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 Content */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/20">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Pipeline Stage 3</span>
                <h2 className="text-2xl font-bold text-on-surface">OR-Tools Routing & ≤15% Detour Guarantee</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Google OR-Tools solves the optimal stop sequence (Pickups before Dropoffs) while enforcing our strict mathematical detour guarantee.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToView('ops-optimization')}
                  className="px-4 py-2 rounded-xl bg-primary-container text-on-primary-container font-semibold text-xs flex items-center gap-1.5 hover:brightness-105 transition-all shadow-sm"
                >
                  <span>Route Plans</span>
                  <span className="material-symbols-outlined text-[16px]">alt_route</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToView('ops-detour-guarantees')}
                  className="px-4 py-2 rounded-xl bg-tertiary-container text-on-tertiary-container font-semibold text-xs flex items-center gap-1.5 hover:brightness-105 transition-all shadow-sm"
                >
                  <span>Detour Proof</span>
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                </button>
              </div>
            </div>

            {/* Sequence Diagram Visual */}
            <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 space-y-4">
              <h3 className="font-bold text-sm text-on-surface flex items-center justify-between">
                <span>Optimized Multi-Stop Vehicle Route (Vehicle V-101)</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-tertiary/20 text-tertiary border border-tertiary/30">
                  Compliant: Detour +7.8% ≤ 15.0%
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/20 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-primary">Stop 1 (Pickup)</span>
                    <span className="text-[10px] text-on-surface-variant">0 km</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">P1: Shivaji Nagar</span>
                  <span className="text-[10px] text-on-surface-variant">Passenger 1 enters</span>
                </div>

                <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/20 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-secondary">Stop 2 (Pickup)</span>
                    <span className="text-[10px] text-on-surface-variant">+3.2 km</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">P2: Aundh MediPoint</span>
                  <span className="text-[10px] text-on-surface-variant">Passenger 2 enters</span>
                </div>

                <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/20 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-tertiary">Stop 3 (Dropoff)</span>
                    <span className="text-[10px] text-on-surface-variant">+8.5 km</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">P2: Wakad Bridge</span>
                  <span className="text-[10px] text-on-surface-variant">P2 Detour: +6.2% (OK)</span>
                </div>

                <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/20 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-tertiary">Stop 4 (Dropoff)</span>
                    <span className="text-[10px] text-on-surface-variant">+5.1 km</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">P1: Hinjewadi Ph 1</span>
                  <span className="text-[10px] text-on-surface-variant">P1 Detour: +7.8% (OK)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 Content */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/20">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Pipeline Stage 4</span>
                <h2 className="text-2xl font-bold text-on-surface">Shapley Fair-Fare Engine & Receipt</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Game theory allocates shared costs fairly. Passengers who contribute shared overlap receive proportional discounts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToView('passenger-home')}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-tertiary text-on-tertiary font-semibold text-xs flex items-center gap-2 hover:brightness-105 transition-all shadow-sm"
              >
                <span>Book Live Ride</span>
                <span className="material-symbols-outlined text-[16px]">electric_car</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fare Comparison Card */}
              <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 space-y-4">
                <h3 className="font-bold text-sm text-on-surface flex items-center justify-between">
                  <span>Transparent Cost Comparison</span>
                  <span className="text-xs font-bold text-tertiary">Combined Savings: ₹110.00</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between">
                    <div>
                      <strong className="text-on-surface block">Passenger 1 (Shivaji Nagar → Hinjewadi)</strong>
                      <span className="text-on-surface-variant">Solo Price: <s className="text-error">₹235.00</s></span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-primary block">₹170.00</span>
                      <span className="text-[10px] font-bold text-tertiary">Save ₹65.00 (-27.6%)</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between">
                    <div>
                      <strong className="text-on-surface block">Passenger 2 (Aundh → Wakad)</strong>
                      <span className="text-on-surface-variant">Solo Price: <s className="text-error">₹160.00</s></span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-secondary block">₹115.00</span>
                      <span className="text-[10px] font-bold text-tertiary">Save ₹45.00 (-28.1%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Axiom Proofs */}
              <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30 space-y-3">
                <h3 className="font-bold text-sm text-on-surface">Mathematical Axiom Guarantees</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-tertiary text-[16px] mt-0.5">check_circle</span>
                    <div>
                      <strong className="text-on-surface">Efficiency:</strong> The sum of passenger fares exactly covers the total vehicle operating cost.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-tertiary text-[16px] mt-0.5">check_circle</span>
                    <div>
                      <strong className="text-on-surface">Symmetry:</strong> Passengers with equal travel contributions pay identical fares.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-surface-container-lowest">
                    <span className="material-symbols-outlined text-tertiary text-[16px] mt-0.5">check_circle</span>
                    <div>
                      <strong className="text-on-surface">Individual Rationality:</strong> No passenger ever pays more than their solo baseline.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stepper Footer Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-outline-variant/20">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Previous Step
          </button>

          <span className="text-xs text-on-surface-variant font-medium">
            Step {currentStep} of 4
          </span>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:brightness-110 transition-all flex items-center gap-1.5 shadow-sm"
            >
              Next Step
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigateToView('passenger-home')}
              className="px-5 py-2 rounded-xl bg-tertiary text-on-tertiary text-xs font-bold hover:brightness-110 transition-all flex items-center gap-1.5 shadow-sm"
            >
              Start Passenger Experience
              <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
