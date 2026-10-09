import React, { useState } from 'react';

export interface ActivityNotification {
  id: string;
  category: 'trips' | 'payouts' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon: string;
  badge: string;
  badgeColor?: string;
}

export const INITIAL_NOTIFICATIONS: ActivityNotification[] = [
  {
    id: 'notif-1',
    category: 'trips',
    title: 'New pooled match assigned',
    message: 'Optimal batch match for 2 passengers (MG Road ➔ Baner/Hinjewadi). Maximum detour validated at 6.8% (≤15%).',
    timestamp: '10 min ago',
    read: false,
    icon: 'alt_route',
    badge: 'Trip offer',
  },
  {
    id: 'notif-2',
    category: 'payouts',
    title: 'Payout deposited: ₹272.00',
    message: 'Net payout for Trip #SRP-240619-0842 credited to your UPI registered account. Platform fee: ₹48.00.',
    timestamp: '42 min ago',
    read: false,
    icon: 'payments',
    badge: 'Instant payout',
  },
  {
    id: 'notif-3',
    category: 'system',
    title: 'Commercial credentials verified',
    message: 'Your Commercial Driving Chauffeur Badge #MH-12-PUNE-9842 and background check have been certified for 2026-2027.',
    timestamp: '2 hours ago',
    read: false,
    icon: 'verified',
    badge: 'Verified',
  },
  {
    id: 'notif-4',
    category: 'trips',
    title: 'Mid-trip consent approved',
    message: 'Passenger Rahul Sharma granted consent for en-route joiner Vikram Sen. Additional payout: +₹65.00.',
    timestamp: 'Yesterday',
    read: true,
    icon: 'group_add',
    badge: 'Consent log',
  },
  {
    id: 'notif-5',
    category: 'payouts',
    title: 'Weekly incentive milestone achieved',
    message: 'Congratulations! You completed 35 clean EV shared trips with zero detour violations. Incentive: ₹850 bonus.',
    timestamp: '2 days ago',
    read: true,
    icon: 'workspace_premium',
    badge: 'Bonus',
  },
];

export const DriverActivityView: React.FC = () => {
  const [notifications, setNotifications] = useState<ActivityNotification[]>(INITIAL_NOTIFICATIONS);
  const [filterCategory, setFilterCategory] = useState<'all' | 'trips' | 'payouts' | 'system'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const filtered = notifications.filter(
    (n) => filterCategory === 'all' || n.category === filterCategory
  );

  return (
    <div id="driver-activity-view" className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl p-6 border border-[#efefef] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-black font-display tracking-tight">
              Activity & notifications
            </h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-black text-white">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-[#5e5e5e] mt-1">
            Real-time algorithmic dispatch alerts, payout receipts, and verified credentials
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              type="button"
              id="mark-all-read-btn"
              onClick={handleMarkAllRead}
              className="btn-uber-subtle px-4 py-1.5 text-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              <span>Mark all as read</span>
            </button>
          )}

          {/* Filter Pills */}
          <div className="flex items-center bg-[#efefef] p-1 rounded-full">
            {(['all', 'trips', 'payouts', 'system'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                  filterCategory === cat
                    ? 'bg-black text-white shadow-sm'
                    : 'text-[#5e5e5e] hover:text-black'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => handleToggleRead(item.id)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
              !item.read
                ? 'bg-white border-black shadow-card-elevated'
                : 'bg-white border-[#efefef] shadow-card hover:shadow-card-elevated'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 bg-[#efefef] text-black">
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-black">
                    {item.title}
                  </span>
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#efefef] text-black">
                    {item.badge}
                  </span>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-black"></span>
                  )}
                </div>

                <p className="text-xs text-[#5e5e5e] mt-1 leading-relaxed">
                  {item.message}
                </p>

                <span className="text-[11px] text-[#afafaf] mt-2 block">
                  {item.timestamp}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="text-[#afafaf] hover:text-black text-xs shrink-0 p-1"
              title={item.read ? 'Mark unread' : 'Mark read'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {item.read ? 'mark_email_unread' : 'mark_email_read'}
              </span>
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#efefef] text-[#5e5e5e] shadow-card">
            <span className="material-symbols-outlined text-4xl text-[#afafaf] mb-2">
              notifications_off
            </span>
            <p className="font-bold text-black font-display">No notifications in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};
