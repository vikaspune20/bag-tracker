import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Cpu, BadgeCheck, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';

type Device = {
  id: string;
  deviceId: string;
  status: string;
  purchasedAt: string;
  expiresAt: string;
  available: boolean;
  attachedTo: {
    bagId: string;
    tripId: string;
    tagNumber: string;
    tripFlight: string;
    tripDeparture: string;
    tripArrival: string | null;
  } | null;
};

export const MyDevices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const { status } = useSubscriptionStatus();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<{ devices: Device[] }>('/devices');
      setDevices(data.devices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Tracking Devices</h2>
        <Link
          to="/devices"
          className="bg-airline-blue text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-airline-dark"
        >
          Buy another device
        </Link>
      </div>

      {status?.active && status.devices.some(d => d.subPlan === 'DEVICE_BONUS' && d.subStatus === 'ACTIVE') && status.expiryDate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-3">
          <Clock className="mt-0.5" size={18} />
          <div className="flex-1">
            Your free 1-month premium expires on{' '}
            <strong>{format(new Date(status.expiryDate), 'MMM d, yyyy')}</strong>{' '}
            ({formatDistanceToNow(new Date(status.expiryDate), { addSuffix: true })}). After that you'll need to subscribe to keep tracking.
          </div>
          <Link to="/subscription" className="font-bold text-airline-blue hover:underline whitespace-nowrap">
            Subscribe
          </Link>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-airline-sky" size={40} />
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center bg-white py-16 rounded-2xl shadow-sm border border-gray-100">
          <Cpu className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-700">No devices yet</h3>
          <p className="text-gray-500 mt-2">Buy a tracking device to get started.</p>
          <Link
            to="/devices"
            className="mt-4 inline-block bg-airline-blue text-white font-bold py-2 px-5 rounded-xl"
          >
            Visit shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((d) => {
            const expired = d.status !== 'ACTIVE';
            return (
              <div
                key={d.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500">Device</p>
                    <h4 className="font-mono text-lg font-bold text-airline-dark">{d.deviceId}</h4>
                  </div>
                  {expired ? (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">EXPIRED</span>
                  ) : d.available ? (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-bold flex items-center gap-1">
                      <BadgeCheck size={14} /> Available
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-airline-blue font-bold">In use</span>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    Purchased: <span className="font-medium">{format(new Date(d.purchasedAt), 'MMM d, yyyy')}</span>
                  </p>
                  <p>
                    Hardware expires:{' '}
                    <span className="font-medium">{format(new Date(d.expiresAt), 'MMM d, yyyy')}</span>
                  </p>
                  {d.attachedTo && (
                    <p>
                      Attached to flight <span className="font-bold">{d.attachedTo.tripFlight}</span> as bag{' '}
                      <span className="font-mono">{d.attachedTo.tagNumber}</span>
                    </p>
                  )}
                </div>
                {d.attachedTo && (
                  <Link
                    to={`/tracking?bagId=${d.attachedTo.bagId}`}
                    className="text-sm font-bold text-airline-sky hover:text-airline-blue"
                  >
                    View tracking →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
