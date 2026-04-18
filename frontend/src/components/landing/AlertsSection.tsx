import { useState } from 'react';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/cn';

const SAMPLES = [
  {
    title: 'Your bag has been loaded onto flight',
    meta: 'Flight AA 184 · Departure gate updated',
    icon: '✈️',
  },
  {
    title: 'Bag arrived at destination',
    meta: 'Carousel B · Ready for pickup',
    icon: '🟢',
  },
] as const;

function ToggleRow({
  label,
  icon: Icon,
  enabled,
  onChange,
}: {
  label: string;
  icon: typeof Bell;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm">
      <span className="flex items-center gap-3 text-sm text-landing-text">
        <Icon className="h-4 w-4 text-teal-600" />
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300',
          enabled ? 'bg-gradient-to-r from-neon-blue to-neon-teal' : 'bg-slate-200'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300',
            enabled ? 'left-6' : 'left-0.5'
          )}
        />
      </button>
    </div>
  );
}

export function AlertsSection() {
  const [push, setPush] = useState(true);
  const [sms, setSms] = useState(false);
  const [email, setEmail] = useState(true);

  return (
    <section
      id="section-alerts"
      className="relative flex min-h-0 items-center justify-center overflow-hidden bg-gradient-to-b from-landing-surface via-white/60 to-landing-bg px-5 py-24 md:px-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(34,211,238,0.12),transparent_45%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-landing-text md:text-4xl">
            Alerts & Notifications
          </h2>
          <p className="mt-4 text-lg text-landing-muted">
            Stay informed at every handoff. Tune channels to match how you travel.
          </p>

          <div className="mt-10 space-y-3">
            <ToggleRow label="Push Notifications" icon={Bell} enabled={push} onChange={setPush} />
            <ToggleRow label="SMS Alerts" icon={MessageSquare} enabled={sms} onChange={setSms} />
            <ToggleRow label="Email Alerts" icon={Mail} enabled={email} onChange={setEmail} />
          </div>
        </div>

        <div className="relative space-y-5">
          <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-gradient-to-br from-cyan-400/10 via-transparent to-teal-400/10 blur-3xl" />
          {SAMPLES.map((n) => (
            <article
              key={n.title}
              className={cn(
                'relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-glass-light backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300/50 hover:shadow-neon-soft',
                'before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-r before:to-transparent',
                n.title.includes('loaded')
                  ? 'before:from-cyan-400/12'
                  : 'before:from-teal-400/12'
              )}
            >
              <div className="relative flex items-start gap-4">
                <span className="text-2xl" aria-hidden>
                  {n.icon}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-landing-text">{n.title}</h3>
                  <p className="mt-1 text-sm text-landing-muted">{n.meta}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
