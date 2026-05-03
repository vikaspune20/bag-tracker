import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { User, Camera, Loader2, Save, CheckCircle2, AlertCircle } from 'lucide-react';

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
        identificationNo: '',
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
                identificationNo: user.identificationNo || '',
            });
            if (user.profilePicUrl) setImagePreview(user.profilePicUrl);
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
        if (imageFile) payload.append('profilePic', imageFile);

        try {
            await api.put('/auth/profile', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSuccess('Profile updated successfully!');
            await checkAuth();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = 'block w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-2 focus:ring-airline-sky focus:border-airline-sky transition-shadow';

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                <p className="text-sm text-gray-500 mt-0.5">Manage your personal information and profile picture.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-24 h-24 rounded-2xl border-2 border-gray-100 bg-gray-100 overflow-hidden flex items-center justify-center shadow-sm">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-gray-400" />
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 bg-airline-blue text-white p-1.5 rounded-xl cursor-pointer shadow-md hover:bg-airline-dark transition-colors">
                                <Camera size={16} />
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
                        </div>

                        <div className="text-center sm:text-left">
                            <h3 className="text-base font-bold text-gray-900">{user?.fullName || 'Your Name'}</h3>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                            <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF · Max 2 MB</p>
                        </div>
                    </div>
                </div>

                {/* Personal info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-5">Personal Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                            <input name="fullName" value={formData.fullName} onChange={handleChange} required className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Phone</label>
                            <input name="phone" value={formData.phone} onChange={handleChange} required className={inputCls} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                            <input name="address" value={formData.address} onChange={handleChange} required className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                            <input name="city" value={formData.city} onChange={handleChange} required className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
                            <input name="state" value={formData.state} onChange={handleChange} required className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Identification Number</label>
                            <input name="identificationNo" value={formData.identificationNo} onChange={handleChange} required className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Email Address
                                <span className="ml-1.5 text-xs font-normal text-gray-400">(read-only)</span>
                            </label>
                            <input
                                name="email"
                                value={formData.email}
                                disabled
                                className="block w-full border border-gray-100 bg-gray-50 text-gray-400 rounded-xl py-2.5 px-4 text-sm cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                        <CheckCircle2 size={16} className="flex-shrink-0" />
                        {success}
                    </div>
                )}

                {/* Submit */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-airline-blue text-white px-6 py-2.5 rounded-xl font-bold shadow-sm hover:bg-airline-dark transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {loading ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};
