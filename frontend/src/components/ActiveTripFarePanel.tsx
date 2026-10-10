import React from 'react';
import type { Vehicle, RideRequest, MidTripJoinCandidate } from '../types/simulation';
import { CabinLayoutGrid } from './CabinLayoutGrid';
import type { CabinLayoutState, CabinSeat } from '../services/cabinOccupancyService';

interface ActiveTripFarePanelProps {
  vehicle: Vehicle;
  activeRequest?: RideRequest;
  cabinState: CabinLayoutState;
  onOpenShapleySheet: () => void;
  onSelectSeat?: (seat: CabinSeat) => void;
  activeJoinCandidate?: MidTripJoinCandidate | null;
  onAcceptCandidate?: () => void;
  onDeclineCandidate?: () => void;
}

export const ActiveTripFarePanel: React.FC<ActiveTripFarePanelProps> = ({
  vehicle,
  activeRequest,
  cabinState,
  onOpenShapleySheet,
  onSelectSeat,
  activeJoinCandidate,
  onAcceptCandidate,
  onDeclineCandidate,
}) => {
  const soloFare = activeRequest?.solo_fare_inr ?? 250.0;
  const currentFare =
    activeRequest?.shapley_fare_inr ??
    (Math.round(soloFare * 0.75 * 100) / 100);
  const savingsPct =
    soloFare > 0 ? Math.round(((soloFare - currentFare) / soloFare) * 100) : 25;
  const detourPct = activeRequest?.detour_pct ?? 8.3;

  return (
    <div className="space-y-4">
      {/* 1. Transparent Fair Fare Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#efefef] shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#efefef]">
          <div>
            <span className="text-[11px] uppercase font-medium text-[#5e5e5e] tracking-wider block">
              In-ride fare
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-bold font-display text-black tabular-nums">
                ₹{currentFare.toFixed(2)}
              </span>
              <span className="text-sm font-mono text-[#5e5e5e] line-through tabular-nums">
                ₹{soloFare.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-black text-white font-mono">
              Save {savingsPct}% (Shapley)
            </span>
            <span className="text-xs text-[#5e5e5e] font-mono">
              Detour: +{detourPct.toFixed(1)}% (Cap ≤15%)
            </span>
          </div>
        </div>

        <button
          type="button"
          id="btn-open-shapley-sheet"
          onClick={onOpenShapleySheet}
          className="btn-uber-subtle w-full py-3 text-xs flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">balance</span>
          <span>View Shapley savings breakdown</span>
        </button>
      </div>

      {/* 2. Mid-Trip Co-Rider Consent Prompt */}
      {activeJoinCandidate && onAcceptCandidate && onDeclineCandidate && (
        <div className="p-5 rounded-2xl bg-[#efefef] border border-[#e2e2e2] space-y-3 animate-in fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[18px]">group_add</span>
              </div>
              <div>
                <span className="font-bold text-xs text-black block">
                  Mid-trip co-rider request
                </span>
                <span className="text-[11px] text-[#5e5e5e]">
                  {activeJoinCandidate.passenger_name} wants to join at {activeJoinCandidate.pickup.name}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-black text-white">
              Detour +{activeJoinCandidate.detour_pct.toFixed(1)}% ≤ 15%
            </span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-[#efefef] text-xs flex flex-wrap items-center justify-between gap-2 text-[#5e5e5e] font-mono">
            <span>Your fare: ₹{activeJoinCandidate.affected_passenger_fare_before.toFixed(2)} → <strong className="text-black">₹{activeJoinCandidate.affected_passenger_fare_after.toFixed(2)}</strong></span>
            <span className="text-black font-bold">Extra savings ₹{(activeJoinCandidate.affected_passenger_fare_before - activeJoinCandidate.affected_passenger_fare_after).toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="btn-passenger-accept-join"
              onClick={onAcceptCandidate}
              className="btn-uber-primary py-2.5 text-xs"
            >
              Accept co-rider
            </button>
            <button
              type="button"
              id="btn-passenger-decline-join"
              onClick={onDeclineCandidate}
              className="btn-uber-subtle py-2.5 text-xs"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* 3. Real-Time Interactive Cabin Occupancy Grid */}
      <CabinLayoutGrid
        cabinState={cabinState}
        vehicleName={vehicle.name}
        vehicleId={vehicle.vehicle_id}
        onSelectSeat={onSelectSeat}
      />
    </div>
  );
};
