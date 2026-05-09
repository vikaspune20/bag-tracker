import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { Loader2, CheckCircle2, Plane, Navigation, PackageCheck, MapPin, Briefcase, Cpu, ArrowLeft } from 'lucide-react';
import { LiveGpsMap } from '../components/LiveGpsMap';
import { format } from 'date-fns';
import { SubscriptionGate } from '../components/SubscriptionGate';

const stageIcons: Record<string, JSX.Element> = {
    'Checked-in':       <CheckCircle2 size={22} className="text-blue-500" />,
    'In Transit':       <Navigation size={22} className="text-airline-sky" />,
    'Loaded on Aircraft': <Plane size={22} className="text-green-500" />,
    'Arrived':          <PackageCheck size={22} className="text-green-600" />,
};

const stageColors: Record<string, string> = {
    'Checked-in':         'bg-blue-50 text-blue-600',
    'In Transit':         'bg-sky-50 text-sky-600',
    'Loaded on Aircraft': 'bg-green-50 text-green-600',
    'Arrived':            'bg-emerald-50 text-emerald-600',
};

export const Tracking = () => (
    <SubscriptionGate feature="Tracking">
        <TrackingInner />
    </SubscriptionGate>
);

const TrackingInner = () => {
    const [searchParams] = useSearchParams();
    const bagId = searchParams.get('bagId');
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const [bagInfo, setBagInfo] = useState<any>(null);
    const [bags, setBags] = useState<any[]>([]);
    const [bagsLoading, setBagsLoading] = useState(false);

    useEffect(() => { if (bagId) loadTracking(); }, [bagId]);
    useEffect(() => { if (!bagId) loadActiveBags(); }, [bagId]);

    const loadTracking = async () => {
        try {
            setLoading(true);
            const [bagRes, timelineRes] = await Promise.all([
                api.get(`/bags/${bagId}`),
                api.get(`/tracking/${bagId}`),
            ]);
            setBagInfo(bagRes.data.bag);
            setEvents(timelineRes.data.events);
        } catch (error) {
            console.error('Error fetching tracking info', error);
        } finally {
            setLoading(false);
        }
    };

    const loadActiveBags = async () => {
        try {
            setBagsLoading(true);
            const { data } = await api.get('/bags');
            setBags(data.bags || []);
        } catch {
            setBags([]);
        } finally {
            setBagsLoading(false);
        }
    };

    const activeBags = useMemo(() =>
        (bags || []).filter(b => {
            const status = b?.trackingLogs?.[0]?.status || '';
            return status.toLowerCase() !== 'arrived';
        }), [bags]);

    // ── Active bags list ────────────────────────────────────────────────────────
    if (!bagId) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Live Tracking</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Bags currently in transit or checked-in.</p>
                    </div>
                    <Link to="/bags" className="text-sm font-semibold text-airline-blue hover:underline">
                        Manage Bags
                    </Link>
                </div>

                {bagsLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-airline-sky" size={40} />
                    </div>
                ) : activeBags.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                            <Briefcase size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700">No Active Bags</h3>
                        <p className="text-gray-500 text-sm mt-1">No bags are currently in transit.</p>
                        <Link to="/bags" className="mt-4 text-sm font-bold text-airline-blue hover:underline">
                            Go to Bags →
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {activeBags.map(bag => {
                            const latest = bag?.trackingLogs?.[0];
                            const stage  = latest?.status || latest?.stage || '';
                            return (
                                <Link
                                    key={bag.id}
                                    to={`/tracking?bagId=${bag.id}`}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    {/* Accent bar */}
                                    <div className="h-1.5 w-full bg-gradient-to-r from-airline-sky to-airline-blue" />
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Tag</p>
                                                <p className="mt-0.5 font-mono text-xl font-black text-airline-dark truncate">
                                                    {bag.tagNumber}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500 truncate">
                                                    {bag.trip?.flightNumber ? `Flight ${bag.trip.flightNumber}` : '—'}
                                                    {bag.trip?.departureAirport && bag.trip?.destinationAirport
                                                        ? ` · ${bag.trip.departureAirport} → ${bag.trip.destinationAirport}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stageColors[stage] || 'bg-gray-100 text-gray-500'}`}>
                                                    {stageIcons[stage] || <MapPin size={20} />}
                                                </div>
                                                {bag.device && (
                                                    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-airline-blue text-white font-bold flex items-center gap-1">
                                                        <Cpu size={9} /> GPS
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                                            <div>
                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</p>
                                                <p className="text-sm font-bold text-gray-900 mt-0.5">{stage || 'No data'}</p>
                                            </div>
                                            <span className="text-xs font-bold text-airline-blue">View →</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ── Loading ─────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-airline-sky" size={40} />
            </div>
        );
    }

    if (!bagInfo) return null;

    const currentStatus = events.length > 0 ? events[events.length - 1].status : 'No data';

    // ── Bag detail + timeline ───────────────────────────────────────────────────
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center justify-between">
                <Link
                    to="/tracking"
                    className="flex items-center gap-1.5 text-sm font-bold text-airline-blue hover:text-airline-dark transition-colors"
                >
                    <ArrowLeft size={16} /> Active Bags
                </Link>
                <Link to="/bags" className="text-xs font-semibold text-gray-400 hover:text-gray-600">
                    Manage Bags
                </Link>
            </div>

            {/* Bag info card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-airline-sky to-airline-blue" />
                <div className="p-5 flex items-center gap-4">
                    {bagInfo.imagePath ? (
                        <img
                            src={`http://localhost:5000${bagInfo.imagePath}`}
                            alt="Bag"
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl shadow-sm flex-shrink-0"
                        />
                    ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Briefcase size={28} className="text-gray-400" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Tracking ID</p>
                        <h2 className="text-2xl font-black text-airline-dark font-mono truncate">{bagInfo.tagNumber}</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {bagInfo.weightLbs} lbs
                            {bagInfo.trip?.flightNumber ? ` · ${bagInfo.trip.flightNumber}` : ''}
                        </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Status</p>
                        <p className="text-sm font-bold text-green-600 mt-0.5">{currentStatus}</p>
                    </div>
                </div>
            </div>

            {/* Live GPS Map — shown when GPS pings exist */}
            {events.some((e: any) => e.latitude != null) && (
              <LiveGpsMap
                bagId={bagId!}
                deviceId={bagInfo?.tagNumber}
              />
            )}

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Baggage Journey</h3>

                <div className="relative border-l-2 border-gray-100 ml-4 space-y-8">
                    {events.length === 0 ? (
                        <p className="pl-6 text-sm text-gray-500 italic">No tracking events recorded yet.</p>
                    ) : (
                        events.map((evt, idx) => {
                            const isLatest = idx === events.length - 1;
                            return (
                                <div key={evt.id} className="relative pl-7">
                                    {/* Dot */}
                                    <div className={`absolute -left-[17px] w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                                        isLatest ? 'bg-airline-blue ring-4 ring-blue-50' : 'bg-gray-100'
                                    }`}>
                                        {stageIcons[evt.stage]
                                            ? <span className={isLatest ? '[&>svg]:text-white' : '[&>svg]:text-gray-400'}>{stageIcons[evt.stage]}</span>
                                            : <CheckCircle2 size={16} className={isLatest ? 'text-white' : 'text-gray-400'} />}
                                    </div>

                                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h4 className="font-bold text-gray-900">{evt.status}</h4>
                                            <span className="text-xs font-medium text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-100 flex-shrink-0">
                                                {format(new Date(evt.timestamp), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                            <MapPin size={14} className="text-airline-sky flex-shrink-0" />
                                            <span className="font-semibold">{evt.airportLocation}</span>
                                        </div>
                                        {evt.remarks && (
                                            <p className="text-sm text-gray-500 mt-2 italic bg-white px-3 py-2 rounded-lg border border-gray-100">
                                                "{evt.remarks}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
