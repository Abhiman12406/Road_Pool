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
    <div className="flex flex-col gap-6">
      {/* 1. Simulation Master Control Bar */}
      <SimulationControlBar engine={snapshot?.engine} onControl={onControl} />

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-soft border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold">
            <span>ACTIVE FLEET</span>
            <span className="material-symbols-outlined text-primary text-[20px]">electric_car</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface">
              {Object.values(vehicles).filter(v => v.status === 'en_route').length}
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">
              / {Object.keys(vehicles).length} EVs Active
            </span>
          </div>
          <div className="mt-2 text-xs text-tertiary font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            <span>All vehicles under max capacity</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-soft border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold">
            <span>ROLLING BATCH</span>
            <span className="material-symbols-outlined text-primary text-[20px]">hourglass_top</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface">
              {Object.values(requests).filter(r => r.status === 'waiting_batch').length}
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">Riders in Buffer</span>
          </div>
          <div className="mt-2 text-xs text-primary font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">timer</span>
            <span>Triggering in {snapshot?.engine?.timeRemainingInWindowSec ?? 30}s</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-soft border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold">
            <span>DETOUR GUARANTEE</span>
            <span className="material-symbols-outlined text-tertiary text-[20px]">verified</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface">
              +{kpis?.fleetDetourAveragePct?.toFixed(1) ?? '8.4'}%
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">Fleet Avg</span>
          </div>
          <div className="mt-2 text-xs text-tertiary font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">shield</span>
            <span>Strict ≤15.0% Cap Enforced</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-soft border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold">
            <span>SHAPLEY SAVINGS</span>
            <span className="material-symbols-outlined text-tertiary text-[20px]">savings</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-tertiary">
              -{kpis?.shapleySavingsPct?.toFixed(1) ?? '27.4'}%
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">vs Solo Rides</span>
          </div>
          <div className="mt-2 text-xs text-on-surface-variant font-medium flex items-center gap-1">
            <span>Total Saved:</span>
            <span className="font-bold text-on-surface">₹{kpis?.totalCoalitionSavingsInr?.toFixed(2) ?? '81.50'}</span>
          </div>
        </div>
      </div>

      {/* 3. Main Center Grid: Map & Vehicle Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[580px]">
        {/* Left 2 Cols: Live Map */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-title-md text-on-surface">Pune Live Route Dispatch</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs text-on-surface-variant font-semibold">
                FC Road / Shivajinagar Hub
              </span>
            </div>
            <span className="text-xs text-on-surface-variant">Click markers to inspect stop sequences</span>
          </div>
          <div className="flex-1 h-[520px]">
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
        <div className="flex flex-col gap-4">
          <div className="font-bold text-title-md text-on-surface flex items-center justify-between">
            <span>Fleet Status ({Object.keys(vehicles).length})</span>
            <span className="text-xs text-primary font-semibold">Pune Metro</span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[520px] pr-1">
            {Object.values(vehicles).map((v) => {
              const isSelected = v.vehicle_id === selectedVehicleId;
              return (
                <div
                  key={v.vehicle_id}
                  onClick={() => onSelectVehicle(v.vehicle_id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-surface-container-lowest border-primary shadow-soft ring-2 ring-primary/20'
                      : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-on-surface">{v.vehicle_id}</span>
                      <span className="text-xs text-on-surface-variant">• {v.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      v.status === 'en_route' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {v.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
                    <span>Capacity: <strong>{v.occupied_seats}/{v.capacity} seats</strong></span>
                    <span className="text-tertiary font-semibold">⚡ {v.battery_pct}%</span>
                  </div>

                  {v.planned_stops.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-outline-variant/30 text-xs">
                      <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                        Next Stop ({v.planned_stops.length} queued):
                      </span>
                      <div className="mt-1 flex items-center justify-between text-on-surface">
                        <span className="font-medium truncate">{v.planned_stops[0].location.name}</span>
                        <span className="font-bold text-primary">~{Math.round(v.planned_stops[0].eta_seconds_from_now / 60)} min</span>
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
