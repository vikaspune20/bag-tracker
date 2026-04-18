import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/cn';
import { ScrollReveal } from './ScrollReveal';

type BagRow = {
  id: string;
  name: string;
  trip: string;
  status: 'In transit' | 'At airport' | 'Delivered' | 'Delayed';
  updated: string;
};

const MOCK: BagRow[] = [
  {
    id: '1',
    name: 'Rimowa Cabin',
    trip: 'JFK → LHR',
    status: 'In transit',
    updated: '2 min ago',
  },
  {
    id: '2',
    name: 'Away Carry-On',
    trip: 'SFO → NRT',
    status: 'At airport',
    updated: '18 min ago',
  },
  {
    id: '3',
    name: 'Tumi Checked',
    trip: 'ORD → CDG',
    status: 'Delivered',
    updated: 'Yesterday',
  },
  {
    id: '4',
    name: 'Briggs Backpack',
    trip: 'SEA → DXB',
    status: 'Delayed',
    updated: '1 hr ago',
  },
];

function statusStyle(s: BagRow['status']) {
  switch (s) {
    case 'Delivered':
      return 'bg-teal-500/12 text-teal-700 ring-teal-500/25';
    case 'In transit':
      return 'bg-cyan-500/12 text-cyan-700 ring-cyan-500/25';
    case 'At airport':
      return 'bg-amber-500/12 text-amber-800 ring-amber-500/25';
    default:
      return 'bg-rose-500/12 text-rose-700 ring-rose-500/25';
  }
}

export function DashboardPreviewSection() {
  const [q, setQ] = useState('');
  const [tripFilter, setTripFilter] = useState<string>('all');

  const trips = useMemo(() => {
    const set = new Set(MOCK.map((b) => b.trip));
    return ['all', ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    return MOCK.filter((b) => {
      const matchQ =
        !q.trim() ||
        b.name.toLowerCase().includes(q.toLowerCase()) ||
        b.trip.toLowerCase().includes(q.toLowerCase());
      const matchT = tripFilter === 'all' || b.trip === tripFilter;
      return matchQ && matchT;
    });
  }, [q, tripFilter]);

  return (
    <section
      id="section-dashboard"
      className="relative scroll-mt-24 overflow-hidden bg-white px-5 py-24 md:px-8 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(45,212,191,0.08),transparent_50%)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <ScrollReveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-landing-text md:text-4xl">
                Your Dashboard
              </h2>
              <p className="mt-2 text-landing-muted">
                Search, filter, and scan status at a glance — same layout as the live app.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
              <div className="relative flex-1 sm:min-w-[220px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-landing-muted" />
                <input
                  type="search"
                  placeholder="Search bags or trips..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full rounded-full border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-sm text-landing-text shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15"
                />
              </div>
              <select
                value={tripFilter}
                onChange={(e) => setTripFilter(e.target.value)}
                className="rounded-full border border-slate-200/90 bg-white px-4 py-2.5 text-sm text-landing-text shadow-sm outline-none focus:border-teal-400/60 focus:ring-2 focus:ring-teal-500/15"
              >
                {trips.map((t) => (
                  <option key={t} value={t} className="bg-white">
                    {t === 'all' ? 'All trips' : t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </ScrollReveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {filtered.map((b) => (
            <article
              key={b.id}
              className="group glass-panel-light border-slate-200/80 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/50 hover:shadow-neon-soft"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-landing-text">{b.name}</h3>
                  <p className="mt-1 text-sm text-landing-muted">{b.trip}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1 text-xs font-medium ring-1',
                    statusStyle(b.status)
                  )}
                >
                  {b.status}
                </span>
              </div>
              <p className="mt-6 text-xs uppercase tracking-wider text-landing-muted">
                Last updated · <span className="text-landing-text">{b.updated}</span>
              </p>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-8 text-center text-sm text-landing-muted">No bags match your filters.</p>
        )}
      </div>
    </section>
  );
}
