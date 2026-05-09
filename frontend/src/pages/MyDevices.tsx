import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Cpu, BadgeCheck, Clock, Smartphone } from 'lucide-react';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {devices.map((d) => {
            const expired = d.status !== 'ACTIVE';
            return (
              <div
                key={d.id}
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col hover:shadow-md transition-shadow ${
                  expired ? 'border-gray-200 opacity-75' : 'border-gray-100'
                }`}
              >
                {/* Top accent bar */}
                <div className={`h-1.5 w-full ${expired ? 'bg-gray-300' : d.available ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`} />

                <div className="p-5 flex-1 flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Device ID</p>
                      <h4 className="font-mono text-base font-bold text-airline-dark mt-0.5 break-all">{d.deviceId}</h4>
                    </div>
                    {expired ? (
                      <span className="flex-shrink-0 px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-500 font-semibold">Expired</span>
                    ) : d.available ? (
                      <span className="flex-shrink-0 px-2.5 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center gap-1">
                        <BadgeCheck size={13} /> Available
                      </span>
                    ) : (
                      <span className="flex-shrink-0 px-2.5 py-1 text-xs rounded-full bg-blue-50 text-airline-blue font-bold">In use</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="text-xs text-gray-500 space-y-1.5 bg-gray-50 rounded-xl p-3">
                    <div className="flex justify-between">
                      <span>Purchased</span>
                      <span className="font-semibold text-gray-700">{format(new Date(d.purchasedAt), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hw. expires</span>
                      <span className="font-semibold text-gray-700">{format(new Date(d.expiresAt), 'MMM d, yyyy')}</span>
                    </div>
                    {d.attachedTo && (
                      <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
                        <span>Flight</span>
                        <span className="font-bold text-airline-blue">{d.attachedTo.tripFlight}</span>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  {d.attachedTo ? (
                    <div className="mt-auto flex flex-col gap-2">
                      <Link
                        to={`/tracking?bagId=${d.attachedTo.bagId}`}
                        className="text-center text-sm font-bold text-white bg-airline-blue py-2.5 rounded-xl hover:bg-airline-dark transition-colors"
                      >
                        View Tracking →
                      </Link>
                      {/* Mobile GPS tracker link */}
                      <a
                        href={`/mobile-tracker?deviceId=${encodeURIComponent(d.deviceId)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 text-center text-sm font-semibold text-emerald-700 bg-emerald-50 py-2.5 rounded-xl hover:bg-emerald-100 transition-colors"
                      >
                        <Smartphone size={14} /> Track via Phone
                      </a>
                    </div>
                  ) : !expired ? (
                    <Link
                      to="/trips"
                      className="mt-auto text-center text-sm font-semibold text-airline-blue bg-blue-50 py-2.5 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      Assign to a Trip
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
