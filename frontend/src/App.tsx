import { useState } from 'react';
import { useSimulationSocket } from './services/simulationService';
import { ShellHeader } from './components/ShellHeader';
import { OpsOverviewView } from './views/ops/OpsOverviewView';
import { PassengerHomeView } from './views/passenger/PassengerHomeView';

export function App() {
  const [currentView, setCurrentView] = useState<'ops' | 'passenger'>('ops');
  const { snapshot, isConnected, error, sendControl, sendSelection } = useSimulationSocket();

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
        onSwitchView={setCurrentView}
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
        {currentView === 'ops' ? (
          <OpsOverviewView
            snapshot={snapshot}
            onControl={sendControl}
            onSelectVehicle={handleSelectVehicle}
            onSelectRequest={handleSelectRequest}
          />
        ) : (
          <PassengerHomeView
            snapshot={snapshot}
            onSelectVehicle={handleSelectVehicle}
            onSelectRequest={handleSelectRequest}
          />
        )}
      </main>
    </div>
  );
}

export default App;
