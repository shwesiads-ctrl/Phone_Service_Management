import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceJob, ServiceStatus } from '../types';
import {
  Wrench,
  Search,
  Filter,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Smartphone,
  Tag,
  DollarSign,
  ShieldCheck,
  Eye,
} from 'lucide-react';

interface TechnicianDeskViewProps {
  onOpenJob: (job: ServiceJob) => void;
}

export const TechnicianDeskView: React.FC<TechnicianDeskViewProps> = ({ onOpenJob }) => {
  const {
    jobs,
    currentUser,
    role,
    technicians,
    updateJob,
    formatCurrency,
    formatDate,
    t,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // If role is technician, strictly show jobs assigned to current user's technician_id.
  // If role is admin, show desk for selected technician or current view
  const myAssignedJobs =
    role === 'technician'
      ? jobs.filter((j) => j.technician_id === currentUser.technician_id)
      : jobs;

  // Counts by status
  const totalAssigned = myAssignedJobs.length;
  const countDiagnosing = myAssignedJobs.filter((j) => j.status_id === 'diagnosing').length;
  const countRepairing = myAssignedJobs.filter((j) => j.status_id === 'repairing').length;
  const countWaitingParts = myAssignedJobs.filter((j) => j.status_id === 'waiting_parts').length;
  const countReady = myAssignedJobs.filter((j) => j.status_id === 'ready').length;
  const countCompleted = myAssignedJobs.filter((j) => j.status_id === 'completed').length;
  const countReceived = myAssignedJobs.filter((j) => j.status_id === 'received').length;

  // Filter jobs
  const filteredJobs = myAssignedJobs.filter((job) => {
    // Status filter
    if (statusFilter !== 'all' && job.status_id !== statusFilter) return false;

    // Date filter
    if (dateFilter) {
      const jobDate = job.created_at.slice(0, 10);
      if (jobDate !== dateFilter) return false;
    }

    // Search query (Service Number, Customer, Phone)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSrv = job.service_number.toLowerCase().includes(q);
      const matchCust = (job.customer?.name || '').toLowerCase().includes(q);
      const matchPhone = `${job.device?.brand || ''} ${job.device?.model || ''}`.toLowerCase().includes(q);
      const matchProblem = job.problem_description.toLowerCase().includes(q);
      return matchSrv || matchCust || matchPhone || matchProblem;
    }

    return true;
  });

  const filterTabs: { key: string; label: string; count?: number }[] = [
    { key: 'all', label: t('filterAll'), count: totalAssigned },
    { key: 'received', label: t('status_received'), count: countReceived },
    { key: 'diagnosing', label: t('status_diagnosing'), count: countDiagnosing },
    { key: 'waiting_parts', label: t('status_waiting_parts'), count: countWaitingParts },
    { key: 'repairing', label: t('status_repairing'), count: countRepairing },
    { key: 'ready', label: t('status_ready'), count: countReady },
    { key: 'completed', label: t('status_completed'), count: countCompleted },
    { key: 'delivered', label: t('status_delivered') },
    { key: 'cancelled', label: t('status_cancelled') },
  ];

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'received':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      case 'diagnosing':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'waiting_parts':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'repairing':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'ready':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'completed':
      case 'delivered':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const currentTechName =
    currentUser.full_name ||
    technicians.find((t) => t.id === currentUser.technician_id)?.full_name ||
    'Assigned Technician';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner: My Service Desk */}
      <div className="p-5 sm:p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Bench Terminal
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              ID: {currentUser.technician_id || 'ADMIN'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight mt-1">
            {t('myServiceDesk')}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            Workbench assigned to: <strong className="text-[var(--text)]">{currentTechName}</strong>. Strictly isolated to your repair bench.
          </p>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <div className="px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-sans">
              Assigned Jobs
            </span>
            <span className="text-lg font-bold text-[var(--text)] tabular-nums">
              {totalAssigned}
            </span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-sans">
              Repairing
            </span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {countRepairing}
            </span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
            <span className="text-[var(--text-muted)] block text-[10px] uppercase font-sans">
              Ready
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {countReady}
            </span>
          </div>
        </div>
      </div>

      {/* Structured Stats Dashboard (as requested in specification) */}
      <div className="p-4 sm:p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          Workbench Status Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30">
            <div className="text-[11px] text-[var(--text-muted)]">{t('status_diagnosing')}</div>
            <div className="text-xl font-bold font-mono text-[var(--text)] mt-1 tabular-nums">
              {countDiagnosing}
            </div>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30">
            <div className="text-[11px] text-[var(--text-muted)]">{t('status_repairing')}</div>
            <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
              {countRepairing}
            </div>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30">
            <div className="text-[11px] text-[var(--text-muted)]">{t('status_waiting_parts')}</div>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
              {countWaitingParts}
            </div>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30">
            <div className="text-[11px] text-[var(--text-muted)]">{t('status_ready')}</div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {countReady}
            </div>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30">
            <div className="text-[11px] text-[var(--text-muted)]">{t('status_completed')}</div>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
              {countCompleted}
            </div>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30">
            <div className="text-[11px] text-[var(--text-muted)]">{t('status_received')}</div>
            <div className="text-xl font-bold font-mono text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
              {countReceived}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Service Number, Customer, Phone, Problem..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              title="Filter by Intake Date"
              className="px-3 py-2 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-[var(--primary)] hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-[var(--primary)] text-white shadow-xs font-semibold'
                  : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="ml-1.5 opacity-80 font-mono">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* JOB CARDS GRID (as specified in UI requirement) */}
      {filteredJobs.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <Wrench className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-40 mb-3" />
          <h3 className="text-base font-semibold text-[var(--text)]">{t('noRecordsFound')}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            No service jobs assigned to your technician desk match the active filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => {
            const techName =
              job.technician?.full_name ||
              technicians.find((t) => t.id === job.technician_id)?.full_name ||
              'Technician';

            const phoneName = job.device ? `${job.device.brand} ${job.device.model}` : 'Phone Device';
            const customerName = job.customer?.name || 'Customer';

            return (
              <div
                key={job.id}
                className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/60 transition-all flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div>
                  {/* Card Header: Service No & Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                        Service No
                      </span>
                      <span className="font-mono text-sm font-black text-[var(--primary)] tracking-wide">
                        {job.service_number}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold border ${getStatusBadge(
                        job.status_id
                      )}`}
                    >
                      {t(`status_${job.status_id}` as any)}
                    </span>
                  </div>

                  {/* Customer & Phone info */}
                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] block">
                        {t('customer')}
                      </span>
                      <div className="font-bold text-sm text-[var(--text)]">
                        {customerName}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] block">
                        {t('phone')}
                      </span>
                      <div className="font-semibold text-xs text-[var(--text)] flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{phoneName}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] block">
                        {t('problem')}
                      </span>
                      <div className="text-xs text-[var(--text)] line-clamp-2 bg-[var(--surface-2)]/40 p-2 rounded border border-[var(--border)] leading-relaxed">
                        {job.problem_description}
                      </div>
                    </div>

                    {/* Technician Name (Derived from relationship) */}
                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">Technician:</span>
                      <span className="font-bold text-[var(--text)]">{techName}</span>
                    </div>

                    {/* Financial summary */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">Service Charge:</span>
                      <span className="font-mono font-bold text-[var(--text)]">
                        {formatCurrency(job.service_charge)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Workflow Action & Open Job Buttons */}
                <div className="pt-3 border-t border-[var(--border)] space-y-2">
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {job.status_id === 'received' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await updateJob(job.id, { status_id: 'diagnosing' });
                        }}
                        className="py-1 px-2 rounded font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 cursor-pointer"
                      >
                        → Diagnosing
                      </button>
                    )}

                    {(job.status_id === 'diagnosing' || job.status_id === 'waiting_parts') && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await updateJob(job.id, { status_id: 'repairing' });
                        }}
                        className="py-1 px-2 rounded font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 cursor-pointer"
                      >
                        → Repairing
                      </button>
                    )}

                    {job.status_id === 'repairing' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await updateJob(job.id, { status_id: 'waiting_parts' });
                        }}
                        className="py-1 px-2 rounded font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer"
                      >
                        Wait Parts
                      </button>
                    )}

                    {(job.status_id === 'repairing' || job.status_id === 'diagnosing') && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await updateJob(job.id, { status_id: 'ready' });
                        }}
                        className="py-1 px-2 rounded font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer"
                      >
                        ✓ Mark Ready
                      </button>
                    )}

                    {job.status_id === 'ready' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await updateJob(job.id, { status_id: 'completed' });
                        }}
                        className="py-1 px-2 rounded font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer"
                      >
                        ✓ Complete
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenJob(job)}
                    className="w-full py-2 px-3 text-xs font-bold rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                  >
                    <Eye className="w-4 h-4" />
                    <span>[ {t('openJob')} ]</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
