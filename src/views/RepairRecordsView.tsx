import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceJob, ServiceStatus } from '../types';
import {
  FileText,
  Printer,
  Search,
  Filter,
  Calendar,
  User,
  Smartphone,
  Wrench,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  ChevronRight,
  Eye,
  Check,
  X,
  AlertCircle,
  Hash,
  DollarSign,
  Cpu,
} from 'lucide-react';

interface RepairRecordsViewProps {
  onOpenJob: (job: ServiceJob) => void;
}

export const RepairRecordsView: React.FC<RepairRecordsViewProps> = ({ onOpenJob }) => {
  const {
    role,
    currentUser,
    jobs,
    technicians,
    settings,
    currency,
    formatCurrency,
    formatDate,
    t,
  } = useApp();

  const isTechnician = role === 'technician';
  const myTechnicianId = currentUser.technician_id;

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechId, setSelectedTechId] = useState<string>(isTechnician && myTechnicianId ? myTechnicianId : 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateFilterPreset, setDateFilterPreset] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');

  // Print modal states
  const [printRecordJob, setPrintRecordJob] = useState<ServiceJob | null>(null);
  const [printReportType, setPrintReportType] = useState<'individual' | 'service_history' | 'date_range' | 'technician' | null>(null);

  // Apply Role Isolation: Technician can ONLY view their assigned jobs
  const baseJobs = useMemo(() => {
    if (isTechnician) {
      return jobs.filter((j) => j.technician_id === myTechnicianId);
    }
    return jobs;
  }, [jobs, isTechnician, myTechnicianId]);

  // Date preset helper
  const handlePresetChange = (preset: 'all' | 'today' | 'week' | 'month' | 'custom') => {
    setDateFilterPreset(preset);
    const now = new Date();
    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    } else if (preset === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      setDateFrom(startOfWeek.toISOString().slice(0, 10));
      setDateTo(now.toISOString().slice(0, 10));
    } else if (preset === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateFrom(startOfMonth.toISOString().slice(0, 10));
      setDateTo(now.toISOString().slice(0, 10));
    }
  };

  // Filtered jobs list
  const filteredJobs = useMemo(() => {
    return baseJobs.filter((job) => {
      // Technician filter (for admin)
      if (!isTechnician && selectedTechId !== 'all' && job.technician_id !== selectedTechId) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && job.status_id !== selectedStatus) {
        return false;
      }
      // Date range filter
      if (dateFrom && job.created_at.slice(0, 10) < dateFrom) {
        return false;
      }
      if (dateTo && job.created_at.slice(0, 10) > dateTo) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = job.service_number.toLowerCase().includes(q);
        const matchCustName = (job.customer?.name || '').toLowerCase().includes(q);
        const matchCustPhone = (job.customer?.phone || '').toLowerCase().includes(q);
        const matchBrand = (job.device?.brand || '').toLowerCase().includes(q);
        const matchModel = (job.device?.model || '').toLowerCase().includes(q);
        const matchImei = (job.device?.serial_or_imei || '').toLowerCase().includes(q);
        const matchProblem = job.problem_description.toLowerCase().includes(q);
        const matchTech = (job.technician?.full_name || '').toLowerCase().includes(q);
        if (
          !matchNumber &&
          !matchCustName &&
          !matchCustPhone &&
          !matchBrand &&
          !matchModel &&
          !matchImei &&
          !matchProblem &&
          !matchTech
        ) {
          return false;
        }
      }
      return true;
    });
  }, [baseJobs, isTechnician, selectedTechId, selectedStatus, dateFrom, dateTo, searchQuery]);

  // Statistics
  const totalRepairCount = filteredJobs.length;
  const totalServiceCharges = filteredJobs.reduce((sum, j) => sum + (j.service_charge || 0), 0);
  const totalPartsCost = filteredJobs.reduce((sum, j) => sum + (j.parts_cost || 0), 0);
  const totalRevenue = filteredJobs.reduce((sum, j) => sum + (j.total_cost || 0), 0);

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'received':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">{t('status_received')}</span>;
      case 'diagnosing':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">{t('status_diagnosing')}</span>;
      case 'waiting_parts':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">{t('status_waiting_parts')}</span>;
      case 'repairing':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">{t('status_repairing')}</span>;
      case 'ready':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">{t('status_ready')}</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">{t('status_completed')}</span>;
      case 'delivered':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">{t('status_delivered')}</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">{t('status_cancelled')}</span>;
      default:
        return null;
    }
  };

  const handlePrintIndividual = (job: ServiceJob) => {
    setPrintRecordJob(job);
    setPrintReportType('individual');
  };

  const handlePrintReport = (type: 'service_history' | 'date_range' | 'technician') => {
    setPrintReportType(type);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
              {isTechnician ? t('myRepairRecords') : t('repairRecords')}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
              {totalRepairCount} Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            {isTechnician
              ? 'Complete repair workmanship history and hardware notes for your assigned jobs'
              : 'Complete workshop repair archive with hardware diagnostics, parts, technicians, and charges'}
          </p>
        </div>

        {/* Print Report Actions (Admin only or restricted individual print for tech) */}
        <div className="flex flex-wrap items-center gap-2">
          {!isTechnician && (
            <>
              <button
                onClick={() => handlePrintReport('service_history')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>Print History</span>
              </button>

              <button
                onClick={() => handlePrintReport('date_range')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] transition-colors cursor-pointer shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Date Range Report</span>
              </button>

              <button
                onClick={() => handlePrintReport('technician')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors cursor-pointer shadow-xs"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Technician Report</span>
              </button>
            </>
          )}

          {isTechnician && (
            <button
              onClick={() => handlePrintReport('service_history')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print My History</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
            <span>Total Records</span>
            <FileText className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[var(--text)] mt-1.5 font-mono">
            {totalRepairCount}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {filteredJobs.filter((j) => j.status_id === 'completed' || j.status_id === 'delivered').length} Completed
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
            <span>Labor Charges</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[var(--text)] mt-1.5 font-mono truncate">
            {formatCurrency(totalServiceCharges)}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            Workmanship service fees
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
            <span>Parts Cost</span>
            <Cpu className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[var(--text)] mt-1.5 font-mono truncate">
            {formatCurrency(totalPartsCost)}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            Replaced hardware parts
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
            <span>Total Value</span>
            <Shield className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono truncate">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
            Labor + Hardware Parts
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3 shadow-xs">
        {/* Row 1: Search and Presets */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Service No, Customer, Phone, IMEI, Device Model, Problem, Technician..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-bold text-[var(--text-muted)] shrink-0 mr-1">Period:</span>
            {(['all', 'today', 'week', 'month', 'custom'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetChange(preset)}
                className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-colors cursor-pointer shrink-0 text-xs ${
                  dateFilterPreset === preset
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {preset === 'all' ? 'All Time' : preset === 'today' ? 'Today' : preset === 'week' ? 'This Week' : preset === 'month' ? 'This Month' : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-[var(--border)] text-xs">
          {!isTechnician && (
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">
                Technician
              </label>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-semibold cursor-pointer"
              >
                <option value="all">All Technicians</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">
              Workflow Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-semibold cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="received">{t('status_received')}</option>
              <option value="diagnosing">{t('status_diagnosing')}</option>
              <option value="waiting_parts">{t('status_waiting_parts')}</option>
              <option value="repairing">{t('status_repairing')}</option>
              <option value="ready">{t('status_ready')}</option>
              <option value="completed">{t('status_completed')}</option>
              <option value="delivered">{t('status_delivered')}</option>
              <option value="cancelled">{t('status_cancelled')}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setDateFilterPreset('custom');
              }}
              className="w-full px-2.5 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setDateFilterPreset('custom');
              }}
              className="w-full px-2.5 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono"
            />
          </div>
        </div>
      </div>

      {/* Repair Records Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[var(--surface-2)]/60 text-[var(--text-muted)] uppercase text-[10px] sm:text-xs font-bold border-b border-[var(--border)]">
              <tr>
                <th className="py-3 px-4">Service Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Device & IMEI</th>
                <th className="py-3 px-4">Assigned Technician</th>
                <th className="py-3 px-4">Diagnosis / Notes</th>
                <th className="py-3 px-4">Parts Used</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Service Charge</th>
                <th className="py-3 px-4 text-center">Warranty</th>
                <th className="py-3 px-4">Received / Done</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[var(--text-muted)]">
                    <FileText className="w-8 h-8 mx-auto opacity-30 mb-2" />
                    <p className="font-semibold text-sm">No service repair records match criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const assignedTech = technicians.find((t) => t.id === job.technician_id) || job.technician;
                  const partsCount = (job.parts_used || []).length;
                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-[var(--surface-2)]/40 transition-colors"
                    >
                      {/* Service Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[var(--primary)] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{job.service_number}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-[var(--text)]">{job.customer?.name}</div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono">{job.customer?.phone}</div>
                      </td>

                      {/* Device & IMEI */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[var(--text)] whitespace-nowrap">
                          {job.device ? `${job.device.brand} ${job.device.model}` : 'Unknown Device'}
                        </div>
                        {job.device?.serial_or_imei && (
                          <div className="text-[10px] font-mono text-[var(--text-muted)] truncate max-w-[140px]">
                            IMEI: {job.device.serial_or_imei}
                          </div>
                        )}
                      </td>

                      {/* Assigned Technician - MANDATORY ON RECORD */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-semibold text-[var(--text)]">
                          <Wrench className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{assignedTech?.full_name || 'Assigned Tech'}</span>
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono pl-5">
                          ID: {job.technician_id}
                        </div>
                      </td>

                      {/* Diagnosis & Repair Notes */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {job.diagnosis ? (
                          <div className="truncate text-[11px] text-[var(--text)] font-medium" title={job.diagnosis}>
                            {job.diagnosis}
                          </div>
                        ) : (
                          <div className="truncate text-[11px] text-[var(--text-muted)] italic" title={job.problem_description}>
                            {job.problem_description}
                          </div>
                        )}
                        {job.repair_notes && (
                          <div className="truncate text-[10px] text-blue-600 dark:text-blue-400 font-mono" title={job.repair_notes}>
                            Rep: {job.repair_notes}
                          </div>
                        )}
                      </td>

                      {/* Parts Used */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {partsCount > 0 ? (
                          <div>
                            <span className="font-bold text-xs text-purple-600 dark:text-purple-400">
                              {partsCount} part{partsCount > 1 ? 's' : ''}
                            </span>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">
                              {formatCurrency(job.parts_cost)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--text-muted)] italic">None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(job.status_id)}
                      </td>

                      {/* Service Charge */}
                      <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                        <div className="font-bold text-[var(--text)]">
                          {formatCurrency(job.service_charge)}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          Tot: {formatCurrency(job.total_cost)}
                        </div>
                      </td>

                      {/* Warranty */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]">
                          {job.warranty_days || 30}d
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px]">
                        <div className="text-[var(--text)]">Rec: {formatDate(job.received_at || job.created_at)}</div>
                        {job.completed_at && (
                          <div className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                            Done: {formatDate(job.completed_at)}
                          </div>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenJob(job)}
                            className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)] cursor-pointer"
                            title="View / Edit Record"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePrintIndividual(job)}
                            className="p-1.5 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] cursor-pointer shadow-xs"
                            title="Print Individual Repair Record"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
      {/* PRINT MODAL: INDIVIDUAL REPAIR RECORD & REPORT PRINT ENGINE  */}
      {/* ============================================================ */}
      {printReportType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
            {/* Modal Controls Header (Not in print layout) */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-2)]/30 flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[var(--primary)]" />
                <span className="font-bold text-sm text-[var(--text)]">
                  {printReportType === 'individual' && 'Print Individual Service Repair Record'}
                  {printReportType === 'service_history' && 'Print Service History Report'}
                  {printReportType === 'date_range' && `Print Date Range Repair Report (${dateFrom || 'All'} - ${dateTo || 'All'})`}
                  {printReportType === 'technician' && 'Print Technician Repair Performance Report'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => {
                    setPrintReportType(null);
                    setPrintRecordJob(null);
                  }}
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Area */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0 print:m-0 print:overflow-visible">
              {/* PRINT TYPE 1: INDIVIDUAL REPAIR RECORD */}
              {printReportType === 'individual' && printRecordJob && (
                <div className="max-w-3xl mx-auto space-y-6 text-slate-800 text-xs">
                  {/* Document Header */}
                  <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                    <div>
                      <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                        {settings.shopName || 'Hacked Shop'}
                      </h1>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {settings.address || 'Naypyitaw (Myanmar)'}
                      </p>
                      <p className="text-xs text-slate-600">
                        Phone: {settings.phone || '+95 9256060722'} · Email: {settings.email || 'shwetaythan@gmail.com'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-mono font-bold text-sm">
                        REPAIR RECORD
                      </span>
                      <div className="font-mono text-base font-black text-slate-900 mt-1">
                        {printRecordJob.service_number}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Date: {formatDate(printRecordJob.received_at || printRecordJob.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Customer, Device & Assigned Technician Grid */}
                  <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Customer Details
                      </div>
                      <div className="font-bold text-sm text-slate-900">{printRecordJob.customer?.name}</div>
                      <div className="text-xs text-slate-600 font-mono">{printRecordJob.customer?.phone}</div>
                      {printRecordJob.customer?.address && (
                        <div className="text-[11px] text-slate-500">{printRecordJob.customer.address}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Device Specification
                      </div>
                      <div className="font-bold text-sm text-slate-900">
                        {printRecordJob.device?.brand} {printRecordJob.device?.model}
                      </div>
                      {printRecordJob.device?.serial_or_imei && (
                        <div className="text-xs font-mono text-slate-600">
                          IMEI/SN: {printRecordJob.device.serial_or_imei}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500">
                        Status: <strong className="uppercase">{printRecordJob.status_id}</strong>
                      </div>
                    </div>

                    <div className="border-l border-slate-200 pl-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Assigned Technician
                      </div>
                      {/* MANDATORY: Technician name MUST appear on the repair record */}
                      <div className="font-black text-sm text-blue-900 flex items-center gap-1">
                        <span>{printRecordJob.technician?.full_name || technicians.find((t) => t.id === printRecordJob.technician_id)?.full_name || 'Lead Specialist'}</span>
                      </div>
                      <div className="text-xs text-slate-600 font-mono">
                        Workbench ID: {printRecordJob.technician_id}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Warranty: {printRecordJob.warranty_days || 30} Days Service Warranty
                      </div>
                    </div>
                  </div>

                  {/* Diagnostics & Workmanship Details */}
                  <div className="space-y-3">
                    <div className="border border-slate-200 rounded-lg p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Customer Reported Problem</div>
                      <div className="text-xs text-slate-800">{printRecordJob.problem_description}</div>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Technician Diagnosis</div>
                      <div className="text-xs text-slate-800">{printRecordJob.diagnosis || 'Standard hardware diagnostic completed.'}</div>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Workmanship & Repair Notes</div>
                      <div className="text-xs text-slate-800">{printRecordJob.repair_notes || 'Service procedure executed as per manufacturer standards.'}</div>
                    </div>
                  </div>

                  {/* Hardware Parts Used Table */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Parts Replaced & Components ({printRecordJob.parts_used?.length || 0})
                    </div>
                    <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Part Description</th>
                          <th className="py-2 px-3 text-center">Qty</th>
                          <th className="py-2 px-3 text-right">Unit Price</th>
                          <th className="py-2 px-3 text-right">Total Price</th>
                          <th className="py-2 px-3 text-center">Part Warranty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {printRecordJob.parts_used && printRecordJob.parts_used.length > 0 ? (
                          printRecordJob.parts_used.map((part) => (
                            <tr key={part.id}>
                              <td className="py-2 px-3 font-medium text-slate-900">{part.part_name}</td>
                              <td className="py-2 px-3 text-center font-mono">{part.quantity}</td>
                              <td className="py-2 px-3 text-right font-mono">{formatCurrency(part.unit_cost)}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(part.total_cost)}</td>
                              <td className="py-2 px-3 text-center font-mono">{part.warranty}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-2 px-3 text-center text-slate-400 italic">
                              No replacement parts used (Labor-only service).
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Settlement Breakdown */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div>Labor Service Charge: <strong className="font-mono">{formatCurrency(printRecordJob.service_charge)}</strong></div>
                      <div>Replacement Parts Total: <strong className="font-mono">{formatCurrency(printRecordJob.parts_cost)}</strong></div>
                      <div>Payment Status: <strong className="uppercase font-bold text-emerald-700">{printRecordJob.payment_status}</strong></div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500 uppercase font-bold">Total Service Charge</div>
                      <div className="text-xl font-black text-slate-900 font-mono">
                        {formatCurrency(printRecordJob.total_cost)}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-mono font-bold mt-0.5">
                        Amount Paid: {formatCurrency(printRecordJob.amount_paid)}
                      </div>
                    </div>
                  </div>

                  {/* Dates & Signatures */}
                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs text-slate-600">
                    <div>
                      <div className="font-bold text-slate-800">Assigned Technician Verification:</div>
                      <div className="h-12 border-b border-slate-300 mt-2"></div>
                      <div className="text-[11px] mt-1 font-semibold text-slate-700">
                        Technician: {printRecordJob.technician?.full_name || 'Assigned Specialist'} ({printRecordJob.technician_id})
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">Customer Signature / Acceptance:</div>
                      <div className="h-12 border-b border-slate-300 mt-2"></div>
                      <div className="text-[11px] mt-1 text-slate-500">
                        I confirm receipt of repaired device and warranty agreement.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PRINT TYPE 2 & 3: SERVICE HISTORY & DATE RANGE REPORT */}
              {(printReportType === 'service_history' || printReportType === 'date_range') && (
                <div className="space-y-4 text-xs text-slate-800">
                  <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                    <div>
                      <h1 className="text-lg font-black text-slate-900 uppercase">
                        {settings.shopName || 'FixFlow Phone Service Management'}
                      </h1>
                      <p className="text-xs text-slate-600">
                        {printReportType === 'date_range' ? `Date-Range Service Repair Report (${dateFrom || 'Beginning'} to ${dateTo || 'Present'})` : 'Complete Workshop Service History Report'}
                      </p>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <div>Generated: {new Date().toLocaleDateString()}</div>
                      <div>Total Records: {filteredJobs.length}</div>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2.5">Srv No</th>
                        <th className="py-2 px-2.5">Date</th>
                        <th className="py-2 px-2.5">Customer</th>
                        <th className="py-2 px-2.5">Device & Model</th>
                        <th className="py-2 px-2.5">Technician</th>
                        <th className="py-2 px-2.5">Status</th>
                        <th className="py-2 px-2.5 text-right">Labor Charge</th>
                        <th className="py-2 px-2.5 text-right">Parts Cost</th>
                        <th className="py-2 px-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      {filteredJobs.map((j) => (
                        <tr key={j.id}>
                          <td className="py-1.5 px-2.5 font-bold text-slate-900">{j.service_number}</td>
                          <td className="py-1.5 px-2.5">{formatDate(j.created_at)}</td>
                          <td className="py-1.5 px-2.5 font-sans font-medium">{j.customer?.name}</td>
                          <td className="py-1.5 px-2.5 font-sans">{j.device?.brand} {j.device?.model}</td>
                          <td className="py-1.5 px-2.5 font-sans font-bold text-blue-900">{j.technician?.full_name || j.technician_id}</td>
                          <td className="py-1.5 px-2.5 uppercase font-sans font-bold">{j.status_id}</td>
                          <td className="py-1.5 px-2.5 text-right">{formatCurrency(j.service_charge)}</td>
                          <td className="py-1.5 px-2.5 text-right">{formatCurrency(j.parts_cost)}</td>
                          <td className="py-1.5 px-2.5 text-right font-bold">{formatCurrency(j.total_cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold font-mono border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={6} className="py-2 px-2.5 text-right uppercase">Report Totals:</td>
                        <td className="py-2 px-2.5 text-right">{formatCurrency(totalServiceCharges)}</td>
                        <td className="py-2 px-2.5 text-right">{formatCurrency(totalPartsCost)}</td>
                        <td className="py-2 px-2.5 text-right text-slate-900">{formatCurrency(totalRevenue)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* PRINT TYPE 4: TECHNICIAN REPAIR REPORT */}
              {printReportType === 'technician' && (
                <div className="space-y-4 text-xs text-slate-800">
                  <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                    <div>
                      <h1 className="text-lg font-black text-slate-900 uppercase">
                        {settings.shopName || 'FixFlow Phone Service Management'}
                      </h1>
                      <p className="text-xs text-slate-600">
                        Technician Workmanship & Performance Repair Report
                      </p>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <div>Date: {new Date().toLocaleDateString()}</div>
                      <div>Workshop Lead: Admin Bay</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {technicians.map((tech) => {
                      const techJobs = filteredJobs.filter((j) => j.technician_id === tech.id);
                      const techCompleted = techJobs.filter((j) => j.status_id === 'completed' || j.status_id === 'delivered').length;
                      const techCharges = techJobs.reduce((s, j) => s + (j.service_charge || 0), 0);

                      return (
                        <div key={tech.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <div>
                              <div className="font-bold text-sm text-slate-900">{tech.full_name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                Workbench ID: {tech.id} · Contact: {tech.phone}
                              </div>
                            </div>
                            <div className="text-right font-mono">
                              <div className="font-bold text-slate-900">
                                Assigned: {techJobs.length} | Completed: {techCompleted}
                              </div>
                              <div className="text-[11px] text-emerald-700 font-bold">
                                Generated Labor Charges: {formatCurrency(techCharges)}
                              </div>
                            </div>
                          </div>

                          <div className="pt-2">
                            <table className="w-full text-left text-[11px]">
                              <thead>
                                <tr className="text-slate-500 font-bold uppercase text-[9px]">
                                  <th>Job No</th>
                                  <th>Customer</th>
                                  <th>Device</th>
                                  <th>Status</th>
                                  <th className="text-right">Charge</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 font-mono">
                                {techJobs.slice(0, 10).map((j) => (
                                  <tr key={j.id}>
                                    <td className="py-1 font-bold">{j.service_number}</td>
                                    <td className="py-1 font-sans">{j.customer?.name}</td>
                                    <td className="py-1 font-sans">{j.device?.brand} {j.device?.model}</td>
                                    <td className="py-1 uppercase">{j.status_id}</td>
                                    <td className="py-1 text-right">{formatCurrency(j.service_charge)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
