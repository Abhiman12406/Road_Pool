import { useState, useEffect } from 'react';
import { useSimulationSocket } from './services/simulationService';
import { ShellHeader, type ActiveViewKey } from './components/ShellHeader';
import { OpsOverviewView } from './views/ops/OpsOverviewView';
import { BatchManagerView } from './views/ops/BatchManagerView';
import { RouteOptimizationView } from './views/ops/RouteOptimizationView';
import { DetourGuaranteesView } from './views/ops/DetourGuaranteesView';
import { PassengerHomeView } from './views/passenger/PassengerHomeView';
import { PassengerWaitingView } from './views/passenger/PassengerWaitingView';
import { PassengerActiveView } from './views/passenger/PassengerActiveView';

export function App() {
  const [currentView, setCurrentView] = useState<ActiveViewKey>(() => {
    const path = window.location.pathname;
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
  } = useSimulationSocket();

  // Sync browser history state if user clicks back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes('active')) setCurrentView('passenger-active');
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

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {/* 1. Global Shell Navigation Bar */}
      <ShellHeader
        currentView={currentView}
        onSwitchView={handleSwitchView}
        snapshot={snapshot}
        isConnected={isConnected}
      />

      {/* Connection Notice banner if offline */}
      {!isConnected && (
        <div className="mt-16 bg-error-container text-on-error-container px-6 py-2 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">signal_disconnected</span>
            <span>{error ? `Live stream notice: ${error}` : 'Connecting to backend live simulation stream (ws://localhost:8000/ws/live)...'}</span>
          </div>
          <span className="text-[11px] underline cursor-pointer" onClick={() => window.location.reload()}>
            Retry
          </span>
        </div>
      )}

      {/* 2. Main Content View Area */}
      <main className={`flex-1 p-6 max-w-[1600px] w-full mx-auto ${isConnected ? 'mt-16' : 'mt-2'}`}>
        {currentView === 'ops-overview' && (
          <OpsOverviewView
            snapshot={snapshot}
            onControl={sendControl}
            onSelectVehicle={handleSelectVehicle}
            onSelectRequest={handleSelectRequest}
          />
        )}

        {currentView === 'ops-batches' && (
          <BatchManagerView
            snapshot={snapshot}
            onDispatchNow={dispatchBatchNow}
            onConfigureBatch={configureBatch}
            onGenerateDemand={generateDemand}
            onSelectRequest={handleSelectRequest}
            onSelectVehicle={handleSelectVehicle}
          />
        )}

        {currentView === 'ops-optimization' && (
          <RouteOptimizationView
            snapshot={snapshot}
            onSelectVehicle={handleSelectVehicle}
            onSelectRequest={handleSelectRequest}
            onSolveOptimization={solveOptimization}
          />
        )}

        {currentView === 'ops-detour-guarantees' && (
          <DetourGuaranteesView
            snapshot={snapshot}
            onSelectVehicle={handleSelectVehicle}
            onSelectRequest={handleSelectRequest}
          />
        )}

        {currentView === 'passenger-home' && (
          <PassengerHomeView
            snapshot={snapshot}
            onSelectVehicle={handleSelectVehicle}
            onSelectRequest={handleSelectRequest}
            onNavigateToWaiting={() => handleSwitchView('passenger-waiting')}
          />
        )}

        {currentView === 'passenger-waiting' && (
          <PassengerWaitingView
            snapshot={snapshot}
            onDispatchNow={dispatchBatchNow}
            onBackToBooking={() => handleSwitchView('passenger-home')}
            onSelectVehicle={handleSelectVehicle}
            onSelectRequest={handleSelectRequest}
            onNavigateToActive={() => handleSwitchView('passenger-active')}
          />
        )}

        {currentView === 'passenger-active' && (
          <PassengerActiveView
            snapshot={snapshot}
            onSelectVehicle={handleSelectVehicle}
            onSelectRequest={handleSelectRequest}
            onNavigateToBooking={() => handleSwitchView('passenger-home')}
            onAdvanceStop={advanceVehicleStop}
          />
        )}
      </main>
    </div>
  );
}

export default App;
