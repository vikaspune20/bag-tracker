import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Loader2, ChevronLeft } from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

type Product = {
  sku: string;
  name: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  description: string;
};

export const DeviceCheckout = () => {
  const [searchParams] = useSearchParams();
  const sku = searchParams.get('sku') || '';
  const user = useAuthStore((s) => s.user);

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shipping, setShipping] = useState({
    name: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ products: Product[] }>('/devices/catalog');
        const p = data.products.find((x) => x.sku === sku) || null;
        setProduct(p);
      } finally {
        setLoading(false);
      }
    })();
  }, [sku]);

  useEffect(() => {
    if (user && !shipping.name) {
      setShipping((s) => ({
        ...s,
        name: user.fullName || '',
        phone: user.phone || '',
        addressLine: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || 'United States',
      }));
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post<{ url: string; orderId: string }>('/devices/checkout-session', {
        sku: product.sku,
        quantity,
        shipping,
      });
      window.location.href = data.url;
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Checkout failed');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-airline-sky" size={40} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-4">
        <p className="text-gray-700">Product not found.</p>
        <Link to="/devices" className="text-airline-blue font-bold hover:underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const total = product.priceCents * quantity;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/devices" className="inline-flex items-center text-sm font-bold text-airline-blue hover:underline">
        <ChevronLeft size={16} className="mr-1" /> Back to shop
      </Link>

      <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:order-2">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-md object-cover bg-white" />
              <div className="flex-1">
                <p className="font-bold text-gray-900">{product.name}</p>
                <p className="text-xs uppercase tracking-wider text-gray-500">{product.sku}</p>
              </div>
              <p className="font-bold">${(product.priceCents / 100).toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700">Quantity</label>
              <input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                className="w-20 border border-gray-300 rounded-md py-1 px-2"
              />
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-medium">Total</span>
              <span className="text-xl font-black text-airline-blue">${(total / 100).toFixed(2)}</span>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 rounded-md p-2">
              First-time device buyer? You'll get <strong>1 month of premium</strong> free after payment.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="md:order-1 space-y-3">
          <h3 className="font-bold text-gray-800">Shipping address</h3>
          {(['name', 'phone', 'addressLine', 'city', 'state', 'zip', 'country'] as const).map((f) => (
            <div key={f}>
              <label className="block text-sm font-medium text-gray-700 capitalize">
                {f === 'addressLine' ? 'Address' : f}
              </label>
              <input
                value={shipping[f]}
                onChange={(e) => setShipping((s) => ({ ...s, [f]: e.target.value }))}
                required={f !== 'country'}
                className="mt-1 block w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-airline-sky sm:text-sm"
              />
            </div>
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-airline-blue text-white font-bold py-3 rounded-xl hover:bg-airline-dark disabled:opacity-60 flex items-center justify-center"
          >
            {submitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
            Pay with Stripe
          </button>
        </form>
      </div>
    </div>
  );
};
