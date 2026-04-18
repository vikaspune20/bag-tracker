import { Link } from 'react-router-dom';
import { LandingNav } from '../components/landing/LandingNav';
import { ContactSupportSection } from '../components/landing/ContactSupportSection';

export const Contact = () => {
  return (
    <div className="min-h-screen bg-landing-bg font-sans text-landing-text antialiased">
      <LandingNav />
      <main className="pt-24">
        <ContactSupportSection />
      </main>
      <footer className="border-t border-slate-200/90 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 text-center text-xs text-landing-muted md:flex-row md:px-8 md:text-left">
          <p>© {new Date().getFullYear()} JC SMARTBAG</p>
          <div className="flex gap-4">
            <Link to="/about" className="text-cyan-700 hover:underline">
              About
            </Link>
            <Link to="/home" className="text-cyan-700 hover:underline">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
