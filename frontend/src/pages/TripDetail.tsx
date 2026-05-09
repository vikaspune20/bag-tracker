import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plane, Loader2, Briefcase, MapPin, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';

interface TrackingLog {
  id: string;
  status: string;
  airportLocation: string | null;
  remarks: string | null;
  timestamp: string;
}

interface Bag {
  id: string;
  tagNumber: string;
  weight: string | null;
  description: string | null;
  imageUrl: string | null;
  trackingLogs: TrackingLog[];
}

interface TripData {
  id: string;
  flightNumber: string;
  airlineName: string;
  departureAirport: string;
  destinationAirport: string;
  departureDateTime: string;
  arrivalDateTime: string | null;
  bags: Bag[];
}

export function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/trips/${id}`)
      .then(r => setTrip(r.data.data))
      .catch(() => navigate('/trips', { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!trip) return;
    if (!confirm(`Delete trip ${trip.flightNumber}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/trips/${trip.id}`);
      navigate('/trips', { replace: true });
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to delete trip');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-airline-sky" size={40} />
      </div>
    );
  }

  if (!trip) return null;

  const latestStatus = (bag: Bag) => bag.trackingLogs[0]?.status ?? 'No updates';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link to="/trips" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm transition-colors">
        <ChevronLeft size={16} /> Back to Trips
      </Link>

      {/* Trip header card */}
      <div className="bg-gradient-to-r from-airline-dark to-airline-blue rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest">{trip.airlineName}</p>
            <h1 className="text-3xl font-black mt-1">{trip.flightNumber}</h1>
          </div>
          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
            {trip.bags.length} {trip.bags.length === 1 ? 'Bag' : 'Bags'}
          </span>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div>
            <p className="text-3xl font-black tracking-tight">{trip.departureAirport?.split(' ')[0]}</p>
            <p className="text-xs text-blue-200 mt-1">{trip.departureAirport}</p>
            <p className="text-sm text-blue-100 mt-0.5">
              {format(new Date(trip.departureDateTime), 'MMM d, HH:mm')}
            </p>
          </div>
          <div className="flex-1 mx-6 flex items-center gap-2">
            <div className="flex-1 h-px bg-white/30" />
            <Plane className="text-white/70" size={22} />
            <div className="flex-1 h-px bg-white/30" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-black tracking-tight">{trip.destinationAirport?.split(' ')[0]}</p>
            <p className="text-xs text-blue-200 mt-1">{trip.destinationAirport}</p>
            <p className="text-sm text-blue-100 mt-0.5">
              {trip.arrivalDateTime ? format(new Date(trip.arrivalDateTime), 'MMM d, HH:mm') : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Bags */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Briefcase size={18} className="text-airline-sky" /> Bags
        </h2>

        {trip.bags.length === 0 ? (
          <div className="text-center bg-white py-10 rounded-2xl border border-gray-100 shadow-sm text-gray-400">
            No bags registered for this trip.
          </div>
        ) : (
          <div className="space-y-4">
            {trip.bags.map(bag => (
              <div key={bag.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Bag header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    {bag.imageUrl ? (
                      <img src={bag.imageUrl} alt="bag" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-airline-light flex items-center justify-center">
                        <Briefcase size={20} className="text-airline-sky" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 font-mono">{bag.tagNumber}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {bag.weight ? `${bag.weight} kg` : ''}
                        {bag.weight && bag.description ? ' · ' : ''}
                        {bag.description || ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-airline-blue">
                      {latestStatus(bag)}
                    </span>
                    <Link
                      to={`/tracking?bagId=${bag.id}`}
                      className="text-xs text-airline-sky hover:text-airline-blue font-medium"
                    >
                      Track →
                    </Link>
                  </div>
                </div>

                {/* Tracking timeline (last 3 events) */}
                {bag.trackingLogs.length > 0 && (
                  <div className="px-5 py-3 space-y-2.5">
                    {bag.trackingLogs.slice(0, 3).map((log, i) => (
                      <div key={log.id} className="flex gap-3 text-sm">
                        <div className="flex flex-col items-center pt-1">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-airline-sky' : 'bg-gray-200'}`} />
                          {i < Math.min(bag.trackingLogs.length, 3) - 1 && (
                            <div className="w-px flex-1 bg-gray-100 mt-1" />
                          )}
                        </div>
                        <div className="pb-2 flex-1">
                          <p className={`font-medium ${i === 0 ? 'text-airline-blue' : 'text-gray-500'}`}>{log.status}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                            {log.airportLocation && (
                              <span className="flex items-center gap-1"><MapPin size={10} />{log.airportLocation}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock size={10} />{format(new Date(log.timestamp), 'MMM d, HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="border border-red-200 rounded-2xl p-5 bg-red-50">
        <p className="text-sm text-gray-600 mb-3">Deleting this trip removes all its bags and tracking history.</p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Trash2 size={15} />
          {deleting ? 'Deleting…' : 'Delete Trip'}
        </button>
      </div>
    </div>
  );
}
