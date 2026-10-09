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
  const engine = snapshot?.engine;
  const kpis = snapshot?.kpis;

  const isPassenger = currentView.startsWith('passenger');
  const isOps = currentView.startsWith('ops');
  const isStory = currentView === 'guided-story';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-xl z-50 border-b border-outline-variant/30 px-4 sm:px-6 flex items-center justify-between">
      {/* 1. Brand Logo */}
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => onSwitchView('guided-story')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[20px]">hub</span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-on-surface">
              RidePool<span className="text-primary">.AI</span>
            </span>
            <span className="text-[10px] text-on-surface-variant font-medium tracking-wide">
              Pune Metro Engine
            </span>
          </div>
        </button>

        {/* 2. Primary Persona / Mode Switcher */}
        <nav aria-label="Mode selector" className="bg-surface-container-high/60 p-1 rounded-xl flex items-center border border-outline-variant/20 shadow-inner">
          <button
            type="button"
            id="nav-passenger-mode-btn"
            onClick={() => onSwitchView('passenger-home')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isPassenger
                ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">person</span>
            <span>Passenger</span>
          </button>

          <button
            type="button"
            id="nav-story-mode-btn"
            onClick={() => onSwitchView('guided-story')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isStory
                ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">school</span>
            <span>Guided Story</span>
          </button>

          <button
            type="button"
            id="nav-ops-mode-btn"
            onClick={() => onSwitchView('ops-overview')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isOps
                ? 'bg-surface-container-lowest text-on-surface shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">analytics</span>
            <span>Fleet Ops</span>
          </button>
        </nav>

        {/* 3. Sub-View Pills (Context-Aware) */}
        <div className="hidden lg:flex items-center gap-1 bg-surface-container-low/70 p-1 rounded-lg border border-outline-variant/20 text-xs">
          {isPassenger && (
            <>
              <button
                type="button"
                id="nav-passenger-home"
                onClick={() => onSwitchView('passenger-home')}
                className={`px-3 py-1 rounded-md transition-all font-medium ${
                  currentView === 'passenger-home'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Book Ride
              </button>
              <button
                type="button"
                id="nav-passenger-waiting"
                onClick={() => onSwitchView('passenger-waiting')}
                className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all font-medium ${
                  currentView === 'passenger-waiting'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                <span>Live Matching</span>
              </button>
            </>
          )}

          {isOps && (
            <>
              <button
                type="button"
                id="nav-ops-overview"
                onClick={() => onSwitchView('ops-overview')}
                className={`px-3 py-1 rounded-md transition-all font-medium ${
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
                className={`px-3 py-1 rounded-md flex items-center gap-1 transition-all font-medium ${
                  currentView === 'ops-batches'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>Dynamic Batches</span>
              </button>
              <button
                type="button"
                id="nav-ops-optimization"
                onClick={() => onSwitchView('ops-optimization')}
                className={`px-3 py-1 rounded-md flex items-center gap-1 transition-all font-medium ${
                  currentView === 'ops-optimization'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span>Route Optimization</span>
              </button>
              <button
                type="button"
                id="nav-ops-detour-guarantees"
                onClick={() => onSwitchView('ops-detour-guarantees')}
                className={`px-3 py-1 rounded-md flex items-center gap-1 transition-all font-medium ${
                  currentView === 'ops-detour-guarantees'
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
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
          )}

          {isStory && (
            <div className="px-3 py-1 text-xs text-on-surface-variant flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              <span className="font-semibold text-on-surface">Interactive 4-Step Pipeline</span>
            </div>
          )}
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
        {engine && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-surface-container border border-outline-variant/30 text-xs">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-medium text-on-surface">
              Window #{engine.currentWindowId} ({engine.timeRemainingInWindowSec}s)
            </span>
          </div>
        )}

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
            {isConnected ? 'Live Telemetry' : 'Demo Mode'}
          </span>
        </div>
      </div>
    </header>
  );
};
