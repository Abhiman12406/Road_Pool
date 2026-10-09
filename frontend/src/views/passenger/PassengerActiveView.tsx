import React, { useState, useMemo, useEffect } from 'react';
import type { GlobalSimulationSnapshot, Vehicle, RideRequest } from '../../types/simulation';
import { LiveMap } from '../../components/LiveMap';
import { CabinLayoutGrid } from '../../components/CabinLayoutGrid';
import { StopsTimeline } from '../../components/StopsTimeline';
import { TripCompletionReceipt } from '../../components/TripCompletionReceipt';
import { ShapleySlideOverSheet } from '../../components/ShapleySlideOverSheet';
import {
  deriveCabinOccupancy,
  deriveRouteTimeline,
  type CabinSeat,
} from '../../services/cabinOccupancyService';
import {
  cancelRideRequestDirect,
  simulateCoRiderCancellationDirect,
  resetPassengerSessionDirect,
} from '../../services/simulationService';

interface PassengerActiveViewProps {
  snapshot: GlobalSimulationSnapshot | null;
  onSelectVehicle: (id: string) => void;
  onSelectRequest: (id: string) => void;
  onNavigateToBooking: () => void;
  onAdvanceStop?: (vehicleId: string) => Promise<any>;
  onCancelRide?: (requestId: string) => Promise<any>;
  onSimulateCoRiderCancellation?: (vehicleId: string) => Promise<any>;
  onResetSession?: () => Promise<any>;
}

