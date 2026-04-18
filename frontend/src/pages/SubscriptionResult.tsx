import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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

        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full bg-airline-blue text-white font-bold py-3 rounded-xl hover:bg-airline-dark transition-colors"
          >
            Go to Login
          </Link>
          <Link to="/home" className="w-full text-airline-blue font-semibold hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

