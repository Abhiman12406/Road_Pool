import React from 'react';
import type { GlobalSimulationSnapshot } from '../types/simulation';

export type ActiveViewKey =
  | 'passenger-home'
  | 'passenger-waiting'
  | 'passenger-active'
  | 'driver-home'
  | 'driver-trips'
  | 'driver-activity'
  | 'driver-profile'
  | 'ops-overview'
  | 'ops-batches'
  | 'ops-optimization'
  | 'ops-detour-guarantees'
  | 'ops-fair-fares';

interface ShellHeaderProps {
  currentView: ActiveViewKey;
  onSwitchView: (view: ActiveViewKey) => void;
  snapshot: GlobalSimulationSnapshot | null;
  isConnected: boolean;
  isScenariosBarOpen?: boolean;
  onToggleScenariosBar?: () => void;
  onOpenDemoDrawer?: () => void;
}

export const ShellHeader: React.FC<ShellHeaderProps> = ({
  currentView,
  onSwitchView,
  snapshot,
  isConnected,
  isScenariosBarOpen = false,
  onToggleScenariosBar,
  onOpenDemoDrawer,
}) => {
  const kpis = snapshot?.kpis;
  const isPassenger = currentView.startsWith('passenger');
  const isDriver = currentView.startsWith('driver');
  const isOps = currentView.startsWith('ops');

  const handleOpenDemo = () => {
    if (onOpenDemoDrawer) {
      onOpenDemoDrawer();
    } else if (onToggleScenariosBar) {
      onToggleScenariosBar();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/98 backdrop-blur-md z-40 border-b border-[#efefef] px-4 sm:px-6 flex items-center justify-between">
      {/* 1. Brand Logo */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => onSwitchView('passenger-home')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs shadow-sm">
            <span className="material-symbols-outlined text-[17px]">alt_route</span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-black font-display">
              RidePool<span className="text-[#5e5e5e] font-normal">.AI</span>
            </span>
            <span className="text-[10px] text-[#5e5e5e] font-medium">
              Pune EV Metro Corridor
            </span>
          </div>
        </button>

        {/* 2. Primary Mode Segmented Control (Uber signature pill) */}
        <nav aria-label="Mode selector" className="bg-[#efefef] p-1 rounded-full flex items-center border border-[#e2e2e2]">
          <button
            type="button"
            id="nav-passenger-mode-btn"
            onClick={() => onSwitchView('passenger-home')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              isPassenger
                ? 'bg-black text-white shadow-sm'
                : 'text-[#5e5e5e] hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">person</span>
            <span>Passenger App</span>
          </button>

          <button
            type="button"
            id="nav-driver-mode-btn"
            onClick={() => onSwitchView('driver-home')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              isDriver
                ? 'bg-black text-white shadow-sm'
                : 'text-[#5e5e5e] hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">sports_motorsports</span>
            <span>Driver Cockpit</span>
          </button>

          <button
            type="button"
            id="nav-ops-mode-btn"
            onClick={() => onSwitchView('ops-overview')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              isOps
                ? 'bg-black text-white shadow-sm'
                : 'text-[#5e5e5e] hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">grid_view</span>
            <span>Operations Console</span>
          </button>
        </nav>

        {/* 3. Sub-View Navigation (Context-Aware Pill Controls) */}
        {isDriver && (
          <div className="hidden xl:flex items-center gap-1 border-l border-[#efefef] pl-4 text-xs font-medium text-[#5e5e5e]">
            <button
              type="button"
              id="nav-driver-home"
              onClick={() => onSwitchView('driver-home')}
              className={`px-3 py-1 rounded-full transition-colors ${
                currentView === 'driver-home'
                  ? 'text-black font-semibold bg-[#efefef]'
                  : 'hover:text-black'
              }`}
            >
              1. Cockpit & Map
            </button>
            <span className="text-[#afafaf]">/</span>
            <button
              type="button"
              id="nav-driver-trips"
              onClick={() => onSwitchView('driver-trips')}
              className={`px-3 py-1 rounded-full transition-colors ${
                currentView === 'driver-trips'
                  ? 'text-black font-semibold bg-[#efefef]'
                  : 'hover:text-black'
              }`}
            >
              2. My Trips
            </button>
            <span className="text-[#afafaf]">/</span>
            <button
              type="button"
              id="nav-driver-activity"
              onClick={() => onSwitchView('driver-activity')}
              className={`px-3 py-1 rounded-full transition-colors ${
                currentView === 'driver-activity'
                  ? 'text-black font-semibold bg-[#efefef]'
                  : 'hover:text-black'
              }`}
            >
              3. Activity
            </button>
            <span className="text-[#afafaf]">/</span>
            <button
              type="button"
              id="nav-driver-profile"
              onClick={() => onSwitchView('driver-profile')}
              className={`px-3 py-1 rounded-full transition-colors ${
                currentView === 'driver-profile'
                  ? 'text-black font-semibold bg-[#efefef]'
                  : 'hover:text-black'
              }`}
            >
              4. Profile
            </button>
          </div>
        )}

        {isPassenger && (
          <div className="hidden xl:flex items-center gap-1 border-l border-[#efefef] pl-4 text-xs font-medium text-[#5e5e5e]">
            <button
              type="button"
              id="nav-passenger-home"
              onClick={() => onSwitchView('passenger-home')}
              className={`px-3 py-1 rounded-full transition-colors ${
                currentView === 'passenger-home'
                  ? 'text-black font-semibold bg-[#efefef]'
                  : 'hover:text-black'
              }`}
            >
              1. Book Ride
            </button>
            <span className="text-[#afafaf]">/</span>
            <button
              type="button"
              id="nav-passenger-waiting"
              onClick={() => onSwitchView('passenger-waiting')}
              className={`px-3 py-1 rounded-full transition-colors ${
                currentView === 'passenger-waiting'
                  ? 'text-black font-semibold bg-[#efefef]'
                  : 'hover:text-black'
              }`}
            >
              2. Batch Matching
            </button>
            <span className="text-[#afafaf]">/</span>
            <button
              type="button"
              id="nav-passenger-active"
              onClick={() => onSwitchView('passenger-active')}
              className={`px-3 py-1 rounded-full transition-colors ${
                currentView === 'passenger-active'
                  ? 'text-black font-semibold bg-[#efefef]'
                  : 'hover:text-black'
              }`}
            >
              3. In-Ride Trip
            </button>
          </div>
        )}

        {isOps && (
          <div className="hidden xl:flex items-center gap-1 border-l border-[#efefef] pl-4 text-xs font-medium text-[#5e5e5e]">
            <button
              type="button"
              id="nav-ops-overview"
              onClick={() => onSwitchView('ops-overview')}
              className={`px-3 py-1 rounded-full transition-colors ${
                currentView === 'ops-overview' ? 'text-black font-semibold bg-[#efefef]' : 'hover:text-black'
              }`}
            >
              Fleet Map
            </button>
            <button
              type="button"
              id="nav-ops-batches"
              onClick={() => onSwitchView('ops-batches')}
              className={`px-3 py-1 rounded-full transition-colors ${
                currentView === 'ops-batches' ? 'text-black font-semibold bg-[#efefef]' : 'hover:text-black'
              }`}
            >
              Batches
            </button>
            <button
              type="button"
              id="nav-ops-optimization"
              onClick={() => onSwitchView('ops-optimization')}
              className={`px-3 py-1 rounded-full transition-colors ${
                currentView === 'ops-optimization' ? 'text-black font-semibold bg-[#efefef]' : 'hover:text-black'
              }`}
            >
              Route Optimization
            </button>
            <button
              type="button"
              id="nav-ops-detour-guarantees"
              onClick={() => onSwitchView('ops-detour-guarantees')}
              className={`px-3 py-1 rounded-full transition-colors ${
                currentView === 'ops-detour-guarantees' ? 'text-black font-semibold bg-[#efefef]' : 'hover:text-black'
              }`}
            >
              Detour Guarantees (≤15%)
            </button>
            <button
              type="button"
              id="nav-ops-fair-fares"
              onClick={() => onSwitchView('ops-fair-fares')}
              className={`px-3 py-1 rounded-full transition-colors ${
                currentView === 'ops-fair-fares' ? 'text-black font-semibold bg-[#efefef]' : 'hover:text-black'
              }`}
            >
              Fair Fares (Shapley)
            </button>
          </div>
        )}
      </div>

      {/* 4. Telemetry Readouts (Clean monospace stats) */}
      <div className="hidden 2xl:flex items-center gap-4 text-xs font-mono text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-sans">Active Pools:</span>
          <span className="font-bold text-slate-900 tabular-nums">{kpis?.activePoolsCount ?? 2}</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-sans">Avg Detour:</span>
          <span className="font-bold text-slate-900 tabular-nums">+{kpis?.fleetDetourAveragePct?.toFixed(1) ?? '8.4'}%</span>
          <span className="text-[10px] text-emerald-600 font-bold font-sans">≤15%</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-sans">Shapley Savings:</span>
          <span className="font-bold text-emerald-700 tabular-nums">-{kpis?.shapleySavingsPct?.toFixed(1) ?? '27.4'}%</span>
        </div>
      </div>

      {/* 5. Right Action Area */}
      <div className="flex items-center gap-2">
        {/* Universal Demo Role Switcher [ P ] [ D ] [ A ] (Uber signature pill) */}
        <div
          role="group"
          aria-label="Universal Demo Role Switcher"
          className="hidden sm:flex items-center p-0.5 bg-[#efefef] rounded-full border border-[#e2e2e2] mr-1"
        >
          <button
            type="button"
            id="shell-role-p"
            onClick={() => onSwitchView('passenger-home')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              isPassenger ? 'bg-black text-white shadow-sm' : 'text-[#5e5e5e] hover:text-black'
            }`}
            title="Switch to Passenger App"
          >
            P
          </button>
          <button
            type="button"
            id="shell-role-d"
            onClick={() => onSwitchView('driver-home')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              isDriver ? 'bg-black text-white shadow-sm' : 'text-[#5e5e5e] hover:text-black'
            }`}
            title="Switch to Driver Dashboard"
          >
            D
          </button>
          <button
            type="button"
            id="shell-role-a"
            onClick={() => onSwitchView('ops-overview')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              isOps ? 'bg-black text-white shadow-sm' : 'text-[#5e5e5e] hover:text-black'
            }`}
            title="Switch to Operations Console"
          >
            A
          </button>
        </div>



        {/* Demo Scenarios Drawer Trigger */}
        <button
          type="button"
          id="nav-scenarios-bar-btn"
          onClick={handleOpenDemo}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
            isScenariosBarOpen
              ? 'bg-[#282828] text-white shadow-inner ring-2 ring-black'
              : 'bg-black hover:bg-[#282828] text-white shadow-sm'
          }`}
          title="Open 12 Acceptance Scenarios & Simulator Console (Press 'D')"
        >
          <span className="material-symbols-outlined text-[16px]">fact_check</span>
          <span>Scenarios (12)</span>
          <kbd className="hidden sm:inline px-1 py-0.2 rounded text-[10px] bg-neutral-800 text-neutral-300 font-mono">D</kbd>
        </button>

        {/* Live connection dot */}
        <div className="flex items-center gap-1.5 pl-2 text-xs text-slate-500">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span className="hidden lg:inline text-[11px] font-medium">
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
};
