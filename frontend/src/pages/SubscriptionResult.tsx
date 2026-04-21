import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function SubscriptionResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const success = searchParams.get('success') === '1';
  const canceled = searchParams.get('canceled') === '1';
  const hasToken = Boolean(typeof localStorage !== 'undefined' && localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || (!success && !canceled)) return;

    let cancelled = false;
    (async () => {
      await checkAuth();
      if (cancelled) return;
      navigate(`/subscription?${searchParams.toString()}`, { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [success, canceled, searchParams, checkAuth, navigate]);

  return (
    <div className="min-h-screen bg-airline-light flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center">
        {success && (
          <>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-airline-dark">Payment successful</h1>
            <p className="mt-3 text-gray-600">
              {hasToken
                ? 'Taking you to your subscription page…'
                : 'Your subscription will be activated shortly. Please sign in to continue.'}
            </p>
          </>
        )}
        {canceled && (
          <>
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-airline-dark">Checkout canceled</h1>
            <p className="mt-3 text-gray-600">
              {hasToken ? 'Taking you back to subscription…' : 'No worries — you can try again anytime.'}
            </p>
          </>
        )}
        {!success && !canceled && (
          <>
            <h1 className="text-2xl font-black text-airline-dark">Subscription</h1>
            <p className="mt-3 text-gray-600">Return to the app to manage your subscription.</p>
          </>
        )}

        {hasToken && (success || canceled) && (
          <Loader2 className="mt-5 h-6 w-6 animate-spin text-airline-sky mx-auto" />
        )}

        <div className="mt-8 flex flex-col gap-3">
          {hasToken ? (
            <Link
              to="/subscription"
              className="w-full bg-airline-blue text-white font-bold py-3 rounded-xl hover:bg-airline-dark transition-colors text-center block"
            >
              Go to Subscription
            </Link>
          ) : (
            <Link
              to="/login"
              className="w-full bg-airline-blue text-white font-bold py-3 rounded-xl hover:bg-airline-dark transition-colors text-center block"
            >
              Go to Login
            </Link>
          )}
          <Link to="/" className="w-full text-airline-blue font-semibold hover:underline text-center">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
