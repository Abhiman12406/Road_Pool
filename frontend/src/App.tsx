import { useState, useEffect } from 'react';
import { useSimulationSocket } from './services/simulationService';
import { ShellHeader, type ActiveViewKey } from './components/ShellHeader';
import { DemoScenarioDrawer } from './components/DemoScenarioDrawer';
import type { GlobalSimulationSnapshot, MidTripJoinCandidate } from './types/simulation';
import { AuthProvider } from './context/AuthContext';
import { LandingPageView } from './views/LandingPageView';
import { LoginView } from './views/auth/LoginView';
import { SignUpView } from './views/auth/SignUpView';
import { OpsOverviewView } from './views/ops/OpsOverviewView';
import { BatchManagerView } from './views/ops/BatchManagerView';
import { RouteOptimizationView } from './views/ops/RouteOptimizationView';
import { DetourGuaranteesView } from './views/ops/DetourGuaranteesView';
import { FairFaresView } from './views/ops/FairFaresView';
import { PassengerHomeView } from './views/passenger/PassengerHomeView';
import { PassengerWaitingView } from './views/passenger/PassengerWaitingView';
import { PassengerActiveView } from './views/passenger/PassengerActiveView';
import { DriverHomeView } from './views/driver/DriverHomeView';
import { DriverTripsView } from './views/driver/DriverTripsView';
import { DriverActivityView } from './views/driver/DriverActivityView';
import { DriverProfileView } from './views/driver/DriverProfileView';
import { DriverSidebar } from './components/driver/DriverSidebar';
import { DriverTopHeader } from './components/driver/DriverTopHeader';