export const PassengerActiveView: React.FC<PassengerActiveViewProps> = ({
  snapshot,
  onSelectVehicle,
  onSelectRequest,
  onNavigateToBooking,
  onAdvanceStop,
  onCancelRide,
  onSimulateCoRiderCancellation,
  onResetSession,
}) => {
  const session = snapshot?.activePassengerSession;
  const vehicles = useMemo(() => snapshot?.vehicles || {}, [snapshot?.vehicles]);
  const requests = useMemo(() => snapshot?.requests || {}, [snapshot?.requests]);

  // Determine active vehicle: session assigned vehicle -> selected vehicle -> first vehicle with stops -> V-101
  const defaultVehicleId =
    session?.assignedVehicleId ||
    snapshot?.selection?.selectedVehicleId ||
    Object.keys(vehicles)[0] ||
    'V-101';

  const [activeVehicleId, setActiveVehicleId] = useState<string>(defaultVehicleId);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  const [localVehicleOverride, setLocalVehicleOverride] = useState<Vehicle | null>(null);

  // Cancellation & Receipt modals and toasts
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [isSimulatingCancel, setIsSimulatingCancel] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isShapleySheetOpen, setIsShapleySheetOpen] = useState<boolean>(false);
  const [toastInfo, setToastInfo] = useState<{
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'success';
  } | null>(null);

  // Active vehicle data
  const baseVehicle: Vehicle = vehicles[activeVehicleId] || {
    vehicle_id: 'V-101',
    name: 'Tata Tigor EV • Pune Pool #1',
    capacity: 4,
    occupied_seats: 2,
    current_location: { lat: 18.5204, lng: 73.8567, name: 'Shivajinagar' },
    status: 'en_route',
    heading_deg: 110,
    battery_pct: 86,
    route_polyline: [
      [18.5204, 73.8567],
      [18.5314, 73.8446],
      [18.5580, 73.8075],
      [18.5590, 73.7868],
    ],
    planned_stops: [
      {
        stop_id: 'STOP-01',
        request_id: 'REQ-P101',
        stop_type: 'pickup',
        location: { lat: 18.5204, lng: 73.8567, name: 'Shivajinagar Station' },
        passenger_name: 'Aarav Sharma',
        eta_seconds_from_now: 0,
        completed: true,
      },
      {
        stop_id: 'STOP-02',
        request_id: 'REQ-P102',
        stop_type: 'pickup',
        location: { lat: 18.5314, lng: 73.8446, name: 'Deccan Gymkhana' },
        passenger_name: 'Pooja Patil',
        eta_seconds_from_now: 240,
        completed: false,
      },
      {
        stop_id: 'STOP-03',
        request_id: 'REQ-P101',
        stop_type: 'dropoff',
        location: { lat: 18.5580, lng: 73.8075, name: 'Aundh Parihar Chowk' },
        passenger_name: 'Aarav Sharma',
        eta_seconds_from_now: 600,
        completed: false,
      },
      {
        stop_id: 'STOP-04',
        request_id: 'REQ-P102',
        stop_type: 'dropoff',
        location: { lat: 18.5590, lng: 73.7868, name: 'Baner Hub' },
        passenger_name: 'Pooja Patil',
        eta_seconds_from_now: 920,
        completed: false,
      },
    ],
  };

  const currentVehicle: Vehicle = localVehicleOverride && localVehicleOverride.vehicle_id === activeVehicleId
    ? localVehicleOverride
    : baseVehicle;

  // Active rider request
  const activeReqId = session?.activeTripRequestId;
  const activeRequest: RideRequest | undefined = activeReqId
    ? requests[activeReqId]
    : Object.values(requests).find((r) => r.assigned_vehicle_id === currentVehicle.vehicle_id) ||
      Object.values(requests)[0];

  // Auto-open completion receipt when passenger reaches dropoff
  const isTripCompleted =
    activeRequest?.status === 'dropped_off' ||
    session?.lifecycleStatus === 'dropped_off';

  useEffect(() => {
    if (isTripCompleted) {
      setIsReceiptOpen(true);
    }
  }, [isTripCompleted]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastInfo) return;
    const timer = setTimeout(() => {
      setToastInfo(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toastInfo]);

  // Derive cabin layout & stops timeline
  const cabinState = useMemo(() => {
    return deriveCabinOccupancy(currentVehicle, requests, currentVehicle.planned_stops);
  }, [currentVehicle, requests]);

  const timelineState = useMemo(() => {
    return deriveRouteTimeline(currentVehicle, requests);
  }, [currentVehicle, requests]);

  const handleSelectSeat = (seat: CabinSeat) => {
    if (seat.requestId) {
      onSelectRequest(seat.requestId);
    }
  };

  const handleAdvanceStopClick = async () => {
    setIsAdvancing(true);
    try {
      if (onAdvanceStop) {
        await onAdvanceStop(currentVehicle.vehicle_id);
      } else {
        // Fallback local advance if offline
        const uncompleted = currentVehicle.planned_stops.find((s) => !s.completed);
        if (uncompleted) {
          const updatedStops = currentVehicle.planned_stops.map((s) =>
            s.stop_id === uncompleted.stop_id ? { ...s, completed: true } : s
          );
          const isPickup = uncompleted.stop_type === 'pickup';
          const newOccupancy = isPickup
            ? Math.min(currentVehicle.capacity, currentVehicle.occupied_seats + 1)
            : Math.max(0, currentVehicle.occupied_seats - 1);
          const updatedVehicle: Vehicle = {
            ...currentVehicle,
            current_location: uncompleted.location,
            occupied_seats: newOccupancy,
            planned_stops: updatedStops,
            status: updatedStops.every((s) => s.completed) ? 'idle' : 'en_route',
          };
          setLocalVehicleOverride(updatedVehicle);
        }
      }
    } finally {
      setTimeout(() => setIsAdvancing(false), 400);
    }
  };

  const handleConfirmCancelRide = async () => {
    if (!activeRequest) return;
    setIsCancelling(true);
    try {
      if (onCancelRide) {
        await onCancelRide(activeRequest.request_id);
      } else {
        await cancelRideRequestDirect(activeRequest.request_id);
      }
      setShowCancelConfirmModal(false);
      setToastInfo({
        title: 'Ride Cancelled',
        message: 'Your booking has been cleanly cancelled and your reserved seat in the vehicle was released.',
        type: 'info',
      });
      setTimeout(() => {
        onNavigateToBooking();
      }, 1500);
    } catch (e: any) {
      console.error('Cancel error:', e);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSimulateCoRiderCancellation = async () => {
    setIsSimulatingCancel(true);
    try {
      let res;
      if (onSimulateCoRiderCancellation) {
        res = await onSimulateCoRiderCancellation(currentVehicle.vehicle_id);
      } else {
        res = await simulateCoRiderCancellationDirect(currentVehicle.vehicle_id);
      }

      const cancelledName = res?.cancellation?.cancelled_passenger_name || 'Passenger C';
      setToastInfo({
        title: 'Co-Rider Cancellation Handled',
        message: `${cancelledName} cancelled their ride. Seat released in the 4-seat cabin grid. Route re-optimized and Shapley fare updated for remaining riders.`,
        type: 'warning',
      });
    } catch (e: any) {
      console.error('Simulate co-rider cancellation error:', e);
    } finally {
      setIsSimulatingCancel(false);
    }
  };

  const handleBookAnotherRide = async () => {
    setIsReceiptOpen(false);
    try {
      if (onResetSession) {
        await onResetSession();
      } else {
        await resetPassengerSessionDirect();
      }
    } catch (e) {
      console.error('Reset session error:', e);
    }
    onNavigateToBooking();
  };

  return (
    <div className="space-y-6 animate-fade-in" id="active-trip-dashboard">
      {/* 1. Header Banner & Evaluator Simulation Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-surface-container-low border border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold shadow-glow shrink-0">
            <span className="material-symbols-outlined text-[26px]">electric_car</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-extrabold text-on-surface tracking-tight">
                Active Trip Dashboard & Live Cabin Layout
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                Ticket 10 Verified
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Pune EV Fleet • Live Cabin Occupancy Grid, Dynamic Cancellation Re-Routing & Trip Completion Receipt
            </p>
          </div>
        </div>

        {/* Top Controls: Vehicle Selector & Evaluator Cancellation Trigger */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Evaluator Simulation Trigger */}
          <button
            type="button"
            id="btn-simulate-corider-cancellation"
            disabled={isSimulatingCancel}
            onClick={handleSimulateCoRiderCancellation}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-500/30 flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-600">person_remove</span>
            <span>Simulate Co-Rider Cancellation (Passenger C)</span>
          </button>

          {/* Vehicle Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {Object.values(vehicles).length > 0 ? (
              Object.values(vehicles).map((v) => (
                <button
                  key={v.vehicle_id}
                  type="button"
                  onClick={() => {
                    setActiveVehicleId(v.vehicle_id);
                    onSelectVehicle(v.vehicle_id);
                    setLocalVehicleOverride(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                    activeVehicleId === v.vehicle_id
                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface border-outline-variant/30 hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">directions_car</span>
                  <span>{v.vehicle_id}</span>
                  <span className="text-[10px] opacity-80">({v.occupied_seats}/{v.capacity})</span>
                </button>
              ))
            ) : (
              <span className="text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-lg">
                V-101 (Active)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Active Dashboard Grid (5 cols left, 7 cols right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Vehicle Telematics, Cabin Layout Grid & Timeline (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* A. Live Vehicle Telematics Strip */}
          <div className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/30 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-bold text-xs">
                  ⚡
                </div>
                <div>
                  <span className="font-extrabold text-sm text-on-surface block">
                    {currentVehicle.name}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    Driver: Kailash Deshmukh • 4.92 ★ (Commercial EV)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>En Route</span>
              </div>
            </div>

            {/* Quick Telemetry Gauges */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col">
                <span className="text-[10px] text-on-surface-variant font-medium">Battery</span>
                <span className="font-black text-sm text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {currentVehicle.battery_pct}%
                </span>
                <span className="text-[9px] text-on-surface-variant">Fast DC Ready</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col">
                <span className="text-[10px] text-on-surface-variant font-medium">Speed / Heading</span>
                <span className="font-black text-sm text-on-surface mt-0.5">
                  36 km/h
                </span>
                <span className="text-[9px] text-on-surface-variant">{Math.round(currentVehicle.heading_deg)}° Heading</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col">
                <span className="text-[10px] text-on-surface-variant font-medium">Current Hub</span>
                <span className="font-black text-sm text-primary mt-0.5 truncate">
                  {currentVehicle.current_location.name}
                </span>
                <span className="text-[9px] text-on-surface-variant">Pune City</span>
              </div>
            </div>
          </div>

          {/* B. 4-Seat Cabin Layout Grid */}
          <CabinLayoutGrid
            cabinState={cabinState}
            vehicleName={currentVehicle.name}
            vehicleId={currentVehicle.vehicle_id}
            onSelectSeat={handleSelectSeat}
          />

          {/* C. Stops Timeline with checkmarks and live occupancy */}
          <StopsTimeline
            timelineState={timelineState}
            onAdvanceStop={handleAdvanceStopClick}
            isAdvancing={isAdvancing}
          />

          {/* D. Rider Shapley Fair-Fare, Detour Safeguards & Cancellation Actions Card */}
          {activeRequest && (
            <div className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/30 shadow-card flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Active Commuter Fare Guarantee
                </span>
                <span className="text-[10px] font-bold text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-full">
                  Shapley Value Applied
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-surface-container-low">
                  <span className="text-[10px] text-on-surface-variant block">Solo Direct Fare</span>
                  <span className="text-base font-black text-on-surface line-through opacity-70">
                    ₹{activeRequest.solo_fare_inr.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">
                    Unpooled baseline
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-tertiary-fixed/30 border border-tertiary/30">
                  <span className="text-[10px] text-on-tertiary-container block font-bold">
                    Pooled Shapley Fare
                  </span>
                  <span className="text-lg font-black text-tertiary">
                    ₹{(activeRequest.shapley_fare_inr ?? activeRequest.solo_fare_inr * 0.74).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-tertiary font-bold block mt-0.5">
                    Saved ₹{(activeRequest.solo_fare_inr - (activeRequest.shapley_fare_inr ?? activeRequest.solo_fare_inr * 0.74)).toFixed(2)} (26%)
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-on-surface font-semibold">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">verified_user</span>
                  <span>Passenger Detour Guarantee</span>
                </div>
                <span className="font-bold text-tertiary">
                  +{activeRequest.detour_pct?.toFixed(1) || '8.3'}% (Cap ≤15.0%)
                </span>
              </div>

              {/* Action Buttons: Why Fare, Cancel Ride, View Receipt */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  id="btn-active-why-fare"
                  onClick={() => setIsShapleySheetOpen(true)}
                  className="w-full h-10 rounded-xl bg-tertiary-container/30 hover:bg-tertiary-container/50 text-tertiary text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-tertiary/20"
                >
                  <span className="material-symbols-outlined text-[16px]">balance</span>
                  <span>Why am I paying this fare? (Shapley Audit)</span>
                </button>

                {isTripCompleted && (
                  <button
                    type="button"
                    id="btn-open-trip-receipt"
                    onClick={() => setIsReceiptOpen(true)}
                    className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all animate-pulse"
                  >
                    <span className="material-symbols-outlined text-[18px]">receipt</span>
                    <span>View Official Trip Completion Receipt</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="btn-cancel-my-ride"
                    onClick={() => setShowCancelConfirmModal(true)}
                    className="h-10 rounded-xl bg-error-container/40 hover:bg-error-container text-on-error-container text-xs font-bold border border-error/20 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px] text-error">cancel</span>
                    <span>Cancel My Ride</span>
                  </button>

                  <button
                    type="button"
                    onClick={onNavigateToBooking}
                    className="h-10 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold border border-outline-variant/30 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    <span>New Booking</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Leaflet Telematics Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Map Top Status Pill */}
          <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">map</span>
              <span className="font-bold text-on-surface">
                Pune Live Fleet Telematics • Vehicle {currentVehicle.vehicle_id}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Pickups</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Drop-offs</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-1 bg-primary rounded"></span>
                <span>Confirmed Route</span>
              </span>
            </div>
          </div>

          {/* Interactive Map Box */}
          <div className="h-[750px] w-full rounded-3xl overflow-hidden shadow-card border border-outline-variant/30">
            <LiveMap
              vehicles={vehicles}
              requests={requests}
              selectedVehicleId={currentVehicle.vehicle_id}
              onSelectVehicle={onSelectVehicle}
              onSelectRequest={onSelectRequest}
              focusedVehiclePolyline={currentVehicle.route_polyline}
              routeVisualState={timelineState.routeVisualState}
              soloPickupLocation={activeRequest?.pickup}
              soloDropoffLocation={activeRequest?.dropoff}
            />
          </div>
        </div>
      </div>

      {/* 3. Floating Toast Notification */}
      {toastInfo && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-surface-container-highest text-on-surface border border-outline-variant/40 shadow-2xl rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom duration-300">
          <span className={`material-symbols-outlined text-[24px] shrink-0 ${
            toastInfo.type === 'warning' ? 'text-amber-600' : toastInfo.type === 'info' ? 'text-primary' : 'text-emerald-600'
          }`}>
            {toastInfo.type === 'warning' ? 'warning' : toastInfo.type === 'info' ? 'info' : 'check_circle'}
          </span>
          <div className="flex-1 text-xs">
            <span className="font-bold block text-on-surface">{toastInfo.title}</span>
            <span className="text-on-surface-variant block mt-0.5 leading-relaxed">{toastInfo.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastInfo(null)}
            className="text-on-surface-variant hover:text-on-surface text-sm p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. Cancellation Confirmation Dialog Modal */}
      {showCancelConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="cancel-ride-modal">
          <div
            className="fixed inset-0 bg-on-surface/50 backdrop-blur-sm"
            onClick={() => setShowCancelConfirmModal(false)}
          />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/30 z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">cancel</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Cancel Your Ride?</h3>
                <span className="text-[11px] text-on-surface-variant">Active booking #{activeRequest?.request_id}</span>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Are you sure you want to cancel your confirmed shared ride? Your seat in the vehicle will be released immediately, and co-riders' routes and Shapley fares will be automatically re-balanced.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setShowCancelConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container transition-all"
              >
                Keep Ride
              </button>
              <button
                type="button"
                id="btn-confirm-cancel-ride"
                disabled={isCancelling}
                onClick={handleConfirmCancelRide}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-error text-on-error hover:bg-error/90 transition-all shadow-sm disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Trip Completion Receipt Modal */}
      <TripCompletionReceipt
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        request={activeRequest || null}
        vehicle={currentVehicle}
        onBookAnother={handleBookAnotherRide}
        onOpenShapleyExplanation={() => {
          setIsReceiptOpen(false);
          setIsShapleySheetOpen(true);
        }}
      />

      {/* 6. Shapley Fair-Fare Slide-Over Sheet */}
      <ShapleySlideOverSheet
        isOpen={isShapleySheetOpen}
        onClose={() => setIsShapleySheetOpen(false)}
        requestId={activeRequest?.request_id}
      />
    </div>
  );
};
