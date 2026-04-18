import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Briefcase, Plus, Loader2, Trash2 } from 'lucide-react';

export const Bags = () => {
    const [bags, setBags] = useState<any[]>([]);
    const [trips, setTrips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [bagsRes, tripsRes] = await Promise.all([
                api.get('/bags'),
                api.get('/trips')
            ]);
            setBags(bagsRes.data.bags);
            setTrips(tripsRes.data.trips);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddBag = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            await api.post('/bags', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowModal(false);
            loadData();
        } catch (error) {
            alert('Error adding bag');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this bag?')) return;
        try {
            await api.delete(`/bags/${id}`);
            loadData();
        } catch (error) {
            alert('Failed to delete bag');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Baggage Management</h2>
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center space-x-2 bg-airline-blue text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-airline-dark transition-all"
                >
                    <Plus size={20} />
                    <span>Register Bag</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-airline-sky" size={40}/></div>
            ) : bags.length === 0 ? (
                <div className="text-center bg-white py-16 rounded-2xl shadow-sm border border-gray-100">
                    <Briefcase className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-gray-700">No Bags Registered</h3>
                    <p className="text-gray-500 mt-2">Add a bag to start tracking it.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {bags.map(bag => (
                        <div key={bag.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group">
                            <div className="h-40 bg-gray-100 relative">
                                {bag.imagePath ? (
                                    <img src={`http://localhost:5000${bag.imagePath}`} alt={bag.tagNumber} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                        <Briefcase size={32} className="mb-2"/>
                                        <span className="text-sm">No Image</span>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-md text-xs font-bold font-mono tracking-widest">
                                    {bag.tagNumber}
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h4 className="font-bold text-lg text-gray-900 mb-1">{bag.weightLbs} lbs</h4>
                                <p className="text-sm text-gray-500 flex-1">{bag.description || 'No description provided.'}</p>
                                
                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                     <Link to={`/tracking?bagId=${bag.id}`} className="text-sm font-bold text-airline-sky hover:text-airline-blue">View Tracking</Link>
                                     <button onClick={() => handleDelete(bag.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                         <Trash2 size={18} />
                                     </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Add Baggage</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleAddBag} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Link to Trip</label>
                                    <select name="tripId" required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-airline-sky sm:text-sm">
                                        <option value="">Select a flight...</option>
                                        {trips.map(t => (
                                            <option key={t.id} value={t.id}>{t.flightNumber} ({t.departureAirport} &rarr; {t.destinationAirport})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tag Number</label>
                                    <input name="tagNumber" required placeholder="e.g. AA-001293" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 font-mono sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Weight (lbs)</label>
                                    <input name="weight" type="number" step="0.1" required placeholder="45.5" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bag Image</label>
                                    <input name="image" type="file" accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-airline-blue hover:file:bg-blue-100" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                                    <textarea name="description" rows={2} placeholder="Red Samsonite suitcase..." className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 sm:text-sm"></textarea>
                                </div>
                                
                                <div className="pt-4 flex justify-end">
                                    <button type="submit" disabled={uploading} className="bg-airline-blue text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-airline-dark transition-colors flex items-center">
                                        {uploading ? <Loader2 className="animate-spin mr-2" size={16}/> : 'Save Bag'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
