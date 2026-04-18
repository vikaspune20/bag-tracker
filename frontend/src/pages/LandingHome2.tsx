import {
  LandingNav,
  HeroSection,
  WhySection,
  RegisterBagSection,
  LiveTrackingSection,
  AlertsSection,
  AuthSection,
  FinalCTASection,
} from '../components/landing';

export const LandingHome2 = () => {
  return (
    <div className="snap-page h-screen overflow-y-auto overscroll-y-none bg-premium-bg font-sans text-white">
      <LandingNav />
      <main>
        <HeroSection />
        <WhySection />
        <RegisterBagSection />
        <LiveTrackingSection />
        <AlertsSection />
        <AuthSection />
        <FinalCTASection />
      </main>
    </div>
  );
};
