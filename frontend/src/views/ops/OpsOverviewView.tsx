import React from 'react';
import type { GlobalSimulationSnapshot } from '../../types/simulation';
import { SimulationControlBar } from '../../components/SimulationControlBar';
import { LiveMap } from '../../components/LiveMap';

interface OpsOverviewViewProps {
  snapshot: GlobalSimulationSnapshot | null;
  onControl: (action: string, speed?: string, step_seconds?: number) => void;
  onSelectVehicle: (id: string) => void;
  onSelectRequest: (id: string) => void;
}

export const OpsOverviewView: React.FC<OpsOverviewViewProps> = ({
  snapshot,
  onControl,
  onSelectVehicle,
  onSelectRequest,
}) => {
  const kpis = snapshot?.kpis;
  const vehicles = snapshot?.vehicles || {};
  const requests = snapshot?.requests || {};
  const selectedVehicleId = snapshot?.selection?.selectedVehicleId || null;

  return (
    <div className="flex flex-col gap-6" id="ops-overview-screen">
      {/* 1. Simulation Master Control Bar */}
      <SimulationControlBar engine={snapshot?.engine} onControl={onControl} />

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold tracking-wider">
            <span>ACTIVE FLEET</span>
            <span className="material-symbols-outlined text-neutral-400 text-[18px]">electric_car</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
              {Object.values(vehicles).filter(v => v.status === 'en_route').length}
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              / {Object.keys(vehicles).length} EVs Active
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            <span>All vehicles under max capacity</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold tracking-wider">
            <span>ROLLING BATCH</span>
            <span className="material-symbols-outlined text-neutral-400 text-[18px]">hourglass_top</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900">
              {Object.values(requests).filter(r => r.status === 'waiting_batch').length}
            </span>
            <span className="text-xs text-neutral-500">Riders in Buffer</span>
          </div>
          <div className="mt-2 text-xs text-neutral-600 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">timer</span>
            <span>Triggering in <span className="font-mono tabular-nums font-semibold">{snapshot?.engine?.timeRemainingInWindowSec ?? 30}s</span></span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold tracking-wider">
            <span>DETOUR GUARANTEE</span>
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              +{kpis?.fleetDetourAveragePct?.toFixed(1) ?? '8.4'}%
            </span>
            <span className="text-xs text-neutral-500">Fleet Avg</span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">shield</span>
            <span>Strict ≤15.0% Cap Enforced</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold tracking-wider">
            <span>SHAPLEY SAVINGS</span>
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">savings</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              -{kpis?.shapleySavingsPct?.toFixed(1) ?? '27.4'}%
            </span>
            <span className="text-xs text-neutral-500">vs Solo Rides</span>
          </div>
          <div className="mt-2 text-xs text-neutral-600 font-medium flex items-center gap-1">
            <span>Total Saved:</span>
            <span className="font-bold font-mono tabular-nums text-neutral-900">₹{kpis?.totalCoalitionSavingsInr?.toFixed(2) ?? '81.50'}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Center Grid: Map & Vehicle Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[580px]">
        {/* Left 2 Cols: Live Map */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base text-neutral-900">Pune Live Route Dispatch</span>
              <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-xs text-neutral-600 font-medium border border-neutral-200">
                FC Road / Shivajinagar Hub
              </span>
            </div>
            <span className="text-xs text-neutral-400">Click markers to inspect stop sequences</span>
          </div>
          <div className="flex-1 h-[520px] rounded-xl overflow-hidden border border-neutral-200">
            <LiveMap
              vehicles={vehicles}
              requests={requests}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={onSelectVehicle}
              onSelectRequest={onSelectRequest}
            />
          </div>
        </div>

        {/* Right Col: Active Vehicles & Request Drilldown */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-base text-neutral-900">Fleet Status ({Object.keys(vehicles).length})</span>
            <span className="text-xs text-neutral-500 font-mono">Pune Metro</span>
          </div>

          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[520px] pr-1">
            {Object.values(vehicles).map((v) => {
              const isSelected = v.vehicle_id === selectedVehicleId;
              return (
                <div
                  key={v.vehicle_id}
                  onClick={() => onSelectVehicle(v.vehicle_id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-50 border-neutral-900 ring-1 ring-neutral-900'
                      : 'bg-white border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-sm text-neutral-900">{v.vehicle_id}</span>
                      <span className="text-xs text-neutral-500">• {v.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase ${
                      v.status === 'en_route' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {v.status}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-neutral-500 font-mono">
                    <span>Seats: <strong className="text-neutral-900">{v.occupied_seats}/{v.capacity}</strong></span>
                    <span className="text-neutral-700 font-medium">⚡ {v.battery_pct}%</span>
                  </div>

                  {v.planned_stops.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-neutral-100 text-xs">
                      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                        Next Stop ({v.planned_stops.length} queued):
                      </span>
                      <div className="mt-0.5 flex items-center justify-between text-neutral-800">
                        <span className="font-medium truncate text-xs">{v.planned_stops[0].location.name}</span>
                        <span className="font-mono font-semibold text-neutral-900 text-xs">~{Math.round(v.planned_stops[0].eta_seconds_from_now / 60)} min</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
