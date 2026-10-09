import React, { useState } from 'react';
import type { GlobalSimulationSnapshot, Vehicle } from '../../types/simulation';
import type { ActiveViewKey } from '../../components/ShellHeader';
import { DriverKPISection } from '../../components/driver/DriverKPISection';
import { DriverTripOfferCard, DEFAULT_DEMO_OFFER, type TripOfferDetails } from '../../components/driver/DriverTripOfferCard';
import { DriverActiveManifest, DEFAULT_DEMO_STOPS, type DriverManifestStop } from '../../components/driver/DriverActiveManifest';
import { DriverMidTripConsentModal, DEFAULT_MID_TRIP_CANDIDATE } from '../../components/driver/DriverMidTripConsentModal';
import { DriverTripDetailDrawer } from '../../components/driver/DriverTripDetailDrawer';
import { TripCompletionReceipt } from '../../components/TripCompletionReceipt';
import { LiveMap } from '../../components/LiveMap';

interface DriverHomeViewProps {
  snapshot: GlobalSimulationSnapshot | null;
  isOnline: boolean;
  onToggleOnline: () => void;
  selectedVehicleId: string;
  onSelectVehicleId: (id: string) => void;
  onAdvanceStop?: (vehicleId: string) => void;
  onNavigateToView: (view: ActiveViewKey) => void;
}

export type DriverCockpitState = 'idle' | 'offer_received' | 'active_manifest';

