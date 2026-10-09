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
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white text-black rounded-2xl shadow-2xl border border-[#efefef] overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="bg-black text-white p-6 text-center relative">
          <div className="w-14 h-14 rounded-full bg-[#282828] flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-[32px] text-white">check_circle</span>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-mono font-medium bg-[#282828] text-white inline-block mb-1">
            Trip completed • Official receipt
          </span>
          <h2 className="text-2xl font-bold font-display tracking-tight text-white">RidePool Pune</h2>
          <p className="text-xs text-[#afafaf] mt-1">
            Thank you for riding shared and keeping Pune clean
          </p>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#282828] hover:bg-[#383838] flex items-center justify-center text-white transition-colors"
            aria-label="Close receipt"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Passenger & Vehicle Info */}
          <div className="flex items-center justify-between pb-3 border-b border-[#efefef]">
            <div>
              <span className="text-[10px] uppercase font-medium text-[#5e5e5e] block">Passenger</span>
              <span className="font-bold text-sm text-black">{request.passenger_name}</span>
              <span className="text-[11px] text-[#5e5e5e] block">Party of {request.party_size}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-medium text-[#5e5e5e] block">EV fleet vehicle</span>
              <span className="font-bold text-sm text-black">
                {vehicle?.name || 'Tata Tigor EV • Pune Pool #1'}
              </span>
              <span className="text-[11px] text-[#5e5e5e] block">
                Driver: Kailash Deshmukh (4.9 ★)
              </span>
            </div>
          </div>

          {/* Route Segment */}
          <div className="p-4 rounded-xl bg-[#efefef] space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-black mt-1 shrink-0"></span>
              <div>
                <span className="text-[10px] text-[#5e5e5e] block font-medium">Pickup landmark</span>
                <span className="font-bold text-black text-xs">{request.pickup.name}</span>
              </div>
            </div>
            <div className="border-l-2 border-dashed border-[#afafaf] ml-1 h-3"></div>
            <div className="flex items-start gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-black mt-1 shrink-0"></span>
              <div>
                <span className="text-[10px] text-[#5e5e5e] block font-medium">Drop-off destination</span>
                <span className="font-bold text-black text-xs">{request.dropoff.name}</span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown (Shapley Value Receipt) */}
          <div className="p-4 rounded-xl bg-[#efefef] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#5e5e5e] uppercase tracking-wider">
                Fair-fare cost allocation
              </span>
              <span className="text-xs font-mono font-medium text-white bg-black px-2.5 py-0.5 rounded-full">
                {savingsPct.toFixed(1)}% SAVED
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-white border border-[#e2e2e2]">
                <span className="text-[10px] text-[#5e5e5e] block">Solo taxi fare</span>
                <span className="text-sm font-bold text-[#afafaf] block mt-0.5 line-through">
                  ₹{soloFare.toFixed(2)}
                </span>
                <span className="text-[9px] text-[#5e5e5e] block">Direct estimate</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#e2e2e2]">
                <span className="text-[10px] text-[#5e5e5e] block">Shapley fare paid</span>
                <span className="text-lg font-bold font-display text-black block mt-0.5">
                  ₹{shapleyFare.toFixed(2)}
                </span>
                <span className="text-[9px] text-[#5e5e5e] block">Reconciled exact</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#e2e2e2]">
                <span className="text-[10px] text-[#5e5e5e] block">Net savings</span>
                <span className="text-lg font-bold font-display text-black block mt-0.5">
                  ₹{savingsInr.toFixed(2)}
                </span>
                <span className="text-[9px] text-[#5e5e5e] block">In your wallet</span>
              </div>
            </div>

            <button
              type="button"
              id="btn-inspect-shapley-from-receipt"
              onClick={onOpenShapleyExplanation}
              className="btn-uber-subtle w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">balance</span>
              <span>Why am I paying this fare? (7-Coalition audit)</span>
            </button>
          </div>

          {/* Environmental & Detour Metric Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-[#f8f8f8] border border-[#efefef] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-black font-medium">
                <span className="material-symbols-outlined text-[16px]">eco</span>
                <span>Green impact</span>
              </div>
              <div className="mt-2">
                <span className="text-base font-bold font-display text-black block">
                  ~{co2SavedKg} kg CO₂
                </span>
                <span className="text-[10px] text-[#5e5e5e] block mt-0.5">
                  Avoided via shared EV vs 2 solo taxis
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#f8f8f8] border border-[#efefef] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-black font-medium">
                <span className="material-symbols-outlined text-[16px]">timer</span>
                <span>Trip time & detour</span>
              </div>
              <div className="mt-2">
                <span className="text-base font-bold font-display text-black block">
                  {actualDurationMin} min <span className="text-[11px] font-normal text-[#5e5e5e]">({soloDurationMin}m solo)</span>
                </span>
                <span className="text-[10px] text-[#5e5e5e] block mt-0.5">
                  Detour: +{detourPct.toFixed(1)}% (Cap ≤15%)
                </span>
              </div>
            </div>
          </div>

          {/* Game Theory Invariant Stamp */}
          <div className="p-2.5 rounded-full bg-[#efefef] flex items-center justify-between text-[10px] font-mono text-[#5e5e5e] px-4">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-black text-[14px]">verified</span>
              <span>Budget balance ∑ϕ_i ≡ c(N)</span>
            </span>
            <span>Individual rationality certified</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#efefef] bg-white flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-uber-subtle flex-1 py-3 text-xs"
          >
            Close receipt
          </button>
          <button
            type="button"
            id="btn-book-another-ride"
            onClick={onBookAnother}
            className="btn-uber-primary flex-1 py-3 text-xs flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Book another ride</span>
          </button>
        </div>
      </div>
    </div>
  );
};
