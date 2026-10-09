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
        <div className="bg-white rounded-2xl p-6 border border-[#efefef] shadow-card-elevated flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#efefef]">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-2xl text-black font-display tracking-tight">
                  {isMatched ? 'Pool matched' : isNoMatch ? 'Match incomplete' : 'Finding your ride'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#efefef] text-black">
                  Batch #{currentWindowId}
                </span>
              </div>
              <p className="text-xs text-[#5e5e5e] mt-1">
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
              className="text-xs font-medium text-[#5e5e5e] hover:text-black underline"
            >
              Back
            </button>
          </div>

          {/* Progress / Status Block */}
          {isSearching && (
            <div className="p-4 rounded-xl bg-[#efefef] flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-black flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                  Finding corridor co-riders
                </span>
                <span className="font-mono font-bold text-black tabular-nums">
                  {timeRemaining}s remaining
                </span>
              </div>

              {/* Clean Linear Progress Bar */}
              <div className="w-full bg-[#e2e2e2] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-black h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#5e5e5e]">
                <span>45-second batch window</span>
                <span>Optimized via OR-Tools PDP</span>
              </div>
            </div>
          )}

          {/* Matched Banner */}
          {isMatched && (
            <div className="p-4 rounded-xl bg-[#efefef] text-xs text-black flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-black text-[22px]">
                  check_circle
                </span>
                <div>
                  <div className="font-bold">
                    Vehicle {assignedVehicle?.name || 'Tata Tigor EV'} assigned
                  </div>
                  <div className="text-[11px] text-[#5e5e5e]">
                    Departing for pickup • Occupancy {assignedVehicle?.occupied_seats || 2}/4
                  </div>
                </div>
              </div>
              {onNavigateToActive && (
                <button
                  type="button"
                  id="btn-navigate-to-active"
                  onClick={onNavigateToActive}
                  className="btn-uber-primary px-4 py-2 text-xs"
                >
                  View ride
                </button>
              )}
            </div>
          )}

          {/* Corridor & Route Summary */}
          <div className="space-y-2 p-4 rounded-xl border border-[#efefef] bg-white">
            <span className="text-[11px] uppercase font-medium text-[#5e5e5e] tracking-wider block">
              Trip details
            </span>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-black" />
                <span className="font-bold text-black">
                  {activeReq?.pickup?.name || 'Shivajinagar Station'}
                </span>
              </div>
              <span className="text-[#afafaf]">→</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-black" />
                <span className="font-bold text-black">
                  {activeReq?.dropoff?.name || 'Hinjewadi IT Park'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#5e5e5e] pt-2 border-t border-[#efefef]">
              <span>Party size: {activeReq?.party_size || 1} seat(s)</span>
              <span>Passenger: {activeReq?.passenger_name || 'Elena Vance'}</span>
            </div>
          </div>

          {/* Transparent Upfront Fare Guarantee */}
          <div className="p-4 rounded-xl bg-[#efefef] flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase font-medium text-[#5e5e5e] tracking-wider block">
                Upfront fair fare
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-bold font-display text-black tabular-nums">
                  ₹{(activeReq?.shapley_fare_inr ?? 82.5).toFixed(2)}
                </span>
                <span className="text-sm font-mono text-[#5e5e5e] line-through tabular-nums">
                  ₹{(activeReq?.solo_fare_inr ?? 145.0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-black text-white font-mono">
                Saving ~41%
              </span>
              <button
                type="button"
                onClick={() => setIsShapleySheetOpen(true)}
                className="text-xs text-[#5e5e5e] hover:text-black underline"
              >
                Explain fare
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
                className="btn-uber-primary w-full py-4 text-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">navigation</span>
                <span>Enter in-ride tracker</span>
              </button>
            ) : isNoMatch ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleWaitLonger}
                  disabled={isActionPending}
                  className="btn-uber-primary w-full py-3 text-xs disabled:opacity-50"
                >
                  Wait in next window (+45s)
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToSolo}
                  disabled={isActionPending}
                  className="btn-uber-subtle w-full py-3 text-xs disabled:opacity-50"
                >
                  Switch to solo direct
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="btn-fast-forward-dispatch"
                onClick={handleFastForward}
                disabled={isActionPending}
                className="btn-uber-primary w-full py-4 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>Fast-forward match (Solve now)</span>
              </button>
            )}

            {/* Cancel Button */}
            <button
              type="button"
              id="btn-cancel-ride-request"
              onClick={() => setShowCancelModal(true)}
              className="w-full py-2.5 text-xs font-medium text-[#5e5e5e] hover:text-black underline transition-colors"
            >
              Cancel ride request
            </button>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-[#efefef] text-xs text-black">
              {statusMessage}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Live Map (7 cols) */}
      <div className="lg:col-span-7 h-[640px] rounded-2xl overflow-hidden border border-[#efefef] shadow-card bg-white">
        <LiveMap
          mapId="passenger-waiting"
          vehicles={vehicles}
          requests={requests}
          selectedVehicleId={assignedVehicle?.vehicle_id || null}
          onSelectVehicle={onSelectVehicle}
          onSelectRequest={onSelectRequest}
        />
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#efefef] p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-black font-display">Cancel ride request?</h3>
            <p className="text-xs text-[#5e5e5e] leading-relaxed">
              Your reserved seat in Rolling Batch #{currentWindowId} will be released immediately with zero penalty.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="btn-uber-subtle px-4 py-2 text-xs"
              >
                Keep request
              </button>
              <button
                type="button"
                id="btn-confirm-cancel-ride"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="btn-uber-primary px-4 py-2 text-xs disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm cancel'}
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
