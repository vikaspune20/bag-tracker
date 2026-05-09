import { useState, useCallback } from 'react';
import { Search, Loader2, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

interface UserResult {
  id: string;
  fullName: string;
  email: string;
  isPremium: boolean;
  createdAt: string;
}

interface DataCounts {
  trips: number;
  bags: number;
  trackingLogs: number;
  devices: number;
  subscriptions: number;
  orders: number;
  notifications: number;
}

interface PurgeResult {
  deleted: DataCounts;
}

export function AdminDataPurge() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<UserResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<UserResult | null>(null);
  const [counts, setCounts] = useState<DataCounts | null>(null);
  const [countsLoading, setCountsLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<PurgeResult | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setResults([]);
    setSelected(null);
    setCounts(null);
    setPurgeResult(null);
    try {
      const r = await api.get('/admin/users', { params: { search: query.trim(), limit: 10 } });
      setResults(r.data.data);
      if (r.data.data.length === 0) setSearchError('No users found');
    } catch (e: any) {
      setSearchError(e.response?.data?.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  }, [query]);

  const selectUser = async (u: UserResult) => {
    setSelected(u);
    setConfirmEmail('');
    setPurgeResult(null);
    setCountsLoading(true);
    try {
      const r = await api.get(`/admin/users/${u.id}/data-counts`);
      setCounts(r.data);
    } finally {
      setCountsLoading(false);
    }
  };

  const handlePurge = async () => {
    if (!selected || confirmEmail !== selected.email) return;
    setPurging(true);
    try {
      const r = await api.delete(`/admin/users/${selected.id}/data`);
      setPurgeResult(r.data);
      setCounts({ trips: 0, bags: 0, trackingLogs: 0, devices: 0, subscriptions: 0, orders: 0, notifications: 0 });
      setConfirmEmail('');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Purge failed');
    } finally {
      setPurging(false);
    }
  };

  const countItems: { key: keyof DataCounts; label: string; color: string }[] = [
    { key: 'trips',        label: 'Trips',         color: 'text-blue-400' },
    { key: 'bags',         label: 'Bags',           color: 'text-purple-400' },
    { key: 'trackingLogs', label: 'Tracking Logs',  color: 'text-cyan-400' },
    { key: 'devices',      label: 'Devices',        color: 'text-amber-400' },
    { key: 'subscriptions',label: 'Subscriptions',  color: 'text-green-400' },
    { key: 'orders',       label: 'Orders',         color: 'text-pink-400' },
    { key: 'notifications',label: 'Notifications',  color: 'text-slate-400' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Data Purge</h1>
        <p className="text-slate-400 text-sm mt-0.5">Delete all user data for testing. User account is preserved.</p>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
        <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-red-300 text-sm">
          This permanently deletes all trips, bags, tracking logs, devices, subscriptions, orders, and notifications. The user account row is kept.
        </p>
      </div>

      {/* User search */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm">1. Find User</h2>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Name, email, or phone…"
            className="flex-1 bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Search
          </button>
        </div>
        {searchError && <p className="text-red-400 text-xs">{searchError}</p>}

        {results.length > 0 && (
          <div className="space-y-1">
            {results.map((u) => (
              <button
                key={u.id}
                onClick={() => selectUser(u)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  selected?.id === u.id
                    ? 'bg-blue-600/20 border-blue-500/50 text-white'
                    : 'bg-slate-900/50 border-slate-700/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                <p className="font-medium text-sm">{u.fullName}</p>
                <p className="text-xs text-slate-500">{u.email}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Data counts */}
      {selected && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold text-sm">2. Data Summary for <span className="text-blue-400">{selected.fullName}</span></h2>

          {countsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          ) : counts ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {countItems.map(({ key, label, color }) => (
                <div key={key} className="bg-slate-900/60 rounded-xl p-3 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{counts[key]}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Confirm & purge */}
      {selected && counts && !purgeResult && (
        <div className="border border-red-500/30 rounded-xl p-5 bg-red-500/5 space-y-4">
          <h2 className="text-red-400 font-semibold text-sm flex items-center gap-2">
            <Trash2 size={14} />
            3. Confirm Purge
          </h2>
          <p className="text-slate-400 text-sm">
            Type <span className="text-red-400 font-mono">{selected.email}</span> to enable the purge button
          </p>
          <input
            value={confirmEmail}
            onChange={e => setConfirmEmail(e.target.value)}
            placeholder={selected.email}
            className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-red-500 placeholder:text-slate-600"
          />
          <button
            onClick={handlePurge}
            disabled={confirmEmail !== selected.email || purging}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            {purging ? (
              <><Loader2 size={15} className="animate-spin" /> Purging…</>
            ) : (
              <><Trash2 size={15} /> Purge All Data</>
            )}
          </button>
        </div>
      )}

      {/* Success */}
      {purgeResult && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <h3 className="text-green-400 font-semibold text-sm">Purge Complete</h3>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {countItems.map(({ key, label }) => (
              <div key={key} className="bg-slate-900/60 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{purgeResult.deleted[key]}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label} deleted</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
