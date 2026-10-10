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
    <div className="max-w-6xl mx-auto space-y-6 pb-12" id="guided-story-container">
      {/* 1. Hero Header */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-neutral-200">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200 text-xs font-mono font-medium tracking-wide uppercase mb-2">
            <span className="material-symbols-outlined text-[15px]">school</span>
            Interactive Product Walkthrough
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            How RouteMates Solves Shared Rides
          </h1>
          <p className="text-neutral-500 text-sm mt-1.5 leading-relaxed">
            Follow the 4-step algorithmic pipeline from passenger booking to mathematical detour guarantees and game-theoretic fair fare allocation.
          </p>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-neutral-100">
          <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Detour Guarantee</span>
            <span className="text-base font-bold font-mono text-emerald-700">≤{hardCap}% Hard Cap</span>
          </div>
          <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Average Detour</span>
            <span className="text-base font-bold font-mono text-neutral-900">+{avgDetour}% Tested</span>
          </div>
          <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Passenger Savings</span>
            <span className="text-base font-bold font-mono text-emerald-700">~{savingsPct}% Shared Discount</span>
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
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between h-24 ${
                isActive
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : isDone
                  ? 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-300'
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold ${
                    isActive
                      ? 'bg-neutral-800 text-white'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {isDone ? '✓' : s.num}
                </span>
                <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-white' : 'text-neutral-400'}`}>
                  {s.icon}
                </span>
              </div>
              <div>
                <span className={`text-[10px] font-mono font-medium uppercase tracking-wider block ${isActive ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {s.tag}
                </span>
                <span className={`text-xs font-semibold line-clamp-1 ${isActive ? 'text-white' : 'text-neutral-900'}`}>
                  {s.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Active Step Details Card */}
      <div className="bg-white rounded-xl p-5 sm:p-7 border border-neutral-200 space-y-6">
        {/* Step 1 Content */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
              <div>
                <span className="text-xs font-mono font-medium text-neutral-500 uppercase tracking-wider">Pipeline Stage 1</span>
                <h2 className="text-xl font-bold text-neutral-900">Passenger Request & Solo Baseline</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Before any ride is pooled, RouteMates computes the optimal direct solo route to establish the baseline distance, travel time, and fair solo fare.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToView('passenger-home')}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white font-medium text-xs flex items-center gap-1.5 hover:bg-neutral-800 transition-colors"
              >
                <span>Try Booking UI</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 space-y-3">
                <h3 className="font-semibold text-xs text-neutral-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-neutral-700 text-[18px]">trip_origin</span>
                  Passenger A (P1) Sample Request
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded-md bg-white border border-neutral-200">
                    <span className="text-neutral-500">Origin:</span>
                    <span className="font-medium text-neutral-900">Shivaji Nagar Metro Station</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-md bg-white border border-neutral-200">
                    <span className="text-neutral-500">Destination:</span>
                    <span className="font-medium text-neutral-900">Hinjewadi IT Phase 1</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-md bg-white border border-neutral-200">
                    <span className="text-neutral-500">Solo Distance:</span>
                    <span className="font-mono font-semibold text-neutral-900">15.4 km (34 mins)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-md bg-white border border-neutral-200">
                    <span className="text-neutral-500">Solo Baseline Cost:</span>
                    <span className="font-mono font-bold text-neutral-900">₹235.00</span>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 space-y-3">
                <h3 className="font-semibold text-xs text-neutral-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-neutral-700 text-[18px]">group_add</span>
                  Passenger B (P2) Compatible Request
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded-md bg-white border border-neutral-200">
                    <span className="text-neutral-500">Origin:</span>
                    <span className="font-medium text-neutral-900">Aundh MediPoint</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-md bg-white border border-neutral-200">
                    <span className="text-neutral-500">Destination:</span>
                    <span className="font-medium text-neutral-900">Wakad Bridge / Hinjewadi</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-md bg-white border border-neutral-200">
                    <span className="text-neutral-500">Solo Distance:</span>
                    <span className="font-mono font-semibold text-neutral-900">9.8 km (22 mins)</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-md bg-white border border-neutral-200">
                    <span className="text-neutral-500">Solo Baseline Cost:</span>
                    <span className="font-mono font-bold text-neutral-900">₹160.00</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-neutral-700 text-[18px]">info</span>
              <div>
                <strong className="text-neutral-900 font-semibold">Why this matters:</strong> Without a recorded solo baseline, an app cannot mathematically prove whether a shared detour is under 15% or calculate Shapley fair cost-sharing.
              </div>
            </div>
          </div>
        )}

        {/* Step 2 Content */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
              <div>
                <span className="text-xs font-mono font-medium text-neutral-500 uppercase tracking-wider">Pipeline Stage 2</span>
                <h2 className="text-xl font-bold text-neutral-900">Dynamic Batching Window (30s Rolling Buffer)</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Instead of dispatching immediately, RouteMates holds requests in a brief 30-second window to find high-compatibility co-riders along identical corridors.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToView('ops-batches')}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white font-medium text-xs flex items-center gap-1.5 hover:bg-neutral-800 transition-colors"
              >
                <span>Inspect Batch Queue</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 text-center space-y-1.5">
                <span className="material-symbols-outlined text-neutral-700 text-[28px]">timer</span>
                <h4 className="font-semibold text-xs text-neutral-900">30-Second Rolling Window</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Passengers wait at most 30 seconds for optimal matchmaking before vehicles are routed.
                </p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 text-center space-y-1.5">
                <span className="material-symbols-outlined text-neutral-700 text-[28px]">spatial_tracking</span>
                <h4 className="font-semibold text-xs text-neutral-900">Corridor Spatial Clustering</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Requests along common thoroughfares (e.g., Old Mumbai-Pune Hwy, Hinjewadi flyover) are paired.
                </p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 text-center space-y-1.5">
                <span className="material-symbols-outlined text-neutral-700 text-[28px]">directions_car</span>
                <h4 className="font-semibold text-xs text-neutral-900">Instant Solo Fallback</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  If no compatible passenger appears within 30s, the rider dispatches solo without penalty.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 Content */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
              <div>
                <span className="text-xs font-mono font-medium text-neutral-500 uppercase tracking-wider">Pipeline Stage 3</span>
                <h2 className="text-xl font-bold text-neutral-900">OR-Tools Routing & ≤15% Detour Guarantee</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Google OR-Tools solves the optimal stop sequence (Pickups before Dropoffs) while enforcing our strict mathematical detour guarantee.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToView('ops-optimization')}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white font-medium text-xs flex items-center gap-1.5 hover:bg-neutral-800 transition-colors"
                >
                  <span>Route Plans</span>
                  <span className="material-symbols-outlined text-[15px]">alt_route</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToView('ops-detour-guarantees')}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-800 font-medium text-xs flex items-center gap-1.5 hover:bg-neutral-200 transition-colors border border-neutral-200"
                >
                  <span>Detour Proof</span>
                  <span className="material-symbols-outlined text-[15px]">verified_user</span>
                </button>
              </div>
            </div>

            {/* Sequence Diagram Visual */}
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-neutral-900">Optimized Multi-Stop Vehicle Route (Vehicle V-101)</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Compliant: Detour +7.8% ≤ 15.0%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-3 rounded-md border border-neutral-200 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-neutral-900">Stop 1 (Pickup)</span>
                    <span className="text-[10px] text-neutral-500 font-mono">0 km</span>
                  </div>
                  <span className="text-xs font-semibold text-neutral-900">P1: Shivaji Nagar</span>
                  <span className="text-[10px] text-neutral-500">Passenger 1 enters</span>
                </div>

                <div className="bg-white p-3 rounded-md border border-neutral-200 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-neutral-900">Stop 2 (Pickup)</span>
                    <span className="text-[10px] text-neutral-500 font-mono">+3.2 km</span>
                  </div>
                  <span className="text-xs font-semibold text-neutral-900">P2: Aundh MediPoint</span>
                  <span className="text-[10px] text-neutral-500">Passenger 2 enters</span>
                </div>

                <div className="bg-white p-3 rounded-md border border-neutral-200 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-700">Stop 3 (Dropoff)</span>
                    <span className="text-[10px] text-neutral-500 font-mono">+8.5 km</span>
                  </div>
                  <span className="text-xs font-semibold text-neutral-900">P2: Wakad Bridge</span>
                  <span className="text-[10px] text-neutral-500">P2 Detour: +6.2% (OK)</span>
                </div>

                <div className="bg-white p-3 rounded-md border border-neutral-200 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-emerald-700">Stop 4 (Dropoff)</span>
                    <span className="text-[10px] text-neutral-500 font-mono">+5.1 km</span>
                  </div>
                  <span className="text-xs font-semibold text-neutral-900">P1: Hinjewadi Ph 1</span>
                  <span className="text-[10px] text-neutral-500">P1 Detour: +7.8% (OK)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 Content */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
              <div>
                <span className="text-xs font-mono font-medium text-neutral-500 uppercase tracking-wider">Pipeline Stage 4</span>
                <h2 className="text-xl font-bold text-neutral-900">Shapley Fair-Fare Engine & Receipt</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Game theory allocates shared costs fairly. Passengers who contribute shared overlap receive proportional discounts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToView('passenger-home')}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white font-medium text-xs flex items-center gap-1.5 hover:bg-neutral-800 transition-colors"
              >
                <span>Book Live Ride</span>
                <span className="material-symbols-outlined text-[15px]">electric_car</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fare Comparison Card */}
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-neutral-900">Transparent Cost Comparison</span>
                  <span className="text-xs font-mono font-semibold text-emerald-700">Savings: ₹110.00</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-md bg-white border border-neutral-200 flex items-center justify-between">
                    <div>
                      <strong className="text-neutral-900 block font-medium">Passenger 1 (Shivaji Nagar → Hinjewadi)</strong>
                      <span className="text-neutral-500">Solo: <s className="text-neutral-400">₹235.00</s></span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-neutral-900 block">₹170.00</span>
                      <span className="text-[10px] font-mono font-medium text-emerald-700">Save ₹65.00 (-27.6%)</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-md bg-white border border-neutral-200 flex items-center justify-between">
                    <div>
                      <strong className="text-neutral-900 block font-medium">Passenger 2 (Aundh → Wakad)</strong>
                      <span className="text-neutral-500">Solo: <s className="text-neutral-400">₹160.00</s></span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-neutral-900 block">₹115.00</span>
                      <span className="text-[10px] font-mono font-medium text-emerald-700">Save ₹45.00 (-28.1%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Axiom Proofs */}
              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 space-y-2.5">
                <h3 className="font-semibold text-xs text-neutral-900">Mathematical Axiom Guarantees</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-2 p-2 rounded-md bg-white border border-neutral-200">
                    <span className="material-symbols-outlined text-emerald-700 text-[15px] mt-0.5">check_circle</span>
                    <div>
                      <strong className="text-neutral-900 font-medium">Efficiency:</strong> The sum of passenger fares exactly covers the total vehicle operating cost.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-md bg-white border border-neutral-200">
                    <span className="material-symbols-outlined text-emerald-700 text-[15px] mt-0.5">check_circle</span>
                    <div>
                      <strong className="text-neutral-900 font-medium">Symmetry:</strong> Passengers with equal travel contributions pay identical fares.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-md bg-white border border-neutral-200">
                    <span className="material-symbols-outlined text-emerald-700 text-[15px] mt-0.5">check_circle</span>
                    <div>
                      <strong className="text-neutral-900 font-medium">Individual Rationality:</strong> No passenger ever pays more than their solo baseline.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stepper Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="px-3.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">arrow_back</span>
            Previous
          </button>

          <span className="text-xs text-neutral-500 font-mono">
            Step {currentStep} of 4
          </span>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
              className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center gap-1"
            >
              Next
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigateToView('passenger-home')}
              className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center gap-1"
            >
              Start Experience
              <span className="material-symbols-outlined text-[15px]">rocket_launch</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
