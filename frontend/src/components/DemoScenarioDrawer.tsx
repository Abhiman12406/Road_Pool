import React, { useState, useEffect } from 'react';
import {
  ACCEPTANCE_SCENARIOS,
  buildDeterministicScenarioSnapshot,
  buildCompatibleJoinCandidate,
  buildIncompatibleJoinCandidate,
} from '../services/scenarioService';
import type { AcceptanceScenarioDefinition, GlobalSimulationSnapshot, MidTripJoinCandidate } from '../types/simulation';
import type { ActiveViewKey } from './ShellHeader';

interface DemoScenarioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScenarioSnapshot: (
    snapshot: GlobalSimulationSnapshot,
    targetView: ActiveViewKey,
    candidate?: MidTripJoinCandidate | null
  ) => void;
  onOpenShapleySheet?: () => void;
  onResetToLive?: () => void;
  onLaunchStoryMode?: () => void;
  // Simulation actions that evaluators can trigger directly
  onAdvanceStop?: (vehicleId: string) => Promise<any>;
  onSimulateCoRiderCancellation?: (vehicleId: string) => Promise<any>;
  onSimulateCompatibleJoiner?: () => void;
  onSimulateIncompatibleJoiner?: () => void;
  onResetSession?: () => Promise<any>;
  activeVehicleId?: string;
  isLiveMode?: boolean;
}

