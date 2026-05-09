import { useState } from 'react';
import { Search, Loader2, Plus, MapPin, Clock } from 'lucide-react';
import api from '../../utils/api';

const STATUSES = [
  'Checked In',
  'At Gate',
  'Loaded',
  'In Transit',
  'Arrived',
  'Ready for Pickup',
  'Delivered',
  'Delayed',
  'Lost',
  'Held at Customs',
];

interface TrackingLog {
  id: string;
  status: string;
  location: string | null;
  notes: string | null;
  source: string;
  createdAt: string;
}

interface BagResult {
  id: string;
  tagNumber: string;
  description: string | null;
  trip: { origin: string; destination: string; flightNumber: string | null };
  logs: TrackingLog[];
}

export function AdminTracking() {
  const [tagQuery, setTagQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [bag, setBag] = useState<BagResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [status, setStatus] = useState(STATUSES[0]);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const handleSearch = async () => {
    if (!tagQuery.trim()) return;
    setSearching(true);
    setSearchError(null);
    setBag(null);
    try {
      const r = await api.get('/admin/tracking/bag', { params: { tag: tagQuery.trim() } });
      setBag(r.data);
    } catch (e: any) {
      setSearchError(e.response?.data?.message || 'Bag not found');
    } finally {
      setSearching(false);
    }
  };

  const handleAddTracking = async () => {
    if (!bag) return;
    setAdding(true);
    setAddSuccess(false);
    try {
      await api.post('/admin/tracking', {
        bagId: bag.id,
        status,
        location: location || null,
        notes: notes || null,
      });
      setAddSuccess(true);
      setLocation('');
      setNotes('');
      // Reload bag
      const r = await api.get('/admin/tracking/bag', { params: { tag: tagQuery.trim() } });
      setBag(r.data);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to add tracking');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Tracking Manager</h1>
        <p className="text-slate-400 text-sm mt-0.5">Search a bag by tag and push tracking updates</p>
      </div>

      {/* Search */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-3">
        <label className="text-xs font-medium text-slate-400">Bag Tag Number</label>
        <div className="flex gap-2">
          <input
            value={tagQuery}
            onChange={e => setTagQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. JC-TAG-AB12CD34"
            className="flex-1 bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:border-blue-500 font-mono placeholder:font-sans placeholder:text-slate-500"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Search
          </button>
        </div>
        {searchError && <p className="text-red-400 text-xs">{searchError}</p>}
      </div>

      {/* Bag detail */}
      {bag && (
        <>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-white font-semibold">{bag.tagNumber}</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {bag.trip.origin} → {bag.trip.destination}
                  {bag.trip.flightNumber && ` · ${bag.trip.flightNumber}`}
                </p>
              </div>
              {bag.description && (
                <p className="text-slate-500 text-xs">{bag.description}</p>
              )}
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              {bag.logs.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No tracking events yet</p>
              )}
              {bag.logs.map((log, i) => (
                <div key={log.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${i === 0 ? 'bg-blue-500' : 'bg-slate-600'}`} />
                    {i < bag.logs.length - 1 && <div className="w-px flex-1 bg-slate-700/50 mt-1" />}
                  </div>
                  <div className="pb-3 flex-1">
                    <p className="text-white text-sm font-medium">{log.status}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                      {log.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} /> {log.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {new Date(log.createdAt).toLocaleString()}
                      </span>
                      {log.source !== 'MANUAL' && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                          {log.source}
                        </span>
                      )}
                    </div>
                    {log.notes && <p className="text-slate-400 text-xs mt-1">{log.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add tracking form */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-4">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Plus size={15} className="text-blue-400" />
              Add Tracking Event
            </h3>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Location <span className="text-slate-600">(optional)</span></label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Airport, terminal, city…"
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Notes <span className="text-slate-600">(optional)</span></label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Additional details…"
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {addSuccess && (
              <p className="text-green-400 text-xs">✓ Tracking event added and notification sent</p>
            )}

            <button
              onClick={handleAddTracking}
              disabled={adding}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              {adding ? 'Adding…' : 'Add Tracking Event'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
