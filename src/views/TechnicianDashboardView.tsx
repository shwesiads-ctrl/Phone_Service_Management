import { getCurrencySymbol } from '../utils/formatters';
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceJob, ServiceStatus, TicketPriority } from '../types';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
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
  Search,
  Filter,
  CheckCircle,
  Package,
  Sparkles,
  Phone,
  User,
  ArrowLeft,
  Flame,
} from 'lucide-react';

interface TechnicianDashboardViewProps {
  onOpenJob: (job: ServiceJob) => void;
}

export const TechnicianDashboardView: React.FC<TechnicianDashboardViewProps> = ({
  onOpenJob,
}) => {
  const {
    role,
    currentUser,
    jobs,
    settings,
    language,
    updateJob,
    navigate,
    setActiveTab,
    formatCurrency,
    formatDate,
    t,
  } = useApp();

  // Filter state for My Service Desk
  const [searchQuery, setSearchQuery] = useState('');
  const [deskStatusFilter, setDeskStatusFilter] = useState<string>('all');
  const [completeToast, setCompleteToast] = useState<string | null>(null);

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

  // STRICT TECHNICIAN ISOLATION:
  // If role is technician, ONLY show jobs where job.technician_id === currentUser.technician_id
  // If role is admin previewing this dashboard, show jobs assigned to currentUser.technician_id (or all/demo)
  const myTechnicianId = currentUser.technician_id;

  const myJobs = useMemo(() => {
    if (role === 'technician') {
      return jobs.filter((j) => j.technician_id === myTechnicianId);
    }
    // If admin is viewing, filter by selected technician or technician_id
    if (myTechnicianId) {
      return jobs.filter((j) => j.technician_id === myTechnicianId);
    }
    return jobs;
  }, [jobs, role, myTechnicianId]);

  // 1. MY JOB SUMMARY CARDS
  // My Assigned Jobs, Diagnosing, Waiting for Parts, Repairing, Ready, Completed
  const myTotalAssigned = myJobs.length;
  const countDiagnosing = myJobs.filter((j) => j.status_id === 'diagnosing').length;
  const countWaitingParts = myJobs.filter((j) => j.status_id === 'waiting_parts').length;
  const countRepairing = myJobs.filter((j) => j.status_id === 'repairing').length;
  const countReady = myJobs.filter((j) => j.status_id === 'ready').length;
  const countCompleted = myJobs.filter(
    (j) => j.status_id === 'completed' || j.status_id === 'delivered'
  ).length;

  // 2. TODAY'S JOBS
  // Jobs assigned to the current Technician today, sorted by Priority (Express, Urgent, Normal), Status, Received Time
  const priorityWeight: Record<TicketPriority, number> = {
    express: 3,
    urgent: 2,
    normal: 1,
  };

  const todaysJobs = useMemo(() => {
    return myJobs
      .filter((j) => isToday(j.created_at))
      .sort((a, b) => {
        // Sort 1: Priority
        const pA = priorityWeight[a.priority] || 1;
        const pB = priorityWeight[b.priority] || 1;
        if (pA !== pB) return pB - pA;

        // Sort 2: Status (active first)
        const statusOrder: Record<string, number> = {
          repairing: 4,
          diagnosing: 3,
          waiting_parts: 2,
          received: 1,
          ready: 0,
          completed: -1,
          delivered: -2,
        };
        const sA = statusOrder[a.status_id] || 0;
        const sB = statusOrder[b.status_id] || 0;
        if (sA !== sB) return sB - sA;

        // Sort 3: Received time (latest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [myJobs]);

  // 3. RECENTLY UPDATED JOBS
  // Show only jobs recently updated by this technician
  const recentlyUpdatedJobs = useMemo(() => {
    return [...myJobs]
      .sort((a, b) => {
        const timeA = new Date(a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.updated_at || b.created_at).getTime();
        return timeB - timeA;
      })
      .slice(0, 4);
  }, [myJobs]);

  // Relative time formatter helper
  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const now = new Date().getTime();
    const past = new Date(dateStr).getTime();
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // 4. MY SERVICE DESK FILTERED JOBS
  const myDeskJobs = useMemo(() => {
    return myJobs.filter((job) => {
      // Status filter
      if (deskStatusFilter === 'in_progress') {
        if (!['diagnosing', 'waiting_parts', 'repairing'].includes(job.status_id)) {
          return false;
        }
      } else if (deskStatusFilter === 'ready') {
        if (job.status_id !== 'ready') return false;
      } else if (deskStatusFilter !== 'all') {
        if (job.status_id !== deskStatusFilter) return false;
      }

      // Search query
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const customerName = job.customer?.name || '';
      const customerPhone = job.customer?.phone || '';
      const deviceModel = job.device?.model || '';
      return (
        job.service_number.toLowerCase().includes(q) ||
        customerName.toLowerCase().includes(q) ||
        customerPhone.toLowerCase().includes(q) ||
        deviceModel.toLowerCase().includes(q) ||
        (job.problem_description && job.problem_description.toLowerCase().includes(q))
      );
    });
  }, [myJobs, deskStatusFilter, searchQuery]);

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

  // Quick Action: Complete Job directly
  const handleQuickComplete = async (job: ServiceJob, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateJob(job.id, {
        status_id: 'completed',
        completion_notes: `Marked completed from Technician Dashboard by @${currentUser.username}`,
      });
      setCompleteToast(`Job ${job.service_number} marked as Completed!`);
      setTimeout(() => setCompleteToast(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const todayDisplay = new Date().toLocaleDateString(
    language === 'th' ? 'th-TH' : language === 'my' ? 'my-MM' : language === 'zh' ? 'zh-CN' : 'en-US',
    {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  );

  const langDisplay =
    language === 'th' ? '🇹🇭 ไทย (Thai)' : language === 'my' ? '🇲🇲 မြန်မာ (Myanmar)' : language === 'zh' ? '🇨🇳 中文 (Chinese)' : '🇬🇧 English';

  const currencyDisplay = `${settings.currency || 'MMK'} / ${
    getCurrencySymbol(settings.currency || 'MMK')
  }`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {completeToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{completeToast}</span>
        </div>
      )}

      {/* Admin viewing technician notice */}
      {role === 'admin' && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <Shield className="w-4 h-4 shrink-0" />
            <span>
              <strong>Admin Mode Notice:</strong> You are currently inspecting the Technician Dashboard preview. Admins are not restricted to this view.
            </span>
          </div>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-xs cursor-pointer w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('returnToAdminDashboard')}</span>
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* HEADER SECTION */}
      {/* Header: My Technician Dashboard, Welcome, {Technician Name} */}
      {/* Show: Today's Date, Current Language, Current Currency */}
      {/* ============================================================ */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Wrench className="w-3.5 h-3.5" />
              <span>{t('technicianDashboard')}</span>
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              Terminal: <code className="text-emerald-500 font-bold">/technician/dashboard</code>
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

        {/* TECHNICIAN QUICK ACTIONS */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setDeskStatusFilter('all');
              const el = document.getElementById('my-service-desk-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{t('myServiceDesk')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDeskStatusFilter('in_progress');
              const el = document.getElementById('my-service-desk-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all cursor-pointer"
          >
            <span>{t('inProgressJobs')} ({countDiagnosing + countWaitingParts + countRepairing})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDeskStatusFilter('ready');
              const el = document.getElementById('my-service-desk-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
          >
            <span>{t('readyForPickup')} ({countReady})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              navigate('records');
              setActiveTab('records');
            }}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition-all cursor-pointer"
          >
            <span>{t('myRepairRecords')}</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MY JOB SUMMARY (6 CARDS STRICTLY ISOLATED TO THIS TECHNICIAN) */}
      {/* My Assigned Jobs, Diagnosing, Waiting for Parts, Repairing, Ready, Completed */}
      {/* ============================================================ */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center justify-between">
          <span>{t('myJobSummary')}</span>
          <span className="text-[11px] font-normal lowercase font-mono">
            Assigned to: {currentUser.full_name} ({currentUser.technician_id || 'Tech'})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. My Assigned Jobs */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('myAssignedJobs')}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-[var(--text)] tabular-nums mt-1">
              {myTotalAssigned}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">
              Total assigned jobs
            </div>
          </div>

          {/* 2. Diagnosing */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('diagnosing')}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-purple-600 dark:text-purple-400 tabular-nums mt-1">
              {countDiagnosing}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">
              Initial check
            </div>
          </div>

          {/* 3. Waiting for Parts */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('waitingForParts')}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400 tabular-nums mt-1">
              {countWaitingParts}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">
              Awaiting parts
            </div>
          </div>

          {/* 4. Repairing */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('repairing')}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400 tabular-nums mt-1">
              {countRepairing}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">
              Under repair
            </div>
          </div>

          {/* 5. Ready */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('ready')}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
              {countReady}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">
              Tested & ready
            </div>
          </div>

          {/* 6. Completed */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('completed')}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400 tabular-nums mt-1">
              {countCompleted}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1">
              Finished repairs
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2-COLUMN SECTION: TODAY'S JOBS & RECENTLY UPDATED */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TODAY'S JOBS */}
        {/* Show jobs assigned to the current Technician today. Sort by: Priority, Status, Received Time */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h2 className="text-base font-bold text-[var(--text)]">
                {t('todaysJobs')} ({todaysJobs.length})
              </h2>
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              Sorted by: Priority → Status → Time
            </span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {todaysJobs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-xl">
                No new jobs were assigned to your bench today.
              </div>
            ) : (
              todaysJobs.map((job) => {
                const isExpress = job.priority === 'express';
                const isUrgent = job.priority === 'urgent';

                return (
                  <div
                    key={job.id}
                    onClick={() => onOpenJob(job)}
                    className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 hover:bg-[var(--surface-2)] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-[var(--primary)]">
                          {job.service_number}
                        </span>

                        {/* Priority Badge */}
                        {isExpress ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            <span>Express</span>
                          </span>
                        ) : isUrgent ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Urgent
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400">
                            Normal
                          </span>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getStatusBadge(
                            job.status_id
                          )}`}
                        >
                          {job.status_id}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-[var(--text)] truncate">
                        {job.device?.model || 'Device'} · {job.customer?.name || 'Walk-in'}
                      </div>

                      <div className="text-[11px] text-[var(--text-muted)] truncate">
                        Problem: {job.problem_description || 'Check hardware issue'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenJob(job);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--surface)] border border-[var(--border)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors shrink-0"
                    >
                      {t('openJob')}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RECENTLY UPDATED */}
        {/* Show only jobs recently updated by this Technician. */}
        {/* Example: SRV-0001 | Status: Repairing | Updated: 10 mins ago | Note: Screen replacement in progress */}
        {/* Actions: [ Update Status ], [ Add Parts ], [ Complete Job ] */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-bold text-[var(--text)]">
                {t('recentlyUpdated')}
              </h2>
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              Bench Activity Stream
            </span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {recentlyUpdatedJobs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-xl">
                No recent technician job updates recorded.
              </div>
            ) : (
              recentlyUpdatedJobs.map((job) => {
                const relativeTime = getRelativeTime(job.updated_at || job.created_at);

                return (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 hover:bg-[var(--surface-2)]/70 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[var(--primary)]">
                          {job.service_number}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getStatusBadge(
                            job.status_id
                          )}`}
                        >
                          {job.status_id}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)] font-mono">
                        Updated: {relativeTime}
                      </span>
                    </div>

                    <div className="text-xs text-[var(--text)]">
                      <strong className="text-[var(--text)]">{job.device?.model || 'Device'}</strong> ({job.customer?.name || 'Walk-in'})
                    </div>

                    <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
                      <span className="font-semibold text-[var(--text)]">Note: </span>
                      <span>
                        {job.repair_notes ||
                          job.diagnosis ||
                          job.problem_description ||
                          'Diagnostics in progress'}
                      </span>
                    </div>

                    {/* Quick action buttons: [ Update Status ], [ Add Parts ], [ Complete Job ] */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onOpenJob(job)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
                      >
                        {t('updateStatus')}
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenJob(job)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                      >
                        {t('addParts')}
                      </button>

                      {job.status_id !== 'completed' && job.status_id !== 'delivered' && (
                        <button
                          type="button"
                          onClick={(e) => handleQuickComplete(job, e)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer"
                        >
                          {t('completeJob')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MY SERVICE DESK SECTION (FULL TABLE STRICTLY ISOLATED) */}
      {/* Show ONLY jobs where: service_jobs.technician_id = current technician id */}
      {/* Columns: Service No, Customer, Phone, Problem, Status, Date, Action [ Open Job ] */}
      {/* ============================================================ */}
      <div
        id="my-service-desk-section"
        className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[var(--primary)]" />
              <span>{t('myServiceDesk')}</span>
              <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Strict Technician Isolation: {currentUser.full_name} ({myDeskJobs.length} jobs)
              </span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Only repairs explicitly assigned to your ID are listed. No other technician orders are accessible.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setDeskStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                deskStatusFilter === 'all'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              All ({myJobs.length})
            </button>

            <button
              onClick={() => setDeskStatusFilter('repairing')}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                deskStatusFilter === 'repairing'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Repairing ({countRepairing})
            </button>

            <button
              onClick={() => setDeskStatusFilter('ready')}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                deskStatusFilter === 'ready'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              Ready ({countReady})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Service No, Customer name, Phone, or Problem..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        {/* Table: Service No, Customer, Phone, Problem, Status, Date, Action */}
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[var(--surface-2)]/70 text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="py-3 px-4">{t('serviceNumber')}</th>
                <th className="py-3 px-4">{t('customer')}</th>
                <th className="py-3 px-4">{t('phone')}</th>
                <th className="py-3 px-4">{t('problem')}</th>
                <th className="py-3 px-4">{t('status')}</th>
                <th className="py-3 px-4">{t('date')}</th>
                <th className="py-3 px-4 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {myDeskJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                    {t('noRecordsFound')}
                  </td>
                </tr>
              ) : (
                myDeskJobs.map((job) => (
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
                    <td className="py-3 px-4 text-[var(--text)] max-w-xs truncate">
                      {job.problem_description || 'General repair'}
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
                        className="px-3 py-1 text-[11px] font-bold rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
                      >
                        {t('openJob')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
