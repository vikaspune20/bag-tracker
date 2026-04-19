import { Link } from 'react-router-dom';
import { LandingNav } from '../components/landing/LandingNav';
import { ScrollReveal } from '../components/landing/ScrollReveal';

const SUPPORT_EMAIL = 'support@jcsmartbag.com';

export const ContactInformation = () => {
  return (
    <div className="min-h-screen bg-landing-bg font-sans text-landing-text antialiased">
      <LandingNav />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-600">
              Contact information
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Contact information
            </h1>
            <p className="mt-6 text-lg text-landing-muted">
              For account support, tracking questions, or subscription billing (Stripe), reach us here.
            </p>
          </ScrollReveal>

          <ScrollReveal delayMs={80}>
            <div className="mt-12 space-y-8 rounded-2xl border border-slate-200/90 bg-white/80 p-8 shadow-glass-light backdrop-blur-sm md:p-10">
              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">Email</h2>
                <p className="mt-3 text-landing-muted">
                  <a className="text-cyan-700 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
                    {SUPPORT_EMAIL}
                  </a>
                </p>
                <p className="mt-3 text-sm text-landing-muted">
                  Typical response time: 1–3 business days.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">Support form</h2>
                <p className="mt-3 text-landing-muted">
                  Prefer a form? Use our support page and we&apos;ll get back to you.
                </p>
                <Link
                  to="/contact"
                  className="mt-4 inline-flex rounded-full border border-cyan-300/80 bg-white px-6 py-2.5 text-sm font-semibold text-cyan-700 shadow-sm transition hover:bg-cyan-50/80"
                >
                  Open support form
                </Link>
              </section>
            </div>
          </ScrollReveal>
        </div>
      </main>

      <footer className="border-t border-slate-200/90 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 text-center text-xs text-landing-muted md:flex-row md:px-8 md:text-left">
          <p>© {new Date().getFullYear()} JC SMARTBAG</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/terms" className="text-cyan-700 hover:underline">
              Terms
            </Link>
            <Link to="/privacy" className="text-cyan-700 hover:underline">
              Privacy
            </Link>
            <Link to="/refunds" className="text-cyan-700 hover:underline">
              Refunds &amp; Cancellation
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

