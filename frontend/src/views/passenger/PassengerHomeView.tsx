import React, { useState, useEffect } from 'react';
import type { GlobalSimulationSnapshot } from '../../types/simulation';
import type { PuneLandmark, DirectRouteResponse } from '../../types/routing';
import { LiveMap } from '../../components/LiveMap';
import { ShapleySlideOverSheet } from '../../components/ShapleySlideOverSheet';
import {
  fetchPuneLandmarks,
  fetchDirectRoute,
  submitPassengerRideRequest,
  FALLBACK_PUNE_LANDMARKS,
} from '../../services/routingService';

interface PassengerHomeViewProps {
  snapshot: GlobalSimulationSnapshot | null;
  onSelectVehicle: (id: string) => void;
  onSelectRequest: (id: string) => void;
  onNavigateToWaiting?: () => void;
}

interface QuickPreset {
  label: string;
  icon: string;
  pickupId: string;
  dropoffId: string;
}

const PRESETS: QuickPreset[] = [
  {
    label: 'Tech corridor',
    icon: 'laptop_mac',
    pickupId: 'shivajinagar',
    dropoffId: 'hinjewadi',
  },
  {
    label: 'Airport express',
    icon: 'flight_takeoff',
    pickupId: 'kothrud',
    dropoffId: 'airport',
  },
  {
    label: 'Station link',
    icon: 'train',
    pickupId: 'swargate',
    dropoffId: 'pune_station',
  },
  {
    label: 'East-west hub',
    icon: 'apartment',
    pickupId: 'baner',
    dropoffId: 'magarpatta',
  },
];

