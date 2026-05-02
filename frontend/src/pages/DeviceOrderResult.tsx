import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

export const DeviceOrderResult = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get('session_id') || '';
  const checkAuth = useAuthStore((s) => s.checkAuth);

  const [state, setState] = useState<'pending' | 'success' | 'error'>('pending');
  const [bonusGranted, setBonusGranted] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setState('error');
      setErrorMsg('Missing session id');
      return;
    }

    let cancelled = false;
    const tryOnce = async () => {
      const { data } = await api.post('/devices/sync-session', { sessionId });
      return data as { synced: boolean; devices: any[]; bonusGranted: boolean; message?: string };
    };

    (async () => {
      for (let i = 0; i < 10; i++) {
        if (cancelled) return;
        try {
          const data = await tryOnce();
          if (data.synced) {
            setBonusGranted(Boolean(data.bonusGranted));
            setDeviceCount(data.devices?.length || 0);
            await checkAuth();
            setState('success');
            setTimeout(() => navigate('/my-devices', { replace: true }), 2200);
            return;
          }
        } catch (e: any) {
          if (i === 9) {
            setErrorMsg(e?.response?.data?.message || e.message || 'Sync failed');
            setState('error');
            return;
          }
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!cancelled) {
        setErrorMsg('Could not confirm payment in time. It may still complete via webhook.');
        setState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, checkAuth, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center">
        {state === 'pending' && (
          <>
            <Loader2 className="animate-spin text-airline-sky mx-auto" size={40} />
            <h1 className="mt-4 text-2xl font-black text-airline-dark">Confirming your payment…</h1>
            <p className="mt-2 text-gray-600">Hang tight while we activate your devices.</p>
          </>
        )}
        {state === 'success' && (
          <>
            <CheckCircle2 className="text-green-600 mx-auto" size={48} />
            <h1 className="mt-4 text-2xl font-black text-airline-dark">Order confirmed</h1>
            <p className="mt-2 text-gray-600">
              {deviceCount} device{deviceCount === 1 ? '' : 's'} added to your account.
            </p>
            {bonusGranted && (
              <p className="mt-3 text-sm bg-amber-50 text-amber-800 rounded-md p-2">
                🎉 1 month of premium subscription has been activated for free.
              </p>
            )}
            <p className="mt-4 text-sm text-gray-500">Redirecting to your devices…</p>
          </>
        )}
        {state === 'error' && (
          <>
            <AlertTriangle className="text-amber-600 mx-auto" size={48} />
            <h1 className="mt-4 text-2xl font-black text-airline-dark">Could not confirm payment</h1>
            <p className="mt-2 text-gray-600">{errorMsg}</p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/orders"
                className="bg-airline-blue text-white font-bold py-3 rounded-xl hover:bg-airline-dark"
              >
                See my orders
              </Link>
              <Link to="/devices" className="text-airline-blue font-semibold hover:underline">
                Back to shop
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
