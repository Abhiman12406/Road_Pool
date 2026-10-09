import React from 'react';
import type { GlobalSimulationSnapshot } from '../types/simulation';

export type ActiveViewKey =
  | 'guided-story'
  | 'passenger-home'
  | 'passenger-waiting'
  | 'passenger-active'
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
  isStoryModeOpen?: boolean;
  onToggleStoryMode?: () => void;
  isScenariosBarOpen?: boolean;
  onToggleScenariosBar?: () => void;
  onOpenDemoDrawer?: () => void;
}

export const ShellHeader: React.FC<ShellHeaderProps> = ({
  currentView,
  onSwitchView,
  snapshot,
  isConnected,
  isStoryModeOpen = false,
  onToggleStoryMode,
  isScenariosBarOpen = false,
  onToggleScenariosBar,
  onOpenDemoDrawer,
}) => {
  const kpis = snapshot?.kpis;
  const isPassenger = currentView.startsWith('passenger');
  const isOps = currentView.startsWith('ops');
  const isStory = currentView === 'guided-story';

  const handleOpenDemo = () => {
    if (onOpenDemoDrawer) {
      onOpenDemoDrawer();
    } else if (onToggleScenariosBar) {
      onToggleScenariosBar();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md z-40 border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      {/* 1. Brand Logo */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => onSwitchView('guided-story')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
            <span className="material-symbols-outlined text-[18px]">alt_route</span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight text-slate-900">
              RidePool<span className="text-slate-500 font-normal">.AI</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Pune EV Metro Corridor
            </span>
          </div>
        </button>

        {/* 2. Primary Mode Segmented Control */}
        <nav aria-label="Mode selector" className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200/60">
          <button
            type="button"
            id="nav-passenger-mode-btn"
            onClick={() => onSwitchView('passenger-home')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isPassenger
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">person</span>
            <span>Passenger App</span>
          </button>

          <button
            type="button"
            id="nav-ops-mode-btn"
            onClick={() => onSwitchView('ops-overview')}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isOps
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">grid_view</span>
            <span>Operations Console</span>
          </button>

          <button
            type="button"
            id="nav-story-mode-btn"
            onClick={() => onSwitchView('guided-story')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
              isStory
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">school</span>
            <span className="hidden sm:inline">Guided Story</span>
          </button>
        </nav>

        {/* 3. Sub-View Navigation (Context-Aware) */}
        {isPassenger && (
          <div className="hidden xl:flex items-center gap-1 border-l border-slate-200 pl-4 text-xs font-medium text-slate-600">
            <button
              type="button"
              id="nav-passenger-home"
              onClick={() => onSwitchView('passenger-home')}
              className={`px-2.5 py-1 rounded transition-colors ${
                currentView === 'passenger-home'
                  ? 'text-slate-900 font-bold bg-slate-100'
                  : 'hover:text-slate-900'
              }`}
            >
              1. Book Ride
            </button>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              id="nav-passenger-waiting"
              onClick={() => onSwitchView('passenger-waiting')}
              className={`px-2.5 py-1 rounded transition-colors ${
                currentView === 'passenger-waiting'
                  ? 'text-slate-900 font-bold bg-slate-100'
                  : 'hover:text-slate-900'
              }`}
            >
              2. Batch Matching
            </button>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              id="nav-passenger-active"
              onClick={() => onSwitchView('passenger-active')}
              className={`px-2.5 py-1 rounded transition-colors ${
                currentView === 'passenger-active'
                  ? 'text-slate-900 font-bold bg-slate-100'
                  : 'hover:text-slate-900'
              }`}
            >
              3. In-Ride Trip
            </button>
          </div>
        )}

        {isOps && (
          <div className="hidden xl:flex items-center gap-1 border-l border-slate-200 pl-4 text-xs font-medium text-slate-600">
            <button
              type="button"
              id="nav-ops-overview"
              onClick={() => onSwitchView('ops-overview')}
              className={`px-2 py-1 rounded transition-colors ${
                currentView === 'ops-overview' ? 'text-slate-900 font-bold bg-slate-100' : 'hover:text-slate-900'
              }`}
            >
              Fleet Map
            </button>
            <button
              type="button"
              id="nav-ops-batches"
              onClick={() => onSwitchView('ops-batches')}
              className={`px-2 py-1 rounded transition-colors ${
                currentView === 'ops-batches' ? 'text-slate-900 font-bold bg-slate-100' : 'hover:text-slate-900'
              }`}
            >
              Batches
            </button>
            <button
              type="button"
              id="nav-ops-optimization"
              onClick={() => onSwitchView('ops-optimization')}
              className={`px-2 py-1 rounded transition-colors ${
                currentView === 'ops-optimization' ? 'text-slate-900 font-bold bg-slate-100' : 'hover:text-slate-900'
              }`}
            >
              Route Optimization
            </button>
            <button
              type="button"
              id="nav-ops-detour-guarantees"
              onClick={() => onSwitchView('ops-detour-guarantees')}
              className={`px-2 py-1 rounded transition-colors ${
                currentView === 'ops-detour-guarantees' ? 'text-slate-900 font-bold bg-slate-100' : 'hover:text-slate-900'
              }`}
            >
              Detour Guarantees (≤15%)
            </button>
            <button
              type="button"
              id="nav-ops-fair-fares"
              onClick={() => onSwitchView('ops-fair-fares')}
              className={`px-2 py-1 rounded transition-colors ${
                currentView === 'ops-fair-fares' ? 'text-slate-900 font-bold bg-slate-100' : 'hover:text-slate-900'
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
        {/* Story Mode Shortcut */}
        {onToggleStoryMode && (
          <button
            type="button"
            id="nav-guided-story-mode-btn"
            onClick={onToggleStoryMode}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 border ${
              isStoryModeOpen
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Open Interactive Guided Story Mode Wizard"
          >
            <span className="material-symbols-outlined text-[15px]">auto_stories</span>
            <span className="hidden md:inline">Story Wizard</span>
          </button>
        )}

        {/* Demo Scenarios Drawer Trigger */}
        <button
          type="button"
          id="nav-scenarios-bar-btn"
          onClick={handleOpenDemo}
          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 border ${
            isScenariosBarOpen
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
          }`}
          title="Open 12 Acceptance Scenarios & Simulator Console (Press 'D')"
        >
          <span className="material-symbols-outlined text-[15px]">fact_check</span>
          <span>Scenarios (12)</span>
          <kbd className="hidden sm:inline px-1 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">D</kbd>
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
