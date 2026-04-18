import { Navigate, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Ticket, Briefcase, Map, History, Bell, User, LogOut, CreditCard, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import logoImg from '../../image.png';

export const Layout = () => {
  const { user, logout, authReady, token } = useAuthStore();
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
    { name: 'Notifications', icon: <Bell size={20} />, path: '/notifications' },
    { name: 'Profile', icon: <User size={20} />, path: '/profile' },
    { name: 'Subscription', icon: <CreditCard size={20} />, path: '/subscription' },
  ];

  return (
    <div className="flex h-screen bg-airline-light">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl flex flex-col">
        <div className="px-4 py-6 border-b flex justify-center">
          <img
            src={logoImg}
            alt="JC SMARTBAG — Track Your Bag. Illustration of three suitcases: green upright case, tan rolling bag, and brown trunk."
            className="w-full max-w-[7rem] h-auto object-contain"
          />
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item) => (
            <Link key={item.name} to={item.path} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-airline-blue hover:text-white transition-colors">
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex justify-between items-center mb-4 px-2">
              <div className="flex items-center space-x-2">
                 <div className="w-8 h-8 rounded-full bg-airline-sky text-white flex items-center justify-center font-bold overflow-hidden">
                    {user.profilePicUrl ? <img src={user.profilePicUrl} alt="Profile" className="w-full h-full object-cover" /> : user.fullName[0]}
                 </div>
                 <div className="text-sm">
                    <p className="font-semibold text-gray-800">{user.fullName}</p>
                 </div>
              </div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
            <LogOut size={16} />
            <span className="text-sm font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <header className="bg-white px-8 py-4 shadow-sm flex justify-end items-center">
             <div className="flex items-center space-x-4">
                 <div className="text-sm text-gray-500 font-medium">{user.fullName}</div>
             </div>
        </header>
        <div className="p-8">
            <Outlet />
        </div>
      </main>
    </div>
  );
};
