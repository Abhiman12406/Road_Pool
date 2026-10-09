import { useState, useEffect } from 'react';
import { useSimulationSocket } from './services/simulationService';
import { ShellHeader, type ActiveViewKey } from './components/ShellHeader';
import { AcceptanceScenariosBar } from './components/AcceptanceScenariosBar';
import { GuidedStoryOverlay } from './components/GuidedStoryOverlay';
import type { GlobalSimulationSnapshot, MidTripJoinCandidate } from './types/simulation';
import { OpsOverviewView } from './views/ops/OpsOverviewView';
import { BatchManagerView } from './views/ops/BatchManagerView';
import { RouteOptimizationView } from './views/ops/RouteOptimizationView';
import { DetourGuaranteesView } from './views/ops/DetourGuaranteesView';
import { FairFaresView } from './views/ops/FairFaresView';
import { PassengerHomeView } from './views/passenger/PassengerHomeView';
import { PassengerWaitingView } from './views/passenger/PassengerWaitingView';
import { PassengerActiveView } from './views/passenger/PassengerActiveView';

export function App() {
  const [currentView, setCurrentView] = useState<ActiveViewKey>(() => {
    const path = window.location.pathname;
    if (path.includes('fair-fares') || path.includes('/ops/fair-fares')) return 'ops-fair-fares';
    if (path.includes('active') || path.includes('/passenger/active')) return 'passenger-active';
    if (path.includes('optimization') || path.includes('/ops/optimization')) return 'ops-optimization';
    if (path.includes('detour') || path.includes('/ops/detour-guarantees')) return 'ops-detour-guarantees';
    if (path.includes('batches') || path.includes('/ops/batches')) return 'ops-batches';
    if (path.includes('waiting') || path.includes('/passenger/waiting')) return 'passenger-waiting';
    if (path.includes('passenger')) return 'passenger-home';
    return 'ops-optimization'; // Default to operations optimization per Ticket 04
  });

  const {
    snapshot,
    isConnected,
    error,
    sendControl,
    sendSelection,
    dispatchBatchNow,
    configureBatch,
    generateDemand,
    solveOptimization,
    advanceVehicleStop,
    cancelRideRequest,
    simulateCoRiderCancellation,
    resetPassengerSession,
  } = useSimulationSocket();

  // Acceptance Scenarios & Guided Story Mode states
  const [isStoryModeOpen, setIsStoryModeOpen] = useState<boolean>(false);
  const [isScenariosBarOpen, setIsScenariosBarOpen] = useState<boolean>(true);
  const [scenarioSnapshotOverride, setScenarioSnapshotOverride] = useState<GlobalSimulationSnapshot | null>(null);
  const [activeCandidateOverride, setActiveCandidateOverride] = useState<MidTripJoinCandidate | null>(null);
  const [autoOpenShapleySheet, setAutoOpenShapleySheet] = useState<boolean>(false);

  // Sync browser history state if user clicks back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes('fair-fares')) setCurrentView('ops-fair-fares');
      else if (path.includes('active')) setCurrentView('passenger-active');
      else if (path.includes('optimization')) setCurrentView('ops-optimization');
      else if (path.includes('detour')) setCurrentView('ops-detour-guarantees');
      else if (path.includes('batches')) setCurrentView('ops-batches');
      else if (path.includes('waiting')) setCurrentView('passenger-waiting');
      else if (path.includes('passenger')) setCurrentView('passenger-home');
      else setCurrentView('ops-overview');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSwitchView = (view: ActiveViewKey) => {
    setCurrentView(view);
    const pathMap: Record<ActiveViewKey, string> = {
      'ops-overview': '/ops',
      'ops-batches': '/ops/batches',
      'ops-optimization': '/ops/optimization',
      'ops-detour-guarantees': '/ops/detour-guarantees',
      'ops-fair-fares': '/ops/fair-fares',
      'passenger-home': '/passenger/home',
      'passenger-waiting': '/passenger/waiting',
      'passenger-active': '/passenger/active',
    };
    window.history.pushState(null, '', pathMap[view]);
  };

  const handleSelectVehicle = (vehicleId: string) => {
    sendSelection(vehicleId, null);
  };

  const handleSelectRequest = (requestId: string) => {
    sendSelection(null, requestId);
  };

  // Scenario Snapshot & Story Step Handlers
  const handleApplyScenarioSnapshot = (
    newSnapshot: GlobalSimulationSnapshot,
    targetView: ActiveViewKey,
    candidate?: MidTripJoinCandidate | null
  ) => {
    setScenarioSnapshotOverride(newSnapshot);
    setActiveCandidateOverride(candidate || null);
    handleSwitchView(targetView);
  };

  const handleResetToLive = () => {
    setScenarioSnapshotOverride(null);
    setActiveCandidateOverride(null);
  };

  const handleOpenShapleySheet = () => {
    setAutoOpenShapleySheet(true);
    setTimeout(() => setAutoOpenShapleySheet(false), 500);
  };

  // When a scenario is explicitly selected, use that snapshot; otherwise use live socket snapshot
  const effectiveSnapshot = scenarioSnapshotOverride || snapshot;

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {/* 1. Global Shell Navigation Bar */}
      <ShellHeader
        currentView={currentView}
        onSwitchView={handleSwitchView}
        snapshot={effectiveSnapshot}
        isConnected={isConnected}
        isStoryModeOpen={isStoryModeOpen}
        onToggleStoryMode={() => setIsStoryModeOpen((prev) => !prev)}
        isScenariosBarOpen={isScenariosBarOpen}
        onToggleScenariosBar={() => setIsScenariosBarOpen((prev) => !prev)}
      />

      {/* 2. Quick Runner Bar for 12 Acceptance Scenarios */}
      <div className="mt-16">
        <AcceptanceScenariosBar
          isOpen={isScenariosBarOpen}
          onToggle={() => setIsScenariosBarOpen((prev) => !prev)}
          onApplyScenarioSnapshot={handleApplyScenarioSnapshot}
          onOpenShapleySheet={handleOpenShapleySheet}
          onResetToLive={handleResetToLive}
        />
      </div>

      {/* Connection Notice banner if offline and not in scenario demo override */}
      {!isConnected && (
        <div className="bg-error-container text-on-error-container px-6 py-2 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">signal_disconnected</span>
            <span>{error ? `Live stream notice: ${error}` : 'Backend live stream disconnected. Running in offline deterministic demo mode.'}</span>
          </div>
          <span className="text-[11px] underline cursor-pointer" onClick={() => window.location.reload()}>
            Retry
          </span>
        </div>
      )}

      {/* 3. Main Content View Area */}
      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
        {currentView === 'ops-overview' && (
          <OpsOverviewView
            snapshot={effectiveSnapshot}
            onControl={sendControl}
            onSelectVehicle={handleSelectVehicle}
            onSelectRequest={handleSelectRequest}
          />
        )}

        {currentView === 'ops-batches' && (
          <BatchManagerView
            snapshot={effectiveSnapshot}
            onDispatchNow={dispatchBatchNow}
            onConfigureBatch={configureBatch}
            onGenerateDemand={generateDemand}
            onSelectRequest={handleSelectRequest}
            onSelectVehicle={handleSelectVehicle}
          />
        )}

        {currentView === 'ops-optimization' && (
          <RouteOptimizationView
            snapshot={effectiveSnapshot}
            onSelectVehicle={handleSelectVehicle}
            onSelectRequest={handleSelectRequest}
            onSolveOptimization={solveOptimization}
          />
        )}

        {currentView === 'ops-detour-guarantees' && (
          <DetourGuaranteesView
            snapshot={effectiveSnapshot}
            onSelectVehicle={handleSelectVehicle}
            onSelectRequest={handleSelectRequest}
          />
        )}

        {currentView === 'ops-fair-fares' && (
          <FairFaresView
            snapshot={effectiveSnapshot}
            onSelectVehicle={handleSelectVehicle}
            onSelectRequest={handleSelectRequest}
          />
        )}

        {currentView === 'passenger-home' && (
          <PassengerHomeView
            snapshot={effectiveSnapshot}
            onSelectVehicle={handleSelectVehicle}
            onSelectRequest={handleSelectRequest}
            onNavigateToWaiting={() => handleSwitchView('passenger-waiting')}
          />
        )}

        {currentView === 'passenger-waiting' && (
          <PassengerWaitingView
            snapshot={effectiveSnapshot}
            onDispatchNow={dispatchBatchNow}
            onBackToBooking={() => handleSwitchView('passenger-home')}
            onSelectVehicle={handleSelectVehicle}
            onSelectRequest={handleSelectRequest}
            onNavigateToActive={() => handleSwitchView('passenger-active')}
            onCancelRide={cancelRideRequest}
          />
        )}

        {currentView === 'passenger-active' && (
          <PassengerActiveView
            snapshot={effectiveSnapshot}
            onSelectVehicle={handleSelectVehicle}
            onSelectRequest={handleSelectRequest}
            onNavigateToBooking={() => handleSwitchView('passenger-home')}
            onAdvanceStop={advanceVehicleStop}
            onCancelRide={cancelRideRequest}
            onSimulateCoRiderCancellation={simulateCoRiderCancellation}
            onResetSession={resetPassengerSession}
            initialCandidate={activeCandidateOverride}
            autoOpenShapleySheet={autoOpenShapleySheet}
          />
        )}
      </main>

      {/* 4. Global Interactive Guided Story Mode Wizard Overlay */}
      <GuidedStoryOverlay
        isOpen={isStoryModeOpen}
        onToggle={() => setIsStoryModeOpen((prev) => !prev)}
        onApplyScenarioSnapshot={handleApplyScenarioSnapshot}
        onOpenShapleySheet={handleOpenShapleySheet}
      />
    </div>
  );
}

export default App;
