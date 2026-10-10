import React, { useState, useMemo } from 'react';
import type { GlobalSimulationSnapshot, Vehicle, RideRequest, MidTripJoinCandidate } from '../../types/simulation';
import { LiveMap } from '../../components/LiveMap';
import { StopsTimeline } from '../../components/StopsTimeline';
import { TripCompletionReceipt } from '../../components/TripCompletionReceipt';
import { ShapleySlideOverSheet } from '../../components/ShapleySlideOverSheet';
import { TwoWayConsentModal } from '../../components/TwoWayConsentModal';
import { IncompatibleDetourModal } from '../../components/IncompatibleDetourModal';
import { ActiveTripHeader } from '../../components/ActiveTripHeader';
import { ActiveTripFarePanel } from '../../components/ActiveTripFarePanel';
import {
  deriveCabinOccupancy,
  deriveRouteTimeline,
  type CabinSeat,
} from '../../services/cabinOccupancyService';
import { cancelRideRequestDirect } from '../../services/simulationService';
import {
  resolveMidTripConsent,
  type MidTripJoinEvaluation,
} from '../../services/midTripJoinService';

interface PassengerActiveViewProps {
  snapshot: GlobalSimulationSnapshot | null;
  onSelectVehicle: (id: string) => void;
  onSelectRequest: (id: string) => void;
  onNavigateToBooking: () => void;
  onAdvanceStop?: (vehicleId: string) => Promise<any>;
  onCancelRide?: (requestId: string) => Promise<any>;
  onSimulateCoRiderCancellation?: (vehicleId: string) => Promise<any>;
  onResetSession?: () => Promise<any>;
  initialCandidate?: MidTripJoinCandidate | null;
  autoOpenShapleySheet?: boolean;
}