export function App() {
  const [currentView, setCurrentView] = useState<ActiveViewKey>(() => {
    const path = window.location.pathname;
    if (path.includes('login')) return 'login';
    if (path.includes('signup')) return 'signup';
    if (path.includes('fair-fares') || path.includes('/ops/fair-fares')) return 'ops-fair-fares';
    if (path.includes('active') || path.includes('/passenger/active')) return 'passenger-active';
    if (path.includes('optimization') || path.includes('/ops/optimization')) return 'ops-optimization';
    if (path.includes('detour') || path.includes('/ops/detour-guarantees')) return 'ops-detour-guarantees';
    if (path.includes('batches') || path.includes('/ops/batches')) return 'ops-batches';
    if (path.includes('waiting') || path.includes('/passenger/waiting')) return 'passenger-waiting';
    if (path.includes('passenger') || path.includes('/passenger/home')) return 'passenger-home';
    if (path.includes('driver/trips')) return 'driver-trips';
    if (path.includes('driver/activity')) return 'driver-activity';
    if (path.includes('driver/profile')) return 'driver-profile';
    if (path.includes('driver')) return 'driver-home';
    if (path.includes('/ops')) return 'ops-overview';
    // Default to Landing Page
    return 'landing';
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

  // Driver Cockpit state
  const [isDriverOnline, setIsDriverOnline] = useState<boolean>(true);
  const [selectedDriverVehicleId, setSelectedDriverVehicleId] = useState<string>('V-101');

  // Acceptance Scenarios states
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
      if (path.includes('login')) setCurrentView('login');
      else if (path.includes('signup')) setCurrentView('signup');
      else if (path.includes('fair-fares')) setCurrentView('ops-fair-fares');
      else if (path.includes('active')) setCurrentView('passenger-active');
      else if (path.includes('optimization')) setCurrentView('ops-optimization');
      else if (path.includes('detour')) setCurrentView('ops-detour-guarantees');
      else if (path.includes('batches')) setCurrentView('ops-batches');
      else if (path.includes('waiting')) setCurrentView('passenger-waiting');
      else if (path.includes('passenger')) setCurrentView('passenger-home');
      else if (path.includes('driver/trips')) setCurrentView('driver-trips');
      else if (path.includes('driver/activity')) setCurrentView('driver-activity');
      else if (path.includes('driver/profile')) setCurrentView('driver-profile');
      else if (path.includes('driver')) setCurrentView('driver-home');
      else if (path.includes('/ops')) setCurrentView('ops-overview');
      else setCurrentView('landing');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSwitchView = (view: ActiveViewKey) => {
    setCurrentView(view);
    const pathMap: Record<ActiveViewKey, string> = {
      'landing': '/',
      'login': '/login',
      'signup': '/signup',
      'ops-overview': '/ops',
      'ops-batches': '/ops/batches',
      'ops-optimization': '/ops/optimization',
      'ops-detour-guarantees': '/ops/detour-guarantees',
      'ops-fair-fares': '/ops/fair-fares',
      'passenger-home': '/passenger/home',
      'passenger-waiting': '/passenger/waiting',
      'passenger-active': '/passenger/active',
      'driver-home': '/driver/home',
      'driver-trips': '/driver/trips',
      'driver-activity': '/driver/activity',
      'driver-profile': '/driver/profile',
    };
    window.history.pushState(null, '', pathMap[view] || '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleToggleDemoDrawer = () => {
    setIsDemoDrawerOpen((prev) => !prev);
  };

  const handleOpenDemoDrawer = () => {
    setIsDemoDrawerOpen(true);
  };

  // When a scenario is explicitly selected, use that snapshot; otherwise use live socket snapshot
  const effectiveSnapshot = scenarioSnapshotOverride || snapshot;
  const isDriver = currentView.startsWith('driver');
  const isStandalonePage = currentView === 'landing' || currentView === 'login' || currentView === 'signup';

  return (
    <AuthProvider>
      <div className="min-h-screen bg-white text-black flex flex-col font-sans selection:bg-[#efefef]">
        {/* 1. Global Shell Navigation Bar */}
        <ShellHeader
          currentView={currentView}
          onSwitchView={handleSwitchView}
          snapshot={effectiveSnapshot}
          isConnected={isConnected}
          isScenariosBarOpen={isDemoDrawerOpen}
          onToggleScenariosBar={handleToggleDemoDrawer}
          onOpenDemoDrawer={handleOpenDemoDrawer}
        />

        {/* Connection Notice banner if offline and not in scenario demo override, only on dashboard views */}
        {!isConnected && !isStandalonePage && (
          <div className="mt-16 bg-[#efefef] border-b border-[#e2e2e2] text-black px-6 py-2 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-black">sensors_off</span>
              <span>{error ? `Live stream notice: ${error}` : 'Simulation running with built-in Pune benchmark scenarios & fallback estimates.'}</span>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-[11px] font-bold text-black hover:underline"
            >
              Reconnect Live Stream
            </button>
          </div>
        )}

        {/* 2. Main Content View Area */}
        <div className={`flex-1 flex flex-col ${isStandalonePage ? 'mt-16' : ''}`}>
          {currentView === 'landing' && (
            <LandingPageView onNavigate={handleSwitchView} />
          )}

          {currentView === 'login' && (
            <LoginView onNavigate={handleSwitchView} />
          )}

          {currentView === 'signup' && (
            <SignUpView onNavigate={handleSwitchView} />
          )}

          {!isStandalonePage && (
            <main className={`flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto ${isConnected ? 'mt-16' : ''}`}>
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

              {/* Driver Cockpit Workspace */}
              {isDriver && (
                <div className="flex flex-col md:flex-row min-h-[calc(100vh-5rem)] -m-4 sm:-m-6 bg-[#f8f8f8]">
                  <div className="hidden md:block">
                    <DriverSidebar
                      currentView={currentView}
                      onSwitchView={handleSwitchView}
                      isOnline={isDriverOnline}
                      onToggleOnline={() => setIsDriverOnline((prev) => !prev)}
                    />
                  </div>
                  <div className="flex-1 flex flex-col min-w-0 bg-[#f8f8f8]">
                    <DriverTopHeader
                      isOnline={isDriverOnline}
                      onToggleOnline={() => setIsDriverOnline((prev) => !prev)}
                      selectedVehicleId={selectedDriverVehicleId}
                      onSelectVehicleId={setSelectedDriverVehicleId}
                      vehicles={effectiveSnapshot?.vehicles || {}}
                      onNavigateToView={handleSwitchView}
                    />
                    <div className="p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
                      {currentView === 'driver-home' && (
                        <DriverHomeView
                          snapshot={effectiveSnapshot}
                          isOnline={isDriverOnline}
                          onToggleOnline={() => setIsDriverOnline((prev) => !prev)}
                          selectedVehicleId={selectedDriverVehicleId}
                          onSelectVehicleId={setSelectedDriverVehicleId}
                          onAdvanceStop={advanceVehicleStop}
                          onNavigateToView={handleSwitchView}
                        />
                      )}
                      {currentView === 'driver-trips' && <DriverTripsView />}
                      {currentView === 'driver-activity' && <DriverActivityView />}
                      {currentView === 'driver-profile' && <DriverProfileView />}
                    </div>
                  </div>
                </div>
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
          )}
        </div>

        {/* 3. Global Demo Scenarios & Simulation Drawer */}
        <DemoScenarioDrawer
          isOpen={isDemoDrawerOpen}
          onClose={() => setIsDemoDrawerOpen(false)}
          onApplyScenarioSnapshot={handleApplyScenarioSnapshot}
          onOpenShapleySheet={handleOpenShapleySheet}
          onResetToLive={handleResetToLive}
          onAdvanceStop={advanceVehicleStop}
          onSimulateCoRiderCancellation={simulateCoRiderCancellation}
          onResetSession={resetPassengerSession}
          isLiveMode={scenarioSnapshotOverride === null}
        />
      </div>
    </AuthProvider>
  );
}

export default App;
