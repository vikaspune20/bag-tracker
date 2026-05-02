import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Loader2, Printer, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';

type Invoice = {
  invoiceNumber: string;
  issuedAt: string;
  status: string;
  customer: { name: string; email: string; phone: string };
  shipping: {
    name: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  lineItems: {
    sku: string;
    name: string;
    quantity: number;
    unitAmount: number;
    totalAmount: number;
    currency: string;
  }[];
  totals: { subtotal: number; shipping: number; tax: number; total: number; currency: string };
  devices: { deviceId: string; expiresAt: string }[];
};

export const DeviceInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Invoice>(`/devices/orders/${id}/invoice`);
        setInvoice(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const downloadPDF = async () => {
    if (!invoiceRef.current || !invoice) return;
    setDownloading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2pdf = ((await import('html2pdf.js')) as any).default;
      await html2pdf()
        .set({
          margin: 10,
          filename: `${invoice.invoiceNumber}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(invoiceRef.current)
        .save();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-airline-sky" size={40} />
      </div>
    );
  }

  if (!invoice) {
    return <p className="text-gray-700">Invoice not found.</p>;
  }

  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="space-y-4 max-w-3xl mx-auto print:max-w-none">
      <div className="flex justify-between items-center print:hidden">
        <Link to="/orders" className="inline-flex items-center text-sm font-bold text-airline-blue hover:underline">
          <ChevronLeft size={16} className="mr-1" /> Back to orders
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="inline-flex items-center gap-2 bg-airline-blue text-white px-4 py-2 rounded-xl font-medium hover:bg-airline-dark disabled:opacity-60"
          >
            {downloading
              ? <><Loader2 size={16} className="animate-spin" /> Generating…</>
              : <><Download size={16} /> Download PDF</>}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-50"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>

      <div ref={invoiceRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 print:shadow-none print:border-none">
        <div className="flex justify-between items-start border-b pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-airline-dark">JC Smartbag</h1>
            <p className="text-sm text-gray-500">Tracking Device Invoice</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-bold">{invoice.invoiceNumber}</p>
            <p className="text-sm text-gray-500">Issued {format(new Date(invoice.issuedAt), 'MMM d, yyyy')}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">Status: {invoice.status}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <h3 className="font-bold text-gray-800 mb-1">Bill to</h3>
            <p>{invoice.customer.name}</p>
            <p className="text-gray-600">{invoice.customer.email}</p>
            <p className="text-gray-600">{invoice.customer.phone}</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-1">Ship to</h3>
            <p>{invoice.shipping.name}</p>
            <p className="text-gray-600">{invoice.shipping.addressLine}</p>
            <p className="text-gray-600">
              {invoice.shipping.city}, {invoice.shipping.state} {invoice.shipping.zip}
            </p>
            <p className="text-gray-600">{invoice.shipping.country}</p>
            <p className="text-gray-600 mt-1">Phone: {invoice.shipping.phone}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-3 py-2">Item</th>
              <th className="text-right px-3 py-2">Qty</th>
              <th className="text-right px-3 py-2">Unit</th>
              <th className="text-right px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li) => (
              <tr key={li.sku} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <p className="font-medium text-gray-800">{li.name}</p>
                  <p className="text-xs text-gray-500">{li.sku}</p>
                </td>
                <td className="px-3 py-2 text-right">{li.quantity}</td>
                <td className="px-3 py-2 text-right">{fmt(li.unitAmount)}</td>
                <td className="px-3 py-2 text-right font-medium">{fmt(li.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200">
              <td className="px-3 py-2 text-right font-bold" colSpan={3}>
                Subtotal
              </td>
              <td className="px-3 py-2 text-right font-bold">{fmt(invoice.totals.subtotal)}</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-right text-gray-600" colSpan={3}>
                Shipping
              </td>
              <td className="px-3 py-2 text-right text-gray-600">{fmt(invoice.totals.shipping)}</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-right text-gray-600" colSpan={3}>
                Tax
              </td>
              <td className="px-3 py-2 text-right text-gray-600">{fmt(invoice.totals.tax)}</td>
            </tr>
            <tr className="border-t border-gray-300">
              <td className="px-3 py-3 text-right text-lg font-black" colSpan={3}>
                Total
              </td>
              <td className="px-3 py-3 text-right text-lg font-black text-airline-blue">
                {fmt(invoice.totals.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        {invoice.devices.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Issued device IDs</h3>
            <ul className="text-sm space-y-1">
              {invoice.devices.map((d) => (
                <li key={d.deviceId} className="font-mono">
                  {d.deviceId}{' '}
                  <span className="text-gray-500">
                    (expires {format(new Date(d.expiresAt), 'MMM d, yyyy')})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
