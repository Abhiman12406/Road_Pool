import React, { useState } from 'react';
import type { GlobalSimulationSnapshot } from '../../types/simulation';

interface BatchManagerViewProps {
  snapshot: GlobalSimulationSnapshot | null;
  onDispatchNow: () => void;
  onConfigureBatch: (windowSec?: number, threshold?: number) => void;
  onGenerateDemand: (count: number) => void;
  onSelectRequest: (id: string) => void;
  onSelectVehicle: (id: string) => void;
}

export const BatchManagerView: React.FC<BatchManagerViewProps> = ({
  snapshot,
  onDispatchNow,
  onConfigureBatch,
  onGenerateDemand,
  onSelectRequest,
  onSelectVehicle,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'current' | 'admitted'>('current');
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [selectedThreshold, setSelectedThreshold] = useState<number>(6);

  const engine = snapshot?.engine;
  const requests = Object.values(snapshot?.requests || {});
  const vehicles = Object.values(snapshot?.vehicles || {});

  const currentWindowId = engine?.currentWindowId || 101;
  const timeRemaining = engine?.timeRemainingInWindowSec ?? 30;
  const totalWindowSec = engine?.windowIntervalSec ?? 30;
  const threshold = engine?.batchThreshold ?? 6;
  const batchStatus = engine?.batchStatus ?? 'intake_open';

  // Requests in current window
  const currentBatchRequests = requests.filter(
    (r) => r.status === 'waiting_batch' && (r.batch_id === currentWindowId || r.batch_id === undefined)
  );
  const admittedRequests = requests.filter((r) => r.status !== 'waiting_batch');

  const displayedRequests =
    filterMode === 'current'
      ? currentBatchRequests
      : filterMode === 'admitted'
      ? admittedRequests
      : requests;

  // Progress percentage for radial/linear bar
  const progressPercent = Math.max(0, Math.min(100, Math.round(((totalWindowSec - timeRemaining) / totalWindowSec) * 100)));

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Top Banner & Control HUD */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-card border border-outline-variant/30 flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow decorative accent */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary-container/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col gap-1.5 max-w-xl z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
              <span className="material-symbols-outlined text-[18px]">motion_photos_auto</span>
            </div>
            <h1 className="font-extrabold text-2xl text-on-surface tracking-tight">
              Request & Batch Manager
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              {batchStatus === 'intake_open' ? 'Intake Open' : 'Locked & Solving'}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-medium">
            Dynamic rolling-window buffer groups Pune commute requests into optimization batches. Requests arriving mid-window remain locked and queued without dropping or double-processing.
          </p>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <button
            type="button"
            onClick={() => onGenerateDemand(1)}
            className="h-10 px-4 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold flex items-center gap-1.5 border border-outline-variant/30 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">person_add</span>
            <span>+ 1 Request</span>
          </button>
          <button
            type="button"
            onClick={() => onGenerateDemand(4)}
            className="h-10 px-4 rounded-full bg-secondary-container/30 hover:bg-secondary-container/50 text-on-secondary-container text-xs font-bold flex items-center gap-1.5 border border-secondary-container/40 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">bolt</span>
            <span>+ 4 Demand Ping</span>
          </button>
          <button
            type="button"
            onClick={onDispatchNow}
            className="h-10 px-5 rounded-full bg-primary hover:bg-primary/95 text-on-primary text-xs font-extrabold flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">play_circle</span>
            <span>Lock & Dispatch Batch Now</span>
          </button>
        </div>
      </div>

      {/* Grid: Batch Window Live Telemetry & Configuration (12 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Batch HUD (7 cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-3xl p-6 shadow-card border border-outline-variant/30 flex flex-col justify-between gap-5 relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl text-on-surface">
                  Active Rolling Batch #{currentWindowId}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
                  Window Interval: {totalWindowSec}s
                </span>
              </div>
              <span className="text-xs text-on-surface-variant mt-0.5 block">
                Trigger Policy: Sliding Window ({totalWindowSec}s timer OR ≥ {threshold} request threshold)
              </span>
            </div>

            <div className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface text-[11px] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">lock_clock</span>
              <span>Duplicate Guard Active</span>
            </div>
          </div>

          {/* Metric Indicators */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-surface-container-low/70 border border-outline-variant/20">
            {/* Countdown Clock */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-center">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    className="text-surface-container"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="10"
                  />
                  <circle
                    className="text-primary transition-all duration-1000"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray="251"
                    strokeDashoffset={251 - (251 * progressPercent) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-on-surface leading-none">{timeRemaining}</span>
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase">sec</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-on-surface mt-2">Remaining Time</span>
            </div>

            {/* Buffered Request Count vs Threshold */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-center">
              <div className="text-3xl font-black text-primary">
                {currentBatchRequests.length}
                <span className="text-sm font-semibold text-on-surface-variant"> / {threshold}</span>
              </div>
              <span className="text-[11px] font-bold text-on-surface mt-1">Buffered In Intake</span>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-secondary transition-all"
                  style={{ width: `${Math.min(100, (currentBatchRequests.length / threshold) * 100)}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-on-surface-variant mt-1">
                {threshold - currentBatchRequests.length > 0
                  ? `${threshold - currentBatchRequests.length} more triggers instant dispatch`
                  : 'Threshold reached!'}
              </span>
            </div>

            {/* Total System Requests */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-center">
              <div className="text-3xl font-black text-tertiary">
                {requests.length}
              </div>
              <span className="text-[11px] font-bold text-on-surface mt-1">Total Lifetime Demands</span>
              <span className="text-[10px] text-on-surface-variant mt-2">
                Admitted: <strong>{admittedRequests.length}</strong> • Buffered: <strong>{currentBatchRequests.length}</strong>
              </span>
            </div>
          </div>

          {/* Config Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-outline-variant/30 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-on-surface-variant text-[11px] uppercase">Tune Window:</span>
              <div className="flex gap-1.5">
                {[15, 30, 45].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setSelectedDuration(sec);
                      onConfigureBatch(sec, selectedThreshold);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      totalWindowSec === sec
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-on-surface-variant text-[11px] uppercase">Threshold:</span>
              <div className="flex gap-1.5">
                {[2, 4, 6, 8].map((th) => (
                  <button
                    key={th}
                    type="button"
                    onClick={() => {
                      setSelectedThreshold(th);
                      onConfigureBatch(selectedDuration, th);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      threshold === th
                        ? 'bg-secondary text-on-secondary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {th} reqs
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Fleet Vehicles Capacity & Real-Time Load (5 cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-3xl p-6 shadow-card border border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-on-surface">Fleet Real-Time Capacity</h2>
              <span className="text-xs text-on-surface-variant">Pune EV Cooperative Fleet</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-xs font-semibold text-on-surface">
              {vehicles.length} Vehicles
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {vehicles.map((v) => {
              const seatPercent = Math.round((v.occupied_seats / v.capacity) * 100);
              return (
                <div
                  key={v.vehicle_id}
                  onClick={() => onSelectVehicle(v.vehicle_id)}
                  className="p-3.5 rounded-2xl bg-surface-container-low/80 hover:bg-surface-container border border-outline-variant/30 transition-all cursor-pointer flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {v.vehicle_id}
                      </div>
                      <div>
                        <span className="font-bold text-on-surface block leading-tight">{v.name}</span>
                        <span className="text-[10px] text-on-surface-variant">{v.current_location.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-tertiary">⚡{v.battery_pct}%</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          v.status === 'en_route'
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                            : v.status === 'full'
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-surface-container-highest text-on-surface-variant'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                  </div>

                  {/* Seat Occupancy Meter */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex-1 bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          seatPercent >= 100 ? 'bg-error' : seatPercent > 50 ? 'bg-secondary' : 'bg-primary'
                        }`}
                        style={{ width: `${seatPercent}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-[11px] text-on-surface whitespace-nowrap">
                      {v.occupied_seats} / {v.capacity} Seats
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Request Queue Table (Pending vs Admitted) */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-card border border-outline-variant/30 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-extrabold text-lg text-on-surface">Intake & Dispatched Request Queue</h2>
            <div className="flex bg-surface-container p-1 rounded-full text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterMode('current')}
                className={`px-3 py-1 rounded-full transition-all ${
                  filterMode === 'current'
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Current Window ({currentBatchRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('admitted')}
                className={`px-3 py-1 rounded-full transition-all ${
                  filterMode === 'admitted'
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Admitted / Matched ({admittedRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-full transition-all ${
                  filterMode === 'all'
                    ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All Demands ({requests.length})
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant/30 text-[11px] text-on-surface-variant font-extrabold uppercase tracking-wider">
                <th className="py-3 px-3">Request ID</th>
                <th className="py-3 px-3">Passenger</th>
                <th className="py-3 px-3">Pickup Location</th>
                <th className="py-3 px-3">Destination</th>
                <th className="py-3 px-3">Party Size</th>
                <th className="py-3 px-3">Solo Baseline</th>
                <th className="py-3 px-3">Solo Fare (₹)</th>
                <th className="py-3 px-3">Batch Window</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-on-surface-variant font-medium">
                    No requests currently buffered in this queue category.
                  </td>
                </tr>
              ) : (
                displayedRequests.map((r) => {
                  const isCurrent = r.status === 'waiting_batch' && (r.batch_id === currentWindowId || r.batch_id === undefined);
                  return (
                    <tr
                      key={r.request_id}
                      onClick={() => onSelectRequest(r.request_id)}
                      className="hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-primary">{r.request_id}</td>
                      <td className="py-3 px-3 font-semibold text-on-surface">{r.passenger_name}</td>
                      <td className="py-3 px-3 text-on-surface">{r.pickup.name}</td>
                      <td className="py-3 px-3 text-on-surface">{r.dropoff.name}</td>
                      <td className="py-3 px-3 font-semibold">
                        {r.party_size} {r.party_size === 1 ? 'Seat' : 'Seats'}
                      </td>
                      <td className="py-3 px-3 text-on-surface-variant">
                        {r.solo_distance_km} km • {Math.round(r.solo_eta_sec / 60)}m
                      </td>
                      <td className="py-3 px-3 font-bold text-on-surface">₹{r.solo_fare_inr.toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] font-bold text-on-surface-variant">
                          #{r.batch_id ?? currentWindowId}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {isCurrent ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container font-extrabold text-[10px] flex items-center gap-1 w-max">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                            Waiting Batch
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-[10px] uppercase w-max block">
                            {r.status.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
