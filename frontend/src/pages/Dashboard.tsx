import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Plane, Briefcase, MapPin, Bell } from 'lucide-react';
import api from '../utils/api';

export const Dashboard = () => {
  const user = useAuthStore(state => state.user);
  const [stats, setStats] = useState({ upcomingTrips: 0, totalBags: 0, activeTracking: 0, totalTrips: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [tripsRes, bagsRes] = await Promise.all([
          api.get('/trips'),
          api.get('/bags')
        ]);
        
        setStats({
          upcomingTrips: tripsRes.data.trips.length,
          totalBags: bagsRes.data.bags.length,
          activeTracking: bagsRes.data.bags.filter((b: any) => b.trackingLogs?.length > 0).length,
          totalTrips: tripsRes.data.trips.length
        });
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Upcoming Trips', value: stats.upcomingTrips, icon: <Plane size={24}/>, iconColor: 'bg-white text-blue-600', bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-600' },
    { title: 'Registered Bags', value: stats.totalBags, icon: <Briefcase size={24}/>, iconColor: 'bg-white text-emerald-600', bgColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-600' },
    { title: 'Active Trackings', value: stats.activeTracking, icon: <MapPin size={24}/>, iconColor: 'bg-white text-purple-600', bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-600' },
    { title: 'Total Trips', value: stats.totalTrips, icon: <Bell size={24}/>, iconColor: 'bg-white text-orange-600', bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-600' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Welcome {user?.fullName}!</h2>
        <p className="text-gray-500 mt-2 text-lg">Here is your baggage tracking overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all transform hover:-translate-y-1 ${stat.bgColor}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm ${stat.iconColor}`}>
              {stat.icon}
            </div>
            <h3 className="text-white/90 text-sm font-medium">{stat.title}</h3>
            <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Mockup for upcoming trips or latest tracking */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
           <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Latest Tracking Updates</h3>
           <div className="text-gray-500 text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No recent tracking updates available. Add a bag to get started!
           </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
           <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Quick Actions</h3>
           <div className="grid grid-cols-2 gap-4">
                <Link to="/trips" className="p-4 bg-airline-light rounded-xl text-airline-dark font-medium hover:bg-airline-sky hover:text-white transition-colors text-center shadow-sm block">
                    Book New Trip
                </Link>
                <Link to="/bags" className="p-4 bg-airline-light rounded-xl text-airline-dark font-medium hover:bg-airline-sky hover:text-white transition-colors text-center shadow-sm block">
                    Add Baggage
                </Link>
           </div>
        </div>
      </div>
    </div>
  );
};
