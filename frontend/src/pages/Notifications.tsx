import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export const Notifications = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadNotifications(); }, []);

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
        await api.patch('/notifications/mark-all-read').catch(() => {});
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const markAsRead = async (id: string) => {
        await api.patch(`/notifications/${id}/read`).catch(() => {});
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const unread = notifications.filter(n => !n.isRead).length;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {unread > 0 ? `${unread} unread` : 'All caught up'}
                    </p>
                </div>
                {unread > 0 && (
                    <button
                        onClick={markAllRead}
                        className="flex items-center gap-1.5 text-sm font-semibold text-airline-blue hover:text-airline-dark transition-colors"
                    >
                        <CheckCheck size={16} /> Mark all read
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-airline-sky" size={40} />
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center bg-white py-16 rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Bell className="text-gray-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700">All Caught Up!</h3>
                    <p className="text-gray-500 mt-1 text-sm">No notifications yet.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                    {notifications.map(notif => (
                        <div
                            key={notif.id}
                            className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                                notif.isRead ? '' : 'bg-blue-50/50'
                            }`}
                        >
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5 ${
                                notif.isRead ? 'bg-gray-100 text-gray-400' : 'bg-airline-blue text-white'
                            }`}>
                                <Bell size={18} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-snug ${
                                    notif.isRead ? 'text-gray-600' : 'font-semibold text-gray-900'
                                }`}>
                                    {notif.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1.5">
                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                    <span className="mx-1.5 text-gray-300">·</span>
                                    {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                                </p>
                            </div>

                            {/* Mark read */}
                            {!notif.isRead && (
                                <button
                                    onClick={() => markAsRead(notif.id)}
                                    className="flex-shrink-0 p-1.5 rounded-lg text-airline-blue hover:bg-blue-100 transition-colors"
                                    title="Mark as read"
                                >
                                    <Check size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
