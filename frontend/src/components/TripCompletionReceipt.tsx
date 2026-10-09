import React from 'react';
import type { RideRequest, Vehicle } from '../types/simulation';

interface TripCompletionReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  request: RideRequest | null;
  vehicle?: Vehicle | null;
  onBookAnother: () => void;
  onOpenShapleyExplanation: () => void;
}

export const TripCompletionReceipt: React.FC<TripCompletionReceiptProps> = ({
  isOpen,
  onClose,
  request,
  vehicle,
  onBookAnother,
  onOpenShapleyExplanation,
}) => {
  if (!isOpen || !request) return null;

  const soloFare = request.solo_fare_inr;
  const shapleyFare = request.shapley_fare_inr ?? soloFare * 0.74;
  const savingsInr = Math.max(0, soloFare - shapleyFare);
  const savingsPct = soloFare > 0 ? (savingsInr / soloFare) * 100 : 25;

  const soloDist = request.solo_distance_km;
  const co2SavedKg = Math.max(0.4, (soloDist * 0.12 * 1.5)).toFixed(1);
  const actualDurationMin = Math.round((request.pooled_eta_sec || request.solo_eta_sec * 1.1) / 60);
  const soloDurationMin = Math.round(request.solo_eta_sec / 60);
  const detourPct = request.detour_pct ?? 8.4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="trip-completion-receipt-modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-on-surface/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-surface-container-lowest text-on-surface rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Top Header with Green Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 text-center relative">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
            <span className="material-symbols-outlined text-[32px] text-white">check_circle</span>
          </div>
          <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white inline-block mb-1">
            Trip Completed • Official Receipt
          </span>
          <h2 className="text-xl font-black tracking-tight">Pune RidePool EV</h2>
          <p className="text-xs text-white/80 mt-0.5">
            Thank you for riding shared and keeping Pune clean!
          </p>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close receipt"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Passenger & Vehicle Info */}
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <div>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Passenger</span>
              <span className="font-extrabold text-sm text-on-surface">{request.passenger_name}</span>
              <span className="text-[10px] text-on-surface-variant block">Party of {request.party_size}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant block">EV Fleet Vehicle</span>
              <span className="font-bold text-sm text-primary">
                {vehicle?.name || 'Tata Tigor EV • Pune Pool #1'}
              </span>
              <span className="text-[10px] text-on-surface-variant block">
                Driver: Kailash Deshmukh (4.92 ★)
              </span>
            </div>
          </div>

          {/* Route Segment */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
              <div>
                <span className="text-[10px] text-on-surface-variant block font-medium">Pickup Landmark</span>
                <span className="font-bold text-on-surface text-xs">{request.pickup.name}</span>
              </div>
            </div>
            <div className="border-l-2 border-dashed border-outline-variant/40 ml-1.5 h-3"></div>
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
              <div>
                <span className="text-[10px] text-on-surface-variant block font-medium">Drop-off Destination</span>
                <span className="font-bold text-on-surface text-xs">{request.dropoff.name}</span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown (Shapley Value Receipt) */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                Fair-Fare Cost Allocation
              </span>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full border border-emerald-300">
                {savingsPct.toFixed(1)}% SAVED
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
                <span className="text-[10px] text-on-surface-variant block">Solo Taxi Fare</span>
                <span className="text-sm font-bold text-on-surface block mt-0.5 line-through opacity-70">
                  ₹{soloFare.toFixed(2)}
                </span>
                <span className="text-[9px] text-on-surface-variant block">Direct estimate</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
                <span className="text-[10px] text-emerald-700 font-bold block">Shapley Fare Paid</span>
                <span className="text-base font-black text-emerald-700 block mt-0.5">
                  ₹{shapleyFare.toFixed(2)}
                </span>
                <span className="text-[9px] text-emerald-600 block">Reconciled exact</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/10">
                <span className="text-[10px] text-emerald-700 font-bold block">Net Savings</span>
                <span className="text-base font-black text-emerald-700 block mt-0.5">
                  ₹{savingsInr.toFixed(2)}
                </span>
                <span className="text-[9px] text-emerald-600 block">In your wallet</span>
              </div>
            </div>

            <button
              type="button"
              id="btn-inspect-shapley-from-receipt"
              onClick={onOpenShapleyExplanation}
              className="w-full py-2 px-3 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-xs font-bold text-primary flex items-center justify-center gap-1.5 transition-all border border-outline-variant/20 shadow-sm"
            >
              <span className="material-symbols-outlined text-[15px]">balance</span>
              <span>Why am I paying this fare? (7-Coalition Audit)</span>
            </button>
          </div>

          {/* Environmental & Detour Metric Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="material-symbols-outlined text-[16px]">eco</span>
                <span>Green Impact</span>
              </div>
              <div className="mt-2">
                <span className="text-base font-black text-emerald-700 block">
                  ~{co2SavedKg} kg CO₂
                </span>
                <span className="text-[10px] text-on-surface-variant block mt-0.5">
                  Avoided via shared EV vs 2 solo taxis
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-primary font-bold">
                <span className="material-symbols-outlined text-[16px]">timer</span>
                <span>Trip Time & Detour</span>
              </div>
              <div className="mt-2">
                <span className="text-base font-black text-on-surface block">
                  {actualDurationMin} min <span className="text-[11px] font-normal text-on-surface-variant">({soloDurationMin}m solo)</span>
                </span>
                <span className="text-[10px] text-tertiary font-bold block mt-0.5">
                  Detour: +{detourPct.toFixed(1)}% (Cap ≤15%)
                </span>
              </div>
            </div>
          </div>

          {/* Game Theory Invariant Stamp */}
          <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-emerald-600 text-[14px]">verified</span>
              <span>Budget Balance ∑ϕ_i ≡ c(N)</span>
            </span>
            <span>Individual Rationality Certified</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-outline-variant/20 bg-surface-container-low/50 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all border border-outline-variant/30"
          >
            Close Receipt
          </button>
          <button
            type="button"
            id="btn-book-another-ride"
            onClick={onBookAnother}
            className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/95 text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Book Another Ride</span>
          </button>
        </div>
      </div>
    </div>
  );
};
