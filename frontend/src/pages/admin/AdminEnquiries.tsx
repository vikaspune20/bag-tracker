import { useEffect, useState, useCallback } from 'react';
import { Loader2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../utils/api';

interface Enquiry {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

type Filter = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

const STATUS_COLORS: Record<string, string> = {
  OPEN:        'bg-red-500/10 text-red-400 border-red-500/30',
  IN_PROGRESS: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  RESOLVED:    'bg-green-500/10 text-green-400 border-green-500/30',
};

export function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback((p: number, f: Filter) => {
    setLoading(true);
    const params: any = { page: p, limit: 20 };
    if (f !== 'ALL') params.status = f;
    api.get('/admin/enquiries', { params })
      .then(r => {
        setEnquiries(r.data.data);
        setTotal(r.data.total);
        setOpenCount(r.data.openCount ?? 0);
        setTotalPages(r.data.totalPages);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(page, filter); }, [page, filter, load]);

  const toggleExpand = (id: string, e: Enquiry) => {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      setEditNote(e.adminNote || '');
      setEditStatus(e.status);
    }
  };

  const handleSave = async (id: string) => {
    setSaving(id);
    try {
      await api.put(`/admin/enquiries/${id}`, { status: editStatus, adminNote: editNote });
      setEnquiries(prev => prev.map(e =>
        e.id === id ? { ...e, status: editStatus, adminNote: editNote } : e
      ));
      setExpanded(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Enquiries</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} total</p>
        </div>
        {openCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
            {openCount} open
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-800/40 border border-slate-700/50 rounded-xl p-1 w-fit">
        {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : enquiries.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No enquiries found</div>
      ) : (
        <div className="space-y-2">
          {enquiries.map((e) => (
            <div
              key={e.id}
              className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden"
            >
              {/* Header row */}
              <button
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-700/20 transition-colors text-left"
                onClick={() => toggleExpand(e.id, e)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${STATUS_COLORS[e.status]}`}>
                    {e.status.replace('_', ' ')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {e.subject || '(No subject)'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {e.name} · {e.email} · {new Date(e.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {expanded === e.id
                  ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" />
                  : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                }
              </button>

              {/* Expanded content */}
              {expanded === e.id && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-700/50 pt-4">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{e.message}</p>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Admin Note</label>
                    <textarea
                      value={editNote}
                      onChange={ev => setEditNote(ev.target.value)}
                      rows={3}
                      placeholder="Add a note…"
                      className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-slate-400 mb-1 block">Status</label>
                      <select
                        value={editStatus}
                        onChange={ev => setEditStatus(ev.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </div>
                    <div className="flex gap-2 mt-5">
                      <button
                        onClick={() => setExpanded(null)}
                        className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSave(e.id)}
                        disabled={saving === e.id}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving === e.id ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-700">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
