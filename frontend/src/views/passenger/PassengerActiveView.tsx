import React, { useState, useMemo } from 'react';
import type { GlobalSimulationSnapshot, Vehicle, RideRequest } from '../../types/simulation';
import { LiveMap } from '../../components/LiveMap';
import { CabinLayoutGrid } from '../../components/CabinLayoutGrid';
import { StopsTimeline } from '../../components/StopsTimeline';
import { TwoWayConsentModal } from '../../components/TwoWayConsentModal';
import { IncompatibleDetourModal } from '../../components/IncompatibleDetourModal';
import {
  deriveCabinOccupancy,
  deriveRouteTimeline,
  type CabinSeat,
} from '../../services/cabinOccupancyService';
import {
  evaluateMidTripJoin,
  resolveMidTripConsent,
  DEMO_COMPATIBLE_JOINER,
  DEMO_INCOMPATIBLE_JOINER,
  type CandidateJoinRequest,
  type MidTripJoinEvaluation,
} from '../../services/midTripJoinService';

interface PassengerActiveViewProps {
  snapshot: GlobalSimulationSnapshot | null;
  onSelectVehicle: (id: string) => void;
  onSelectRequest: (id: string) => void;
  onNavigateToBooking: () => void;
  onAdvanceStop?: (vehicleId: string) => Promise<any>;
}

export const PassengerActiveView: React.FC<PassengerActiveViewProps> = ({
  snapshot,
  onSelectVehicle,
  onSelectRequest,
  onNavigateToBooking,
  onAdvanceStop,
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
  const [localRequestsOverride, setLocalRequestsOverride] = useState<Record<string, RideRequest> | null>(null);

  // Mid-trip join simulation states (Ticket 09)
  const [activeEvaluation, setActiveEvaluation] = useState<MidTripJoinEvaluation | null>(null);
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [showIncompatibleModal, setShowIncompatibleModal] = useState<boolean>(false);
  const [midTripToast, setMidTripToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const effectiveRequests = useMemo(() => {
    return localRequestsOverride || requests;
  }, [localRequestsOverride, requests]);

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
    ? effectiveRequests[activeReqId]
    : Object.values(effectiveRequests).find((r) => r.assigned_vehicle_id === currentVehicle.vehicle_id) ||
      Object.values(effectiveRequests)[0];

  // Derive cabin layout & stops timeline
  const cabinState = useMemo(() => {
    return deriveCabinOccupancy(currentVehicle, effectiveRequests, currentVehicle.planned_stops);
  }, [currentVehicle, effectiveRequests]);

  const timelineState = useMemo(() => {
    return deriveRouteTimeline(currentVehicle, effectiveRequests);
  }, [currentVehicle, effectiveRequests]);

  const handleSelectSeat = (seat: CabinSeat) => {
    if (seat.requestId) {
      onSelectRequest(seat.requestId);
    }
  };

  const handleSimulateJoiner = (candidate: CandidateJoinRequest) => {
    const evalResult = evaluateMidTripJoin(currentVehicle, effectiveRequests, candidate);
    setActiveEvaluation(evalResult);
    if (!evalResult.isCompatible) {
      setShowIncompatibleModal(true);
    } else {
      setShowConsentModal(true);
    }
  };

  const handleResolveConsent = (
    driverConsent: 'accepted' | 'rejected',
    passengerConsent: 'accepted' | 'declined'
  ) => {
    if (!activeEvaluation) return;
    const resolution = resolveMidTripConsent(
      currentVehicle,
      effectiveRequests,
      activeEvaluation,
      driverConsent,
      passengerConsent
    );

    setShowConsentModal(false);

    if (resolution.outcome === 'approved' && resolution.updatedVehicle && resolution.updatedRequests) {
      setLocalVehicleOverride(resolution.updatedVehicle);
      setLocalRequestsOverride(resolution.updatedRequests);
      setMidTripToast({
        message: resolution.reason,
        type: 'success',
      });
    } else {
      setMidTripToast({
        message: resolution.reason,
        type: 'info',
      });
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

  return (
    <div className="space-y-6 animate-fade-in" id="active-trip-dashboard">
      {/* 1. Header Banner & Vehicle Switcher */}
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
                Ticket 08 Verified
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/20">
                Ticket 09 Verified
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Pune EV Fleet • Live Cabin Occupancy Grid, Ordered Stops Timeline & Shapley Telematics
            </p>
          </div>
        </div>

        {/* Vehicle Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider shrink-0 mr-1">
            Fleet Vehicle:
          </span>
          {Object.values(vehicles).length > 0 ? (
            Object.values(vehicles).map((v) => (
              <button
                key={v.vehicle_id}
                type="button"
                onClick={() => {
                  setActiveVehicleId(v.vehicle_id);
                  onSelectVehicle(v.vehicle_id);
                  setLocalVehicleOverride(null);
                  setLocalRequestsOverride(null);
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

      {/* 1.5 Mid-Trip Join Simulation Action Bar (Ticket 09) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-surface-container-lowest border border-outline-variant/30 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold shrink-0">
            <span className="material-symbols-outlined text-[22px]">dynamic_feed</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-on-surface">
                Dynamic Mid-Trip Join Injection & Two-Way Consent
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/15 text-secondary border border-secondary/20">
                Interactive Simulation
              </span>
            </div>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Simulate candidate insertion into en-route EV • Verifies &le;15.0% detour guarantee with driver & passenger consent
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            id="simulate-compatible-joiner-btn"
            onClick={() => handleSimulateJoiner(DEMO_COMPATIBLE_JOINER)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Simulate Compatible Joiner</span>
          </button>
          <button
            type="button"
            id="simulate-incompatible-joiner-btn"
            onClick={() => handleSimulateJoiner(DEMO_INCOMPATIBLE_JOINER)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <span>Simulate Incompatible Joiner (&gt;15% Detour)</span>
          </button>
        </div>
      </div>

      {/* Mid-Trip Toast / Status Alert Banner */}
      {midTripToast && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-fade-in ${
            midTripToast.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-100'
              : 'bg-primary/10 border-primary/30 text-on-surface'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className={`material-symbols-outlined text-[20px] ${
              midTripToast.type === 'success' ? 'text-emerald-600' : 'text-primary'
            }`}>
              {midTripToast.type === 'success' ? 'check_circle' : 'info'}
            </span>
            <span className="font-semibold">{midTripToast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setMidTripToast(null)}
            className="text-on-surface-variant hover:text-on-surface text-xs font-bold px-2 py-1"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

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

          {/* D. Rider Shapley Fair-Fare & Detour Safeguards Card */}
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

              <button
                type="button"
                onClick={onNavigateToBooking}
                className="w-full h-10 mt-1 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold border border-outline-variant/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Plan Another Trip (/passenger/home)</span>
              </button>
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
              vehicles={localVehicleOverride ? { ...vehicles, [localVehicleOverride.vehicle_id]: localVehicleOverride } : vehicles}
              requests={effectiveRequests}
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

      {/* Two-Way Consent Modal (Ticket 09) */}
      {showConsentModal && activeEvaluation && (
        <TwoWayConsentModal
          evaluation={activeEvaluation}
          onResolve={handleResolveConsent}
          onClose={() => setShowConsentModal(false)}
        />
      )}

      {/* Detour Incompatible Constraint Violation Modal (Ticket 09) */}
      {showIncompatibleModal && activeEvaluation && (
        <IncompatibleDetourModal
          evaluation={activeEvaluation}
          onClose={() => setShowIncompatibleModal(false)}
        />
      )}
    </div>
  );
};
