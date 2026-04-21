import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertCircle, AlertTriangle, CheckCircle2, Clock, CreditCard,
  Loader2, RefreshCw, RotateCcw, XCircle
} from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SubscriptionStatus {
  active: boolean;
  planType: string | null;
  subscriptionId: string | null;
  expiryDate: string | null;
  cancelAtPeriodEnd: boolean;
}

interface PaymentRecord {
  id: string;
  planMonths: number;
  amount: number;
  status: string;
  currentPeriodEnd: string | null;
  createdAt: string;
  stripeSubscriptionId: string | null;
}

// ── Plan definitions ──────────────────────────────────────────────────────────
const plans = [
  {
    id: 'monthly_200',
    planType: 'MONTHLY_200',
    label: 'Monthly',
    price: '$200',
    priceNum: 200,
    cadence: 'per month',
    priceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY_200 as string | undefined,
    features: [
      'Unlimited bag tracking',
      'Real-time status notifications',
      'Trip history (12 months)',
      'Priority support',
    ],
  },
  {
    id: 'quarterly_400',
    planType: 'QUARTERLY_400',
    label: 'Quarterly',
    price: '$400',
    priceNum: 400,
    cadence: 'per 3 months',
    priceId: import.meta.env.VITE_STRIPE_PRICE_QUARTERLY_400 as string | undefined,
    highlight: true,
    features: [
      'Everything in Monthly',
      'Save $200 vs monthly',
      'Advanced tracking analytics',
      'Bulk bag registration',
    ],
  },
  {
    id: 'yearly_600',
    planType: 'YEARLY_600',
    label: 'Yearly',
    price: '$600',
    priceNum: 600,
    cadence: 'per year',
    priceId: import.meta.env.VITE_STRIPE_PRICE_YEARLY_600 as string | undefined,
    features: [
      'Everything in Quarterly',
      'Best value — save $1,800/yr',
      'Early access to new features',
      'Dedicated account manager',
    ],
  },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, opts ?? {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function planLabelFromMonths(months: number) {
  if (months === 1) return 'Monthly';
  if (months === 3) return 'Quarterly';
  if (months === 12) return 'Yearly';
  return 'Unknown';
}

function planLabelFromType(planType: string | null) {
  if (planType === 'MONTHLY_200') return 'Monthly';
  if (planType === 'QUARTERLY_400') return 'Quarterly';
  if (planType === 'YEARLY_600') return 'Yearly';
  return planType ?? '—';
}

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 10;

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
    <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
    <div className="h-8 w-28 bg-gray-200 rounded mb-2" />
    <div className="h-4 w-20 bg-gray-100 rounded mb-5" />
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${80 - i * 8}%` }} />)}
    </div>
    <div className="h-10 w-full bg-gray-200 rounded-xl mt-6" />
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export const Subscription = () => {
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [syncError, setSyncError] = useState('');

  const pollAttemptsRef = useRef(0);
  const success = searchParams.get('success') === '1';
  const canceled = searchParams.get('canceled') === '1';

  // ── Fetch status ────────────────────────────────────────────────────────────
  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setStatusLoading(true);
    try {
      const { data } = await api.get<SubscriptionStatus>('/subscriptions/status');
      setStatus(data);
      return data;
    } catch {
      return null;
    } finally {
      if (!silent) setStatusLoading(false);
    }
  }, []);

  // ── Fetch billing history ───────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get<{ history: PaymentRecord[] }>('/subscriptions/history');
      setHistory(data.history ?? []);
    } catch {
      // silently fail — history is not critical
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // ── On mount (normal page load) ─────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || success) return; // success path handled separately
    fetchStatus();
    fetchHistory();
  }, [isAuthenticated, fetchStatus, fetchHistory, success]);

  // ── After successful payment: sync immediately via session_id ───────────────
  useEffect(() => {
    if (!success || !isAuthenticated) return;
    const sessionId = searchParams.get('session_id');
    setSyncError('');

    if (sessionId) {
      api.post('/subscriptions/sync-session', { sessionId })
        .then(({ data }) => {
          if (data.synced) {
            // Fetch fresh confirmed status from DB
            fetchStatus().then(() => fetchHistory());
          } else {
            // Sync said not complete yet — start polling
            setSyncError(data.message || '');
            setPollingActive(true);
          }
        })
        .catch((err) => {
          const msg = err.response?.data?.message || err.message || '';
          setSyncError(msg);
          setPollingActive(true); // fall back to polling
        });
    } else {
      // No session_id — fall back to polling
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

  // ── Actions ─────────────────────────────────────────────────────────────────
  const startCheckout = async (priceId: string) => {
    if (!isAuthenticated) { setError('Please log in first.'); return; }
    const id = priceId.trim();
    if (!id) { setError('Stripe price ID not configured. Check VITE_STRIPE_PRICE_* in frontend/.env'); return; }
    setCheckoutLoading(id);
    setError('');
    try {
      const { data } = await api.post('/subscriptions/checkout-session', { priceId: id });
      if (!data?.url) throw new Error('No checkout URL returned');
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to start checkout. Please try again.');
      setCheckoutLoading(null);
    }
  };

  const confirmCancel = async () => {
    setActionLoading(true);
    setError('');
    try {
      await api.post('/subscriptions/cancel');
      setStatus(prev => prev ? { ...prev, cancelAtPeriodEnd: true } : prev);
      setShowCancelDialog(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to cancel subscription.');
    } finally {
      setActionLoading(false);
    }
  };

  const reactivate = async () => {
    setActionLoading(true);
    setError('');
    try {
      await api.post('/subscriptions/reactivate');
      setStatus(prev => prev ? { ...prev, cancelAtPeriodEnd: false } : prev);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to reactivate subscription.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Derived state ───────────────────────────────────────────────────────────
  const isActive = Boolean(status?.active);
  const isCanceling = isActive && Boolean(status?.cancelAtPeriodEnd);
  const currentPlan = plans.find(p => p.planType === status?.planType) ?? null;
  const isInitialLoading = statusLoading && !status;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subscription</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your plan and billing.</p>
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

      {/* ── Banners ── */}
      {success && !pollingActive && isActive && (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 font-medium">
          <CheckCircle2 size={18} className="flex-shrink-0 text-green-600" />
          Payment successful — your {currentPlan?.label ?? ''} plan is now active!
        </div>
      )}
      {success && pollingActive && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 font-medium">
          <Loader2 size={16} className="animate-spin flex-shrink-0" />
          Activating your subscription — this may take a few seconds…
          {syncError && <span className="ml-2 text-xs text-blue-600 opacity-70">({syncError})</span>}
        </div>
      )}
      {canceled && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium">
          <AlertTriangle size={16} className="flex-shrink-0" />
          Checkout was canceled. Your plan remains unchanged. You can subscribe anytime below.
        </div>
      )}

      {isInitialLoading ? (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
            <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
            <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        </>
      ) : (
        <>
          {/* ── Current plan status card ── */}
          <div className={`bg-white rounded-2xl border p-6 ${isCanceling ? 'border-amber-200' : isActive ? 'border-green-200' : 'border-gray-100'}`}>
            {isCanceling ? (
              /* Canceling state */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={22} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-lg">{currentPlan?.label ?? status?.planType} Plan</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                        Canceling
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      Access continues until <strong>{fmtDate(status?.expiryDate, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong>.
                      Reactivate to keep your plan.
                    </p>
                  </div>
                </div>
                <button
                  onClick={reactivate}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-airline-blue text-white font-semibold hover:bg-airline-dark disabled:opacity-60 flex-shrink-0"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                  Reactivate plan
                </button>
              </div>
            ) : isActive ? (
              /* Active state */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="font-bold text-gray-900 text-lg">{currentPlan?.label ?? planLabelFromType(status?.planType ?? null)} Plan</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1.5">
                    <span className="font-semibold text-gray-800">{currentPlan?.price}</span>
                    <span className="mx-1.5 text-gray-300">·</span>
                    {currentPlan?.cadence}
                    <span className="mx-1.5 text-gray-300">·</span>
                    Renews <strong className="text-gray-800">{fmtDate(status?.expiryDate, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-60 flex-shrink-0"
                >
                  Cancel plan
                </button>
              </div>
            ) : (
              /* Free state */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-400" />
                    <span className="font-bold text-gray-900 text-lg">Free Plan</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1.5">Subscribe below to unlock premium features.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Plan cards ── */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-3">
              {isActive ? 'Switch or Manage Plan' : 'Choose a Plan'}
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isCurrent = isActive && plan.planType === status?.planType;
                const priceId = (plan.priceId || '').trim();
                const isThisLoading = checkoutLoading === priceId;

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-2xl border p-5 flex flex-col transition-shadow ${
                      isCurrent && isCanceling
                        ? 'border-amber-300 ring-2 ring-amber-100'
                        : isCurrent
                          ? 'border-airline-blue ring-2 ring-airline-blue/20'
                          : 'border-gray-200 hover:shadow-md'
                    }`}
                  >
                    {/* Badge */}
                    {isCurrent && (
                      <span className={`absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        isCanceling ? 'bg-amber-100 text-amber-700' : 'bg-airline-blue text-white'
                      }`}>
                        {isCanceling ? <><AlertCircle className="h-3 w-3" />Canceling</> : <><CheckCircle2 className="h-3 w-3" />Active</>}
                      </span>
                    )}

                    <p className="font-bold text-gray-800 pr-20">{plan.label}</p>
                    <p className="text-3xl font-black text-airline-dark mt-2">{plan.price}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{plan.cadence}</p>

                    <ul className="mt-4 space-y-2 flex-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    {isCurrent && isCanceling ? (
                      <button
                        onClick={reactivate}
                        disabled={actionLoading}
                        className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-airline-blue text-white hover:bg-airline-dark disabled:opacity-60"
                      >
                        {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                        Reactivate
                      </button>
                    ) : isCurrent ? (
                      <button disabled className="mt-5 w-full px-4 py-2.5 rounded-xl font-semibold bg-gray-100 text-gray-400 cursor-default">
                        Current plan
                      </button>
                    ) : (
                      <button
                        onClick={() => priceId && startCheckout(priceId)}
                        disabled={!!checkoutLoading || !priceId}
                        className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-airline-blue text-white hover:bg-airline-dark disabled:opacity-60"
                      >
                        {isThisLoading
                          ? <><Loader2 size={16} className="animate-spin" /> Redirecting…</>
                          : isActive ? 'Switch plan' : 'Subscribe'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Billing history ── */}
          <div className="bg-white rounded-2xl border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-airline-sky" />
                <h3 className="font-bold text-gray-900">Billing History</h3>
              </div>
              {historyLoading && <Loader2 size={15} className="animate-spin text-gray-400" />}
            </div>

            {history.length === 0 && !historyLoading ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                No payment records yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {history.map(record => {
                  const isSuccess = record.status === 'active';
                  const isFailed = record.status === 'failed';
                  const planLabel = record.planMonths > 0
                    ? planLabelFromMonths(record.planMonths)
                    : '—';

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
                            {planLabel} Plan
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {fmtDate(record.createdAt, { year: 'numeric', month: 'short', day: 'numeric' })}
                            {record.currentPeriodEnd && isSuccess && (
                              <> · Expires {fmtDate(record.currentPeriodEnd, { year: 'numeric', month: 'short', day: 'numeric' })}</>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isSuccess
                            ? 'bg-green-100 text-green-700'
                            : isFailed
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isSuccess ? 'Paid' : isFailed ? 'Failed' : record.status}
                        </span>
                        <span className="text-sm font-bold text-gray-900 w-16 text-right">
                          {record.amount > 0 ? `$${record.amount}` : '—'}
                        </span>
                        {isFailed && (
                          <button
                            onClick={() => {
                              const monthsToPlanId: Record<number, string> = { 1: 'monthly_200', 3: 'quarterly_400', 12: 'yearly_600' };
                              const pid = monthsToPlanId[record.planMonths];
                              const plan = plans.find(p => p.id === pid);
                              if (plan?.priceId) startCheckout(plan.priceId as string);
                            }}
                            disabled={!!checkoutLoading}
                            className="text-xs font-semibold text-airline-blue hover:underline disabled:opacity-50"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Cancel confirmation dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">Cancel subscription?</h3>
            <p className="mt-2 text-sm text-gray-600 text-center">
              Your <strong>{currentPlan?.label}</strong> plan access continues until{' '}
              <strong>{fmtDate(status?.expiryDate, { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
              You can reactivate anytime before then.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Keep plan
              </button>
              <button
                onClick={confirmCancel}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {actionLoading && <Loader2 size={15} className="animate-spin" />}
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
