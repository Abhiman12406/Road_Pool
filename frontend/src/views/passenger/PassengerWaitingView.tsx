import React, { useState } from 'react';
import type { GlobalSimulationSnapshot } from '../../types/simulation';
import { LiveMap } from '../../components/LiveMap';
import { ShapleySlideOverSheet } from '../../components/ShapleySlideOverSheet';
import {
  requeueRideRequest,
  dispatchSoloRide,
  generateCandidateDemand,
  getPrivacySafeRiderId,
} from '../../services/routingService';

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
  const timeRemaining = engine?.timeRemainingInWindowSec ?? 45;
  const totalWindowSec = engine?.windowIntervalSec ?? 45;

  // Matching lifecycle states
  const isMatched =
    activeReq?.status === 'matched' ||
    activeReq?.status === 'en_route_pickup' ||
    activeReq?.status === 'in_transit' ||
    session?.lifecycleStatus === 'matched';

  const isNoMatch =
    activeReq?.status === 'rejected' ||
    session?.lifecycleStatus === 'no_match' ||
    session?.lifecycleStatus === 'rejected';

  const isSearching = !isMatched && !isNoMatch;

  // Loading and action state
  const [isActionPending, setIsActionPending] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isShapleySheetOpen, setIsShapleySheetOpen] = useState<boolean>(false);

  // Candidate requests in current batch window (excluding user's own request)
  const candidateRequests = Object.values(requests).filter(
    (r) =>
      r.status === 'waiting_batch' &&
      r.batch_id === currentWindowId &&
      r.request_id !== activeReq?.request_id
  );

  const candidateSeatsCount = candidateRequests.reduce((acc, r) => acc + (r.party_size || 1), 0);
  const mySeats = activeReq?.party_size || 1;
  const totalCapacity = 4;
  const availableSeats = Math.max(0, totalCapacity - mySeats - candidateSeatsCount);

  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round(((totalWindowSec - timeRemaining) / totalWindowSec) * 100))
  );

  const assignedVehicle = activeReq?.assigned_vehicle_id
    ? vehicles[activeReq.assigned_vehicle_id]
    : Object.values(vehicles)[0];

  const actualDetourPct = activeReq?.detour_pct ?? session?.actualDetourPct ?? 8.33;

  // Handler: Fast-Forward dispatch
  const handleFastForward = async () => {
    setIsActionPending(true);
    setStatusMessage('Fast-forwarding: Locking batch & dispatching into OR-Tools solver...');
    try {
      await onDispatchNow();
      setTimeout(() => {
        setIsActionPending(false);
        setStatusMessage(null);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Dispatch failed';
      setStatusMessage(`Error: ${msg}`);
      setIsActionPending(false);
    }
  };

  // Handler: Wait longer / Requeue
  const handleWaitLonger = async () => {
    if (!activeReq?.request_id) return;
    setIsActionPending(true);
    setStatusMessage('Re-queuing request into rolling window (+45s)...');
    try {
      await requeueRideRequest(activeReq.request_id);
      setStatusMessage('Request re-admitted to active batch window!');
      setTimeout(() => {
        setIsActionPending(false);
        setStatusMessage(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to requeue';
      setStatusMessage(`Error: ${msg}`);
      setIsActionPending(false);
    }
  };

  // Handler: Switch to Solo Ride
  const handleSwitchToSolo = async () => {
    if (!activeReq?.request_id) return;
    setIsActionPending(true);
    setStatusMessage('Switching to dedicated Solo Ride (0% Detour)...');
    try {
      await dispatchSoloRide(activeReq.request_id);
      setStatusMessage('Solo direct ride dispatched! Assigned dedicated vehicle.');
      setTimeout(() => {
        setIsActionPending(false);
        setStatusMessage(null);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to dispatch solo ride';
      setStatusMessage(`Error: ${msg}`);
      setIsActionPending(false);
    }
  };

  // Handler: Simulate commuter influx (demo mode)
  const handleSimulateCommuterInflux = async () => {
    setIsActionPending(true);
    try {
      await generateCandidateDemand(1);
      setStatusMessage('Simulated commuter joined the candidate pool!');
      setTimeout(() => {
        setStatusMessage(null);
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Simulation failed';
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setIsActionPending(false);
    }
  };

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
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${
                  isMatched
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                    : isNoMatch
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-primary-container text-on-primary-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isMatched ? 'verified' : isNoMatch ? 'error' : 'electric_car'}
                </span>
              </div>
              <div>
                <h1 className="font-extrabold text-lg text-on-surface tracking-tight">
                  {activeReq?.request_id || 'REQ-P101'}
                </h1>
                <span className="text-xs text-on-surface-variant font-medium">
                  {isMatched
                    ? 'Shared Pool Matched & Dispatched'
                    : isNoMatch
                    ? 'No Compatible Match Found'
                    : 'Grouping into Cooperative Pool'}
                </span>
              </div>
            </div>

            <span
              id="batch-window-badge"
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                isMatched
                  ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                  : isNoMatch
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-secondary-container/40 text-on-secondary-container'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isMatched
                    ? 'bg-tertiary'
                    : isNoMatch
                    ? 'bg-error'
                    : 'bg-secondary animate-ping'
                }`}
              ></span>
              {isMatched ? 'Match Found ✓' : isNoMatch ? 'No Valid Match ✕' : `Batch Window #${currentWindowId}`}
            </span>
          </div>

          {/* Status Alert Banner if applicable */}
          {statusMessage && (
            <div className="z-10 p-3 rounded-xl bg-primary-fixed/20 border border-primary text-primary text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Animated Countdown Gauge Hero */}
          <div className="bg-gradient-to-br from-surface-container-low via-surface-bright to-surface-container-high/40 rounded-2xl p-5 border border-outline-variant/30 flex flex-col items-center justify-center gap-4 text-center z-10">
            {isSearching && (
              <>
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 100 100">
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
                    Rolling Intake Buffer
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    Batch #{currentWindowId} closes in {timeRemaining}s • Dispatches into Pune OR-Tools Solver
                  </span>
                </div>
              </>
            )}

            {isMatched && (
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="w-14 h-14 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[32px]">check_circle</span>
                </div>
                <span className="font-bold text-base text-on-surface">Optimal Shared Pool Matched!</span>
                <span className="text-xs text-tertiary font-bold">
                  Assigned to {assignedVehicle?.name || 'BYD e6 • City Shuttle'} ({activeReq?.assigned_vehicle_id || 'V-101'})
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Detour: +{actualDetourPct.toFixed(1)}% (Strict ≤15.0% Cap Preserved)
                </span>
              </div>
            )}

            {isNoMatch && (
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="w-14 h-14 rounded-full bg-error-container text-on-error-container flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[32px]">warning</span>
                </div>
                <span className="font-bold text-base text-on-surface">No Valid Shared Match Found</span>
                <span className="text-xs text-error font-semibold max-w-xs">
                  {activeReq?.rejection_reason ||
                    'All candidate coalitions would exceed the strict 15.0% detour guarantee or vehicle capacity.'}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Select a resolution below to continue your journey.
                </span>
              </div>
            )}
          </div>

          {/* FALLBACK OPTIONS (When No Valid Match is found) */}
          {isNoMatch && (
            <div className="p-4 rounded-2xl bg-error-container/10 border border-error/30 flex flex-col gap-3 z-10">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-error">alt_route</span>
                <span>Choose How to Proceed</span>
              </span>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  id="btn-wait-longer"
                  disabled={isActionPending}
                  onClick={handleWaitLonger}
                  className="w-full h-10 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold flex items-center justify-center gap-2 border border-outline-variant/40 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                  <span>Wait for Next Batch (+45s Window)</span>
                </button>

                <button
                  type="button"
                  id="btn-search-another-vehicle"
                  disabled={isActionPending}
                  onClick={handleWaitLonger}
                  className="w-full h-10 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold flex items-center justify-center gap-2 border border-outline-variant/40 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px] text-secondary">explore</span>
                  <span>Search Another Vehicle / Corridor</span>
                </button>

                <button
                  type="button"
                  id="btn-switch-solo-ride"
                  disabled={isActionPending}
                  onClick={handleSwitchToSolo}
                  className="w-full h-10 rounded-xl bg-primary hover:bg-primary/95 text-on-primary text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">local_taxi</span>
                  <span>Switch to Solo Ride (Direct Taxi • ₹{activeReq?.solo_fare_inr.toFixed(2)})</span>
                </button>
              </div>
            </div>
          )}

          {/* SEAT AVAILABILITY & 4-SEAT CABIN OCCUPANCY */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3 z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary">airline_seat_recline_normal</span>
                <span>Vehicle Capacity & Cabin Seat Allocation</span>
              </span>
              <span className="font-bold text-on-surface text-xs">
                {mySeats + candidateSeatsCount} / {totalCapacity} Reserved
              </span>
            </div>

            {/* 4-Seat Visual Grid */}
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: totalCapacity }).map((_, idx) => {
                const isMySeat = idx < mySeats;
                const isCandidateSeat = idx >= mySeats && idx < mySeats + candidateSeatsCount;
                const isAvailable = idx >= mySeats + candidateSeatsCount;

                return (
                  <div
                    key={idx}
                    className={`h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 border text-[10px] font-bold transition-all ${
                      isMySeat
                        ? 'bg-primary text-on-primary border-primary shadow-xs'
                        : isCandidateSeat
                        ? 'bg-secondary-container text-on-secondary-container border-secondary/40'
                        : 'bg-surface-container-lowest text-on-surface-variant/70 border-dashed border-outline-variant/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isAvailable ? 'chair' : 'person'}
                    </span>
                    <span>
                      {isMySeat ? 'You' : isCandidateSeat ? 'Co-Rider' : 'Free'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/20">
              <span>Your Group: <b>{mySeats} Seat{mySeats > 1 ? 's' : ''}</b></span>
              <span>Candidate Pool: <b>{candidateSeatsCount} Seat{candidateSeatsCount > 1 ? 's' : ''}</b></span>
              <span className="text-emerald-600 font-bold">Open: <b>{availableSeats}</b></span>
            </div>
          </div>

          {/* DYNAMIC CANDIDATE COMMUTERS IN ROLLING POOL */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3 z-10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-secondary">groups</span>
                <span>Candidate Commuters in Pool ({candidateRequests.length})</span>
              </span>
              {isSearching && (
                <button
                  type="button"
                  id="btn-simulate-commuter-influx"
                  disabled={isActionPending}
                  onClick={handleSimulateCommuterInflux}
                  className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[12px]">add</span>
                  <span>Simulate Commuter</span>
                </button>
              )}
            </div>

            {candidateRequests.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {candidateRequests.map((cand) => {
                  const privacyId = getPrivacySafeRiderId(cand.request_id, cand.passenger_id);
                  return (
                    <div
                      key={cand.request_id}
                      className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between text-xs hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs shrink-0">
                          <span className="material-symbols-outlined text-[14px]">person</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-on-surface truncate">{privacyId}</span>
                            <span className="px-1.5 py-0.5 rounded-md bg-secondary/10 text-secondary text-[10px] font-bold">
                              {cand.party_size} {cand.party_size === 1 ? 'Seat' : 'Seats'}
                            </span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant truncate">
                            {cand.pickup.name} → {cand.dropoff.name}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold shrink-0 ml-2">
                        Compatible
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-surface-container-lowest text-center text-xs text-on-surface-variant flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant/60">hourglass_empty</span>
                <span>Waiting for nearby Pune commuters to buffer along your route...</span>
                <span className="text-[10px] text-on-surface-variant/70">
                  Privacy-safe identifiers will populate here as co-riders join.
                </span>
              </div>
            )}
          </div>

          {/* Planned Route & Stop Sequence Preview */}
          {activeReq && (
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3 z-10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
                  Your Planned Route & Constraints
                </span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  ≤15.0% Detour Guarantee
                </span>
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
                {activeReq.preferred_pickup_time && (
                  <div className="flex items-center gap-2 text-[11px] text-on-surface-variant pt-0.5">
                    <span className="material-symbols-outlined text-[14px] text-secondary">schedule</span>
                    <span>Pickup: {activeReq.preferred_pickup_time}</span>
                    {activeReq.arrival_deadline && (
                      <span className="text-tertiary font-bold">• Must arrive by {activeReq.arrival_deadline}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Stop Sequence Preview */}
              <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-1 text-[11px]">
                <span className="text-on-surface-variant font-semibold">Planned Stop Sequence:</span>
                <div className="flex items-center gap-1.5 text-on-surface text-[11px] font-medium flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/30">
                    1. Your Pickup
                  </span>
                  <span>→</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/30">
                    2. Co-Rider Pickup
                  </span>
                  <span>→</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/30">
                    3. Your Drop-off
                  </span>
                  <span>→</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/30">
                    4. Co-Rider Drop-off
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/30 text-center">
                <div className="p-2 rounded-xl bg-surface-container-lowest">
                  <span className="text-[10px] text-on-surface-variant block">Direct Solo Fare</span>
                  <span className="text-sm font-extrabold text-on-surface">
                    ₹{activeReq.solo_fare_inr.toFixed(2)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-surface-container-lowest">
                  <span className="text-[10px] text-on-surface-variant block">Pooled Shapley Fare</span>
                  <span className="text-sm font-extrabold text-tertiary">
                    ₹{(activeReq.shapley_fare_inr ?? activeReq.solo_fare_inr * 0.75).toFixed(2)}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-bold block">Save ~25%</span>
                </div>
              </div>

              <button
                type="button"
                id="btn-why-paying-this-fare"
                onClick={() => setIsShapleySheetOpen(true)}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-tertiary-container/30 hover:bg-tertiary-container/50 text-tertiary text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-tertiary/20"
              >
                <span className="material-symbols-outlined text-[16px]">balance</span>
                <span>Why am I paying this fare? (Shapley Audit)</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 z-10">
            {isSearching && (
              <button
                type="button"
                id="btn-fast-forward-dispatch"
                disabled={isActionPending}
                onClick={handleFastForward}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/95 text-on-primary text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
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

      {/* Shapley Fair Fare Slide-Over Sheet */}
      <ShapleySlideOverSheet
        isOpen={isShapleySheetOpen}
        onClose={() => setIsShapleySheetOpen(false)}
        requestId={activeReq?.request_id}
      />
    </div>
  );
};
