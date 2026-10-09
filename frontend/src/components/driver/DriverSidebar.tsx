import React, { useState } from 'react';
import type { ActiveViewKey } from '../ShellHeader';

interface DriverSidebarProps {
  currentView: ActiveViewKey;
  onSwitchView: (view: ActiveViewKey) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  driverName?: string;
  vehicleName?: string;
}

export const DriverSidebar: React.FC<DriverSidebarProps> = ({
  currentView,
  onSwitchView,
  isOnline,
  onToggleOnline,
  driverName = 'Arjun Kumar',
  vehicleName = 'Tata Tigor EV (MH 12 QX 4092)',
}) => {
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);

  const navItems = [
    { key: 'driver-home' as ActiveViewKey, label: 'Home', icon: 'dashboard' },
    { key: 'driver-trips' as ActiveViewKey, label: 'Trips', icon: 'route', badge: '7' },
    { key: 'driver-activity' as ActiveViewKey, label: 'Activity', icon: 'notifications', badge: '3' },
    { key: 'driver-profile' as ActiveViewKey, label: 'Profile', icon: 'person' },
  ];

  return (
    <>
      <aside
        id="driver-sidebar"
        className="w-64 bg-black text-white flex flex-col justify-between border-r border-[#282828] shrink-0 h-full select-none"
      >
        {/* Top Section */}
        <div>
          {/* Brand & Driver Header */}
          <div className="p-5 border-b border-[#282828]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold shadow-sm">
                <span className="material-symbols-outlined text-[20px]">electric_car</span>
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-white leading-tight font-display">
                  RidePool
                </h1>
                <span className="text-[12px] font-medium text-[#afafaf] flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white' : 'bg-[#5e5e5e]'}`} />
                  Driver Cockpit
                </span>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="mt-4 p-2.5 rounded-2xl bg-[#181818] border border-[#282828] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    isOnline ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-[#5e5e5e]'
                  }`}
                />
                <span className="text-xs font-medium text-white">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleOnline}
                id="driver-sidebar-status-toggle"
                className={`text-[11px] font-medium px-3 py-1 rounded-full transition-all ${
                  isOnline
                    ? 'bg-white text-black hover:bg-[#efefef]'
                    : 'bg-[#282828] text-white hover:bg-[#333333]'
                }`}
              >
                {isOnline ? 'Go offline' : 'Go online'}
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Driver navigation" className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = currentView === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  id={`nav-${item.key}`}
                  onClick={() => onSwitchView(item.key)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-[#282828] text-white'
                      : 'text-[#afafaf] hover:text-white hover:bg-[#181818]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined text-[20px] transition-colors ${
                        isActive ? 'text-white' : 'text-[#afafaf] group-hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white text-black'
                          : 'bg-[#282828] text-[#afafaf] group-hover:text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Safety Centre & Role Switcher */}
        <div className="p-4 border-t border-[#282828] space-y-3">
          {/* Safety Centre Widget */}
          <button
            type="button"
            id="driver-safety-centre-btn"
            onClick={() => setIsSafetyModalOpen(true)}
            className="w-full p-3 rounded-2xl bg-[#181818] hover:bg-[#222222] border border-[#282828] text-left transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#282828] text-white flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[18px]">shield</span>
              </div>
              <div>
                <span className="text-xs font-medium text-white block">
                  Safety centre
                </span>
                <span className="text-[11px] text-[#afafaf]">Emergency & road assist</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#afafaf] group-hover:text-white">
              chevron_right
            </span>
          </button>

          {/* Universal Demo Role Switcher [ P ] [ D ] [ A ] */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-[#afafaf] mb-1.5 px-1">
              <span>Switch mode</span>
              <span className="text-[10px] text-white bg-[#282828] px-2 py-0.5 rounded-full font-mono">
                DEMO
              </span>
            </div>
            <div
              role="group"
              aria-label="Universal demo role switcher"
              className="grid grid-cols-3 gap-1 p-1 bg-[#181818] rounded-full border border-[#282828]"
            >
              <button
                type="button"
                id="role-switch-p"
                onClick={() => onSwitchView('passenger-home')}
                className="py-1.5 px-2 rounded-full text-xs font-medium transition-all text-[#afafaf] hover:text-white hover:bg-[#282828] flex flex-col items-center"
                title="Switch to Passenger View"
              >
                <span className="font-mono text-xs font-bold leading-none">P</span>
                <span className="text-[9px] text-[#afafaf] mt-0.5">Rider</span>
              </button>

              <button
                type="button"
                id="role-switch-d"
                onClick={() => onSwitchView('driver-home')}
                className="py-1.5 px-2 rounded-full text-xs font-medium transition-all bg-white text-black shadow-sm flex flex-col items-center"
                title="Driver Dashboard (Active)"
              >
                <span className="font-mono text-xs font-bold leading-none">D</span>
                <span className="text-[9px] font-medium text-black mt-0.5">Driver</span>
              </button>

              <button
                type="button"
                id="role-switch-a"
                onClick={() => onSwitchView('ops-overview')}
                className="py-1.5 px-2 rounded-full text-xs font-medium transition-all text-[#afafaf] hover:text-white hover:bg-[#282828] flex flex-col items-center"
                title="Switch to Admin / Operations Console"
              >
                <span className="font-mono text-xs font-bold leading-none">A</span>
                <span className="text-[9px] text-[#afafaf] mt-0.5">Ops</span>
              </button>
            </div>
          </div>

          {/* Driver mini card */}
          <div className="pt-2 border-t border-[#282828] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs">
              AK
            </div>
            <div className="truncate flex-1">
              <span className="text-xs font-medium text-white block truncate">
                {driverName}
              </span>
              <span className="text-[11px] text-[#afafaf] block truncate">
                {vehicleName}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Safety Centre Modal */}
      {isSafetyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 text-black shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsSafetyModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#efefef] hover:bg-[#e2e2e2] text-black flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[24px]">shield</span>
            </div>

            <h3 className="text-xl font-bold text-black font-display">Safety centre</h3>
            <p className="text-sm text-[#5e5e5e] mt-1">
              Pune EV Metro Corridor 24x7 emergency assistance & guidelines
            </p>

            <div className="mt-5 space-y-3">
              <a
                href="tel:112"
                className="flex items-center justify-between p-3.5 rounded-full bg-black hover:bg-[#282828] text-white font-medium text-sm transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">e911_emergency</span>
                  <span>National emergency SOS (Call 112)</span>
                </div>
                <span className="text-[11px] bg-white text-black px-2.5 py-0.5 rounded-full font-mono font-bold">DIAL</span>
              </a>

              <a
                href="tel:18002008899"
                className="flex items-center justify-between p-3.5 rounded-full bg-[#efefef] hover:bg-[#e2e2e2] text-black font-medium text-sm transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">support_agent</span>
                  <span>Pune Fleet Control (1800-200-8899)</span>
                </div>
                <span className="text-[11px] bg-black text-white px-2.5 py-0.5 rounded-full font-mono font-bold">24x7</span>
              </a>

              <div className="p-4 rounded-2xl bg-[#f3f3f3] text-xs space-y-1.5">
                <span className="font-bold text-black block">Algorithmic safeguards:</span>
                <p className="text-[12px] text-[#5e5e5e] leading-relaxed">
                  • 15% Maximum Detour Guarantee strictly enforced by OR-Tools.<br/>
                  • Mid-trip requests require your explicit one-click confirmation.<br/>
                  • Zero cash handling — instant automatic UPI payouts.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSafetyModalOpen(false)}
              className="mt-5 w-full py-3 rounded-full bg-[#efefef] hover:bg-[#e2e2e2] text-sm font-medium text-black transition-colors"
            >
              Close safety centre
            </button>
          </div>
        </div>
      )}
    </>
  );
};
