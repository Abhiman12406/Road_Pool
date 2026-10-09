import { useState, useEffect } from 'react';
import { useSimulationSocket } from './services/simulationService';
import { ShellHeader, type ActiveViewKey } from './components/ShellHeader';
import { GuidedStoryView } from './views/story/GuidedStoryView';
import { DemoScenarioDrawer } from './components/DemoScenarioDrawer';
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
    if (path.includes('story') || path === '/story') return 'guided-story';
    if (path.includes('fair-fares') || path.includes('/ops/fair-fares')) return 'ops-fair-fares';
    if (path.includes('active') || path.includes('/passenger/active')) return 'passenger-active';
    if (path.includes('optimization') || path.includes('/ops/optimization')) return 'ops-optimization';
    if (path.includes('detour') || path.includes('/ops/detour-guarantees')) return 'ops-detour-guarantees';
    if (path.includes('batches') || path.includes('/ops/batches')) return 'ops-batches';
    if (path.includes('waiting') || path.includes('/passenger/waiting')) return 'passenger-waiting';
    if (path.includes('passenger') || path.includes('/passenger/home')) return 'passenger-home';
    if (path.includes('/ops')) return 'ops-overview';
    // Default to friendly Guided Story walkthrough
    return 'guided-story';
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
  const [isDemoDrawerOpen, setIsDemoDrawerOpen] = useState<boolean>(false);
  const [scenarioSnapshotOverride, setScenarioSnapshotOverride] = useState<GlobalSimulationSnapshot | null>(null);
  const [activeCandidateOverride, setActiveCandidateOverride] = useState<MidTripJoinCandidate | null>(null);
  const [autoOpenShapleySheet, setAutoOpenShapleySheet] = useState<boolean>(false);

  // Keyboard shortcut: Press 'D' (when not in an input/textarea) to toggle Demo Scenario Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          setIsDemoDrawerOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync browser history state if user clicks back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes('story')) setCurrentView('guided-story');
      else if (path.includes('fair-fares')) setCurrentView('ops-fair-fares');
      else if (path.includes('active')) setCurrentView('passenger-active');
      else if (path.includes('optimization')) setCurrentView('ops-optimization');
      else if (path.includes('detour')) setCurrentView('ops-detour-guarantees');
      else if (path.includes('batches')) setCurrentView('ops-batches');
      else if (path.includes('waiting')) setCurrentView('passenger-waiting');
      else if (path.includes('passenger')) setCurrentView('passenger-home');
      else if (path.includes('/ops')) setCurrentView('ops-overview');
      else setCurrentView('guided-story');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSwitchView = (view: ActiveViewKey) => {
    setCurrentView(view);
    const pathMap: Record<ActiveViewKey, string> = {
      'guided-story': '/story',
      'ops-overview': '/ops',
      'ops-batches': '/ops/batches',
      'ops-optimization': '/ops/optimization',
      'ops-detour-guarantees': '/ops/detour-guarantees',
      'ops-fair-fares': '/ops/fair-fares',
      'passenger-home': '/passenger/home',
      'passenger-waiting': '/passenger/waiting',
      'passenger-active': '/passenger/active',
    };
    window.history.pushState(null, '', pathMap[view] || '/');
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
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans selection:bg-slate-200">
      {/* 1. Global Shell Navigation Bar */}
      <ShellHeader
        currentView={currentView}
        onSwitchView={handleSwitchView}
        snapshot={effectiveSnapshot}
        isConnected={isConnected}
        isStoryModeOpen={isStoryModeOpen}
        onToggleStoryMode={() => setIsStoryModeOpen((prev) => !prev)}
        isScenariosBarOpen={isDemoDrawerOpen}
        onToggleScenariosBar={() => setIsDemoDrawerOpen((prev) => !prev)}
        onOpenDemoDrawer={() => setIsDemoDrawerOpen(true)}
      />

      {/* Connection Notice banner if offline and not in scenario demo override */}
      {!isConnected && (
        <div className="mt-14 bg-amber-50 border-b border-amber-200 text-amber-900 px-6 py-2 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-amber-700">sensors_off</span>
            <span>{error ? `Live stream notice: ${error}` : 'Simulation running with built-in Pune benchmark scenarios & fallback estimates.'}</span>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-[11px] font-bold text-slate-900 hover:underline"
          >
            Reconnect Live Stream
          </button>
        </div>
      )}

      {/* 2. Main Content View Area */}
      <main className={`flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto ${isConnected ? 'mt-14' : ''}`}>
        {currentView === 'guided-story' && (
          <GuidedStoryView
            snapshot={effectiveSnapshot}
            onNavigateToView={(target) => handleSwitchView(target)}
          />
        )}
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

      {/* 3. Global Demo Scenarios & Simulation Drawer (On-demand slide-over) */}
      <DemoScenarioDrawer
        isOpen={isDemoDrawerOpen}
        onClose={() => setIsDemoDrawerOpen(false)}
        onApplyScenarioSnapshot={handleApplyScenarioSnapshot}
        onOpenShapleySheet={handleOpenShapleySheet}
        onResetToLive={handleResetToLive}
        onLaunchStoryMode={() => setIsStoryModeOpen(true)}
        onAdvanceStop={advanceVehicleStop}
        onSimulateCoRiderCancellation={simulateCoRiderCancellation}
        onResetSession={resetPassengerSession}
        isLiveMode={scenarioSnapshotOverride === null}
      />

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
