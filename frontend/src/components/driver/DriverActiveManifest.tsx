import React, { useState } from 'react';

export interface DriverManifestStop {
  id: string;
  type: 'pickup' | 'dropoff';
  passengerName: string;
  locationName: string;
  landmark?: string;
  etaMinutes: number;
  completed: boolean;
  active: boolean;
}

export const DEFAULT_DEMO_STOPS: DriverManifestStop[] = [
  {
    id: 'stop-1',
    type: 'pickup',
    passengerName: 'Rahul S.',
    locationName: 'MG Road Metro Station',
    landmark: 'Gate 2 Pick-up Bay',
    etaMinutes: 4,
    completed: false,
    active: true,
  },
  {
    id: 'stop-2',
    type: 'pickup',
    passengerName: 'Priya M.',
    locationName: 'Shivajinagar Bus Terminal',
    landmark: 'Platform 4 Curb',
    etaMinutes: 11,
    completed: false,
    active: false,
  },
  {
    id: 'stop-3',
    type: 'dropoff',
    passengerName: 'Rahul S.',
    locationName: 'Baner Road High Street',
    landmark: 'Opposite Westend Mall',
    etaMinutes: 24,
    completed: false,
    active: false,
  },
  {
    id: 'stop-4',
    type: 'dropoff',
    passengerName: 'Priya M.',
    locationName: 'Hinjewadi Phase 1 IT Park',
    landmark: 'Infosys Circle Gate 1',
    etaMinutes: 38,
    completed: false,
    active: false,
  },
];

interface DriverActiveManifestProps {
  stops?: DriverManifestStop[];
  onAdvanceStop?: (stopId: string) => void;
  onCompleteTrip?: () => void;
  onOpenTripDetails?: () => void;
  onSimulateMidTripJoin?: () => void;
  vehicleName?: string;
  occupiedSeats?: number;
  totalSeats?: number;
}

