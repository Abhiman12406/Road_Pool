import React, { useState } from 'react';
import type { MidTripJoinEvaluation } from '../services/midTripJoinService';

interface TwoWayConsentModalProps {
  evaluation: MidTripJoinEvaluation;
  onResolve: (driverConsent: 'accepted' | 'rejected', passengerConsent: 'accepted' | 'declined') => void;
  onClose: () => void;
}

export const TwoWayConsentModal: React.FC<TwoWayConsentModalProps> = ({
  evaluation,
  onResolve,
  onClose,
}) => {
  const [driverDecision, setDriverDecision] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [passengerDecision, setPassengerDecision] = useState<'pending' | 'accepted' | 'declined'>('pending');

  const { candidate, driverNotification, passengerNotification } = evaluation;

  const handleApplyDecisions = () => {
    if (driverDecision === 'pending' || passengerDecision === 'pending') return;
    onResolve(driverDecision, passengerDecision);
  };

  const isBothDecided = driverDecision !== 'pending' && passengerDecision !== 'pending';
  const isBothApproved = driverDecision === 'accepted' && passengerDecision === 'accepted';
  const isRejected = driverDecision === 'rejected' || passengerDecision === 'declined';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-surface-container-lowest rounded-3xl border border-outline-variant/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-modal-title"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-primary-container/30 via-surface-container-low to-secondary-container/20 border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold shadow-sm">
              <span className="material-symbols-outlined text-[22px]">join_inner</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="consent-modal-title" className="text-base font-extrabold text-on-surface tracking-tight">
                  Mid-Trip Join Request
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-on-primary">
                  Two-Way Consent Required
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                New commuter along vehicle corridor • Requires explicit approval from both Driver and Current Rider
              </p>
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Candidate Snapshot Bar */}
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                {candidate.passengerName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="font-bold text-on-surface block">
                  {candidate.passengerName} (Party of {candidate.partySize})
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Pickup: <strong>{candidate.pickup.name}</strong> → Drop: <strong>{candidate.dropoff.name}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-on-surface-variant">Solo Fare: ₹{candidate.soloFareInr.toFixed(2)}</span>
              <span className="px-2.5 py-1 rounded-xl bg-tertiary-fixed font-bold text-on-tertiary-fixed">
                Pool Offer: ₹{evaluation.proposedCandidateFareInr.toFixed(2)}
              </span>
            </div>
          </div>

          {/* DUAL CONSENT CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Driver Consent Card */}
            <div
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                driverDecision === 'accepted'
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                  : driverDecision === 'rejected'
                  ? 'bg-rose-500/10 border-rose-500/50'
                  : 'bg-surface-container-low border-outline-variant/30'
              }`}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">sports_motorsports</span>
                    <span className="font-extrabold text-xs text-on-surface">1. Pilot Consent</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      driverDecision === 'accepted'
                        ? 'bg-emerald-500 text-white'
                        : driverDecision === 'rejected'
                        ? 'bg-rose-500 text-white'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {driverDecision}
                  </span>
                </div>

                <div className="text-[11px] text-on-surface-variant space-y-1">
                  <div className="flex justify-between">
                    <span>Added driving distance:</span>
                    <strong className="text-on-surface">+{driverNotification.addedDistanceKm} km</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated pickup diversion:</span>
                    <strong className="text-on-surface">+{driverNotification.addedDurationMin} mins</strong>
                  </div>
                  <div className="flex justify-between text-tertiary font-bold pt-1 border-t border-outline-variant/20">
                    <span>Driver Incremental Payout:</span>
                    <span>+₹{driverNotification.incrementalPayoutInr.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Driver Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  id="driver-accept-btn"
                  onClick={() => setDriverDecision('accepted')}
                  className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    driverDecision === 'accepted'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-surface-container hover:bg-emerald-500/20 text-on-surface border border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Accept</span>
                </button>
                <button
                  type="button"
                  id="driver-reject-btn"
                  onClick={() => setDriverDecision('rejected')}
                  className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    driverDecision === 'rejected'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-surface-container hover:bg-rose-500/20 text-on-surface border border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  <span>Reject</span>
                </button>
              </div>
            </div>

            {/* 2. Existing Passenger Consent Card */}
            <div
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                passengerDecision === 'accepted'
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                  : passengerDecision === 'declined'
                  ? 'bg-rose-500/10 border-rose-500/50'
                  : 'bg-surface-container-low border-outline-variant/30'
              }`}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-tertiary">person_check</span>
                    <span className="font-extrabold text-xs text-on-surface">2. Current Rider Consent</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      passengerDecision === 'accepted'
                        ? 'bg-emerald-500 text-white'
                        : passengerDecision === 'declined'
                        ? 'bg-rose-500 text-white'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {passengerDecision}
                  </span>
                </div>

                <div className="text-[11px] text-on-surface-variant space-y-1">
                  <div className="flex justify-between">
                    <span>Added travel detour:</span>
                    <strong className="text-secondary">
                      +{passengerNotification.addedDelayMin} mins (+{passengerNotification.detourPct.toFixed(1)}% ≤15% cap)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Previous Shapley fare:</span>
                    <strong className="text-on-surface line-through opacity-70">
                      ₹{passengerNotification.previousFareInr.toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between text-tertiary font-bold pt-1 border-t border-outline-variant/20">
                    <span>Revised Reduced Fare:</span>
                    <span>₹{passengerNotification.revisedFareInr.toFixed(2)} (-₹{passengerNotification.additionalSavingsInr.toFixed(2)})</span>
                  </div>
                </div>
              </div>

              {/* Passenger Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  id="passenger-accept-btn"
                  onClick={() => setPassengerDecision('accepted')}
                  className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    passengerDecision === 'accepted'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-surface-container hover:bg-emerald-500/20 text-on-surface border border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                  <span>Accept Plan</span>
                </button>
                <button
                  type="button"
                  id="passenger-decline-btn"
                  onClick={() => setPassengerDecision('declined')}
                  className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    passengerDecision === 'declined'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-surface-container hover:bg-rose-500/20 text-on-surface border border-outline-variant/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                  <span>Decline Plan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Decision Outcome Summary Banner */}
          {isBothDecided && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-center gap-3 animate-fade-in ${
                isBothApproved
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-100 font-bold'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-950 dark:text-rose-100 font-semibold'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {isBothApproved ? 'task_alt' : 'cancel'}
              </span>
              <div>
                <span className="block font-bold">
                  {isBothApproved
                    ? 'Dual Consent Confirmed!'
                    : isRejected
                    ? 'Mid-Trip Request Rejected'
                    : 'Awaiting Final Resolution'}
                </span>
                <span className="text-[11px] font-normal opacity-90">
                  {isBothApproved
                    ? 'Vehicle will reroute to pick up ' + candidate.passengerName + '. Passenger fare decreases by ₹' + passengerNotification.additionalSavingsInr.toFixed(2) + '.'
                    : 'Either driver or existing passenger declined. Direct route and fares remain unchanged.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-two-way-consent-btn"
            disabled={!isBothDecided}
            onClick={handleApplyDecisions}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
              isBothApproved
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : isRejected
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-primary/40 text-white cursor-not-allowed'
            }`}
          >
            <span>Confirm Resolution</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
