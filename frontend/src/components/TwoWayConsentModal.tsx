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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border border-[#efefef] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-modal-title"
      >
        {/* Modal Header */}
        <div className="p-6 bg-black text-white border-b border-[#282828] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#282828] text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">join_inner</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="consent-modal-title" className="text-base font-bold text-white font-display">
                  Mid-trip join request
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#282828] text-white">
                  Two-way consent
                </span>
              </div>
              <p className="text-xs text-[#afafaf] mt-0.5">
                New commuter along vehicle corridor • Requires explicit approval from both driver and current rider
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#282828] hover:bg-[#383838] text-white flex items-center justify-center text-xs font-bold transition-all"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Candidate Snapshot Bar */}
          <div className="p-4 rounded-xl bg-[#efefef] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">
                {candidate.passengerName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="font-bold text-black block">
                  {candidate.passengerName} (Party of {candidate.partySize})
                </span>
                <span className="text-[11px] text-[#5e5e5e]">
                  Pickup: <strong>{candidate.pickup.name}</strong> → Drop: <strong>{candidate.dropoff.name}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-[#5e5e5e]">Solo fare: ₹{candidate.soloFareInr.toFixed(2)}</span>
              <span className="px-3 py-1 rounded-full bg-black text-white font-medium text-xs">
                Pool offer: ₹{evaluation.proposedCandidateFareInr.toFixed(2)}
              </span>
            </div>
          </div>

          {/* DUAL CONSENT CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Driver Consent Card */}
            <div
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between gap-4 ${
                driverDecision === 'accepted'
                  ? 'bg-[#f3f3f3] border-black shadow-sm'
                  : driverDecision === 'rejected'
                  ? 'bg-[#efefef] border-black'
                  : 'bg-white border-[#efefef]'
              }`}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-black">sports_motorsports</span>
                    <span className="font-bold text-xs text-black">1. Driver consent</span>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full capitalize ${
                      driverDecision === 'accepted'
                        ? 'bg-black text-white'
                        : driverDecision === 'rejected'
                        ? 'bg-black text-white'
                        : 'bg-[#efefef] text-[#5e5e5e]'
                    }`}
                  >
                    {driverDecision}
                  </span>
                </div>

                <div className="text-xs text-[#5e5e5e] space-y-1">
                  <div className="flex justify-between">
                    <span>Added driving distance:</span>
                    <strong className="text-black">+{driverNotification.addedDistanceKm} km</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated diversion:</span>
                    <strong className="text-black">+{driverNotification.addedDurationMin} mins</strong>
                  </div>
                  <div className="flex justify-between font-bold pt-1.5 border-t border-[#efefef] text-black">
                    <span>Incremental payout:</span>
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
                  className={`h-9 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    driverDecision === 'accepted'
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-[#efefef] hover:bg-[#e2e2e2] text-black'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Accept</span>
                </button>
                <button
                  type="button"
                  id="driver-reject-btn"
                  onClick={() => setDriverDecision('rejected')}
                  className={`h-9 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    driverDecision === 'rejected'
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-[#efefef] hover:bg-[#e2e2e2] text-black'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  <span>Reject</span>
                </button>
              </div>
            </div>

            {/* 2. Existing Passenger Consent Card */}
            <div
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between gap-4 ${
                passengerDecision === 'accepted'
                  ? 'bg-[#f3f3f3] border-black shadow-sm'
                  : passengerDecision === 'declined'
                  ? 'bg-[#efefef] border-black'
                  : 'bg-white border-[#efefef]'
              }`}
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-black">person_check</span>
                    <span className="font-bold text-xs text-black">2. Current rider consent</span>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full capitalize ${
                      passengerDecision === 'accepted'
                        ? 'bg-black text-white'
                        : passengerDecision === 'declined'
                        ? 'bg-black text-white'
                        : 'bg-[#efefef] text-[#5e5e5e]'
                    }`}
                  >
                    {passengerDecision}
                  </span>
                </div>

                <div className="text-xs text-[#5e5e5e] space-y-1">
                  <div className="flex justify-between">
                    <span>Added travel detour:</span>
                    <strong className="text-black">
                      +{passengerNotification.addedDelayMin} mins (+{passengerNotification.detourPct.toFixed(1)}% ≤15%)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Previous fare:</span>
                    <strong className="text-[#afafaf] line-through">
                      ₹{passengerNotification.previousFareInr.toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between font-bold pt-1.5 border-t border-[#efefef] text-black">
                    <span>Revised reduced fare:</span>
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
                  className={`h-9 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    passengerDecision === 'accepted'
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-[#efefef] hover:bg-[#e2e2e2] text-black'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                  <span>Accept</span>
                </button>
                <button
                  type="button"
                  id="passenger-decline-btn"
                  onClick={() => setPassengerDecision('declined')}
                  className={`h-9 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    passengerDecision === 'declined'
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-[#efefef] hover:bg-[#e2e2e2] text-black'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                  <span>Decline</span>
                </button>
              </div>
            </div>
          </div>

          {/* Decision Outcome Summary Banner */}
          {isBothDecided && (
            <div
              className="p-4 rounded-xl border border-black bg-black text-white text-xs flex items-center gap-3 animate-fade-in"
            >
              <span className="material-symbols-outlined text-[24px]">
                {isBothApproved ? 'task_alt' : 'cancel'}
              </span>
              <div>
                <span className="block font-bold">
                  {isBothApproved
                    ? 'Dual consent confirmed'
                    : isRejected
                    ? 'Mid-trip request rejected'
                    : 'Awaiting final resolution'}
                </span>
                <span className="text-[11px] text-[#afafaf]">
                  {isBothApproved
                    ? `Vehicle will reroute to pick up ${candidate.passengerName}. Passenger fare decreases by ₹${passengerNotification.additionalSavingsInr.toFixed(2)}.`
                    : 'Either driver or existing passenger declined. Direct route and fares remain unchanged.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-white border-t border-[#efefef] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-uber-subtle px-4 py-2 text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-two-way-consent-btn"
            disabled={!isBothDecided}
            onClick={handleApplyDecisions}
            className="btn-uber-primary px-6 py-2.5 text-xs disabled:opacity-40"
          >
            <span>Confirm resolution</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
