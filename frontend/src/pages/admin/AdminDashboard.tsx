import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Cpu, ShoppingBag, MessageSquare, DollarSign, CreditCard, Loader2 } from 'lucide-react';
import api from '../../utils/api';

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  totalDevices: number;
  activeDeviceSubs: number;
  totalOrders: number;
  openEnquiries: number;
  totalRevenue: number;
  recentOrders: {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    user: { fullName: string; email: string };
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  PAID:      'bg-blue-500/10 text-blue-400 border-blue-500/30',
  SHIPPED:   'bg-purple-500/10 text-purple-400 border-purple-500/30',
  DELIVERED: 'bg-green-500/10 text-green-400 border-green-500/30',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      sub: `${stats.premiumUsers} premium`,
      icon: <Users size={20} />,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      link: '/admin/users',
    },
    {
      label: 'Devices',
      value: stats.totalDevices,
      sub: `${stats.activeDeviceSubs} active subs`,
      icon: <Cpu size={20} />,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      link: '/admin/devices',
    },
    {
      label: 'Orders',
      value: stats.totalOrders,
      sub: 'all time',
      icon: <ShoppingBag size={20} />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      link: '/admin/orders',
    },
    {
      label: 'Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      sub: 'subscriptions',
      icon: <DollarSign size={20} />,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      link: '/admin/subscriptions',
    },
    {
      label: 'Open Enquiries',
      value: stats.openEnquiries,
      sub: stats.openEnquiries > 0 ? 'needs attention' : 'all clear',
      icon: <MessageSquare size={20} />,
      color: stats.openEnquiries > 0 ? 'text-red-400' : 'text-slate-400',
      bg: stats.openEnquiries > 0 ? 'bg-red-500/10' : 'bg-slate-700/50',
      link: '/admin/enquiries',
      badge: stats.openEnquiries > 0,
    },
    {
      label: 'Active Subs',
      value: stats.activeDeviceSubs,
      sub: 'device subscriptions',
      icon: <CreditCard size={20} />,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      link: '/admin/subscriptions',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">System overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.link}
            className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center ${c.color}`}>
                {c.icon}
              </div>
              {c.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
                  !
                </span>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">{c.value}</p>
              <p className="text-xs font-medium text-slate-400 mt-0.5">{c.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{c.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
          <Link to="/admin/orders" className="text-xs text-blue-400 hover:text-blue-300">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {stats.recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-white font-medium">{o.user.fullName}</p>
                    <p className="text-xs text-slate-500">{o.user.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-300 font-mono">
                    ${(o.totalAmount / 100).toFixed(2)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[o.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {stats.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">No orders yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
