import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, UserCog } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function ProfilePopover() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
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

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 transition-colors"
        aria-label="Profile menu"
      >
        <div className="w-8 h-8 rounded-full bg-airline-sky text-white flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
          {user.profilePicUrl
            ? <img src={user.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
            : initials}
        </div>
        <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate hidden sm:block">
          {user.fullName}
        </span>
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* User card */}
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-airline-sky text-white flex items-center justify-center font-bold text-lg overflow-hidden flex-shrink-0">
              {user.profilePicUrl
                ? <img src={user.profilePicUrl} alt="Profile" className="w-full h-full object-cover" />
                : initials}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{user.fullName}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Update Profile */}
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <UserCog size={16} className="text-gray-400 flex-shrink-0" />
            Update Profile
          </Link>

          <div className="border-t border-gray-100" />

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} className="text-gray-400 flex-shrink-0 group-hover:text-red-500" />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
