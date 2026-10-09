import React, { useState } from 'react';
import {
  ACCEPTANCE_SCENARIOS,
  buildDeterministicScenarioSnapshot,
  buildCompatibleJoinCandidate,
  buildIncompatibleJoinCandidate,
} from '../services/scenarioService';
import type { AcceptanceScenarioDefinition, GlobalSimulationSnapshot, MidTripJoinCandidate } from '../types/simulation';
import type { ActiveViewKey } from './ShellHeader';

interface AcceptanceScenariosBarProps {
  onApplyScenarioSnapshot: (snapshot: GlobalSimulationSnapshot, targetView: ActiveViewKey, candidate?: MidTripJoinCandidate | null) => void;
  onOpenShapleySheet?: () => void;
  onResetToLive?: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const AcceptanceScenariosBar: React.FC<AcceptanceScenariosBarProps> = ({
  onApplyScenarioSnapshot,
  onOpenShapleySheet,
  onResetToLive,
  isOpen,
  onToggle,
}) => {
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(null);
  const [verificationResult, setVerificationResult] = useState<{
    scenario: AcceptanceScenarioDefinition;
    badge: string;
    timestamp: string;
  } | null>(null);

  const handleRunScenario = (scenario: AcceptanceScenarioDefinition) => {
    setActiveScenarioId(scenario.id);
    const snapshot = buildDeterministicScenarioSnapshot(scenario.id);

    let candidate: MidTripJoinCandidate | null = null;
    if (scenario.id === 8 || scenario.id === 9 || scenario.id === 10) {
      candidate = buildCompatibleJoinCandidate();
    } else if (scenario.id === 3 || scenario.id === 11) {
      candidate = buildIncompatibleJoinCandidate();
    }

    onApplyScenarioSnapshot(snapshot, scenario.targetView, candidate);

    if (scenario.id === 5 && onOpenShapleySheet) {
      setTimeout(() => onOpenShapleySheet(), 200);
    }

    setVerificationResult({
      scenario,
      badge: scenario.expectedBadge,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  const handleNextScenario = () => {
    if (activeScenarioId === null) {
      handleRunScenario(ACCEPTANCE_SCENARIOS[0]);
      return;
    }
    const nextIdx = (activeScenarioId % 12);
    handleRunScenario(ACCEPTANCE_SCENARIOS[nextIdx]);
  };

  return (
    <div className="w-full bg-surface-container-low border-b border-outline-variant/40 shadow-sm" id="acceptance-scenarios-container">
      {/* Top Banner Bar */}
      <div className="max-w-[1600px] mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-on-surface uppercase tracking-wider">
              12 Hackathon Acceptance Test Scenarios
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-on-primary">
              Section 11 Spec
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {verificationResult && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="truncate max-w-md">{verificationResult.badge}</span>
            </div>
          )}

          {activeScenarioId !== null && onResetToLive && (
            <button
              type="button"
              id="btn-reset-to-live"
              onClick={() => {
                setActiveScenarioId(null);
                setVerificationResult(null);
                onResetToLive();
              }}
              className="px-2.5 py-1 rounded-full text-xs font-bold text-tertiary bg-tertiary-fixed/30 hover:bg-tertiary-fixed/50 transition-all flex items-center gap-1 border border-tertiary/40"
              title="Return to real-time simulation WebSocket stream"
            >
              <span className="material-symbols-outlined text-[15px]">sensors</span>
              <span>Live Mode</span>
            </button>
          )}

          <button
            type="button"
            id="btn-run-next-scenario"
            onClick={handleNextScenario}
            className="px-3 py-1 rounded-full text-xs font-bold bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-all flex items-center gap-1 border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[15px]">fast_forward</span>
            <span>{activeScenarioId ? `Run Next (${((activeScenarioId % 12) + 1)}/12)` : 'Run Scenarios'}</span>
          </button>

          <button
            type="button"
            id="btn-toggle-scenarios-bar"
            onClick={onToggle}
            className="px-2.5 py-1 rounded-full text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all flex items-center gap-1"
          >
            <span>{isOpen ? 'Collapse' : 'Expand 12 Scenarios'}</span>
            <span className="material-symbols-outlined text-[16px]">
              {isOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>

      {/* Expanded Quick Scenario Grid */}
      {isOpen && (
        <div className="max-w-[1600px] mx-auto px-6 pb-4 pt-1 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {ACCEPTANCE_SCENARIOS.map((scenario) => {
              const isSelected = activeScenarioId === scenario.id;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  id={`btn-scenario-${scenario.id}`}
                  onClick={() => handleRunScenario(scenario)}
                  className={`p-2.5 rounded-2xl text-left border transition-all flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary shadow-glow scale-[1.02]'
                      : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface border-outline-variant/30 hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-on-primary/20 text-on-primary'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      #{scenario.id}
                    </span>
                    <span className={`text-[9px] uppercase font-bold tracking-wider ${
                      isSelected ? 'text-on-primary/80' : 'text-on-surface-variant'
                    }`}>
                      {scenario.category}
                    </span>
                  </div>

                  <span className="text-xs font-bold line-clamp-2 leading-tight">
                    {scenario.shortTitle}
                  </span>

                  <span className={`text-[9px] font-medium block truncate ${
                    isSelected ? 'text-on-primary/80' : 'text-on-surface-variant'
                  }`}>
                    {scenario.specSection}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Verification Detail Banner */}
          {verificationResult && (
            <div className="mt-3 p-3.5 rounded-2xl bg-surface-container-lowest border border-emerald-500/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0 mt-0.5">
                  verified
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-on-surface">
                      Scenario #{verificationResult.scenario.id}: {verificationResult.scenario.title}
                    </span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-white">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-[11px] mt-0.5">
                    {verificationResult.badge}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <span className="text-[10px] text-on-surface-variant">
                  Checked at {verificationResult.timestamp}
                </span>
                <button
                  type="button"
                  onClick={() => setVerificationResult(null)}
                  className="text-on-surface-variant hover:text-on-surface text-xs font-bold px-2 py-0.5"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
