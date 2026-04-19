import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LandingNav,
  HeroSection,
  WhySection,
  LiveTrackingSection,
  AlertsSection,
  FinalCTASection,
  ScrollProgress,
} from '../components/landing';

export const Landing = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const id = hash?.replace(/^#/, '');
    if (!id) return;
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => window.clearTimeout(t);
  }, [pathname, hash]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('scroll-smooth');
    return () => root.classList.remove('scroll-smooth');
  }, []);

  return (
    <div className="min-h-screen scroll-smooth bg-landing-bg font-sans text-landing-text antialiased">
      <ScrollProgress />
      <LandingNav />
      <main className="pb-14">
        <HeroSection />
        <WhySection />
        <LiveTrackingSection />
        <AlertsSection />
        <FinalCTASection />
      </main>

      <footer className="border-t border-slate-200/90 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 text-center text-xs text-landing-muted md:flex-row md:px-8 md:text-left">
          <p>© {new Date().getFullYear()} JC SMARTBAG</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/about" className="text-cyan-700 hover:underline">
              About
            </Link>
            <Link to="/terms" className="text-cyan-700 hover:underline">
              Terms
            </Link>
            <Link to="/privacy" className="text-cyan-700 hover:underline">
              Privacy
            </Link>
            <Link to="/refunds" className="text-cyan-700 hover:underline">
              Refunds &amp; Cancellation
            </Link>
            <Link to="/contact-info" className="text-cyan-700 hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
