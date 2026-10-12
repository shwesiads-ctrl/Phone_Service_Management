import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceJob, ServiceStatus } from '../types';
import {
  Search,
  Plus,
  Filter,
  Eye,
  Printer,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Smartphone,
  User,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface ServiceViewProps {
  onOpenJob: (job: ServiceJob) => void;
  onNewJob: () => void;
  onPrintReceipt: (job: ServiceJob) => void;
}

export const ServiceView: React.FC<ServiceViewProps> = ({
  onOpenJob,
  onNewJob,
  onPrintReceipt,
}) => {
  const {
    searchQuery: search,
    setSearchQuery: setSearch,
    role,
    jobs,
    technicians,
    currentUser,
    reassignJob,
    formatCurrency,
    formatDate,
    t,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // If role is technician, strictly isolated
  const baseJobs =
    role === 'technician'
      ? jobs.filter((j) => j.technician_id === currentUser.technician_id)
      : jobs;

  // Filter jobs
  const filteredJobs = baseJobs.filter((job) => {
    // Status filter
    if (statusFilter !== 'all' && job.status_id !== statusFilter) return false;

    // Technician filter (for Admin)
    if (role === 'admin' && techFilter !== 'all' && job.technician_id !== techFilter) {
      return false;
    }

    // Date filters
    if (dateFrom && job.created_at.slice(0, 10) < dateFrom) return false;
    if (dateTo && job.created_at.slice(0, 10) > dateTo) return false;

    // Search query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchSrv = job.service_number.toLowerCase().includes(q);
      const matchCust = (job.customer?.name || '').toLowerCase().includes(q);
      const matchPhone = (job.customer?.phone || '').toLowerCase().includes(q);
      const matchDevice = `${job.device?.brand || ''} ${job.device?.model || ''}`.toLowerCase().includes(q);
      const matchSerial = (job.device?.serial_or_imei || '').toLowerCase().includes(q);
      return matchSrv || matchCust || matchPhone || matchDevice || matchSerial;
    }

    return true;
  });

  const page = usePagination(filteredJobs, JSON.stringify([search, statusFilter, techFilter, dateFrom, dateTo, currentUser?.id]));

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

  const statuses = [
    { value: 'all', label: t('filterAll') },
    { value: 'received', label: t('status_received') },
    { value: 'diagnosing', label: t('status_diagnosing') },
    { value: 'waiting_parts', label: t('status_waiting_parts') },
    { value: 'repairing', label: t('status_repairing') },
    { value: 'ready', label: t('status_ready') },
    { value: 'completed', label: t('status_completed') },
    { value: 'delivered', label: t('status_delivered') },
    { value: 'cancelled', label: t('status_cancelled') },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
            {role === 'technician' ? t('myServices') : t('service')}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            {filteredJobs.length} service records found in relational database
          </p>
        </div>

        {['admin','cashier'].includes(role) && (
          <button
            onClick={onNewJob}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newTicket')}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Panel */}
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search service jobs" placeholder="Search Service Number, Customer, Phone, IMEI..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Filter by Technician (Admin only) */}
          {role === 'admin' ? (
            <div>
              <select
                value={techFilter}
                onChange={(e) => setTechFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] cursor-pointer"
                title={t('filterByTechnician')}
              >
                <option value="all">{t('filterByTechnician')}: All</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.full_name} ({tech.id})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-xs text-[var(--text-muted)] flex items-center px-3 py-2 bg-[var(--surface-2)] rounded-lg font-mono">
              Assigned: {currentUser.full_name}
            </div>
          )}

          {/* Filter by Date */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From"
              className="w-full px-2.5 py-2 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              title="Date From"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="text-xs text-[var(--primary)] hover:underline cursor-pointer shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Status Horizontal Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {statuses.map((st) => (
            <button
              key={st.value}
              onClick={() => setStatusFilter(st.value)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st.value
                  ? 'bg-[var(--primary)] text-white shadow-xs font-semibold'
                  : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* SERVICE HISTORY TABLE */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="font-bold text-sm text-[var(--text)] uppercase tracking-wider">
            {t('serviceHistory')}
          </h3>
          <span className="text-xs font-mono text-[var(--text-muted)]">
            Relational Foreign Key Linked
          </span>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench className="w-10 h-10 mx-auto text-[var(--text-muted)] opacity-40 mb-3" />
            <h3 className="text-base font-semibold text-[var(--text)]">{t('noRecordsFound')}</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              No jobs match your filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-2)] text-[var(--text-muted)] text-xs border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3 font-semibold">{t('serviceNumber')}</th>
                  <th className="px-4 py-3 font-semibold">{t('device')}</th>
                  <th className="px-4 py-3 font-semibold">{t('customer')}</th>
                  <th className="px-4 py-3 font-semibold">{t('status')}</th>
                  <th className="px-4 py-3 font-semibold">{t('technician')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('serviceCharge')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('date')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                {page.items.map((job, rowIndex) => {
                  const tech =
                    job.technician ||
                    technicians.find((t) => t.id === job.technician_id);
                  const techName = tech ? tech.full_name : 'Unassigned';

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-[var(--surface-2)]/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-[var(--text-muted)]">{page.offset + rowIndex + 1}</td>
                      {/* Service No */}
                      <td className="px-4 py-3 font-mono font-bold text-xs text-[var(--primary)] whitespace-nowrap">
                        {job.service_number}
                      </td>

                      {/* Phone / Device */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-xs sm:text-sm">
                          {job.device ? `${job.device.brand} ${job.device.model}` : 'Phone Device'}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono truncate max-w-[150px]">
                          {job.device?.serial_or_imei || 'No IMEI'}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-semibold">{job.customer?.name}</div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono">
                          {job.customer?.phone}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs border font-bold ${getStatusBadge(
                            job.status_id
                          )}`}
                        >
                          {t(`status_${job.status_id}` as any)}
                        </span>
                      </td>

                      {/* Technician (Mandatory Relationship) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {role === 'admin' ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={job.technician_id}
                              onChange={(e) => reassignJob(job.id, e.target.value)}
                              className="text-xs font-semibold bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] cursor-pointer"
                              title="Reassign Technician"
                            >
                              {technicians.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.full_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-[var(--text)]">
                            {techName}
                          </span>
                        )}
                      </td>

                      {/* Financial Charges & Payment Status */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="font-mono tabular-nums text-xs sm:text-sm font-bold text-[var(--text)]">
                          {formatCurrency(job.total_cost || job.service_charge)}
                        </div>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                              job.payment_status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : job.payment_status === 'partial'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                            }`}
                          >
                            {job.payment_status || 'unpaid'}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">
                            Paid: {formatCurrency(job.amount_paid)}
                          </span>
                        </div>
                      </td>

                      {/* Received Date */}
                      <td className="px-4 py-3 text-right whitespace-nowrap text-xs text-[var(--text-muted)] font-mono tabular-nums">
                        {formatDate(job.received_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => onPrintReceipt(job)}
                          className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                          title={t('printReceipt')}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
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
        )}
        <Pagination {...page} />
      </div>
    </div>
  );
};
