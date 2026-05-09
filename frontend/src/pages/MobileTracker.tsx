import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Smartphone, Wifi, WifiOff, CheckCircle2, AlertCircle, Loader2, Play, Square, Navigation } from 'lucide-react';
import axios from 'axios';
import { Logo } from '../components/Logo';

// Use Vite proxy (/api) so that both desktop (HTTP) and mobile (HTTPS on LAN)
// go through the same Vite dev server — avoids mixed-content blocking entirely.
const API_BASE = '/api';
const PING_INTERVAL_MS = 30_000; // every 30 seconds

type GpsState = 'idle' | 'requesting' | 'active' | 'error' | 'unsupported';

interface PingStatus {
  lat: number;
  lng: number;
  accuracy: number;
  lastPingedAt: Date;
  pingsTotal: number;
  pingsOk: number;
}

export const MobileTracker = () => {
  const [searchParams] = useSearchParams();
  const [deviceId, setDeviceId] = useState(searchParams.get('deviceId') ?? '');
  const [inputDeviceId, setInputDeviceId] = useState(searchParams.get('deviceId') ?? '');
  const [gpsState, setGpsState] = useState<GpsState>('idle');
  const [statusLabel, setStatusLabel] = useState('In Transit');
  const [pingStatus, setPingStatus] = useState<PingStatus | null>(null);
  const [error, setError] = useState('');
  const [serverMsg, setServerMsg] = useState('');

  const watchIdRef  = useRef<number | null>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const positionRef = useRef<GeolocationPosition | null>(null);

  // Check geolocation support + HTTPS requirement
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsState('unsupported');
    } else if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      setGpsState('unsupported');
      setError('HTTPS required: Geolocation is blocked on HTTP. Open this page via https:// (accept the self-signed certificate warning on first visit).');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopTracking();
  }, []);

  const sendPing = async (pos: GeolocationPosition) => {
    try {
      const { latitude, longitude, accuracy } = pos.coords;
      await axios.post(`${API_BASE}/tracking/mobile-ping`, {
        deviceId,
        latitude,
        longitude,
        accuracy,
        status: statusLabel,
      });
      setPingStatus(prev => ({
        lat: latitude,
        lng: longitude,
        accuracy,
        lastPingedAt: new Date(),
        pingsTotal: (prev?.pingsTotal ?? 0) + 1,
        pingsOk:    (prev?.pingsOk    ?? 0) + 1,
      }));
      setServerMsg('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Ping failed';
      setServerMsg(msg);
      setPingStatus(prev => prev ? {
        ...prev,
        pingsTotal: (prev.pingsTotal ?? 0) + 1,
      } : null);
    }
  };

  const startTracking = () => {
    if (!deviceId.trim()) { setError('Enter a device ID first.'); return; }
    setError('');
    setServerMsg('');
    setGpsState('requesting');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        positionRef.current = pos;
        setGpsState('active');  // safe to call every update — React batches no-op setState
      },
      (err) => {
        setGpsState('error');
        setError(
          err.code === 1 ? 'Location permission denied. Tap the lock/info icon in your browser address bar and allow Location, then try again.' :
          err.code === 2 ? 'Location unavailable. Check GPS signal.' :
          'Location request timed out.'
        );
        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );

    // Send first ping immediately once we have a position, then every 30s
    const waitAndStart = () => {
      if (positionRef.current) {
        setGpsState('active');
        sendPing(positionRef.current);
        timerRef.current = setInterval(() => {
          if (positionRef.current) sendPing(positionRef.current);
        }, PING_INTERVAL_MS);
      } else {
        setTimeout(waitAndStart, 500);
      }
    };
    waitAndStart();
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    positionRef.current = null;
    setGpsState('idle');
  };

  const isTracking = gpsState === 'active' || gpsState === 'requesting';

  return (
    <div className="min-h-screen bg-gradient-to-br from-airline-dark to-airline-blue flex flex-col">
      {/* Top bar */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <Logo size="sm" />
        <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
          gpsState === 'active'     ? 'bg-emerald-400 text-white' :
          gpsState === 'requesting' ? 'bg-amber-400 text-white' :
          gpsState === 'error'      ? 'bg-red-400 text-white' :
                                      'bg-white/20 text-white'
        }`}>
          {gpsState === 'active'     ? <><Wifi size={12} /> Live</> :
           gpsState === 'requesting' ? <><Loader2 size={12} className="animate-spin" /> Acquiring…</> :
           gpsState === 'error'      ? <><WifiOff size={12} /> Error</> :
                                       <><WifiOff size={12} /> Offline</>}
        </div>
      </div>

      {/* Main card */}
      <div className="flex-1 flex flex-col px-4 pb-8 gap-4">

        {/* Device ID input */}
        {!isTracking && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
            <label className="text-white/70 text-xs font-semibold uppercase tracking-wider block mb-2">
              Device ID
            </label>
            <div className="flex gap-2">
              <input
                value={inputDeviceId}
                onChange={e => setInputDeviceId(e.target.value.toUpperCase())}
                placeholder="JC-DEV-XXXXXXXX"
                className="flex-1 bg-white/20 text-white placeholder-white/40 font-mono text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                onClick={() => { setDeviceId(inputDeviceId.trim()); setError(''); }}
                className="bg-white/20 text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-white/30"
              >
                Set
              </button>
            </div>
            {deviceId && (
              <p className="text-emerald-300 text-xs mt-2 flex items-center gap-1">
                <CheckCircle2 size={12} /> Using: {deviceId}
              </p>
            )}
          </div>
        )}

        {/* Status label picker */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
          <label className="text-white/70 text-xs font-semibold uppercase tracking-wider block mb-2">
            Current Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['Checked-in', 'In Transit', 'Loaded on Aircraft', 'Arrived'].map(s => (
              <button
                key={s}
                onClick={() => setStatusLabel(s)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                  statusLabel === s
                    ? 'bg-white text-airline-dark shadow-md'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* GPS position card (shown when active) */}
        {pingStatus && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold">
              <Navigation size={18} className="text-emerald-300" />
              Last Known Position
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1">Latitude</p>
                <p className="text-white font-mono font-bold">{pingStatus.lat.toFixed(6)}°</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1">Longitude</p>
                <p className="text-white font-mono font-bold">{pingStatus.lng.toFixed(6)}°</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1">Accuracy</p>
                <p className="text-white font-bold">±{Math.round(pingStatus.accuracy)}m</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1">Last Ping</p>
                <p className="text-white font-bold text-sm">
                  {pingStatus.lastPingedAt.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-white/60 pt-1">
              <span>Pings sent: <strong className="text-white">{pingStatus.pingsTotal}</strong></span>
              <span>Successful: <strong className="text-emerald-300">{pingStatus.pingsOk}</strong></span>
              <span>Next in ~{PING_INTERVAL_MS / 1000}s</span>
            </div>
          </div>
        )}

        {/* Error / server messages */}
        {(error || serverMsg) && (
          <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-red-200">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {error || serverMsg}
          </div>
        )}

        {/* CTA button */}
        {gpsState === 'unsupported' ? (
          <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-4 text-center text-red-200 text-sm">
            <WifiOff size={24} className="mx-auto mb-2" />
            GPS not supported in this browser. Try Chrome on Android.
          </div>
        ) : (
          <button
            onClick={isTracking ? stopTracking : startTracking}
            disabled={gpsState === 'requesting'}
            className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all shadow-xl ${
              isTracking
                ? 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
                : 'bg-white text-airline-dark hover:bg-blue-50 active:scale-95'
            } disabled:opacity-60`}
          >
            {gpsState === 'requesting' ? (
              <><Loader2 size={22} className="animate-spin" /> Acquiring GPS…</>
            ) : isTracking ? (
              <><Square size={22} fill="currentColor" /> Stop Tracking</>
            ) : (
              <><Play size={22} fill="currentColor" /> Start GPS Tracking</>
            )}
          </button>
        )}

        {/* Info footer */}
        <div className="text-center text-white/40 text-xs space-y-1 mt-2">
          <div className="flex items-center justify-center gap-1.5">
            <Smartphone size={12} />
            <span>Keep this page open while tracking</span>
          </div>
          <p>Location sent every {PING_INTERVAL_MS / 1000}s · GPS stays active in background</p>
          <p className="text-white/25">Browser geolocation · No app required</p>
        </div>
      </div>
    </div>
  );
};
