import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, UserCog, Save, User, Key, Phone, Mail, Wrench } from 'lucide-react';

interface QuickTechnicianModalProps {
  onClose: () => void;
  onCreated?: () => void;
}

export const QuickTechnicianModal: React.FC<QuickTechnicianModalProps> = ({
  onClose,
  onCreated,
}) => {
  const { createTechnician, t } = useApp();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('Hardware & Screen Replacement');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      setError('Full name and username are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createTechnician({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        phone: phone.trim() || '+95 9 000 000 000',
        email: email.trim() || `${username.trim().toLowerCase()}@workshop.local`,
        address: 'Technician Bench Station',
        specialization: [specialization.trim() || 'Hardware & Diagnostics'],
        status: 'active',
      });
      if (onCreated) onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to register technician');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCog className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[var(--text)]">{t('registerTechnician')}</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Register a new bench technician</p>
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

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="e.g. Ko Myo / Technician A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Login Username *
            </label>
            <div className="relative">
              <span className="text-[var(--text-muted)] absolute left-3 top-2 font-mono text-sm">@</span>
              <input
                type="text"
                required
                placeholder="tech_alex"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm font-mono bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Phone
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="09-1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="tech@shop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Specialization
            </label>
            <div className="relative">
              <Wrench className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. iPhone Motherboard, Android Soldering"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
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
              <span>{loading ? 'Registering...' : 'Register Technician'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
