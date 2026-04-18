import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Bell, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export const Notifications = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/notifications');
            setNotifications(data.notifications);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/mark-all-read');
            loadNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            loadNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                <button 
                    onClick={markAllRead}
                    className="text-airline-blue text-sm font-bold hover:underline"
                >
                    Mark All as Read
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-airline-sky" size={40}/></div>
            ) : notifications.length === 0 ? (
                <div className="text-center bg-white py-16 rounded-2xl shadow-sm border border-gray-100">
                    <Bell className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-gray-700">All Caught Up!</h3>
                    <p className="text-gray-500 mt-2">You have no new notifications.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((notif) => (
                        <div key={notif.id} className={`p-5 rounded-2xl border ${notif.isRead ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-200'} shadow-sm flex gap-4 items-start transition-colors`}>
                            <div className={`mt-1 rounded-full p-2 ${notif.isRead ? 'bg-gray-100 text-gray-400' : 'bg-airline-blue text-white'}`}>
                                <Bell size={20} />
                            </div>
                            <div className="flex-1">
                                <p className={`text-base ${notif.isRead ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                                    {notif.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    {format(new Date(notif.createdAt), 'MMM d, yyyy h:mm a')}
                                </p>
                            </div>
                            {!notif.isRead && (
                                <button 
                                    onClick={() => markAsRead(notif.id)} 
                                    className="p-2 text-airline-blue hover:bg-blue-100 rounded-full transition-colors"
                                    title="Mark as read"
                                >
                                    <Check size={20} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
