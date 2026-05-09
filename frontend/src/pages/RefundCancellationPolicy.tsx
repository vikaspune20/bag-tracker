import { Link } from 'react-router-dom';
import { LandingNav } from '../components/landing/LandingNav';
import { ScrollReveal } from '../components/landing/ScrollReveal';

const EFFECTIVE_DATE = 'Apr 20, 2026';

export const RefundCancellationPolicy = () => {
  return (
    <div className="min-h-screen bg-landing-bg font-sans text-landing-text antialiased">
      <LandingNav />
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-600">
              Refunds &amp; Cancellation
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Refund &amp; Cancellation Policy
            </h1>
            <p className="mt-4 text-sm text-landing-muted">Effective date: {EFFECTIVE_DATE}</p>
            <p className="mt-6 text-lg text-landing-muted">
              This policy describes how cancellations and refunds work for JC SMARTBAG subscriptions.
              Subscriptions are billed through Stripe, our payment processor.
            </p>
          </ScrollReveal>

          <ScrollReveal delayMs={80}>
            <div className="mt-12 space-y-10 rounded-2xl border border-slate-200/90 bg-white/80 p-8 shadow-glass-light backdrop-blur-sm md:p-10">
              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">1. No refunds</h2>
                <p className="mt-3 text-landing-muted">
                  All subscription charges are non-refundable, except where required by law. We do not provide
                  refunds or credits for partially used billing periods.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">2. Cancel anytime</h2>
                <p className="mt-3 text-landing-muted">
                  You can cancel at any time to stop future renewals. In most cases, you will retain access until
                  the end of your current billing period, after which your subscription will not renew.
                </p>
                <p className="mt-3 text-landing-muted">
                  If you need help cancelling, contact{' '}
                  <a className="text-cyan-700 hover:underline" href="mailto:service@jcsmartbag.com">
                    service@jcsmartbag.com
                  </a>{' '}
                  or use our <Link to="/contact" className="text-cyan-700 hover:underline">contact form</Link>.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">3. Billing receipts and invoices (Stripe)</h2>
                <p className="mt-3 text-landing-muted">
                  Stripe may send billing receipts or invoice confirmations to the email address associated with
                  your account. If you believe a charge is incorrect, please contact us before initiating a bank
                  chargeback so we can help resolve the issue.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold text-landing-text">4. Changes to this policy</h2>
                <p className="mt-3 text-landing-muted">
                  We may update this policy from time to time. Changes are effective when posted, and we will
                  update the effective date above.
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
            <Link to="/privacy" className="text-cyan-700 hover:underline">
              Privacy
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

