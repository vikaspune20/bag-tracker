import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
}

const PREVIEW_COUNT = 5;
const POLL_MS = 30_000; // refresh every 30 s

export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get<{ notifications: Notification[] }>('/notifications');
      setNotifications(data.notifications ?? []);
    } catch { /* silently ignore */ }
    finally { if (!silent) setLoading(false); }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetch();
    const id = setInterval(() => fetch(true), POLL_MS);
    return () => clearInterval(id);
  }, [fetch]);

  // Fetch fresh list when popover opens
  useEffect(() => { if (open) fetch(); }, [open, fetch]);

  // ── Close on outside click ───────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const markOne = async (id: string) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAll = async () => {
    await api.patch('/notifications/mark-all-read').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const unread = notifications.filter(n => !n.isRead).length;
  const preview = notifications.slice(0, PREVIEW_COUNT);

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-xl text-gray-500 hover:text-airline-blue hover:bg-blue-50 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">Notifications</span>
              {unread > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAll}
                  className="flex items-center gap-1 text-xs font-semibold text-airline-blue hover:underline"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">Loading…</div>
            ) : preview.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">All caught up!</p>
              </div>
            ) : (
              preview.map(notif => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 flex items-start gap-3 transition-colors ${notif.isRead ? 'bg-white' : 'bg-blue-50/50'}`}
                >
                  {/* Dot */}
                  <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${notif.isRead ? 'bg-gray-200' : 'bg-airline-blue'}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${notif.isRead ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                      {notif.message}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>

                  {/* Mark read */}
                  {!notif.isRead && (
                    <button
                      onClick={() => markOne(notif.id)}
                      className="flex-shrink-0 p-1 rounded-lg text-airline-blue hover:bg-blue-100 transition-colors"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-sm font-semibold text-airline-blue hover:underline"
            >
              See all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
