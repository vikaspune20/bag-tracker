import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Cpu, ShoppingBag, Zap, Wifi, BatteryFull, Scale, Ruler, ShieldCheck } from 'lucide-react';
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

const specIcon: Record<string, JSX.Element> = {
  Battery:    <BatteryFull size={14} />,
  Network:    <Wifi size={14} />,
  Weight:     <Scale size={14} />,
  Dimensions: <Ruler size={14} />,
  Warranty:   <ShieldCheck size={14} />,
};

const PRODUCT_GRADIENTS = [
  'from-blue-600 to-blue-800',
  'from-indigo-600 to-purple-700',
];

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
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Tracking Device Shop</h2>
          <p className="text-sm text-gray-500 mt-1">
            Every device includes a <strong className="text-emerald-600">1-month free Premium</strong> bonus on first purchase.
          </p>
        </div>
        <Link
          to="/orders"
          className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium hover:bg-gray-50 text-sm shadow-sm"
        >
          <ShoppingBag size={16} /> My Orders
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="animate-spin text-airline-sky" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.map((p, idx) => (
            <div
              key={p.sku}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
            >
              {/* Product hero — gradient with icon when no image */}
              <div className={`h-44 md:h-52 relative bg-gradient-to-br ${PRODUCT_GRADIENTS[idx % PRODUCT_GRADIENTS.length]} flex items-center justify-center overflow-hidden`}>
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                    }}
                  />
                ) : null}
                {/* Fallback / overlay icon */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center gap-2 ${p.imageUrl ? 'hidden' : 'flex'}`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Cpu size={36} className="text-white" />
                  </div>
                  <span className="text-white/80 text-xs font-mono font-bold tracking-widest">{p.sku}</span>
                </div>

                {/* Price badge */}
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-airline-dark font-black text-lg px-3 py-1 rounded-xl shadow-sm">
                  ${(p.priceCents / 100).toFixed(2)}
                </div>

                {/* Free premium badge */}
                <div className="absolute bottom-3 left-3 bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Zap size={11} /> 1 Month Free
                </div>
              </div>

              {/* Card body */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-3">
                  <h3 className="text-xl font-black text-airline-dark">{p.name}</h3>
                  <p className="text-xs uppercase tracking-wider text-gray-400 mt-0.5 font-mono">{p.sku}</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{p.description}</p>

                {/* Specs grid */}
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm flex-1">
                  {Object.entries(p.specs).map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                      <dt className="flex items-center gap-1.5 text-xs text-gray-400 mb-0.5">
                        {specIcon[k] ?? <Cpu size={12} />}
                        {k}
                      </dt>
                      <dd className="font-semibold text-gray-800 text-sm">{v}</dd>
                    </div>
                  ))}
                </dl>

                {/* CTA */}
                <Link
                  to={`/devices/checkout?sku=${encodeURIComponent(p.sku)}`}
                  className="mt-5 w-full flex items-center justify-center gap-2 bg-airline-blue text-white px-5 py-3 rounded-xl font-bold shadow-sm hover:bg-airline-dark transition-colors"
                >
                  <ShoppingBag size={18} />
                  Buy Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
