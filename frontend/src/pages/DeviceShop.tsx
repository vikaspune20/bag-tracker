import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Cpu, ShoppingBag } from 'lucide-react';
import api from '../utils/api';

type Product = {
  sku: string;
  name: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  description: string;
  specs: Record<string, string>;
};

export const DeviceShop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ products: Product[] }>('/devices/catalog');
        setProducts(data.products);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tracking Device Shop</h2>
          <p className="text-sm text-gray-500 mt-1">
            Buy a physical tracker for your bags. Every device includes a <strong>1-month free Premium</strong> bonus on
            your first purchase.
          </p>
        </div>
        <Link
          to="/orders"
          className="flex items-center gap-2 bg-airline-light text-airline-dark px-4 py-2 rounded-xl font-medium hover:bg-gray-200"
        >
          <ShoppingBag size={18} /> My Orders
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-airline-sky" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((p) => (
            <div
              key={p.sku}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
            >
              <div className="h-48 bg-gray-100 relative">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Cpu size={56} />
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-black text-airline-dark">{p.name}</h3>
                    <p className="text-xs uppercase tracking-wider text-gray-500 mt-1">{p.sku}</p>
                  </div>
                  <div className="text-2xl font-black text-airline-blue">
                    ${(p.priceCents / 100).toFixed(2)}
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600">{p.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(p.specs).map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-md px-3 py-2">
                      <dt className="text-xs text-gray-500">{k}</dt>
                      <dd className="font-semibold text-gray-800">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 flex justify-end">
                  <Link
                    to={`/devices/checkout?sku=${encodeURIComponent(p.sku)}`}
                    className="bg-airline-blue text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-airline-dark"
                  >
                    Buy now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
