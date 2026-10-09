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
}

export const GuidedStoryOverlay: React.FC<GuidedStoryOverlayProps> = ({
  onApplyScenarioSnapshot,
  onOpenShapleySheet,
  isOpen,
  onToggle,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [lastExecutedStep, setLastExecutedStep] = useState<number | null>(null);

  const step: GuidedStoryStep = GUIDED_STORY_STEPS[currentStepIndex];

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

  // If minimized, display compact floating trigger pill at bottom-left
  if (!isOpen) {
    return (
      <div className="fixed bottom-5 left-5 z-40">
        <button
          type="button"
          id="btn-open-story-mode-pill"
          onClick={onToggle}
          className="h-10 px-4 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 shadow-md flex items-center gap-2.5 transition-all text-xs font-medium"
        >
          <div className="w-5 h-5 rounded-md bg-neutral-800 text-white flex items-center justify-center font-mono font-bold text-[11px] border border-neutral-700">
            {step.step}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-300">
              Story Mode ({step.step}/10)
            </span>
            <span className="text-xs font-semibold text-white truncate max-w-[180px]">
              {step.stage}
            </span>
          </div>
          <span className="material-symbols-outlined text-[16px] text-neutral-400">
            open_in_full
          </span>
        </button>
      </div>
    );
  }

  const progressPct = ((step.step) / GUIDED_STORY_STEPS.length) * 100;

  return (
    <div
      className="fixed bottom-5 left-5 z-50 w-full max-w-lg bg-white/95 backdrop-blur-md border border-neutral-300 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
      id="guided-story-overlay"
    >
      {/* Top Header & Step Navigation */}
      <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-neutral-900 text-white flex items-center justify-center font-mono font-bold text-xs">
            {step.step}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Guided Story Mode
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-neutral-200 text-neutral-800">
                Step {step.step} of 10
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">
              {step.specClause}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRestart}
            title="Restart Guided Story Journey"
            className="w-7 h-7 rounded-md hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">replay</span>
          </button>
          <button
            type="button"
            id="btn-collapse-story-mode"
            onClick={onToggle}
            title="Minimize to floating pill"
            className="w-7 h-7 rounded-md hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close_fullscreen</span>
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-neutral-100 h-1">
        <div
          className="bg-neutral-900 h-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step Content Body */}
      <div className="p-4 space-y-3.5">
        {/* Step Title & Stage */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
              {step.stage}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              View: <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-800 border border-neutral-200">{step.targetView}</code>
            </span>
          </div>
          <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
            {step.title}
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            {step.summary}
          </p>
        </div>

        {/* Proof Points Box */}
        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block">
            What this step proves to evaluators:
          </span>
          <ul className="space-y-1 text-xs text-neutral-800">
            {step.proofPoints.map((proof, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="material-symbols-outlined text-emerald-700 text-[14px] shrink-0 mt-0.5">
                  check_circle
                </span>
                <span className="leading-tight">{proof}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Step Selector Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-0.5">
          {GUIDED_STORY_STEPS.map((s, idx) => {
            const isActive = currentStepIndex === idx;
            const isCompleted = lastExecutedStep !== null && s.step <= lastExecutedStep;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => handleExecuteStep(idx)}
                className={`h-6 px-2 rounded-md text-[11px] font-mono font-medium transition-all shrink-0 flex items-center gap-1 border ${
                  isActive
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : isCompleted
                    ? 'bg-neutral-100 text-neutral-900 border-neutral-300 hover:bg-neutral-200'
                    : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:text-neutral-900'
                }`}
              >
                <span>{s.step}</span>
                <span className="hidden sm:inline text-[9px] opacity-80">{s.stage.replace(' Phase', '')}</span>
              </button>
            );
          })}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-neutral-100">
          <button
            type="button"
            disabled={currentStepIndex === 0}
            onClick={handlePrev}
            className="px-2.5 h-8 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 border border-neutral-200"
          >
            <span className="material-symbols-outlined text-[15px]">chevron_left</span>
            <span>Previous</span>
          </button>

          <button
            type="button"
            id="btn-run-story-step"
            onClick={() => handleExecuteStep(currentStepIndex)}
            className="flex-1 h-8 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px] text-amber-400">play_circle</span>
            <span>{step.actionLabel}</span>
          </button>

          <button
            type="button"
            disabled={currentStepIndex === GUIDED_STORY_STEPS.length - 1}
            onClick={handleNext}
            className="px-2.5 h-8 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 border border-neutral-200"
          >
            <span>Next</span>
            <span className="material-symbols-outlined text-[15px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};
