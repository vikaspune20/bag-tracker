import { Link } from 'react-router-dom';
import { LandingNav } from '../components/landing/LandingNav';
import { ScrollReveal } from '../components/landing/ScrollReveal';

export const About = () => {
  return (
    <div className="min-h-screen bg-landing-bg font-sans text-landing-text antialiased">
      <LandingNav />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-600">About us</p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Built for calmer travel
            </h1>
            <p className="mt-6 text-lg text-landing-muted">
              JC SMARTBAG helps travelers and airlines close the gap between check-in and carousel
              with clear, real-time baggage visibility. We believe the best trip is one where you
              spend less time wondering—and more time moving forward.
            </p>
          </ScrollReveal>

          <ScrollReveal delayMs={80}>
            <div className="mt-12 space-y-8 rounded-2xl border border-slate-200/90 bg-white/80 p-8 shadow-glass-light backdrop-blur-sm md:p-10">
              <div>
                <h2 className="font-display text-xl font-semibold text-landing-text">Our mission</h2>
                <p className="mt-3 text-landing-muted">
                  Make baggage status as easy to follow as a parcel delivery—accurate updates,
                  proactive alerts, and one place to see every bag across every trip.
                </p>
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-landing-text">What we value</h2>
                <ul className="mt-3 list-inside list-disc space-y-2 text-landing-muted">
                  <li>Trust through transparency</li>
                  <li>Clarity over complexity</li>
                  <li>Privacy and security by design</li>
                </ul>
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-landing-text">Get in touch</h2>
                <p className="mt-3 text-landing-muted">
                  Partnerships, press, or product questions — we&apos;d love to hear from you.
                </p>
                <Link
                  to="/contact"
                  className="mt-4 inline-flex rounded-full border border-cyan-300/80 bg-white px-6 py-2.5 text-sm font-semibold text-cyan-700 shadow-sm transition hover:bg-cyan-50/80"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </main>
      <footer className="border-t border-slate-200/90 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 text-center text-xs text-landing-muted md:flex-row md:px-8 md:text-left">
          <p>© {new Date().getFullYear()} JC SMARTBAG</p>
          <Link to="/home" className="text-cyan-700 hover:underline">
            Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
};
