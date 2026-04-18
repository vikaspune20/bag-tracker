import React, { useState } from 'react';
import api from '../utils/api';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShieldAlert, Search, Loader2, Save } from 'lucide-react';

const STAGES = [
    'CHECKED_IN', 'SECURITY_SCREENING', 'LOADED_ON_AIRCRAFT', 
    'IN_TRANSIT', 'ARRIVED_AT_TRANSIT', 'TRANSFERRED', 
    'ARRIVED_AT_DESTINATION', 'OUT_FOR_DELIVERY', 'DELIVERED'
];

export const Admin = () => {
    const user = useAuthStore(state => state.user);
    const [tagNumber, setTagNumber] = useState('');
    const [bag, setBag] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    if (user?.role !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setBag(null);

        try {
            // Note: In a real app we'd have a specific GET /bags/tag/:tagNumber route
            // For MVP assuming admin can fetch all bags or we add a search query. 
            // We will just fetch all and filter client side for simplicity in this generated code block.
            const { data } = await api.get('/bags');
            const foundBag = data.bags.find((b: any) => b.tagNumber === tagNumber);
            if (foundBag) {
                setBag(foundBag);
            } else {
                setError('Bag not found with that tag number.');
            }
        } catch (err: any) {
            setError('Error searching for bag.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUpdating(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            await api.post('/tracking', {
                bagId: bag.id,
                stage: formData.get('stage'),
                airportLocation: formData.get('airportLocation'),
                remarks: formData.get('remarks')
            });
            alert('Tracking event added and passenger notified!');
            setBag(null);
            setTagNumber('');
        } catch (err) {
            alert('Error updating tracking status');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-3 mb-8 text-xl font-bold border-b pb-4 border-gray-200">
                <ShieldAlert className="text-red-500" size={28} />
                <span>Airline Staff Admin Panel</span>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Search Baggage Tag</h3>
                <form onSubmit={handleSearch} className="flex space-x-4">
                    <div className="flex-1">
                        <input 
                            value={tagNumber} 
                            onChange={e => setTagNumber(e.target.value)}
                            placeholder="e.g. AA-001293" 
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 font-mono shadow-sm focus:ring-red-500" 
                        />
                    </div>
                    <button type="submit" disabled={loading} className="bg-airline-dark text-white px-8 py-3 rounded-lg font-bold shadow-sm hover:bg-black transition-colors flex items-center">
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} className="mr-2" />}
                        Search
                    </button>
                </form>
                {error && <p className="text-red-500 mt-4 font-medium">{error}</p>}
            </div>

            {bag && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 mt-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Update Status for: <span className="text-airline-sky font-mono">{bag.tagNumber}</span></h3>
                    
                    <form onSubmit={handleUpdateEvent} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">New Stage</label>
                                <select name="stage" required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-3">
                                    {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Current Airport / Location</label>
                                <input name="airportLocation" required placeholder="e.g. JFK Terminal 4, Belt 2" className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-3" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Staff Remarks</label>
                            <input name="remarks" placeholder="Optional notes visible to passenger..." className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-3" />
                        </div>
                        
                        <div className="pt-4 flex justify-end border-t border-gray-100">
                            <button type="submit" disabled={updating} className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-red-700 transition-colors flex items-center">
                                {updating ? <Loader2 size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                                Push Tracking Update
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
