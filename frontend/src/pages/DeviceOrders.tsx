import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Loader2, FileText, ShoppingBag } from 'lucide-react';
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
  PENDING:   'bg-amber-100 text-amber-700',
  PAID:      'bg-green-100 text-green-700',
  FAILED:    'bg-red-100 text-red-700',
  SHIPPED:   'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELED:  'bg-gray-100 text-gray-600',
};

const SUB_STATUS_STYLE: Record<string, string> = {
  ACTIVE:  'bg-green-100 text-green-700',
  EXPIRED: 'bg-red-100 text-red-700',
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
          api.get<{ history: Omit<SubPayment, 'kind'>[] }>('/subscriptions/history'),
        ]);

        const hardware: UnifiedRow[] = (hwRes.data.orders ?? []).map(o => ({ ...o, kind: 'hardware' as const }));
        const subs: UnifiedRow[]     = (subRes.data.history ?? []).map(s => ({ ...s, kind: 'subscription' as const }));

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
          <p className="text-sm text-gray-500 mt-0.5">Hardware purchases and subscription payments.</p>
        </div>
        <Link
          to="/devices"
          className="flex items-center gap-2 bg-airline-blue text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-airline-dark transition-colors shadow-sm"
        >
          <ShoppingBag size={16} />
          <span className="hidden sm:inline">Shop</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-airline-sky" size={40} />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center bg-white py-16 rounded-2xl shadow-sm border border-gray-100">
          <FileText className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-700">No orders yet</h3>
          <p className="text-gray-500 mt-2 text-sm">Your hardware and subscription orders will appear here.</p>
          <Link to="/devices" className="mt-4 inline-block bg-airline-blue text-white font-bold py-2 px-5 rounded-xl text-sm">
            Visit shop
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table — hidden on mobile */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold">Order</th>
                    <th className="text-left px-5 py-3 font-semibold">Type</th>
                    <th className="text-left px-5 py-3 font-semibold">Description</th>
                    <th className="text-left px-5 py-3 font-semibold">Qty</th>
                    <th className="text-left px-5 py-3 font-semibold">Total</th>
                    <th className="text-left px-5 py-3 font-semibold">Status</th>
                    <th className="text-left px-5 py-3 font-semibold">Device(s)</th>
                    <th className="text-left px-5 py-3 font-semibold">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map(row =>
                    row.kind === 'hardware'
                      ? <HardwareRow key={`hw-${row.id}`} row={row} />
                      : <SubRow key={`sub-${row.id}`} row={row} />,
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {rows.map(row =>
              row.kind === 'hardware'
                ? <HardwareCard key={`hw-${row.id}`} row={row} />
                : <SubCard key={`sub-${row.id}`} row={row} />,
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Desktop row — Hardware ────────────────────────────────────────────────────

function HardwareRow({ row }: { row: HardwareOrder }) {
  const canInvoice = ['PAID', 'SHIPPED', 'DELIVERED'].includes(row.status);
  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-3.5 align-middle">
        <p className="font-mono text-xs font-semibold text-gray-700">{row.id.slice(0, 8).toUpperCase()}</p>
        <p className="text-xs text-gray-400">{format(new Date(row.createdAt), 'MMM d, yyyy')}</p>
      </td>
      <td className="px-5 py-3.5 align-middle">
        <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-indigo-100 text-indigo-700">Hardware</span>
      </td>
      <td className="px-5 py-3.5 align-middle font-medium text-gray-800 max-w-[160px] truncate">{row.productName}</td>
      <td className="px-5 py-3.5 align-middle text-gray-600">{row.quantity}</td>
      <td className="px-5 py-3.5 align-middle font-bold text-gray-900">${(row.totalAmount / 100).toFixed(2)}</td>
      <td className="px-5 py-3.5 align-middle">
        <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${HARDWARE_STATUS_STYLE[row.status] ?? 'bg-gray-100 text-gray-700'}`}>
          {row.status}
        </span>
      </td>
      <td className="px-5 py-3.5 align-middle">
        {row.devices.length === 0 ? (
          <span className="text-gray-400">—</span>
        ) : (
          <ul className="space-y-1">
            {row.devices.map(d => <li key={d.id} className="font-mono text-xs text-gray-600">{d.deviceId}</li>)}
          </ul>
        )}
      </td>
      <td className="px-5 py-3.5 align-middle">
        {canInvoice ? (
          <Link
            to={`/orders/${row.id}/invoice`}
            className="inline-flex items-center gap-1.5 bg-airline-blue text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-airline-dark transition-colors"
          >
            <Download size={12} /> Invoice
          </Link>
        ) : <span className="text-gray-400">—</span>}
      </td>
    </tr>
  );
}

// ── Desktop row — Subscription ────────────────────────────────────────────────

function SubRow({ row }: { row: SubPayment }) {
  const normalStatus = row.status.toUpperCase();
  const canInvoice   = normalStatus === 'ACTIVE' || normalStatus === 'EXPIRED';
  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-3.5 align-middle">
        <p className="font-mono text-xs font-semibold text-gray-700">SUBINV-{row.id.slice(0, 8).toUpperCase()}</p>
        <p className="text-xs text-gray-400">{format(new Date(row.createdAt), 'MMM d, yyyy')}</p>
      </td>
      <td className="px-5 py-3.5 align-middle">
        <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-purple-100 text-purple-700">Subscription</span>
      </td>
      <td className="px-5 py-3.5 align-middle font-medium text-gray-800">{planLabel(row.planMonths)}</td>
      <td className="px-5 py-3.5 align-middle text-gray-600">1</td>
      <td className="px-5 py-3.5 align-middle font-bold text-gray-900">${row.amount.toFixed(2)}</td>
      <td className="px-5 py-3.5 align-middle">
        <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${SUB_STATUS_STYLE[normalStatus] ?? 'bg-gray-100 text-gray-700'}`}>
          {normalStatus}
        </span>
      </td>
      <td className="px-5 py-3.5 align-middle">
        {row.deviceTag
          ? <span className="font-mono text-xs text-gray-600">{row.deviceTag}</span>
          : <span className="text-gray-400">—</span>}
      </td>
      <td className="px-5 py-3.5 align-middle">
        {canInvoice ? (
          <Link
            to={`/subscription-invoice/${row.id}`}
            className="inline-flex items-center gap-1.5 bg-airline-blue text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-airline-dark transition-colors"
          >
            <Download size={12} /> Invoice
          </Link>
        ) : <span className="text-gray-400">—</span>}
      </td>
    </tr>
  );
}

// ── Mobile card — Hardware ─────────────────────────────────────────────────────

function HardwareCard({ row }: { row: HardwareOrder }) {
  const canInvoice = ['PAID', 'SHIPPED', 'DELIVERED'].includes(row.status);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-indigo-100 text-indigo-700">Hardware</span>
          <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${HARDWARE_STATUS_STYLE[row.status] ?? 'bg-gray-100 text-gray-700'}`}>
            {row.status}
          </span>
        </div>
        <p className="text-xs text-gray-400">{format(new Date(row.createdAt), 'MMM d, yyyy')}</p>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{row.productName}</p>
            <p className="font-mono text-xs text-gray-400 mt-0.5">{row.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <p className="font-black text-gray-900">${(row.totalAmount / 100).toFixed(2)}</p>
        </div>
        {row.devices.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {row.devices.map(d => (
              <span key={d.id} className="font-mono text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{d.deviceId}</span>
            ))}
          </div>
        )}
      </div>
      {canInvoice && (
        <div className="px-4 pb-4">
          <Link
            to={`/orders/${row.id}/invoice`}
            className="flex items-center justify-center gap-1.5 w-full bg-airline-blue text-white text-sm font-bold py-2.5 rounded-xl hover:bg-airline-dark transition-colors"
          >
            <Download size={14} /> Download Invoice
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Mobile card — Subscription ────────────────────────────────────────────────

function SubCard({ row }: { row: SubPayment }) {
  const normalStatus = row.status.toUpperCase();
  const canInvoice   = normalStatus === 'ACTIVE' || normalStatus === 'EXPIRED';
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs rounded-full font-bold bg-purple-100 text-purple-700">Subscription</span>
          <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${SUB_STATUS_STYLE[normalStatus] ?? 'bg-gray-100 text-gray-700'}`}>
            {normalStatus}
          </span>
        </div>
        <p className="text-xs text-gray-400">{format(new Date(row.createdAt), 'MMM d, yyyy')}</p>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{planLabel(row.planMonths)}</p>
            <p className="font-mono text-xs text-gray-400 mt-0.5">SUBINV-{row.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <p className="font-black text-gray-900">${row.amount.toFixed(2)}</p>
        </div>
        {row.deviceTag && (
          <span className="inline-block font-mono text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{row.deviceTag}</span>
        )}
      </div>
      {canInvoice && (
        <div className="px-4 pb-4">
          <Link
            to={`/subscription-invoice/${row.id}`}
            className="flex items-center justify-center gap-1.5 w-full bg-airline-blue text-white text-sm font-bold py-2.5 rounded-xl hover:bg-airline-dark transition-colors"
          >
            <Download size={14} /> Download Invoice
          </Link>
        </div>
      )}
    </div>
  );
}
