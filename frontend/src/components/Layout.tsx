import { useState, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, Briefcase, Map, History, CreditCard,
  Loader2, Cpu, ShoppingBag, ClipboardList, Menu, X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { NotificationPopover } from './NotificationPopover';
import { ProfilePopover } from './ProfilePopover';
import { Logo } from './Logo';

const navItems = [
  { name: 'Dashboard',    icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { name: 'Trips',        icon: <Ticket size={20} />,          path: '/trips' },
  { name: 'Baggage',      icon: <Briefcase size={20} />,       path: '/bags' },
  { name: 'Tracking',     icon: <Map size={20} />,             path: '/tracking' },
  { name: 'Trip History', icon: <History size={20} />,         path: '/history' },
  { name: 'Buy Device',   icon: <ShoppingBag size={20} />,     path: '/devices' },
  { name: 'My Devices',   icon: <Cpu size={20} />,             path: '/my-devices' },
  { name: 'My Orders',    icon: <ClipboardList size={20} />,   path: '/orders' },
  { name: 'Subscription', icon: <CreditCard size={20} />,      path: '/subscription' },
];

function SidebarContent({ onClose, activePath }: { onClose?: () => void; activePath: string }) {
  return (
    <aside className="w-64 bg-white shadow-xl flex flex-col h-full">
      {/* Logo row */}
      <div className="px-4 py-5 border-b flex items-center justify-between gap-2">
        <Logo />
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = activePath === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-sm ${
                active
                  ? 'bg-airline-blue text-white shadow-sm'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-airline-blue'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export const Layout = () => {
  const { user, authReady, token } = useAuthStore();
  const hasToken = Boolean(token || localStorage.getItem('token'));
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (!authReady && hasToken) {
    return (
      <div className="flex h-screen items-center justify-center bg-airline-light">
        <Loader2 className="h-10 w-10 animate-spin text-airline-sky" aria-hidden />
        <span className="sr-only">Loading session…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-airline-light overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <div className="hidden md:flex md:flex-shrink-0">
        <SidebarContent activePath={location.pathname} />
      </div>

      {/* ── Mobile slide-over sidebar ───────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Panel */}
          <div className="relative z-10 flex-shrink-0 w-64 shadow-2xl">
            <SidebarContent
              activePath={location.pathname}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white px-4 md:px-8 py-4 shadow-sm flex items-center justify-between md:justify-end gap-3 flex-shrink-0">
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          {/* Right slot */}
          <div className="flex items-center gap-2">
            <NotificationPopover />
            <ProfilePopover />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
