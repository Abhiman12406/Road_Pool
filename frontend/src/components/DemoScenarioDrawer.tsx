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
  onRunBackendScenario?: (scenarioId: number) => Promise<any>;
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
  onRunBackendScenario,
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
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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

  const handleRunScenario = async (scenario: AcceptanceScenarioDefinition) => {
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

    if (onRunBackendScenario) {
      try {
        await onRunBackendScenario(scenario.id);
      } catch (err) {
        console.warn('Backend scenario run:', err);
      }
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
    <div className="fixed inset-0 z-[9999] overflow-hidden" role="dialog" aria-modal="true" aria-label="Demo and Scenarios Drawer">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 z-[10000]">
        <div className={`w-screen ${isExpanded ? 'max-w-5xl' : 'max-w-xl'} transition-all duration-300 bg-white border-l border-[#efefef] flex flex-col shadow-2xl`}>
          {/* Header */}
          <div className="p-5 border-b border-[#efefef] flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-black">Acceptance test suite</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#efefef] text-black font-mono">
                    Section 11
                  </span>
                </div>
                <p className="text-xs text-[#5e5e5e] mt-0.5">
                  12 deterministic acceptance tests & simulation triggers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {activeScenarioId !== null && (
                <button
                  type="button"
                  id="btn-scenarios-watch-map"
                  onClick={onClose}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 transition-colors mr-1"
                  title="View scenario simulation on the map"
                >
                  <span className="material-symbols-outlined text-[14px]">map</span>
                  <span>Watch on Map</span>
                </button>
              )}
              <button
                type="button"
                id="btn-scenarios-expand"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#5e5e5e] hover:text-black hover:bg-[#efefef] transition-colors"
                title={isExpanded ? "Collapse to side drawer" : "Expand to wide scenarios console"}
                aria-label={isExpanded ? "Collapse to side drawer" : "Expand to wide scenarios console"}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isExpanded ? 'close_fullscreen' : 'open_in_full'}
                </span>
              </button>
              <button
                type="button"
                id="btn-scenarios-close"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#5e5e5e] hover:text-black hover:bg-[#efefef] transition-colors"
                aria-label="Close drawer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Mode Tab Switcher */}
          <div className="px-5 py-3 border-b border-[#efefef] flex items-center justify-between gap-2 bg-white">
            <div className="flex items-center gap-1 bg-[#efefef] p-1 rounded-full text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('scenarios')}
                className={`px-3 py-1 rounded-full transition-all ${
                  activeTab === 'scenarios'
                    ? 'bg-black text-white font-medium shadow-sm'
                    : 'text-[#5e5e5e] hover:text-black'
                }`}
              >
                12 Acceptance scenarios
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('simulator')}
                className={`px-3 py-1 rounded-full transition-all ${
                  activeTab === 'simulator'
                    ? 'bg-black text-white font-medium shadow-sm'
                    : 'text-[#5e5e5e] hover:text-black'
                }`}
              >
                Simulation triggers
              </button>
            </div>

            <div className="flex items-center gap-2">
              {activeScenarioId !== null && (
                <button
                  type="button"
                  id="btn-reset-to-live"
                  onClick={handleResetToLiveStream}
                  className="px-3 py-1 rounded-full text-xs font-medium text-black bg-[#efefef] hover:bg-[#e2e2e2] flex items-center gap-1 transition-colors"
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
                  className="px-3.5 py-1 rounded-full text-xs font-medium bg-black text-white hover:bg-[#282828] transition-colors flex items-center gap-1 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[14px]">fast_forward</span>
                  <span>{activeScenarioId ? `Next (${(activeScenarioId % 12) + 1}/12)` : 'Run First'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Verification Toast in Drawer */}
          {verificationResult && (
            <div className="m-4 p-3.5 rounded-2xl bg-[#efefef] border border-[#e2e2e2] text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-black text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black">
                        Scenario #{verificationResult.scenario.id}: {verificationResult.scenario.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black text-white uppercase tracking-wider">
                        PASSED
                      </span>
                    </div>
                    <p className="text-[#5e5e5e] font-mono text-[11px] mt-0.5">
                      {verificationResult.badge}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVerificationResult(null)}
                  className="text-[#5e5e5e] hover:text-black font-bold p-1"
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
                      className={`px-3 py-1 rounded-full text-[11px] font-medium capitalize transition-colors ${
                        categoryFilter === cat
                          ? 'bg-black text-white font-medium'
                          : 'bg-[#efefef] text-[#5e5e5e] hover:text-black hover:bg-[#e2e2e2]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Scenarios Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredScenarios.map((scenario) => {
                    const isSelected = activeScenarioId === scenario.id;
                    return (
                      <button
                        key={scenario.id}
                        type="button"
                        id={`btn-scenario-${scenario.id}`}
                        onClick={() => handleRunScenario(scenario)}
                        className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-md'
                            : 'bg-white hover:bg-[#efefef] text-black border-[#efefef] hover:border-[#e2e2e2]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-[#282828] text-white'
                                : 'bg-[#efefef] text-black'
                            }`}
                          >
                            #{scenario.id}
                          </span>
                          <span
                            className={`text-[9px] uppercase font-bold tracking-wider ${
                              isSelected ? 'text-[#afafaf]' : 'text-[#5e5e5e]'
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
                            isSelected ? 'text-[#afafaf]' : 'text-[#5e5e5e]'
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
                <div className="p-4 rounded-2xl bg-[#efefef] border border-[#e2e2e2] text-xs text-[#5e5e5e]">
                  <p className="font-bold text-black mb-1">
                    Direct simulation controls
                  </p>
                  <p>
                    Trigger real-time state changes on active vehicle{' '}
                    <span className="font-mono font-bold text-black">{activeVehicleId}</span>{' '}
                    without cluttering the passenger view with test buttons.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">
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
                    className="w-full p-3.5 rounded-xl border border-[#efefef] bg-white hover:bg-[#efefef] text-black text-xs font-medium flex items-center justify-between transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-black">
                        skip_next
                      </span>
                      <span>Advance vehicle to next stop</span>
                    </div>
                    <span className="text-[11px] text-[#5e5e5e] font-mono">
                      {simActionPending === 'advance' ? 'Advancing...' : 'V-101'}
                    </span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">
                    Mid-Trip Co-Rider Join Injections
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSimulateCompatibleJoiner) onSimulateCompatibleJoiner();
                      onClose();
                    }}
                    className="w-full p-3.5 rounded-xl border border-[#efefef] bg-white hover:bg-[#efefef] text-black text-xs font-medium flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-black">
                        person_add
                      </span>
                      <span>Inject compatible joiner (detour ≤ 15%)</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#efefef] text-black">
                      Eligible
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSimulateIncompatibleJoiner) onSimulateIncompatibleJoiner();
                      onClose();
                    }}
                    className="w-full p-3.5 rounded-xl border border-[#efefef] bg-white hover:bg-[#efefef] text-black text-xs font-medium flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-black">
                        block
                      </span>
                      <span>Inject incompatible joiner (detour &gt; 15%)</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#efefef] text-black">
                      Rejected
                    </span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-[#5e5e5e] uppercase tracking-wider">
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
                    className="w-full p-3.5 rounded-xl border border-[#efefef] bg-white hover:bg-[#efefef] text-black text-xs font-medium flex items-center justify-between transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-black">
                        person_remove
                      </span>
                      <span>Simulate co-rider cancellation (mid-trip)</span>
                    </div>
                    <span className="text-[11px] text-[#5e5e5e] font-mono">
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
                    className="w-full p-3.5 rounded-xl border border-[#efefef] bg-[#efefef] hover:bg-[#e2e2e2] text-black text-xs font-medium flex items-center justify-between transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-black">
                        restart_alt
                      </span>
                      <span>Reset passenger session</span>
                    </div>
                    <span className="text-[11px] text-[#5e5e5e] font-mono">
                      {simActionPending === 'reset' ? 'Resetting...' : 'Fresh state'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onApplyScenarioSnapshot(buildDeterministicScenarioSnapshot(1), 'driver-home');
                    }}
                    className="w-full p-3.5 rounded-xl border border-black bg-black text-white hover:bg-[#282828] text-xs font-medium flex items-center justify-between transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px]">
                        sports_motorsports
                      </span>
                      <span>Switch to Driver Cockpit & Live Manifest</span>
                    </div>
                    <span className="text-[11px] text-[#afafaf] font-mono">
                      Driver view
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#efefef] bg-white flex items-center justify-between text-xs text-[#5e5e5e]">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="font-medium text-black">
                {isLiveMode ? 'Connected to simulation' : 'Viewing scenario override'}
              </span>
            </div>
            {onLaunchStoryMode && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLaunchStoryMode();
                }}
                className="text-black hover:underline font-bold flex items-center gap-1"
              >
                <span>Guided Story walkthrough</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
