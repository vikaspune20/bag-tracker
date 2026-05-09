import { useEffect, useState } from 'react';
import { Loader2, Save, DollarSign, RotateCcw } from 'lucide-react';
import api from '../../utils/api';

interface PricingRow {
  key: string;
  cents: number;
  label: string;
  months: number;
}

const PLAN_ORDER = ['MONTHLY_200', 'QUARTERLY_400', 'YEARLY_600'];

const PLAN_LABELS: Record<string, string> = {
  MONTHLY_200:   '1 Month',
  QUARTERLY_400: '1 Quarter',
  YEARLY_600:    '1 Year',
};

export function AdminPricing() {
  const [pricing, setPricing] = useState<PricingRow[]>([]);
  const [draft, setDraft]     = useState<Record<string, string>>({});  // key → dollar string
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/pricing');
      const rows: PricingRow[] = data.pricing;
      // Sort by defined order
      rows.sort((a, b) => PLAN_ORDER.indexOf(a.key) - PLAN_ORDER.indexOf(b.key));
      setPricing(rows);
      // Populate draft with dollar values (cents / 100)
      const d: Record<string, string> = {};
      rows.forEach(r => { d[r.key] = (r.cents / 100).toFixed(2); });
      setDraft(d);
    } catch {
      setError('Failed to load pricing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setError('');
    setSaved(false);

    // Validate
    for (const row of pricing) {
      const val = parseFloat(draft[row.key]);
      if (isNaN(val) || val <= 0) {
        setError(`Invalid price for ${PLAN_LABELS[row.key] ?? row.key}`);
        return;
      }
    }

    setSaving(true);
    try {
      const updated = pricing.map(row => ({
        key:    row.key,
        cents:  Math.round(parseFloat(draft[row.key]) * 100),
        label:  PLAN_LABELS[row.key] ?? row.label,
        months: row.months,
      }));
      await api.put('/admin/pricing', { pricing: updated });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const d: Record<string, string> = {};
    pricing.forEach(r => { d[r.key] = (r.cents / 100).toFixed(2); });
    setDraft(d);
    setError('');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscription Pricing</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Set the price for each plan. Changes take effect immediately for new checkouts.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-2">
            <DollarSign size={18} className="text-blue-400" />
            <span className="text-white font-semibold">Plan Prices (USD)</span>
          </div>

          <div className="divide-y divide-slate-700/40">
            {pricing.map(row => (
              <div key={row.key} className="px-6 py-5 flex items-center gap-6">
                <div className="flex-1">
                  <p className="text-white font-semibold">{PLAN_LABELS[row.key] ?? row.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {row.months} month{row.months !== 1 ? 's' : ''} · key: <span className="font-mono">{row.key}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={draft[row.key] ?? ''}
                    onChange={e => setDraft(prev => ({ ...prev, [row.key]: e.target.value }))}
                    className="w-28 bg-slate-900 border border-slate-700 text-white text-sm px-3 py-2 rounded-lg
                               focus:outline-none focus:border-blue-500 text-right font-mono"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="px-6 py-4 bg-slate-900/40 border-t border-slate-700/50">
            <div className="flex gap-2 flex-wrap text-xs text-slate-400">
              {pricing.map(row => (
                <span key={row.key} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                  {PLAN_LABELS[row.key]}: <strong className="text-white">${draft[row.key] || '—'}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Saved banner */}
      {saved && (
        <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
          ✓ Pricing updated successfully. New checkouts will use the updated prices.
        </p>
      )}

      {/* Actions */}
      {!loading && (
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700
                       text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            <RotateCcw size={15} /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm
                       font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : 'Save Prices'}
          </button>
        </div>
      )}
    </div>
  );
}
