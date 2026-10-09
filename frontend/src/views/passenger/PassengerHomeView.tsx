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
    label: 'Tech Corridor',
    icon: 'laptop_mac',
    pickupId: 'shivajinagar',
    dropoffId: 'hinjewadi',
  },
  {
    label: 'Airport Express',
    icon: 'flight_takeoff',
    pickupId: 'kothrud',
    dropoffId: 'airport',
  },
  {
    label: 'Station Link',
    icon: 'train',
    pickupId: 'swargate',
    dropoffId: 'pune_station',
  },
  {
    label: 'East-West Hub',
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
      setBookingStatus(`Ride request admitted to Rolling Batch #${snapshot?.engine.currentWindowId || 101}`);
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
      {/* Left Column: Clean Booking Card (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h1 className="font-bold text-lg text-slate-900 tracking-tight">Book Pooled Commute</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Upfront Shapley fair-fare guarantee with locked detour ≤ 15%
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <span className="material-symbols-outlined text-[18px]">directions_car</span>
            </div>
          </div>

          {/* Quick Pune Route Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Corridors
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => {
                const isSelected = pickupId === preset.pickupId && dropoffId === preset.dropoffId;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 border transition-colors text-left ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px] opacity-80">
                      {preset.icon}
                    </span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Inputs with Swap */}
          <div className="space-y-3 relative">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-900" />
                Pickup Location
              </label>
              <select
                value={pickupId}
                onChange={(e) => {
                  setPickupId(e.target.value);
                  setBookingStatus(null);
                }}
                className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              >
                {landmarks.map((lm) => (
                  <option key={`pickup-${lm.id}`} value={lm.id}>
                    {lm.name} ({lm.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end -my-1 z-10 pr-2">
              <button
                type="button"
                onClick={handleSwap}
                className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-xs"
                title="Swap Pickup & Destination"
              >
                <span className="material-symbols-outlined text-[15px]">swap_vert</span>
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Drop-off Destination
              </label>
              <select
                value={dropoffId}
                onChange={(e) => {
                  setDropoffId(e.target.value);
                  setBookingStatus(null);
                }}
                className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white"
              >
                {landmarks.map((lm) => (
                  <option key={`dropoff-${lm.id}`} value={lm.id}>
                    {lm.name} ({lm.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Party Size Stepper */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900">Required Seats</span>
              <span className="text-[11px] text-slate-500">Max vehicle capacity: 4 seats</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5">
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
                  className="w-7 h-7 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <span className="w-8 text-center text-xs font-bold font-mono text-slate-900 tabular-nums">
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
                  className="w-7 h-7 rounded flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Route Error Notice */}
          {routeError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{routeError}</span>
            </div>
          )}

          {/* Upfront Fare Estimate Box */}
          {isLoadingRoute ? (
            <div className="p-6 rounded-lg bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Computing route & Shapley fair-fare...</span>
            </div>
          ) : routeData ? (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {/* Fare & Savings Comparison */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Estimated Pooled Fare
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                      ₹{routeData.estimated_pooled_fare_inr.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-400 line-through tabular-nums">
                      ₹{routeData.solo_fare_inr.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                    Save ₹{routeData.estimated_pooled_savings_inr.toFixed(2)} (~25%)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsShapleySheetOpen(true)}
                    className="text-[10px] text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-[12px]">balance</span>
                    <span>Shapley details</span>
                  </button>
                </div>
              </div>

              {/* Detour Guarantee Badge */}
              <div className="flex items-center justify-between text-xs px-1 text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-emerald-600 text-[15px]">verified</span>
                  <span>Locked Max Detour:</span>
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  ≤ 15.0% (+{routeData.max_detour_buffer_min} mins max)
                </span>
              </div>

              {/* Primary Booking Action Button */}
              <button
                type="button"
                id="btn-search-shared-ride"
                onClick={handleBookRide}
                disabled={isSubmitting || partySize < 1 || partySize > 4}
                className="w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.99] shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSubmitting ? 'sync' : 'search'}
                </span>
                <span>
                  {isSubmitting
                    ? 'Submitting to Batch Window...'
                    : `Find Pooled Ride • ₹${routeData.estimated_pooled_fare_inr.toFixed(2)}`}
                </span>
              </button>

              {bookingStatus && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>{bookingStatus}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Active Session Status (if returning to book while ride active) */}
        {activeRider && activeRider.lifecycleStatus !== 'idle' && (
          <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Current Active Ride:</span>
              <span className="font-bold text-slate-900 capitalize">
                {activeRider.lifecycleStatus.replace('_', ' ')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsShapleySheetOpen(true)}
              className="text-slate-700 hover:text-slate-900 font-bold hover:underline"
            >
              View Fare Breakdown
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Clean Interactive Route Map (7 cols) */}
      <div className="lg:col-span-7 h-[640px] rounded-xl overflow-hidden border border-slate-200 bg-white">
        <LiveMap
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
        requestId={activeRider?.activeTripRequestId || null}
      />
    </div>
  );
};
