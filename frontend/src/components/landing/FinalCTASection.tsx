import { Link } from 'react-router-dom';

const BG =
  'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=2400&q=80';

export function FinalCTASection() {
  return (
    <section
      id="section-final"
      className="relative flex min-h-[72vh] flex-col items-center justify-center overflow-hidden px-5 py-24 text-center md:min-h-[80vh] md:px-8"
    >
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center transition-transform duration-[20s] ease-out"
        style={{ backgroundImage: `url(${BG})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/92 to-white/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/40 to-white/90" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_75%,rgba(45,212,191,0.14),transparent_55%)]" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.25em] text-cyan-600">
          JC SMARTBAG
        </p>
        <h2 className="font-display text-4xl font-bold tracking-tight text-landing-text md:text-5xl">
          Never Lose Track Again
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-landing-muted">
          From check-in to carousel, your bags stay in view — calm, clear, and always in motion with
          you.
        </p>
        <Link
          to="/register"
          className="btn-ripple mt-10 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-neon-blue to-neon-teal px-10 py-4 text-base font-semibold text-white shadow-neon-soft transition hover:brightness-110"
        >
          Start Tracking Now
        </Link>
      </div>
    </section>
  );
}
