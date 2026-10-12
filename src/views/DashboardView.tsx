import React from 'react';
import { useApp } from '../context/AppContext';
import { ServiceJob, ServiceStatus } from '../types';
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
} from 'lucide-react';

interface DashboardViewProps {
  onOpenJob: (job: ServiceJob) => void;
  onNewJob: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenJob, onNewJob }) => {
  const {
    role,
    currentUser,
    jobs,
    technicians,
    customers,
    setActiveTab,
    formatCurrency,
    formatDate,
    t,
  } = useApp();

  // If technician, restrict to strictly jobs assigned to their technician_id
  const relevantJobs =
    role === 'technician'
      ? jobs.filter((j) => j.technician_id === currentUser.technician_id)
      : jobs;

  const totalAssigned = relevantJobs.length;
  const countDiagnosing = relevantJobs.filter((j) => j.status_id === 'diagnosing').length;
  const countRepairing = relevantJobs.filter((j) => j.status_id === 'repairing').length;
  const countWaitingParts = relevantJobs.filter((j) => j.status_id === 'waiting_parts').length;
  const countReady = relevantJobs.filter((j) => j.status_id === 'ready').length;
  const countCompleted = relevantJobs.filter((j) => j.status_id === 'completed' || j.status_id === 'delivered').length;

  const totalRevenue = relevantJobs.reduce((sum, j) => sum + (j.service_charge || 0), 0);

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

  const recentJobs = [...relevantJobs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase">
              {role === 'admin' ? 'Administrator Bay' : 'Technician Terminal'}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">
              User: @{currentUser.username}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight mt-1.5">
            {role === 'technician' ? t('myServiceDesk') : t('dashboard')}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            {role === 'technician'
              ? `Real-time workbench overview for ${currentUser.full_name}. Only your assigned repair jobs are shown.`
              : 'Real-time overview of technicians, repair jobs, and workshop revenue.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role === 'admin' ? (
            <button
              onClick={onNewJob}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('newTicket')}</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('service')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <span>{t('myServiceDesk')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Assigned Jobs
          </div>
          <div className="text-2xl font-black font-mono text-[var(--text)] tabular-nums mt-1">
            {totalAssigned}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Diagnosing
          </div>
          <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400 tabular-nums mt-1">
            {countDiagnosing}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Repairing
          </div>
          <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 tabular-nums mt-1">
            {countRepairing}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Waiting Parts
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 tabular-nums mt-1">
            {countWaitingParts}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Ready
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {countReady}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Completed
          </div>
          <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 tabular-nums mt-1">
            {countCompleted}
          </div>
        </div>
      </div>

      {/* Technician Workload Overview (Admin Only) */}
      {role === 'admin' && (
        <div className="p-5 sm:p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--text)] uppercase tracking-wider">
                {t('technicianWorkload')} (Active Benches)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Assigned repair queues across workshop engineers
              </p>
            </div>

            <button
              onClick={() => setActiveTab('technicians')}
              className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Technicians</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {technicians.map((tech) => {
              const techJobs = jobs.filter((j) => j.technician_id === tech.id);
              const activeCount = techJobs.filter(
                (j) => !['completed', 'delivered', 'cancelled'].includes(j.status_id)
              ).length;
              return (
                <div
                  key={tech.id}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-[var(--text)]">{tech.full_name}</div>
                      <div className="text-xs text-[var(--text-muted)] font-mono">{tech.id}</div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        tech.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      }`}
                    >
                      {tech.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Active Repair Jobs:</span>
                    <span className="font-black font-mono text-[var(--primary)] tabular-nums">
                      {activeCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Service Jobs Table */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[var(--text)] uppercase tracking-wider">
              {role === 'technician' ? 'My Recent Assigned Jobs' : 'Recent Service Jobs'}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Latest repairs in workshop database
            </p>
          </div>

          <button
            onClick={() => setActiveTab('service')}
            className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-2)] text-[var(--text-muted)] text-xs border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('serviceNumber')}</th>
                <th className="px-4 py-3 font-semibold">{t('device')}</th>
                <th className="px-4 py-3 font-semibold">{t('customer')}</th>
                <th className="px-4 py-3 font-semibold">{t('status')}</th>
                <th className="px-4 py-3 font-semibold">{t('technician')}</th>
                <th className="px-4 py-3 font-semibold text-right">{t('serviceCharge')}</th>
                <th className="px-4 py-3 font-semibold text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
              {recentJobs.map((job) => {
                const tech =
                  job.technician ||
                  technicians.find((t) => t.id === job.technician_id);
                const techName = tech ? tech.full_name : 'Technician';

                return (
                  <tr key={job.id} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-xs text-[var(--primary)] whitespace-nowrap">
                      {job.service_number}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap font-medium text-xs sm:text-sm">
                      {job.device ? `${job.device.brand} ${job.device.model}` : 'Phone Device'}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold">
                      {job.customer?.name}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-xs border font-bold ${getStatusBadge(
                          job.status_id
                        )}`}
                      >
                        {t(`status_${job.status_id}` as any)}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-[var(--text)]">
                      {techName}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap font-mono font-bold text-xs sm:text-sm">
                      {formatCurrency(job.service_charge)}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onOpenJob(job)}
                        className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                        title={t('view')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
