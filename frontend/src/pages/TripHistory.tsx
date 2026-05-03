import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plane, Loader2, MapPin, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

export const TripHistory = () => {
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

    useEffect(() => { loadTrips(); }, []);

    const loadTrips = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/trips');
            setTrips(data.trips);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTripDetails = async (tripId: string) => {
        if (expandedTripId === tripId) { setExpandedTripId(null); return; }
        setExpandedTripId(tripId);
        try {
            const { data } = await api.get(`/trips/${tripId}`);
            setTrips(prev => prev.map(t => t.id === tripId ? data.data : t));
        } catch (err) {
            console.error('Failed to load trip details', err);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Trip History</h2>
                <p className="text-sm text-gray-500 mt-0.5">View and track all your past and upcoming travels.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-airline-sky" size={40} />
                </div>
            ) : trips.length === 0 ? (
                <div className="text-center bg-white py-16 rounded-2xl shadow-sm border border-gray-100">
                    <Plane className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-gray-700">No Trip History</h3>
                    <p className="text-gray-500 mt-2">You haven't registered any trips yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {trips.map(trip => {
                        const isExpanded = expandedTripId === trip.id;
                        return (
                            <div
                                key={trip.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                            >
                                {/* Boarding pass header */}
                                <div className="bg-gradient-to-r from-airline-dark to-airline-blue px-5 py-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Plane size={16} className="text-white/70 flex-shrink-0" />
                                        <span className="text-white font-bold text-sm truncate">{trip.airlineName}</span>
                                        <span className="text-white/60 font-mono text-xs">{trip.flightNumber}</span>
                                    </div>
                                    <span className="flex-shrink-0 bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                        {trip.bags?.length || 0} bag{(trip.bags?.length || 0) !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Route */}
                                <div className="px-5 py-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-2xl md:text-3xl font-black text-airline-dark">
                                                {trip.departureAirport.substring(0, 3).toUpperCase()}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{trip.departureAirport}</p>
                                            <p className="text-xs font-semibold text-gray-600 mt-0.5">
                                                {format(new Date(trip.departureDateTime), 'MMM d, HH:mm')}
                                            </p>
                                        </div>

                                        {/* Dashed flight line */}
                                        <div className="flex-1 flex items-center gap-1 min-w-0">
                                            <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                                            <Plane size={18} className="text-airline-sky flex-shrink-0 rotate-90 md:rotate-0" />
                                            <div className="flex-1 border-t-2 border-dashed border-gray-200" />
                                        </div>

                                        <div className="text-right min-w-0">
                                            <p className="text-2xl md:text-3xl font-black text-airline-dark">
                                                {trip.destinationAirport.substring(0, 3).toUpperCase()}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">{trip.destinationAirport}</p>
                                            <p className="text-xs font-semibold text-gray-600 mt-0.5">
                                                {trip.arrivalDateTime
                                                    ? format(new Date(trip.arrivalDateTime), 'MMM d, HH:mm')
                                                    : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tear-line */}
                                    <div className="relative border-t-2 border-dashed border-gray-200 mt-4 mb-3">
                                        <span className="absolute -left-5 -top-2.5 w-5 h-5 bg-airline-light rounded-full" />
                                        <span className="absolute -right-5 -top-2.5 w-5 h-5 bg-airline-light rounded-full" />
                                    </div>

                                    {/* Expand button */}
                                    <button
                                        onClick={() => toggleTripDetails(trip.id)}
                                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-airline-blue hover:text-airline-dark transition-colors py-1"
                                    >
                                        {isExpanded ? (
                                            <><ChevronUp size={16} /> Hide Tracking Details</>
                                        ) : (
                                            <><ChevronDown size={16} /> View Tracking Details</>
                                        )}
                                    </button>
                                </div>

                                {/* Expanded tracking */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-5 space-y-4">
                                        {!trip.bags || trip.bags.length === 0 ? (
                                            <p className="text-sm text-gray-500 text-center py-4">No bags registered for this trip.</p>
                                        ) : (
                                            trip.bags.map((bag: any) => (
                                                <div key={bag.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Tag</p>
                                                            <p className="font-mono font-black text-airline-dark text-base">{bag.tagNumber}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Weight</p>
                                                            <p className="font-bold text-sm text-gray-800">{bag.weightLbs} lbs</p>
                                                        </div>
                                                    </div>

                                                    <div className="p-4">
                                                        {(!bag.trackingLogs || bag.trackingLogs.length === 0) ? (
                                                            <p className="text-sm text-gray-500 italic text-center py-2">
                                                                No tracking events yet.
                                                            </p>
                                                        ) : (
                                                            <div className="relative border-l-2 border-gray-200 ml-3 space-y-5">
                                                                {bag.trackingLogs.map((event: any, idx: number) => (
                                                                    <div key={event.id} className="relative pl-6">
                                                                        <div className={`absolute -left-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${
                                                                            idx === 0
                                                                                ? 'bg-airline-blue ring-2 ring-blue-100'
                                                                                : 'bg-gray-200'
                                                                        }`}>
                                                                            {idx === 0
                                                                                ? <CheckCircle size={11} className="text-white" />
                                                                                : <Clock size={10} className="text-gray-500" />}
                                                                        </div>
                                                                        <div className="flex items-start justify-between gap-2 mb-0.5">
                                                                            <p className={`font-bold text-sm ${idx === 0 ? 'text-airline-dark' : 'text-gray-600'}`}>
                                                                                {event.status}
                                                                            </p>
                                                                            <span className="text-xs text-gray-400 flex-shrink-0">
                                                                                {format(new Date(event.timestamp), 'h:mm a')}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center text-xs text-gray-500 gap-1">
                                                                            <MapPin size={12} className="text-airline-sky flex-shrink-0" />
                                                                            {event.airportLocation}
                                                                        </div>
                                                                        {event.remarks && (
                                                                            <p className="text-xs text-gray-400 mt-1 italic bg-gray-50 px-2 py-1 rounded-lg">
                                                                                "{event.remarks}"
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
