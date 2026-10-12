import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, ArrowRight, UserCheck, Shield, Lock } from 'lucide-react';

interface Forbidden403ViewProps {
  attemptedPath?: string;
  onRedirectToTechnician?: () => void;
}

export const Forbidden403View: React.FC<Forbidden403ViewProps> = ({
  attemptedPath = '/admin/dashboard',
  onRedirectToTechnician,
}) => {
  const { currentUser, role, navigate, logout, t } = useApp();

  const handleGoToTechnician = () => {
    if (onRedirectToTechnician) {
      onRedirectToTechnician();
    } else {
      navigate('/technician/dashboard');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-[var(--surface)] border border-rose-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
          <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Lock className="w-3.5 h-3.5" />
            <span>HTTP 403 · Access Denied</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight">
            {t('forbidden403Title')}
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            {t('forbiddenAdminOnly')}
          </p>
        </div>

        {/* Diagnostic role box */}
        <div className="p-4 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)] text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">Attempted Route:</span>
            <code className="font-mono text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded">
              {attemptedPath}
            </code>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">Current Logged-in User:</span>
            <span className="font-bold text-[var(--text)] flex items-center gap-1.5">
              <span>{currentUser.full_name}</span>
              <span className="font-mono text-xs text-[var(--text-muted)]">(@{currentUser.username})</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">Detected User Role:</span>
            <span className="px-2 py-0.5 rounded font-black text-[11px] uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Role: {role}
            </span>
          </div>

          <div className="text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
            Technicians are isolated to their personal terminal and service desk. System settings, financial accounting, and full workshop controls are reserved for administrators.
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleGoToTechnician}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-md transition-all cursor-pointer"
          >
            <span>{t('goToTechnicianDashboard')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={async () => {
              await logout();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[var(--text)] bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 border border-[var(--border)] transition-all cursor-pointer"
          >
            <Shield className="w-4 h-4 text-blue-500" />
            <span>Sign in with another account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
