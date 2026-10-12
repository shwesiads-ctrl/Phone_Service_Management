import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  CreditCard,
  ShieldCheck,
  Printer,
  Search,
  Filter,
  User,
  CheckCircle2,
  Clock,
  Wrench,
  DollarSign,
  Calendar,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    jobs,
    technicians,
    payments,
    auditTrail,
    currency,
    formatCurrency,
    formatDate,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'workload' | 'payments' | 'audit'>('workload');

  // Workload filters
  const [selectedTechId, setSelectedTechId] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Payment filters
  const [payMethodFilter, setPayMethodFilter] = useState<string>('all');
  const [payTechFilter, setPayTechFilter] = useState<string>('all');
  const [paySearchQuery, setPaySearchQuery] = useState<string>('');

  // Filter jobs for workload report
  const filteredJobs = jobs.filter((job) => {
    if (selectedTechId !== 'all' && job.technician_id !== selectedTechId) return false;
    if (statusFilter !== 'all' && job.status_id !== statusFilter) return false;
    if (dateFrom && job.created_at.slice(0, 10) < dateFrom) return false;
    if (dateTo && job.created_at.slice(0, 10) > dateTo) return false;
    return true;
  });

  // Compile stats per technician
  const technicianReports = technicians.map((tech) => {
    const techJobs = filteredJobs.filter((j) => j.technician_id === tech.id);
    const received = techJobs.filter((j) => j.status_id === 'received').length;
    const diagnosing = techJobs.filter((j) => j.status_id === 'diagnosing').length;
    const repairing = techJobs.filter((j) => j.status_id === 'repairing').length;
    const waiting_parts = techJobs.filter((j) => j.status_id === 'waiting_parts').length;
    const ready = techJobs.filter((j) => j.status_id === 'ready').length;
    const completed = techJobs.filter((j) => j.status_id === 'completed').length;
    const delivered = techJobs.filter((j) => j.status_id === 'delivered').length;
    const cancelled = techJobs.filter((j) => j.status_id === 'cancelled').length;

    const totalServiceCharges = techJobs.reduce((sum, j) => sum + (j.service_charge || 0), 0);

    return {
      tech,
      totalJobs: techJobs.length,
      received,
      diagnosing,
      repairing,
      waiting_parts,
      ready,
      completed,
      delivered,
      cancelled,
      totalServiceCharges,
    };
  });

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (payMethodFilter !== 'all' && p.payment_method.toLowerCase() !== payMethodFilter.toLowerCase()) {
      return false;
    }
    if (payTechFilter !== 'all') {
      const parentJob = jobs.find((j) => j.id === p.service_job_id);
      if (parentJob && parentJob.technician_id !== payTechFilter) return false;
    }
    if (paySearchQuery.trim()) {
      const q = paySearchQuery.toLowerCase();
      const matchSrv = (p.service_number || '').toLowerCase().includes(q);
      const matchCust = (p.customer_name || '').toLowerCase().includes(q);
      const matchTech = (p.technician_name || '').toLowerCase().includes(q);
      const matchReceiver = (p.received_by || '').toLowerCase().includes(q);
      const matchNotes = (p.notes || '').toLowerCase().includes(q);
      return matchSrv || matchCust || matchTech || matchReceiver || matchNotes;
    }
    return true;
  });

  const totalRevenueCollected = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
            {t('reports')} & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            Admin reporting for technician workload, payment histories, and security audit log
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('workload')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
            activeTab === 'workload'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Technician Performance & Workload</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment History & Transactions ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* TAB 1: TECHNICIAN PERFORMANCE & WORKLOAD */}
      {activeTab === 'workload' && (
        <div className="space-y-6">
          {/* Workload Filter Bar */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-bold text-[var(--text)] mb-1">
                {t('filterByTechnician')}
              </label>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] cursor-pointer"
              >
                <option value="all">All Technicians</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text)] mb-1">
                {t('filterByStatus')}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] cursor-pointer"
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
              <label className="block text-xs font-bold text-[var(--text)] mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text)] mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          {/* Workload Table */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--text)]">
                Technician Assignment Workload Matrix
              </h2>
              <span className="text-xs text-[var(--text-muted)]">
                Total Tracked Jobs: {filteredJobs.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[var(--surface-2)]/60 text-[var(--text-muted)] uppercase text-[10px] sm:text-xs font-bold border-b border-[var(--border)]">
                  <tr>
                    <th className="py-3 px-4">Technician</th>
                    <th className="py-3 px-3 text-center">Total Jobs</th>
                    <th className="py-3 px-3 text-center">Diagnosing</th>
                    <th className="py-3 px-3 text-center">Repairing</th>
                    <th className="py-3 px-3 text-center">Waiting Parts</th>
                    <th className="py-3 px-3 text-center">Ready</th>
                    <th className="py-3 px-3 text-center">Completed</th>
                    <th className="py-3 px-4 text-right">Service Charges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {technicianReports.map(({ tech, totalJobs, diagnosing, repairing, waiting_parts, ready, completed, totalServiceCharges }) => (
                    <tr key={tech.id} className="hover:bg-[var(--surface-2)]/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--text)]">{tech.full_name}</div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono">
                          {tech.id} · @{tech.username}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold">{totalJobs}</td>
                      <td className="py-3.5 px-3 text-center font-mono text-purple-600 dark:text-purple-400 font-bold">
                        {diagnosing}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-blue-600 dark:text-blue-400 font-bold">
                        {repairing}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-amber-600 dark:text-amber-400 font-bold">
                        {waiting_parts}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {ready}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400 font-bold">
                        {completed}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[var(--text)]">
                        {formatCurrency(totalServiceCharges)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT HISTORY & TRANSACTIONS (AS SPECIFIED IN USER BRIEF) */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Revenue Summary Banner */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[var(--surface-2)]/40 border border-[var(--border)]">
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase">Total Collected</div>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(totalRevenueCollected)}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">
                Across {filteredPayments.length} recorded payments
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--surface-2)]/40 border border-[var(--border)]">
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase">Active Currency</div>
              <div className="text-2xl font-black font-mono text-[var(--primary)] mt-1">
                {currency}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">
                Decoupled from payment channels
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--surface-2)]/40 border border-[var(--border)]">
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase">Payment Methods</div>
              <div className="text-2xl font-black font-mono text-[var(--text)] mt-1">
                {new Set(filteredPayments.map((p) => p.payment_method)).size} Channels
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">
                Cash, Bank Transfer, KBZ Pay, Wave Pay, etc.
              </div>
            </div>
          </div>

          {/* Payment Filter Bar */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={paySearchQuery}
                onChange={(e) => setPaySearchQuery(e.target.value)}
                placeholder="Search Service No, Customer, Receiver, Notes..."
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <select
                value={payMethodFilter}
                onChange={(e) => setPayMethodFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] cursor-pointer"
              >
                <option value="all">All Payment Methods</option>
                <option value="promptpay">PromptPay</option>
                <option value="kplus">K PLUS (Kasikornbank)</option>
                <option value="scb_easy">SCB EASY (Siam Commercial)</option>
                <option value="truemoney">TrueMoney Wallet</option>
                <option value="rabbit_line_pay">Rabbit LINE Pay</option>
                <option value="shopeepay">ShopeePay</option>
                <option value="cash">Cash / เงินสด</option>
                <option value="bank transfer">Bank Transfer / โอนเงิน</option>
                <option value="card">Credit/Debit Card</option>
                <option value="kbz pay">KBZ Pay</option>
                <option value="wave pay">Wave Pay</option>
                <option value="aya pay">AYA Pay</option>
                <option value="cb pay">CB Pay</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <select
                value={payTechFilter}
                onChange={(e) => setPayTechFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] cursor-pointer"
              >
                <option value="all">All Technicians</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PAYMENT HISTORY TABLE (Mandatory: Date, Service Number, Customer, Technician, Payment Method, Amount, Currency, Received By) */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--text)]">
                {t('paymentHistory')}
              </h2>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                Showing {filteredPayments.length} Transactions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[var(--surface-2)]/60 text-[var(--text-muted)] uppercase text-[10px] sm:text-xs font-bold border-b border-[var(--border)]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Service No</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Technician</th>
                    <th className="py-3 px-3">Payment Method</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-3 text-center">Currency</th>
                    <th className="py-3 px-4">Received By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-[var(--surface-2)]/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                        {formatDate(pay.paid_at)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-[var(--primary)] text-xs">
                          {pay.service_number || pay.service_job_id}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[var(--text)]">
                        {pay.customer_name || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text)]">
                        {pay.technician_name || '—'}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] uppercase">
                            {pay.payment_method}
                          </span>
                          {pay.reference_number && (
                            <div className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                              Ref: {pay.reference_number}
                            </div>
                          )}
                          {(pay.payment_note || pay.notes) && (
                            <div className="text-[10px] text-[var(--text-muted)] line-clamp-1">
                              {pay.payment_note || pay.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(pay.amount, pay.currency_code)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                          {pay.currency_code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-xs text-[var(--text)]">
                        {pay.received_by}
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[var(--text-muted)]">
                        No payments found matching the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text)]">
              System & Workbench Security Audit Trail
            </h2>
            <span className="text-xs text-[var(--text-muted)]">Immutable Audit Logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-2)]/60 text-[var(--text-muted)] uppercase text-[10px] font-bold border-b border-[var(--border)]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Target</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-mono">
                {auditTrail.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--surface-2)]/30">
                    <td className="py-3 px-4 text-[var(--text-muted)] whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-3 px-3 font-bold text-[var(--text)]">@{log.username}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[var(--primary)]">{log.target_id}</td>
                    <td className="py-3 px-4 font-sans text-xs text-[var(--text)]">{log.details}</td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
