import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, RefreshCw, Clock } from 'lucide-react';

// Fix Leaflet default marker icons broken by Vite bundler
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pulsingIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;
    background:#2563eb;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 0 0 4px rgba(37,99,235,0.3);
    animation:gps-pulse 1.5s ease-in-out infinite;
  "></div>
  <style>
    @keyframes gps-pulse {
      0%,100%{box-shadow:0 0 0 4px rgba(37,99,235,0.3);}
      50%{box-shadow:0 0 0 10px rgba(37,99,235,0.0);}
    }
  </style>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Auto-pan to latest position
function AutoPan({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  const prevPos = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (pos && (!prevPos.current || prevPos.current[0] !== pos[0] || prevPos.current[1] !== pos[1])) {
      map.setView(pos, map.getZoom() < 13 ? 15 : map.getZoom());
      prevPos.current = pos;
    }
  }, [pos, map]);
  return null;
}

interface GpsPoint { lat: number; lng: number; timestamp: string; accuracy: number | null }

interface Props {
  bagId: string;
  deviceId?: string; // JC-DEV-... tag if known
  refreshInterval?: number; // ms, default 30000
}

export function LiveGpsMap({ bagId, deviceId, refreshInterval = 30_000 }: Props) {
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPoints = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`/api/tracking/${bagId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const gpsEvents: GpsPoint[] = (data.events ?? [])
        .filter((e: any) => e.latitude != null && e.longitude != null)
        .map((e: any) => ({
          lat: parseFloat(e.latitude),
          lng: parseFloat(e.longitude),
          timestamp: e.timestamp,
          accuracy: e.accuracy ?? null,
        }));
      setPoints(gpsEvents);
      setLastRefresh(new Date());
    } catch { /* ignore */ } finally {
      setRefreshing(false);
    }
  }, [bagId]);

  useEffect(() => {
    fetchPoints();
    timerRef.current = setInterval(() => fetchPoints(true), refreshInterval);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchPoints, refreshInterval]);

  if (points.length === 0) return null;

  const latest = points[points.length - 1];
  const latLngs = points.map(p => [p.lat, p.lng] as [number, number]);
  const latestPos: [number, number] = [latest.lat, latest.lng];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-bold text-gray-900">Live GPS Location</span>
          {deviceId && (
            <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              {deviceId}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={11} />
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchPoints()}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ height: 340 }}>
        <MapContainer
          center={latestPos}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <AutoPan pos={latestPos} />

          {/* Path polyline */}
          {latLngs.length > 1 && (
            <Polyline
              positions={latLngs}
              pathOptions={{ color: '#2563eb', weight: 3, opacity: 0.6, dashArray: '6 4' }}
            />
          )}

          {/* All past points (small dots) */}
          {points.slice(0, -1).map((p, i) => (
            <Marker
              key={i}
              position={[p.lat, p.lng]}
              icon={L.divIcon({
                className: '',
                html: '<div style="width:8px;height:8px;background:#93c5fd;border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.2)"></div>',
                iconSize: [8, 8],
                iconAnchor: [4, 4],
              })}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold">{new Date(p.timestamp).toLocaleString()}</p>
                  {p.accuracy && <p className="text-gray-500">±{Math.round(p.accuracy)}m accuracy</p>}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Latest position (pulsing) */}
          <Marker position={latestPos} icon={pulsingIcon}>
            <Popup>
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-blue-600">Current Position</p>
                <p>{latest.lat.toFixed(6)}°, {latest.lng.toFixed(6)}°</p>
                {latest.accuracy && <p className="text-gray-500">±{Math.round(latest.accuracy)}m accuracy</p>}
                <p className="text-gray-400">{new Date(latest.timestamp).toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Footer stats */}
      <div className="px-5 py-3 bg-gray-50 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <Navigation size={11} className="text-blue-500" />
          {latest.lat.toFixed(5)}°, {latest.lng.toFixed(5)}°
          {latest.accuracy && <span className="ml-1 text-gray-400">±{Math.round(latest.accuracy)}m</span>}
        </span>
        <span>{points.length} ping{points.length !== 1 ? 's' : ''} · updates every {refreshInterval / 1000}s</span>
      </div>
    </div>
  );
}