export const PassengerActiveView: React.FC<PassengerActiveViewProps> = ({
  snapshot,
  onSelectVehicle,
  onSelectRequest,
  onNavigateToBooking,
  onAdvanceStop,
  onCancelRide,
  initialCandidate,
  autoOpenShapleySheet = false,
}) => {
  const session = snapshot?.activePassengerSession;
  const vehicles = useMemo(() => snapshot?.vehicles || {}, [snapshot?.vehicles]);
  const requests = useMemo(() => snapshot?.requests || {}, [snapshot?.requests]);

  const defaultVehicleId =
    session?.assignedVehicleId ||
    snapshot?.selection?.selectedVehicleId ||
    Object.keys(vehicles)[0] ||
    'V-101';

  const [activeVehicleId] = useState<string>(defaultVehicleId);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  const [localVehicleOverride, setLocalVehicleOverride] = useState<Vehicle | null>(null);
  const [localRequestsOverride, setLocalRequestsOverride] = useState<Record<string, RideRequest> | null>(null);

  // Modals & Sheets
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [showIncompatibleModal, setShowIncompatibleModal] = useState<boolean>(false);
  const [activeEvaluation] = useState<MidTripJoinEvaluation | null>(null);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [isShapleySheetOpen, setIsShapleySheetOpen] = useState<boolean>(autoOpenShapleySheet);

  // Active Join Candidate
  const [activeJoinCandidate, setActiveJoinCandidate] = useState<MidTripJoinCandidate | null>(
    initialCandidate || null
  );

  const effectiveRequests = useMemo(() => {
    return localRequestsOverride || requests;
  }, [localRequestsOverride, requests]);

  // Active Vehicle Data
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

  const currentVehicle: Vehicle =
    localVehicleOverride && localVehicleOverride.vehicle_id === activeVehicleId
      ? localVehicleOverride
      : baseVehicle;

  // Active rider request
  const activeReqId = session?.activeTripRequestId;
  const activeRequest: RideRequest | undefined = activeReqId
    ? effectiveRequests[activeReqId]
    : Object.values(effectiveRequests).find((r) => r.assigned_vehicle_id === currentVehicle.vehicle_id) ||
      Object.values(effectiveRequests)[0];

  // Auto-detect completed status
  const isTripCompleted =
    activeRequest?.status === 'dropped_off' ||
    session?.lifecycleStatus === 'dropped_off';

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

  // Handlers for mid-trip consent
  const handleAcceptCandidate = () => {
    if (!activeJoinCandidate) return;
    setActiveJoinCandidate(null);
  };

  const handleDeclineCandidate = () => {
    setActiveJoinCandidate(null);
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
    }
  };

  // Advance Stop
  const handleAdvanceStop = async (vehicleId: string) => {
    if (!onAdvanceStop) return;
    setIsAdvancing(true);
    try {
      await onAdvanceStop(vehicleId);
    } finally {
      setIsAdvancing(false);
    }
  };

  // Confirm cancel ride
  const handleConfirmCancelRide = async () => {
    if (!activeRequest?.request_id) return;
    setIsCancelling(true);
    try {
      if (onCancelRide) {
        await onCancelRide(activeRequest.request_id);
      } else {
        await cancelRideRequestDirect(activeRequest.request_id);
      }
      setShowCancelConfirmModal(false);
      onNavigateToBooking();
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
      {/* 1. Trip Header */}
      <ActiveTripHeader
        vehicle={currentVehicle}
        activeRequest={activeRequest}
        onAdvanceStop={onAdvanceStop ? handleAdvanceStop : undefined}
        onCancelClick={() => setShowCancelConfirmModal(true)}
        isAdvancing={isAdvancing}
      />

      {/* 2. Main In-Ride Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Map & Stops Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Live Map Panel */}
          <div className="h-[440px] rounded-2xl overflow-hidden border border-[#efefef] bg-white shadow-card">
            <LiveMap
              mapId="passenger-active"
              vehicles={{ [currentVehicle.vehicle_id]: currentVehicle }}
              requests={effectiveRequests}
              selectedVehicleId={currentVehicle.vehicle_id}
              onSelectVehicle={onSelectVehicle}
              onSelectRequest={onSelectRequest}
            />
          </div>

          {/* Stops Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-[#efefef] shadow-card">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#efefef]">
              <h3 className="font-bold text-xs text-black uppercase tracking-wider">
                Corridor route stops
              </h3>
              <span className="text-xs text-[#5e5e5e] font-mono">
                {currentVehicle.planned_stops?.length || 4} total stops
              </span>
            </div>
            <StopsTimeline
              timelineState={timelineState}
              onAdvanceStop={onAdvanceStop ? () => handleAdvanceStop(currentVehicle.vehicle_id) : undefined}
              isAdvancing={isAdvancing}
            />
          </div>
        </div>

        {/* Right Column: Transparent Fare, Cabin Occupancy & Consent (5 cols) */}
        <div className="lg:col-span-5">
          <ActiveTripFarePanel
            vehicle={currentVehicle}
            activeRequest={activeRequest}
            cabinState={cabinState}
            onOpenShapleySheet={() => setIsShapleySheetOpen(true)}
            onSelectSeat={handleSelectSeat}
            activeJoinCandidate={activeJoinCandidate}
            onAcceptCandidate={handleAcceptCandidate}
            onDeclineCandidate={handleDeclineCandidate}
          />
        </div>
      </div>

      {/* Modals & Slide-Overs */}
      <ShapleySlideOverSheet
        isOpen={isShapleySheetOpen}
        onClose={() => setIsShapleySheetOpen(false)}
        requestId={activeRequest?.request_id || null}
      />

      {showConsentModal && activeEvaluation && (
        <TwoWayConsentModal
          evaluation={activeEvaluation}
          onResolve={handleResolveConsent}
          onClose={() => setShowConsentModal(false)}
        />
      )}

      {showIncompatibleModal && activeEvaluation && (
        <IncompatibleDetourModal
          evaluation={activeEvaluation}
          onClose={() => setShowIncompatibleModal(false)}
        />
      )}

      {(isReceiptOpen || isTripCompleted) && activeRequest && (
        <TripCompletionReceipt
          isOpen={isReceiptOpen || isTripCompleted}
          onClose={() => {
            setIsReceiptOpen(false);
            onNavigateToBooking();
          }}
          request={activeRequest}
          vehicle={currentVehicle}
          onBookAnother={onNavigateToBooking}
          onOpenShapleyExplanation={() => setIsShapleySheetOpen(true)}
        />
      )}

      {showCancelConfirmModal && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#efefef] p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-black font-display">Cancel active trip?</h3>
            <p className="text-xs text-[#5e5e5e] leading-relaxed">
              Your ride on vehicle {currentVehicle.vehicle_id} will be ended and remaining stops recalculated.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirmModal(false)}
                className="btn-uber-subtle px-4 py-2 text-xs"
              >
                Keep riding
              </button>
              <button
                type="button"
                id="btn-confirm-cancel-active"
                onClick={handleConfirmCancelRide}
                disabled={isCancelling}
                className="btn-uber-primary px-4 py-2 text-xs disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
