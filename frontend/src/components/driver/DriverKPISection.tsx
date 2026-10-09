import React from 'react';

interface DriverKPISectionProps {
  todayEarningsInr?: number;
  completedTripsCount?: number;
  distanceDrivenKm?: number;
  rating?: number;
  ratingCount?: number;
}

export const DriverKPISection: React.FC<DriverKPISectionProps> = ({
  todayEarningsInr = 1840,
  completedTripsCount = 7,
  distanceDrivenKm = 82.4,
  rating = 4.9,
  ratingCount = 1248,
}) => {
  return (
    <section aria-label="Driver key performance indicators" className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Today's Earnings */}
      <div className="bg-white rounded-2xl p-6 border border-[#efefef] shadow-card hover:shadow-card-elevated transition-shadow relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-[#5e5e5e] uppercase tracking-wider block">
              Today's earnings
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-black font-display tracking-tight tabular-nums">
                ₹{todayEarningsInr.toLocaleString('en-IN')}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-black bg-[#efefef] px-2.5 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                +12% vs yesterday
              </span>
            </div>
            <span className="text-xs text-[#5e5e5e] mt-1.5 block">
              Direct payout after 15% platform commission
            </span>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#efefef] text-black flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[20px]">payments</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#efefef] flex items-center justify-between text-xs text-[#5e5e5e]">
          <span>Weekly target: ₹12,000</span>
          <span className="font-medium text-black">84% achieved</span>
        </div>
      </div>

      {/* 2. Completed Trips */}
      <div className="bg-white rounded-2xl p-6 border border-[#efefef] shadow-card hover:shadow-card-elevated transition-shadow relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-[#5e5e5e] uppercase tracking-wider block">
              Completed trips
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-black font-display tracking-tight tabular-nums">
                {completedTripsCount}
              </span>
              <span className="text-xs font-medium text-[#5e5e5e]">
                ({distanceDrivenKm} km driven)
              </span>
            </div>
            <span className="text-xs text-[#5e5e5e] mt-1.5 block">
              4 pooled shared rides • 3 direct express
            </span>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#efefef] text-black flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[20px]">directions_car</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#efefef] flex items-center justify-between text-xs text-[#5e5e5e]">
          <span>Average detour: +6.8%</span>
          <span className="font-medium text-black">Strictly ≤15% guaranteed</span>
        </div>
      </div>

      {/* 3. Driver Rating */}
      <div className="bg-white rounded-2xl p-6 border border-[#efefef] shadow-card hover:shadow-card-elevated transition-shadow relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-[#5e5e5e] uppercase tracking-wider block">
              Driver rating
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="flex items-center gap-1">
                <span className="text-3xl font-bold text-black font-display tracking-tight tabular-nums">
                  {rating}
                </span>
                <span className="material-symbols-outlined text-black text-[22px]">star</span>
              </div>
              <span className="text-xs font-medium text-[#5e5e5e]">
                ({ratingCount.toLocaleString()} trips)
              </span>
            </div>
            <span className="text-xs text-[#5e5e5e] mt-1.5 block">
              Top 5% chauffeur in Pune EV corridor
            </span>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#efefef] text-black flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#efefef] flex items-center justify-between text-xs text-[#5e5e5e]">
          <span>Acceptance rate: 98.4%</span>
          <span className="font-medium text-black">Zero violations</span>
        </div>
      </div>
    </section>
  );
};
