import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '../lib/gsap';
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Safe animation with clearProps to avoid stuck opacity or disappearing stop items
  useGSAP(
    () => {
      gsap.fromTo(
        '.timeline-stop-item',
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.04,
          ease: 'power2.out',
          clearProps: 'all',
        }
      );
    },
    { dependencies: [stops.length, completedCount], scope: containerRef }
  );

  const getVisualStateBadge = () => {
    switch (routeVisualState) {
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
            <span className="material-symbols-outlined text-[14px] text-emerald-600">check_circle</span>
            Route Completed
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black text-white flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Active Corridor
          </span>
        );
      case 'proposed':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1.5 shadow-2xs">
            <span className="material-symbols-outlined text-[14px] text-zinc-500">schedule</span>
            Proposed Schedule
          </span>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-2xl p-5 sm:p-6 border border-[#efefef] shadow-card flex flex-col gap-4 overflow-hidden"
    >
      {/* 1. Timeline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#efefef]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[20px]">alt_route</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-zinc-950 tracking-tight">
              Sequential Stops Timeline & Live ETAs
            </h2>
            <span className="text-xs text-zinc-500 font-medium block">
              {completedCount} of {stops.length} completed • {remainingCount} upcoming stops
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {getVisualStateBadge()}
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
            {stops.length} Total Stops
          </span>
        </div>
      </div>

      {/* 2. Next Up Active Navigation HUD Banner */}
      {nextStop && !allCompleted && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white shadow-md border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold shrink-0 shadow-sm animate-pulse">
              <span className="material-symbols-outlined text-[18px]">near_me</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Current Heading • Next Arrival
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-white/10 text-white">
                  {nextStop.stop_type}
                </span>
              </div>
              <div className="text-sm font-bold text-white truncate">
                {nextStop.location.name}
              </div>
              <div className="text-xs text-zinc-300">
                {nextStop.stop_type === 'pickup' ? 'Boarding co-rider' : 'Dropping off'}:{' '}
                <strong className="text-white">{nextStop.passenger_name}</strong>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0 bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 flex sm:flex-col items-center sm:items-end justify-between gap-1">
            <div className="text-xs font-mono font-extrabold text-emerald-300">
              ~{Math.max(1, Math.round(nextStop.eta_seconds_from_now / 60))} mins
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              ({nextStop.eta_seconds_from_now}s countdown)
            </div>
          </div>
        </div>
      )}

      {/* 3. Stops Sequential Rail Timeline */}
      <div className="flex flex-col relative py-1">
        {stops.map((stop: TimelineStop, index: number) => {
          const isPickup = stop.stop_type === 'pickup';
          const isNext = stop.isNextUp;
          const isDone = stop.completed;
          const isLast = index === stops.length - 1;

          return (
            <div
              key={stop.stop_id}
              className="timeline-stop-item relative flex items-start gap-3.5 pb-4 last:pb-0"
            >
              {/* Connecting Transit Spine Track */}
              {!isLast && (
                <div
                  className={`absolute left-4 top-8 bottom-0 w-0.5 -ml-[1px] transition-colors ${
                    isDone
                      ? stops[index + 1]?.completed
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-b from-emerald-500 to-black'
                      : isNext
                      ? 'bg-gradient-to-b from-black to-zinc-300'
                      : 'bg-zinc-200'
                  }`}
                />
              )}

              {/* Node Beacon Indicator */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 transition-all shadow-xs ${
                  isDone
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                    : isNext
                    ? 'bg-black text-white ring-4 ring-black/15 shadow-md scale-105'
                    : 'bg-white text-zinc-700 border-2 border-zinc-300'
                }`}
              >
                {isDone ? (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                ) : isNext ? (
                  <span className="material-symbols-outlined text-[16px] text-emerald-400 animate-pulse">
                    navigation
                  </span>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Stop Card Information */}
              <div
                className={`flex-1 rounded-xl p-3.5 transition-all border flex flex-col gap-2 min-w-0 ${
                  isNext
                    ? 'bg-white border-2 border-black shadow-sm ring-2 ring-black/5'
                    : isDone
                    ? 'bg-zinc-50/80 hover:bg-zinc-100/70 border-zinc-200/80'
                    : 'bg-white hover:bg-zinc-50/80 border-zinc-200'
                }`}
              >
                {/* Card Top Row: Stop Type, Location, ETA / Status */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                        isPickup
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {isPickup ? 'north' : 'south'}
                      </span>
                      {stop.stop_type}
                    </span>

                    {/* Crisp location name with high-contrast text and NO line-through */}
                    <span
                      className={`text-xs sm:text-sm truncate ${
                        isNext
                          ? 'font-extrabold text-black'
                          : isDone
                          ? 'font-bold text-zinc-900'
                          : 'font-semibold text-zinc-800'
                      }`}
                      title={stop.location.name}
                    >
                      {stop.location.name}
                    </span>
                  </div>

                  {/* ETA or Completed Status Badge */}
                  <div className="shrink-0">
                    {isDone ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-emerald-600">check</span>
                        Completed
                      </span>
                    ) : isNext ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-black text-white flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        ~{Math.max(1, Math.round(stop.eta_seconds_from_now / 60))}m ETA
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                        ~{Math.max(1, Math.round(stop.eta_seconds_from_now / 60))}m ETA
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Bottom Row: Passenger Name & Dynamic Occupancy */}
                <div className="flex items-center justify-between gap-2 text-xs text-zinc-600 pt-0.5 border-t border-zinc-100">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-[15px] text-zinc-400 shrink-0">
                      person
                    </span>
                    <span className="truncate">
                      Passenger: <strong className="text-zinc-900 font-semibold">{stop.passenger_name}</strong>
                    </span>
                  </div>

                  {/* Visual 4-Segment Dynamic Occupancy Gauge */}
                  <div
                    className="flex items-center gap-1.5 shrink-0 bg-zinc-100/80 px-2 py-0.5 rounded-md border border-zinc-200/60"
                    title={`Dynamic cabin occupancy: ${stop.dynamicOccupancy} of 4 seats onboard after this stop`}
                  >
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4].map((seatNum) => (
                        <span
                          key={seatNum}
                          className={`w-1.5 h-2.5 rounded-[1px] transition-colors ${
                            seatNum <= stop.dynamicOccupancy
                              ? isDone
                                ? 'bg-emerald-600'
                                : isNext
                                ? 'bg-black'
                                : 'bg-zinc-700'
                              : 'bg-zinc-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-zinc-700">
                      {stop.dynamicOccupancy} / 4 Onboard
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Interactive Simulation Advancement Control */}
      {onAdvanceStop && !allCompleted && (
        <div className="pt-2 flex flex-col gap-1.5">
          <button
            type="button"
            id="btn-advance-stop"
            onClick={onAdvanceStop}
            disabled={isAdvancing}
            className="w-full h-11 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                isAdvancing ? 'animate-spin' : ''
              }`}
            >
              {isAdvancing ? 'sync' : 'flag'}
            </span>
            <span>
              {isAdvancing
                ? 'Advancing Corridor Stop...'
                : 'Simulate Stop Arrival: Check Off Next Stop'}
            </span>
          </button>
          <span className="text-[11px] text-zinc-500 text-center block">
            Demonstrates real-time checkmarks, ETA adjustments, and dynamic cabin seat occupancy.
          </span>
        </div>
      )}

      {/* 5. All Stops Completed Celebration State Banner */}
      {allCompleted && (
        <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-300 text-emerald-950 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-emerald-950">
              All Route Stops Completed Successfully
            </div>
            <div className="text-[11px] text-emerald-800">
              All passengers reached their destinations. Vehicle cabin is now empty (0/4) and standing by for next dispatch.
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
            Idle & Ready
          </span>
        </div>
      )}
    </div>
  );
};