export const DemoScenarioDrawer: React.FC<DemoScenarioDrawerProps> = ({
  isOpen,
  onClose,
  onApplyScenarioSnapshot,
  onOpenShapleySheet,
  onResetToLive,
  onLaunchStoryMode,
  onAdvanceStop,
  onSimulateCoRiderCancellation,
  onSimulateCompatibleJoiner,
  onSimulateIncompatibleJoiner,
  onResetSession,
  activeVehicleId = 'V-101',
  isLiveMode = true,
}) => {
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'scenarios' | 'simulator'>('scenarios');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [verificationResult, setVerificationResult] = useState<{
    scenario: AcceptanceScenarioDefinition;
    badge: string;
    timestamp: string;
  } | null>(null);
  const [simActionPending, setSimActionPending] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    const nextIdx = activeScenarioId === null ? 0 : (activeScenarioId % 12);
    handleRunScenario(ACCEPTANCE_SCENARIOS[nextIdx]);
  };

  const handleResetToLiveStream = () => {
    setActiveScenarioId(null);
    setVerificationResult(null);
    if (onResetToLive) onResetToLive();
  };

  const filteredScenarios = ACCEPTANCE_SCENARIOS.filter((s) => {
    if (categoryFilter === 'all') return true;
    return s.category.toLowerCase().includes(categoryFilter.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Demo and Scenarios Drawer">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white border-l border-slate-200 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Demo & Verification Console</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700 font-mono">
                    Section 11
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  12 Deterministic Acceptance Tests & Simulation Triggers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
                aria-label="Close drawer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Mode Tab Switcher */}
          <div className="px-5 pt-3 pb-2 border-b border-slate-200 flex items-center justify-between gap-2 bg-white">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('scenarios')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'scenarios'
                    ? 'bg-white text-slate-900 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                12 Acceptance Scenarios
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('simulator')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'simulator'
                    ? 'bg-white text-slate-900 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Simulation Triggers
              </button>
            </div>

            <div className="flex items-center gap-2">
              {activeScenarioId !== null && (
                <button
                  type="button"
                  id="btn-reset-to-live"
                  onClick={handleResetToLiveStream}
                  className="px-2.5 py-1 rounded text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">sensors</span>
                  <span>Reset to Live</span>
                </button>
              )}
              {activeTab === 'scenarios' && (
                <button
                  type="button"
                  id="btn-run-next-scenario"
                  onClick={handleNextScenario}
                  className="px-2.5 py-1 rounded text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">fast_forward</span>
                  <span>{activeScenarioId ? `Next (${(activeScenarioId % 12) + 1}/12)` : 'Run First'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Verification Toast in Drawer */}
          {verificationResult && (
            <div className="m-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-950">
                        Scenario #{verificationResult.scenario.id}: {verificationResult.scenario.title}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                        PASSED
                      </span>
                    </div>
                    <p className="text-emerald-800 font-mono text-[11px] mt-0.5">
                      {verificationResult.badge}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVerificationResult(null)}
                  className="text-emerald-700 hover:text-emerald-900 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === 'scenarios' ? (
              <>
                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 text-xs pb-1 overflow-x-auto">
                  {['all', 'dispatch', 'routing', 'shapley', 'dynamic', 'edge'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                        categoryFilter === cat
                          ? 'bg-slate-900 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Scenarios Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredScenarios.map((scenario) => {
                    const isSelected = activeScenarioId === scenario.id;
                    return (
                      <button
                        key={scenario.id}
                        type="button"
                        id={`btn-scenario-${scenario.id}`}
                        onClick={() => handleRunScenario(scenario)}
                        className={`p-3 rounded-lg text-left border transition-all flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            #{scenario.id}
                          </span>
                          <span
                            className={`text-[9px] uppercase font-bold tracking-wider ${
                              isSelected ? 'text-slate-300' : 'text-slate-400'
                            }`}
                          >
                            {scenario.category}
                          </span>
                        </div>

                        <span className="text-xs font-semibold leading-snug">
                          {scenario.shortTitle}
                        </span>

                        <span
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {scenario.specSection}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Simulation Triggers Tab */
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <p className="font-semibold text-slate-900 mb-1">
                    Direct Simulation Controls
                  </p>
                  <p>
                    Trigger real-time state changes on active vehicle{' '}
                    <span className="font-mono font-bold text-slate-900">{activeVehicleId}</span>{' '}
                    without cluttering the passenger view with test buttons.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Stop Progression & Timing
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (onAdvanceStop) {
                        setSimActionPending('advance');
                        try {
                          await onAdvanceStop(activeVehicleId);
                        } finally {
                          setSimActionPending(null);
                        }
                      }
                    }}
                    disabled={!onAdvanceStop || simActionPending === 'advance'}
                    className="w-full p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-xs font-semibold flex items-center justify-between transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-slate-700">
                        skip_next
                      </span>
                      <span>Advance Vehicle Next Stop</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {simActionPending === 'advance' ? 'Advancing...' : 'V-101'}
                    </span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Mid-Trip Co-Rider Join Injections
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSimulateCompatibleJoiner) onSimulateCompatibleJoiner();
                      onClose();
                    }}
                    className="w-full p-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-semibold flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-emerald-700">
                        person_add
                      </span>
                      <span>Inject Compatible Joiner (Detour ≤ 15%)</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-800">
                      Eligible
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSimulateIncompatibleJoiner) onSimulateIncompatibleJoiner();
                      onClose();
                    }}
                    className="w-full p-3 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-950 text-xs font-semibold flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-rose-700">
                        block
                      </span>
                      <span>Inject Incompatible Joiner (Detour &gt; 15%)</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-800">
                      Rejected
                    </span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Dynamic Cancellation & Rebalancing
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (onSimulateCoRiderCancellation) {
                        setSimActionPending('corider_cancel');
                        try {
                          await onSimulateCoRiderCancellation(activeVehicleId);
                        } finally {
                          setSimActionPending(null);
                        }
                      }
                    }}
                    disabled={!onSimulateCoRiderCancellation || simActionPending === 'corider_cancel'}
                    className="w-full p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-semibold flex items-center justify-between transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-amber-700">
                        person_remove
                      </span>
                      <span>Simulate Co-Rider Cancellation (Mid-Trip)</span>
                    </div>
                    <span className="text-[11px] text-amber-800 font-mono">
                      {simActionPending === 'corider_cancel' ? 'Rebalancing...' : 'Seat Released'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (onResetSession) {
                        setSimActionPending('reset');
                        try {
                          await onResetSession();
                        } finally {
                          setSimActionPending(null);
                        }
                      }
                    }}
                    disabled={!onResetSession || simActionPending === 'reset'}
                    className="w-full p-3 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-between transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-slate-700">
                        restart_alt
                      </span>
                      <span>Reset Passenger Session</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {simActionPending === 'reset' ? 'Resetting...' : 'Fresh State'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="font-medium">
                {isLiveMode ? 'Connected to Simulation' : 'Viewing Scenario Override'}
              </span>
            </div>
            {onLaunchStoryMode && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLaunchStoryMode();
                }}
                className="text-slate-900 hover:underline font-bold flex items-center gap-1"
              >
                <span>Guided Story Walkthrough</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
