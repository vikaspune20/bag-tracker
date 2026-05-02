import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';

export type DeviceSubStatus = {
  id: string;
  deviceId: string;
  subStatus: 'NONE' | 'ACTIVE' | 'EXPIRED';
  subPlan: string | null;
  subExpiry: string | null;
  subCancelAtPeriodEnd: boolean;
  hardwareExpiresAt: string;
};

export type SubscriptionStatus = {
  active: boolean;
  planType: string | null;
  expiryDate: string | null;
  hasDevice: boolean;
  deviceCount: number;
  devices: DeviceSubStatus[];
};

export function useSubscriptionStatus() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<SubscriptionStatus>('/subscriptions/status');
      setStatus(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { status, loading, error, refetch };
}
