import React, { useState } from 'react';
import { DriverTripDetailDrawer, type TripDetailDrawerData } from '../../components/driver/DriverTripDetailDrawer';

export interface DriverTripRecord {
  id: string;
  hash: string;
  dateStr: string;
  dayMonth: string;
  timeStr: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  statusLabel: string;
  routeSummary: string;
  pickupLocation: string;
  dropoffLocation: string;
  passengerCount: number;
  netPayoutInr: number;
  grossFareInr: number;
  distanceKm: number;
  durationMin: number;
}

export const DEMO_TRIPS: DriverTripRecord[] = [
  {
    id: 'trip-1',
    hash: '#SRP-240619-0842',
    dateStr: 'Today · 10:08 AM',
    dayMonth: '19 JUN',
    timeStr: '10:08 AM',
    status: 'completed',
    statusLabel: 'Completed',
    routeSummary: 'MG Road Metro ➔ Koramangala ➔ Hinjewadi IT Park',
    pickupLocation: 'MG Road Metro Station',
    dropoffLocation: 'Hinjewadi Phase 1 IT Park',
    passengerCount: 2,
    netPayoutInr: 272,
    grossFareInr: 320,
    distanceKm: 11.2,
    durationMin: 38,
  },
  {
    id: 'trip-2',
    hash: '#SRP-240619-0715',
    dateStr: 'Today · 08:30 AM',
    dayMonth: '19 JUN',
    timeStr: '08:30 AM',
    status: 'completed',
    statusLabel: 'Completed',
    routeSummary: 'Shivajinagar ➔ Baner Road High Street',
    pickupLocation: 'Shivajinagar Bus Terminal',
    dropoffLocation: 'Baner Road High Street',
    passengerCount: 2,
    netPayoutInr: 215,
    grossFareInr: 254,
    distanceKm: 8.5,
    durationMin: 26,
  },
  {
    id: 'trip-3',
    hash: '#SRP-240619-0600',
    dateStr: 'Today · 07:15 AM',
    dayMonth: '19 JUN',
    timeStr: '07:15 AM',
    status: 'completed',
    statusLabel: 'Completed',
    routeSummary: 'Kothrud Stand ➔ Pune Railway Station',
    pickupLocation: 'Kothrud Stand',
    dropoffLocation: 'Pune Railway Station',
    passengerCount: 3,
    netPayoutInr: 380,
    grossFareInr: 448,
    distanceKm: 14.1,
    durationMin: 42,
  },
  {
    id: 'trip-4',
    hash: '#SRP-240619-1200',
    dateStr: 'Today · 12:30 PM (Scheduled)',
    dayMonth: '19 JUN',
    timeStr: '12:30 PM',
    status: 'upcoming',
    statusLabel: 'Driver Assigned',
    routeSummary: 'Viman Nagar ➔ Magarpatta Cybercity',
    pickupLocation: 'Phoenix Marketcity Viman Nagar',
    dropoffLocation: 'Tower 4 Magarpatta City',
    passengerCount: 2,
    netPayoutInr: 290,
    grossFareInr: 342,
    distanceKm: 9.8,
    durationMin: 30,
  },
  {
    id: 'trip-5',
    hash: '#SRP-240619-1430',
    dateStr: 'Today · 02:30 PM (Scheduled)',
    dayMonth: '19 JUN',
    timeStr: '02:30 PM',
    status: 'upcoming',
    statusLabel: 'Match Found',
    routeSummary: 'Kalyani Nagar ➔ Senapati Bapat Road',
    pickupLocation: 'Kalyani Nagar Joggers Park',
    dropoffLocation: 'ICC Trade Tower SB Road',
    passengerCount: 1,
    netPayoutInr: 180,
    grossFareInr: 212,
    distanceKm: 7.4,
    durationMin: 22,
  },
  {
    id: 'trip-6',
    hash: '#SRP-240618-1920',
    dateStr: 'Yesterday · 07:20 PM',
    dayMonth: '18 JUN',
    timeStr: '07:20 PM',
    status: 'cancelled',
    statusLabel: 'Passenger Cancelled',
    routeSummary: 'Aundh ➔ Hinjewadi Phase 3',
    pickupLocation: 'Bremen Chowk Aundh',
    dropoffLocation: 'Megapolis Circle Hinjewadi',
    passengerCount: 1,
    netPayoutInr: 45,
    grossFareInr: 50,
    distanceKm: 0.0,
    durationMin: 0,
  },
];

