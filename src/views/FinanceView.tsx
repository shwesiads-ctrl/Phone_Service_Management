import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { IncomeRecord, ExpenseRecord, Currency } from '../types';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Scale,
  Plus,
  Printer,
  Calendar,
  Filter,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  CreditCard,
  Building,
  User,
  Wrench,
  Tag,
  FileText,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  KeyRound,
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const {
    role,
    currentUser,
    incomeRecords,
    expenseRecords,
    createIncome,
    createExpense,
    deleteIncome,
    deleteExpense,
    technicians,
    jobs,
    settings,
    currency,
    formatCurrency,
    formatDate,
    license,
    navigate,
    t,
  } = useApp();

  // ACCESS CONTROL: Restricted to Admin
  if (role !== 'admin') {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text)]">403 Forbidden</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Financial accounts, income, expenses, and settlements are restricted to Administrators only.
        </p>
      </div>
    );
  }



  // Active view tab
  const [activeTab, setActiveTab] = useState<'summary' | 'income' | 'expense'>('summary');

  // Filter states
  const [dateFilterPreset, setDateFilterPreset] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTech, setSelectedTech] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [printModalType, setPrintModalType] = useState<
    | 'income'
    | 'expense'
    | 'combined'
    | 'daily'
    | 'monthly'
    | 'custom_range'
    | 'technician_income'
    | null
  >(null);

  // New Income Form State
  const [newIncDate, setNewIncDate] = useState(new Date().toISOString().slice(0, 10));
  const [newIncRef, setNewIncRef] = useState(`INC-${Date.now().toString().slice(-4)}`);
  const [newIncServiceNo, setNewIncServiceNo] = useState('');
  const [newIncCust, setNewIncCust] = useState('');
  const [newIncTechId, setNewIncTechId] = useState('');
  const [newIncDesc, setNewIncDesc] = useState('');
  const [newIncAmount, setNewIncAmount] = useState('');
  const [newIncPayMethod, setNewIncPayMethod] = useState('Cash');
  const [incomeSaving, setIncomeSaving] = useState(false);

  // New Expense Form State
  const [newExpDate, setNewExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [newExpRef, setNewExpRef] = useState(`EXP-${Date.now().toString().slice(-4)}`);
  const [newExpCategory, setNewExpCategory] = useState('Parts');
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpPayMethod, setNewExpPayMethod] = useState('Cash');
  const [expenseSaving, setExpenseSaving] = useState(false);

  // Helper date preset changer
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

  // Filter Income Records
  const filteredIncome = useMemo(() => {
    return incomeRecords.filter((inc) => {
      if (dateFrom && inc.date.slice(0, 10) < dateFrom) return false;
      if (dateTo && inc.date.slice(0, 10) > dateTo) return false;
      if (selectedTech !== 'all' && inc.technician_id !== selectedTech) return false;
      if (
        selectedPaymentMethod !== 'all' &&
        inc.payment_method.toLowerCase() !== selectedPaymentMethod.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = inc.reference.toLowerCase().includes(q);
        const matchDesc = inc.description.toLowerCase().includes(q);
        const matchSrv = (inc.service_number || '').toLowerCase().includes(q);
        const matchCust = (inc.customer_name || '').toLowerCase().includes(q);
        if (!matchRef && !matchDesc && !matchSrv && !matchCust) return false;
      }
      return true;
    });
  }, [incomeRecords, dateFrom, dateTo, selectedTech, selectedPaymentMethod, searchQuery]);

  // Filter Expense Records
  const filteredExpense = useMemo(() => {
    return expenseRecords.filter((exp) => {
      if (dateFrom && exp.date.slice(0, 10) < dateFrom) return false;
      if (dateTo && exp.date.slice(0, 10) > dateTo) return false;
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) return false;
      if (
        selectedPaymentMethod !== 'all' &&
        exp.payment_method.toLowerCase() !== selectedPaymentMethod.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRef = exp.reference.toLowerCase().includes(q);
        const matchDesc = exp.description.toLowerCase().includes(q);
        const matchCat = exp.category.toLowerCase().includes(q);
        if (!matchRef && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [expenseRecords, dateFrom, dateTo, selectedCategory, selectedPaymentMethod, searchQuery]);

  // Financial Calculations
  const totalIncome = filteredIncome.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalExpense = filteredExpense.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netBalance = totalIncome - totalExpense;

  // Handlers for creating Income
  const handleCreateIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newIncAmount);
    if (!amountNum || amountNum <= 0 || !newIncDesc.trim()) return;

    setIncomeSaving(true);
    try {
      await createIncome({
        date: newIncDate ? new Date(newIncDate).toISOString() : new Date().toISOString(),
        reference: newIncRef.trim() || `INC-${Date.now().toString().slice(-4)}`,
        service_number: newIncServiceNo.trim() || undefined,
        customer_name: newIncCust.trim() || undefined,
        technician_id: newIncTechId || undefined,
        description: newIncDesc.trim(),
        amount: amountNum,
        currency,
        payment_method: newIncPayMethod,
      });

      setNewIncDesc('');
      setNewIncAmount('');
      setNewIncCust('');
      setNewIncServiceNo('');
      setNewIncRef(`INC-${Date.now().toString().slice(-4)}`);
      setIncomeModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save income record');
    } finally {
      setIncomeSaving(false);
    }
  };

  // Handlers for creating Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newExpAmount);
    if (!amountNum || amountNum <= 0 || !newExpDesc.trim()) return;

    setExpenseSaving(true);
    try {
      await createExpense({
        date: newExpDate ? new Date(newExpDate).toISOString() : new Date().toISOString(),
        reference: newExpRef.trim() || `EXP-${Date.now().toString().slice(-4)}`,
        category: newExpCategory,
        description: newExpDesc.trim(),
        amount: amountNum,
        currency,
        payment_method: newExpPayMethod,
      });

      setNewExpDesc('');
      setNewExpAmount('');
      setNewExpRef(`EXP-${Date.now().toString().slice(-4)}`);
      setExpenseModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save expense record');
    } finally {
      setExpenseSaving(false);
    }
  };

  const expenseCategories = [
    'Parts',
    'Workshop Tools',
    'Shop Rent',
    'Electricity & Utilities',
    'Consumables (Solder/Flux/Tape)',
    'Technician Payouts',
    'Courier & Shipping',
    'Software & Firmware Tools',
    'Other Expenses',
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
              {t('finance')}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Service Business Accounting
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            Dedicated service repair shop income, parts procurement expenses, and net profit ledger (No POS fees).
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIncomeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('recordIncome')}</span>
          </button>

          <button
            onClick={() => setExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('recordExpense')}</span>
          </button>

          {/* Print Report Selector Dropdown */}
          <div className="relative inline-block text-left">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  setPrintModalType(e.target.value as any);
                }
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer shadow-xs"
            >
              <option value="" disabled>
                Print Report ▼
              </option>
              <option value="income">Income Report</option>
              <option value="expense">Expense Report</option>
              <option value="combined">Income + Expense Report</option>
              <option value="daily">Daily Financial Report</option>
              <option value="monthly">Monthly Financial Report</option>
              <option value="custom_range">Custom Date Range Report</option>
              <option value="technician_income">Technician Service Income Report</option>
            </select>
          </div>
        </div>
      </div>

      {/* FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <span>{t('totalIncome')}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono truncate">
            {formatCurrency(totalIncome)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
            <span>{filteredIncome.length} incoming transactions</span>
          </div>
        </div>

        {/* Total Expense */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
            <span>{t('totalExpense')}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-2 font-mono truncate">
            {formatCurrency(totalExpense)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
            <span>{filteredExpense.length} procurement/operational costs</span>
          </div>
        </div>

        {/* Net Balance: Formula: Net Balance = Total Income - Total Expense */}
        <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${
          netBalance >= 0
            ? 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-400'
            : 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400'
        } border shadow-xs relative overflow-hidden`}>
          <div className="flex items-center justify-between font-bold text-xs uppercase tracking-wider">
            <span>{t('netBalance')} (Income - Expense)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black mt-2 font-mono truncate ${
            netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
          }`}>
            {formatCurrency(netBalance)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">
            {netBalance >= 0 ? 'Net Workshop Surplus' : 'Net Operating Deficit'}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, description, customer, service number..."
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

        {/* Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-[var(--border)] text-xs">
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

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">Payment Method</label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-semibold cursor-pointer"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="promptpay">PromptPay</option>
              <option value="kplus">K PLUS</option>
              <option value="scb_easy">SCB EASY</option>
              <option value="kbz_pay">KBZ Pay</option>
              <option value="wave_pay">Wave Pay</option>
              <option value="card">Credit/Debit Card</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">Technician</label>
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-semibold cursor-pointer"
            >
              <option value="all">All Technicians</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">Expense Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-semibold cursor-pointer"
            >
              <option value="all">All Categories</option>
              {expenseCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Combined Overview ({filteredIncome.length + filteredExpense.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('income')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
            activeTab === 'income'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Income Records ({filteredIncome.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expense')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
            activeTab === 'expense'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Expense Records ({filteredExpense.length})</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. COMBINED OVERVIEW TABLE */}
      {activeTab === 'summary' && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text)]">Combined Transaction Timeline</h2>
            <div className="text-xs font-mono">
              <span className="text-emerald-600 font-bold">+{formatCurrency(totalIncome)}</span>
              <span className="text-[var(--text-muted)] mx-1.5">/</span>
              <span className="text-rose-600 font-bold">-{formatCurrency(totalExpense)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[var(--surface-2)]/60 text-[var(--text-muted)] uppercase text-[10px] font-bold border-b border-[var(--border)]">
                <tr>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Reference</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Service / Customer / Cat</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-mono text-xs">
                {filteredIncome.length === 0 && filteredExpense.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[var(--text-muted)] font-sans">
                      No financial records found for current criteria.
                    </td>
                  </tr>
                ) : (
                  [
                    ...filteredIncome.map((i) => ({ ...i, txType: 'income' as const })),
                    ...filteredExpense.map((e) => ({ ...e, txType: 'expense' as const })),
                  ]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((tx) => (
                      <tr key={tx.id} className="hover:bg-[var(--surface-2)]/30">
                        <td className="py-3 px-4">
                          {tx.txType === 'income' ? (
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-sans">
                              INCOME
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-sans">
                              EXPENSE
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">{formatDate(tx.date)}</td>
                        <td className="py-3 px-4 font-bold text-[var(--primary)]">{tx.reference}</td>
                        <td className="py-3 px-4 font-sans max-w-[220px] truncate text-[var(--text)]">
                          {tx.description}
                        </td>
                        <td className="py-3 px-4 font-sans text-xs">
                          {tx.txType === 'income' ? (
                            <span className="text-[var(--text-muted)]">
                              {(tx as any).service_number || (tx as any).customer_name || 'General Service'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] text-[10px] font-mono">
                              {(tx as any).category}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-sans capitalize text-[var(--text-muted)]">
                          {tx.payment_method}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${
                          tx.txType === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {tx.txType === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount, tx.currency)}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. INCOME RECORDS TABLE */}
      {activeTab === 'income' && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text)]">
              Service Income Records ({filteredIncome.length})
            </h2>
            <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
              Total: {formatCurrency(totalIncome)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[var(--surface-2)]/60 text-[var(--text-muted)] uppercase text-[10px] font-bold border-b border-[var(--border)]">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Reference</th>
                  <th className="py-2.5 px-4">Service No</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Technician</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-mono text-xs">
                {filteredIncome.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[var(--text-muted)] font-sans">
                      No income records found.
                    </td>
                  </tr>
                ) : (
                  filteredIncome.map((inc) => {
                    const tech = technicians.find((t) => t.id === inc.technician_id);
                    return (
                      <tr key={inc.id} className="hover:bg-[var(--surface-2)]/30">
                        <td className="py-3 px-4">{formatDate(inc.date)}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {inc.reference}
                        </td>
                        <td className="py-3 px-4 font-sans text-blue-600 dark:text-blue-400 font-bold">
                          {inc.service_number || '-'}
                        </td>
                        <td className="py-3 px-4 font-sans">{inc.customer_name || '-'}</td>
                        <td className="py-3 px-4 font-sans max-w-[200px] truncate text-[var(--text)]">
                          {inc.description}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          {tech?.full_name || inc.technician_name || '-'}
                        </td>
                        <td className="py-3 px-4 font-sans capitalize text-[var(--text-muted)]">
                          {inc.payment_method}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(inc.amount, inc.currency)}
                        </td>
                        <td className="py-3 px-4 text-center font-sans">
                          <button
                            onClick={async () => {
                              if (confirm(`Delete income record ${inc.reference}?`)) {
                                await deleteIncome(inc.id);
                              }
                            }}
                            className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            title="Delete Income Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* 3. EXPENSE RECORDS TABLE */}
      {activeTab === 'expense' && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text)]">
              Business Expense Records ({filteredExpense.length})
            </h2>
            <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
              Total: {formatCurrency(totalExpense)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[var(--surface-2)]/60 text-[var(--text-muted)] uppercase text-[10px] font-bold border-b border-[var(--border)]">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Reference</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-mono text-xs">
                {filteredExpense.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[var(--text-muted)] font-sans">
                      No expense records found.
                    </td>
                  </tr>
                ) : (
                  filteredExpense.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[var(--surface-2)]/30">
                      <td className="py-3 px-4">{formatDate(exp.date)}</td>
                      <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">
                        {exp.reference}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] text-[11px] font-semibold">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans max-w-[240px] truncate text-[var(--text)]">
                        {exp.description}
                      </td>
                      <td className="py-3 px-4 font-sans capitalize text-[var(--text-muted)]">
                        {exp.payment_method}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                        -{formatCurrency(exp.amount, exp.currency)}
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <button
                          onClick={async () => {
                            if (confirm(`Delete expense record ${exp.reference}?`)) {
                              await deleteExpense(exp.id);
                            }
                          }}
                          className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                          title="Delete Expense Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: RECORD INCOME MODAL                                 */}
      {/* ============================================================ */}
      {incomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-emerald-500/10">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <ArrowDownLeft className="w-4 h-4" />
                <span>Record Service Income</span>
              </div>
              <button
                onClick={() => setIncomeModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncome} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newIncDate}
                    onChange={(e) => setNewIncDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">Reference No *</label>
                  <input
                    type="text"
                    required
                    value={newIncRef}
                    onChange={(e) => setNewIncRef(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPhone 13 Screen Replacement Service"
                  value={newIncDesc}
                  onChange={(e) => setNewIncDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">
                    Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50000"
                    value={newIncAmount}
                    onChange={(e) => setNewIncAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">Payment Method</label>
                  <select
                    value={newIncPayMethod}
                    onChange={(e) => setNewIncPayMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-semibold cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="PromptPay">PromptPay</option>
                    <option value="K PLUS">K PLUS</option>
                    <option value="SCB EASY">SCB EASY</option>
                    <option value="KBZ Pay">KBZ Pay</option>
                    <option value="Wave Pay">Wave Pay</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-[var(--text-muted)] mb-1">
                    Service Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SRV-202610-0001"
                    value={newIncServiceNo}
                    onChange={(e) => setNewIncServiceNo(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-muted)] mb-1">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ko Aung"
                    value={newIncCust}
                    onChange={(e) => setNewIncCust(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-muted)] mb-1">
                  Technician (Optional)
                </label>
                <select
                  value={newIncTechId}
                  onChange={(e) => setNewIncTechId(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-semibold cursor-pointer"
                >
                  <option value="">None / Workshop</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIncomeModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={incomeSaving}
                  className="px-5 py-2 font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{incomeSaving ? 'Saving...' : 'Save Income'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: RECORD EXPENSE MODAL                                */}
      {/* ============================================================ */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-rose-500/10">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>Record Business Expense</span>
              </div>
              <button
                onClick={() => setExpenseModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newExpDate}
                    onChange={(e) => setNewExpDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">Reference No *</label>
                  <input
                    type="text"
                    required
                    value={newExpRef}
                    onChange={(e) => setNewExpRef(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Category *</label>
                <select
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-semibold cursor-pointer"
                >
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPhone 13 Charging IC PMIC Chip"
                  value={newExpDesc}
                  onChange={(e) => setNewExpDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">
                    Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 20000"
                    value={newExpAmount}
                    onChange={(e) => setNewExpAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">Payment Method</label>
                  <select
                    value={newExpPayMethod}
                    onChange={(e) => setNewExpPayMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-semibold cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="PromptPay">PromptPay</option>
                    <option value="K PLUS">K PLUS</option>
                    <option value="SCB EASY">SCB EASY</option>
                    <option value="KBZ Pay">KBZ Pay</option>
                    <option value="Wave Pay">Wave Pay</option>
                    <option value="Card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={expenseSaving}
                  className="px-5 py-2 font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{expenseSaving ? 'Saving...' : 'Save Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: PRINTABLE FINANCIAL REPORT ENGINE                   */}
      {/* ============================================================ */}
      {printModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-2)]/30 flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[var(--primary)]" />
                <span className="font-bold text-sm text-[var(--text)]">
                  Print {printModalType.replace(/_/g, ' ').toUpperCase()}
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
                  onClick={() => setPrintModalType(null)}
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Sheet */}
            <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 print:p-0 print:m-0 space-y-5 text-xs">
              <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-black text-slate-900 uppercase">
                    {settings.shopName || 'FixFlow Phone Service Management'}
                  </h1>
                  <p className="text-xs text-slate-600">
                    Official Financial Accounting Report · {printModalType.replace(/_/g, ' ').toUpperCase()}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Currency: {currency} · Generated by Administrator @{currentUser.username}
                  </p>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <div>Date: {new Date().toLocaleDateString()}</div>
                  <div>Period: {dateFrom || 'Beginning'} to {dateTo || 'Present'}</div>
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold font-sans">Total Income</div>
                  <div className="text-base font-black text-emerald-700">+{formatCurrency(totalIncome)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold font-sans">Total Expense</div>
                  <div className="text-base font-black text-rose-700">-{formatCurrency(totalExpense)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold font-sans">Net Balance</div>
                  <div className={`text-base font-black ${netBalance >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                    {formatCurrency(netBalance)}
                  </div>
                </div>
              </div>

              {/* Transaction Table */}
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5">Date</th>
                    <th className="py-2 px-2.5">Reference</th>
                    <th className="py-2 px-2.5">Description</th>
                    <th className="py-2 px-2.5">Category / Detail</th>
                    <th className="py-2 px-2.5">Technician</th>
                    <th className="py-2 px-2.5">Payment Method</th>
                    <th className="py-2 px-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {/* If printing only Income or Combined */}
                  {(printModalType === 'income' || printModalType === 'combined' || printModalType === 'daily' || printModalType === 'monthly' || printModalType === 'custom_range' || printModalType === 'technician_income') &&
                    filteredIncome.map((i) => (
                      <tr key={i.id}>
                        <td className="py-1.5 px-2.5">{formatDate(i.date)}</td>
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">{i.reference}</td>
                        <td className="py-1.5 px-2.5 font-sans font-medium">{i.description}</td>
                        <td className="py-1.5 px-2.5 font-sans">{i.service_number || i.customer_name || 'Service Income'}</td>
                        <td className="py-1.5 px-2.5 font-sans text-blue-900 font-bold">
                          {technicians.find((t) => t.id === i.technician_id)?.full_name || '-'}
                        </td>
                        <td className="py-1.5 px-2.5 font-sans capitalize">{i.payment_method}</td>
                        <td className="py-1.5 px-2.5 text-right text-emerald-700 font-bold">
                          +{formatCurrency(i.amount, i.currency)}
                        </td>
                      </tr>
                    ))}

                  {/* If printing only Expense or Combined */}
                  {(printModalType === 'expense' || printModalType === 'combined' || printModalType === 'daily' || printModalType === 'monthly' || printModalType === 'custom_range') &&
                    filteredExpense.map((e) => (
                      <tr key={e.id}>
                        <td className="py-1.5 px-2.5">{formatDate(e.date)}</td>
                        <td className="py-1.5 px-2.5 font-bold text-slate-900">{e.reference}</td>
                        <td className="py-1.5 px-2.5 font-sans font-medium">{e.description}</td>
                        <td className="py-1.5 px-2.5 font-sans font-semibold text-slate-700">{e.category}</td>
                        <td className="py-1.5 px-2.5 font-sans">-</td>
                        <td className="py-1.5 px-2.5 font-sans capitalize">{e.payment_method}</td>
                        <td className="py-1.5 px-2.5 text-right text-rose-700 font-bold">
                          -{formatCurrency(e.amount, e.currency)}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold font-mono border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={6} className="py-2 px-2.5 text-right uppercase">Net Total:</td>
                    <td className="py-2 px-2.5 text-right font-black text-slate-900">
                      {formatCurrency(netBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 text-xs text-slate-500">
                <div>
                  <div>Verified and Certified by:</div>
                  <div className="h-10 border-b border-slate-300 mt-2"></div>
                  <div className="text-[10px] mt-1">Lead Workshop Administrator</div>
                </div>
                <div className="text-right">
                  <div>FixFlow System Generated Document</div>
                  <div className="text-[10px] mt-1">Free Phone Service Management System</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
