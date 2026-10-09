import React, { useState, useEffect } from 'react';

export interface TripOfferDetails {
  offerId: string;
  payoutInr: number;
  totalDistanceKm: number;
  estimatedDurationMin: number;
  seatsOccupied: number;
  totalSeats: number;
  pickups: Array<{ name: string; passengerName: string; landmark?: string }>;
  dropoffs: Array<{ name: string; passengerName: string; landmark?: string }>;
  detourValidations: Array<{ passengerName: string; detourPct: number }>;
}

export const DEFAULT_DEMO_OFFER: TripOfferDetails = {
  offerId: 'OFFER-PUNE-POOL-842',
  payoutInr: 320,
  totalDistanceKm: 11.2,
  estimatedDurationMin: 38,
  seatsOccupied: 2,
  totalSeats: 4,
  pickups: [
    { name: 'MG Road Metro Station', passengerName: 'Rahul S.', landmark: 'Gate 2 Pick-up Bay' },
    { name: 'Shivajinagar Bus Terminal', passengerName: 'Priya M.', landmark: 'Platform 4 Curb' },
  ],
  dropoffs: [
    { name: 'Baner Road High Street', passengerName: 'Rahul S.', landmark: 'Opposite Westend Mall' },
    { name: 'Hinjewadi Phase 1 IT Park', passengerName: 'Priya M.', landmark: 'Infosys Circle Gate 1' },
  ],
  detourValidations: [
    { passengerName: 'Rahul S.', detourPct: 4.2 },
    { passengerName: 'Priya M.', detourPct: 6.8 },
  ],
};

interface DriverTripOfferCardProps {
  offer?: TripOfferDetails;
  onAccept: () => void;
  onDecline: () => void;
  initialSeconds?: number;
}

export const DriverTripOfferCard: React.FC<DriverTripOfferCardProps> = ({
  offer = DEFAULT_DEMO_OFFER,
  onAccept,
  onDecline,
  initialSeconds = 24,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);

  useEffect(() => {
    setSecondsRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      onDecline();
      return;
    }
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining, onDecline]);

  const progressPct = (secondsRemaining / initialSeconds) * 100;

  return (
    <div
      id="driver-trip-offer-card"
      className="bg-white rounded-2xl border border-[#efefef] shadow-card-elevated overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
    >
      {/* Top Header with Pulsing Badge & Countdown */}
      <div className="bg-black text-white p-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shrink-0" />
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white tracking-tight font-display truncate">
              New trip offer
            </h3>
            <span className="text-xs text-[#afafaf] truncate block">
              Pooled efficiency corridor
            </span>
          </div>
        </div>

        {/* Animated Countdown Timer */}
        <div className="flex items-center gap-2 bg-[#282828] px-3.5 py-1.5 rounded-full shrink-0">
          <span className="material-symbols-outlined text-[16px] text-white shrink-0">
            timer
          </span>
          <span className="text-xs font-mono font-medium text-white whitespace-nowrap">
            {secondsRemaining}s remaining
          </span>
        </div>
      </div>

      {/* Timer Progress Bar */}
      <div className="w-full bg-[#e5e5e5] h-1.5 overflow-hidden">
        <div
          className="bg-black h-full transition-all duration-1000 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Main Content Area */}
      <div className="p-5 space-y-4 text-xs">
        {/* Payout & Core Metrics Strip: Spacious 2-Tier Uber Layout */}
        <div className="p-4 rounded-2xl bg-[#f6f6f6] border border-[#e8e8e8] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-wider block">
                Driver net payout
              </span>
              <div className="text-3xl font-extrabold font-display text-black tabular-nums tracking-tight mt-0.5">
                ₹{offer.payoutInr.toFixed(2)}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-block text-xs font-medium text-[#404040] bg-white px-3 py-1 rounded-full border border-[#dedede] shadow-2xs whitespace-nowrap">
                2 pooled fares
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-[#e5e5e5] text-center">
            <div className="bg-white rounded-xl py-2 px-1 border border-[#efefef]">
              <span className="text-[10px] font-medium text-[#6b6b6b] uppercase tracking-wider block">Distance</span>
              <span className="text-sm font-bold text-black tabular-nums mt-0.5 block">{offer.totalDistanceKm} km</span>
            </div>
            <div className="bg-white rounded-xl py-2 px-1 border border-[#efefef]">
              <span className="text-[10px] font-medium text-[#6b6b6b] uppercase tracking-wider block">Duration</span>
              <span className="text-sm font-bold text-black tabular-nums mt-0.5 block">{offer.estimatedDurationMin} min</span>
            </div>
            <div className="bg-white rounded-xl py-2 px-1 border border-[#efefef]">
              <span className="text-[10px] font-medium text-[#6b6b6b] uppercase tracking-wider block">Seats</span>
              <span className="text-sm font-bold text-black tabular-nums mt-0.5 block">{offer.seatsOccupied} / {offer.totalSeats}</span>
            </div>
          </div>
        </div>

        {/* 15% Detour Guarantee Banner */}
        <div className="p-4 rounded-xl bg-black text-white flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#282828] text-white flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                15% maximum detour guarantee compliant
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#282828] text-white font-medium">
                OR-TOOLS VERIFIED
              </span>
            </div>
            <p className="text-xs text-[#afafaf] mt-1 leading-relaxed">
              Route validated: Both passengers remain strictly within the 15% detour limit.
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {offer.detourValidations.map((v, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-[#282828] text-white px-2.5 py-1 rounded-full"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  {v.passengerName}: +{v.detourPct}% detour (≤15%)
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Route Stop Sequence Itinerary */}
        <div className="p-4 rounded-xl bg-[#f3f3f3] space-y-3">
          <span className="text-[11px] font-medium text-[#5e5e5e] uppercase tracking-wider block">
            Pickup & dropoff manifest
          </span>

          <div className="space-y-3">
            {/* Pickups */}
            {offer.pickups.map((p, idx) => (
              <div key={`pickup-${idx}`} className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  P{idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black text-xs">{p.name}</span>
                    <span className="text-[11px] font-medium text-[#5e5e5e] bg-white px-2 py-0.5 rounded-full">
                      Pick up {p.passengerName}
                    </span>
                  </div>
                  {p.landmark && (
                    <span className="text-[11px] text-[#5e5e5e] block mt-0.5">{p.landmark}</span>
                  )}
                </div>
              </div>
            ))}

            <div className="border-l-2 border-dashed border-[#afafaf] ml-3 h-2 my-1"></div>

            {/* Dropoffs */}
            {offer.dropoffs.map((d, idx) => (
              <div key={`dropoff-${idx}`} className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  D{idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black text-xs">{d.name}</span>
                    <span className="text-[11px] font-medium text-[#5e5e5e] bg-white px-2 py-0.5 rounded-full">
                      Drop off {d.passengerName}
                    </span>
                  </div>
                  {d.landmark && (
                    <span className="text-[11px] text-[#5e5e5e] block mt-0.5">{d.landmark}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Controls: Decline / Accept */}
      <div className="p-5 pt-0 grid grid-cols-2 gap-3 mt-auto">
        <button
          type="button"
          id="driver-decline-offer-btn"
          onClick={onDecline}
          className="btn-uber-subtle w-full flex items-center justify-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
          <span>Decline</span>
        </button>

        <button
          type="button"
          id="driver-accept-offer-btn"
          onClick={onAccept}
          className="btn-uber-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>Accept trip</span>
        </button>
      </div>
    </div>
  );
};
