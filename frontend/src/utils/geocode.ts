// Reverse-geocode via OpenStreetMap Nominatim (free, no API key).
// Respects 1 req/sec rate limit through a serialized queue.
// Cached in sessionStorage keyed by rounded coords (~11m precision).

type Resolved = { label: string };

const memCache = new Map<string, Resolved>();
const inflight = new Map<string, Promise<Resolved>>();
let lastCallAt = 0;

const keyOf = (lat: number, lon: number) =>
  `geo:${lat.toFixed(4)},${lon.toFixed(4)}`;

const readSession = (key: string): Resolved | null => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeSession = (key: string, value: Resolved) => {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
};

const formatAddress = (addr: any): string => {
  if (!addr) return '';
  const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb;
  const region = addr.state || addr.state_district || addr.county;
  const country = addr.country;
  return [addr.neighbourhood, city, region, country].filter(Boolean).join(', ');
};

export async function reverseGeocode(lat: number, lon: number): Promise<Resolved> {
  const key = keyOf(lat, lon);
  const mem = memCache.get(key);
  if (mem) return mem;
  const ses = readSession(key);
  if (ses) { memCache.set(key, ses); return ses; }
  const pending = inflight.get(key);
  if (pending) return pending;

  const work = (async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastCallAt));
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCallAt = Date.now();
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14&addressdetails=1`;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = await res.json();
      const label = formatAddress(json.address) || json.display_name || '';
      const value: Resolved = { label };
      memCache.set(key, value);
      writeSession(key, value);
      return value;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, work);
  return work;
}
