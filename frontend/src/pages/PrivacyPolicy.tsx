import { Link } from 'react-router-dom';
import { LandingNav } from '../components/landing/LandingNav';
import { ScrollReveal } from '../components/landing/ScrollReveal';

const EFFECTIVE_DATE = 'Apr 20, 2026';

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-landing-bg font-sans text-landing-text antialiased">
      <LandingNav />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-600">
              Privacy Policy
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm text-landing-muted">Effective date: {EFFECTIVE_DATE}</p>
            <p className="mt-6 text-lg text-landing-muted">
              This Privacy Policy explains how JC SMARTBAG (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects,
              uses, and shares information when you use our website and application (the &quot;Service&quot;).
            </p>
          </ScrollReveal>

          <ScrollReveal delayMs={80}>
            <div className="mt-12 space-y-10 rounded-2xl border border-slate-200/90 bg-white/80 p-8 shadow-glass-light backdrop-blur-sm md:p-10">
              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">1. Information we collect</h2>
                <ul className="mt-3 list-inside list-disc space-y-2 text-landing-muted">
                  <li>
                    <span className="font-medium text-landing-text">Account information</span>: name, email, and login/authentication details.
                  </li>
                  <li>
                    <span className="font-medium text-landing-text">Trip and baggage information</span>: bag identifiers you register, trip details you provide, and status/alert preferences.
                  </li>
                  <li>
                    <span className="font-medium text-landing-text">Location/tracking signals</span>: if enabled in the Service, approximate or device-derived location signals to support real-time tracking and alerts.
                  </li>
                  <li>
                    <span className="font-medium text-landing-text">Usage and device data</span>: IP address, device/browser information, app interactions, and diagnostic logs.
                  </li>
                  <li>
                    <span className="font-medium text-landing-text">Billing information</span>: subscription status, invoices/receipts metadata, and payment-related identifiers.
                    Payment card details are processed by Stripe and are not stored by us.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">2. How we use information</h2>
                <ul className="mt-3 list-inside list-disc space-y-2 text-landing-muted">
                  <li>Provide and operate the Service, including tracking views and notifications.</li>
                  <li>Authenticate users, prevent fraud, and secure accounts.</li>
                  <li>Process subscriptions and manage billing and customer support.</li>
                  <li>Improve the Service through analytics, debugging, and feature development.</li>
                  <li>Communicate with you about updates, service notices, and support requests.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">3. How we share information</h2>
                <p className="mt-3 text-landing-muted">
                  We may share information in the following circumstances:
                </p>
                <ul className="mt-3 list-inside list-disc space-y-2 text-landing-muted">
                  <li>
                    <span className="font-medium text-landing-text">Service providers</span>: vendors who help us host, monitor, analyze, and support the Service.
                  </li>
                  <li>
                    <span className="font-medium text-landing-text">Stripe</span>: as our payment processor for subscriptions and billing management.
                  </li>
                  <li>
                    <span className="font-medium text-landing-text">Legal and safety</span>: to comply with law, enforce our terms, or protect users and the Service.
                  </li>
                  <li>
                    <span className="font-medium text-landing-text">Business transfers</span>: in connection with a merger, acquisition, or asset sale.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">4. Data retention</h2>
                <p className="mt-3 text-landing-muted">
                  We retain information for as long as needed to provide the Service, comply with legal obligations,
                  resolve disputes, and enforce agreements. Retention periods vary based on the type of information.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">5. Security</h2>
                <p className="mt-3 text-landing-muted">
                  We use reasonable administrative, technical, and organizational safeguards to protect information.
                  No system is completely secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">6. Your choices</h2>
                <ul className="mt-3 list-inside list-disc space-y-2 text-landing-muted">
                  <li>You can update certain profile details in the app.</li>
                  <li>You can request support or account-related assistance via email.</li>
                  <li>
                    If you want to request deletion of your account data, contact{' '}
                    <a className="text-cyan-700 hover:underline" href="mailto:support@jcsmartbag.com">
                      support@jcsmartbag.com
                    </a>
                    .
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">7. Contact</h2>
                <p className="mt-3 text-landing-muted">
                  Questions about privacy? Email{' '}
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
            <Link to="/terms" className="text-cyan-700 hover:underline">
              Terms
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

