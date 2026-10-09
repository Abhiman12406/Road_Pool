import React, { useState } from 'react';
import type { GlobalSimulationSnapshot } from '../../types/simulation';
import { LiveMap } from '../../components/LiveMap';

interface PassengerHomeViewProps {
  snapshot: GlobalSimulationSnapshot | null;
  onSelectVehicle: (id: string) => void;
  onSelectRequest: (id: string) => void;
}

const PUNE_OPTIONS = [
  { name: 'Shivajinagar Hub', lat: 18.5314, lng: 73.8446 },
  { name: 'Swargate Junction', lat: 18.5018, lng: 73.8636 },
  { name: 'Kothrud Stand', lat: 18.5074, lng: 73.8077 },
  { name: 'Hinjewadi IT Park Phase 1', lat: 18.5913, lng: 73.7389 },
  { name: 'Viman Nagar Town Centre', lat: 18.5679, lng: 73.9143 },
  { name: 'Baner Road', lat: 18.5590, lng: 73.7868 },
];

export const PassengerHomeView: React.FC<PassengerHomeViewProps> = ({
  snapshot,
  onSelectVehicle,
  onSelectRequest,
}) => {
  const [pickup, setPickup] = useState(PUNE_OPTIONS[0].name);
  const [dropoff, setDropoff] = useState(PUNE_OPTIONS[5].name);
  const [partySize, setPartySize] = useState(1);
  const [isBooked, setIsBooked] = useState(false);

  const activeRider = snapshot?.activePassengerSession;
  const vehicles = snapshot?.vehicles || {};
  const requests = snapshot?.requests || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
      {/* Left Booking / Ride Plan Card */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-soft border border-outline-variant/30 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-xl text-on-surface">Book Shared Commute</h2>
              <p className="text-xs text-on-surface-variant">Pune Algorithmic Cooperative Pooling</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-[18px]">person_pin_circle</span>
            </div>
          </div>

          {/* Pickup and Dropoff Selection */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Pickup Location</label>
              <select
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PUNE_OPTIONS.map((opt) => (
                  <option key={opt.name} value={opt.name}>{opt.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Drop-off Destination</label>
              <select
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PUNE_OPTIONS.map((opt) => (
                  <option key={opt.name} value={opt.name}>{opt.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Party Size</label>
              <div className="flex gap-2">
                {[1, 2, 3].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPartySize(size)}
                    className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all ${
                      partySize === size
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:border-outline-variant'
                    }`}
                  >
                    {size} {size === 1 ? 'Seat' : 'Seats'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing & Guarantee Box */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-on-surface-variant line-through">Solo Ride: ₹180.00</span>
                <div className="text-2xl font-extrabold text-tertiary">₹132.50</div>
              </div>
              <div className="flex flex-col items-end">
                <span className="px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold">
                  Save ₹47.50 (26.4%)
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium mt-0.5">Shapley Fair-Fare Allocation</span>
              </div>
            </div>

            <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-tertiary text-[18px]">verified_user</span>
                <span className="font-semibold">Max Detour Guarantee:</span>
              </div>
              <span className="font-bold text-tertiary">≤ 15.0% (+2.4 mins max)</span>
            </div>
          </div>

          {/* Booking CTA */}
          <button
            onClick={() => setIsBooked(true)}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/95 text-on-primary font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">hail</span>
            <span>{isBooked ? 'Request Queued in Batch #101' : 'Request Pooled Ride'}</span>
          </button>

          {isBooked && (
            <div className="p-3 rounded-xl bg-tertiary-fixed/30 border border-tertiary/20 text-xs text-on-tertiary-container flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
              <span>Matched with <strong>Vehicle V-101</strong> • Assigned pickup in 4 mins</span>
            </div>
          )}
        </div>

        {/* Live Rider Detour Proof Badge */}
        {activeRider && (
          <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-soft border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-on-surface">Active Trip Verification</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-tertiary-fixed font-bold text-on-tertiary-fixed">
                Detour Compliant
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container">
                <span className="text-on-surface-variant block">Solo Travel Time</span>
                <span className="font-bold text-base text-on-surface">12.0 mins</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container">
                <span className="text-on-surface-variant block">Pooled Travel Time</span>
                <span className="font-bold text-base text-tertiary">13.0 mins (+8.3%)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Map View */}
      <div className="lg:col-span-7 h-[620px]">
        <LiveMap
          vehicles={vehicles}
          requests={requests}
          selectedVehicleId={snapshot?.selection?.selectedVehicleId || null}
          onSelectVehicle={onSelectVehicle}
          onSelectRequest={onSelectRequest}
        />
      </div>
    </div>
  );
};
