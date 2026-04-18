import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { Loader2, CheckCircle2, Plane, Navigation, PackageCheck, MapPin, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

const stageIcons: Record<string, any> = {
    'Checked-in': <CheckCircle2 size={24} className="text-blue-500"/>,
    'In Transit': <Navigation size={24} className="text-airline-sky"/>,
    'Loaded on Aircraft': <Plane size={24} className="text-green-500"/>,
    'Arrived': <PackageCheck size={24} className="text-green-600"/>,
};

export const Tracking = () => {
    const [searchParams] = useSearchParams();
    const bagId = searchParams.get('bagId');
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const [bagInfo, setBagInfo] = useState<any>(null);
    const [bags, setBags] = useState<any[]>([]);
    const [bagsLoading, setBagsLoading] = useState(false);

    useEffect(() => {
        if (bagId) loadTracking();
    }, [bagId]);

    useEffect(() => {
        if (!bagId) loadActiveBags();
    }, [bagId]);

    const loadTracking = async () => {
        try {
            setLoading(true);
            const [bagRes, timelineRes] = await Promise.all([
                api.get(`/bags/${bagId}`),
                api.get(`/tracking/${bagId}`)
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
        } catch (error) {
            console.error('Error fetching bags', error);
            setBags([]);
        } finally {
            setBagsLoading(false);
        }
    };

    const activeBags = useMemo(() => {
        return (bags || []).filter((b) => {
            const latest = b?.trackingLogs?.[0];
            const status = latest?.status || '';
            return status.toLowerCase() !== 'arrived';
        });
    }, [bags]);

    if (!bagId) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Active Baggage</h2>
                        <p className="text-sm text-gray-500 mt-1">Bags that are currently in transit or recently checked-in.</p>
                    </div>
                    <Link to="/bags" className="text-airline-blue font-bold hover:underline">Manage Bags</Link>
                </div>

                {bagsLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-airline-sky" size={40}/></div>
                ) : activeBags.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <Briefcase size={48} className="text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-700">No Active Bags</h3>
                        <p className="text-gray-500 text-center">Looks like you don't have any bags currently active.</p>
                        <Link to="/bags" className="mt-4 text-airline-blue font-bold hover:underline">Go to Bags</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeBags.map((bag) => {
                            const latest = bag?.trackingLogs?.[0];
                            const status = latest?.status || 'NO DATA';
                            const stage = latest?.status || latest?.stage;
                            return (
                                <Link
                                    key={bag.id}
                                    to={`/tracking?bagId=${bag.id}`}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    <div className="p-5 flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold uppercase tracking-wider text-airline-sky">Tag</p>
                                            <p className="mt-1 font-mono text-xl font-black text-airline-dark truncate">{bag.tagNumber}</p>
                                            <p className="mt-1 text-sm text-gray-500 truncate">
                                                {bag.trip?.flightNumber ? `Flight ${bag.trip.flightNumber}` : '—'}
                                                {bag.trip?.departureAirport && bag.trip?.destinationAirport ? ` • ${bag.trip.departureAirport} → ${bag.trip.destinationAirport}` : ''}
                                            </p>
                                        </div>
                                        <div className="shrink-0">
                                            {stageIcons[stage] || <MapPin size={24} className="text-gray-400" />}
                                        </div>
                                    </div>
                                    <div className="px-5 pb-5">
                                        <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500">Current Status</p>
                                                <p className="text-sm font-bold text-gray-900">{status}</p>
                                            </div>
                                            <span className="text-xs font-semibold text-airline-blue">View</span>
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

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-airline-sky" size={40}/></div>;
    }

    if (!bagInfo) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <Link to="/tracking" className="text-airline-blue font-bold hover:underline">&larr; Back to Active Baggage</Link>
                <Link to="/bags" className="text-gray-500 hover:text-gray-700 text-sm font-semibold">Manage Bags</Link>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-6">
                    {bagInfo.imagePath ? (
                        <img src={`http://localhost:5000${bagInfo.imagePath}`} alt="Bag" className="w-24 h-24 object-cover rounded-xl shadow-sm" />
                    ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center">No Image</div>
                    )}
                    <div>
                        <p className="text-sm font-bold text-airline-sky uppercase tracking-wider">Tracking ID</p>
                        <h2 className="text-3xl font-black text-airline-dark font-mono">{bagInfo.tagNumber}</h2>
                        <p className="text-gray-500 mt-1">{bagInfo.weightLbs} lbs &bull; {bagInfo.trip?.flightNumber}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold text-gray-500">Current Status</p>
                    <p className="text-xl font-bold text-green-600">
                        {events.length > 0 ? events[events.length - 1].status : 'NO DATA'}
                    </p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-8 tracking-tight">Baggage Journey Timeline</h3>
                
                <div className="relative border-l border-gray-200 ml-6 space-y-8">
                    {events.map((evt) => (
                        <div key={evt.id} className="relative pl-8">
                            <div className="absolute -left-[18px] bg-white p-1 rounded-full outline outline-4 outline-white">
                                {stageIcons[evt.stage] || <CheckCircle2 size={24} className="text-gray-400"/>}
                            </div>
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-gray-900">{evt.status}</h4>
                                    <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                                        {format(new Date(evt.timestamp), 'MMM d, h:mm a')}
                                    </span>
                                </div>
                                <div className="flex items-center text-gray-600 text-sm mb-1">
                                    <MapPin size={16} className="mr-2"/>
                                    <span className="font-semibold">{evt.airportLocation}</span>
                                </div>
                                {evt.remarks && <p className="text-gray-500 text-sm mt-2 italic">"{evt.remarks}"</p>}
                            </div>
                        </div>
                    ))}

                    {events.length === 0 && (
                        <p className="text-gray-500 pl-8">No tracking events recorded yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
