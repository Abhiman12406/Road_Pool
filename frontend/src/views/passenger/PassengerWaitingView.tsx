import React from 'react';
import type { GlobalSimulationSnapshot } from '../../types/simulation';
import { LiveMap } from '../../components/LiveMap';

interface PassengerWaitingViewProps {
  snapshot: GlobalSimulationSnapshot | null;
  onDispatchNow: () => void;
  onBackToBooking: () => void;
  onSelectVehicle: (id: string) => void;
  onSelectRequest: (id: string) => void;
}

export const PassengerWaitingView: React.FC<PassengerWaitingViewProps> = ({
  snapshot,
  onDispatchNow,
  onBackToBooking,
  onSelectVehicle,
  onSelectRequest,
}) => {
  const engine = snapshot?.engine;
  const session = snapshot?.activePassengerSession;
  const requests = snapshot?.requests || {};
  const vehicles = snapshot?.vehicles || {};

  const activeReqId = session?.activeTripRequestId;
  const activeReq = activeReqId ? requests[activeReqId] : Object.values(requests)[0];

  const currentWindowId = engine?.currentWindowId ?? 101;
  const timeRemaining = engine?.timeRemainingInWindowSec ?? 30;
  const totalWindowSec = engine?.windowIntervalSec ?? 30;
  const isMatched = activeReq?.status === 'matched' || activeReq?.status === 'en_route_pickup' || activeReq?.status === 'in_transit';

  const progressPercent = Math.max(0, Math.min(100, Math.round(((totalWindowSec - timeRemaining) / totalWindowSec) * 100)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
      {/* LEFT COLUMN: Matching Telemetry & Batch Countdown (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        {/* Master Matching Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 shadow-card border border-outline-variant/30 relative overflow-hidden flex flex-col gap-6">
          {/* Ambient Glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-container/20 rounded-full blur-3xl pointer-events-none"></div>

          {/* Top Header */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold shadow-sm">
                <span className="material-symbols-outlined text-[20px]">electric_car</span>
              </div>
              <div>
                <h1 className="font-extrabold text-lg text-on-surface tracking-tight">
                  {activeReq?.request_id || 'REQ-P101'}
                </h1>
                <span className="text-xs text-on-surface-variant font-medium">
                  {isMatched ? 'Trip Matched & Dispatched' : 'Grouping into Cooperative Pool'}
                </span>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                isMatched
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                  : 'bg-secondary-container/40 text-on-secondary-container'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isMatched ? 'bg-tertiary' : 'bg-secondary animate-ping'}`}></span>
              {isMatched ? 'Matched ✓' : `Batch Window #${currentWindowId}`}
            </span>
          </div>

          {/* Animated Countdown Gauge Hero */}
          <div className="bg-gradient-to-br from-surface-container-low via-surface-bright to-surface-container-high/40 rounded-2xl p-5 border border-outline-variant/30 flex flex-col items-center justify-center gap-4 text-center z-10">
            {!isMatched ? (
              <>
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-28 h-28 -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      className="text-surface-container"
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="42"
                      stroke="currentColor"
                      strokeWidth="8"
                    />
                    <circle
                      className="text-primary transition-all duration-1000"
                      cx="50"
                      cy="50"
                      fill="transparent"
                      r="42"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray="264"
                      strokeDashoffset={264 - (264 * progressPercent) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-on-surface leading-none">
                      {timeRemaining}
                    </span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">
                      Sec
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    Rolling Intake Window
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    Batch closes in {timeRemaining}s • Dispatches into Pune OR-Tools Solver
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="w-14 h-14 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[32px]">check_circle</span>
                </div>
                <span className="font-bold text-base text-on-surface">Optimal Pool Found!</span>
                <span className="text-xs text-tertiary font-bold">
                  Matched with Vehicle {activeReq?.assigned_vehicle_id || 'V-101'}
                </span>
              </div>
            )}
          </div>

          {/* 3-Step Dynamic Batching Progress Pipeline */}
          <div className="flex flex-col gap-3 z-10">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Optimization Lifecycle
            </span>

            <div className="flex flex-col gap-2 text-xs">
              {/* Step 1 */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  ✓
                </div>
                <div className="flex flex-col flex-1">
                  <span className="font-bold text-on-surface">1. Request Buffered in Rolling Intake</span>
                  <span className="text-[10px] text-on-surface-variant">
                    Lock key assigned in Batch #{currentWindowId} • Duplicate protected
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                  isMatched
                    ? 'bg-surface-container-low border-outline-variant/30'
                    : 'bg-primary-fixed/20 border-primary text-primary'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isMatched ? 'bg-emerald-500 text-white' : 'bg-primary text-on-primary animate-pulse'
                  }`}
                >
                  {isMatched ? '✓' : '2'}
                </div>
                <div className="flex flex-col flex-1">
                  <span className="font-bold text-on-surface">2. Clustering Nearby Pune Commuters</span>
                  <span className="text-[10px] text-on-surface-variant">
                    Corridor compatibility verified against Pune road network
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                  isMatched ? 'bg-tertiary-fixed/30 border-tertiary' : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isMatched ? 'bg-tertiary text-on-tertiary' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {isMatched ? '✓' : '3'}
                </div>
                <div className="flex flex-col flex-1">
                  <span className="font-bold text-on-surface">3. Shapley Fair-Fare & Detour Guard</span>
                  <span className="text-[10px] text-on-surface-variant">
                    Guaranteed ≤ 15.0% passenger detour cap & transparent savings
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Trip Details Box */}
          {activeReq && (
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3 z-10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
                  Your Planned Route
                </span>
                <span className="text-primary font-bold">{activeReq.party_size} Rider</span>
              </div>

              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></span>
                  <span className="font-semibold text-on-surface truncate">Pickup: {activeReq.pickup.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0"></span>
                  <span className="font-semibold text-on-surface truncate">Dest: {activeReq.dropoff.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/30 text-center">
                <div className="p-2 rounded-xl bg-surface-container-lowest">
                  <span className="text-[10px] text-on-surface-variant block">Solo Fare</span>
                  <span className="text-sm font-extrabold text-on-surface">
                    ₹{activeReq.solo_fare_inr.toFixed(2)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-surface-container-lowest">
                  <span className="text-[10px] text-on-surface-variant block">Pooled Estimate</span>
                  <span className="text-sm font-extrabold text-tertiary">
                    ₹{(activeReq.shapley_fare_inr ?? activeReq.solo_fare_inr * 0.75).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 z-10">
            {!isMatched && (
              <button
                type="button"
                onClick={onDispatchNow}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/95 text-on-primary text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>Fast-Forward: Dispatch Batch Now</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBackToBooking}
              className="w-full h-10 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold flex items-center justify-center gap-1.5 border border-outline-variant/30 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Route Planner</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Live Map View (7 cols) */}
      <div className="lg:col-span-7 h-[680px]">
        <LiveMap
          vehicles={vehicles}
          requests={requests}
          selectedVehicleId={snapshot?.selection?.selectedVehicleId || null}
          onSelectVehicle={onSelectVehicle}
          onSelectRequest={onSelectRequest}
          soloRoutePolyline={
            activeReq?.pickup && activeReq?.dropoff
              ? [
                  [activeReq.pickup.lat, activeReq.pickup.lng],
                  [activeReq.dropoff.lat, activeReq.dropoff.lng],
                ]
              : null
          }
          soloPickupLocation={activeReq?.pickup || null}
          soloDropoffLocation={activeReq?.dropoff || null}
        />
      </div>
    </div>
  );
};
