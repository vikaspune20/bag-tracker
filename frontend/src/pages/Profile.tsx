import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { User, Camera, Loader2, Save } from 'lucide-react';

export const Profile = () => {
    const { user, checkAuth } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        identificationNo: ''
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName,
                phone: user.phone,
                email: user.email,
                address: user.address || '',
                city: user.city || '',
                state: user.state || '',
                identificationNo: user.identificationNo || ''
            });
            if (user.profilePicUrl) {
                setImagePreview(user.profilePicUrl);
            }
        }
    }, [user]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const payload = new FormData();
        payload.append('fullName', formData.fullName);
        payload.append('phone', formData.phone);
        payload.append('address', formData.address);
        payload.append('city', formData.city);
        payload.append('state', formData.state);
        payload.append('identificationNo', formData.identificationNo);
        if (imageFile) {
            payload.append('profilePic', imageFile);
        }

        try {
            await api.put('/auth/profile', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess('Profile updated successfully!');
            await checkAuth(); // Refresh user state in app
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <User className="mr-3 text-airline-sky" /> My Profile
                </h2>
                <p className="text-gray-500 mt-1">Manage your personal information and profile picture.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Profile Picture Section */}
                    <div className="flex flex-col items-center sm:flex-row sm:space-x-8 space-y-4 sm:space-y-0">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full border-4 border-gray-50 bg-gray-100 overflow-hidden flex items-center justify-center shadow-md">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={48} className="text-gray-400" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-airline-blue text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-airline-dark transition-colors">
                                <Camera size={18} />
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
                        </div>
                        <div className="text-center sm:text-left">
                            <h3 className="text-lg font-bold text-gray-900">Profile Picture</h3>
                            <p className="text-sm text-gray-500">Upload a new avatar. Max size 2MB.</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Full Name</label>
                            <input name="fullName" value={formData.fullName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:ring-airline-sky focus:border-airline-sky" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Mobile Phone</label>
                            <input name="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:ring-airline-sky focus:border-airline-sky" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Address</label>
                            <input name="address" value={formData.address} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">State</label>
                            <input name="state" value={formData.state} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">City</label>
                            <input name="city" value={formData.city} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Identification Number</label>
                            <input name="identificationNo" value={formData.identificationNo} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Email Address (Read-only)</label>
                            <input name="email" value={formData.email} disabled className="mt-1 block w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg shadow-sm py-2.5 px-4 cursor-not-allowed" />
                        </div>
                    </div>

                    {error && <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm font-medium">{error}</div>}
                    {success && <div className="text-green-600 bg-green-50 p-3 rounded-lg text-sm font-medium">{success}</div>}

                    <div className="flex justify-start">
                        <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-airline-blue text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-airline-dark transition-all disabled:opacity-50">
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            <span>Save Changes</span>
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
