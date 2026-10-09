import React, { useState } from 'react';

export const DriverProfileView: React.FC = () => {
  const [autoAcceptPooled, setAutoAcceptPooled] = useState<boolean>(true);
  const [navAudioEnabled, setNavAudioEnabled] = useState<boolean>(true);
  const [instantPayouts, setInstantPayouts] = useState<boolean>(true);
  const [isSavedToastVisible, setIsSavedToastVisible] = useState<boolean>(false);

  const handleSavePreferences = () => {
    setIsSavedToastVisible(true);
    setTimeout(() => setIsSavedToastVisible(false), 2500);
  };

  return (
    <div id="driver-profile-view" className="space-y-6">
      {/* Toast Alert */}
      {isSavedToastVisible && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#282828] flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <span className="material-symbols-outlined text-white text-[20px]">check_circle</span>
          <span className="text-xs font-medium">Preferences saved successfully</span>
        </div>
      )}

      {/* Top Profile Hero Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#efefef] shadow-card relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center font-bold text-2xl shadow-sm">
              AK
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-bold text-black font-display tracking-tight">
                  Arjun Kumar
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#efefef] text-black">
                  <span className="material-symbols-outlined text-[15px]">verified</span>
                  Verified chauffeur
                </span>
              </div>

              <p className="text-xs text-[#5e5e5e] mt-1 font-medium">
                Professional EV fleet chauffeur • Pune Metro Corridor Zone 1
              </p>

              <div className="flex items-center gap-3 text-xs font-medium text-black mt-3 flex-wrap">
                <div className="flex items-center gap-1 bg-[#efefef] px-3 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="font-bold">4.9 rating</span>
                  <span className="text-[#5e5e5e] font-normal">(1,248 trips)</span>
                </div>

                <div className="flex items-center gap-1.5 bg-[#efefef] px-3 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[16px]">electric_bolt</span>
                  <span>100% zero-emission EV</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-[#efefef]">
            <span className="text-[10px] font-medium text-[#5e5e5e] uppercase tracking-wider block">
              Driver ID & license
            </span>
            <span className="font-mono text-sm font-bold text-black">
              #MH-12-PUNE-9842
            </span>
            <span className="text-xs text-[#5e5e5e] font-medium block mt-0.5">
              Valid till Dec 2029
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Vehicle Specs & Algorithmic Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Information */}
        <div className="bg-white rounded-2xl p-6 border border-[#efefef] shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#efefef] pb-3">
            <h3 className="text-base font-bold text-black font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-black text-[20px]">directions_car</span>
              Assigned fleet vehicle
            </h3>
            <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#efefef] text-black">
              EV ACTIVE
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#efefef]">
              <span className="text-[#5e5e5e]">Model & make</span>
              <span className="font-bold text-black">Tata Tigor EV Express</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#efefef]">
              <span className="text-[#5e5e5e]">Registration number</span>
              <span className="font-mono font-bold text-black">MH 12 QX 4092</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#efefef]">
              <span className="text-[#5e5e5e]">Passenger cabin capacity</span>
              <span className="font-medium text-black">4 seats (Air conditioned)</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#efefef]">
              <span className="text-[#5e5e5e]">Battery pack status</span>
              <span className="font-bold text-black">88% (Est. 194 km remaining)</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#efefef]">
              <span className="text-[#5e5e5e]">Fast charging standard</span>
              <span className="font-medium text-black">CCS-2 DC fast charging (50 kW)</span>
            </div>
          </div>
        </div>

        {/* Driver Preferences & Algorithmic Safeguards */}
        <div className="bg-white rounded-2xl p-6 border border-[#efefef] shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#efefef] pb-3">
            <h3 className="text-base font-bold text-black font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-black text-[20px]">tune</span>
              Ride pooling settings
            </h3>
            <span className="text-xs font-medium text-[#5e5e5e]">
              OR-Tools config
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Auto Accept */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#efefef]">
              <div>
                <span className="font-bold text-black block">Auto-accept pooled batches</span>
                <span className="text-[11px] text-[#5e5e5e]">
                  Automatically accept trips that meet 15% detour limit
                </span>
              </div>
              <button
                type="button"
                id="toggle-auto-accept"
                onClick={() => setAutoAcceptPooled(!autoAcceptPooled)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  autoAcceptPooled ? 'bg-black' : 'bg-[#e2e2e2]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    autoAcceptPooled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Detour Cap Lock */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black text-white">
              <div>
                <span className="font-bold text-white block">Max detour cap tolerance</span>
                <span className="text-[11px] text-[#afafaf]">
                  Strictly bounded: No passenger exceeds +15% delay
                </span>
              </div>
              <span className="font-mono font-medium text-white bg-[#282828] px-2.5 py-1 rounded-full">
                ≤ 15.0%
              </span>
            </div>

            {/* Audio Nav */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#efefef]">
              <div>
                <span className="font-bold text-black block">Audio navigation & stop prompts</span>
                <span className="text-[11px] text-[#5e5e5e]">
                  Voice guidance for pickup bays and passenger dropoffs
                </span>
              </div>
              <button
                type="button"
                id="toggle-nav-audio"
                onClick={() => setNavAudioEnabled(!navAudioEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  navAudioEnabled ? 'bg-black' : 'bg-[#e2e2e2]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    navAudioEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Instant Payouts */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#efefef]">
              <div>
                <span className="font-bold text-black block">Instant automated UPI settlement</span>
                <span className="text-[11px] text-[#5e5e5e]">
                  Credited immediately upon last stop completion
                </span>
              </div>
              <button
                type="button"
                id="toggle-instant-payouts"
                onClick={() => setInstantPayouts(!instantPayouts)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  instantPayouts ? 'bg-black' : 'bg-[#e2e2e2]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    instantPayouts ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              id="save-preferences-btn"
              onClick={handleSavePreferences}
              className="btn-uber-primary w-full py-3.5 text-sm mt-2"
            >
              Save configuration preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
