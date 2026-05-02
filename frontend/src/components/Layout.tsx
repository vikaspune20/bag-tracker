import { Navigate, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Ticket, Briefcase, Map, History, CreditCard, Loader2, Cpu, ShoppingBag, ClipboardList } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { NotificationPopover } from './NotificationPopover';
import { ProfilePopover } from './ProfilePopover';
import { Logo } from './Logo';

export const Layout = () => {
  const { user, authReady, token } = useAuthStore();
  const hasToken = Boolean(token || localStorage.getItem('token'));

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

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Trips', icon: <Ticket size={20} />, path: '/trips' },
    { name: 'Baggage', icon: <Briefcase size={20} />, path: '/bags' },
    { name: 'Tracking', icon: <Map size={20} />, path: '/tracking' },
    { name: 'Trip History', icon: <History size={20} />, path: '/history' },
    { name: 'Buy Device', icon: <ShoppingBag size={20} />, path: '/devices' },
    { name: 'My Devices', icon: <Cpu size={20} />, path: '/my-devices' },
    { name: 'My Orders', icon: <ClipboardList size={20} />, path: '/orders' },
    { name: 'Subscription', icon: <CreditCard size={20} />, path: '/subscription' },
  ];

  return (
    <div className="flex h-screen bg-airline-light">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl flex flex-col">
        <div className="px-4 py-5 border-b flex justify-center">
          <Logo />
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item) => (
            <Link key={item.name} to={item.path} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-airline-blue hover:text-white transition-colors">
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <header className="bg-white px-8 py-4 shadow-sm flex justify-end items-center gap-2">
          <NotificationPopover />
          <ProfilePopover />
        </header>
        <div className="p-8">
            <Outlet />
        </div>
      </main>
    </div>
  );
};
