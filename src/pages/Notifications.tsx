import { useState, useEffect } from 'react';
import { Bell, Package, Tag, Star, DollarSign, AlertCircle, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';

interface Notification {
  id: string;
  type: 'order' | 'flash_sale' | 'review' | 'payment' | 'system' | 'kyc' | 'referral';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  order:      { icon: Package,      color: 'text-[#1565C0]', bg: 'bg-[#E3F2FD]' },
  flash_sale: { icon: Tag,          color: 'text-[#E65100]', bg: 'bg-[#FFF3E0]' },
  review:     { icon: Star,         color: 'text-[#F9A825]', bg: 'bg-[#FFFDE7]' },
  payment:    { icon: DollarSign,   color: 'text-[#2E7D32]', bg: 'bg-[#E8F5E9]' },
  system:     { icon: AlertCircle,  color: 'text-gray-600',  bg: 'bg-gray-100'   },
  kyc:        { icon: CheckCircle,  color: 'text-[#6A1B9A]', bg: 'bg-[#F3E5F5]' },
  referral:   { icon: Star,         color: 'text-[#AD1457]', bg: 'bg-[#FCE4EC]' },
};

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'order', title: 'Order Shipped!', message: 'Your order #A3F8B2 has been shipped and will arrive in 2–3 days.', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: '2', type: 'flash_sale', title: '⚡ Flash Sale Starting Soon', message: 'A 70% off sale on Electronics starts in 1 hour. Grab it before it ends!', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: '3', type: 'payment', title: 'Payment Received', message: '₹1,499 credited to your BYNDIO wallet for order #B7C3D1.', is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: '4', type: 'kyc', title: 'KYC Approved ✅', message: 'Your KYC has been verified. You can now withdraw earnings and access all features.', is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  { id: '5', type: 'referral', title: 'Referral Bonus Credited!', message: 'Your friend joined Byndio using your referral code. You earned 200 reward points!', is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
  { id: '6', type: 'review', title: 'New Review on Your Product', message: 'A buyer left a 5-star review on "Wireless Earbuds Pro". Great job!', is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString() },
  { id: '7', type: 'system', title: 'System Maintenance', message: 'Scheduled maintenance on Sunday 2–4 AM IST. Services may be briefly unavailable.', is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString() },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Notifications() {
  const { user } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, is_read: true })));
  const markRead = (id: string) => setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
  const deleteNotif = (id: string) => setNotifications(n => n.filter(x => x.id !== id));

  const displayed = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-5 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E3F2FD] rounded-xl flex items-center justify-center">
              <Bell size={20} className="text-[#1565C0]" />
            </div>
            <div>
              <div className="text-[18px] font-black">Notifications</div>
              {unreadCount > 0 && <div className="text-[12px] text-[#E65100] font-semibold">{unreadCount} unread</div>}
            </div>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[12px] text-[#1565C0] font-semibold hover:underline">
                Mark all read
              </button>
            )}
            <button onClick={() => setLoading(l => !l)} className="p-2 text-gray-400 hover:text-gray-600">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-[12px] font-bold transition-colors ${filter === f ? 'bg-[#0D47A1] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex flex-col gap-2.5">
          {displayed.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center shadow-sm">
              <Bell size={40} className="mx-auto text-gray-200 mb-3" />
              <div className="text-gray-400 text-[13px] font-semibold">No notifications</div>
            </div>
          ) : displayed.map(notif => {
            const cfg = typeConfig[notif.type] || typeConfig.system;
            const Icon = cfg.icon;
            return (
              <div key={notif.id} onClick={() => markRead(notif.id)}
                className={`bg-white rounded-xl p-4 shadow-sm flex gap-3 cursor-pointer hover:shadow-md transition-shadow ${!notif.is_read ? 'border-l-4 border-[#0D47A1]' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                  <Icon size={18} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`text-[13px] font-bold ${!notif.is_read ? 'text-[#0D47A1]' : 'text-gray-800'}`}>{notif.title}</div>
                    <div className="text-[10px] text-gray-400 shrink-0">{timeAgo(notif.created_at)}</div>
                  </div>
                  <div className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{notif.message}</div>
                  {!notif.is_read && <div className="w-2 h-2 bg-[#0D47A1] rounded-full mt-1.5" />}
                </div>
                <button onClick={e => { e.stopPropagation(); deleteNotif(notif.id); }} className="p-1.5 text-gray-300 hover:text-red-400 shrink-0 self-start">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Push Notification Banner */}
        <div className="mt-5 bg-gradient-to-r from-[#0D47A1] to-[#1565C0] rounded-xl p-4 text-white">
          <div className="flex items-center gap-3">
            <Bell size={20} className="shrink-0" />
            <div className="flex-1">
              <div className="text-[13px] font-black">Enable Push Notifications</div>
              <div className="text-[11px] text-white/75">Get instant alerts for orders, flash sales & earnings</div>
            </div>
            <button className="bg-white text-[#0D47A1] text-[11px] font-black px-3 py-1.5 rounded-full shrink-0">
              Enable
            </button>
          </div>
          <div className="text-[10px] text-white/50 mt-2">🔔 Push notifications require the BYNDIO mobile app (coming soon)</div>
        </div>
      </div>
    </div>
  );
}
