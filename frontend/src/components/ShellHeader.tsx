import React from 'react';
import type { GlobalSimulationSnapshot } from '../types/simulation';

export type ActiveViewKey =
  | 'guided-story'
  | 'passenger-home'
  | 'passenger-waiting'
  | 'ops-overview'
  | 'ops-batches'
  | 'ops-optimization'
  | 'ops-detour-guarantees';

interface ShellHeaderProps {
  currentView: ActiveViewKey;
  onSwitchView: (view: ActiveViewKey) => void;
  snapshot: GlobalSimulationSnapshot | null;
  isConnected: boolean;
}

export const ShellHeader: React.FC<ShellHeaderProps> = ({
  currentView,
  onSwitchView,
  snapshot,
  isConnected,
}) => {
  const engine = snapshot?.engine;

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

      {/* 4. Right Status & Quick Telemetry Indicator */}
      <div className="flex items-center gap-3">
        {/* Rolling Window Mini Badge */}
        {engine && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-surface-container border border-outline-variant/30 text-xs">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-medium text-on-surface">
              Window #{engine.currentWindowId} ({engine.timeRemainingInWindowSec}s)
            </span>
          </div>
        )}

        {/* Live Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-surface-container border border-outline-variant/30 text-xs">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-tertiary' : 'bg-secondary'}`}></span>
          <span className="font-semibold text-on-surface">
            {isConnected ? 'Live Telemetry' : 'Demo Mode'}
          </span>
        </div>
      </div>
    </header>
  );
};
