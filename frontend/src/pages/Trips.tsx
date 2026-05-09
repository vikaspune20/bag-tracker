import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Plane, Plus, Loader2, Briefcase, Trash2, Cpu } from 'lucide-react';
import { format } from 'date-fns';
import { usAirportOptions } from '../data/usData';
import { AutocompleteInput } from '../components/common/AutocompleteInput';
import { SubscriptionGate } from '../components/SubscriptionGate';

type AvailableDevice = { id: string; deviceId: string; expiresAt: string };

export const Trips = () => {
    const navigate = useNavigate();
    const [trips, setTrips] = useState<any[]>([]);
    const [devices, setDevices] = useState<AvailableDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [bagsData, setBagsData] = useState<any[]>([{ tagNumber: '', weight: '', description: '', image: null, deviceId: '' }]);

    useEffect(() => {
        loadTrips();
        loadDevices();
    }, []);

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

    const loadDevices = async () => {
        try {
            const { data } = await api.get('/devices?available=true');
            setDevices(data.devices || []);
        } catch (error) {
            console.error(error);
        }
    };

    const usedDeviceIds = useMemo(
        () => new Set(bagsData.map((b) => b.deviceId).filter(Boolean)),
        [bagsData]
    );

    const handleAddBagForm = () => {
        setBagsData([...bagsData, { tagNumber: '', weight: '', description: '', image: null, deviceId: '' }]);
    };

    const handleRemoveBagForm = (index: number) => {
        if (bagsData.length > 1) {
            setBagsData(bagsData.filter((_, i) => i !== index));
        }
    };

    const handleBagChange = (index: number, field: string, value: any) => {
        const newBags = [...bagsData];
        newBags[index][field] = value;
        if (field === 'deviceId') {
            newBags[index].tagNumber = value || '';
        }
        if (field === 'tagNumber' && newBags[index].deviceId && value !== newBags[index].deviceId) {
            newBags[index].deviceId = '';
        }
        setBagsData(newBags);
    };

    const handleCreateTrip = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const payload = new FormData();

        ['flightNumber', 'airlineName', 'departureAirport', 'destinationAirport', 'departureDate', 'departureTime', 'arrivalDate', 'arrivalTime'].forEach(field => {
            payload.append(field, formData.get(field) as string);
        });

        const bagsJson = bagsData.map(b => ({ tagNumber: b.tagNumber, weight: b.weight, description: b.description }));
        payload.append('bags', JSON.stringify(bagsJson));

        bagsData.forEach((bag, idx) => {
            if (bag.image) {
                payload.append(`image_${idx}`, bag.image);
            }
        });

        try {
            await api.post('/trips', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowModal(false);
            setBagsData([{ tagNumber: '', weight: '', description: '', image: null, deviceId: '' }]);
            loadTrips();
            loadDevices();
        } catch (error: any) {
            console.error('Trip Creation Error:', error.response?.data);
            alert(`Error creating trip: ${error.response?.data?.message || error.message}`);
        }
    };

    return (
        <SubscriptionGate feature="Trips">
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">My Trips</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center space-x-2 bg-airline-blue text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-airline-dark transition-all"
                >
                    <Plus size={20} />
                    <span>Create Trip</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-airline-sky" size={40}/></div>
            ) : trips.length === 0 ? (
                <div className="text-center bg-white py-16 rounded-2xl shadow-sm border border-gray-100">
                    <Plane className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-gray-700">No Trips Found</h3>
                    <p className="text-gray-500 mt-2">You haven't added any flights yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {trips.map(trip => (
                        <div key={trip.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                            {/* Boarding-pass header strip */}
                            <div className="bg-gradient-to-r from-airline-dark to-airline-blue px-5 pt-4 pb-5 text-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-semibold text-blue-200 uppercase tracking-widest">{trip.airlineName}</p>
                                        <h3 className="text-2xl font-black mt-0.5">{trip.flightNumber}</h3>
                                    </div>
                                    <span className="bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-bold">
                                        {trip.bags?.length || 0} {trip.bags?.length === 1 ? 'Bag' : 'Bags'}
                                    </span>
                                </div>

                                {/* Route row */}
                                <div className="flex items-center justify-between mt-4">
                                    <div>
                                        <p className="text-2xl font-black tracking-tight">{trip.departureAirport?.split(' ')[0]}</p>
                                        <p className="text-xs text-blue-200 mt-0.5">{format(new Date(trip.departureDateTime), 'MMM d, HH:mm')}</p>
                                    </div>
                                    <div className="flex-1 mx-3 flex items-center gap-1">
                                        <div className="flex-1 h-px bg-white/30" />
                                        <Plane className="text-white/70 rotate-0" size={18} />
                                        <div className="flex-1 h-px bg-white/30" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black tracking-tight">{trip.destinationAirport?.split(' ')[0]}</p>
                                        <p className="text-xs text-blue-200 mt-0.5">
                                            {trip.arrivalDateTime ? format(new Date(trip.arrivalDateTime), 'MMM d, HH:mm') : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tear-line notch effect */}
                            <div className="flex items-center -mt-1">
                                <div className="w-4 h-4 rounded-full bg-airline-light -ml-2 flex-shrink-0" />
                                <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-1" />
                                <div className="w-4 h-4 rounded-full bg-airline-light -mr-2 flex-shrink-0" />
                            </div>

                            {/* Bag / device info */}
                            <div className="px-5 py-4 flex-1">
                                {trip.bags && trip.bags.some((b: any) => b.device) ? (
                                    <div className="space-y-1.5">
                                        {trip.bags.filter((b: any) => b.device).map((b: any) => (
                                            <div key={b.id} className="flex items-center gap-2 text-xs text-airline-blue font-semibold bg-blue-50 rounded-lg px-3 py-1.5">
                                                <Cpu size={12} />
                                                <span className="font-mono">{b.tagNumber}</span>
                                                <span className="text-blue-400">· tracking active</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No tracking device linked</p>
                                )}
                            </div>

                            <div className="px-5 pb-5">
                                <button
                                    onClick={() => navigate(`/trips/${trip.id}`)}
                                    className="w-full py-2.5 bg-airline-light text-airline-dark text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Manage Trip & Bags
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Trip Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Register New Trip</h3>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 text-xl leading-none">&times;</button>
                        </div>
                        <div className="p-5 max-h-[85vh] overflow-y-auto">
                            <form onSubmit={handleCreateTrip} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Flight Number</label>
                                        <input name="flightNumber" required placeholder="e.g. AA123" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-airline-sky focus:border-airline-sky sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Airline Name</label>
                                        <input name="airlineName" required placeholder="e.g. American Airlines" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-airline-sky focus:border-airline-sky sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Departure Airport</label>
                                        <AutocompleteInput
                                          name="departureAirport"
                                          required
                                          placeholder="JFK - New York"
                                          options={usAirportOptions}
                                          className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-airline-sky focus:border-airline-sky sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Destination Airport</label>
                                        <AutocompleteInput
                                          name="destinationAirport"
                                          required
                                          placeholder="LAX - Los Angeles"
                                          options={usAirportOptions}
                                          className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-airline-sky focus:border-airline-sky sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Departure Date</label>
                                        <input type="date" name="departureDate" required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-airline-sky focus:border-airline-sky sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Departure Time</label>
                                        <input type="time" name="departureTime" required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-airline-sky focus:border-airline-sky sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Arrival Date</label>
                                        <input type="date" name="arrivalDate" required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-airline-sky focus:border-airline-sky sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Arrival Time</label>
                                        <input type="time" name="arrivalTime" required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-airline-sky focus:border-airline-sky sm:text-sm" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                        <h4 className="font-bold text-gray-900 flex items-center"><Briefcase size={18} className="mr-2 text-airline-blue"/> Registered Bags</h4>
                                        <button type="button" onClick={handleAddBagForm} className="text-sm font-bold text-airline-sky hover:text-airline-blue flex items-center">
                                            <Plus size={16} className="mr-1"/> Add Bag
                                        </button>
                                    </div>

                                    {bagsData.map((bag, idx) => (
                                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-5 relative">
                                            {bagsData.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveBagForm(idx)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                            <h5 className="text-sm font-bold text-gray-500 mb-3">Bag #{idx + 1}</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-700">Tracking Device (optional)</label>
                                                    <select
                                                        value={bag.deviceId}
                                                        onChange={(e) => handleBagChange(idx, 'deviceId', e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:ring-airline-sky sm:text-sm"
                                                    >
                                                        <option value="">— No device, type a tag manually —</option>
                                                        {devices
                                                            .filter((d) => !usedDeviceIds.has(d.deviceId) || d.deviceId === bag.deviceId)
                                                            .map((d) => (
                                                                <option key={d.id} value={d.deviceId}>{d.deviceId}</option>
                                                            ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700">Tag Number</label>
                                                    <input
                                                        required
                                                        value={bag.tagNumber}
                                                        onChange={e => handleBagChange(idx, 'tagNumber', e.target.value)}
                                                        readOnly={Boolean(bag.deviceId)}
                                                        placeholder="AA-12345"
                                                        className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:ring-airline-sky sm:text-sm font-mono ${bag.deviceId ? 'bg-blue-50' : ''}`}
                                                    />
                                                    {bag.deviceId && (
                                                        <p className="mt-1 text-[11px] text-airline-blue flex items-center gap-1">
                                                            <Cpu size={11}/> Linked to device
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700">Weight (lbs)</label>
                                                    <input required type="number" step="0.1" value={bag.weight} onChange={e => handleBagChange(idx, 'weight', e.target.value)} placeholder="45.5" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:ring-airline-sky sm:text-sm" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-700">Image</label>
                                                    <input type="file" accept="image/*" onChange={e => handleBagChange(idx, 'image', e.target.files?.[0])} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-airline-blue hover:file:bg-blue-100" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-medium text-gray-700">Description (Optional)</label>
                                                    <input value={bag.description} onChange={e => handleBagChange(idx, 'description', e.target.value)} placeholder="Black Samsonite handle..." className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:ring-airline-sky sm:text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
                                    <button type="submit" disabled={loading} className="bg-airline-blue text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-airline-dark transition-colors flex items-center">
                                        {loading ? <Loader2 className="animate-spin mr-2" /> : 'Create Trip'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </SubscriptionGate>
    );
};
