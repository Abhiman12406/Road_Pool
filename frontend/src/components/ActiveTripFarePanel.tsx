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
  const currentFare = activeRequest?.shapley_fare_inr ?? 82.5;
  const soloFare = activeRequest?.solo_fare_inr ?? 145.0;
  const savingsPct = soloFare > 0 ? Math.round(((soloFare - currentFare) / soloFare) * 100) : 41;
  const detourPct = activeRequest?.detour_pct ?? 8.3;

  return (
    <div className="space-y-4">
      {/* 1. Transparent Fair Fare Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Transparent In-Ride Fare
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                ₹{currentFare.toFixed(2)}
              </span>
              <span className="text-xs font-mono text-slate-400 line-through tabular-nums">
                ₹{soloFare.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 font-mono">
              Save {savingsPct}% (Shapley)
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Detour: +{detourPct.toFixed(1)}% (Cap ≤15%)
            </span>
          </div>
        </div>

        <button
          type="button"
          id="btn-open-shapley-sheet"
          onClick={onOpenShapleySheet}
          className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px] text-slate-700">balance</span>
          <span>View Shapley Savings Breakdown</span>
        </button>
      </div>

      {/* 2. Mid-Trip Co-Rider Consent Prompt (When candidate is pending) */}
      {activeJoinCandidate && onAcceptCandidate && onDeclineCandidate && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-700 text-[18px]">
                group_add
              </span>
              <div>
                <span className="font-bold text-xs text-amber-950 block">
                  Mid-Trip Co-Rider Request
                </span>
                <span className="text-[11px] text-amber-800">
                  {activeJoinCandidate.passenger_name} wants to join at {activeJoinCandidate.pickup.name}
                </span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 font-mono">
              Detour +{activeJoinCandidate.detour_pct.toFixed(1)}% ≤ 15%
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-white/80 border border-amber-200 text-[11px] flex justify-between text-slate-700 font-mono">
            <span>Your Fare: ₹{activeJoinCandidate.affected_passenger_fare_before.toFixed(2)} → <strong className="text-emerald-700">₹{activeJoinCandidate.affected_passenger_fare_after.toFixed(2)}</strong></span>
            <span className="text-emerald-700 font-bold">Extra Savings ₹{(activeJoinCandidate.affected_passenger_fare_before - activeJoinCandidate.affected_passenger_fare_after).toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="btn-passenger-accept-join"
              onClick={onAcceptCandidate}
              className="py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Accept Co-Rider
            </button>
            <button
              type="button"
              id="btn-passenger-decline-join"
              onClick={onDeclineCandidate}
              className="py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* 3. Cabin Occupancy Grid (4 Seats) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Cabin Occupancy
            </h3>
            <span className="text-[11px] text-slate-500">
              Tata Tigor EV • 4-Seat Layout
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100">
            {cabinState.occupiedCount}/{cabinState.totalCapacity} Seats
          </span>
        </div>

        <CabinLayoutGrid
          cabinState={cabinState}
          vehicleName={vehicle.name}
          vehicleId={vehicle.vehicle_id}
          onSelectSeat={onSelectSeat}
        />
      </div>
    </div>
  );
};
