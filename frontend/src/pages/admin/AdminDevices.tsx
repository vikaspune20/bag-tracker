import { useEffect, useState, useCallback } from 'react';
import { Loader2, CheckCircle, XCircle, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';

interface Device {
  id: string;
  deviceId: string;
  status: string;
  subStatus: string;
  subPlan: string | null;
  subExpiry: string | null;
  expiresAt: string | null;
  user: { id: string; fullName: string; email: string } | null;
  order: { id: string; totalAmount: number } | null;
}

type Filter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

const SUB_STATUSES = ['NONE', 'ACTIVE', 'EXPIRED'];
const SUB_PLANS = ['MONTHLY_200', 'QUARTERLY_400', 'YEARLY_600', 'DEVICE_BONUS'];

export function AdminDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit sub modal
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [subStatus, setSubStatus] = useState('ACTIVE');
  const [subPlan, setSubPlan] = useState('MONTHLY_200');
  const [subExpiry, setSubExpiry] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback((p: number, f: Filter) => {
    setLoading(true);
    const params: any = { page: p, limit: 20 };
    if (f !== 'ALL') params.status = f;
    api.get('/admin/devices', { params })
      .then(r => {
        setDevices(r.data.data);
        setTotal(r.data.total);
        setTotalPages(r.data.totalPages);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, filter); }, [page, filter, load]);

  const handleActivate = async (id: string) => {
    setActionLoading(id + '-act');
    try {
      await api.put(`/admin/devices/${id}/activate`);
      load(page, filter);
    } finally { setActionLoading(null); }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this device?')) return;
    setActionLoading(id + '-deact');
    try {
      await api.put(`/admin/devices/${id}/deactivate`);
      load(page, filter);
    } finally { setActionLoading(null); }
  };

  const openEditSub = (d: Device) => {
    setEditDevice(d);
    setSubStatus(d.subStatus || 'ACTIVE');
    setSubPlan(d.subPlan || 'MONTHLY_200');
    setSubExpiry(d.subExpiry ? d.subExpiry.split('T')[0] : '');
  };

  const handleSaveSub = async () => {
    if (!editDevice) return;
    setSaving(true);
    try {
      await api.put(`/admin/devices/${editDevice.id}/subscription`, {
        subStatus,
        subPlan,
        subExpiry: subExpiry ? new Date(subExpiry).toISOString() : null,
      });
      setEditDevice(null);
      load(page, filter);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const STATUS_BADGE: Record<string, string> = {
    ACTIVE:   'bg-green-500/10 text-green-400 border-green-500/30',
    EXPIRED:  'bg-red-500/10 text-red-400 border-red-500/30',
    INACTIVE: 'bg-slate-700 text-slate-400 border-slate-600',
    NONE:     'bg-slate-700/50 text-slate-500 border-slate-600/50',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Devices</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} total</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-800/40 border border-slate-700/50 rounded-xl p-1 w-fit">
        {(['ALL', 'ACTIVE', 'INACTIVE', 'EXPIRED'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === f ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-5 py-3 text-xs text-slate-400">Device</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Owner</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Status</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Sub</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Expiry</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">No devices</td>
                </tr>
              ) : devices.map((d) => (
                <tr key={d.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-white font-mono text-xs">{d.deviceId}</p>
                  </td>
                  <td className="px-5 py-3">
                    {d.user ? (
                      <>
                        <p className="text-white text-sm">{d.user.fullName}</p>
                        <p className="text-xs text-slate-500">{d.user.email}</p>
                      </>
                    ) : <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[d.status] ?? STATUS_BADGE.INACTIVE}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[d.subStatus] ?? STATUS_BADGE.NONE}`}>
                      {d.subStatus}
                    </span>
                    {d.subPlan && (
                      <p className="text-xs text-slate-500 mt-0.5">{d.subPlan.replace(/_/g, ' ')}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {d.subExpiry ? new Date(d.subExpiry).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleActivate(d.id)}
                        disabled={actionLoading === d.id + '-act' || d.status === 'ACTIVE'}
                        title="Activate"
                        className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-40 transition-colors"
                      >
                        {actionLoading === d.id + '-act'
                          ? <Loader2 size={14} className="animate-spin" />
                          : <CheckCircle size={14} />
                        }
                      </button>
                      <button
                        onClick={() => handleDeactivate(d.id)}
                        disabled={actionLoading === d.id + '-deact' || d.status === 'EXPIRED'}
                        title="Deactivate"
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-40 transition-colors"
                      >
                        {actionLoading === d.id + '-deact'
                          ? <Loader2 size={14} className="animate-spin" />
                          : <XCircle size={14} />
                        }
                      </button>
                      <button
                        onClick={() => openEditSub(d)}
                        title="Edit Subscription"
                        className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                      >
                        <Settings size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-700/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg bg-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-600">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg bg-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-600">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Sub Modal */}
      {editDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditDevice(null)} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-white font-semibold">Edit Subscription</h3>
            <p className="text-xs text-slate-400 font-mono">{editDevice.deviceId}</p>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Status</label>
              <select
                value={subStatus}
                onChange={e => setSubStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {SUB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Plan</label>
              <select
                value={subPlan}
                onChange={e => setSubPlan(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {SUB_PLANS.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Expiry Date</label>
              <input
                type="date"
                value={subExpiry}
                onChange={e => setSubExpiry(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditDevice(null)}
                className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSub}
                disabled={saving}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
