import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, Loader2, Printer, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';

type SubInvoice = {
  invoiceNumber: string;
  issuedAt: string;
  status: string;
  customer: { name: string; email: string; phone: string };
  device: { deviceId: string } | null;
  lineItems: {
    name: string;
    description: string;
    quantity: number;
    unitAmount: number;
    totalAmount: number;
  }[];
  totals: { subtotal: number; total: number };
  periodStart: string;
  periodEnd: string | null;
};

export const SubscriptionInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<SubInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<SubInvoice>(`/subscriptions/${id}/invoice`);
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

  const fmt = (dollars: number) => `$${dollars.toFixed(2)}`;

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
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-airline-dark">JC Smartbag</h1>
            <p className="text-sm text-gray-500">Subscription Invoice</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-bold">{invoice.invoiceNumber}</p>
            <p className="text-sm text-gray-500">Issued {format(new Date(invoice.issuedAt), 'MMM d, yyyy')}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">Status: {invoice.status}</p>
          </div>
        </div>

        {/* Customer + Period */}
        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <h3 className="font-bold text-gray-800 mb-1">Bill to</h3>
            <p>{invoice.customer.name}</p>
            <p className="text-gray-600">{invoice.customer.email}</p>
            <p className="text-gray-600">{invoice.customer.phone}</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-1">Subscription period</h3>
            <p className="text-gray-600">
              From: {format(new Date(invoice.periodStart), 'MMM d, yyyy')}
            </p>
            {invoice.periodEnd && (
              <p className="text-gray-600">
                To: {format(new Date(invoice.periodEnd), 'MMM d, yyyy')}
              </p>
            )}
            {invoice.device && (
              <p className="mt-2 font-mono text-xs text-gray-700">
                Device: {invoice.device.deviceId}
              </p>
            )}
          </div>
        </div>

        {/* Line items */}
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
            {invoice.lineItems.map((li, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <p className="font-medium text-gray-800">{li.name}</p>
                  <p className="text-xs text-gray-500">{li.description}</p>
                </td>
                <td className="px-3 py-2 text-right">{li.quantity}</td>
                <td className="px-3 py-2 text-right">{fmt(li.unitAmount)}</td>
                <td className="px-3 py-2 text-right font-medium">{fmt(li.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200">
              <td className="px-3 py-2 text-right font-bold" colSpan={3}>Subtotal</td>
              <td className="px-3 py-2 text-right font-bold">{fmt(invoice.totals.subtotal)}</td>
            </tr>
            <tr className="border-t border-gray-300">
              <td className="px-3 py-3 text-right text-lg font-black" colSpan={3}>Total</td>
              <td className="px-3 py-3 text-right text-lg font-black text-airline-blue">
                {fmt(invoice.totals.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        <p className="text-xs text-gray-400 text-center mt-4">
          Thank you for your subscription. This invoice confirms your payment for device tracking services.
        </p>
      </div>
    </div>
  );
};
