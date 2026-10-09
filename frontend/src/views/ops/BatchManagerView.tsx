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
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full" id="batch-manager-screen">
      {/* Top Banner & Control HUD */}
      <div className="bg-white rounded-xl p-5 border border-neutral-200 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div className="flex flex-col gap-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-neutral-700">motion_photos_auto</span>
            <h1 className="font-bold text-xl text-neutral-900 tracking-tight">
              Request & Batch Manager
            </h1>
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 border ${
              batchStatus === 'intake_open'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${batchStatus === 'intake_open' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              {batchStatus === 'intake_open' ? 'Intake Open' : 'Locked & Solving'}
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Dynamic rolling-window buffer groups Pune commute requests into optimization batches. Requests arriving mid-window remain locked and queued without dropping or double-processing.
          </p>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onGenerateDemand(1)}
            className="h-8 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium flex items-center gap-1.5 border border-neutral-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px] text-neutral-600">person_add</span>
            <span>+ 1 Request</span>
          </button>
          <button
            type="button"
            onClick={() => onGenerateDemand(4)}
            className="h-8 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium flex items-center gap-1.5 border border-neutral-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px] text-amber-600">bolt</span>
            <span>+ 4 Demand Ping</span>
          </button>
          <button
            type="button"
            onClick={onDispatchNow}
            className="h-8 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-400">play_circle</span>
            <span>Lock & Dispatch Batch Now</span>
          </button>
        </div>
      </div>

      {/* Grid: Batch Window Live Telemetry & Configuration (12 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Batch HUD (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-neutral-200 flex flex-col justify-between gap-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-neutral-900">
                  Active Rolling Batch #{currentWindowId}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-xs font-mono font-medium border border-neutral-200">
                  Window: {totalWindowSec}s
                </span>
              </div>
              <span className="text-xs text-neutral-500 mt-0.5 block">
                Trigger Policy: Sliding Window ({totalWindowSec}s timer OR ≥ {threshold} request threshold)
              </span>
            </div>

            <div className="px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 text-[11px] font-medium flex items-center gap-1 border border-neutral-200">
              <span className="material-symbols-outlined text-[14px] text-neutral-600">lock_clock</span>
              <span>Duplicate Guard Active</span>
            </div>
          </div>

          {/* Metric Indicators */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg bg-neutral-50 border border-neutral-200">
            {/* Countdown Clock */}
            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white border border-neutral-200 text-center">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 100 100">
                  <circle
                    className="text-neutral-200"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                  />
                  <circle
                    className="text-neutral-900 transition-all duration-1000"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="251"
                    strokeDashoffset={251 - (251 * progressPercent) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-lg font-black font-mono tabular-nums text-neutral-900 leading-none">{timeRemaining}</span>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase">sec</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-neutral-700 mt-2">Remaining Time</span>
            </div>

            {/* Buffered Request Count vs Threshold */}
            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white border border-neutral-200 text-center">
              <div className="text-3xl font-black font-mono tabular-nums text-neutral-900">
                {currentBatchRequests.length}
                <span className="text-sm font-normal text-neutral-400"> / {threshold}</span>
              </div>
              <span className="text-xs font-semibold text-neutral-700 mt-1">Buffered In Intake</span>
              <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden mt-2 border border-neutral-200">
                <div
                  className="h-full bg-neutral-900 transition-all"
                  style={{ width: `${Math.min(100, (currentBatchRequests.length / threshold) * 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between w-full text-[10px] text-neutral-500 mt-1.5 px-0.5">
                <span className="font-medium text-neutral-800">
                  {currentBatchRequests.reduce((sum, r) => sum + (r.party_size || 1), 0)} seats
                </span>
                <span>
                  {threshold - currentBatchRequests.length > 0
                    ? `${threshold - currentBatchRequests.length} to dispatch`
                    : 'Threshold reached'}
                </span>
              </div>
            </div>

            {/* Total System Requests */}
            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white border border-neutral-200 text-center">
              <div className="text-3xl font-black font-mono tabular-nums text-emerald-700">
                {requests.length}
              </div>
              <span className="text-xs font-semibold text-neutral-700 mt-1">Total Lifetime Demands</span>
              <span className="text-[10px] text-neutral-500 mt-2 font-mono">
                Admitted: <strong className="text-neutral-900">{admittedRequests.length}</strong> • Buffered: <strong className="text-neutral-900">{currentBatchRequests.length}</strong>
              </span>
            </div>
          </div>

          {/* Config Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-500 text-[11px] uppercase tracking-wider">Window:</span>
              <div className="flex gap-1">
                {[15, 30, 45].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setSelectedDuration(sec);
                      onConfigureBatch(sec, selectedThreshold);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                      totalWindowSec === sec
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-500 text-[11px] uppercase tracking-wider">Threshold:</span>
              <div className="flex gap-1">
                {[2, 4, 6, 8].map((th) => (
                  <button
                    key={th}
                    type="button"
                    onClick={() => {
                      setSelectedThreshold(th);
                      onConfigureBatch(selectedDuration, th);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                      threshold === th
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200'
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
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-neutral-200 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-neutral-900">Fleet Real-Time Capacity</h2>
              <span className="text-xs text-neutral-500">Pune EV Cooperative Fleet</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-xs font-mono font-medium text-neutral-700 border border-neutral-200">
              {vehicles.length} Vehicles
            </span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
            {vehicles.map((v) => {
              const seatPercent = Math.round((v.occupied_seats / v.capacity) * 100);
              return (
                <div
                  key={v.vehicle_id}
                  onClick={() => onSelectVehicle(v.vehicle_id)}
                  className="p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition-colors cursor-pointer flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-neutral-200 text-neutral-800 flex items-center justify-center font-mono font-bold text-xs">
                        {v.vehicle_id}
                      </div>
                      <div>
                        <span className="font-semibold text-neutral-900 block leading-tight">{v.name}</span>
                        <span className="text-[10px] text-neutral-500">{v.current_location.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-neutral-600">⚡{v.battery_pct}%</span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono font-medium text-[10px] uppercase border ${
                          v.status === 'en_route'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : v.status === 'full'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                  </div>

                  {/* Seat Occupancy Meter */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex-1 bg-neutral-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          seatPercent >= 100 ? 'bg-rose-600' : seatPercent > 50 ? 'bg-amber-600' : 'bg-neutral-900'
                        }`}
                        style={{ width: `${seatPercent}%` }}
                      ></div>
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-[11px] text-neutral-800 whitespace-nowrap">
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
      <div className="bg-white rounded-xl p-5 border border-neutral-200 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-base text-neutral-900">Intake & Dispatched Request Queue</h2>
            <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setFilterMode('current')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filterMode === 'current'
                    ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Current Window ({currentBatchRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('admitted')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filterMode === 'admitted'
                    ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Admitted / Matched ({admittedRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filterMode === 'all'
                    ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
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
              <tr className="border-b border-neutral-200 text-[11px] text-neutral-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Request ID</th>
                <th className="py-2.5 px-3">Passenger</th>
                <th className="py-2.5 px-3">Pickup Location</th>
                <th className="py-2.5 px-3">Destination</th>
                <th className="py-2.5 px-3">Party Size</th>
                <th className="py-2.5 px-3">Solo Baseline</th>
                <th className="py-2.5 px-3">Solo Fare (₹)</th>
                <th className="py-2.5 px-3">Batch Window</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-400 font-medium">
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
                      className="hover:bg-neutral-50 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">{r.request_id}</td>
                      <td className="py-2.5 px-3 font-medium text-neutral-900">{r.passenger_name}</td>
                      <td className="py-2.5 px-3 text-neutral-700">{r.pickup.name}</td>
                      <td className="py-2.5 px-3 text-neutral-700">{r.dropoff.name}</td>
                      <td className="py-2.5 px-3 font-medium">
                        {r.party_size} {r.party_size === 1 ? 'Seat' : 'Seats'}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-500 font-mono">
                        {r.solo_distance_km} km • {Math.round(r.solo_eta_sec / 60)}m
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold tabular-nums text-neutral-900">₹{r.solo_fare_inr.toFixed(2)}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[11px] font-medium text-neutral-600">
                          #{r.batch_id ?? currentWindowId}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-mono font-medium text-[10px] flex items-center gap-1 w-max border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Waiting Batch
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono font-medium text-[10px] uppercase w-max block border border-emerald-200">
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
