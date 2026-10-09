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
    <div className="bg-white p-4 rounded-2xl border border-[#efefef] shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Left: Status and active scenario */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <span className={`absolute w-3 h-3 rounded-full ${isRunning ? 'bg-black/30 animate-ping' : 'bg-[#e2e2e2]'}`}></span>
          <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-black' : 'bg-[#afafaf]'}`}></span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-black">
              {isRunning ? 'Simulation running' : 'Simulation paused'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#efefef] text-xs font-mono font-medium text-black">
              Batch #{engine?.currentWindowId ?? 101}
            </span>
          </div>
          <p className="text-xs text-[#5e5e5e] font-mono">
            Pune urban corridor • <span className="tabular-nums font-semibold">{engine?.timeRemainingInWindowSec ?? 30}s</span> remaining in batch
          </p>
        </div>
      </div>

      {/* Center: Playback & Step Controls */}
      <div className="flex items-center gap-2 self-center">
        {isRunning ? (
          <button
            type="button"
            onClick={() => onControl('pause')}
            className="btn-uber-subtle h-8 px-4 text-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">pause</span>
            <span>Pause</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onControl('resume')}
            className="btn-uber-primary h-8 px-4 text-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            <span>Resume</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onControl('step', undefined, 10)}
          className="btn-uber-subtle h-8 px-3.5 text-xs flex items-center gap-1"
          title="Step forward 10 seconds"
        >
          <span className="material-symbols-outlined text-[15px]">forward_10</span>
          <span>Step 10s</span>
        </button>

        <button
          type="button"
          onClick={() => onControl('next_batch')}
          className="btn-uber-primary h-8 px-4 text-xs flex items-center gap-1.5"
          title="Force window expiration & run matching solver"
        >
          <span className="material-symbols-outlined text-[15px]">flash_on</span>
          <span>Run next batch</span>
        </button>

        <button
          type="button"
          onClick={() => onControl('reset')}
          className="btn-uber-subtle h-8 px-3.5 text-xs flex items-center gap-1"
          title="Reset simulation state"
        >
          <span className="material-symbols-outlined text-[15px]">replay</span>
          <span>Reset</span>
        </button>
      </div>

      {/* Right: Tick Speed Selector */}
      <div className="flex items-center gap-1.5 self-center">
        <span className="text-[11px] font-medium text-[#5e5e5e] uppercase tracking-wider mr-1">Speed:</span>
        <div className="flex items-center bg-[#efefef] p-0.5 rounded-full">
          {(['0.5x', '1x', '2x', '5x'] as const).map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => onControl(isRunning ? 'resume' : 'pause', speed)}
              className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all ${
                engine?.tickSpeed === speed
                  ? 'bg-black text-white shadow-sm'
                  : 'text-[#5e5e5e] hover:text-black'
              }`}
            >
              {speed}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
