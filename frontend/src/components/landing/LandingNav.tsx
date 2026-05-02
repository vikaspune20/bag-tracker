import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Logo } from '../Logo';

type Props = {
  className?: string;
};

const navLinkClass =
  'text-sm font-medium text-landing-muted transition-colors hover:text-landing-text';

type NavItem =
  | { type: 'section'; hash: string; label: string }
  | { type: 'link'; to: string; label: string };

const navItems: NavItem[] = [
  { type: 'section', hash: 'section-why', label: 'Why Us' },
  { type: 'section', hash: 'section-tracking', label: 'Live Track' },
  { type: 'link', to: '/about', label: 'About Us' },
  { type: 'link', to: '/contact', label: 'Contact Us' },
];

const HOME_PATH = '/home';

export function LandingNav({ className }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled || open
          ? 'border-b border-slate-200/90 bg-white/90 shadow-sm backdrop-blur-xl'
          : 'border-b border-transparent bg-white/65 backdrop-blur-md',
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link
          to={HOME_PATH}
          className="flex items-center gap-3 text-left transition-opacity hover:opacity-90"
          onClick={() => setOpen(false)}
        >
          <Logo size="sm" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
          {navItems.map((item) =>
            item.type === 'section' ? (
              <Link key={item.hash} to={`${HOME_PATH}#${item.hash}`} className={navLinkClass}>
                {item.label}
              </Link>
            ) : (
              <Link key={item.to} to={item.to} className={navLinkClass}>
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex lg:gap-3">
          <Link
            to="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-landing-muted transition-colors hover:text-landing-text"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="btn-ripple rounded-full bg-gradient-to-r from-neon-blue/90 to-neon-teal/90 px-5 py-2.5 text-sm font-semibold text-white shadow-neon-soft transition hover:brightness-110"
          >
            Sign Up
          </Link>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-landing-text shadow-sm lg:hidden"
          aria-expanded={open}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200/90 bg-white/98 px-5 py-6 shadow-lg lg:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) =>
              item.type === 'section' ? (
                <Link
                  key={item.hash}
                  to={`${HOME_PATH}#${item.hash}`}
                  className="rounded-lg px-3 py-3 text-base font-medium text-landing-text hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg px-3 py-3 text-base font-medium text-landing-text hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              )
            )}
            <div className="mt-4 flex flex-col gap-2 border-t border-slate-200 pt-4">
              <Link
                to="/login"
                className="rounded-lg px-3 py-3 text-center text-landing-muted hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-gradient-to-r from-neon-blue/90 to-neon-teal/90 py-3 text-center text-sm font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
