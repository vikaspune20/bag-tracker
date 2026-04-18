import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LandingNav,
  HeroSection,
  WhySection,
  LiveTrackingSection,
  AlertsSection,
  FinalCTASection,
  ScrollProgress,
} from '../components/landing';

export const LandingHome = () => {
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
      <main>
        <HeroSection />
        <WhySection />
        <LiveTrackingSection />
        <AlertsSection />
        <FinalCTASection />
      </main>
    </div>
  );
};
