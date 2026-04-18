import { MapPin, Bell, Plane } from 'lucide-react';
import { cn } from '../../lib/cn';
import { ScrollReveal } from './ScrollReveal';

const FEATURES = [
  {
    icon: MapPin,
    title: 'Real-Time Tracking',
    body: 'See exactly where your bags are at every stage of your flight.',
  },
  {
    icon: Bell,
    title: 'Secure Updates',
    body: 'Receive instant push notifications and alerts when your baggage status changes.',
  },
  {
    icon: Plane,
    title: 'Multi-Trip Support',
    body: 'Manage all your flights, trips, and associated bags in one premium dashboard.',
  },
] as const;

export function WhySection() {
  return (
    <section
      id="section-why"
      className="relative scroll-mt-24 overflow-hidden border-t border-slate-200/70 bg-landing-bg px-5 py-24 md:px-8 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.14),transparent)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-landing-text md:text-4xl">
              Why Choose JC SMARTBAG?
            </h2>
            <p className="mt-4 text-lg text-landing-muted">
              The most reliable way to monitor your luggage across airports.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <ScrollReveal key={title} delayMs={i * 80}>
              <article
                className={cn(
                  'group glass-panel-light h-full p-8 transition-all duration-500 ease-out',
                  'hover:-translate-y-2 hover:border-cyan-300/60 hover:shadow-neon-soft'
                )}
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/15 to-teal-500/10 text-cyan-600 ring-1 ring-slate-200/80 transition duration-300 group-hover:scale-105 group-hover:shadow-[0_8px_24px_rgba(34,211,238,0.2)]">
                  <Icon className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-landing-text">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-landing-muted">{body}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
