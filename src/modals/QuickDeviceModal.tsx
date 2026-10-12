import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Smartphone, Save, Shield } from 'lucide-react';

interface QuickDeviceModalProps {
  onClose: () => void;
  onCreated?: (deviceId: string) => void;
}

export const QuickDeviceModal: React.FC<QuickDeviceModalProps> = ({
  onClose,
  onCreated,
}) => {
  const { createDevice, customers, t } = useApp();
  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('');
  const [imei, setImei] = useState('');
  const [color, setColor] = useState('');
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim()) {
      setError('Model name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const created = await createDevice({
        brand: brand.trim(),
        model: model.trim(),
        category: 'smartphone',
        serial_or_imei: imei.trim() || 'N/A',
        customer_id: customerId || customers[0]?.id || 'CUST-001',
        condition_notes: color.trim() ? `Color: ${color.trim()}` : 'Good condition',
      });
      if (onCreated) onCreated(created.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[var(--text)]">{t('addDevice')}</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Register a phone or hardware item</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Brand *
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="Apple">Apple</option>
                <option value="Samsung">Samsung</option>
                <option value="Xiaomi">Xiaomi / Redmi</option>
                <option value="Huawei">Huawei / Honor</option>
                <option value="Oppo">Oppo / Realme</option>
                <option value="Vivo">Vivo / iQOO</option>
                <option value="Google">Google Pixel</option>
                <option value="OnePlus">OnePlus</option>
                <option value="Sony">Sony</option>
                <option value="Other">Other Brand</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Model *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. iPhone 14 Pro"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              IMEI / Serial Number
            </label>
            <input
              type="text"
              placeholder="15-digit IMEI or Serial number"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Color
              </label>
              <input
                type="text"
                placeholder="e.g. Midnight Black"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Owner Customer
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="">None / Walk-in</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : 'Add Device'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
