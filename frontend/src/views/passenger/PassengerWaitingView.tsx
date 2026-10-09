import React, { useState } from 'react';
import type { GlobalSimulationSnapshot } from '../../types/simulation';
import { LiveMap } from '../../components/LiveMap';
import { ShapleySlideOverSheet } from '../../components/ShapleySlideOverSheet';
import {
  requeueRideRequest,
  dispatchSoloRide,
} from '../../services/routingService';
import { cancelRideRequestDirect } from '../../services/simulationService';

interface PassengerWaitingViewProps {
  snapshot: GlobalSimulationSnapshot | null;
  onDispatchNow: () => void;
  onBackToBooking: () => void;
  onSelectVehicle: (id: string) => void;
  onSelectRequest: (id: string) => void;
  onNavigateToActive?: () => void;
  onCancelRide?: (requestId: string) => Promise<any>;
}

export const PassengerWaitingView: React.FC<PassengerWaitingViewProps> = ({
  snapshot,
  onDispatchNow,
  onBackToBooking,
  onSelectVehicle,
  onSelectRequest,
  onNavigateToActive,
  onCancelRide,
}) => {
  const engine = snapshot?.engine;
  const session = snapshot?.activePassengerSession;
  const requests = snapshot?.requests || {};
  const vehicles = snapshot?.vehicles || {};

  const activeReqId = session?.activeTripRequestId;
  const activeReq = activeReqId ? requests[activeReqId] : Object.values(requests)[0];

  const currentWindowId = engine?.currentWindowId ?? 101;
  const timeRemaining = engine?.timeRemainingInWindowSec ?? 28;
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

  // Action and UI states
  const [isActionPending, setIsActionPending] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isShapleySheetOpen, setIsShapleySheetOpen] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round(((totalWindowSec - timeRemaining) / totalWindowSec) * 100))
  );

  const assignedVehicle = activeReq?.assigned_vehicle_id
    ? vehicles[activeReq.assigned_vehicle_id]
    : Object.values(vehicles)[0];

  // Handler: Fast-Forward dispatch
  const handleFastForward = async () => {
    setIsActionPending(true);
    setStatusMessage('Locking batch & computing optimal multi-passenger routing...');
    try {
      await onDispatchNow();
      setTimeout(() => {
        setIsActionPending(false);
        setStatusMessage(null);
        if (onNavigateToActive) onNavigateToActive();
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Dispatch failed';
      setStatusMessage(`Error: ${msg}`);
      setIsActionPending(false);
    }
  };

  // Handler: Confirm Cancel
  const handleConfirmCancel = async () => {
    if (!activeReq?.request_id) return;
    setIsCancelling(true);
    setStatusMessage('Cancelling ride request...');
    try {
      if (onCancelRide) {
        await onCancelRide(activeReq.request_id);
      } else {
        await cancelRideRequestDirect(activeReq.request_id);
      }
      setShowCancelModal(false);
      onBackToBooking();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel';
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setIsCancelling(false);
    }
  };

  // Handler: Wait in next window
  const handleWaitLonger = async () => {
    if (!activeReq?.request_id) return;
    setIsActionPending(true);
    try {
      await requeueRideRequest(activeReq.request_id);
      setStatusMessage('Request re-queued for next 45s window');
      setTimeout(() => {
        setIsActionPending(false);
        setStatusMessage(null);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to requeue';
      setStatusMessage(`Error: ${msg}`);
      setIsActionPending(false);
    }
  };

  // Handler: Switch to Solo Direct
  const handleSwitchToSolo = async () => {
    if (!activeReq?.request_id) return;
    setIsActionPending(true);
    try {
      await dispatchSoloRide(activeReq.request_id);
      setStatusMessage('Direct solo vehicle dispatched');
      setTimeout(() => {
        setIsActionPending(false);
        setStatusMessage(null);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to dispatch solo';
      setStatusMessage(`Error: ${msg}`);
      setIsActionPending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Left Column: Focused Status Card (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-900 tracking-tight">
                  {isMatched ? 'Pool Matched' : isNoMatch ? 'Match Incomplete' : 'Batch Window Active'}
                </h1>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    isMatched
                      ? 'bg-emerald-100 text-emerald-800'
                      : isNoMatch
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Window #{currentWindowId}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isMatched
                  ? 'Assigned dedicated EV on your corridor'
                  : isNoMatch
                  ? 'No compatible co-riders within ≤15% detour limit'
                  : 'Pooling compatible riders along the Pune metro corridor'}
              </p>
            </div>

            <button
              type="button"
              onClick={onBackToBooking}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 hover:underline"
            >
              Back
            </button>
          </div>

          {/* Progress / Status Block */}
          {isSearching && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
                  Finding corridor co-riders
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {timeRemaining}s remaining
                </span>
              </div>

              {/* Clean Linear Progress Bar */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-slate-900 h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>45-second batch window</span>
                <span>Optimized via OR-Tools PDP</span>
              </div>
            </div>
          )}

          {/* Matched Banner */}
          {isMatched && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-700 text-[20px]">
                  check_circle
                </span>
                <div>
                  <div className="font-bold">
                    Vehicle {assignedVehicle?.name || 'Tata Tigor EV'} Assigned
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    Departing for pickup • Occupancy {assignedVehicle?.occupied_seats || 2}/4
                  </div>
                </div>
              </div>
              {onNavigateToActive && (
                <button
                  type="button"
                  id="btn-navigate-to-active"
                  onClick={onNavigateToActive}
                  className="px-3 py-1.5 rounded-md bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  View Ride
                </button>
              )}
            </div>
          )}

          {/* Corridor & Route Summary */}
          <div className="space-y-2 p-3.5 rounded-lg border border-slate-200 bg-white">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Trip Details
            </span>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-900" />
                <span className="font-semibold text-slate-900">
                  {activeReq?.pickup?.name || 'Shivajinagar Station'}
                </span>
              </div>
              <span className="text-slate-400">→</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="font-semibold text-slate-900">
                  {activeReq?.dropoff?.name || 'Hinjewadi IT Park'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span>Party size: {activeReq?.party_size || 1} seat(s)</span>
              <span>Passenger: {activeReq?.passenger_name || 'Elena Vance'}</span>
            </div>
          </div>

          {/* Transparent Upfront Fare Guarantee */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Upfront Fair Fare
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  ₹{(activeReq?.shapley_fare_inr ?? 82.5).toFixed(2)}
                </span>
                <span className="text-xs font-mono text-slate-400 line-through tabular-nums">
                  ₹{(activeReq?.solo_fare_inr ?? 145.0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                Saving ~41%
              </span>
              <button
                type="button"
                onClick={() => setIsShapleySheetOpen(true)}
                className="text-[10px] text-slate-600 hover:text-slate-900 hover:underline"
              >
                Explain Fare
              </button>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2 pt-2">
            {isMatched ? (
              <button
                type="button"
                id="btn-view-ride-details"
                onClick={onNavigateToActive}
                className="w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">navigation</span>
                <span>Enter In-Ride Tracker</span>
              </button>
            ) : isNoMatch ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleWaitLonger}
                  disabled={isActionPending}
                  className="h-10 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Wait in Next Window (+45s)
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToSolo}
                  disabled={isActionPending}
                  className="h-10 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Switch to Solo Direct
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="btn-fast-forward-dispatch"
                onClick={handleFastForward}
                disabled={isActionPending}
                className="w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>Fast-Forward Match (Solve Now)</span>
              </button>
            )}

            {/* Cancel Button */}
            <button
              type="button"
              id="btn-cancel-ride-request"
              onClick={() => setShowCancelModal(true)}
              className="w-full py-2 rounded-lg text-slate-500 hover:text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors"
            >
              Cancel Ride Request
            </button>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700">
              {statusMessage}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Live Map (7 cols) */}
      <div className="lg:col-span-7 h-[640px] rounded-xl overflow-hidden border border-slate-200 bg-white">
        <LiveMap
          vehicles={vehicles}
          requests={requests}
          selectedVehicleId={assignedVehicle?.vehicle_id || null}
          onSelectVehicle={onSelectVehicle}
          onSelectRequest={onSelectRequest}
        />
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900">Cancel Ride Request?</h3>
            <p className="text-xs text-slate-600">
              Your reserved seat in Rolling Batch #{currentWindowId} will be released immediately with zero penalty.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Keep Request
              </button>
              <button
                type="button"
                id="btn-confirm-cancel-ride"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shapley Fair Fare Slide-Over Sheet */}
      <ShapleySlideOverSheet
        isOpen={isShapleySheetOpen}
        onClose={() => setIsShapleySheetOpen(false)}
        requestId={activeReq?.request_id || null}
      />
    </div>
  );
};
