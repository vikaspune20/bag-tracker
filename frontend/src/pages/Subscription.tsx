import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

const plans = [
  {
    id: 'monthly_200',
    label: 'Monthly',
    price: '$200',
    cadence: 'per month',
    priceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY_200 as string | undefined,
  },
  {
    id: 'quarterly_400',
    label: 'Every 3 months',
    price: '$400',
    cadence: 'per 3 months',
    priceId: import.meta.env.VITE_STRIPE_PRICE_QUARTERLY_400 as string | undefined,
  },
  {
    id: 'yearly_600',
    label: 'Yearly',
    price: '$600',
    cadence: 'per year',
    priceId: import.meta.env.VITE_STRIPE_PRICE_YEARLY_600 as string | undefined,
  },
] as const;

export const Subscription = () => {
  const [searchParams] = useSearchParams();
  const [selectedPlanId, setSelectedPlanId] = useState<(typeof plans)[number]['id']>('monthly_200');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [planType, setPlanType] = useState<string | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const success = searchParams.get('success') === '1';
  const canceled = searchParams.get('canceled') === '1';

  const selected = useMemo(() => plans.find((p) => p.id === selectedPlanId)!, [selectedPlanId]);

  const currentPlan = useMemo(() => {
    if (!planType) return null;
    if (planType === 'MONTHLY_200') return plans[0];
    if (planType === 'QUARTERLY_400') return plans[1];
    if (planType === 'YEARLY_600') return plans[2];
    return null;
  }, [planType]);

  const refreshStatus = async () => {
    setStatusLoading(true);
    try {
      const { data } = await api.get('/subscriptions/status');
      setActive(Boolean(data.active));
      setPlanType(data.planType || null);
      setExpiryDate(data.expiryDate || null);
    } catch (e) {
      // ignore
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) refreshStatus();
  }, [isAuthenticated]);

  useEffect(() => {
    if (success && isAuthenticated) refreshStatus();
  }, [success, isAuthenticated]);

  const startCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      if (!isAuthenticated) {
        setError('Please log in first to subscribe.');
        return;
      }
      const priceId = (selected.priceId || '').trim();
      if (!priceId) {
        setError('Missing Stripe priceId. Set VITE_STRIPE_PRICE_* values in frontend/.env');
        return;
      }
      const { data } = await api.post('/subscriptions/checkout-session', { priceId });
      if (!data?.url) throw new Error('Missing checkout URL');
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startCheckoutFor = async (planId: (typeof plans)[number]['id']) => {
    setSelectedPlanId(planId);
    // ensure selected updates before checkout
    await Promise.resolve();
    return startCheckout();
  };

  const cancelSubscription = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/subscriptions/cancel');
      await refreshStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to cancel subscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Subscription</h2>
          <p className="text-sm text-gray-500 mt-1">Choose a plan and checkout with Stripe.</p>
        </div>
        <button
          onClick={refreshStatus}
          disabled={statusLoading}
          className="text-sm font-semibold text-airline-blue hover:underline disabled:opacity-60"
        >
          {statusLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Payment successful. Your subscription will be activated shortly.
        </div>
      )}
      {canceled && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Checkout canceled. You can try again anytime.
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500">Current status</p>
          <p className="text-lg font-bold text-gray-900">
            {!isAuthenticated ? 'Log in to view status' : active ? 'Premium Active' : 'Free'}
          </p>
          {active && (
            <p className="text-sm text-gray-500 mt-1">
              {currentPlan ? (
                <span className="font-medium text-gray-700">Plan: {currentPlan.label}</span>
              ) : planType ? (
                <span>{planType}</span>
              ) : null}
              {expiryDate ? (
                <span className="block sm:inline sm:mt-0 mt-1 sm:ml-2">
                  <span className="text-gray-400 sm:mr-1">·</span>
                  Renews on{' '}
                  <span className="font-semibold text-gray-800">
                    {new Date(expiryDate).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </span>
              ) : null}
            </p>
          )}
        </div>
        {active && (
          <button
            onClick={cancelSubscription}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-red-200 text-red-700 font-semibold hover:bg-red-50 disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </div>

      {isAuthenticated && active && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Current plan</h3>
              <p className="text-sm text-gray-500 mt-1">Basic plan details and upgrade options.</p>
            </div>
          </div>

          {currentPlan ? (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">{currentPlan.label}</p>
                <p className="text-3xl font-black text-airline-dark mt-1">{currentPlan.price}</p>
                <p className="text-sm text-gray-600 mt-1">{currentPlan.cadence}</p>
                {expiryDate && (
                  <p className="text-sm text-gray-600 mt-2">
                    Renews / expires: <span className="font-semibold">{new Date(expiryDate).toLocaleString()}</span>
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-bold text-airline-blue border border-blue-100">
                  ACTIVE
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Your subscription is active, but the plan type couldn’t be determined. (planType: {planType || '—'})
            </div>
          )}

          <div className="mt-6">
            <h4 className="text-sm font-bold text-gray-900">Upgrade</h4>
            <p className="text-sm text-gray-500 mt-1">
              Choose a higher plan and you’ll be redirected to Stripe Checkout.
            </p>
            <div className="mt-3 grid md:grid-cols-3 gap-4">
              {plans.map((p) => {
                const isCurrent = currentPlan?.id === p.id;
                return (
                  <div key={p.id} className={`rounded-2xl border p-5 bg-white ${isCurrent ? 'border-gray-200 opacity-60' : 'border-gray-200'}`}>
                    <p className="font-semibold">{p.label}</p>
                    <p className="text-2xl font-black mt-2">{p.price}</p>
                    <p className="text-sm text-gray-500 mt-1">{p.cadence}</p>
                    <button
                      type="button"
                      disabled={loading || isCurrent}
                      onClick={() => startCheckoutFor(p.id)}
                      className={`mt-4 w-full px-4 py-2.5 rounded-xl font-semibold disabled:opacity-60 ${isCurrent ? 'bg-gray-100 text-gray-600' : 'bg-airline-blue text-white hover:bg-airline-dark'}`}
                    >
                      {isCurrent ? 'Current plan' : 'Upgrade'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const isCurrent = Boolean(active && currentPlan?.id === p.id);
          const isSelected = selectedPlanId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPlanId(p.id)}
              className={`relative text-left p-5 rounded-2xl border transition-shadow bg-white ${
                isCurrent
                  ? 'border-airline-blue ring-2 ring-airline-blue/40 bg-gradient-to-br from-blue-50/80 to-white'
                  : isSelected
                    ? 'border-airline-blue ring-2 ring-blue-200'
                    : 'border-gray-200'
              }`}
            >
              {isCurrent && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-0.5 rounded-full bg-airline-blue px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  <CheckCircle2 className="h-3 w-3" aria-hidden />
                  Current
                </span>
              )}
              <p className="font-semibold pr-16">{p.label}</p>
              <p className="text-3xl font-bold mt-2">{p.price}</p>
              <p className="text-sm text-gray-500 mt-1">{p.cadence}</p>
            </button>
          );
        })}
      </div>
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
        <p className="font-medium">Selected Plan: {selected.label} - {selected.price} {selected.cadence}</p>
        <button onClick={startCheckout} disabled={loading} className="bg-airline-blue text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-60">
          {loading ? 'Loading...' : 'Continue to Payment'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-sm text-gray-600">
        You’ll be redirected to Stripe Checkout to complete your subscription.
      </p>
    </div>
  );
};
