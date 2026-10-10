import React from 'react';
import type { GlobalSimulationSnapshot } from '../types/simulation';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

export type ActiveViewKey =
  | 'landing'
  | 'login'
  | 'signup'
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
  const { user, logout } = useAuth();
  const kpis = snapshot?.kpis;
  const isLanding = currentView === 'landing';
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
      {/* 1. Brand Logo: RouteMates */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => onSwitchView('landing')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[17px] text-emerald-400">alt_route</span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-zinc-950 font-display">
              RouteMates<span className="text-emerald-600 font-semibold text-xs ml-1">AI</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">
              Fair Mobility Engine
            </span>
          </div>
        </button>

        {/* 2. Primary Mode Segmented Control */}
        <nav aria-label="Mode selector" className="bg-[#efefef] p-1 rounded-full flex items-center border border-[#e2e2e2]">
          <button
            type="button"
            id="nav-landing-mode-btn"
            onClick={() => onSwitchView('landing')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              isLanding
                ? 'bg-black text-white shadow-sm'
                : 'text-[#5e5e5e] hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">home</span>
            <span className="hidden sm:inline">Overview</span>
          </button>

          <button
            type="button"
            id="nav-passenger-mode-btn"
            onClick={() => onSwitchView('passenger-home')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              isPassenger
                ? 'bg-black text-white shadow-sm'
                : 'text-[#5e5e5e] hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">person</span>
            <span>Passenger</span>
          </button>

          <button
            type="button"
            id="nav-driver-mode-btn"
            onClick={() => onSwitchView('driver-home')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              isDriver
                ? 'bg-black text-white shadow-sm'
                : 'text-[#5e5e5e] hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">sports_motorsports</span>
            <span>Driver</span>
          </button>

          <button
            type="button"
            id="nav-ops-mode-btn"
            onClick={() => onSwitchView('ops-overview')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              isOps
                ? 'bg-black text-white shadow-sm'
                : 'text-[#5e5e5e] hover:text-black'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">grid_view</span>
            <span className="hidden md:inline">Operations</span>
          </button>
        </nav>

        {/* 3. Sub-View Navigation for Driver */}
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
              Cockpit & Map
            </button>
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
              Trips
            </button>
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
              Activity
            </button>
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
              Profile
            </button>
          </div>
        )}

        {/* Sub-View Navigation for Passenger */}
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
              Book Ride
            </button>
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
              Batch Matching
            </button>
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
              Active Trip & Receipt
            </button>
          </div>
        )}

        {/* Sub-View Navigation for Ops */}
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
              Optimization
            </button>
            <button
              type="button"
              id="nav-ops-detour-guarantees"
              onClick={() => onSwitchView('ops-detour-guarantees')}
              className={`px-3 py-1 rounded-full transition-colors ${
                currentView === 'ops-detour-guarantees' ? 'text-black font-semibold bg-[#efefef]' : 'hover:text-black'
              }`}
            >
              Detours (&le;15%)
            </button>
            <button
              type="button"
              id="nav-ops-fair-fares"
              onClick={() => onSwitchView('ops-fair-fares')}
              className={`px-3 py-1 rounded-full transition-colors ${
                currentView === 'ops-fair-fares' ? 'text-black font-semibold bg-[#efefef]' : 'hover:text-black'
              }`}
            >
              Fair Fares
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
          <span className="text-[10px] text-emerald-600 font-bold font-sans">&le;15%</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-sans">Shapley Savings:</span>
          <span className="font-bold text-emerald-700 tabular-nums">-{kpis?.shapleySavingsPct?.toFixed(1) ?? '27.4'}%</span>
        </div>
      </div>

      {/* 5. Right Action Area */}
      <div className="flex items-center gap-2.5">
        {/* Firebase Authentication Status / Action buttons */}
        {user ? (
          <div className="flex items-center gap-2 bg-[#f4f4f5] px-3 py-1 rounded-full border border-zinc-200">
            <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
            </div>
            <span className="text-xs font-medium text-zinc-900 max-w-[110px] truncate">
              {user.displayName || user.email?.split('@')[0]}
            </span>
            <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
              {user.role}
            </span>
            <button
              type="button"
              onClick={() => logout()}
              title="Sign Out"
              className="text-zinc-500 hover:text-zinc-900 ml-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSwitchView('login')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                currentView === 'login'
                  ? 'bg-zinc-950 text-white'
                  : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onSwitchView('signup')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                currentView === 'signup'
                  ? 'bg-zinc-950 text-white'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Demo Scenarios Drawer Trigger */}
        <button
          type="button"
          id="nav-scenarios-bar-btn"
          onClick={handleOpenDemo}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
            isScenariosBarOpen
              ? 'bg-[#282828] text-white shadow-inner ring-2 ring-black'
              : 'bg-black hover:bg-[#282828] text-white shadow-sm'
          }`}
          title="Open 12 Acceptance Scenarios & Simulator Console (Press 'D')"
        >
          <span className="material-symbols-outlined text-[16px]">fact_check</span>
          <span className="hidden sm:inline">Scenarios</span>
          <kbd className="hidden sm:inline px-1 py-0.2 rounded text-[10px] bg-neutral-800 text-neutral-300 font-mono">D</kbd>
        </button>

        {/* Live connection dot */}
        <div className="flex items-center gap-1.5 pl-1 text-xs text-slate-500">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span className="hidden lg:inline text-[11px] font-medium">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
};
