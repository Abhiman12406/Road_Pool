import React, { useState } from 'react';
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

  const { driverSeat, passengerSeats, occupiedCount, reservedCount, availableCount, totalCapacity } = cabinState;

  // Layout arrangement:
  // Row 1 (Front): [Driver Seat] [Front Passenger]
  // Row 2 (Rear):  [Rear Left]   [Rear Center]   [Rear Right]
  const frontPassenger = passengerSeats.find((s) => s.position === 'front_passenger') || passengerSeats[0];
  const rearLeft = passengerSeats.find((s) => s.position === 'rear_left') || passengerSeats[1];
  const rearMiddle = passengerSeats.find((s) => s.position === 'rear_middle') || passengerSeats[2];
  const rearRight = passengerSeats.find((s) => s.position === 'rear_right') || passengerSeats[3];

  const handleSeatClick = (seat: CabinSeat) => {
    setSelectedSeat(seat);
    if (onSelectSeat) onSelectSeat(seat);
  };

  const getSeatCardClasses = (seat: CabinSeat) => {
    if (seat.isDriver) {
      return 'bg-surface-container-high border-outline-variant/60 text-on-surface cursor-default';
    }
    switch (seat.status) {
      case 'onboard':
        return 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-teal-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-sm hover:ring-2 hover:ring-emerald-500/50 cursor-pointer';
      case 'reserved':
        return 'bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-yellow-500/15 border-amber-500 border-dashed text-amber-950 dark:text-amber-100 shadow-sm hover:ring-2 hover:ring-amber-500/50 cursor-pointer';
      case 'available':
      default:
        return 'bg-surface-container-low/70 border-outline-variant/40 border-dashed text-on-surface-variant hover:bg-surface-container hover:border-primary/40 cursor-pointer';
    }
  };

  const renderSeatIcon = (seat: CabinSeat) => {
    if (seat.isDriver) {
      return (
        <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[18px]">sports_motorsports</span>
        </div>
      );
    }
    if (seat.status === 'onboard') {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-[18px]">airline_seat_recline_normal</span>
        </div>
      );
    }
    if (seat.status === 'reserved') {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-[18px]">event_seat</span>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0 border border-outline-variant/30">
        <span className="material-symbols-outlined text-[18px] opacity-70">chair</span>
      </div>
    );
  };

  const renderSeatPill = (seat: CabinSeat) => {
    if (seat.isDriver) {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface shrink-0 whitespace-nowrap">
          Pilot
        </span>
      );
    }
    if (seat.status === 'onboard') {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          Onboard
        </span>
      );
    }
    if (seat.status === 'reserved') {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
          Reserved
        </span>
      );
    }
    return (
      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant/30 shrink-0 whitespace-nowrap">
        Available
      </span>
    );
  };

  const renderSeatContent = (seat: CabinSeat) => {
    return (
      <button
        key={seat.seatId}
        type="button"
        onClick={() => handleSeatClick(seat)}
        className={`p-2.5 sm:p-3 rounded-2xl border transition-all text-left flex flex-col justify-between min-h-[104px] overflow-hidden w-full min-w-0 relative ${getSeatCardClasses(
          seat
        )}`}
      >
        {/* Top Header: Icon on Left, Compact Status Pill on Right */}
        <div className="flex items-center justify-between w-full min-w-0 gap-1.5">
          {renderSeatIcon(seat)}
          {renderSeatPill(seat)}
        </div>

        {/* Middle Details: Full-width Passenger Name & Seat Position */}
        <div className="min-w-0 w-full mt-1.5">
          <span
            className="text-[11px] font-bold text-on-surface truncate block"
            title={seat.passengerName || seat.seatLabel}
          >
            {seat.passengerName || seat.seatLabel}
          </span>
          <span className="text-[10px] text-on-surface-variant font-medium truncate block">
            {seat.seatLabel}
          </span>
        </div>

        {/* Bottom Route & Fare Sub-bar */}
        <div className="mt-2 pt-1.5 border-t border-outline-variant/20 flex items-center justify-between text-[10px] w-full min-w-0 gap-1">
          {seat.isDriver ? (
            <span className="text-on-surface-variant italic truncate">Standard Driving Seat</span>
          ) : seat.status === 'onboard' ? (
            <>
              <span
                className="font-semibold text-emerald-800 dark:text-emerald-200 truncate min-w-0 flex-1"
                title={seat.dropoffName || 'Destination'}
              >
                To: {seat.dropoffName || 'Destination'}
              </span>
              <span className="font-extrabold text-emerald-800 dark:text-emerald-200 shrink-0 tabular-nums">
                ₹{seat.shapleyFareInr?.toFixed(2) || '0.00'}
              </span>
            </>
          ) : seat.status === 'reserved' ? (
            <>
              <span
                className="font-semibold text-amber-800 dark:text-amber-200 truncate min-w-0 flex-1"
                title={seat.pickupName || 'Pickup Point'}
              >
                From: {seat.pickupName || 'Pickup Point'}
              </span>
              <span className="font-extrabold text-amber-800 dark:text-amber-200 shrink-0 tabular-nums">
                ₹{seat.shapleyFareInr?.toFixed(2) || '0.00'}
              </span>
            </>
          ) : (
            <span className="text-primary font-semibold flex items-center gap-1 truncate text-[10px]">
              <span className="material-symbols-outlined text-[13px] shrink-0">add_circle</span>
              <span className="truncate">Open for Pool</span>
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-5 border border-outline-variant/30 shadow-card flex flex-col gap-4 overflow-hidden">
      {/* Top Occupancy Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[20px]">airline_seat_recline_extra</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-on-surface tracking-tight truncate">
              4-Seat Cabin Occupancy Grid
            </h2>
            <span className="text-[11px] text-on-surface-variant font-medium truncate block">
              Vehicle {vehicleId} • {vehicleName}
            </span>
          </div>
        </div>

        {/* Status Count Badges */}
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <div className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-1 shrink-0 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span>{occupiedCount} Onboard</span>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 font-bold flex items-center gap-1 shrink-0 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
            <span>{reservedCount} Reserved</span>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-semibold border border-outline-variant/30 flex items-center gap-1 shrink-0 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-outline shrink-0"></span>
            <span>{availableCount} Free</span>
          </div>
        </div>
      </div>

      {/* Visual Car Cabin Enclosure */}
      <div className="relative bg-surface-container-low/60 p-4 sm:p-5 rounded-2xl border border-outline-variant/40 flex flex-col gap-3">
        {/* Car Windshield Header */}
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pb-1">
          <span className="h-px bg-outline-variant/50 flex-1"></span>
          <span>▲ Windshield & Vehicle Front ▲</span>
          <span className="h-px bg-outline-variant/50 flex-1"></span>
        </div>

        {/* Row 1: Driver + Front Passenger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {renderSeatContent(driverSeat)}
          {renderSeatContent(frontPassenger)}
        </div>

        {/* Center Aisle Indicator */}
        <div className="flex items-center justify-center py-0.5">
          <span className="text-[9px] text-on-surface-variant/80 font-bold tracking-wider uppercase">
            — Cabin Passenger Row —
          </span>
        </div>

        {/* Row 2: Rear 3 Passenger Seats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2">
          {renderSeatContent(rearLeft)}
          {renderSeatContent(rearMiddle)}
          {renderSeatContent(rearRight)}
        </div>

        {/* Car Trunk Footer */}
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pt-1">
          <span className="h-px bg-outline-variant/50 flex-1"></span>
          <span>▼ Luggage Trunk & Rear ▼</span>
          <span className="h-px bg-outline-variant/50 flex-1"></span>
        </div>
      </div>

      {/* Dynamic Cabin Capacity Progress Bar */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-on-surface">Seat Utilization</span>
          <span className="text-primary font-extrabold">
            {occupiedCount + reservedCount} / {totalCapacity} Seats Filled ({Math.round(((occupiedCount + reservedCount) / totalCapacity) * 100)}%)
          </span>
        </div>
        <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden flex shadow-inner">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${(occupiedCount / totalCapacity) * 100}%` }}
            title={`${occupiedCount} seats onboard`}
          ></div>
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${(reservedCount / totalCapacity) * 100}%` }}
            title={`${reservedCount} seats reserved`}
          ></div>
          <div
            className="h-full bg-surface-container-high transition-all duration-500"
            style={{ width: `${(availableCount / totalCapacity) * 100}%` }}
            title={`${availableCount} seats available`}
          ></div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
          <span>● Solid Green = Onboard</span>
          <span>● Striped Amber = Reserved</span>
          <span>○ Gray = Available for Match</span>
        </div>
      </div>

      {/* Interactive Seat Modal / Inspector if seat is clicked */}
      {selectedSeat && (
        <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/30 flex flex-col gap-2.5 animate-fade-in text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">info</span>
              <span className="font-bold text-on-surface">
                {selectedSeat.seatLabel} Details
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSeat(null)}
              className="text-on-surface-variant hover:text-on-surface text-[11px] font-bold"
            >
              ✕ Close
            </button>
          </div>

          {selectedSeat.isDriver ? (
            <div className="text-[11px] text-on-surface-variant">
              Pilot: <strong>Kailash Deshmukh</strong> • 4.92 ★ (1,420 trips) • Commercial EV certified.
            </div>
          ) : selectedSeat.status === 'available' ? (
            <div className="text-[11px] text-on-surface-variant">
              This seat is currently unassigned and available for incoming ride requests along this corridor.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-on-surface-variant block">Passenger:</span>
                <span className="font-bold text-on-surface">{selectedSeat.passengerName}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Status:</span>
                <span className="font-bold capitalize text-primary">{selectedSeat.status}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Pickup:</span>
                <span className="font-medium text-on-surface">{selectedSeat.pickupName || '—'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Destination:</span>
                <span className="font-medium text-on-surface">{selectedSeat.dropoffName || '—'}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Shapley Fare:</span>
                <span className="font-extrabold text-tertiary">
                  ₹{selectedSeat.shapleyFareInr?.toFixed(2) || '—'}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Detour Guarantee:</span>
                <span className="font-bold text-secondary">
                  +{selectedSeat.detourPct?.toFixed(1) || '0.0'}% (Cap ≤15%)
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
