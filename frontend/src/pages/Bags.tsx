import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Briefcase, Plus, Loader2, Trash2, Cpu, X, MapPin } from 'lucide-react';
import { SubscriptionGate } from '../components/SubscriptionGate';

type AvailableDevice = { id: string; deviceId: string; expiresAt: string };

export const Bags = () => {
    const [bags, setBags] = useState<any[]>([]);
    const [trips, setTrips] = useState<any[]>([]);
    const [devices, setDevices] = useState<AvailableDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [tagNumber, setTagNumber] = useState('');
    const [pickedDevice, setPickedDevice] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [bagsRes, tripsRes, devicesRes] = await Promise.all([
                api.get('/bags'),
                api.get('/trips'),
                api.get('/devices?available=true'),
            ]);
            setBags(bagsRes.data.bags);
            setTrips(tripsRes.data.trips);
            setDevices(devicesRes.data.devices || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = () => { setTagNumber(''); setPickedDevice(''); setShowModal(true); };

    const handleAddBag = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);
        const formData = new FormData(e.currentTarget);
        formData.set('tagNumber', tagNumber.trim());
        try {
            await api.post('/bags', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setShowModal(false);
            loadData();
        } catch (error: any) {
            alert(error?.response?.data?.message || 'Error adding bag');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this bag?')) return;
        try {
            await api.delete(`/bags/${id}`);
            loadData();
        } catch {
            alert('Failed to delete bag');
        }
    };

    return (
        <SubscriptionGate feature="Baggage Management">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Baggage Management</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Register and track your bags.</p>
                    </div>
                    <button
                        onClick={openModal}
                        className="flex items-center gap-2 bg-airline-blue text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-airline-dark transition-all"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Register Bag</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-airline-sky" size={40} />
                    </div>
                ) : bags.length === 0 ? (
                    <div className="text-center bg-white py-16 rounded-2xl shadow-sm border border-gray-100">
                        <Briefcase className="mx-auto text-gray-300 mb-4" size={48} />
                        <h3 className="text-xl font-semibold text-gray-700">No Bags Registered</h3>
                        <p className="text-gray-500 mt-2">Add a bag to start tracking it.</p>
                        <button
                            onClick={openModal}
                            className="mt-4 inline-flex items-center gap-2 bg-airline-blue text-white font-bold py-2 px-5 rounded-xl"
                        >
                            <Plus size={16} /> Register your first bag
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {bags.map(bag => (
                            <div key={bag.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                                {/* Image area */}
                                <div className="h-40 bg-gray-100 relative flex-shrink-0">
                                    {bag.imagePath ? (
                                        <img
                                            src={`http://localhost:5000${bag.imagePath}`}
                                            alt={bag.tagNumber}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                                            <Briefcase size={32} className="mb-1" />
                                            <span className="text-xs font-medium">No Image</span>
                                        </div>
                                    )}
                                    {/* Tag overlay */}
                                    <div className="absolute top-2.5 right-2.5 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-bold font-mono tracking-widest backdrop-blur-sm">
                                        {bag.tagNumber}
                                    </div>
                                    {/* Device badge */}
                                    {bag.device && (
                                        <div className="absolute bottom-2.5 left-2.5 bg-airline-blue text-white px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1">
                                            <Cpu size={11} /> Device
                                        </div>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h4 className="font-bold text-base text-gray-900">{bag.weightLbs} lbs</h4>
                                        <button
                                            onClick={() => handleDelete(bag.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 flex-1 line-clamp-2">
                                        {bag.description || 'No description provided.'}
                                    </p>
                                    <Link
                                        to={`/tracking?bagId=${bag.id}`}
                                        className="mt-4 flex items-center justify-center gap-1.5 text-sm font-bold text-white bg-airline-blue py-2 rounded-xl hover:bg-airline-dark transition-colors"
                                    >
                                        <MapPin size={14} /> View Tracking
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal — bottom sheet on mobile, centered on sm+ */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                            {/* Modal header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 flex-shrink-0">
                                <h3 className="text-lg font-bold text-gray-900">Register Bag</h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Scrollable form */}
                            <div className="overflow-y-auto flex-1 p-6">
                                <form onSubmit={handleAddBag} className="space-y-4" id="add-bag-form">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Link to Trip</label>
                                        <select
                                            name="tripId"
                                            required
                                            className="block w-full border border-gray-200 rounded-xl shadow-sm py-2.5 px-3 bg-white text-sm focus:ring-2 focus:ring-airline-sky focus:border-airline-sky outline-none"
                                        >
                                            <option value="">Select a flight…</option>
                                            {trips.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.flightNumber} ({t.departureAirport} → {t.destinationAirport})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Tracking Device <span className="font-normal text-gray-400">(optional)</span>
                                        </label>
                                        <select
                                            value={pickedDevice}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setPickedDevice(v);
                                                if (v) setTagNumber(v);
                                            }}
                                            className="block w-full border border-gray-200 rounded-xl shadow-sm py-2.5 px-3 bg-white text-sm focus:ring-2 focus:ring-airline-sky outline-none"
                                        >
                                            <option value="">— No device, type tag manually —</option>
                                            {devices.map(d => (
                                                <option key={d.id} value={d.deviceId}>{d.deviceId}</option>
                                            ))}
                                        </select>
                                        {devices.length === 0 && (
                                            <p className="mt-1.5 text-xs text-gray-500">
                                                No available devices.{' '}
                                                <Link to="/devices" className="text-airline-blue font-bold hover:underline">
                                                    Buy a tracker
                                                </Link>.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tag Number</label>
                                        <input
                                            name="tagNumber"
                                            required
                                            value={tagNumber}
                                            onChange={(e) => {
                                                setTagNumber(e.target.value);
                                                if (pickedDevice && e.target.value !== pickedDevice) setPickedDevice('');
                                            }}
                                            readOnly={Boolean(pickedDevice)}
                                            placeholder="e.g. AA-001293"
                                            className={`block w-full border rounded-xl shadow-sm py-2.5 px-3 font-mono text-sm outline-none focus:ring-2 focus:ring-airline-sky ${
                                                pickedDevice
                                                    ? 'bg-blue-50 border-airline-sky/40 text-airline-blue'
                                                    : 'border-gray-200 focus:border-airline-sky'
                                            }`}
                                        />
                                        {pickedDevice && (
                                            <p className="mt-1.5 text-xs text-airline-blue flex items-center gap-1">
                                                <Cpu size={12} /> Using device {pickedDevice}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Weight (lbs)
                                        </label>
                                        <input
                                            name="weight"
                                            type="number"
                                            step="0.1"
                                            required
                                            placeholder="45.5"
                                            className="block w-full border border-gray-200 rounded-xl shadow-sm py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-airline-sky focus:border-airline-sky"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Bag Photo <span className="font-normal text-gray-400">(optional)</span>
                                        </label>
                                        <input
                                            name="image"
                                            type="file"
                                            accept="image/*"
                                            className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-airline-blue hover:file:bg-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Description <span className="font-normal text-gray-400">(optional)</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            rows={2}
                                            placeholder="Red Samsonite suitcase…"
                                            className="block w-full border border-gray-200 rounded-xl shadow-sm py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-airline-sky focus:border-airline-sky resize-none"
                                        />
                                    </div>
                                </form>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="add-bag-form"
                                    disabled={uploading}
                                    className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-airline-blue hover:bg-airline-dark disabled:opacity-60 transition-colors flex items-center gap-2"
                                >
                                    {uploading ? <><Loader2 className="animate-spin" size={16} /> Saving…</> : 'Save Bag'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SubscriptionGate>
    );
};
