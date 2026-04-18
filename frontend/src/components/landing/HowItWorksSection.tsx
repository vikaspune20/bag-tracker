import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

const STEPS = [
  { num: '01', title: 'Register Your Bag', body: 'Link your luggage to your trip in seconds.' },
  { num: '02', title: 'Start Your Journey', body: 'We sync with checkpoints from check-in to carousel.' },
  { num: '03', title: 'Track in Real-Time', body: 'Live map view and ETA updates as your bag moves.' },
  { num: '04', title: 'Get Alerts', body: 'Push, SMS, or email — never miss a status change.' },
  { num: '05', title: 'Arrive Stress-Free', body: 'Know before you land that your bags are with you.' },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="section-how"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-landing-bg via-white/40 to-landing-surface px-5 py-24 md:px-8 md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(34,211,238,0.1),transparent)]" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <ScrollReveal>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-600">
              Workflow
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-landing-text md:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-landing-muted">
              Five calm steps from registration to arrival — built for clarity at every gate.
            </p>
          </div>
        </ScrollReveal>

        <ol className="relative mt-16 space-y-0 md:mt-20">
          <div
            className="absolute left-[1.4rem] top-3 bottom-3 w-px bg-gradient-to-b from-cyan-400/50 via-teal-400/40 to-transparent md:left-[1.5rem]"
            aria-hidden
          />
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.num} delayMs={i * 70}>
              <li className="group relative flex gap-6 pb-12 last:pb-0">
                <div className="relative z-10 flex shrink-0 justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/90 bg-white font-mono text-sm font-medium text-cyan-600 shadow-sm ring-4 ring-landing-bg">
                    {step.num}
                  </span>
                </div>
                <div className="min-w-0 pt-1">
                  <h3 className="font-display text-xl font-semibold text-landing-text transition-transform duration-300 group-hover:translate-x-1 md:text-2xl">
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {step.title}
                      <ArrowRight
                        className="h-5 w-5 shrink-0 text-teal-500 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                        aria-hidden
                      />
                    </span>
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-landing-muted md:text-base">
                    {step.body}
                  </p>
                </div>
              </li>
            </ScrollReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
