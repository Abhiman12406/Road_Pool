import React, { useState, useEffect, useCallback } from 'react';
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
    label: 'Tech Commute',
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
  const [forceFallback, setForceFallback] = useState<boolean>(false);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  const [isShapleySheetOpen, setIsShapleySheetOpen] = useState<boolean>(false);

  // Timing and Special Requirements State
  const [pickupTimeMode, setPickupTimeMode] = useState<'asap' | 'custom'>('asap');
  const [customPickupTime, setCustomPickupTime] = useState<string>('');
  const [enableDeadline, setEnableDeadline] = useState<boolean>(false);
  const [arrivalDeadline, setArrivalDeadline] = useState<string>('');
  const [specialNeeds, setSpecialNeeds] = useState<string[]>([]);

  // Routing State
  const [routeData, setRouteData] = useState<DirectRouteResponse | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Booking state
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load landmarks from backend on mount
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

  // Calculate direct route whenever locations, party size, or forceFallback changes
  const calculateRoute = useCallback(async () => {
    if (!pickupLandmark || !dropoffLandmark) return;
    if (pickupLandmark.id === dropoffLandmark.id) {
      setRouteError('Pickup and drop-off cannot be the same landmark. Please select distinct locations.');
      setRouteData(null);
      return;
    }

    setIsLoadingRoute(true);
    setRouteError(null);

    try {
      const resp = await fetchDirectRoute(
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
        forceFallback
      );
      setRouteData(resp);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to calculate direct route';
      setRouteError(msg);
      setRouteData(null);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [pickupLandmark, dropoffLandmark, partySize, forceFallback]);

  useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);

  const handleSwap = () => {
    const temp = pickupId;
    setPickupId(dropoffId);
    setDropoffId(temp);
    setBookingStatus(null);
  };

  const handleApplyPreset = (preset: QuickPreset) => {
    setPickupId(preset.pickupId);
    setDropoffId(preset.dropoffId);
    setBookingStatus(null);
  };

  const handleBookRide = async () => {
    if (!routeData) return;
    if (partySize < 1 || partySize > 4) {
      setBookingStatus('Invalid party size: Must be between 1 and 4 passengers (vehicle capacity limit).');
      return;
    }
    setIsSubmitting(true);
    try {
      const preferredTimeStr = pickupTimeMode === 'asap' ? 'Now (ASAP)' : (customPickupTime || 'Now (ASAP)');
      const specialReqsStr = specialNeeds.length > 0 ? specialNeeds.join(', ') : undefined;
      const deadlineStr = enableDeadline && arrivalDeadline ? arrivalDeadline : undefined;

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
        preferred_pickup_time: preferredTimeStr,
        arrival_deadline: deadlineStr,
        special_requirements: specialReqsStr,
      });
      setBookingStatus(`Ride request (${partySize} seats) admitted to Rolling Batch #${snapshot?.engine.currentWindowId || 101}`);
      if (onNavigateToWaiting) {
        setTimeout(() => {
          onNavigateToWaiting();
        }, 1200);
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
      {/* Left Column: Route Selection & Estimation (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-soft border border-outline-variant/30 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-xl text-on-surface">Book Shared Commute</h2>
              <p className="text-xs text-on-surface-variant font-medium">
                Pune Hybrid Router & Solo Fare Estimator
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-on-primary-container text-[20px]">
                navigation
              </span>
            </div>
          </div>

          {/* Quick Route Preset Chips */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Popular Pune Corridors
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all text-left ${
                    pickupId === preset.pickupId && dropoffId === preset.dropoffId
                      ? 'bg-primary-container/30 border-primary text-primary font-bold'
                      : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    {preset.icon}
                  </span>
                  <span className="truncate">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pickup and Dropoff Selection with Connecting Track Line */}
          <div className="flex flex-col gap-2 relative">
            {/* Pickup Landmark */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Pickup Location (Pune)
              </label>
              <select
                value={pickupId}
                onChange={(e) => {
                  setPickupId(e.target.value);
                  setBookingStatus(null);
                }}
                className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {landmarks.map((lm) => (
                  <option key={`pickup-${lm.id}`} value={lm.id}>
                    {lm.name} ({lm.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button Node */}
            <div className="flex justify-end pr-2 -my-1 z-10">
              <button
                type="button"
                onClick={handleSwap}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface flex items-center justify-center transition-all shadow-sm hover:scale-105"
                title="Swap Pickup & Destination"
              >
                <span className="material-symbols-outlined text-[18px]">swap_vert</span>
              </button>
            </div>

            {/* Drop-off Landmark */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                Drop-off Destination (Pune)
              </label>
              <select
                value={dropoffId}
                onChange={(e) => {
                  setDropoffId(e.target.value);
                  setBookingStatus(null);
                }}
                className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {landmarks.map((lm) => (
                  <option key={`dropoff-${lm.id}`} value={lm.id}>
                    {lm.name} ({lm.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Party Size Stepper & Seat Capacity Indicator */}
            <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">groups</span>
                    Passenger Count & Seat Requirements
                  </label>
                  <span className="text-[10px] text-on-surface-variant font-medium">
                    Vehicle capacity: 4 seats maximum
                  </span>
                </div>

                {/* Visual Cabin Seat Indicators */}
                <div className="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1 rounded-full border border-outline-variant/30 shadow-xs">
                  {[1, 2, 3, 4].map((seatIdx) => (
                    <span
                      key={`seat-dot-${seatIdx}`}
                      className={`material-symbols-outlined text-[16px] transition-all ${
                        seatIdx <= partySize
                          ? 'text-primary fill-1 font-bold'
                          : 'text-outline-variant/40'
                      }`}
                      title={seatIdx <= partySize ? `Seat ${seatIdx}: Reserved for your booking` : `Seat ${seatIdx}: Available`}
                    >
                      airline_seat_recline_normal
                    </span>
                  ))}
                  <span className="text-[10px] font-extrabold text-primary ml-1">
                    {partySize}/4
                  </span>
                </div>
              </div>

              {/* Stepper + Direct Preset Controls */}
              <div className="flex items-center gap-3">
                {/* Stepper Controls with Plus and Minus */}
                <div className="flex items-center bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-1 shadow-sm">
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
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    title="Decrease passenger count"
                  >
                    <span className="material-symbols-outlined text-[18px]">remove</span>
                  </button>

                  <div className="w-14 text-center font-extrabold text-sm text-on-surface flex flex-col items-center">
                    <span>{partySize}</span>
                    <span className="text-[9px] font-semibold text-on-surface-variant -mt-1">
                      {partySize === 1 ? 'Rider' : 'Riders'}
                    </span>
                  </div>

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
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    title="Increase passenger count"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>

                {/* Direct Size Quick Chips */}
                <div className="grid grid-cols-4 gap-1.5 flex-1">
                  {[1, 2, 3, 4].map((size) => (
                    <button
                      key={`quick-size-${size}`}
                      type="button"
                      onClick={() => {
                        setPartySize(size);
                        setBookingStatus(null);
                      }}
                      className={`h-10 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center ${
                        partySize === size
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'bg-surface-container-lowest text-on-surface border border-outline-variant/30 hover:bg-surface-container'
                      }`}
                    >
                      <span>{size}</span>
                      <span className="text-[8px] opacity-80">{size === 1 ? 'seat' : 'seats'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Requirement Rule Explanation */}
              <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant bg-surface-container-lowest/70 p-2 rounded-xl border border-outline-variant/20">
                <span className="material-symbols-outlined text-[14px] text-tertiary shrink-0">info</span>
                <span>
                  {partySize === 1
                    ? '1 seat required. Booking reserves 1 seat in the pooled vehicle.'
                    : `Treating booking for ${partySize} passengers as ${partySize} occupied seats (not 1). Reserves ${partySize} of 4 seats.`}
                </span>
              </div>
            </div>

            {/* Trip Timing & Arrival Deadline Section */}
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <label className="text-[11px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                Preferred Timing & Arrival Deadline
              </label>

              {/* Preferred Pickup Mode */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPickupTimeMode('asap')}
                  className={`p-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    pickupTimeMode === 'asap'
                      ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-sm'
                      : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  <span>Leave ASAP (Now)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPickupTimeMode('custom')}
                  className={`p-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    pickupTimeMode === 'custom'
                      ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-sm'
                      : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">timer</span>
                  <span>Schedule Time</span>
                </button>
              </div>

              {pickupTimeMode === 'custom' && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-on-surface-variant font-medium shrink-0">Preferred Pickup:</span>
                  <input
                    type="time"
                    value={customPickupTime}
                    onChange={(e) => setCustomPickupTime(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* Strict Arrival Deadline Toggle */}
              <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-outline-variant/20">
                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableDeadline}
                    onChange={(e) => setEnableDeadline(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant"
                  />
                  <span>Enforce strict arrival deadline (e.g. flight, work shift)</span>
                </label>

                {enableDeadline && (
                  <div className="flex items-center gap-2 pl-6 mt-1">
                    <span className="text-[11px] text-on-surface-variant font-medium shrink-0">Must arrive before:</span>
                    <input
                      type="time"
                      value={arrivalDeadline}
                      onChange={(e) => setArrivalDeadline(e.target.value)}
                      className="flex-1 h-9 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-[10px] text-tertiary font-bold shrink-0">Hard Constraint</span>
                  </div>
                )}
              </div>
            </div>

            {/* Special Commute Requirements (Optional) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
                <span>Special Requirements (Optional)</span>
                <span className="text-[10px] text-outline font-normal">Multi-select</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'luggage', label: 'Luggage / Bags', icon: 'luggage' },
                  { id: 'quiet', label: 'Quiet Commute', icon: 'volume_off' },
                  { id: 'mobility', label: 'Mobility / Wheelchair', icon: 'accessible' },
                  { id: 'front_seat', label: 'Front Seat Preferred', icon: 'front_hand' },
                ].map((item) => {
                  const isSelected = specialNeeds.includes(item.label);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSpecialNeeds(specialNeeds.filter((n) => n !== item.label));
                        } else {
                          setSpecialNeeds([...specialNeeds, item.label]);
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 border transition-all text-left ${
                        isSelected
                          ? 'bg-secondary-container/40 border-secondary text-secondary font-bold'
                          : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Engine Provider Indicator & Test Fallback Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-on-surface-variant text-[11px] font-semibold">Engine:</span>
              {routeData?.provider === 'osrm' ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  OSRM Live Highway Router
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Pune Calibrated Engine (Fallback)
                </span>
              )}
              {routeData?.cached && (
                <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant text-[10px] font-mono">
                  cached
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setForceFallback(!forceFallback)}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                forceFallback
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:text-on-surface'
              }`}
              title="Toggle to simulate OSRM service failure and test Pune calibrated model"
            >
              {forceFallback ? 'Force Fallback [ON]' : 'Test Fallback'}
            </button>
          </div>

          {/* Route Error Alert */}
          {routeError && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span>{routeError}</span>
            </div>
          )}

          {/* Solo Route Metrics Card */}
          {isLoadingRoute ? (
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-on-surface-variant font-medium">
                Querying Pune road network & computing solo reference metrics...
              </span>
            </div>
          ) : routeData ? (
            <div className="flex flex-col gap-3">
              {/* Solo Ride Reference Baseline Card */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                    Solo Ride Reference Baseline
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px] font-semibold">
                    Direct Unshared
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col">
                    <span className="text-[10px] text-on-surface-variant font-medium">Distance</span>
                    <span className="text-sm font-extrabold text-on-surface mt-0.5">
                      {routeData.distance_km} km
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col">
                    <span className="text-[10px] text-on-surface-variant font-medium">Direct Time</span>
                    <span className="text-sm font-extrabold text-on-surface mt-0.5">
                      {routeData.duration_min} mins
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col">
                    <span className="text-[10px] text-on-surface-variant font-medium">Solo Fare</span>
                    <span className="text-sm font-extrabold text-primary mt-0.5">
                      ₹{routeData.solo_fare_inr.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Transparent Fare Breakdown Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {showBreakdown ? 'expand_less' : 'expand_more'}
                    </span>
                    <span>{showBreakdown ? 'Hide Fare Breakdown' : 'View Fare Breakdown (Base ₹40 + ₹18/km + ₹2.5/min)'}</span>
                  </button>

                  {showBreakdown && (
                    <div className="mt-2 p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-[11px] flex flex-col gap-1.5">
                      <div className="flex justify-between text-on-surface-variant">
                        <span>Base Flag-down Fare:</span>
                        <span className="font-semibold text-on-surface">₹{routeData.fare_breakdown.base_fare.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-on-surface-variant">
                        <span>Distance Charge ({routeData.distance_km} km @ ₹18.0/km):</span>
                        <span className="font-semibold text-on-surface">₹{routeData.fare_breakdown.distance_fare.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-on-surface-variant">
                        <span>Time Charge ({routeData.duration_min} min @ ₹2.5/min):</span>
                        <span className="font-semibold text-on-surface">₹{routeData.fare_breakdown.time_fare.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-outline-variant/40 pt-1 flex justify-between font-bold text-on-surface">
                        <span>Total Solo Reference Fare:</span>
                        <span className="text-primary">₹{routeData.fare_breakdown.total_solo_fare.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cooperative Sharing Preview & Detour Guarantee Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary-fixed/30 via-surface-container-lowest to-secondary-container/20 border border-outline-variant/30 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-extrabold uppercase tracking-wide">
                      Cooperative Pooling
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-extrabold text-tertiary">
                        ₹{routeData.estimated_pooled_fare_inr.toFixed(2)}
                      </span>
                      <span className="text-xs text-on-surface-variant line-through">
                        ₹{routeData.solo_fare_inr.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary text-xs font-bold">
                      Save ₹{routeData.estimated_pooled_savings_inr.toFixed(2)} (25%)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsShapleySheetOpen(true)}
                      className="text-[10px] text-primary hover:underline font-semibold mt-1 flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[13px]">balance</span>
                      <span>How Shapley Fares Work</span>
                    </button>
                  </div>
                </div>

                {/* Detour Guarantee Comparison Bar */}
                <div className="p-2.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-tertiary text-[16px]">verified_user</span>
                      <span>Max Detour Guarantee</span>
                    </div>
                    <span className="font-bold text-tertiary">
                      ≤ 15.0% (+{routeData.max_detour_buffer_min} mins max)
                    </span>
                  </div>

                  {/* Progress bar visual */}
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary" style={{ width: '87%' }} title="Direct Travel Time"></div>
                    <div className="h-full bg-secondary" style={{ width: '13%' }} title="Max Detour Buffer (15%)"></div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                    <span>Direct: ~{routeData.duration_min} min</span>
                    <span className="font-medium text-secondary">
                      Arrival within +{routeData.max_detour_buffer_min} min or ride unshared
                    </span>
                  </div>
                </div>

                {/* Booking CTA Button */}
                <button
                  type="button"
                  id="btn-search-shared-ride"
                  onClick={handleBookRide}
                  disabled={isSubmitting || partySize < 1 || partySize > 4}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/95 text-on-primary font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.99]"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isSubmitting ? 'sync' : 'search'}
                  </span>
                  <span>
                    {isSubmitting
                      ? 'Submitting Request...'
                      : `Search for Shared Ride (${partySize} ${partySize === 1 ? 'passenger' : 'passengers'}) • ₹${routeData.estimated_pooled_fare_inr.toFixed(2)}`}
                  </span>
                </button>

                {bookingStatus && (
                  <div className="p-3 rounded-xl bg-tertiary-fixed/30 border border-tertiary/20 text-xs text-on-tertiary-container flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
                    <span>{bookingStatus}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Live Rider Active Status Badge if currently assigned */}
        {activeRider && activeRider.lifecycleStatus !== 'idle' && (
          <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-soft border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-on-surface">Active Session Status</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-tertiary-fixed font-bold text-on-tertiary-fixed capitalize">
                {activeRider.lifecycleStatus.replace('_', ' ')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container">
                <span className="text-on-surface-variant block">Solo Reference</span>
                <span className="font-bold text-base text-on-surface">
                  ₹{activeRider.fareSoloDirectInr.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container">
                <span className="text-on-surface-variant block">Pooled Price</span>
                <span className="font-bold text-base text-tertiary">
                  ₹{activeRider.fareShapleyPooledInr.toFixed(2)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsShapleySheetOpen(true)}
              className="py-2 px-3 rounded-xl bg-tertiary-container/30 hover:bg-tertiary-container/50 text-tertiary text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-tertiary/20"
            >
              <span className="material-symbols-outlined text-[15px]">balance</span>
              <span>Why am I paying this fare? (Shapley Audit)</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Column: Live Map View with Clean Blue Solo Polyline (7 cols) */}
      <div className="lg:col-span-7 h-[680px]">
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
