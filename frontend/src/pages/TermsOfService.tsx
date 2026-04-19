import { Link } from 'react-router-dom';
import { LandingNav } from '../components/landing/LandingNav';
import { ScrollReveal } from '../components/landing/ScrollReveal';

const EFFECTIVE_DATE = 'Apr 20, 2026';

export const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-landing-bg font-sans text-landing-text antialiased">
      <LandingNav />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-600">
              Terms of Service
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Terms of Service
            </h1>
            <p className="mt-4 text-sm text-landing-muted">Effective date: {EFFECTIVE_DATE}</p>
            <p className="mt-6 text-lg text-landing-muted">
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the JC SMARTBAG
              website and application (the &quot;Service&quot;). By using the Service, you agree to these
              Terms.
            </p>
          </ScrollReveal>

          <ScrollReveal delayMs={80}>
            <div className="mt-12 space-y-10 rounded-2xl border border-slate-200/90 bg-white/80 p-8 shadow-glass-light backdrop-blur-sm md:p-10">
              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">1. Eligibility</h2>
                <p className="mt-3 text-landing-muted">
                  You must be able to form a binding contract in your jurisdiction to use the Service.
                  If you are using the Service on behalf of an organization, you represent that you are
                  authorized to accept these Terms on its behalf.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">2. Accounts and security</h2>
                <p className="mt-3 text-landing-muted">
                  You are responsible for maintaining the confidentiality of your login credentials and
                  for all activity that occurs under your account. Notify us promptly if you suspect
                  unauthorized access.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">3. Acceptable use</h2>
                <ul className="mt-3 list-inside list-disc space-y-2 text-landing-muted">
                  <li>Do not misuse the Service or attempt to access it using a method other than the interface we provide.</li>
                  <li>Do not interfere with or disrupt the integrity, performance, or security of the Service.</li>
                  <li>Do not use the Service for unlawful, harmful, or fraudulent purposes.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">4. Subscriptions, billing, and Stripe</h2>
                <p className="mt-3 text-landing-muted">
                  If you purchase a subscription, you authorize us to charge your selected payment method on a
                  recurring basis until you cancel. Payments are processed by Stripe, our payment processor.
                  We do not store your full payment card details.
                </p>
                <ul className="mt-3 list-inside list-disc space-y-2 text-landing-muted">
                  <li>
                    <span className="font-medium text-landing-text">Recurring renewals</span>: Your subscription renews automatically at the
                    stated interval (e.g., monthly or annually) unless cancelled before the renewal date.
                  </li>
                  <li>
                    <span className="font-medium text-landing-text">Failed payments</span>: If a charge fails, we may retry billing and may
                    suspend or limit access until payment is successfully processed.
                  </li>
                  <li>
                    <span className="font-medium text-landing-text">Taxes</span>: Prices may exclude applicable taxes, which may be added where required.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">5. Cancellation</h2>
                <p className="mt-3 text-landing-muted">
                  You can cancel your subscription at any time. Cancellation stops future renewals and will
                  generally take effect at the end of the current billing period. To request help with cancellation,
                  contact <a className="text-cyan-700 hover:underline" href="mailto:support@jcsmartbag.com">support@jcsmartbag.com</a>.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">6. Changes to the Service or Terms</h2>
                <p className="mt-3 text-landing-muted">
                  We may update the Service or these Terms from time to time. If we make material changes, we will
                  update the effective date and may provide additional notice within the Service.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">7. Disclaimers</h2>
                <p className="mt-3 text-landing-muted">
                  The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. Tracking and status
                  information may be delayed, incomplete, or inaccurate due to third-party data, connectivity,
                  device limitations, or operational factors.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">8. Limitation of liability</h2>
                <p className="mt-3 text-landing-muted">
                  To the maximum extent permitted by law, JC SMARTBAG will not be liable for any indirect,
                  incidental, special, consequential, or punitive damages, or any loss of profits or revenues,
                  whether incurred directly or indirectly, arising from your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">9. Contact</h2>
                <p className="mt-3 text-landing-muted">
                  Questions about these Terms? Email{' '}
                  <a className="text-cyan-700 hover:underline" href="mailto:support@jcsmartbag.com">
                    support@jcsmartbag.com
                  </a>{' '}
                  or use our <Link to="/contact" className="text-cyan-700 hover:underline">contact form</Link>.
                </p>
              </section>
            </div>
          </ScrollReveal>
        </div>
      </main>

      <footer className="border-t border-slate-200/90 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 text-center text-xs text-landing-muted md:flex-row md:px-8 md:text-left">
          <p>© {new Date().getFullYear()} JC SMARTBAG</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/privacy" className="text-cyan-700 hover:underline">
              Privacy
            </Link>
            <Link to="/refunds" className="text-cyan-700 hover:underline">
              Refunds &amp; Cancellation
            </Link>
            <Link to="/contact-info" className="text-cyan-700 hover:underline">
              Contact
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

