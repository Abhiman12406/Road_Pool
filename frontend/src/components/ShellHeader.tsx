import React from 'react';
import type { GlobalSimulationSnapshot } from '../types/simulation';

export type ActiveViewKey =
  | 'ops-overview'
  | 'ops-batches'
  | 'ops-optimization'
  | 'ops-detour-guarantees'
  | 'ops-fair-fares'
  | 'passenger-home'
  | 'passenger-waiting'
  | 'passenger-active';

interface ShellHeaderProps {
  currentView: ActiveViewKey;
  onSwitchView: (view: ActiveViewKey) => void;
  snapshot: GlobalSimulationSnapshot | null;
  isConnected: boolean;
  isStoryModeOpen?: boolean;
  onToggleStoryMode?: () => void;
  isScenariosBarOpen?: boolean;
  onToggleScenariosBar?: () => void;
}

export const ShellHeader: React.FC<ShellHeaderProps> = ({
  currentView,
  onSwitchView,
  snapshot,
  isConnected,
  isStoryModeOpen = false,
  onToggleStoryMode,
  isScenariosBarOpen = true,
  onToggleScenariosBar,
}) => {
  const kpis = snapshot?.kpis;
  const engine = snapshot?.engine;

  const isOps = currentView.startsWith('ops');
  const isPassenger = currentView.startsWith('passenger');

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-xl z-50 border-b border-outline-variant/30 px-6 flex items-center justify-between">
      {/* Brand & Archetype Switcher */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shadow-glow">
            <span className="material-symbols-outlined text-on-primary-container text-[22px]">hub</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-title-md text-on-surface tracking-tight">
              RidePool<span className="text-primary">.AI</span>
            </span>
            <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">
              Pune Metro Engine
            </span>
          </div>
        </div>

        {/* Global Archetype Switcher */}
        <div className="bg-surface-container-high p-1 rounded-full flex items-center shadow-inner">
          <button
            type="button"
            id="nav-ops-console-btn"
            onClick={() => onSwitchView('ops-overview')}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
              isOps
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Operations Console
          </button>
          <button
            type="button"
            id="nav-passenger-app-btn"
            onClick={() => onSwitchView('passenger-home')}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
              isPassenger
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Passenger App
          </button>
        </div>

        {/* Sub-view Navigation Pills */}
        <div className="hidden md:flex items-center gap-1 bg-surface-container-low p-1 rounded-full border border-outline-variant/30 text-xs">
          {isOps ? (
            <>
              <button
                type="button"
                id="nav-ops-overview"
                onClick={() => onSwitchView('ops-overview')}
                className={`px-3 py-1 rounded-full transition-all ${
                  currentView === 'ops-overview'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                id="nav-ops-batches"
                onClick={() => onSwitchView('ops-batches')}
                className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                  currentView === 'ops-batches'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">view_timeline</span>
                <span>Batches</span>
              </button>
              <button
                type="button"
                id="nav-ops-optimization"
                onClick={() => onSwitchView('ops-optimization')}
                className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                  currentView === 'ops-optimization'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">alt_route</span>
                <span>Route Optimization (/ops/optimization)</span>
              </button>
              <button
                type="button"
                id="nav-ops-detour-guarantees"
                onClick={() => onSwitchView('ops-detour-guarantees')}
                className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                  currentView === 'ops-detour-guarantees'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                <span>Detour Guarantees (≤15%)</span>
              </button>
              <button
                type="button"
                id="nav-ops-fair-fares"
                onClick={() => onSwitchView('ops-fair-fares')}
                className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                  currentView === 'ops-fair-fares'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">balance</span>
                <span>Fair Fares (Shapley)</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onSwitchView('passenger-home')}
                className={`px-3 py-1 rounded-full transition-all ${
                  currentView === 'passenger-home'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Book Ride (/passenger/home)
              </button>
              <button
                type="button"
                id="nav-passenger-waiting"
                onClick={() => onSwitchView('passenger-waiting')}
                className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                  currentView === 'passenger-waiting'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                <span>Matching Queue (/passenger/waiting)</span>
              </button>
              <button
                type="button"
                id="nav-passenger-active"
                onClick={() => onSwitchView('passenger-active')}
                className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                  currentView === 'passenger-active'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">electric_car</span>
                <span>Active Trip (/passenger/active)</span>
              </button>
            </>
          )}
        </div>

        {/* Batch Window Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary-fixed/30 border border-tertiary/20">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
          <span className="text-xs font-semibold text-on-tertiary-container">
            Window #{engine?.currentWindowId || 101} • {engine?.timeRemainingInWindowSec || 30}s rolling
          </span>
        </div>
      </div>

      {/* KPI Ticker Bar */}
      <div className="hidden xl:flex items-center gap-4 px-4 py-1.5 rounded-full bg-surface-container-lowest shadow-sm border border-outline-variant/30 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-on-surface-variant uppercase font-semibold">Active Pools:</span>
          <span className="font-bold text-primary">{kpis?.activePoolsCount ?? 2} Trips</span>
        </div>
        <div className="w-px h-3.5 bg-outline-variant/60"></div>
        <div className="flex items-center gap-1.5">
          <span className="text-on-surface-variant uppercase font-semibold">Avg Detour:</span>
          <span className="font-bold text-on-surface">+{kpis?.fleetDetourAveragePct?.toFixed(1) ?? '8.4'}%</span>
          <span className="text-[10px] text-tertiary font-medium">(Cap ≤15%)</span>
        </div>
        <div className="w-px h-3.5 bg-outline-variant/60"></div>
        <div className="flex items-center gap-1.5">
          <span className="text-on-surface-variant uppercase font-semibold">Shapley Savings:</span>
          <span className="font-bold text-tertiary">-{kpis?.shapleySavingsPct?.toFixed(1) ?? '27.4'}%</span>
        </div>
      </div>

      {/* Right status, Story Mode & 12 Scenarios buttons */}
      <div className="flex items-center gap-2.5">
        {onToggleStoryMode && (
          <button
            type="button"
            id="nav-guided-story-mode-btn"
            onClick={onToggleStoryMode}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
              isStoryModeOpen
                ? 'bg-primary text-on-primary border-primary shadow-glow'
                : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
            }`}
            title="Open Interactive Guided Story Mode Wizard"
          >
            <span className="material-symbols-outlined text-[16px]">auto_stories</span>
            <span>Guided Story Mode</span>
          </button>
        )}

        {onToggleScenariosBar && (
          <button
            type="button"
            id="nav-scenarios-bar-btn"
            onClick={onToggleScenariosBar}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
              isScenariosBarOpen
                ? 'bg-surface-container-high text-on-surface border-primary/40'
                : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:text-on-surface'
            }`}
            title="Toggle Quick Runner for 12 Acceptance Scenarios"
          >
            <span className="material-symbols-outlined text-[16px]">fact_check</span>
            <span>12 Scenarios</span>
          </button>
        )}

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-xs">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-tertiary animate-ping' : 'bg-error'}`}></span>
          <span className="text-on-surface-variant font-medium">
            {isConnected ? 'Live Telemetry' : 'Connecting...'}
          </span>
        </div>
      </div>
    </header>
  );
};
