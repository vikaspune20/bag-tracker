import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle, AlertTriangle, CheckCircle2, Clock,
  CreditCard, Loader2, RefreshCw, ShoppingBag, XCircle,
} from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import type { DeviceSubStatus } from '../hooks/useSubscriptionStatus';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatusResponse {
  active: boolean;
  planType: string | null;
  expiryDate: string | null;
  hasDevice: boolean;
  deviceCount: number;
  devices: DeviceSubStatus[];
}

interface PaymentRecord {
  id: string;
  deviceId: string | null;
  deviceShortId: string | null;
  planMonths: number;
  amount: number;
  status: string;
  currentPeriodEnd: string | null;
  createdAt: string;
}

// ── Plan definitions ──────────────────────────────────────────────────────────

type Plan = { id: 'MONTHLY_200' | 'QUARTERLY_400' | 'YEARLY_600'; label: string; price: string; cadence: string; months: number };

const CADENCE: Record<string, string> = {
  MONTHLY_200:   '/month',
  QUARTERLY_400: '/3 months',
  YEARLY_600:    '/year',
};

const PLAN_LABELS: Record<string, string> = {
  MONTHLY_200:   'Monthly',
  QUARTERLY_400: 'Quarterly',
  YEARLY_600:    'Yearly',
};

// Default fallback (shown before API responds)
const PLANS_DEFAULT: Plan[] = [
  { id: 'MONTHLY_200',   label: 'Monthly',   price: '$19.99', cadence: '/month',    months: 1  },
  { id: 'QUARTERLY_400', label: 'Quarterly', price: '$49.99', cadence: '/3 months', months: 3  },
  { id: 'YEARLY_600',    label: 'Yearly',    price: '$219.99',cadence: '/year',     months: 12 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function planLabel(plan: string | null): string {
  if (plan === 'MONTHLY_200')   return 'Monthly';
  if (plan === 'QUARTERLY_400') return 'Quarterly';
  if (plan === 'YEARLY_600')    return 'Yearly';
  if (plan === 'DEVICE_BONUS')  return 'Free (Device Bonus)';
  return plan ?? '—';
}

function subStatusBadge(s: DeviceSubStatus) {
  const isActive = s.subStatus === 'ACTIVE' && s.subExpiry && new Date(s.subExpiry) > new Date();
  const isExpired = s.subStatus === 'EXPIRED' || (s.subStatus === 'ACTIVE' && s.subExpiry && new Date(s.subExpiry) <= new Date());
  if (isActive)  return { label: 'Active',  cls: 'bg-green-100 text-green-700' };
  if (isExpired) return { label: 'Expired', cls: 'bg-red-100 text-red-700'   };
  return           { label: 'No plan',  cls: 'bg-gray-100 text-gray-500'  };
}

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 10;

// ── Main Component ────────────────────────────────────────────────────────────

export const Subscription = () => {
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>(PLANS_DEFAULT);

  // Selection state: Set of device.id strings
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Plan choice per device: deviceId → Plan id
  const [planChoice, setPlanChoice] = useState<Record<string, Plan['id']>>({});

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');
  const [pollingActive, setPollingActive] = useState(false);
  const [syncError, setSyncError] = useState('');
  const pollAttemptsRef = useRef(0);

  const success = searchParams.get('success') === '1';
  const canceled = searchParams.get('canceled') === '1';

  // ── Fetch status ────────────────────────────────────────────────────────────
  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setStatusLoading(true);
    try {
      const { data } = await api.get<StatusResponse>('/subscriptions/status');
      setStatus(data);
      return data;
    } catch { return null; }
    finally { if (!silent) setStatusLoading(false); }
  }, []);

  // ── Fetch billing history ───────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get<{ history: PaymentRecord[] }>('/subscriptions/history');
      setHistory(data.history ?? []);
    } catch { /* silently fail */ }
    finally { setHistoryLoading(false); }
  }, []);

  // ── Fetch live pricing from admin config ────────────────────────────────────
  useEffect(() => {
    api.get('/admin/pricing').then(({ data }) => {
      const rows: Array<{ key: string; cents: number; months: number }> = data.pricing ?? [];
      const order = ['MONTHLY_200', 'QUARTERLY_400', 'YEARLY_600'];
      const mapped = order
        .map(key => {
          const row = rows.find(r => r.key === key);
          if (!row) return null;
          const dollars = (row.cents / 100).toFixed(2).replace(/\.00$/, '');
          return {
            id: key as Plan['id'],
            label: PLAN_LABELS[key] ?? key,
            price: `$${dollars}`,
            cadence: CADENCE[key] ?? '',
            months: row.months,
          };
        })
        .filter(Boolean) as Plan[];
      if (mapped.length > 0) setPlans(mapped);
    }).catch(() => { /* keep defaults */ });
  }, []);

  // ── On mount ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || success) return;
    fetchStatus();
    fetchHistory();
  }, [isAuthenticated, fetchStatus, fetchHistory, success]);

  // ── After successful payment: sync via session_id ───────────────────────────
  useEffect(() => {
    if (!success || !isAuthenticated) return;
    const sessionId = searchParams.get('session_id');
    setSyncError('');
    if (sessionId) {
      api.post('/subscriptions/device-sync-session', { sessionId })
        .then(({ data }) => {
          if (data.synced) {
            fetchStatus().then(() => fetchHistory());
          } else {
            setSyncError(data.message || '');
            setPollingActive(true);
          }
        })
        .catch((err) => {
          setSyncError(err.response?.data?.message || err.message || '');
          setPollingActive(true);
        });
    } else {
      setPollingActive(true);
    }
  }, [success, isAuthenticated, searchParams, fetchStatus, fetchHistory]);

  // ── Polling fallback ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pollingActive || !isAuthenticated) return;
    pollAttemptsRef.current = 0;
    const timer = setInterval(async () => {
      pollAttemptsRef.current += 1;
      const fresh = await fetchStatus(true);
      if (fresh?.active || pollAttemptsRef.current >= POLL_MAX_ATTEMPTS) {
        setPollingActive(false);
        clearInterval(timer);
        if (fresh?.active) fetchHistory();
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [pollingActive, isAuthenticated, fetchStatus, fetchHistory]);

  // ── Selection helpers ───────────────────────────────────────────────────────
  const toggleDevice = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    // Default plan if not yet chosen
    setPlanChoice(prev => prev[id] ? prev : { ...prev, [id]: 'MONTHLY_200' });
  };

  const selectAll = () => {
    const all = new Set((status?.devices ?? []).map(d => d.id));
    setSelected(all);
    const defaults: Record<string, Plan['id']> = {};
    (status?.devices ?? []).forEach(d => { if (!planChoice[d.id]) defaults[d.id] = 'MONTHLY_200'; });
    setPlanChoice(prev => ({ ...defaults, ...prev }));
  };

  const clearAll = () => setSelected(new Set());

  // ── Subscribe/Renew CTA ─────────────────────────────────────────────────────
  const startCheckout = async () => {
    if (!isAuthenticated) { setError('Please log in first.'); return; }
    const selections = Array.from(selected).map(id => ({
      deviceId: id,
      plan: planChoice[id] || 'MONTHLY_200',
    }));
    if (!selections.length) { setError('Select at least one device.'); return; }
    setCheckoutLoading(true);
    setError('');
    try {
      const { data } = await api.post('/subscriptions/device-checkout-session', { selections });
      if (!data?.url) throw new Error('No checkout URL returned');
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to start checkout. Please try again.');
      setCheckoutLoading(false);
    }
  };

  // ── Quick-renew a single device ─────────────────────────────────────────────
  const quickRenew = (id: string) => {
    setSelected(new Set([id]));
    if (!planChoice[id]) setPlanChoice(prev => ({ ...prev, [id]: 'MONTHLY_200' }));
    // Scroll to selection panel
    document.getElementById('renew-panel')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedDevices = (status?.devices ?? []).filter(d => selected.has(d.id));
  const total = selectedDevices.reduce((acc, d) => {
    const plan = plans.find(p => p.id === (planChoice[d.id] || 'MONTHLY_200'))!;
    return acc + parseInt(plan.price.replace('$', ''), 10);
  }, 0);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Device Subscriptions</h2>
          <p className="text-sm text-gray-500 mt-1">Manage subscription plans for each of your tracking devices.</p>
        </div>
        <button
          onClick={() => { fetchStatus(); fetchHistory(); }}
          disabled={statusLoading}
          className="flex items-center gap-1.5 text-sm font-semibold text-airline-blue hover:underline disabled:opacity-60"
        >
          <RefreshCw size={14} className={statusLoading ? 'animate-spin' : ''} />
          {statusLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Banners */}
      {success && !pollingActive && status?.active && (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 font-medium">
          <CheckCircle2 size={18} className="flex-shrink-0 text-green-600" />
          Payment successful — your device subscription is now active!
        </div>
      )}
      {success && pollingActive && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 font-medium">
          <Loader2 size={16} className="animate-spin flex-shrink-0" />
          Activating your subscription — this may take a few seconds…
          {syncError && <span className="ml-2 text-xs opacity-70">({syncError})</span>}
        </div>
      )}
      {canceled && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium">
          <AlertTriangle size={16} className="flex-shrink-0" />
          Checkout was canceled. Your plan remains unchanged. You can subscribe anytime below.
        </div>
      )}

      {/* ── Section A: Device list ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Your Devices</h3>
          {(status?.devices ?? []).length > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <button onClick={selectAll} className="font-semibold text-airline-blue hover:underline">Select all</button>
              <span className="text-gray-300">|</span>
              <button onClick={clearAll} className="font-semibold text-gray-500 hover:underline">Clear</button>
            </div>
          )}
        </div>

        {statusLoading ? (
          <div className="divide-y divide-gray-50">
            {[1, 2].map(i => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                  <div className="h-3 w-56 bg-gray-100 rounded" />
                </div>
                <div className="h-6 w-16 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : (status?.devices ?? []).length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ShoppingBag size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">No tracking devices yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              <Link to="/devices" className="text-airline-blue hover:underline font-semibold">Buy a device</Link>
              {' '}to get started — every device includes 1 month free.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(status?.devices ?? []).map(device => {
              const badge = subStatusBadge(device);
              const isChecked = selected.has(device.id);
              const days = daysUntil(device.subExpiry);
              return (
                <div
                  key={device.id}
                  className={`px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors ${isChecked ? 'bg-blue-50/40' : ''}`}
                  onClick={() => toggleDevice(device.id)}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleDevice(device.id)}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 accent-airline-blue rounded cursor-pointer flex-shrink-0"
                  />

                  {/* Device info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-semibold text-sm text-gray-900 truncate">{device.deviceId}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {device.subStatus === 'ACTIVE' && device.subExpiry ? (
                        <>
                          <span className="font-medium text-gray-600">{planLabel(device.subPlan)}</span>
                          {' · '}Expires {fmtDate(device.subExpiry)}
                          {days !== null && days <= 14 && (
                            <span className={`ml-1.5 font-semibold ${days <= 3 ? 'text-red-600' : 'text-amber-600'}`}>
                              ({days === 0 ? 'expires today' : `${days}d left`})
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="italic text-gray-400">No active subscription</span>
                      )}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold flex-shrink-0 ${badge.cls}`}>
                    {badge.label}
                  </span>

                  {/* Quick renew */}
                  <button
                    onClick={e => { e.stopPropagation(); quickRenew(device.id); }}
                    className="text-xs font-semibold text-airline-blue hover:underline flex-shrink-0 px-1"
                  >
                    Renew
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section B: Plan selection & checkout (only when devices selected) ── */}
      {selected.size > 0 && (
        <div id="renew-panel" className="bg-white rounded-2xl border border-airline-blue/30 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-airline-blue/5">
            <h3 className="font-bold text-gray-900">
              Subscribe / Renew — {selected.size} device{selected.size > 1 ? 's' : ''} selected
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">Choose a plan for each selected device.</p>
          </div>

          <div className="divide-y divide-gray-50">
            {selectedDevices.map(device => {
              const currentPlan = planChoice[device.id] || 'MONTHLY_200';
              return (
                <div key={device.id} className="px-6 py-4">
                  {/* Device label */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-sm font-semibold text-gray-800">{device.deviceId}</span>
                    {device.subStatus === 'ACTIVE' && device.subExpiry && (
                      <span className="text-xs text-gray-400">· currently expires {fmtDate(device.subExpiry)}</span>
                    )}
                  </div>
                  {/* Plan radio buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {plans.map(plan => (
                      <label
                        key={plan.id}
                        className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          currentPlan === plan.id
                            ? 'border-airline-blue bg-airline-blue/5 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`plan-${device.id}`}
                          value={plan.id}
                          checked={currentPlan === plan.id}
                          onChange={() => setPlanChoice(prev => ({ ...prev, [device.id]: plan.id }))}
                          className="sr-only"
                        />
                        <span className={`text-sm font-bold ${currentPlan === plan.id ? 'text-airline-blue' : 'text-gray-700'}`}>
                          {plan.label}
                        </span>
                        <span className={`text-lg font-black ${currentPlan === plan.id ? 'text-airline-dark' : 'text-gray-800'}`}>
                          {plan.price}
                        </span>
                        <span className="text-xs text-gray-400">{plan.cadence}</span>
                        {currentPlan === plan.id && (
                          <CheckCircle2 size={14} className="absolute top-2 right-2 text-airline-blue" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary + CTA */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-sm text-gray-500">Total for {selected.size} device{selected.size > 1 ? 's' : ''}:</span>
              <span className="ml-2 text-xl font-black text-airline-dark">${total}</span>
              <span className="ml-1 text-sm text-gray-400">(one-time)</span>
            </div>
            <button
              onClick={startCheckout}
              disabled={checkoutLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-airline-blue text-white font-bold hover:bg-airline-dark disabled:opacity-60 transition-colors"
            >
              {checkoutLoading
                ? <><Loader2 size={16} className="animate-spin" /> Redirecting…</>
                : <><CreditCard size={16} /> Subscribe / Renew</>}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Section C: Billing History ── */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-airline-sky" />
            <h3 className="font-bold text-gray-900">Billing History</h3>
          </div>
          {historyLoading && <Loader2 size={15} className="animate-spin text-gray-400" />}
        </div>

        {history.length === 0 && !historyLoading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">No payment records yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.map(record => {
              const isSuccess = record.status === 'active';
              const isFailed  = record.status === 'failed';
              const months = record.planMonths;
              const label = months === 1 ? 'Monthly' : months === 3 ? 'Quarterly' : months === 12 ? 'Yearly' : '—';
              return (
                <div key={record.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSuccess ? 'bg-green-50' : isFailed ? 'bg-red-50' : 'bg-gray-100'
                    }`}>
                      {isSuccess
                        ? <CheckCircle2 size={16} className="text-green-600" />
                        : isFailed
                          ? <XCircle size={16} className="text-red-500" />
                          : <Clock size={16} className="text-gray-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {label} Plan
                        {record.deviceShortId && (
                          <span className="ml-2 font-mono text-xs text-gray-400">…{record.deviceShortId}</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fmtDate(record.createdAt)}
                        {record.currentPeriodEnd && isSuccess && (
                          <> · Expires {fmtDate(record.currentPeriodEnd)}</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      isSuccess ? 'bg-green-100 text-green-700' : isFailed ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isSuccess ? 'Paid' : isFailed ? 'Failed' : record.status}
                    </span>
                    <span className="text-sm font-bold text-gray-900 w-16 text-right">
                      {record.amount > 0 ? `$${record.amount}` : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
