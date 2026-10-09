import React from 'react';
import type { Vehicle, RideRequest } from '../types/simulation';

interface ActiveTripHeaderProps {
  vehicle: Vehicle;
  activeRequest?: RideRequest;
  onAdvanceStop?: (vehicleId: string) => Promise<any>;
  onCancelClick?: () => void;
  isAdvancing?: boolean;
}

export const ActiveTripHeader: React.FC<ActiveTripHeaderProps> = ({
  vehicle,
  activeRequest,
  onAdvanceStop,
  onCancelClick,
  isAdvancing = false,
}) => {
  const nextStop = vehicle.planned_stops?.find((s) => !s.completed);
  const etaMinutes = nextStop ? Math.max(1, Math.round(nextStop.eta_seconds_from_now / 60)) : 0;

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Vehicle & Current Movement */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
          <span className="material-symbols-outlined text-[20px]">electric_car</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm sm:text-base text-slate-900">
              {vehicle.name}
            </h2>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
              {vehicle.vehicle_id}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-emerald-600">battery_charging_full</span>
              <span className="font-mono">{vehicle.battery_pct}% EV</span>
            </span>
            <span>•</span>
            <span>Rider: <strong className="text-slate-800">{activeRequest?.passenger_name || 'Rider'}</strong></span>
            <span>•</span>
            <span>At: <strong className="text-slate-800">{vehicle.current_location.name}</strong></span>
          </div>
        </div>
      </div>

      {/* Center: Next Stop ETA */}
      {nextStop ? (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Next: {nextStop.stop_type === 'pickup' ? 'Passenger Pickup' : 'Drop-off'}
            </div>
            <div className="font-bold text-slate-900">
              {nextStop.location.name}
              <span className="text-emerald-700 ml-1.5 font-mono">
                (~{etaMinutes} min)
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
          Final Destination Reached
        </div>
      )}

      {/* Right: Driver Action & Cancellation */}
      <div className="flex items-center gap-2 self-end md:self-center">
        {onAdvanceStop && (
          <button
            type="button"
            id="btn-advance-stop"
            onClick={() => onAdvanceStop(vehicle.vehicle_id)}
            disabled={isAdvancing}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Simulate vehicle reaching next scheduled stop"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-700">skip_next</span>
            <span>{isAdvancing ? 'Advancing...' : 'Next Stop'}</span>
          </button>
        )}

        {onCancelClick && (
          <button
            type="button"
            id="btn-cancel-active-ride"
            onClick={onCancelClick}
            className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
            title="Cancel active booking"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