export const DriverActiveManifest: React.FC<DriverActiveManifestProps> = ({
  stops = DEFAULT_DEMO_STOPS,
  onAdvanceStop,
  onCompleteTrip,
  onOpenTripDetails,
  onSimulateMidTripJoin,
  vehicleName = 'Tata Tigor EV (MH 12 QX 4092)',
  occupiedSeats = 2,
  totalSeats = 4,
}) => {
  const [localStops, setLocalStops] = useState<DriverManifestStop[]>(stops);

  const activeIndex = localStops.findIndex((s) => !s.completed);
  const activeStop = activeIndex !== -1 ? localStops[activeIndex] : null;
  const isAllCompleted = activeIndex === -1 && localStops.length > 0;

  const handleConfirmCurrentStop = () => {
    if (!activeStop) return;

    const nextStops = localStops.map((s, idx) => {
      if (idx === activeIndex) {
        return { ...s, completed: true, active: false };
      }
      if (idx === activeIndex + 1) {
        return { ...s, active: true };
      }
      return s;
    });

    setLocalStops(nextStops);

    if (onAdvanceStop) {
      onAdvanceStop(activeStop.id);
    }

    // If this was the last stop, complete trip
    if (activeIndex === localStops.length - 1) {
      if (onCompleteTrip) {
        onCompleteTrip();
      }
    }
  };

  return (
    <div
      id="driver-active-manifest-card"
      className="bg-white rounded-2xl border border-[#efefef] shadow-card-elevated overflow-hidden flex flex-col"
    >
      {/* Top Banner: In-Transit Status */}
      <div className="bg-black text-white p-5 border-b border-[#282828]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
            <span className="text-xs font-mono font-medium text-white tracking-wider">
              En route • Live trip execution
            </span>
          </div>

          <span className="text-[11px] font-mono px-3 py-0.5 rounded-full bg-[#282828] text-white">
            {vehicleName.split('(')[0].trim()}
          </span>
        </div>

        {/* Next Stop Callout */}
        <div className="mt-3 bg-[#181818] rounded-xl p-3.5 border border-[#282828]">
          <span className="text-[11px] font-medium text-[#afafaf] block uppercase tracking-wider">
            Next action required
          </span>
          {activeStop ? (
            <div className="flex items-center justify-between mt-1">
              <div>
                <span className="text-sm font-bold text-white block">
                  {activeStop.type === 'pickup' ? 'Pick up' : 'Drop off'} {activeStop.passengerName}
                </span>
                <span className="text-xs text-[#afafaf]">
                  {activeStop.locationName} • ~{activeStop.etaMinutes} min away
                </span>
              </div>
              <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-[#282828] text-white">
                {activeStop.type.toUpperCase()}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-bold text-white">
                All stops executed successfully
              </span>
              <span className="material-symbols-outlined text-white">done_all</span>
            </div>
          )}
        </div>
      </div>

      {/* Seat Occupancy & Detour Guarantee Bar */}
      <div className="px-5 py-3 bg-[#f8f8f8] border-b border-[#efefef] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-black">airline_seat_recline_normal</span>
          <span className="font-medium text-black">
            Cabin: {occupiedSeats} of {totalSeats} seats occupied
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-black bg-[#efefef] px-3 py-1 rounded-full">
          <span className="material-symbols-outlined text-[15px]">verified</span>
          <span className="text-[11px] font-medium">15% detour guarantee</span>
        </div>
      </div>

      {/* Turn-by-Turn Stop Manifest List */}
      <div className="p-5 space-y-3 overflow-y-auto max-h-[380px]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-[#5e5e5e] uppercase tracking-wider">
            Optimized stop sequence ({localStops.length} waypoints)
          </span>
          <span className="text-[11px] text-[#5e5e5e] font-mono">
            {activeIndex !== -1 ? `Stop ${activeIndex + 1} of ${localStops.length}` : 'Completed'}
          </span>
        </div>

        <div className="space-y-2.5">
          {localStops.map((stop, idx) => {
            const isPickup = stop.type === 'pickup';
            const isCurrent = idx === activeIndex;
            const isDone = stop.completed;

            return (
              <div
                key={stop.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-[#f3f3f3] border-black shadow-sm'
                    : isDone
                    ? 'bg-white border-[#efefef] opacity-50'
                    : 'bg-white border-[#efefef]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Step indicator */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      isDone
                        ? 'bg-black text-white'
                        : isCurrent
                        ? 'bg-black text-white'
                        : 'bg-[#efefef] text-[#5e5e5e]'
                    }`}
                  >
                    {isDone ? (
                      <span className="material-symbols-outlined text-[15px]">check</span>
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Stop Information */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-black text-xs truncate">
                        {isPickup ? 'Pick up' : 'Drop off'} {stop.passengerName}
                      </span>
                      <span
                        className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-[#efefef] text-black"
                      >
                        {isPickup ? 'PICKUP' : 'DROPOFF'}
                      </span>
                    </div>

                    <p className="text-xs text-[#5e5e5e] mt-0.5 truncate">
                      {stop.locationName}
                    </p>

                    {stop.landmark && (
                      <p className="text-[11px] text-[#afafaf] truncate mt-0.5">
                        Landmark: {stop.landmark}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between text-[11px] text-[#5e5e5e]">
                      <span>ETA: {stop.etaMinutes} min</span>
                      {isCurrent && (
                        <span className="font-medium text-black flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping"></span>
                          Approaching stop
                        </span>
                      )}
                      {isDone && (
                        <span className="text-[#afafaf]">Completed</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Execution Controls */}
      <div className="p-5 pt-0 space-y-2 mt-auto border-t border-[#efefef]">
        {/* Next Stop Advance Button */}
        {!isAllCompleted && activeStop && (
          <button
            type="button"
            id="driver-confirm-stop-btn"
            onClick={handleConfirmCurrentStop}
            className="btn-uber-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 mt-3"
          >
            <span className="material-symbols-outlined text-[18px]">
              {activeStop.type === 'pickup' ? 'person_add' : 'check_circle'}
            </span>
            <span>
              {activeStop.type === 'pickup'
                ? `Confirm pickup (${activeStop.passengerName})`
                : activeIndex === localStops.length - 1
                ? `Complete trip (${activeStop.passengerName})`
                : `Confirm drop-off (${activeStop.passengerName})`}
            </span>
          </button>
        )}

        {isAllCompleted && (
          <button
            type="button"
            id="driver-view-final-receipt-btn"
            onClick={onCompleteTrip}
            className="btn-uber-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 mt-3"
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            <span>View trip completion receipt</span>
          </button>
        )}

        {/* Secondary utilities: Mid-Trip Join Simulation & Trip Details Drawer */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {onSimulateMidTripJoin && !isAllCompleted && (
            <button
              type="button"
              id="driver-simulate-mid-trip-btn"
              onClick={onSimulateMidTripJoin}
              className="btn-uber-subtle w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
              title="Test Mid-Trip Join Algorithmic Flow"
            >
              <span className="material-symbols-outlined text-[16px]">group_add</span>
              <span>Test mid-trip join</span>
            </button>
          )}

          {onOpenTripDetails && (
            <button
              type="button"
              id="driver-open-trip-details-btn"
              onClick={onOpenTripDetails}
              className={`btn-uber-subtle w-full py-2.5 text-xs flex items-center justify-center gap-1.5 ${
                isAllCompleted ? 'col-span-2' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">analytics</span>
              <span>Trip details & fares</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
