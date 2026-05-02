import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type HardwareOrder = {
  kind: 'hardware';
  id: string;
  productName: string;
  quantity: number;
  totalAmount: number;   // cents
  currency: string;
  status: string;
  createdAt: string;
  devices: { id: string; deviceId: string }[];
};

type SubPayment = {
  kind: 'subscription';
  id: string;
  planMonths: number;
  amount: number;        // dollars
  status: string;
  createdAt: string;
  deviceTag: string | null;
};

type UnifiedRow = HardwareOrder | SubPayment;

// ── Helpers ───────────────────────────────────────────────────────────────────

const HARDWARE_STATUS_STYLE: Record<string, string> = {
  PENDING:   'bg-amber-100 text-amber-800',
  PAID:      'bg-green-100 text-green-800',
  FAILED:    'bg-red-100 text-red-800',
  SHIPPED:   'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELED:  'bg-gray-100 text-gray-700',
};

const SUB_STATUS_STYLE: Record<string, string> = {
  ACTIVE:  'bg-green-100 text-green-800',
  EXPIRED: 'bg-red-100 text-red-800',
};

function planLabel(months: number): string {
  if (months === 1)  return 'Monthly Subscription';
  if (months === 3)  return 'Quarterly Subscription';
  if (months === 12) return 'Yearly Subscription';
  return `Subscription (${months}mo)`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const DeviceOrders = () => {
  const [rows, setRows]       = useState<UnifiedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [hwRes, subRes] = await Promise.all([
          api.get<{ orders: Omit<HardwareOrder, 'kind'>[] }>('/devices/orders'),
          api.get<{ history: (Omit<SubPayment, 'kind'>)[] }>('/subscriptions/history'),
        ]);

        const hardware: UnifiedRow[] = (hwRes.data.orders ?? []).map(o => ({ ...o, kind: 'hardware' as const }));
        const subs: UnifiedRow[]     = (subRes.data.history ?? []).map(s => ({ ...s, kind: 'subscription' as const }));

        // Merge and sort newest-first
        const merged = [...hardware, ...subs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setRows(merged);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-airline-sky" size={40} />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center bg-white py-16 rounded-2xl shadow-sm border border-gray-100">
          <FileText className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-700">No orders yet</h3>
          <Link to="/devices" className="mt-4 inline-block bg-airline-blue text-white font-bold py-2 px-5 rounded-xl">
            Visit shop
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-left px-4 py-3">Qty</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Device(s)</th>
                <th className="text-left px-4 py-3">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) =>
                row.kind === 'hardware'
                  ? <HardwareRow key={`hw-${row.id}`} row={row} />
                  : <SubRow key={`sub-${row.id}`} row={row} />,
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Hardware order row ────────────────────────────────────────────────────────

function HardwareRow({ row }: { row: HardwareOrder }) {
  const canInvoice = ['PAID', 'SHIPPED', 'DELIVERED'].includes(row.status);
  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-3 align-top">
        <p className="font-mono text-xs text-gray-700">{row.id.slice(0, 8).toUpperCase()}</p>
        <p className="text-xs text-gray-500">{format(new Date(row.createdAt), 'MMM d, yyyy')}</p>
      </td>
      <td className="px-4 py-3 align-top">
        <span className="px-2 py-0.5 text-xs rounded-full font-bold bg-indigo-100 text-indigo-700">
          Hardware
        </span>
      </td>
      <td className="px-4 py-3 align-top font-medium text-gray-800">{row.productName}</td>
      <td className="px-4 py-3 align-top">{row.quantity}</td>
      <td className="px-4 py-3 align-top font-bold">${(row.totalAmount / 100).toFixed(2)}</td>
      <td className="px-4 py-3 align-top">
        <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${HARDWARE_STATUS_STYLE[row.status] ?? 'bg-gray-100 text-gray-700'}`}>
          {row.status}
        </span>
      </td>
      <td className="px-4 py-3 align-top">
        {row.devices.length === 0 ? (
          <span className="text-gray-400">—</span>
        ) : (
          <ul className="space-y-1">
            {row.devices.map((d) => (
              <li key={d.id} className="font-mono text-xs">{d.deviceId}</li>
            ))}
          </ul>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        {canInvoice ? (
          <Link
            to={`/orders/${row.id}/invoice`}
            className="inline-flex items-center gap-1.5 bg-airline-blue text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-airline-dark transition-colors"
          >
            <Download size={13} />
            Invoice
          </Link>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}

// ── Subscription payment row ──────────────────────────────────────────────────

function SubRow({ row }: { row: SubPayment }) {
  const normalStatus = row.status.toUpperCase();
  const canInvoice   = normalStatus === 'ACTIVE' || normalStatus === 'EXPIRED';
  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-3 align-top">
        <p className="font-mono text-xs text-gray-700">
          {`SUBINV-${row.id.slice(0, 8).toUpperCase()}`}
        </p>
        <p className="text-xs text-gray-500">{format(new Date(row.createdAt), 'MMM d, yyyy')}</p>
      </td>
      <td className="px-4 py-3 align-top">
        <span className="px-2 py-0.5 text-xs rounded-full font-bold bg-purple-100 text-purple-700">
          Subscription
        </span>
      </td>
      <td className="px-4 py-3 align-top font-medium text-gray-800">
        {planLabel(row.planMonths)}
      </td>
      <td className="px-4 py-3 align-top">1</td>
      <td className="px-4 py-3 align-top font-bold">${row.amount.toFixed(2)}</td>
      <td className="px-4 py-3 align-top">
        <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${SUB_STATUS_STYLE[normalStatus] ?? 'bg-gray-100 text-gray-700'}`}>
          {normalStatus}
        </span>
      </td>
      <td className="px-4 py-3 align-top">
        {row.deviceTag
          ? <span className="font-mono text-xs">{row.deviceTag}</span>
          : <span className="text-gray-400">—</span>}
      </td>
      <td className="px-4 py-3 align-top">
        {canInvoice ? (
          <Link
            to={`/subscription-invoice/${row.id}`}
            className="inline-flex items-center gap-1.5 bg-airline-blue text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-airline-dark transition-colors"
          >
            <Download size={13} />
            Invoice
          </Link>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
    </tr>
  );
}
