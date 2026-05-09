import { useEffect, useState, useCallback } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import api from '../../utils/api';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  quantity: number;
  shippingTrackingNumber: string | null;
  shippingCarrier: string | null;
  createdAt: string;
  user: { fullName: string; email: string };
  devices: { deviceId: string }[];
}

const STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  PAID:      'bg-blue-500/10 text-blue-400 border-blue-500/30',
  SHIPPED:   'bg-purple-500/10 text-purple-400 border-purple-500/30',
  DELIVERED: 'bg-green-500/10 text-green-400 border-green-500/30',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/30',
};

type Filter = 'ALL' | 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editCarrier, setEditCarrier] = useState('');
  const [editTracking, setEditTracking] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback((p: number, f: Filter) => {
    setLoading(true);
    const params: any = { page: p, limit: 20 };
    if (f !== 'ALL') params.status = f;
    api.get('/admin/orders', { params })
      .then(r => {
        setOrders(r.data.data);
        setTotal(r.data.total);
        setTotalPages(r.data.totalPages);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, filter); }, [page, filter, load]);

  const openEdit = (o: Order) => {
    setEditId(o.id);
    setEditStatus(o.status);
    setEditCarrier(o.shippingCarrier || '');
    setEditTracking(o.shippingTrackingNumber || '');
  };

  const handleSave = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await api.put(`/admin/orders/${editId}/status`, {
        status: editStatus,
        shippingCarrier: editCarrier || null,
        shippingTrackingNumber: editTracking || null,
      });
      setEditId(null);
      load(page, filter);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="text-slate-400 text-sm mt-0.5">{total} total</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-800/40 border border-slate-700/50 rounded-xl p-1 w-fit">
        {(['ALL', ...STATUSES] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
                <th className="text-left px-5 py-3 text-xs text-slate-400">Customer</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Amount</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Devices</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Status</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400 hidden md:table-cell">Shipping</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Date</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">No orders</td>
                </tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-700/20">
                  <td className="px-5 py-3">
                    <p className="text-white">{o.user.fullName}</p>
                    <p className="text-xs text-slate-500">{o.user.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-300 font-mono text-xs">
                    ${(o.totalAmount / 100).toFixed(2)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Package size={13} />
                      <span className="text-xs">{o.quantity}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[o.status] ?? ''}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {o.shippingCarrier ? (
                      <div>
                        <p className="text-xs text-slate-300">{o.shippingCarrier}</p>
                        <p className="text-xs text-slate-500 font-mono">{o.shippingTrackingNumber}</p>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => openEdit(o)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Edit
                    </button>
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

      {/* Edit modal */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditId(null)} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-white font-semibold">Update Order</h3>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Status</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {editStatus === 'SHIPPED' && (
              <>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Carrier</label>
                  <input
                    value={editCarrier}
                    onChange={e => setEditCarrier(e.target.value)}
                    placeholder="FedEx, DHL, UPS…"
                    className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Tracking Number</label>
                  <input
                    value={editTracking}
                    onChange={e => setEditTracking(e.target.value)}
                    placeholder="1Z999AA10123456784"
                    className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditId(null)}
                className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
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
