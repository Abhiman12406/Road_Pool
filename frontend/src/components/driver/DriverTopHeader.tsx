import React from 'react';
import type { Vehicle } from '../../types/simulation';
import type { ActiveViewKey } from '../ShellHeader';

interface DriverTopHeaderProps {
  isOnline: boolean;
  onToggleOnline: () => void;
  driverName?: string;
  vehicleName?: string;
  selectedVehicleId: string;
  onSelectVehicleId: (id: string) => void;
  vehicles?: Record<string, Vehicle>;
  onNavigateToView: (view: ActiveViewKey) => void;
  unreadCount?: number;
}

export const DriverTopHeader: React.FC<DriverTopHeaderProps> = ({
  isOnline,
  onToggleOnline,
  driverName = 'Arjun Kumar',
  vehicleName = 'Tata Tigor EV (MH 12 QX 4092)',
  selectedVehicleId,
  onSelectVehicleId,
  vehicles = {},
  onNavigateToView,
  unreadCount = 3,
}) => {
  const currentVehicle = vehicles[selectedVehicleId];
  const batteryPct = currentVehicle?.battery_pct ?? 88;

  return (
    <header className="h-16 bg-white border-b border-[#efefef] px-6 flex items-center justify-between shrink-0 z-30">
      {/* Left: Driver Identity & Vehicle Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#efefef] text-black">
            <span className="material-symbols-outlined text-[15px]">verified</span>
            Verified driver
          </span>
          <span className="text-[#afafaf]">·</span>
          <div className="flex items-center gap-1 text-xs text-[#5e5e5e] font-medium">
            <span className="material-symbols-outlined text-[16px] text-black">star</span>
            <span className="font-bold text-black">4.9</span>
            <span>(1,248 trips)</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 border-l border-[#efefef] pl-4">
          <span className="font-bold text-sm text-black">
            Good morning, {driverName.split(' ')[0]}
          </span>
          <span className="text-xs text-[#5e5e5e]">({vehicleName})</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#efefef] text-black">
            ⚡ {batteryPct}%
          </span>
        </div>

        {/* Vehicle Selector */}
        {Object.keys(vehicles).length > 1 && (
          <div className="hidden lg:flex items-center gap-1.5 ml-2">
            <span className="text-xs text-[#5e5e5e] font-medium">Vehicle:</span>
            <select
              value={selectedVehicleId}
              onChange={(e) => onSelectVehicleId(e.target.value)}
              className="text-xs font-medium text-black bg-[#efefef] border-none rounded-full px-3 py-1 outline-none cursor-pointer hover:bg-[#e2e2e2] transition-colors"
              aria-label="Select driver vehicle"
            >
              {Object.values(vehicles).map((v) => (
                <option key={v.vehicle_id} value={v.vehicle_id}>
                  {v.vehicle_id} · {v.name} ({v.occupied_seats}/{v.capacity} seats)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Online Toggle, Notifications, Demo Pill, Profile */}
      <div className="flex items-center gap-3">
        {/* Prototype Demo Badge */}
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono text-[#5e5e5e] bg-[#efefef]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5e5e5e]"></span>
          Pune Metro Corridor
        </span>

        {/* Online / Offline Status Toggle Switch */}
        <div className="flex items-center bg-[#efefef] p-1 rounded-full">
          <button
            type="button"
            id="driver-status-toggle"
            onClick={onToggleOnline}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              isOnline
                ? 'bg-black text-white shadow-sm'
                : 'bg-white text-black shadow-sm'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-white animate-pulse' : 'bg-[#afafaf]'
              }`}
            />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </button>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          id="driver-notifications-bell"
          onClick={() => onNavigateToView('driver-activity')}
          className="relative w-9 h-9 rounded-full bg-[#efefef] hover:bg-[#e2e2e2] text-black flex items-center justify-center transition-colors"
          title="Activity & Notifications"
          aria-label="Activity & Notifications"
        >
          <span className="material-symbols-outlined text-[19px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Driver Avatar Circle */}
        <button
          type="button"
          onClick={() => onNavigateToView('driver-profile')}
          className="flex items-center pl-1 group"
          title="Driver Profile & Credentials"
        >
          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs transition-colors hover:bg-[#282828]">
            AK
          </div>
        </button>
      </div>
    </header>
  );
};
