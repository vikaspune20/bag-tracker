import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Plane, Briefcase, MapPin, History, Clock, Lock, ArrowRight, ShoppingBag, Map } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';

export const Dashboard = () => {
  const user = useAuthStore(state => state.user);
  const [stats, setStats] = useState({ upcomingTrips: 0, totalBags: 0, activeTracking: 0, totalTrips: 0 });
  const { status: subStatus } = useSubscriptionStatus();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [tripsRes, bagsRes] = await Promise.all([
          api.get('/trips'),
          api.get('/bags'),
        ]);
        setStats({
          upcomingTrips: tripsRes.data.trips.length,
          totalBags: bagsRes.data.bags.length,
          activeTracking: bagsRes.data.bags.filter((b: any) => b.trackingLogs?.length > 0).length,
          totalTrips: tripsRes.data.trips.length,
        });
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Upcoming Trips',
      value: stats.upcomingTrips,
      icon: <Plane size={22} />,
      accent: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
      border: 'border-blue-100',
    },
    {
      title: 'Registered Bags',
      value: stats.totalBags,
      icon: <Briefcase size={22} />,
      accent: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-100 text-emerald-600',
      border: 'border-emerald-100',
    },
    {
      title: 'Active Trackings',
      value: stats.activeTracking,
      icon: <MapPin size={22} />,
      accent: 'from-violet-500 to-purple-600',
      iconBg: 'bg-violet-100 text-violet-600',
      border: 'border-violet-100',
    },
    {
      title: 'Total Trips',
      value: stats.totalTrips,
      icon: <History size={22} />,
      accent: 'from-orange-400 to-orange-500',
      iconBg: 'bg-orange-100 text-orange-600',
      border: 'border-orange-100',
    },
  ];

  const quickActions = [
    { label: 'Book New Trip',   to: '/trips',        icon: <Plane size={18} />,       color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    { label: 'Add Baggage',     to: '/bags',         icon: <Briefcase size={18} />,   color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
    { label: 'Live Tracking',   to: '/tracking',     icon: <Map size={18} />,         color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
    { label: 'Buy Device',      to: '/devices',      icon: <ShoppingBag size={18} />, color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Welcome, {user?.fullName?.split(' ')[0]}! 👋
        </h2>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Here's your baggage tracking overview.</p>
      </div>

      {/* Subscription alerts */}
      {subStatus && !subStatus.active && subStatus.hasDevice && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 flex flex-wrap items-start gap-3">
          <Lock className="mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1 min-w-0">
            <strong>Your device subscription has expired.</strong> Trips, bags, and live tracking are paused.
          </div>
          <Link to="/subscription" className="font-bold text-red-700 hover:underline whitespace-nowrap flex items-center gap-1">
            Renew <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {subStatus && !subStatus.active && !subStatus.hasDevice && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex flex-wrap items-start gap-3">
          <Clock className="mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1 min-w-0">
            <strong>Get started with JC Smartbag.</strong> Every device includes <strong>1 month free</strong> premium.
          </div>
          <Link to="/devices" className="font-bold text-airline-blue hover:underline whitespace-nowrap flex items-center gap-1">
            Buy Device <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {subStatus?.active && subStatus.devices.some(d => d.subPlan === 'DEVICE_BONUS' && d.subStatus === 'ACTIVE') && subStatus.expiryDate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex flex-wrap items-start gap-3">
          <Clock className="mt-0.5 flex-shrink-0" size={18} />
          <div className="flex-1 min-w-0">
            <strong>Free trial active</strong> — expires{' '}
            <strong>{format(new Date(subStatus.expiryDate), 'MMM d, yyyy')}</strong>{' '}
            ({formatDistanceToNow(new Date(subStatus.expiryDate), { addSuffix: true })}).
          </div>
          <Link to="/subscription" className="font-bold text-airline-blue hover:underline whitespace-nowrap flex items-center gap-1">
            Subscribe <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {statCards.map((s, i) => (
          <div
            key={i}
            className={`relative bg-white rounded-2xl border ${s.border} shadow-sm p-4 md:p-5 overflow-hidden hover:shadow-md transition-all`}
          >
            {/* Top gradient stripe */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.accent} rounded-t-2xl`} />
            <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center mb-3 ${s.iconBg}`}>
              {s.icon}
            </div>
            <p className="text-gray-500 text-xs md:text-sm font-medium">{s.title}</p>
            <p className="text-2xl md:text-3xl font-black text-gray-900 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
        {/* Latest tracking */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4">Latest Tracking Updates</h3>
          <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center gap-2">
            <MapPin className="text-gray-300" size={32} />
            <p className="text-gray-500 text-sm">No recent tracking updates.</p>
            <Link to="/bags" className="text-xs font-semibold text-airline-blue hover:underline mt-1">
              Add a bag to get started →
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className={`flex items-center gap-2.5 px-4 py-3.5 rounded-xl font-semibold text-sm transition-colors ${a.color}`}
              >
                {a.icon}
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
