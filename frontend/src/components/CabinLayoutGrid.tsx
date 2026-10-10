import React, { useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '../lib/gsap';
import type { CabinLayoutState, CabinSeat } from '../services/cabinOccupancyService';

interface CabinLayoutGridProps {
  cabinState: CabinLayoutState;
  vehicleName: string;
  vehicleId: string;
  onSelectSeat?: (seat: CabinSeat) => void;
}

export const CabinLayoutGrid: React.FC<CabinLayoutGridProps> = ({
  cabinState,
  vehicleName,
  vehicleId,
  onSelectSeat,
}) => {
  const [selectedSeat, setSelectedSeat] = useState<CabinSeat | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const {
    driverSeat,
    passengerSeats,
    occupiedCount,
    reservedCount,
    availableCount,
    totalCapacity,
  } = cabinState;

  // Safe animation with clearProps to avoid stuck opacity or partial render glitches
  useGSAP(
    () => {
      gsap.fromTo(
        '.cabin-seat-card',
        { opacity: 0, y: 10, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.3,
          stagger: 0.05,
          ease: 'power2.out',
          clearProps: 'all',
        }
      );
    },
    { dependencies: [occupiedCount, reservedCount, vehicleId], scope: gridRef }
  );

  const frontPassenger =
    passengerSeats.find((s) => s.position === 'front_passenger') || passengerSeats[0];
  const rearLeft =
    passengerSeats.find((s) => s.position === 'rear_left') || passengerSeats[1];
  const rearMiddle =
    passengerSeats.find((s) => s.position === 'rear_middle') || passengerSeats[2];
  const rearRight =
    passengerSeats.find((s) => s.position === 'rear_right') || passengerSeats[3];

  const handleSeatClick = (seat: CabinSeat) => {
    setSelectedSeat(seat);
    if (onSelectSeat) onSelectSeat(seat);
  };

  // Modern high-contrast color scheme for bucket seats
  const getSeatCardClasses = (seat: CabinSeat, isSelected: boolean) => {
    const selectedRing = isSelected ? 'ring-2 ring-black shadow-md' : '';

    if (seat.isDriver) {
      return `bg-zinc-100 border-zinc-300 text-zinc-900 cursor-default ${selectedRing}`;
    }

    switch (seat.status) {
      case 'onboard':
        return `bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-sm hover:border-emerald-500 hover:shadow-md cursor-pointer ${selectedRing}`;
      case 'reserved':
        return `bg-amber-50/90 border-amber-300 text-amber-950 shadow-sm hover:border-amber-500 hover:shadow-md cursor-pointer ${selectedRing}`;
      case 'available':
      default:
        return `bg-white border-zinc-200 text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50/80 hover:shadow-sm cursor-pointer ${selectedRing}`;
    }
  };

  const renderSeatIcon = (seat: CabinSeat) => {
    if (seat.isDriver) {
      return (
        <div className="w-8 h-8 rounded-xl bg-zinc-800 text-white flex items-center justify-center shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-[18px]">sports_motorsports</span>
        </div>
      );
    }
    if (seat.status === 'onboard') {
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-[18px]">airline_seat_recline_normal</span>
        </div>
      );
    }
    if (seat.status === 'reserved') {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-[18px]">event_seat</span>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0 border border-zinc-200">
        <span className="material-symbols-outlined text-[18px]">chair</span>
      </div>
    );
  };

  const renderSeatPill = (seat: CabinSeat) => {
    if (seat.isDriver) {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-white shrink-0 whitespace-nowrap">
          Pilot
        </span>
      );
    }
    if (seat.status === 'onboard') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
          Onboard
        </span>
      );
    }
    if (seat.status === 'reserved') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shrink-0 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
          Reserved
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-300 shrink-0 whitespace-nowrap">
        Available
      </span>
    );
  };

  const getSeatDisplayNames = (seat: CabinSeat) => {
    if (seat.isDriver) {
      return {
        title: seat.passengerName ? seat.passengerName.replace(/\s*\(.*?\)/, '') : 'Kailash Deshmukh',
        sub: 'Verified EV Pilot',
      };
    }
    if (seat.passengerName) {
      return {
        title: seat.passengerName.replace(/\s*\(.*?\)/, ''),
        sub:
          seat.position === 'rear_left'
            ? 'Rear Left Window'
            : seat.position === 'rear_right'
            ? 'Rear Right Window'
            : seat.position === 'rear_middle'
            ? 'Rear Center'
            : 'Front Co-Passenger',
      };
    }
    switch (seat.position) {
      case 'front_passenger':
        return { title: 'Front Seat', sub: 'Co-Passenger' };
      case 'rear_left':
        return { title: 'Rear Left', sub: 'Window Seat' };
      case 'rear_middle':
        return { title: 'Rear Center', sub: 'Middle Seat' };
      case 'rear_right':
        return { title: 'Rear Right', sub: 'Window Seat' };
      default:
        return { title: seat.seatLabel, sub: 'Passenger' };
    }
  };

  const renderSeatCard = (seat: CabinSeat) => {
    const isSelected = selectedSeat?.seatId === seat.seatId;
    const names = getSeatDisplayNames(seat);

    return (
      <div key={seat.seatId} className="flex flex-col items-center w-full min-w-0">
        {/* Contoured Ergonomic Headrest Pillow */}
        <div
          className={`w-11 h-2.5 rounded-full mb-1 transition-colors border ${
            seat.isDriver
              ? 'bg-zinc-300 border-zinc-400'
              : seat.status === 'onboard'
              ? 'bg-emerald-300 border-emerald-400'
              : seat.status === 'reserved'
              ? 'bg-amber-300 border-amber-400'
              : 'bg-zinc-200 border-zinc-300'
          }`}
          title={`${names.title} Headrest`}
        />

        {/* Main Seat Bucket Cushion */}
        <button
          type="button"
          onClick={() => handleSeatClick(seat)}
          className={`cabin-seat-card p-3 rounded-2xl border transition-all text-left flex flex-col justify-between min-h-[116px] w-full min-w-0 relative ${getSeatCardClasses(
            seat,
            isSelected
          )}`}
        >
          {/* Header Row: Icon & Status Badge */}
          <div className="flex items-center justify-between w-full min-w-0 gap-1.5 pb-1">
            {renderSeatIcon(seat)}
            {renderSeatPill(seat)}
          </div>

          {/* Middle Row: Name & Position */}
          <div className="min-w-0 w-full mt-1">
            <span
              className="text-xs font-bold text-zinc-950 truncate block tracking-tight"
              title={names.title}
            >
              {names.title}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium truncate block mt-0.5">
              {names.sub}
            </span>
          </div>

          {/* Bottom Row: Trip Telemetry or Pool Invitation */}
          <div className="mt-2 pt-1.5 border-t border-black/10 flex items-center justify-between text-[11px] w-full min-w-0 gap-1">
            {seat.isDriver ? (
              <span className="text-zinc-600 font-medium truncate text-[10px]">
                Standard Driving Seat
              </span>
            ) : seat.status === 'onboard' ? (
              <>
                <span
                  className="font-semibold text-emerald-900 truncate min-w-0 flex-1 text-[10px]"
                  title={seat.dropoffName || 'Destination'}
                >
                  To: {seat.dropoffName || 'Destination'}
                </span>
                <span className="font-extrabold text-emerald-800 shrink-0 font-mono text-[11px]">
                  ₹{seat.shapleyFareInr?.toFixed(2) || '0.00'}
                </span>
              </>
            ) : seat.status === 'reserved' ? (
              <>
                <span
                  className="font-semibold text-amber-900 truncate min-w-0 flex-1 text-[10px]"
                  title={seat.pickupName || 'Pickup Point'}
                >
                  From: {seat.pickupName || 'Pickup'}
                </span>
                <span className="font-extrabold text-amber-800 shrink-0 font-mono text-[11px]">
                  ₹{seat.shapleyFareInr?.toFixed(2) || '0.00'}
                </span>
              </>
            ) : (
              <span className="text-black font-semibold flex items-center gap-1 truncate text-[10px]">
                <span className="material-symbols-outlined text-[14px] text-emerald-600 shrink-0">
                  add_circle
                </span>
                <span className="truncate">Open for Pool</span>
              </span>
            )}
          </div>
        </button>
      </div>
    );
  };

  const filledCount = occupiedCount + reservedCount;
  const utilizationPct = Math.round((filledCount / totalCapacity) * 100);

  return (
    <div
      ref={gridRef}
      className="bg-white rounded-2xl p-5 border border-[#efefef] shadow-card flex flex-col gap-4 overflow-hidden"
    >
      {/* Top Header & Telemetry Status Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#efefef]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[20px]">
              airline_seat_recline_extra
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-zinc-950 tracking-tight">
              Cabin Occupancy & Seat Layout
            </h2>
            <span className="text-xs text-zinc-500 font-medium truncate block">
              Vehicle {vehicleId} • {vehicleName} (4-Seat EV)
            </span>
          </div>
        </div>

        {/* Status Count Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1.5 shrink-0 text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{occupiedCount} Onboard</span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold flex items-center gap-1.5 shrink-0 text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>{reservedCount} Reserved</span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 font-semibold border border-zinc-200 flex items-center gap-1.5 shrink-0 text-xs">
            <span className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
            <span>{availableCount} Available</span>
          </div>
        </div>
      </div>

      {/* Realistic Automotive Cabin Interior Visualization */}
      <div className="relative bg-gradient-to-b from-zinc-50 via-zinc-100/50 to-zinc-50 p-4 sm:p-5 rounded-2xl border border-zinc-200/90 flex flex-col gap-3 shadow-inner">
        {/* Curved Front Windshield & Visor Header */}
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest pb-1">
          <span className="h-px bg-zinc-200 flex-1" />
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-zinc-200 shadow-2xs">
            <span className="material-symbols-outlined text-[13px] text-zinc-400">
              navigation
            </span>
            <span>▲ Front Windshield & Dashboard ▲</span>
          </div>
          <span className="h-px bg-zinc-200 flex-1" />
        </div>

        {/* Row 1: Front Pilot + Front Passenger + Center Console */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative">
          {renderSeatCard(driverSeat)}
          {renderSeatCard(frontPassenger)}
        </div>

        {/* Cabin Aisle Separator */}
        <div className="flex items-center justify-center py-1">
          <span className="h-px bg-zinc-200/80 flex-1" />
          <span className="text-[10px] text-zinc-500 font-semibold px-3 uppercase tracking-wider">
            — Cabin Passenger Row —
          </span>
          <span className="h-px bg-zinc-200/80 flex-1" />
        </div>

        {/* Row 2: Rear 3 Passenger Seats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {renderSeatCard(rearLeft)}
          {renderSeatCard(rearMiddle)}
          {renderSeatCard(rearRight)}
        </div>

        {/* Luggage Trunk Footer */}
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest pt-1">
          <span className="h-px bg-zinc-200 flex-1" />
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-zinc-200 shadow-2xs">
            <span className="material-symbols-outlined text-[13px] text-zinc-400">
              luggage
            </span>
            <span>▼ Rear Luggage Trunk & Boot ▼</span>
          </div>
          <span className="h-px bg-zinc-200 flex-1" />
        </div>
      </div>

      {/* Segmented Cabin Capacity Battery-Style Progress Meter */}
      <div className="flex flex-col gap-2 pt-1 bg-zinc-50/80 p-3.5 rounded-xl border border-zinc-200">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-zinc-900 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-zinc-600">
              airline_seat_recline_normal
            </span>
            <span>Seat Utilization</span>
          </span>
          <span className="font-mono text-xs font-extrabold text-black">
            {filledCount} / {totalCapacity} Seats Filled ({utilizationPct}%)
          </span>
        </div>

        {/* 4-Segment Discrete Visual Gauge */}
        <div className="grid grid-cols-4 gap-1.5 h-3">
          {passengerSeats.map((seat, idx) => {
            let bgClass = 'bg-zinc-200 border-zinc-300';
            if (seat.status === 'onboard') {
              bgClass = 'bg-emerald-500 border-emerald-600 shadow-sm';
            } else if (seat.status === 'reserved') {
              bgClass = 'bg-amber-500 border-amber-600 shadow-sm';
            }
            return (
              <div
                key={seat.seatId}
                className={`h-full rounded-md border transition-all duration-300 ${bgClass}`}
                title={`Seat ${idx + 1} (${seat.seatLabel}): ${seat.status}`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] text-zinc-600 flex-wrap gap-2 pt-0.5">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Solid Green = Onboard</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Striped Amber = Reserved</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-200 border border-zinc-300" />
            <span>Gray = Open for Match</span>
          </span>
        </div>
      </div>

      {/* Interactive Seat Inspection Card */}
      {selectedSeat && (
        <div className="p-4 rounded-xl bg-zinc-900 text-white flex flex-col gap-3 animate-in fade-in duration-200 text-xs shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 text-emerald-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">info</span>
              </div>
              <div>
                <span className="font-bold text-white text-xs block">
                  {selectedSeat.seatLabel}
                </span>
                <span className="text-[10px] text-zinc-400">
                  {selectedSeat.isDriver
                    ? 'Vehicle Pilot'
                    : selectedSeat.status === 'available'
                    ? 'Available for Pool'
                    : `Assigned Passenger: ${selectedSeat.passengerName || 'Active Commuter'}`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSeat(null)}
              className="text-zinc-400 hover:text-white text-xs font-bold px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
            >
              ✕ Close
            </button>
          </div>

          {selectedSeat.isDriver ? (
            <div className="text-xs text-zinc-300 leading-relaxed">
              Pilot: <strong className="text-white">Kailash Deshmukh</strong> • Verified Commercial EV Pilot (Rating: 4.92 ★, 1,420 trips completed).
            </div>
          ) : selectedSeat.status === 'available' ? (
            <div className="text-xs text-zinc-300 leading-relaxed flex items-center justify-between">
              <span>This seat is open for incoming ride requests along this corridor. Co-riders save up to 41% with Shapley cooperative pooling.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-zinc-800/60 p-2 rounded-lg">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                  Passenger
                </span>
                <span className="font-bold text-white mt-0.5 block truncate">
                  {selectedSeat.passengerName}
                </span>
              </div>
              <div className="bg-zinc-800/60 p-2 rounded-lg">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                  Status
                </span>
                <span className="font-bold capitalize text-emerald-400 mt-0.5 block">
                  {selectedSeat.status}
                </span>
              </div>
              <div className="bg-zinc-800/60 p-2 rounded-lg">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                  Pickup Point
                </span>
                <span className="font-medium text-zinc-200 mt-0.5 block truncate">
                  {selectedSeat.pickupName || 'Origin Hub'}
                </span>
              </div>
              <div className="bg-zinc-800/60 p-2 rounded-lg">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                  Destination
                </span>
                <span className="font-medium text-zinc-200 mt-0.5 block truncate">
                  {selectedSeat.dropoffName || 'Drop-off'}
                </span>
              </div>
              <div className="bg-zinc-800/60 p-2 rounded-lg">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                  Shapley Fair Fare
                </span>
                <span className="font-extrabold text-emerald-300 font-mono mt-0.5 block">
                  ₹{selectedSeat.shapleyFareInr?.toFixed(2) || '—'}
                </span>
              </div>
              <div className="bg-zinc-800/60 p-2 rounded-lg">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                  Detour Compliance
                </span>
                <span className="font-bold text-amber-300 mt-0.5 block">
                  +{selectedSeat.detourPct?.toFixed(1) || '8.3'}% (Cap ≤15%)
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
