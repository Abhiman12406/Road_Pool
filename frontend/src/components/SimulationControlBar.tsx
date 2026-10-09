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
    <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Left: Status and active scenario */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <span className={`absolute w-3 h-3 rounded-full ${isRunning ? 'bg-emerald-400/40 animate-ping' : 'bg-neutral-300'}`}></span>
          <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-500' : 'bg-neutral-400'}`}></span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-neutral-900">
              {isRunning ? 'Simulation Running' : 'Simulation Paused'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-[11px] font-mono font-medium text-neutral-600">
              Window #{engine?.currentWindowId ?? 101}
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-mono">
            Pune Urban Corridor • <span className="tabular-nums font-semibold">{engine?.timeRemainingInWindowSec ?? 30}s</span> remaining in batch
          </p>
        </div>
      </div>

      {/* Center: Playback & Step Controls */}
      <div className="flex items-center gap-2 self-center">
        {isRunning ? (
          <button
            type="button"
            onClick={() => onControl('pause')}
            className="h-8 px-3.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-medium text-xs flex items-center gap-1.5 transition-colors border border-neutral-200"
          >
            <span className="material-symbols-outlined text-[16px]">pause</span>
            <span>Pause</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onControl('resume')}
            className="h-8 px-3.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            <span>Resume</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onControl('step', undefined, 10)}
          className="h-8 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium flex items-center gap-1 transition-colors border border-neutral-200"
          title="Step forward 10 seconds"
        >
          <span className="material-symbols-outlined text-[15px]">forward_10</span>
          <span>Step 10s</span>
        </button>

        <button
          type="button"
          onClick={() => onControl('next_batch')}
          className="h-8 px-3.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-all"
          title="Force window expiration & run matching solver"
        >
          <span className="material-symbols-outlined text-[15px] text-amber-400">flash_on</span>
          <span>Run Next Batch</span>
        </button>

        <button
          type="button"
          onClick={() => onControl('reset')}
          className="h-8 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium flex items-center gap-1 transition-colors border border-neutral-200"
          title="Reset simulation state"
        >
          <span className="material-symbols-outlined text-[15px]">replay</span>
          <span>Reset</span>
        </button>
      </div>

      {/* Right: Tick Speed Selector */}
      <div className="flex items-center gap-1.5 self-center">
        <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mr-1">Speed:</span>
        {(['0.5x', '1x', '2x', '5x'] as const).map((speed) => (
          <button
            key={speed}
            type="button"
            onClick={() => onControl(isRunning ? 'resume' : 'pause', speed)}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
              engine?.tickSpeed === speed
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200'
            }`}
          >
            {speed}
          </button>
        ))}
      </div>
    </div>
  );
};
