import React from 'react';
import type { SimulationEngineState } from '../types/simulation';

interface SimulationControlBarProps {
  engine: SimulationEngineState | undefined;
  onControl: (action: string, speed?: string, step_seconds?: number) => void;
}

export const SimulationControlBar: React.FC<SimulationControlBarProps> = ({
  engine,
  onControl,
}) => {
  const isRunning = engine?.status === 'running';

  return (
    <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-soft border border-outline-variant/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Left: Status and active scenario */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <span className={`absolute w-3 h-3 rounded-full ${isRunning ? 'bg-tertiary/40 animate-ping' : 'bg-secondary/40'}`}></span>
          <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-tertiary' : 'bg-secondary'}`}></span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-on-surface">
              {isRunning ? 'Simulation Running' : 'Simulation Paused'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-[11px] font-semibold text-primary">
              Window #{engine?.currentWindowId ?? 101}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Pune Urban Corridor • {engine?.timeRemainingInWindowSec ?? 30}s remaining in batch
          </p>
        </div>
      </div>

      {/* Center: Playback & Step Controls */}
      <div className="flex items-center gap-2 self-center">
        {isRunning ? (
          <button
            onClick={() => onControl('pause')}
            className="h-9 px-4 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">pause</span>
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={() => onControl('resume')}
            className="h-9 px-4 rounded-full bg-primary text-on-primary hover:bg-primary/90 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            <span>Resume</span>
          </button>
        )}

        <button
          onClick={() => onControl('step', undefined, 10)}
          className="h-9 px-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors"
          title="Step forward 10 seconds"
        >
          <span className="material-symbols-outlined text-[16px]">forward_10</span>
          <span>Step 10s</span>
        </button>

        <button
          onClick={() => onControl('next_batch')}
          className="h-9 px-3.5 rounded-full bg-primary-container text-on-primary-container hover:opacity-90 text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
          title="Force window expiration & run matching solver"
        >
          <span className="material-symbols-outlined text-[16px]">flash_on</span>
          <span>Run Next Batch</span>
        </button>

        <button
          onClick={() => onControl('reset')}
          className="h-9 px-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors"
          title="Reset simulation state"
        >
          <span className="material-symbols-outlined text-[16px]">replay</span>
          <span>Reset</span>
        </button>
      </div>

      {/* Right: Tick Speed Selector */}
      <div className="flex items-center gap-1.5 self-center">
        <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mr-1">Speed:</span>
        {(['0.5x', '1x', '2x', '5x'] as const).map((speed) => (
          <button
            key={speed}
            onClick={() => onControl(isRunning ? 'resume' : 'pause', speed)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
              engine?.tickSpeed === speed
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {speed}
          </button>
        ))}
      </div>
    </div>
  );
};
