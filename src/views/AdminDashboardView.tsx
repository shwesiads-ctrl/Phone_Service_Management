import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceJob, ServiceStatus, Technician } from '../types';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  DollarSign,
  ArrowRight,
  Plus,
  Eye,
  Check,
  Smartphone,
  Shield,
  Layers,
  Calendar,
  Globe,
  Coins,
  CreditCard,
  UserPlus,
  UserCog,
  FileText,
  Filter,
  X,
  Phone,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { Forbidden403View } from './Forbidden403View';
import { QuickCustomerModal } from '../modals/QuickCustomerModal';
import { QuickDeviceModal } from '../modals/QuickDeviceModal';
import { QuickTechnicianModal } from '../modals/QuickTechnicianModal';
import { AssignTechnicianModal } from '../modals/AssignTechnicianModal';

interface AdminDashboardViewProps {
  onOpenJob: (job: ServiceJob) => void;
  onNewJob: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onOpenJob,
  onNewJob,
}) => {
  const {
    role,
    currentUser,
    jobs,
    technicians,
    payments,
    settings,
    language,
    navigate,
    setActiveTab,
    formatCurrency,
    formatDate,
    t,
  } = useApp();

  // ACCESS CONTROL: Strictly admin only!
  if (role !== 'admin') {
    return <Forbidden403View attemptedPath="/admin/dashboard" />;
  }

  // Quick Action Modal states
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [techModalOpen, setTechModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // Technician filter for Recent Jobs
  const [selectedTechFilter, setSelectedTechFilter] = useState<string | null>(null);

  // Helper date checking for "Today"
  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  // 1. SUMMARY CARDS
  const totalServices = jobs.length;
  const todayServices = jobs.filter((j) => isToday(j.created_at)).length;
  const pendingServices = jobs.filter((j) =>
    ['received', 'diagnosing', 'waiting_parts'].includes(j.status_id)
  ).length;
  const repairingServices = jobs.filter((j) => j.status_id === 'repairing').length;
  const readyServices = jobs.filter((j) => j.status_id === 'ready').length;
  const completedServices = jobs.filter((j) => j.status_id === 'completed').length;
  const deliveredServices = jobs.filter((j) => j.status_id === 'delivered').length;

  // 2. PAYMENT SUMMARY
  // Today's Payments: sum of payments created today (use selected currency, no conversion)
  const todayPaymentsSum = payments
    .filter((p) => isToday(p.paid_at))
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Today's Outstanding Balance: jobs created today that have outstanding balance
  const todayJobsList = jobs.filter((j) => isToday(j.created_at));
  const todayOutstandingBalance = todayJobsList.reduce(
    (sum, j) => sum + Math.max(0, (j.total_cost || j.service_charge || 0) - (j.amount_paid || 0)),
    0
  );

  // Total Service Charges across all jobs
  const totalServiceCharges = jobs.reduce(
    (sum, j) => sum + (j.service_charge || 0),
    0
  );

  // Recent Payments (last 6 payments)
  const recentPayments = useMemo(() => {
    return [...payments]
      .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime())
      .slice(0, 6);
  }, [payments]);

  // 3. TECHNICIAN WORKLOAD
  const technicianWorkloads = useMemo(() => {
    return technicians.map((tech) => {
      const techJobs = jobs.filter((j) => j.technician_id === tech.id);
      const assigned = techJobs.length;
      const repairing = techJobs.filter((j) => j.status_id === 'repairing').length;
      const ready = techJobs.filter((j) => j.status_id === 'ready').length;
      const completed = techJobs.filter(
        (j) => j.status_id === 'completed' || j.status_id === 'delivered'
      ).length;

      return {
        technician: tech,
        assigned,
        repairing,
        ready,
        completed,
      };
    });
  }, [technicians, jobs]);

  // 4. RECENT SERVICE JOBS
  const filteredRecentJobs = useMemo(() => {
    let list = [...jobs];
    if (selectedTechFilter) {
      list = list.filter((j) => j.technician_id === selectedTechFilter);
    }
    return list
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);
  }, [jobs, selectedTechFilter]);

  // Status badge styling helper
  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'received':
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
      case 'diagnosing':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20';
      case 'waiting_parts':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
      case 'repairing':
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20';
      case 'ready':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
      case 'delivered':
        return 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
    }
  };

  // Payment method badge helper
  const getPaymentBadge = (methodId: string) => {
    switch (methodId) {
      case 'promptpay':
        return { label: 'PromptPay', bg: 'bg-[#003B71]/15 text-[#00529b] dark:text-[#58a6ff]' };
      case 'kplus':
        return { label: 'K PLUS', bg: 'bg-[#00A950]/15 text-[#00A950]' };
      case 'scb_easy':
        return { label: 'SCB EASY', bg: 'bg-[#4E2A84]/15 text-[#6c3cb7] dark:text-[#b392f0]' };
      case 'truemoney':
        return { label: 'TrueMoney', bg: 'bg-[#FF8800]/15 text-[#FF8800]' };
      case 'rabbit_line_pay':
        return { label: 'Rabbit LINE Pay', bg: 'bg-[#00C300]/15 text-[#00b000]' };
      case 'shopeepay':
        return { label: 'ShopeePay', bg: 'bg-[#EE4D2D]/15 text-[#EE4D2D]' };
      case 'kbzpay':
        return { label: 'KBZ Pay', bg: 'bg-[#0A4B94]/15 text-[#0A4B94] dark:text-[#58a6ff]' };
      case 'wavepay':
        return { label: 'Wave Pay', bg: 'bg-[#FFD100]/25 text-[#a88200] dark:text-[#ffd100]' };
      case 'transfer':
        return { label: 'Bank Transfer', bg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' };
      case 'card':
        return { label: 'Card', bg: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300' };
      case 'cash':
      default:
        return { label: 'Cash', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' };
    }
  };

  const todayDisplay = new Date().toLocaleDateString(
    language === 'th' ? 'th-TH' : language === 'my' ? 'my-MM' : 'en-US',
    {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  );

  const langDisplay =
    language === 'th' ? '🇹🇭 ไทย (Thai)' : language === 'my' ? '🇲🇲 မြန်မာ (Myanmar)' : '🇬🇧 English';

  const currencyDisplay = `${settings.currency || 'MMK'} / ${
    settings.currency === 'THB' ? '฿' : settings.currency === 'USD' ? '$' : 'Ks'
  }`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* ============================================================ */}
      {/* HEADER SECTION */}
      {/* ============================================================ */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Dashboard</span>
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Route: <code className="text-blue-500 font-bold">/admin/dashboard</code>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)] tracking-tight mt-1.5">
            {t('welcomeUser')}, {currentUser.full_name}
          </h1>

          {/* Meta Info Bar: Today's Date, Current Language, Current Currency */}
          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mt-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[var(--surface-2)]/60 px-2.5 py-1 rounded-lg border border-[var(--border)]">
              <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span className="font-semibold text-[var(--text)]">{t('todaysDate')}:</span>
              <span>{todayDisplay}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[var(--surface-2)]/60 px-2.5 py-1 rounded-lg border border-[var(--border)]">
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-semibold text-[var(--text)]">{t('currentLanguage')}:</span>
              <span className="font-bold text-[var(--text)]">{langDisplay}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-[var(--surface-2)]/60 px-2.5 py-1 rounded-lg border border-[var(--border)]">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold text-[var(--text)]">{t('currentCurrency')}:</span>
              <span className="font-black text-[var(--text)] font-mono">{currencyDisplay}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Row in Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onNewJob}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newService')}</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ADMIN QUICK ACTIONS BAR */}
      {/* ============================================================ */}
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
        <div className="text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span>{t('quickActions')} (Admin Operations)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <button
            type="button"
            onClick={onNewJob}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/20 transition-all cursor-pointer text-center"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('newService')}</span>
          </button>

          <button
            type="button"
            onClick={() => setCustomerModalOpen(true)}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 transition-all cursor-pointer text-center"
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('addCustomer')}</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceModalOpen(true)}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-all cursor-pointer text-center"
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('addDevice')}</span>
          </button>

          <button
            type="button"
            onClick={() => setTechModalOpen(true)}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer text-center"
          >
            <UserCog className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('registerTechnician')}</span>
          </button>

          <button
            type="button"
            onClick={() => setAssignModalOpen(true)}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-all cursor-pointer text-center"
          >
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('assignTechnician')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('reports');
              setActiveTab('reports');
            }}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 transition-all cursor-pointer text-center"
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('serviceReports')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('records');
              setActiveTab('records');
            }}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all cursor-pointer text-center"
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('repairRecords')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('finance');
              setActiveTab('finance');
            }}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/20 transition-all cursor-pointer text-center"
          >
            <DollarSign className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('finance')}</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUMMARY CARDS (7 CARDS REQUIRED BY SPEC) */}
      {/* Total Service Jobs, Today's Services, Pending Services, Repairing, Ready, Completed, Delivered */}
      {/* ============================================================ */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center justify-between">
          <span>Workshop Summary Overview</span>
          <span className="text-[11px] font-normal lowercase font-mono">Live counts across all benches</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {/* 1. Total Service Jobs */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs relative overflow-hidden group hover:border-[var(--primary)] transition-all">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('totalServiceJobs')}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-[var(--text)] tabular-nums mt-1">
              {totalServices}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
              <span>All lifetime jobs</span>
            </div>
          </div>

          {/* 2. Today's Services */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs relative overflow-hidden group hover:border-blue-500 transition-all">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('todaysServices')}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400 tabular-nums mt-1">
              {todayServices}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">
              <span>Received today</span>
            </div>
          </div>

          {/* 3. Pending Services */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs relative overflow-hidden group hover:border-amber-500 transition-all">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('pendingServices')}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400 tabular-nums mt-1">
              {pendingServices}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">
              <span>Awaiting parts / diag</span>
            </div>
          </div>

          {/* 4. Repairing */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs relative overflow-hidden group hover:border-indigo-500 transition-all">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('repairing')}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400 tabular-nums mt-1">
              {repairingServices}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">
              <span>On active workbenches</span>
            </div>
          </div>

          {/* 5. Ready */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs relative overflow-hidden group hover:border-emerald-500 transition-all">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('ready')}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
              {readyServices}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">
              <span>Waiting for pickup</span>
            </div>
          </div>

          {/* 6. Completed */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs relative overflow-hidden group hover:border-teal-500 transition-all">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('completed')}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-teal-600 dark:text-teal-400 tabular-nums mt-1">
              {completedServices}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">
              <span>Repaired & closed</span>
            </div>
          </div>

          {/* 7. Delivered */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs relative overflow-hidden group hover:border-purple-500 transition-all">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('delivered')}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-purple-600 dark:text-purple-400 tabular-nums mt-1">
              {deliveredServices}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">
              <span>Delivered to client</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TECHNICIAN WORKLOAD SECTION */}
      {/* Show each Technician: Technician Name, Assigned Jobs, Repairing, Ready, Completed */}
      {/* Allow Admin to click a Technician and view their jobs. */}
      {/* ============================================================ */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center gap-2">
              <UserCog className="w-5 h-5 text-[var(--primary)]" />
              <span>{t('technicianWorkload')}</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Click any technician below to filter the recent jobs table and view their assigned queue.
            </p>
          </div>

          {selectedTechFilter && (
            <button
              onClick={() => setSelectedTechFilter(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer w-fit"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Technician Filter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {technicianWorkloads.map(({ technician, assigned, repairing, ready, completed }) => {
            const isSelected = selectedTechFilter === technician.id;

            return (
              <div
                key={technician.id}
                onClick={() => {
                  setSelectedTechFilter(isSelected ? null : technician.id);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-md ring-2 ring-[var(--primary)]/30'
                    : 'border-[var(--border)] bg-[var(--surface-2)]/40 hover:bg-[var(--surface-2)] hover:border-slate-400/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                      {technician.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[var(--text)] flex items-center gap-1.5">
                        <span>{technician.full_name}</span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-[var(--primary)] text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] font-mono">
                        @{technician.username} · {technician.specialization || 'General Tech'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                      technician.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-500/10 text-slate-500'
                    }`}
                  >
                    {technician.status}
                  </span>
                </div>

                {/* Workload Metric Pills */}
                <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-[var(--border)] text-center">
                  <div className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Assigned</div>
                    <div className="text-base font-black font-mono text-[var(--text)] mt-0.5">{assigned}</div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase font-bold text-indigo-500">Repairing</div>
                    <div className="text-base font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">{repairing}</div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase font-bold text-emerald-500">Ready</div>
                    <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{ready}</div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase font-bold text-blue-500">Done</div>
                    <div className="text-base font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5">{completed}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* RECENT SERVICE JOBS SECTION */}
      {/* Show: Service Number, Customer, Phone, Technician, Status, Service Charge, Date */}
      {/* ============================================================ */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--primary)]" />
              <span>{t('recentServiceJobs')}</span>
              {selectedTechFilter && (
                <span className="text-xs font-normal text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-0.5 rounded-full border border-[var(--primary)]/20">
                  Filtered by: {technicians.find((t) => t.id === selectedTechFilter)?.full_name}
                </span>
              )}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Live service stream. Click any record to inspect diagnosis, parts, and payment records.
            </p>
          </div>

          <button
            onClick={() => {
              navigate('service');
              setActiveTab('service');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer w-fit"
          >
            <span>View All Service Jobs ({jobs.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[var(--surface-2)]/70 text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="py-3 px-4">{t('serviceNumber')}</th>
                <th className="py-3 px-4">{t('customer')}</th>
                <th className="py-3 px-4">{t('phone')}</th>
                <th className="py-3 px-4">{t('technician')}</th>
                <th className="py-3 px-4">{t('status')}</th>
                <th className="py-3 px-4 text-right">{t('serviceCharge')}</th>
                <th className="py-3 px-4">{t('date')}</th>
                <th className="py-3 px-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {filteredRecentJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[var(--text-muted)]">
                    {t('noRecordsFound')}
                  </td>
                </tr>
              ) : (
                filteredRecentJobs.map((job) => {
                  const tech = technicians.find((t) => t.id === job.technician_id);
                  const techName = tech?.full_name || job.technician?.full_name || 'Unassigned';

                  return (
                    <tr
                      key={job.id}
                      onClick={() => onOpenJob(job)}
                      className="hover:bg-[var(--surface-2)]/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[var(--primary)]">
                        {job.service_number}
                      </td>
                      <td className="py-3 px-4 font-medium text-[var(--text)]">
                        <div>{job.customer?.name || 'Walk-in'}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{job.device?.model || 'Device'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[var(--text-muted)]">
                        {job.customer?.phone || '-'}
                      </td>
                      <td className="py-3 px-4 text-[var(--text)]">
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <Wrench className="w-3 h-3 text-purple-500" />
                          <span>{techName}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(
                            job.status_id
                          )}`}
                        >
                          {job.status_id}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--text)]">
                        {formatCurrency(job.service_charge || 0)}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-muted)] whitespace-nowrap">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenJob(job);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[var(--surface-2)] hover:bg-[var(--primary)] hover:text-white transition-colors cursor-pointer"
                        >
                          {t('view')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PAYMENT SUMMARY SECTION */}
      {/* Show: Today's Payments, Today's Outstanding Balance, Total Service Charges, Recent Payments */}
      {/* Use the selected currency. Do NOT perform currency conversion. */}
      {/* ============================================================ */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-5">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span>{t('paymentSummary')}</span>
            <span className="text-xs font-normal text-[var(--text-muted)] font-mono">
              (Accounting Currency: <strong className="text-[var(--text)]">{settings.currency || 'MMK'}</strong> · No automatic conversion)
            </span>
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Real-time cashier intake and pending customer repair balances.
          </p>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Today's Payments */}
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 shadow-xs">
            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>{t('todaysPayments')}</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-[var(--text)] tabular-nums mt-1.5">
              {formatCurrency(todayPaymentsSum)}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">
              Recorded in cashier ledger today
            </div>
          </div>

          {/* Today's Outstanding Balance */}
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 shadow-xs">
            <div className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center justify-between">
              <span>{t('todaysOutstanding')}</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400 tabular-nums mt-1.5">
              {formatCurrency(todayOutstandingBalance)}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">
              Unpaid balances on tickets from today
            </div>
          </div>

          {/* Total Service Charges */}
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 shadow-xs">
            <div className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center justify-between">
              <span>{t('totalServiceCharges')}</span>
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-[var(--text)] tabular-nums mt-1.5">
              {formatCurrency(totalServiceCharges)}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">
              Cumulative gross repair charges
            </div>
          </div>
        </div>

        {/* Recent Payments Table */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('recentPayments')}</span>
            <span className="text-[11px] font-normal lowercase font-mono">Original currency & reference retained</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-[var(--surface-2)]/70 text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]">
                  <th className="py-2.5 px-4">Receipt / ID</th>
                  <th className="py-2.5 px-4">{t('serviceNumber')}</th>
                  <th className="py-2.5 px-4">{t('paymentMethod')}</th>
                  <th className="py-2.5 px-4">Reference / Slip</th>
                  <th className="py-2.5 px-4 text-right">{t('paymentAmount')}</th>
                  <th className="py-2.5 px-4">{t('paidAt')}</th>
                  <th className="py-2.5 px-4">{t('receivedBy')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs font-mono">
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[var(--text-muted)] font-sans">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((p) => {
                    const badge = getPaymentBadge(p.payment_method);
                    const job = jobs.find((j) => j.id === p.service_job_id);

                    return (
                      <tr key={p.id} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-[var(--text-muted)]">
                          {p.id}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-[var(--primary)]">
                          {job?.service_number || p.service_job_id}
                        </td>
                        <td className="py-2.5 px-4 font-sans">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[var(--text-muted)]">
                          {p.reference_number || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {/* Historical record currency retention */}
                          {formatCurrency(p.amount, p.currency_code)}
                        </td>
                        <td className="py-2.5 px-4 text-[var(--text-muted)] whitespace-nowrap font-sans">
                          {formatDate(p.paid_at)}
                        </td>
                        <td className="py-2.5 px-4 text-[var(--text)] font-sans">
                          {p.received_by || 'Admin'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QUICK MODALS */}
      {customerModalOpen && (
        <QuickCustomerModal onClose={() => setCustomerModalOpen(false)} />
      )}

      {deviceModalOpen && (
        <QuickDeviceModal onClose={() => setDeviceModalOpen(false)} />
      )}

      {techModalOpen && (
        <QuickTechnicianModal onClose={() => setTechModalOpen(false)} />
      )}

      {assignModalOpen && (
        <AssignTechnicianModal
          onClose={() => setAssignModalOpen(false)}
          onJobSelected={(j) => onOpenJob(j)}
        />
      )}
    </div>
  );
};