export const DriverTripsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('completed');
  const [selectedDrawerData, setSelectedDrawerData] = useState<TripDetailDrawerData | null>(null);

  const filteredTrips = DEMO_TRIPS.filter((t) => t.status === activeTab);

  const handleOpenTrip = (trip: DriverTripRecord) => {
    setSelectedDrawerData({
      tripId: trip.hash.replace('#', ''),
      date: trip.dateStr,
      routeSummary: trip.routeSummary,
      totalDistanceKm: trip.distanceKm,
      durationMin: trip.durationMin,
      grossFareInr: trip.grossFareInr,
      platformFeePct: 15,
      netDriverPayoutInr: trip.netPayoutInr,
      vehicleName: 'Tata Tigor EV (MH 12 QX 4092)',
      passengers: [
        {
          name: 'Rahul Sharma',
          partySize: 1,
          pickup: trip.pickupLocation,
          dropoff: trip.dropoffLocation,
          soloFareInr: Math.round(trip.grossFareInr * 0.7),
          shapleyFareInr: Math.round(trip.grossFareInr * 0.52),
          detourPct: 4.8,
          savingsPct: 25.7,
        },
        {
          name: 'Priya Mukherjee',
          partySize: 1,
          pickup: trip.pickupLocation,
          dropoff: trip.dropoffLocation,
          soloFareInr: Math.round(trip.grossFareInr * 0.65),
          shapleyFareInr: Math.round(trip.grossFareInr * 0.48),
          detourPct: 6.2,
          savingsPct: 26.1,
        },
      ],
      co2SavedKg: Math.max(0.6, Number((trip.distanceKm * 0.16).toFixed(1))),
    });
  };

  return (
    <div id="driver-trips-view" className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#efefef] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-black font-display tracking-tight">
              Rides & manifests
            </h2>
            <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#efefef] text-black">
              {DEMO_TRIPS.length} trips
            </span>
          </div>
          <p className="text-xs text-[#5e5e5e] mt-1">
            Historical pooled manifests, verified detour logs, and Shapley payout breakdown
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center bg-[#efefef] p-1 rounded-full">
          <button
            type="button"
            id="tab-upcoming-trips"
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'upcoming'
                ? 'bg-black text-white shadow-sm'
                : 'text-[#5e5e5e] hover:text-black'
            }`}
          >
            Upcoming ({DEMO_TRIPS.filter((t) => t.status === 'upcoming').length})
          </button>
          <button
            type="button"
            id="tab-completed-trips"
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'completed'
                ? 'bg-black text-white shadow-sm'
                : 'text-[#5e5e5e] hover:text-black'
            }`}
          >
            Completed ({DEMO_TRIPS.filter((t) => t.status === 'completed').length})
          </button>
          <button
            type="button"
            id="tab-cancelled-trips"
            onClick={() => setActiveTab('cancelled')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'cancelled'
                ? 'bg-black text-white shadow-sm'
                : 'text-[#5e5e5e] hover:text-black'
            }`}
          >
            Cancelled ({DEMO_TRIPS.filter((t) => t.status === 'cancelled').length})
          </button>
        </div>
      </div>

      {/* Trips Cards List */}
      <div className="space-y-4">
        {filteredTrips.map((trip) => {
          return (
            <div
              key={trip.id}
              className="bg-white rounded-2xl p-6 border border-[#efefef] shadow-card hover:shadow-card-elevated transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              {/* Left Column: Date & Status */}
              <div className="flex items-start gap-4">
                {/* Date Badge */}
                <div className="w-14 h-14 rounded-2xl bg-black text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#afafaf]">
                    {trip.dayMonth.split(' ')[1]}
                  </span>
                  <span className="text-base font-bold leading-none text-white font-display">
                    {trip.dayMonth.split(' ')[0]}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#5e5e5e]">
                      {trip.hash}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#efefef] text-black">
                      {trip.statusLabel}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-black mt-1 font-display">
                    {trip.routeSummary}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-[#5e5e5e] mt-1.5">
                    <span>{trip.dateStr}</span>
                    <span>•</span>
                    <span>Shared with {trip.passengerCount} passengers</span>
                    <span>•</span>
                    <span>{trip.distanceKm} km</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Earnings & Action */}
              <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 border-[#efefef]">
                <div className="text-left md:text-right">
                  <span className="text-[10px] uppercase font-medium text-[#5e5e5e] block tracking-wider">
                    Driver net payout
                  </span>
                  <span className="text-2xl font-bold font-display text-black tabular-nums">
                    ₹{trip.netPayoutInr}
                  </span>
                </div>

                <button
                  type="button"
                  id={`view-trip-${trip.id}`}
                  onClick={() => handleOpenTrip(trip)}
                  className="btn-uber-primary py-2.5 px-5 text-xs flex items-center gap-1.5"
                >
                  <span>View trip</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredTrips.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#efefef] text-[#5e5e5e] shadow-card">
            <span className="material-symbols-outlined text-4xl text-[#afafaf] mb-2">
              route
            </span>
            <p className="font-bold text-black font-display">No {activeTab} trips found</p>
            <p className="text-xs text-[#5e5e5e] mt-1">
              Switch tabs or complete a ride in the driver cockpit.
            </p>
          </div>
        )}
      </div>

      {/* Slide-Over Trip Details Drawer */}
      <DriverTripDetailDrawer
        isOpen={selectedDrawerData !== null}
        onClose={() => setSelectedDrawerData(null)}
        data={selectedDrawerData || undefined}
      />
    </div>
  );
};
