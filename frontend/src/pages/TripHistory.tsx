import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plane, Loader2, MapPin, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const TripHistory = () => {
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

    useEffect(() => {
        loadTrips();
    }, []);

    const loadTrips = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/trips');
            
            // Fetch detailed bag info for all trips (or could do it on expand)
            // For simplicity, we can fetch all trips, then when expanded, fetch the specific trip by ID to get events if not included
            setTrips(data.trips);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTripDetails = async (tripId: string) => {
        if (expandedTripId === tripId) {
            setExpandedTripId(null);
            return;
        }
        setExpandedTripId(tripId);
        
        // Fetch detailed tracking events for this trip's bags
        try {
             const { data } = await api.get(`/trips/${tripId}`);
             setTrips(prev => prev.map(t => t.id === tripId ? data.trip : t));
        } catch (err) {
             console.error('Failed to load trip details', err);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900">Trip History</h2>
            <p className="text-gray-500">View and track all your past and upcoming travels.</p>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-airline-sky" size={40}/></div>
            ) : trips.length === 0 ? (
                <div className="text-center bg-white py-16 rounded-2xl shadow-sm border border-gray-100">
                    <Plane className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-gray-700">No Trip History</h3>
                    <p className="text-gray-500 mt-2">You haven't registered any trips yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {trips.map(trip => (
                        <div key={trip.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all">
                            {/* Trip Header Card */}
                            <div className="p-6 relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-airline-light rounded-bl-full -z-10 opacity-50"></div>
                                
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                    <div className="flex-1 w-full">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-airline-sky">{trip.airlineName}</span>
                                            <div className="bg-blue-50 text-airline-blue px-3 py-1 rounded-full text-xs font-bold">
                                                {trip.bags?.length || 0} Bags Registered
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between text-gray-700 mt-4">
                                            <div className="text-left">
                                                <p className="text-2xl font-black text-airline-dark">{trip.departureAirport.substring(0, 3).toUpperCase()}</p>
                                                <p className="text-sm font-semibold">{trip.departureAirport}</p>
                                                <p className="text-xs text-gray-500">{format(new Date(trip.departureDateTime), 'MMM d, yyyy HH:mm')}</p>
                                            </div>
                                            <Plane className="text-gray-300 mx-4 flex-shrink-0 transform rotate-45" size={28} />
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-airline-dark">{trip.destinationAirport.substring(0, 3).toUpperCase()}</p>
                                                <p className="text-sm font-semibold">{trip.destinationAirport}</p>
                                                <p className="text-xs text-gray-500">
                                                  {trip.arrivalDateTime ? format(new Date(trip.arrivalDateTime), 'MMM d, yyyy HH:mm') : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                                    <button 
                                        onClick={() => toggleTripDetails(trip.id)}
                                        className="text-airline-blue font-semibold hover:text-airline-dark transition-colors px-4 py-2 bg-blue-50 rounded-lg"
                                    >
                                        {expandedTripId === trip.id ? 'Hide Details' : 'View Details & Tracking'}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Tracking Details */}
                            {expandedTripId === trip.id && (
                                <div className="bg-gray-50 p-6 border-t border-gray-200">
                                    <h4 className="text-lg font-bold text-gray-800 mb-6">Baggage Tracking Details</h4>
                                    
                                    {!trip.bags || trip.bags.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">No bags registered for this trip.</p>
                                    ) : (
                                        <div className="space-y-8">
                                            {trip.bags.map((bag: any) => (
                                                <div key={bag.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                                                        <div>
                                                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tag Number</span>
                                                            <p className="text-lg font-black text-airline-dark">{bag.tagNumber}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Weight</span>
                                                            <p className="text-sm font-bold text-gray-800">{bag.weightLbs} lbs</p>
                                                        </div>
                                                    </div>

                                                    {/* Timeline */}
                                                    <div className="pl-4 border-l-2 border-airline-light space-y-6 mt-4">
                                                        {(!bag.trackingLogs || bag.trackingLogs.length === 0) ? (
                                                            <p className="text-sm text-gray-500 italic">No tracking events recorded yet.</p>
                                                        ) : (
                                                            bag.trackingLogs.map((event: any, idx: number) => (
                                                                <div key={event.id} className="relative">
                                                                    <div className={`absolute -left-[25px] w-5 h-5 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-airline-blue text-white ring-4 ring-blue-50' : 'bg-gray-200 text-gray-500'}`}>
                                                                        {idx === 0 ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex justify-between items-baseline mb-1">
                                                                            <h5 className={`font-bold ${idx === 0 ? 'text-airline-dark' : 'text-gray-600'}`}>
                                                                                {event.status}
                                                                            </h5>
                                                                            <span className="text-xs font-semibold text-gray-500">{format(new Date(event.timestamp), 'h:mm a')}</span>
                                                                        </div>
                                                                        <div className="flex items-center text-sm text-gray-600">
                                                                            <MapPin size={14} className="mr-1 text-airline-sky" />
                                                                            {event.airportLocation}
                                                                        </div>
                                                                        {event.remarks && (
                                                                            <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded-md italic">"{event.remarks}"</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
