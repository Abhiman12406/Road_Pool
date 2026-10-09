import React, { useState } from 'react';
import {
  GUIDED_STORY_STEPS,
  type GuidedStoryStep,
  buildDeterministicScenarioSnapshot,
  buildCompatibleJoinCandidate,
  buildIncompatibleJoinCandidate,
} from '../services/scenarioService';
import type { GlobalSimulationSnapshot, MidTripJoinCandidate } from '../types/simulation';
import type { ActiveViewKey } from './ShellHeader';

interface GuidedStoryOverlayProps {
  onApplyScenarioSnapshot: (
    snapshot: GlobalSimulationSnapshot,
    targetView: ActiveViewKey,
    candidate?: MidTripJoinCandidate | null
  ) => void;
  onOpenShapleySheet?: () => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

export const GuidedStoryOverlay: React.FC<GuidedStoryOverlayProps> = ({
  onApplyScenarioSnapshot,
  onOpenShapleySheet,
  isOpen,
  onToggle,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [lastExecutedStep, setLastExecutedStep] = useState<number | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const step: GuidedStoryStep = GUIDED_STORY_STEPS[currentStepIndex];

  const handleClose = () => {
    setIsMinimized(false);
    if (onClose) {
      onClose();
    } else {
      onToggle();
    }
  };

  const handleExecuteStep = (stepIdx: number) => {
    const targetStep = GUIDED_STORY_STEPS[stepIdx];
    setCurrentStepIndex(stepIdx);
    setLastExecutedStep(targetStep.step);

    // Map story steps to deterministic state
    let scenarioIdMap = 1;
    let candidate: MidTripJoinCandidate | null = null;

    switch (targetStep.step) {
      case 1: // Book 3 Pax
        scenarioIdMap = 1;
        break;
      case 2: // Batch Window
        scenarioIdMap = 2;
        break;
      case 3: // Smart Matching
        scenarioIdMap = 2;
        break;
      case 4: // Shapley Matrix
        scenarioIdMap = 4;
        break;
      case 5: // Active Trip & Cabin
        scenarioIdMap = 1;
        break;
      case 6: // Mid-Trip Join Injection
        scenarioIdMap = 8;
        candidate = buildCompatibleJoinCandidate();
        break;
      case 7: // Two-Way Consent
        scenarioIdMap = 8;
        candidate = buildCompatibleJoinCandidate();
        break;
      case 8: // Detour Guardrail
        scenarioIdMap = 3;
        candidate = buildIncompatibleJoinCandidate();
        break;
      case 9: // Cancellation
        scenarioIdMap = 6;
        break;
      case 10: // Receipt
        scenarioIdMap = 7;
        break;
      default:
        scenarioIdMap = 1;
    }

    const snapshot = buildDeterministicScenarioSnapshot(scenarioIdMap);
    onApplyScenarioSnapshot(snapshot, targetStep.targetView, candidate);

    if (targetStep.step === 4 && onOpenShapleySheet) {
      setTimeout(() => onOpenShapleySheet(), 200);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < GUIDED_STORY_STEPS.length - 1) {
      handleExecuteStep(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      handleExecuteStep(currentStepIndex - 1);
    }
  };

  const handleRestart = () => {
    handleExecuteStep(0);
  };

  // If not open, completely unmount (do not float on screen)
  if (!isOpen) {
    return null;
  }

  // If minimized by the user, display a compact floating pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 left-5 z-40">
        <div className="flex items-center gap-2 bg-black text-white p-1 pl-3 rounded-full shadow-lg border border-neutral-800 animate-in fade-in duration-150">
          <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center font-mono font-bold text-[11px]">
            {step.step}
          </div>
          <button
            type="button"
            id="btn-open-story-mode-pill"
            onClick={() => setIsMinimized(false)}
            className="flex flex-col text-left pr-1"
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#afafaf]">
              Story Mode ({step.step}/10)
            </span>
            <span className="text-xs font-medium text-white truncate max-w-[150px]">
              {step.stage}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            title="Expand Story Mode"
            className="w-7 h-7 rounded-full hover:bg-neutral-800 flex items-center justify-center text-[#afafaf] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_full</span>
          </button>
          <button
            type="button"
            onClick={handleClose}
            title="Close Story Mode"
            className="w-7 h-7 rounded-full hover:bg-neutral-800 flex items-center justify-center text-[#afafaf] hover:text-white transition-colors mr-0.5"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>
    );
  }

  const progressPct = ((step.step) / GUIDED_STORY_STEPS.length) * 100;

  return (
    <div
      className="fixed bottom-5 left-5 z-50 w-full max-w-lg bg-white/98 backdrop-blur-md border border-[#efefef] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
      id="guided-story-overlay"
    >
      {/* Top Header & Step Navigation */}
      <div className="bg-white px-5 py-3 border-b border-[#efefef] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-mono font-bold text-xs">
            {step.step}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-black uppercase tracking-wider">
                Guided Story Mode
              </span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#efefef] text-black">
                Step {step.step} of 10
              </span>
            </div>
            <span className="text-[10px] text-[#5e5e5e] font-mono">
              {step.specClause}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRestart}
            title="Restart Guided Story Journey"
            className="w-8 h-8 rounded-full hover:bg-[#efefef] text-[#5e5e5e] hover:text-black flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">replay</span>
          </button>
          <button
            type="button"
            id="btn-collapse-story-mode"
            onClick={() => setIsMinimized(true)}
            title="Minimize to floating pill"
            className="w-8 h-8 rounded-full hover:bg-[#efefef] text-[#5e5e5e] hover:text-black flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close_fullscreen</span>
          </button>
          <button
            type="button"
            id="btn-close-story-mode"
            onClick={handleClose}
            title="Close Guided Story Mode"
            className="w-8 h-8 rounded-full hover:bg-[#efefef] text-[#5e5e5e] hover:text-black flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-[#efefef] h-1">
        <div
          className="bg-black h-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step Content Body */}
      <div className="p-5 space-y-4">
        {/* Step Title & Stage */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#5e5e5e] font-semibold">
              {step.stage}
            </span>
            <span className="text-[10px] text-[#5e5e5e] font-mono">
              View: <code className="bg-[#efefef] px-1.5 py-0.5 rounded-full text-black">{step.targetView}</code>
            </span>
          </div>
          <h3 className="text-sm font-bold text-black tracking-tight">
            {step.title}
          </h3>
          <p className="text-xs text-[#5e5e5e] leading-relaxed">
            {step.summary}
          </p>
        </div>

        {/* Proof Points Box */}
        <div className="p-3.5 rounded-xl bg-[#efefef] border border-[#e2e2e2] space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5e5e5e] block">
            What this step proves to evaluators:
          </span>
          <ul className="space-y-1 text-xs text-black">
            {step.proofPoints.map((proof, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="material-symbols-outlined text-black text-[15px] shrink-0 mt-0.5">
                  check_circle
                </span>
                <span className="leading-tight">{proof}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Step Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
          {GUIDED_STORY_STEPS.map((s, idx) => {
            const isActive = currentStepIndex === idx;
            const isCompleted = lastExecutedStep !== null && s.step <= lastExecutedStep;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => handleExecuteStep(idx)}
                className={`h-7 px-2.5 rounded-full text-[11px] font-mono font-medium transition-all shrink-0 flex items-center gap-1 border ${
                  isActive
                    ? 'bg-black text-white border-black'
                    : isCompleted
                    ? 'bg-[#efefef] text-black border-[#e2e2e2] hover:bg-[#e2e2e2]'
                    : 'bg-white text-[#5e5e5e] border-[#efefef] hover:text-black'
                }`}
              >
                <span>{s.step}</span>
                <span className="hidden sm:inline text-[9px] opacity-80">{s.stage.replace(' Phase', '')}</span>
              </button>
            );
          })}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-[#efefef]">
          <button
            type="button"
            disabled={currentStepIndex === 0}
            onClick={handlePrev}
            className="px-3.5 h-9 rounded-full text-xs font-medium text-black bg-[#efefef] hover:bg-[#e2e2e2] transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            <span>Previous</span>
          </button>

          <button
            type="button"
            id="btn-run-story-step"
            onClick={() => handleExecuteStep(currentStepIndex)}
            className="flex-1 h-9 rounded-full text-xs font-medium bg-black text-white hover:bg-[#282828] transition-colors flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px] text-white">play_circle</span>
            <span>{step.actionLabel}</span>
          </button>

          <button
            type="button"
            disabled={currentStepIndex === GUIDED_STORY_STEPS.length - 1}
            onClick={handleNext}
            className="px-3.5 h-9 rounded-full text-xs font-medium text-black bg-[#efefef] hover:bg-[#e2e2e2] transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
          >
            <span>Next</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};
