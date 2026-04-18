import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

type Mode = 'login' | 'signup';

const inputClass =
  'w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-landing-text outline-none transition focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-500/15';

export function AuthSection() {
  const [mode, setMode] = useState<Mode>('login');

  return (
    <section
      id="section-auth"
      className="relative flex min-h-0 items-center justify-center overflow-hidden bg-gradient-to-b from-landing-bg via-landing-surface to-white/40 px-5 py-24 md:px-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.1),transparent_55%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-landing-text md:text-4xl">
            Welcome
          </h2>
          <p className="mt-2 text-sm text-landing-muted">
            Secure access to your journeys — preview below, full auth on dedicated pages.
          </p>
        </div>

        <div className="glass-panel-light overflow-hidden p-1 shadow-neon-soft">
          <div className="flex rounded-xl bg-slate-100/80 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-semibold transition duration-300',
                mode === 'login'
                  ? 'bg-gradient-to-r from-neon-blue/90 to-neon-teal/90 text-white shadow-md'
                  : 'text-landing-muted hover:text-landing-text'
              )}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={cn(
                'flex-1 rounded-lg py-2.5 text-sm font-semibold transition duration-300',
                mode === 'signup'
                  ? 'bg-gradient-to-r from-neon-blue/90 to-neon-teal/90 text-white shadow-md'
                  : 'text-landing-muted hover:text-landing-text'
              )}
            >
              Sign Up
            </button>
          </div>

          <div className="relative min-h-[320px] p-6 md:p-8">
            <div
              className={cn(
                'transition-all duration-500 ease-in-out',
                mode === 'login'
                  ? 'translate-x-0 opacity-100'
                  : 'pointer-events-none absolute inset-6 -translate-x-6 opacity-0 md:inset-8'
              )}
            >
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label htmlFor="auth-email" className="mb-1.5 block text-xs text-landing-muted">
                    Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    className={inputClass}
                    placeholder="you@airline.com"
                  />
                </div>
                <div>
                  <label htmlFor="auth-password" className="mb-1.5 block text-xs text-landing-muted">
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    autoComplete="current-password"
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>
                <Link
                  to="/login"
                  className="btn-ripple block w-full rounded-full bg-gradient-to-r from-neon-blue to-neon-teal py-3 text-center text-sm font-semibold text-white shadow-neon-soft transition hover:brightness-110"
                >
                  Continue to Log In
                </Link>
              </form>
            </div>

            <div
              className={cn(
                'transition-all duration-500 ease-in-out',
                mode === 'signup'
                  ? 'translate-x-0 opacity-100'
                  : 'pointer-events-none absolute inset-6 translate-x-6 opacity-0 md:inset-8'
              )}
            >
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label htmlFor="su-name" className="mb-1.5 block text-xs text-landing-muted">
                    Full name
                  </label>
                  <input
                    id="su-name"
                    className={inputClass}
                    placeholder="Alex Traveler"
                  />
                </div>
                <div>
                  <label htmlFor="su-email" className="mb-1.5 block text-xs text-landing-muted">
                    Email
                  </label>
                  <input id="su-email" type="email" className={inputClass} placeholder="you@airline.com" />
                </div>
                <div>
                  <label htmlFor="su-pass" className="mb-1.5 block text-xs text-landing-muted">
                    Password
                  </label>
                  <input
                    id="su-pass"
                    type="password"
                    className={inputClass}
                    placeholder="Create a strong password"
                  />
                </div>
                <Link
                  to="/register"
                  className="btn-ripple block w-full rounded-full bg-gradient-to-r from-neon-teal to-neon-blue py-3 text-center text-sm font-semibold text-white shadow-neon-soft transition hover:brightness-110"
                >
                  Continue to Sign Up
                </Link>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
