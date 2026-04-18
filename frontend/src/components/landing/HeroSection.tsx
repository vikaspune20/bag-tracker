import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

const HERO_VIDEO =
  'https://videos.pexels.com/video-files/3044128/3044128-hd_1920_1080_25fps.mp4';

const HERO_BG_IMAGE =
  'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=2400&q=88';

const HERO_POSTER =
  'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1920&q=85';

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const parallaxY = scrollY * 0.18;
  const scale = 1.05 + Math.min(scrollY / 1600, 0.04);

  return (
    <section className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden pt-28 pb-20 md:pt-32 md:pb-24">
      <div className="absolute inset-0">
        <div
          className="absolute inset-[-8%] will-change-transform"
          style={{ transform: `translate3d(0, ${parallaxY}px, 0) scale(${scale})` }}
        >
          <img
            src={HERO_BG_IMAGE}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <video
            className={cn(
              'absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-[1.4s] ease-out',
              videoReady && 'opacity-[0.26] md:opacity-[0.2]'
            )}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={HERO_POSTER}
            onCanPlay={() => setVideoReady(true)}
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        </div>

        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(248,250,252,0.98)_0%,rgba(248,250,252,0.9)_26%,rgba(255,255,255,0.52)_48%,rgba(255,255,255,0.12)_64%,transparent_78%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-landing-bg via-transparent to-transparent"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-hero-mesh-light opacity-[0.22]" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_75%_40%,rgba(34,211,238,0.11),transparent_60%)]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 md:px-10 lg:px-12">
        <div className="max-w-2xl animate-fade-up lg:max-w-[36rem] motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-cyan-500 to-teal-400" aria-hidden />
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Smart baggage intelligence
            </p>
          </div>

          <h1 className="mt-8 text-balance font-display text-[1.875rem] font-bold leading-[1.05] tracking-[-0.02em] text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl xl:text-[3.25rem]">
            Track your baggage journey
            <span className="mt-3 block bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-600 bg-clip-text font-bold text-transparent">
              in real time
            </span>
          </h1>

          <p className="mt-7 max-w-lg text-base leading-[1.65] text-slate-600 sm:text-lg">
            Never lose sight of your luggage again. Monitor every handoff from check-in to carousel
            with a premium, delivery-grade timeline built for modern travel.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <Link
              to="/register"
              className="btn-ripple inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-8 text-[0.9375rem] font-semibold text-white shadow-[0_18px_40px_-12px_rgba(15,23,42,0.45)] transition hover:bg-slate-800"
            >
              Get started free
            </Link>
            <Link
              to="/login"
              className="btn-ripple inline-flex h-12 items-center justify-center rounded-xl border border-slate-300/90 bg-white/90 px-8 text-[0.9375rem] font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-white"
            >
              Track baggage
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
