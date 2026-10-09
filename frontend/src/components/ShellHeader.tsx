import React from 'react';
import type { GlobalSimulationSnapshot } from '../types/simulation';

interface ShellHeaderProps {
  currentView: 'ops' | 'passenger';
  onSwitchView: (view: 'ops' | 'passenger') => void;
  snapshot: GlobalSimulationSnapshot | null;
  isConnected: boolean;
}

export const ShellHeader: React.FC<ShellHeaderProps> = ({
  currentView,
  onSwitchView,
  snapshot,
  isConnected,
}) => {
  const kpis = snapshot?.kpis;
  const engine = snapshot?.engine;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-xl z-50 border-b border-outline-variant/30 px-6 flex items-center justify-between">
      {/* Brand & Archetype Switcher */}
      <div className="flex items-center gap-6">
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
            onClick={() => onSwitchView('ops')}
            className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${
              currentView === 'ops'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Operations Console
          </button>
          <button
            onClick={() => onSwitchView('passenger')}
            className={`px-4 py-1 rounded-full text-xs font-semibold transition-all ${
              currentView === 'passenger'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Passenger App
          </button>
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

      {/* Right status & live pulse */}
      <div className="flex items-center gap-3">
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
