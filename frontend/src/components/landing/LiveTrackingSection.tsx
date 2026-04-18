import { Link } from 'react-router-dom';
import { Clock, MapPin, Navigation, Package, Plane, ScanLine } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useTrackingSimulation } from '../../hooks/useTrackingSimulation';
import { ScrollReveal } from './ScrollReveal';

const STEPS = [
  { label: 'Check-in', meta: 'Bag registered & tagged' },
  { label: 'In Transit', meta: 'Loaded & in flight' },
  { label: 'On Belt', meta: 'Arrived at carousel' },
  { label: 'Delivered', meta: 'Picked up by traveler' },
] as const;

const MAP_BG =
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2000&q=60';

export function LiveTrackingSection() {
  const { phase, phaseLabel, etaMinutes } = useTrackingSimulation(3800);
  const progressPct = (phase / (STEPS.length - 1)) * 100;

  return (
    <section
      id="section-tracking"
      className="relative scroll-mt-24 overflow-hidden bg-landing-surface px-5 py-24 md:px-8 md:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `url(${MAP_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(34,211,238,0.12),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-landing-surface via-landing-surface/95 to-landing-bg" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <ScrollReveal>
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-600">
                Live preview
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-landing-text md:text-4xl">
                Delivery-style tracking journey
              </h2>
              <p className="mt-2 max-w-xl text-landing-muted">
                The same clarity you expect from parcel delivery — redesigned for baggage, with a
                beautiful, real-time timeline UI.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-landing-muted">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm">
                <Navigation className="h-4 w-4 text-teal-600" />
                Status: <span className="font-medium text-landing-text">{phaseLabel}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm">
                <Clock className="h-4 w-4 text-cyan-600" />
                ETA ~{etaMinutes} min
              </span>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delayMs={100}>
          <div className="glass-panel-light relative overflow-hidden p-4 shadow-neon-soft md:p-8">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.06)_1px,transparent_1px)] bg-[size:48px_48px] opacity-80" />

            <div className="relative">
              <div className="relative z-10 grid gap-4 md:grid-cols-12 md:items-center md:gap-6">
                <div className="md:col-span-5">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/90 bg-white text-cyan-700 shadow-sm">
                      <Package className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-600">
                        Shipment
                      </p>
                      <p className="mt-1 truncate text-lg font-semibold text-landing-text">
                        JC SMARTBAG · TRK-9F2A-18D
                      </p>
                      <p className="mt-1 text-sm text-landing-muted">
                        SEA → DXB · Owner: Raj
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-3 py-1.5 text-xs text-landing-muted shadow-sm backdrop-blur-sm">
                      <ScanLine className="h-4 w-4 text-teal-600" />
                      Latest scan: <span className="font-medium text-landing-text">{phaseLabel}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-3 py-1.5 text-xs text-landing-muted shadow-sm backdrop-blur-sm">
                      <Plane className="h-4 w-4 text-cyan-600" />
                      ETA ~<span className="font-medium text-landing-text">{etaMinutes} min</span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      <span>Origin</span>
                      <span>Destination</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm font-semibold text-landing-text">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-teal-500" />
                        Seattle (SEA)
                      </span>
                      <span className="inline-flex items-center gap-2">
                        Dubai (DXB)
                        <span className="h-2 w-2 rounded-full bg-cyan-500" />
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="relative h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-teal transition-[width] duration-700"
                          style={{ width: `${progressPct}%` }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 transition-[left] duration-700"
                          style={{ left: `calc(${progressPct}% - 10px)` }}
                          aria-hidden
                        >
                          <span className="block h-5 w-5 rounded-full bg-white shadow-sm ring-2 ring-cyan-400/60" />
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-landing-muted">
                        <span>Registered</span>
                        <span>In motion</span>
                        <span>Carousel</span>
                        <span>Delivered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-8 grid gap-6 lg:grid-cols-12 lg:items-start">
                <div className="lg:col-span-7">
                  <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm md:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-landing-text">Tracking updates</p>
                      <span className="inline-flex items-center gap-2 text-xs text-landing-muted">
                        <MapPin className="h-3.5 w-3.5 text-teal-600" aria-hidden />
                        Dubai hub (simulated)
                      </span>
                    </div>

                    <ol className="relative mt-6 space-y-4">
                      <div
                        className="absolute left-[0.75rem] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-400/55 via-teal-400/40 to-transparent"
                        aria-hidden
                      />

                      {STEPS.map((s, i) => {
                        const state =
                          i < phase ? 'done' : i === phase ? 'active' : 'next';
                        return (
                          <li key={s.label} className="relative flex gap-4">
                            <div className="relative z-10 mt-0.5">
                              <span
                                className={cn(
                                  'flex h-6 w-6 items-center justify-center rounded-full border shadow-sm',
                                  state === 'done' &&
                                    'border-teal-400/60 bg-teal-500/15 text-teal-700',
                                  state === 'active' &&
                                    'border-cyan-400/70 bg-cyan-500/15 text-cyan-700 ring-4 ring-cyan-500/10',
                                  state === 'next' &&
                                    'border-slate-200/90 bg-white text-slate-400'
                                )}
                                aria-hidden
                              >
                                <span
                                  className={cn(
                                    'h-2 w-2 rounded-full',
                                    state === 'done' && 'bg-teal-500',
                                    state === 'active' && 'bg-cyan-500 animate-pulse',
                                    state === 'next' && 'bg-slate-300'
                                  )}
                                />
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className="text-sm font-semibold text-landing-text">{s.label}</p>
                                <p className="text-xs text-landing-muted">
                                  {i < phase
                                    ? 'Just now'
                                    : i === phase
                                      ? 'Live'
                                      : 'Pending'}
                                </p>
                              </div>
                              <p className="mt-1 text-sm text-landing-muted">{s.meta}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm md:p-6">
                    <p className="text-sm font-semibold text-landing-text">Graphical route</p>
                    <p className="mt-1 text-sm text-landing-muted">
                      Clean, parcel-style visual — ready to swap with real geo routes later.
                    </p>

                    <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-xl border border-slate-200/80 bg-white">
                      <div
                        className="absolute inset-0 opacity-[0.12]"
                        style={{
                          backgroundImage: `url(${MAP_BG})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                        aria-hidden
                      />
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(34,211,238,0.16),transparent_55%)]" />

                      <svg
                        className="relative z-10 h-full w-full"
                        viewBox="0 0 520 320"
                        preserveAspectRatio="none"
                        aria-hidden
                      >
                        <defs>
                          <linearGradient id="routeGlowMini" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.45" />
                            <stop offset="55%" stopColor="#2dd4bf" stopOpacity="1" />
                            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.45" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 40 240 C 140 120, 240 260, 330 150 S 450 130, 480 90"
                          fill="none"
                          stroke="#cbd5e1"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 40 240 C 140 120, 240 260, 330 150 S 450 130, 480 90"
                          fill="none"
                          stroke="url(#routeGlowMini)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray="520"
                          strokeDashoffset="200"
                          className="animate-path-dash"
                        />

                        <circle cx="40" cy="240" r="7" fill="#2dd4bf" opacity="0.9" />
                        <circle cx="480" cy="90" r="7" fill="#22d3ee" opacity="0.9" />

                        <circle
                          cx={40 + (progressPct / 100) * 440}
                          cy={240 - (progressPct / 100) * 150}
                          r="12"
                          fill="#22d3ee"
                          opacity="0.25"
                        />
                        <circle
                          cx={40 + (progressPct / 100) * 440}
                          cy={240 - (progressPct / 100) * 150}
                          r="6"
                          fill="#0ea5e9"
                        />
                      </svg>

                      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between rounded-full border border-slate-200/90 bg-white/90 px-3 py-2 text-xs text-landing-muted shadow-sm backdrop-blur-md">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-teal-500" />
                          SEA
                        </span>
                        <span className="inline-flex items-center gap-2">
                          DXB
                          <span className="h-2 w-2 rounded-full bg-cyan-500" />
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-start">
                      <Link
                        to="/tracking"
                        className="btn-ripple inline-flex items-center justify-center rounded-full border border-cyan-300/80 bg-white px-6 py-2.5 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-teal-400 hover:bg-cyan-50/80 hover:shadow-neon-soft"
                      >
                        View Live Tracking
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
