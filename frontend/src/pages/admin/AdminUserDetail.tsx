import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Shield, Trash2, AlertTriangle, UserX } from 'lucide-react';
import api from '../../utils/api';

interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  role: string;
  isPremium: boolean;
  planType: string | null;
  expiryDate: string | null;
  emailVerified: boolean;
  createdAt: string;
  trips: { id: string; departureAirport: string; destinationAirport: string; flightNumber: string; createdAt: string }[];
  trackingDevices: { id: string; deviceId: string; status: string; subStatus: string; subPlan: string | null }[];
  subscriptions: { id: string; planMonths: number; amount: number; status: string; createdAt: string }[];
}

type Tab = 'profile' | 'trips' | 'devices' | 'subscriptions';

export function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('profile');
  const [roleChanging, setRoleChanging] = useState(false);
  const [purgeConfirm, setPurgeConfirm] = useState('');
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);
  const [dataCounts, setDataCounts] = useState<Record<string, number> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/admin/users/${id}`),
      api.get(`/admin/users/${id}/data-counts`),
    ]).then(([uRes, cRes]) => {
      // Backend returns { user: {...} } with nested trips/devices/subscriptions
      const u = uRes.data.user ?? uRes.data;
      setUser({
        ...u,
        trips: u.trips ?? [],
        trackingDevices: u.devices ?? u.trackingDevices ?? [],
        subscriptions: u.subscriptions ?? [],
      });
      setDataCounts(cRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleRoleChange = async () => {
    if (!user) return;
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Change role to ${newRole}?`)) return;
    setRoleChanging(true);
    try {
      await api.put(`/admin/users/${user.id}/role`, { role: newRole });
      setUser(prev => prev ? { ...prev, role: newRole } : prev);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update role');
    } finally {
      setRoleChanging(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user || deleteConfirm !== user.email) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${user.id}`);
      navigate('/admin/users');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handlePurge = async () => {
    if (!user || purgeConfirm !== user.email) return;
    setPurging(true);
    try {
      const r = await api.delete(`/admin/users/${user.id}/data`);
      const d = r.data.deleted;
      setPurgeResult(
        `Purged: ${d.trips} trips, ${d.bags} bags, ${d.trackingLogs} logs, ${d.devices} devices, ${d.subscriptions} subs, ${d.orders} orders, ${d.notifications} notifications`
      );
      setPurgeConfirm('');
      setDataCounts({ trips: 0, bags: 0, devices: 0, subscriptions: 0, orders: 0, notifications: 0, trackingLogs: 0 });
    } catch (e: any) {
      alert(e.response?.data?.message || 'Purge failed');
    } finally {
      setPurging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) return <div className="text-slate-400 py-10 text-center">User not found</div>;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'trips', label: 'Trips', count: user.trips.length },
    { key: 'devices', label: 'Devices', count: user.trackingDevices.length },
    { key: 'subscriptions', label: 'Subscriptions', count: user.subscriptions.length },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
        <ChevronLeft size={16} />
        Back to Users
      </Link>

      {/* Header */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
              {user.fullName?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{user.fullName}</h1>
              <p className="text-slate-400 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                  user.role === 'ADMIN'
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : 'bg-slate-700 text-slate-400 border-slate-600'
                }`}>{user.role}</span>
                {user.isPremium && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">PREMIUM</span>
                )}
                {user.emailVerified && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/30">VERIFIED</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleRoleChange}
            disabled={roleChanging}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Shield size={15} />
            {roleChanging ? 'Updating…' : user.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/40 border border-slate-700/50 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="text-xs bg-slate-600 px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'profile' && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Full Name', user.fullName],
              ['Email', user.email],
              ['Phone', user.phone || '—'],
              ['Address', user.address || '—'],
              ['City', user.city || '—'],
              ['Country', user.country || '—'],
              ['Plan', user.planType || '—'],
              ['Expiry', user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : '—'],
              ['Joined', new Date(user.createdAt).toLocaleDateString()],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                <p className="text-white">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'trips' && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-5 py-3 text-xs text-slate-400">Route</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Flight</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {user.trips.map((t) => (
                <tr key={t.id} className="hover:bg-slate-700/20">
                  <td className="px-5 py-3 text-white">{t.departureAirport} → {t.destinationAirport}</td>
                  <td className="px-5 py-3 text-slate-400">{t.flightNumber}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {user.trips.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-500">No trips</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'devices' && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-5 py-3 text-xs text-slate-400">Device ID</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Status</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Sub Status</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {user.trackingDevices.map((d) => (
                <tr key={d.id} className="hover:bg-slate-700/20">
                  <td className="px-5 py-3 text-white font-mono text-xs">{d.deviceId}</td>
                  <td className="px-5 py-3 text-slate-400">{d.status}</td>
                  <td className="px-5 py-3 text-slate-400">{d.subStatus}</td>
                  <td className="px-5 py-3 text-slate-400">{d.subPlan || '—'}</td>
                </tr>
              ))}
              {user.trackingDevices.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No devices</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'subscriptions' && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-5 py-3 text-xs text-slate-400">Plan</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Amount</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Status</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {user.subscriptions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-700/20">
                  <td className="px-5 py-3 text-white">{s.planMonths}mo</td>
                  <td className="px-5 py-3 text-slate-300 font-mono">${s.amount}</td>
                  <td className="px-5 py-3 text-slate-400">{s.status}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {user.subscriptions.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No subscriptions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Danger Zone */}
      <div className="border border-red-500/30 rounded-xl p-6 bg-red-500/5 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400" />
          <h3 className="text-red-400 font-semibold text-sm">Danger Zone</h3>
        </div>

        {dataCounts && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 text-xs">
            {Object.entries(dataCounts).map(([k, v]) => (
              <div key={k} className="bg-slate-800/60 rounded-lg p-2.5 text-center">
                <p className="text-white font-bold text-lg">{v}</p>
                <p className="text-slate-500 capitalize">{k}</p>
              </div>
            ))}
          </div>
        )}

        {purgeResult && (
          <p className="text-green-400 text-xs bg-green-500/10 px-3 py-2 rounded-lg">{purgeResult}</p>
        )}

        <div>
          <p className="text-slate-400 text-xs mb-2">
            Type <span className="text-red-400 font-mono">{user.email}</span> to confirm purge
          </p>
          <div className="flex gap-2">
            <input
              value={purgeConfirm}
              onChange={e => setPurgeConfirm(e.target.value)}
              placeholder={user.email}
              className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-red-500"
            />
            <button
              onClick={handlePurge}
              disabled={purgeConfirm !== user.email || purging}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-40"
            >
              <Trash2 size={15} />
              {purging ? 'Purging…' : 'Purge Data'}
            </button>
          </div>
          <p className="text-slate-500 text-xs mt-1.5">User account is preserved. Only data is deleted.</p>
        </div>

        {/* Delete account */}
        <div className="border-t border-red-500/20 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <UserX size={14} className="text-red-500" />
            <p className="text-red-400 text-xs font-semibold">Delete Account Permanently</p>
          </div>
          <p className="text-slate-400 text-xs mb-2">
            Type <span className="text-red-400 font-mono">{user.email}</span> to permanently delete this account and all its data. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder={user.email}
              className="flex-1 bg-slate-900 border border-red-500/50 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-red-500"
            />
            <button
              onClick={handleDeleteUser}
              disabled={deleteConfirm !== user.email || deleting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-800 hover:bg-red-900 text-white text-sm font-medium transition-colors disabled:opacity-40"
            >
              <UserX size={15} />
              {deleting ? 'Deleting…' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
