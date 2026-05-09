import { useEffect, useState, useCallback } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';

interface Sub {
  id: string;
  planMonths: number;
  amount: number;
  status: string;
  createdAt: string;
  currentPeriodEnd: string | null;
  user: { fullName: string; email: string };
  deviceTag: string | null;
}

export function AdminSubscriptions() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback((p: number) => {
    setLoading(true);
    api.get('/admin/subscriptions', { params: { page: p, limit: 25 } })
      .then(r => {
        setSubs(r.data.data);
        setTotal(r.data.total);
        setTotalPages(r.data.totalPages);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const STATUS_COLORS: Record<string, string> = {
    active:   'bg-green-500/10 text-green-400 border-green-500/30',
    expired:  'bg-red-500/10 text-red-400 border-red-500/30',
    canceled: 'bg-slate-700 text-slate-400 border-slate-600',
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
        <p className="text-slate-400 text-sm mt-0.5">{total} total payments</p>
      </div>

      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-5 py-3 text-xs text-slate-400">Customer</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Plan</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Amount</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Status</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400 hidden md:table-cell">Device</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400 hidden md:table-cell">Ends</th>
                <th className="text-left px-5 py-3 text-xs text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : subs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">No subscriptions</td>
                </tr>
              ) : subs.map((s) => (
                <tr key={s.id} className="hover:bg-slate-700/20">
                  <td className="px-5 py-3">
                    <p className="text-white">{s.user.fullName}</p>
                    <p className="text-xs text-slate-500">{s.user.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-300">{s.planMonths}mo</td>
                  <td className="px-5 py-3 text-slate-300 font-mono">${s.amount}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[s.status] ?? 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs font-mono text-slate-500 hidden md:table-cell">
                    {s.deviceTag || '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs hidden md:table-cell">
                    {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {new Date(s.createdAt).toLocaleDateString()}
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
    </div>
  );
}
