export type DeviceProduct = {
  sku: string;
  name: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  description: string;
  specs: Record<string, string>;
};

export const DEVICE_CATALOG: DeviceProduct[] = [
  {
    sku: 'JC-TRACK-LITE',
    name: 'JC SmartTrack Lite',
    priceCents: 4999,
    currency: 'usd',
    imageUrl: 'https://images.unsplash.com/photo-1620876054252-d4f0a08fa55b?w=600&q=80',
    description: 'Compact tracker for everyday luggage. BLE + LTE-M with 30-day battery life.',
    specs: {
      Battery: '30 days',
      Network: 'BLE + LTE-M',
      Weight: '28 g',
      Dimensions: '46 × 32 × 8 mm',
      Warranty: '1 year',
    },
  },
  {
    sku: 'JC-TRACK-PRO',
    name: 'JC SmartTrack Pro',
    priceCents: 8999,
    currency: 'usd',
    imageUrl: 'https://images.unsplash.com/photo-1601925240970-98447ddafd2c?w=600&q=80',
    description:
      'Premium tracker with extended battery, WiFi positioning, and SOS button. Ideal for international travel.',
    specs: {
      Battery: '90 days',
      Network: 'BLE + LTE-M + WiFi',
      Weight: '35 g',
      Dimensions: '52 × 36 × 9 mm',
      Warranty: '1 year',
    },
  },
];

export const DEVICE_HARDWARE_DAYS = 365;
export const FREE_BONUS_DAYS = 30;

export function getProductBySku(sku: string): DeviceProduct | undefined {
  return DEVICE_CATALOG.find((p) => p.sku === sku);
}
