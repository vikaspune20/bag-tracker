import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Loader2, ShoppingBag, RefreshCw } from 'lucide-react';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';

type Props = {
  feature: string;
  children: ReactNode;
};

export function SubscriptionGate({ feature, children }: Props) {
  const { status, loading } = useSubscriptionStatus();

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-airline-sky" size={40} />
      </div>
    );
  }

  // No device yet — new user onboarding prompt
  if (!status?.hasDevice) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-8 max-w-2xl mx-auto text-center">
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="text-airline-blue" size={28} />
        </div>
        <h2 className="text-2xl font-black text-airline-dark">Activate your JC Smartbag experience</h2>
        <p className="mt-3 text-gray-600 leading-relaxed">
          Purchase a JC Smartbag tracking device to unlock <strong>{feature}</strong> and start
          managing your trips and bags. Every device includes{' '}
          <strong>1 month of free premium access</strong> — no credit card required for the trial.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/devices"
            className="bg-airline-blue text-white font-bold py-3 px-6 rounded-xl hover:bg-airline-dark transition-colors"
          >
            Browse Devices
          </Link>
          <Link
            to="/my-devices"
            className="bg-airline-light text-airline-dark font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors"
          >
            My Devices
          </Link>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          Already have a device? Check <Link to="/my-devices" className="underline hover:text-airline-blue">My Devices</Link>.
        </p>
      </div>
    );
  }

  // Has device(s) but subscription expired
  if (!status.active) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-8 max-w-2xl mx-auto text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="text-amber-600" size={28} />
        </div>
        <h2 className="text-2xl font-black text-airline-dark">Your device subscription has expired</h2>
        <p className="mt-3 text-gray-600 leading-relaxed">
          Access to <strong>{feature}</strong> is paused. Renew your device subscription to continue
          adding trips, tracking bags, and viewing live status updates.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/subscription"
            className="bg-airline-blue text-white font-bold py-3 px-6 rounded-xl hover:bg-airline-dark transition-colors"
          >
            <span className="flex items-center gap-2">
              <RefreshCw size={16} />
              Renew Subscription
            </span>
          </Link>
          <Link
            to="/devices"
            className="bg-airline-light text-airline-dark font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Buy Another Device
          </Link>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          Tip: every new tracking device includes <strong>1 month of free premium</strong>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