export const DriverHomeView: React.FC<DriverHomeViewProps> = ({
  snapshot,
  isOnline,
  onToggleOnline,
  selectedVehicleId,
  onSelectVehicleId,
  onAdvanceStop,
  onNavigateToView: _onNavigateToView,
}) => {
  // Trip State Machine: 'idle' | 'offer_received' | 'active_manifest'
  const [cockpitState, setCockpitState] = useState<DriverCockpitState>('offer_received');
  const [activeOffer, setActiveOffer] = useState<TripOfferDetails>(DEFAULT_DEMO_OFFER);
  const [activeManifestStops, setActiveManifestStops] = useState<DriverManifestStop[]>(DEFAULT_DEMO_STOPS);

  // Modal / Drawer states
  const [isMidTripModalOpen, setIsMidTripModalOpen] = useState<boolean>(false);
  const [isTripDetailDrawerOpen, setIsTripDetailDrawerOpen] = useState<boolean>(false);
  const [isCompletionReceiptOpen, setIsCompletionReceiptOpen] = useState<boolean>(false);
  const [payoutBonusInr, setPayoutBonusInr] = useState<number>(0);

  // Retrieve current vehicle from snapshot or fallback
  const vehicles = snapshot?.vehicles ?? {};
  const currentVehicle: Vehicle = vehicles[selectedVehicleId] || {
    vehicle_id: selectedVehicleId || 'V-101',
    name: 'Tata Tigor EV',
    capacity: 4,
    occupied_seats: cockpitState === 'active_manifest' ? 2 : 0,
    current_location: { lat: 18.5204, lng: 73.8567, name: 'Pune Central Metro Hub' },
    status: cockpitState === 'active_manifest' ? 'en_route' : 'idle',
    heading_deg: 90,
    battery_pct: 88,
    route_polyline: [
      [18.5204, 73.8567],
      [18.5314, 73.8446],
      [18.5590, 73.7868],
      [18.5913, 73.7389],
    ],
    planned_stops: [],
  };

  // Handler: Driver accepts pooled trip offer
  const handleAcceptOffer = () => {
    setCockpitState('active_manifest');
  };

  // Handler: Driver declines offer
  const handleDeclineOffer = () => {
    setCockpitState('idle');
  };

  // Handler: Simulate dispatch when in idle
  const handleSimulateNewDispatch = () => {
    setActiveOffer({
      ...DEFAULT_DEMO_OFFER,
      offerId: `OFFER-${Date.now().toString().slice(-4)}`,
    });
    setCockpitState('offer_received');
  };

  // Handler: Advance active stop
  const handleAdvanceStop = (_stopId: string) => {
    if (onAdvanceStop) {
      onAdvanceStop(selectedVehicleId);
    }
  };

  // Handler: Complete trip
  const handleCompleteTrip = () => {
    setIsCompletionReceiptOpen(true);
  };

  // Handler: Accept mid-trip join
  const handleAcceptMidTripJoin = () => {
    setPayoutBonusInr((prev) => prev + 65);
    setIsMidTripModalOpen(false);

    // Insert joiner stops into manifest
    setActiveManifestStops((prev) => [
      ...prev.slice(0, 2),
      {
        id: `stop-join-p`,
        type: 'pickup',
        passengerName: 'Vikram Sen',
        locationName: 'Pune University Chowk',
        landmark: 'Gate 1 Corridor Bay',
        etaMinutes: 16,
        completed: false,
        active: false,
      },
      ...prev.slice(2),
      {
        id: `stop-join-d`,
        type: 'dropoff',
        passengerName: 'Vikram Sen',
        locationName: 'Aundh DP Road',
        landmark: 'Near Medipoint Hospital',
        etaMinutes: 32,
        completed: false,
        active: false,
      },
    ]);
  };

  return (
    <div id="driver-home-view" className="space-y-6">
      {/* 1. Top KPI Summary Section */}
      <DriverKPISection
        todayEarningsInr={1840 + payoutBonusInr}
        completedTripsCount={7}
        distanceDrivenKm={82.4}
        rating={4.9}
        ratingCount={1248}
      />

      {/* 2. Main Operational Workspace (Split Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left / Center: Interactive Live Map */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-[#efefef] shadow-card p-4 flex flex-col relative overflow-hidden min-h-[520px]">
          {/* Map Top Status Pill Overlay */}
          <div className="absolute top-7 left-7 z-20 flex items-center gap-2 flex-wrap pointer-events-none">
            <div className="bg-black text-white px-3.5 py-1.5 rounded-full text-xs font-medium shadow-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span>Pune Metro Corridor</span>
            </div>

            <div className="bg-white text-black px-3.5 py-1.5 rounded-full text-xs font-medium shadow-md border border-[#efefef] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">electric_car</span>
              <span>{currentVehicle.name}</span>
              <span className="text-[11px] font-mono text-[#5e5e5e]">⚡{currentVehicle.battery_pct}%</span>
            </div>
          </div>

          {/* Leaflet Map Canvas */}
          <div className="flex-1 w-full h-full rounded-xl overflow-hidden border border-[#efefef] relative">
            <LiveMap
              mapId="driver-home"
              vehicles={{
                [currentVehicle.vehicle_id]: currentVehicle,
                ...(snapshot?.vehicles || {}),
              }}
              requests={snapshot?.requests || {}}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={onSelectVehicleId}
              onSelectRequest={() => {}}
              focusedVehiclePolyline={currentVehicle.route_polyline}
              routeVisualState={cockpitState === 'active_manifest' ? 'confirmed' : 'proposed'}
            />
          </div>

          {/* Map Bottom Telemetry Strip */}
          <div className="mt-3 pt-3 border-t border-[#efefef] flex items-center justify-between text-xs text-[#5e5e5e] px-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-black"></span>
                <span>Pickups</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5e5e5e]"></span>
                <span>Dropoffs</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-black font-medium bg-[#efefef] px-3 py-1 rounded-full">
                Detour cap: ≤15% guarantee active
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Trip Offer & Manifest State Machine */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          {/* State 0: Driver is Offline */}
          {!isOnline && (
            <div className="bg-white rounded-2xl border border-[#efefef] p-8 text-center shadow-card flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-[#efefef] text-black flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">power_settings_new</span>
              </div>
              <h3 className="text-lg font-bold text-black font-display">You are currently offline</h3>
              <p className="text-sm text-[#5e5e5e] max-w-xs mt-2 leading-relaxed">
                Toggle status to <strong>Online</strong> to start receiving pooled trip requests and dispatch offers in the Pune Metro corridor.
              </p>
              <button
                type="button"
                id="driver-go-online-btn"
                onClick={onToggleOnline}
                className="btn-uber-primary mt-6 py-3 px-6 text-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">toggle_on</span>
                <span>Go online now</span>
              </button>
            </div>
          )}

          {/* State 1: Driver is Online & Idle (Waiting for dispatch) */}
          {isOnline && cockpitState === 'idle' && (
            <div className="bg-white rounded-2xl border border-[#efefef] p-6 shadow-card flex flex-col justify-between h-full min-h-[460px]">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#efefef]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-black animate-pulse"></span>
                    <span className="text-sm font-bold text-black">Waiting for pooled trips</span>
                  </div>
                  <span className="text-[11px] font-mono text-black bg-[#efefef] px-2.5 py-0.5 rounded-full font-medium">
                    IDLE · READY
                  </span>
                </div>

                {/* Radar Scanning Visual */}
                <div className="my-8 flex flex-col items-center text-center">
                  <div className="relative w-28 h-28 flex items-center justify-center mb-4">
                    <div className="absolute inset-0 rounded-full bg-[#efefef] animate-ping opacity-60"></div>
                    <div className="absolute inset-2 rounded-full bg-[#f3f3f3]"></div>
                    <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow-lg relative z-10">
                      <span className="material-symbols-outlined text-[26px]">radar</span>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-black font-display">
                    Scanning Pune corridor
                  </h4>
                  <p className="text-xs text-[#5e5e5e] max-w-xs mt-1.5 leading-relaxed">
                    Rolling batch optimization window is active. Matching passenger coalitions meeting the ≤15% detour guarantee.
                  </p>
                </div>
              </div>

              {/* Simulation Helper */}
              <div className="p-4 rounded-xl bg-[#f8f8f8] border border-[#efefef] space-y-2.5">
                <span className="text-[11px] font-medium text-[#5e5e5e] uppercase tracking-wider block">
                  Interactive demo controls
                </span>
                <p className="text-xs text-[#5e5e5e]">
                  Simulate an incoming dispatch offer to inspect the 24s countdown & 15% detour validation:
                </p>
                <button
                  type="button"
                  id="simulate-incoming-offer-btn"
                  onClick={handleSimulateNewDispatch}
                  className="btn-uber-primary w-full py-3 text-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">add_alert</span>
                  <span>Simulate incoming trip offer</span>
                </button>
              </div>
            </div>
          )}

          {/* State 2: Trip Offer Received ("New pooled trip") */}
          {isOnline && cockpitState === 'offer_received' && (
            <DriverTripOfferCard
              offer={activeOffer}
              onAccept={handleAcceptOffer}
              onDecline={handleDeclineOffer}
              initialSeconds={24}
            />
          )}

          {/* State 3: Active Route Execution */}
          {isOnline && cockpitState === 'active_manifest' && (
            <DriverActiveManifest
              stops={activeManifestStops}
              onAdvanceStop={handleAdvanceStop}
              onCompleteTrip={handleCompleteTrip}
              onOpenTripDetails={() => setIsTripDetailDrawerOpen(true)}
              onSimulateMidTripJoin={() => setIsMidTripModalOpen(true)}
              vehicleName={currentVehicle.name}
              occupiedSeats={currentVehicle.occupied_seats}
              totalSeats={currentVehicle.capacity}
            />
          )}
        </div>
      </div>

      {/* 3. Mid-Trip Consent Modal */}
      <DriverMidTripConsentModal
        isOpen={isMidTripModalOpen}
        onClose={() => setIsMidTripModalOpen(false)}
        onAccept={handleAcceptMidTripJoin}
        onDecline={() => setIsMidTripModalOpen(false)}
        candidate={DEFAULT_MID_TRIP_CANDIDATE}
      />

      {/* 4. Slide-Over Trip Detail & Shapley Drawer */}
      <DriverTripDetailDrawer
        isOpen={isTripDetailDrawerOpen}
        onClose={() => setIsTripDetailDrawerOpen(false)}
      />

      {/* 5. Trip Completion Official Receipt */}
      <TripCompletionReceipt
        isOpen={isCompletionReceiptOpen}
        onClose={() => {
          setIsCompletionReceiptOpen(false);
          setCockpitState('idle');
        }}
        request={{
          request_id: 'REQ-DEMO-COMPLETE',
          passenger_id: 'PAX-01',
          passenger_name: 'Rahul Sharma & Priya Mukherjee',
          pickup: { lat: 18.5204, lng: 73.8567, name: 'MG Road Metro Station' },
          dropoff: { lat: 18.5913, lng: 73.7389, name: 'Hinjewadi Phase 1 IT Park' },
          party_size: 2,
          request_time: '10:08 AM',
          solo_eta_sec: 1800,
          solo_distance_km: 11.2,
          solo_fare_inr: 432,
          shapley_fare_inr: 320,
          pooled_eta_sec: 1980,
          status: 'dropped_off',
          assigned_vehicle_id: selectedVehicleId,
          detour_pct: 5.5,
        }}
        vehicle={currentVehicle}
        onBookAnother={() => {
          setIsCompletionReceiptOpen(false);
          setCockpitState('idle');
        }}
        onOpenShapleyExplanation={() => {
          setIsCompletionReceiptOpen(false);
          setIsTripDetailDrawerOpen(true);
        }}
      />
    </div>
  );
};