export const PassengerHomeView: React.FC<PassengerHomeViewProps> = ({
  snapshot,
  onSelectVehicle,
  onSelectRequest,
  onNavigateToWaiting,
}) => {
  const [landmarks, setLandmarks] = useState<PuneLandmark[]>(FALLBACK_PUNE_LANDMARKS);
  const [pickupId, setPickupId] = useState<string>('shivajinagar');
  const [dropoffId, setDropoffId] = useState<string>('hinjewadi');
  const [partySize, setPartySize] = useState<number>(1);
  const [isShapleySheetOpen, setIsShapleySheetOpen] = useState<boolean>(false);

  // Routing State
  const [routeData, setRouteData] = useState<DirectRouteResponse | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Booking state
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load landmarks on mount
  useEffect(() => {
    let isMounted = true;
    fetchPuneLandmarks().then((data) => {
      if (isMounted && data.length > 0) {
        setLandmarks(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const pickupLandmark = landmarks.find((l) => l.id === pickupId) || landmarks[0];
  const dropoffLandmark = landmarks.find((l) => l.id === dropoffId) || landmarks[3] || landmarks[1];

  // Calculate direct route whenever locations or party size change
  useEffect(() => {
    if (!pickupLandmark || !dropoffLandmark) return;
    if (pickupLandmark.id === dropoffLandmark.id) {
      return;
    }

    let isMounted = true;
    fetchDirectRoute(
      {
        lat: pickupLandmark.lat,
        lng: pickupLandmark.lng,
        name: pickupLandmark.name,
      },
      {
        lat: dropoffLandmark.lat,
        lng: dropoffLandmark.lng,
        name: dropoffLandmark.name,
      },
      partySize,
      false
    )
      .then((resp) => {
        if (!isMounted) return;
        setRouteData(resp);
        setRouteError(null);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Failed to calculate direct route';
        setRouteError(msg);
        setRouteData(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRoute(false);
      });

    return () => {
      isMounted = false;
    };
  }, [pickupLandmark, dropoffLandmark, partySize]);

  const handleSwap = () => {
    const temp = pickupId;
    setPickupId(dropoffId);
    setDropoffId(temp);
    setIsLoadingRoute(true);
    setBookingStatus(null);
  };

  const handleApplyPreset = (preset: QuickPreset) => {
    setPickupId(preset.pickupId);
    setDropoffId(preset.dropoffId);
    setIsLoadingRoute(true);
    setBookingStatus(null);
  };

  const handleBookRide = async () => {
    if (!routeData) return;
    if (partySize < 1 || partySize > 4) {
      setBookingStatus('Select between 1 and 4 seats.');
      return;
    }
    setIsSubmitting(true);
    try {
      await submitPassengerRideRequest({
        pickup_name: pickupLandmark.name,
        pickup_lat: pickupLandmark.lat,
        pickup_lng: pickupLandmark.lng,
        dropoff_name: dropoffLandmark.name,
        dropoff_lat: dropoffLandmark.lat,
        dropoff_lng: dropoffLandmark.lng,
        party_size: partySize,
        solo_distance_km: routeData.distance_km,
        solo_eta_sec: routeData.duration_sec,
        solo_fare_inr: routeData.solo_fare_inr,
        passenger_name: 'Elena Vance (Rider)',
        preferred_pickup_time: 'Now (ASAP)',
      });
      setBookingStatus(`Ride request admitted to rolling batch #${snapshot?.engine.currentWindowId || 101}`);
      if (onNavigateToWaiting) {
        setTimeout(() => {
          onNavigateToWaiting();
        }, 800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Booking failed';
      setBookingStatus(`Failed to queue ride: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRider = snapshot?.activePassengerSession;
  const vehicles = snapshot?.vehicles || {};
  const requests = snapshot?.requests || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto animate-fade-in">
      {/* Left Column: Uber Signature Ride-Request Form Card (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-2xl border border-[#efefef] shadow-card-elevated flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#efefef]">
            <div>
              <h1 className="font-bold text-2xl text-black font-display tracking-tight">
                Request a ride
              </h1>
              <p className="text-xs text-[#5e5e5e] mt-1">
                Upfront Shapley fair-fare guarantee • Detour strictly ≤ 15%
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#efefef] flex items-center justify-center text-black">
              <span className="material-symbols-outlined text-[20px]">directions_car</span>
            </div>
          </div>

          {/* Quick Pune Route Presets */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-medium text-[#5e5e5e] uppercase tracking-wider">
              Popular corridors
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => {
                const isSelected = pickupId === preset.pickupId && dropoffId === preset.dropoffId;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`py-2 px-3 rounded-full text-xs font-medium flex items-center gap-2 transition-all text-left ${
                      isSelected
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-[#efefef] text-black hover:bg-[#e2e2e2]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {preset.icon}
                    </span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Inputs with Swap */}
          <div className="space-y-2 relative">
            {/* Pickup Row */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#5e5e5e] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-black" />
                Pickup location
              </label>
              <div className="bg-[#efefef] rounded-lg p-1.5 focus-within:ring-2 focus-within:ring-black">
                <select
                  value={pickupId}
                  onChange={(e) => {
                    setPickupId(e.target.value);
                    setBookingStatus(null);
                  }}
                  className="w-full h-9 px-2 bg-transparent text-sm font-medium text-black outline-none cursor-pointer"
                >
                  {landmarks.map((lm) => (
                    <option key={`pickup-${lm.id}`} value={lm.id}>
                      {lm.name} ({lm.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-end -my-1 z-10 pr-3">
              <button
                type="button"
                onClick={handleSwap}
                className="w-8 h-8 rounded-full bg-white hover:bg-[#efefef] border border-[#efefef] text-black flex items-center justify-center transition-colors shadow-sm"
                title="Swap pickup & drop-off"
              >
                <span className="material-symbols-outlined text-[16px]">swap_vert</span>
              </button>
            </div>

            {/* Dropoff Row */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#5e5e5e] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-black" />
                Drop-off destination
              </label>
              <div className="bg-[#efefef] rounded-lg p-1.5 focus-within:ring-2 focus-within:ring-black">
                <select
                  value={dropoffId}
                  onChange={(e) => {
                    setDropoffId(e.target.value);
                    setBookingStatus(null);
                  }}
                  className="w-full h-9 px-2 bg-transparent text-sm font-medium text-black outline-none cursor-pointer"
                >
                  {landmarks.map((lm) => (
                    <option key={`dropoff-${lm.id}`} value={lm.id}>
                      {lm.name} ({lm.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Party Size Stepper */}
          <div className="p-3.5 rounded-xl bg-[#efefef] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-black">Required seats</span>
              <span className="text-[11px] text-[#5e5e5e]">Vehicle capacity: 4 seats</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white rounded-full p-1 border border-[#e2e2e2]">
                <button
                  type="button"
                  id="btn-decrement-party"
                  onClick={() => {
                    if (partySize > 1) {
                      setPartySize(partySize - 1);
                      setBookingStatus(null);
                    }
                  }}
                  disabled={partySize <= 1}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-black hover:bg-[#efefef] disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <span className="w-8 text-center text-xs font-bold font-mono text-black tabular-nums">
                  {partySize}
                </span>
                <button
                  type="button"
                  id="btn-increment-party"
                  onClick={() => {
                    if (partySize < 4) {
                      setPartySize(partySize + 1);
                      setBookingStatus(null);
                    }
                  }}
                  disabled={partySize >= 4}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-black hover:bg-[#efefef] disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Route Error Notice */}
          {routeError && (
            <div className="p-3 rounded-xl bg-[#f8f8f8] border border-black text-black text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{routeError}</span>
            </div>
          )}

          {/* Upfront Fare Estimate Box */}
          {isLoadingRoute ? (
            <div className="p-6 rounded-xl bg-[#efefef] flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[#5e5e5e] font-medium">Computing Shapley fair fare...</span>
            </div>
          ) : routeData ? (
            <div className="space-y-3 pt-2 border-t border-[#efefef]">
              {/* Fare & Savings Comparison */}
              <div className="p-4 rounded-xl bg-[#efefef] flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-medium text-[#5e5e5e] tracking-wider block">
                    Estimated pooled fare
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-bold font-display text-black tabular-nums">
                      ₹{routeData.estimated_pooled_fare_inr.toFixed(2)}
                    </span>
                    <span className="text-sm font-mono text-[#5e5e5e] line-through tabular-nums">
                      ₹{routeData.solo_fare_inr.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-black text-white font-mono">
                    Save ₹{routeData.estimated_pooled_savings_inr.toFixed(2)} (~25%)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsShapleySheetOpen(true)}
                    className="text-xs text-[#5e5e5e] hover:text-black underline flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">balance</span>
                    <span>Shapley details</span>
                  </button>
                </div>
              </div>

              {/* Detour Guarantee Badge */}
              <div className="flex items-center justify-between text-xs px-1 text-[#5e5e5e]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-black text-[16px]">verified</span>
                  <span>Locked max detour:</span>
                </span>
                <span className="font-mono font-medium text-black">
                  ≤ 15.0% (+{routeData.max_detour_buffer_min} mins max)
                </span>
              </div>

              {/* Primary Booking Action Button */}
              <button
                type="button"
                id="btn-search-shared-ride"
                onClick={handleBookRide}
                disabled={isSubmitting || partySize < 1 || partySize > 4}
                className="btn-uber-primary w-full py-4 text-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSubmitting ? 'sync' : 'search'}
                </span>
                <span>
                  {isSubmitting
                    ? 'Submitting to batch window...'
                    : `Search pooled rides • ₹${routeData.estimated_pooled_fare_inr.toFixed(2)}`}
                </span>
              </button>

              {bookingStatus && (
                <div className="p-3 rounded-xl bg-[#efefef] text-xs text-black flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                  <span>{bookingStatus}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Active Session Status (if returning to book while ride active) */}
        {activeRider && activeRider.lifecycleStatus !== 'idle' && (
          <div className="p-4 rounded-2xl bg-white border border-[#efefef] shadow-card flex items-center justify-between text-xs">
            <div>
              <span className="text-[#5e5e5e] block">Current active ride:</span>
              <span className="font-bold text-black capitalize">
                {activeRider.lifecycleStatus.replace('_', ' ')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsShapleySheetOpen(true)}
              className="text-black font-medium underline"
            >
              View fare breakdown
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Interactive Route Map (7 cols) */}
      <div className="lg:col-span-7 h-[640px] rounded-2xl overflow-hidden border border-[#efefef] shadow-card bg-white">
        <LiveMap
          mapId="passenger-home"
          vehicles={vehicles}
          requests={requests}
          selectedVehicleId={snapshot?.selection?.selectedVehicleId || null}
          onSelectVehicle={onSelectVehicle}
          onSelectRequest={onSelectRequest}
          soloRoutePolyline={routeData?.polyline || null}
          soloPickupLocation={
            pickupLandmark
              ? { lat: pickupLandmark.lat, lng: pickupLandmark.lng, name: pickupLandmark.name }
              : null
          }
          soloDropoffLocation={
            dropoffLandmark
              ? { lat: dropoffLandmark.lat, lng: dropoffLandmark.lng, name: dropoffLandmark.name }
              : null
          }
        />
      </div>

      {/* Shapley Fair Fare Slide-Over Sheet */}
      <ShapleySlideOverSheet
        isOpen={isShapleySheetOpen}
        onClose={() => setIsShapleySheetOpen(false)}
        requestId={activeRider?.activeTripRequestId || 'preview'}
      />
    </div>
  );
};
