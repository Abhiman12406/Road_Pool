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

  // If minimized, display compact floating trigger pill at bottom-right
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 left-6 z-40 animate-fade-in">
        <button
          type="button"
          id="btn-open-story-mode-pill"
          onClick={onToggle}
          className="h-12 px-5 rounded-full bg-surface-container-highest text-on-surface hover:bg-surface-container border-2 border-primary/40 shadow-2xl flex items-center gap-3 transition-all group active:scale-95"
        >
          <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-black text-xs shadow-glow">
            {step.step}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-black uppercase tracking-wider text-primary">
              Guided Story Mode ({step.step}/10)
            </span>
            <span className="text-xs font-bold text-on-surface truncate max-w-[200px]">
              {step.stage}
            </span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-primary group-hover:translate-x-0.5 transition-transform">
            open_in_full
          </span>
        </button>
      </div>
    );
  }

  const progressPct = ((step.step) / GUIDED_STORY_STEPS.length) * 100;

  return (
    <div
      className="fixed bottom-6 left-6 z-50 w-full max-w-xl bg-surface-container-lowest/95 backdrop-blur-xl border-2 border-primary/40 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-300"
      id="guided-story-overlay"
    >
      {/* Top Header & Step Navigation */}
      <div className="bg-surface-container-low px-5 py-3 border-b border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center font-black text-xs shadow-glow">
            {step.step}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-on-surface uppercase tracking-wider">
                Guided Story Mode
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Step {step.step} of 10
              </span>
            </div>
            <span className="text-[10px] text-on-surface-variant font-medium">
              {step.specClause}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRestart}
            title="Restart Guided Story Journey"
            className="w-8 h-8 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">replay</span>
          </button>
          <button
            type="button"
            id="btn-collapse-story-mode"
            onClick={onToggle}
            title="Minimize to floating pill"
            className="w-8 h-8 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close_fullscreen</span>
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-surface-container h-1">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step Content Body */}
      <div className="p-5 space-y-4">
        {/* Step Title & Stage */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary">
              {step.stage}
            </span>
            <span className="text-[10px] text-on-surface-variant font-bold">
              Target View: <code className="bg-surface-container px-1.5 py-0.5 rounded text-primary">{step.targetView}</code>
            </span>
          </div>
          <h3 className="text-base font-black text-on-surface tracking-tight">
            {step.title}
          </h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {step.summary}
          </p>
        </div>

        {/* Proof Points Box */}
        <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
            What this step proves to evaluators:
          </span>
          <ul className="space-y-1.5 text-xs text-on-surface">
            {step.proofPoints.map((proof, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary text-[15px] shrink-0 mt-0.5">
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
                className={`h-7 px-2.5 rounded-full text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 border ${
                  isActive
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : isCompleted
                    ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                    : 'bg-surface-container text-on-surface-variant border-transparent hover:text-on-surface'
                }`}
              >
                <span>{s.step}</span>
                <span className="hidden sm:inline text-[10px] opacity-80">{s.stage.replace(' Phase', '')}</span>
              </button>
            );
          })}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-outline-variant/20">
          <button
            type="button"
            disabled={currentStepIndex === 0}
            onClick={handlePrev}
            className="px-3.5 h-10 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            <span>Previous</span>
          </button>

          <button
            type="button"
            id="btn-run-story-step"
            onClick={() => handleExecuteStep(currentStepIndex)}
            className="flex-1 h-10 rounded-xl text-xs font-extrabold bg-primary text-on-primary hover:bg-primary/90 shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">play_circle</span>
            <span>{step.actionLabel}</span>
          </button>

          <button
            type="button"
            disabled={currentStepIndex === GUIDED_STORY_STEPS.length - 1}
            onClick={handleNext}
            className="px-3.5 h-10 rounded-xl text-xs font-bold text-on-surface hover:bg-surface-container transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
          >
            <span>Next</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};
