import React from 'react';
import { useApp } from '../context/AppContext';
import { Cpu, ShieldCheck, Globe, Coins, Moon, CheckCircle2 } from 'lucide-react';

export const AboutView: React.FC = () => {
  const { t, settings } = useApp();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Brand Header */}
      <div className="p-6 sm:p-8 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <div className="flex items-center gap-3.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
              FixFlow Repair & Service Manager
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              Release Build v2.6.4 · Professional Workshop Suite
            </p>
          </div>
        </div>

        <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
          {t('aboutDescription')}
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Multilingual Localization */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <Globe className="w-4 h-4 text-blue-500" />
            <span>Regional Unicode Localization</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Full native Unicode support for Myanmar (မြန်မာ), English, and Thai (ไทย). All forms, statuses, receipts, and system labels adapt dynamically.
          </p>
        </div>

        {/* Currency System */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <Coins className="w-4 h-4 text-emerald-500" />
            <span>Standardized Multi-Currency Display</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Standard accounting formatter supporting Myanmar Kyat (Ks), US Dollar ($), and Thai Baht (฿) with clean decimal discipline and tabular alignment.
          </p>
        </div>

        {/* Dark & Light Theme */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <Moon className="w-4 h-4 text-indigo-500" />
            <span>Anti-Glare Theme Engine</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Complete Light, Dark, and System modes with zero white-flash on reload and consistent custom property color tokens.
          </p>
        </div>

        {/* Role Separation */}
        <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <span>Role-Based Workflow Governance</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Admin role oversees revenue and technicians, while bench technicians focus cleanly on assigned hardware diagnostics under "My Services".
          </p>
        </div>
      </div>

      {/* Workshop Registration Info */}
      <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-muted)] space-y-2">
        <div className="font-semibold text-sm text-[var(--text)]">Active Bay Profile</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono">
          <div>Workshop: {settings.shopName}</div>
          <div>Phone: {settings.phone}</div>
          <div>Email: {settings.email}</div>
          <div>Address: {settings.address}</div>
        </div>
      </div>
    </div>
  );
};
