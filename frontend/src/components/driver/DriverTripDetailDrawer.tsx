import React from 'react';

export interface TripDetailDrawerData {
  tripId: string;
  date: string;
  routeSummary: string;
  totalDistanceKm: number;
  durationMin: number;
  grossFareInr: number;
  platformFeePct: number;
  netDriverPayoutInr: number;
  vehicleName: string;
  passengers: Array<{
    name: string;
    partySize: number;
    pickup: string;
    dropoff: string;
    soloFareInr: number;
    shapleyFareInr: number;
    detourPct: number;
    savingsPct: number;
  }>;
  co2SavedKg: number;
}

export const DEFAULT_TRIP_DETAIL: TripDetailDrawerData = {
  tripId: 'SRP-240619-0842',
  date: 'Today · 10:08 AM',
  routeSummary: 'MG Road Metro ➔ Koramangala ➔ Hinjewadi IT Park',
  totalDistanceKm: 11.2,
  durationMin: 38,
  grossFareInr: 320,
  platformFeePct: 15,
  netDriverPayoutInr: 272,
  vehicleName: 'Tata Tigor EV (MH 12 QX 4092)',
  passengers: [
    {
      name: 'Rahul Sharma',
      partySize: 1,
      pickup: 'MG Road Metro Station',
      dropoff: 'Baner Road High Street',
      soloFareInr: 228,
      shapleyFareInr: 168,
      detourPct: 4.2,
      savingsPct: 26.3,
    },
    {
      name: 'Priya Mukherjee',
      partySize: 1,
      pickup: 'Shivajinagar Bus Terminal',
      dropoff: 'Hinjewadi Phase 1 IT Park',
      soloFareInr: 204,
      shapleyFareInr: 152,
      detourPct: 6.8,
      savingsPct: 25.5,
    },
  ],
  co2SavedKg: 1.8,
};

interface DriverTripDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data?: TripDetailDrawerData;
}

export const DriverTripDetailDrawer: React.FC<DriverTripDetailDrawerProps> = ({
  isOpen,
  onClose,
  data = DEFAULT_TRIP_DETAIL,
}) => {
  if (!isOpen) return null;

  const platformFeeInr = (data.grossFareInr * data.platformFeePct) / 100;

  return (
    <div
      id="driver-trip-detail-drawer"
      className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm animate-fade-in flex justify-end"
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-manifest-drawer-title"
      >
        {/* Drawer Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-400">
                #{data.tripId}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                COMPLETED
              </span>
            </div>
            <h3 id="trip-manifest-drawer-title" className="text-sm font-extrabold text-white mt-1">
              Trip Manifest & Payout Details
            </h3>
            <span className="text-[11px] text-slate-400">{data.date}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Net Driver Payout Hero Card */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Driver Earnings Summary
            </span>

            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-600 font-medium">Gross Passenger Pool Fare</span>
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                ₹{data.grossFareInr.toFixed(2)}
              </span>
            </div>

            <div className="flex items-baseline justify-between text-slate-500">
              <span>Platform Service Commission ({data.platformFeePct}%)</span>
              <span className="text-xs font-bold text-red-600 tabular-nums">
                -₹{platformFeeInr.toFixed(2)}
              </span>
            </div>

            <div className="pt-2 border-t border-emerald-200/80 flex items-baseline justify-between">
              <span className="text-xs font-extrabold text-emerald-950">Net Take-Home Payout</span>
              <span className="text-xl font-black text-emerald-700 tabular-nums">
                ₹{data.netDriverPayoutInr.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Passenger Breakdown (Shapley Value Fair Shares) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Passenger Co-Riders ({data.passengers.length})
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Shapley Fair Fares Applied
              </span>
            </div>

            {data.passengers.map((p, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
                      {p.name.slice(0, 1)}
                    </div>
                    <span className="font-extrabold text-slate-900 text-xs">
                      {p.name}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                    ₹{p.shapleyFareInr.toFixed(2)}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
                    <span className="truncate">From: {p.pickup}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="truncate">To: {p.dropoff}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>Solo direct fare: ₹{p.soloFareInr}</span>
                  <span className="text-emerald-700 font-bold">
                    Saved {p.savingsPct}% • +{p.detourPct}% detour
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Environmental & Route Impact */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-emerald-400">eco</span>
                Clean EV Corridor Impact
              </span>
              <span className="text-[10px] font-mono text-emerald-300 font-bold">
                {data.co2SavedKg} kg CO₂ saved
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              By combining 2 solo trips into this 1 Tata Tigor EV run, you avoided 13.6 km of redundant urban driving in Pune.
            </p>
          </div>
        </div>

        {/* Drawer Bottom Action */}
        <div className="p-5 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Close Receipt Details
          </button>
        </div>
      </div>
    </div>
  );
};
