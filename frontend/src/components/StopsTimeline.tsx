import React from 'react';
import type { RouteTimelineState, TimelineStop } from '../services/cabinOccupancyService';

interface StopsTimelineProps {
  timelineState: RouteTimelineState;
  onAdvanceStop?: () => void;
  isAdvancing?: boolean;
}

export const StopsTimeline: React.FC<StopsTimelineProps> = ({
  timelineState,
  onAdvanceStop,
  isAdvancing = false,
}) => {
  const { stops, nextStop, completedCount, remainingCount, allCompleted, routeVisualState } = timelineState;

  const getVisualStateBadge = () => {
    switch (routeVisualState) {
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Route Completed
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-container text-on-primary-container flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            Confirmed Active Route
          </span>
        );
      case 'proposed':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-container flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            Proposed Schedule
          </span>
        );
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/30 shadow-card flex flex-col gap-4">
      {/* Timeline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold shadow-sm">
            <span className="material-symbols-outlined text-[20px]">alt_route</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-on-surface tracking-tight">
              Sequential Stops Timeline & Live ETAs
            </h2>
            <span className="text-[11px] text-on-surface-variant font-medium">
              {completedCount} Completed • {remainingCount} Upcoming Stops
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getVisualStateBadge()}
        </div>
      </div>

      {/* Next Up Alert Banner if trip is active */}
      {nextStop && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary-container/20 to-primary/10 border border-primary/30 flex items-center justify-between gap-3 animate-pulse-slow">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">near_me</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                Current Heading • Next Arrival
              </span>
              <span className="text-xs font-extrabold text-on-surface">
                {nextStop.location.name} ({nextStop.stop_type.toUpperCase()})
              </span>
              <span className="text-[11px] text-on-surface-variant">
                Passenger: <strong>{nextStop.passenger_name}</strong>
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs font-black text-primary block">
              ~{Math.max(1, Math.round(nextStop.eta_seconds_from_now / 60))} mins
            </span>
            <span className="text-[10px] text-on-surface-variant font-medium">
              ({nextStop.eta_seconds_from_now}s ETA)
            </span>
          </div>
        </div>
      )}

      {/* Stops Sequential Flow List */}
      <div className="flex flex-col gap-3 relative before:absolute before:top-4 before:bottom-4 before:left-4 before:w-0.5 before:bg-outline-variant/50">
        {stops.map((stop: TimelineStop, index: number) => {
          const isPickup = stop.stop_type === 'pickup';
          const isNext = stop.isNextUp;
          const isDone = stop.completed;

          return (
            <div
              key={stop.stop_id}
              className={`relative flex items-start gap-3.5 p-3 rounded-2xl transition-all border ${
                isDone
                  ? 'bg-surface-container-low/40 border-outline-variant/20 opacity-75'
                  : isNext
                  ? 'bg-surface-container-low border-primary shadow-sm ring-2 ring-primary/20'
                  : 'bg-surface-container-low/70 border-outline-variant/30'
              }`}
            >
              {/* Sequential Node Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 transition-transform ${
                  isDone
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : isNext
                    ? isPickup
                      ? 'bg-primary text-on-primary ring-4 ring-primary/30 animate-pulse'
                      : 'bg-secondary text-on-secondary ring-4 ring-secondary/30 animate-pulse'
                    : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/40'
                }`}
              >
                {isDone ? (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Stop Info Details */}
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isPickup
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {stop.stop_type}
                    </span>
                    <span
                      className={`text-xs font-bold truncate ${
                        isDone ? 'line-through text-on-surface-variant' : 'text-on-surface'
                      }`}
                    >
                      {stop.location.name}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-on-surface shrink-0">
                    {isDone ? 'Completed ✓' : `~${Math.round(stop.eta_seconds_from_now / 60)}m`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>
                    Passenger: <strong>{stop.passenger_name}</strong>
                  </span>
                  {/* Dynamic Occupancy Meter after this stop */}
                  <span className="font-semibold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">airline_seat_recline_normal</span>
                    <span>{stop.dynamicOccupancy} / 4 Onboard</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Simulation Advancement Control */}
      {onAdvanceStop && !allCompleted && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onAdvanceStop}
            disabled={isAdvancing}
            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/95 text-on-primary font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isAdvancing ? 'sync' : 'flag'}
            </span>
            <span>
              {isAdvancing
                ? 'Advancing Vehicle...'
                : 'Simulate Stop Arrival: Check Off Next Stop'}
            </span>
          </button>
          <span className="text-[10px] text-on-surface-variant text-center block mt-1.5">
            Demonstrates real-time checkmarks, ETA adjustments, and dynamic cabin seat occupancy.
          </span>
        </div>
      )}

      {allCompleted && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center text-xs font-bold text-emerald-800 dark:text-emerald-200">
          🎉 All route stops completed! Vehicle is now empty and standing by for next dispatch.
        </div>
      )}
    </div>
  );
};
