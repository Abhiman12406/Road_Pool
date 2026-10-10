import React from 'react';

export interface MidTripJoinCandidateData {
  candidateName: string;
  partySize: number;
  pickupLocation: string;
  dropoffLocation: string;
  extraDistanceKm: number;
  extraDurationMin: number;
  incrementalDriverPayoutInr: number;
  currentPassengerDetourPct: number;
  passengerConsentStatus: 'pending' | 'accepted' | 'declined';
}

export const DEFAULT_MID_TRIP_CANDIDATE: MidTripJoinCandidateData = {
  candidateName: 'Vikram Sen',
  partySize: 1,
  pickupLocation: 'Pune University Chowk (Gate 1)',
  dropoffLocation: 'Aundh DP Road (Near Medipoint)',
  extraDistanceKm: 1.2,
  extraDurationMin: 2.5,
  incrementalDriverPayoutInr: 65,
  currentPassengerDetourPct: 4.8,
  passengerConsentStatus: 'accepted',
};

interface DriverMidTripConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  candidate?: MidTripJoinCandidateData;
}

export const DriverMidTripConsentModal: React.FC<DriverMidTripConsentModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  onDecline,
  candidate = DEFAULT_MID_TRIP_CANDIDATE,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="driver-mid-trip-consent-modal"
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-[#efefef] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-consent-title"
      >
        {/* Top Header */}
        <div className="bg-black text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#282828] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">group_add</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="driver-consent-title" className="text-base font-bold text-white font-display">
                  Mid-trip join request
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#282828] text-white">
                  Two-way consent
                </span>
              </div>
              <p className="text-xs text-[#afafaf] mt-0.5">
                New commuter matched directly along your active corridor
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#282828] hover:bg-[#383838] text-white flex items-center justify-center text-xs font-bold transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Driver Extra Payout Banner */}
          <div className="p-4 rounded-xl bg-[#efefef] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-[#5e5e5e] uppercase tracking-wider block">
                Additional driver payout
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-bold font-display text-black tabular-nums">
                  +₹{candidate.incrementalDriverPayoutInr.toFixed(2)}
                </span>
                <span className="text-xs text-[#5e5e5e] ml-1">
                  (instant credit to trip earnings)
                </span>
              </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>

          {/* New Commuter Details */}
          <div className="p-4 rounded-xl bg-[#f8f8f8] border border-[#efefef] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                  {candidate.candidateName.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-bold text-black text-xs">
                  {candidate.candidateName} (Party of {candidate.partySize})
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#5e5e5e] bg-white px-2.5 py-0.5 rounded-full border border-[#efefef]">
                Verified rider
              </span>
            </div>

            <div className="space-y-1.5 pt-1 text-[#5e5e5e]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-black"></span>
                <span><strong>Pickup:</strong> {candidate.pickupLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-black"></span>
                <span><strong>Drop-off:</strong> {candidate.dropoffLocation}</span>
              </div>
            </div>
          </div>

          {/* Detour & Passenger Consent Status */}
          <div className="p-4 rounded-xl bg-black text-white space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-white text-[18px]">verified</span>
                <span className="text-xs font-bold text-white">15% detour guarantee respected</span>
              </div>
              <span className="text-[11px] font-mono text-white bg-[#282828] px-2.5 py-0.5 rounded-full">
                +{candidate.currentPassengerDetourPct}% (≤15%)
              </span>
            </div>

            <p className="text-xs text-[#afafaf] leading-relaxed">
              Added detour is minimal (+{candidate.extraDurationMin} min, +{candidate.extraDistanceKm} km). Existing passenger remains safely within their detour guarantee cap.
            </p>

            <div className="pt-2 border-t border-[#282828] flex items-center justify-between text-xs">
              <span className="text-[#afafaf]">Current rider consent:</span>
              <span className="font-medium text-white flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                Approved (₹34 discount applied)
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-6 pt-0 grid grid-cols-2 gap-3">
          <button
            type="button"
            id="driver-decline-mid-trip-btn"
            onClick={onDecline}
            className="btn-uber-subtle py-3 px-4 text-xs flex items-center justify-center gap-1.5"
          >
            <span>Decline join</span>
          </button>

          <button
            type="button"
            id="driver-accept-mid-trip-btn"
            onClick={onAccept}
            className="btn-uber-primary py-3 px-4 text-xs flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[17px]">add_task</span>
            <span>Accept (+₹{candidate.incrementalDriverPayoutInr})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
