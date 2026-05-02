import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import { Plane, Plus, Loader2, Briefcase, Trash2, Cpu } from 'lucide-react';
import { format } from 'date-fns';
import { usAirportOptions } from '../data/usData';
import { AutocompleteInput } from '../components/common/AutocompleteInput';
import { SubscriptionGate } from '../components/SubscriptionGate';

type AvailableDevice = { id: string; deviceId: string; expiresAt: string };

export const Trips = () => {
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trips.map(trip => (
                        <div key={trip.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-airline-light rounded-bl-full -z-10 opacity-50"></div>

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-airline-sky">{trip.airlineName}</span>
                                    <h3 className="text-2xl font-black text-airline-dark">{trip.flightNumber}</h3>
                                </div>
                                <div className="bg-blue-50 text-airline-blue px-3 py-1 rounded-full text-xs font-bold">
                                    {trip.bags?.length || 0} Bags
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-6 text-gray-700">
                                <div className="text-center">
                                    <p className="text-xl font-bold">{trip.departureAirport}</p>
                                    <p className="text-xs text-gray-500">{format(new Date(trip.departureDateTime), 'MMM d, HH:mm')}</p>
                                </div>
                                <Plane className="text-gray-300 mx-4" size={24} />
                                <div className="text-center">
                                    <p className="text-xl font-bold">{trip.destinationAirport}</p>
                                    <p className="text-xs text-gray-500">
                                      {trip.arrivalDateTime ? format(new Date(trip.arrivalDateTime), 'MMM d, HH:mm') : '-'}
                                    </p>
                                </div>
                            </div>

                            {trip.bags && trip.bags.some((b: any) => b.device) && (
                                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1">
                                    {trip.bags.filter((b: any) => b.device).map((b: any) => (
                                        <div key={b.id} className="flex items-center gap-2 text-xs text-airline-blue font-bold">
                                            <Cpu size={12}/>
                                            <span className="font-mono">{b.tagNumber}</span>
                                            <span className="text-gray-500">tracking device</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <button className="w-full py-2 bg-airline-light text-airline-dark font-medium rounded-lg hover:bg-gray-200 transition-colors">
                                    Manage Trip & Bags
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Trip Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Register New Trip</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <div className="p-6 max-h-[80vh] overflow-y-auto">
                            <form onSubmit={handleCreateTrip} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
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
