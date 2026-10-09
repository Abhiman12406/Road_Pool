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
    <div className="bg-white p-5 rounded-2xl border border-[#efefef] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Vehicle & Current Movement */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
          <span className="material-symbols-outlined text-[20px]">electric_car</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base text-black font-display">
              {vehicle.name}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#efefef] text-black">
              {vehicle.vehicle_id}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#5e5e5e] mt-0.5">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-black">battery_charging_full</span>
              <span className="font-mono">{vehicle.battery_pct}% EV</span>
            </span>
            <span>•</span>
            <span>Rider: <strong className="text-black font-medium">{activeRequest?.passenger_name || 'Rider'}</strong></span>
            <span>•</span>
            <span>At: <strong className="text-black font-medium">{vehicle.current_location.name}</strong></span>
          </div>
        </div>
      </div>

      {/* Center: Next Stop ETA */}
      {nextStop ? (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#efefef] text-xs">
          <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
          <div>
            <div className="text-[10px] uppercase font-medium text-[#5e5e5e] tracking-wider">
              Next: {nextStop.stop_type === 'pickup' ? 'Passenger pickup' : 'Drop-off'}
            </div>
            <div className="font-bold text-black">
              {nextStop.location.name}
              <span className="text-black ml-1.5 font-mono">
                (~{etaMinutes} min)
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-2 rounded-full bg-[#efefef] text-black text-xs font-medium">
          Final destination reached
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
            className="btn-uber-subtle px-4 py-2 text-xs flex items-center gap-1.5"
            title="Simulate vehicle reaching next scheduled stop"
          >
            <span className="material-symbols-outlined text-[16px]">skip_next</span>
            <span>{isAdvancing ? 'Advancing...' : 'Next stop'}</span>
          </button>
        )}

        {onCancelClick && (
          <button
            type="button"
            id="btn-cancel-active-ride"
            onClick={onCancelClick}
            className="px-3 py-1.5 rounded-full text-[#5e5e5e] hover:text-black hover:bg-[#efefef] text-xs font-medium transition-colors"
            title="Cancel active booking"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
