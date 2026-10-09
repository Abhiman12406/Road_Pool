import React from 'react';
import type { MidTripJoinEvaluation } from '../services/midTripJoinService';

interface IncompatibleDetourModalProps {
  evaluation: MidTripJoinEvaluation;
  onClose: () => void;
}

export const IncompatibleDetourModal: React.FC<IncompatibleDetourModalProps> = ({
  evaluation,
  onClose,
}) => {
  const { candidate, violationReason, mathematicalProof } = evaluation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-surface-container-lowest rounded-3xl border border-rose-500/40 shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="incompatible-modal-title"
      >
        {/* Header */}
        <div className="p-5 bg-rose-500/15 border-b border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-sm">
              <span className="material-symbols-outlined text-[24px]">gpp_bad</span>
            </div>
            <div>
              <h2 id="incompatible-modal-title" className="text-base font-extrabold text-on-surface tracking-tight">
                Detour Guarantee Rejection
              </h2>
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">
                Hard ≤ 15.0% Passenger Detour Cap Enforced
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center text-sm font-bold transition-all"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Candidate Info */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-on-surface">Candidate: {candidate.passengerName}</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                Incompatible Joiner
              </span>
            </div>
            <div className="text-[11px] text-on-surface-variant">
              Route: <strong>{candidate.pickup.name}</strong> → <strong>{candidate.dropoff.name}</strong> ({candidate.soloDistanceKm} km)
            </div>
          </div>

          {/* Reason Alert Box */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-100 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-xs text-rose-800 dark:text-rose-200">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>Constraint Violation Detected:</span>
            </div>
            <p className="text-xs font-semibold leading-relaxed">
              {violationReason || 'Detour exceeds the guaranteed 15.0% passenger delay threshold.'}
            </p>
          </div>

          {/* Mathematical Proof Box */}
          {mathematicalProof && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Auditable Mathematical Proof
              </span>
              <div className="p-3 rounded-xl bg-surface-container font-mono text-[11px] text-on-surface break-words leading-relaxed border border-outline-variant/40">
                {mathematicalProof}
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-surface-container-low text-[11px] text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
            <span>
              RoadPool automatically guarantees that existing passengers will <strong>never</strong> experience detours exceeding 15% of their solo ride duration.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-end">
          <button
            type="button"
            id="close-incompatible-modal-btn"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-on-primary font-bold text-xs shadow-md transition-all"
          >
            Dismiss & Preserve Active Route
          </button>
        </div>
      </div>
    </div>
  );
};
