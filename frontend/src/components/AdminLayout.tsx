import { useState, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Cpu, ShoppingBag, CreditCard,
  MessageSquare, Map, Trash2, Menu, X, LogOut, Loader2, Tag,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const navItems = [
  { name: 'Dashboard',       icon: <LayoutDashboard size={18} />, path: '/admin' },
  { name: 'Users',           icon: <Users size={18} />,           path: '/admin/users' },
  { name: 'Devices',         icon: <Cpu size={18} />,             path: '/admin/devices' },
  { name: 'Orders',          icon: <ShoppingBag size={18} />,     path: '/admin/orders' },
  { name: 'Subscriptions',   icon: <CreditCard size={18} />,      path: '/admin/subscriptions' },
  { name: 'Enquiries',       icon: <MessageSquare size={18} />,   path: '/admin/enquiries' },
  { name: 'Pricing',          icon: <Tag size={18} />,             path: '/admin/pricing' },
  { name: 'Tracking Mgr',    icon: <Map size={18} />,             path: '/admin/tracking' },
  { name: 'Data Purge',      icon: <Trash2 size={18} />,          path: '/admin/purge' },
];

function AdminSidebar({ onClose, activePath }: { onClose?: () => void; activePath: string }) {
  const { logout, user } = useAuthStore();

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full border-r border-slate-700/50">
      {/* Logo / Badge row */}
      <div className="px-4 py-5 border-b border-slate-700/50 flex items-center justify-between">
        <div>
          <span className="text-white font-bold text-sm tracking-wide">JC Smartbag</span>
          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase tracking-wider">
            Admin
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = activePath === item.path ||
            (item.path !== '/admin' && activePath.startsWith(item.path));
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-700/50 space-y-1">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          <LayoutDashboard size={18} />
          <span>User Dashboard</span>
        </Link>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.fullName}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded text-slate-500 hover:text-red-400 transition-colors"
            title="Log out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export const AdminLayout = () => {
  const { user, authReady, token } = useAuthStore();
  const hasToken = Boolean(token || localStorage.getItem('token'));
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (!authReady && hasToken) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <AdminSidebar activePath={location.pathname} />
      </div>

      {/* Mobile slide-over */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 flex-shrink-0 w-64 shadow-2xl">
            <AdminSidebar activePath={location.pathname} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700/50 px-4 md:px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-600/20 text-red-400 border border-red-600/30 uppercase tracking-wider">
              Admin Panel
            </span>
            <span className="hidden sm:block text-sm text-slate-400">{user?.fullName}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
