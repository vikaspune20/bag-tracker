import { Link } from 'react-router-dom';
import { PlaneTakeoff, ShieldCheck, MapPin } from 'lucide-react';
import logoImg from '../../image.png';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-airline-light font-sans text-airline-dark">
      {/* Navbar */}
      <nav className="flex justify-between items-center py-6 px-10 bg-white shadow-sm">
        <div className="flex items-center space-x-2 text-airline-blue text-2xl font-bold tracking-tight">
          <img src={logoImg} alt="JC SMARTBAG" className="w-16 h-16 object-contain" />
          <span>JC SMARTBAG</span>
        </div>
        <div className="space-x-4">
          <Link to="/login" className="px-6 py-2.5 text-airline-blue font-medium hover:text-airline-dark transition-colors">Log In</Link>
          <Link to="/register" className="px-6 py-2.5 bg-airline-blue text-white rounded-full font-semibold shadow-md hover:bg-airline-dark hover:shadow-lg transition-all">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full py-20 bg-[#edf4fb]">
        <div className="container mx-auto px-10 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-6xl font-extrabold tracking-tight mb-6 leading-tight text-[#1182b5]">Track Your Baggage Journey<br/>in Real Time</h1>
            <p className="text-xl mb-10 text-gray-600">Never lose sight of your luggage again. Monitor every step of your baggage journey from check-in to final delivery with our advanced tracking system.</p>
            <div className="flex flex-wrap justify-center items-center gap-4">
                <Link to="/register" className="px-8 py-4 bg-airline-blue text-white font-bold text-lg rounded-xl hover:bg-airline-dark transition-all shadow-xl">Get Started Free</Link>
                <Link to="/login" className="px-8 py-4 bg-transparent border-2 border-airline-blue text-airline-blue font-bold text-lg rounded-xl hover:bg-white transition-all">Track Baggage</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-airline-dark mb-4">Why Choose JC SMARTBAG?</h2>
            <p className="text-gray-500 text-lg">The most reliable way to monitor your luggage across airports.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <div className="flex flex-col items-center text-center p-8 bg-airline-light rounded-2xl">
              <div className="w-16 h-16 bg-airline-blue text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <MapPin size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-Time Tracking</h3>
              <p className="text-gray-600">See exactly where your bags are at every stage of your flight.</p>
            </div>

            <div className="flex flex-col items-center text-center p-8 bg-airline-light rounded-2xl">
              <div className="w-16 h-16 bg-airline-blue text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Updates</h3>
              <p className="text-gray-600">Receive instant push notifications and alerts when your baggage status changes.</p>
            </div>

            <div className="flex flex-col items-center text-center p-8 bg-airline-light rounded-2xl">
              <div className="w-16 h-16 bg-airline-blue text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <PlaneTakeoff size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Multi-Trip Support</h3>
              <p className="text-gray-600">Manage all your flights, trips, and associated bags in one premium dashboard.</p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};
