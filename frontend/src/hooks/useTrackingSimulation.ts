import { useEffect, useState } from 'react';

export type TrackingPhase = 0 | 1 | 2 | 3;

const PHASE_LABELS = ['Check-in', 'In Transit', 'On Belt', 'Delivered'] as const;

export function useTrackingSimulation(intervalMs = 3800) {
  const [phase, setPhase] = useState<TrackingPhase>(1);
  const [etaMinutes, setEtaMinutes] = useState(142);

  useEffect(() => {
    const t = window.setInterval(() => {
      setPhase((p) => ((p + 1) % 4) as TrackingPhase);
      setEtaMinutes((m) => Math.max(12, m - 18 + Math.floor(Math.random() * 8)));
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);

  return { phase, phaseLabel: PHASE_LABELS[phase], etaMinutes };
}
