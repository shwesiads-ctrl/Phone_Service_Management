import React, { useState } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  Users,
  Smartphone,
  Wrench,
  UserCog,
  KeyRound,
  Send,
  BarChart3,
  DollarSign,
  Settings,
  Palette,
  Languages,
  HelpCircle,
  CheckCircle2,
  Lock,
  ExternalLink,
  ChevronRight,
  Shield,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const UserGuideView: React.FC = () => {
  const { license, navigate, t } = useApp();
  const [selectedTopic, setSelectedTopic] = useState<string>('getting-started');

  const topics = [
    { id: 'getting-started', title: '1. Getting Started', icon: BookOpen },
    { id: 'dashboard', title: '2. Dashboard (Admin & Technician)', icon: LayoutDashboard },
    { id: 'customers', title: '3. Customers Directory', icon: Users },
    { id: 'devices', title: '4. Devices & Hardware Inventory', icon: Smartphone },
    { id: 'service-mgmt', title: '5. Service Management & Jobs', icon: Wrench },
    { id: 'technicians', title: '6. Technicians & Workstations', icon: UserCog },
    { id: 'license-system', title: '7. License Verification & Management', icon: KeyRound },
    { id: 'plans-comparison', title: '8. FREE vs PAID Plan Comparison', icon: Shield },
    { id: 'telegram-service', title: '9. Telegram Bot Service', icon: Send },
    { id: 'income-system', title: '10. Income Report System', icon: DollarSign },
    { id: 'payments', title: '11. Payments & Banking Profiles', icon: FileText },
    { id: 'reports', title: '12. Reports & Workload Analytics', icon: BarChart3 },
    { id: 'settings', title: '13. Workshop Settings & Policies', icon: Settings },
    { id: 'theme', title: '14. Theme & Dark Mode', icon: Palette },
    { id: 'language', title: '15. Language & Regional Profiles', icon: Languages },
    { id: 'troubleshooting', title: '16. Troubleshooting & Diagnostics', icon: HelpCircle },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
              User Guide & Documentation
            </h1>
            <span
              className={`text-xs font-black px-2.5 py-0.5 rounded uppercase ${
                license.plan === 'PAID'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
              }`}
            >
              Current Plan: {license.plan}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
            Complete operating instructions, feature breakdown, FREE vs PAID capabilities, and workbench workflows
          </p>
        </div>

        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)] text-xs font-semibold self-start sm:self-auto cursor-pointer"
        >
          <span>Settings & License</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid: Topic navigation + Topic body */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-2 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] mb-1">
            Documentation Index
          </div>
          {topics.map((top) => {
            const Icon = top.icon;
            const isActive = selectedTopic === top.id;
            return (
              <button
                key={top.id}
                onClick={() => setSelectedTopic(top.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-[var(--primary)] text-white font-semibold shadow-xs'
                    : 'text-[var(--text)] hover:bg-[var(--surface-2)] text-opacity-80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-[var(--text-muted)]'
                  }`}
                />
                <span className="truncate">{top.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="lg:col-span-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-[var(--text)]">
          {/* 1. GETTING STARTED */}
          {selectedTopic === 'getting-started' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                  <span>1. Getting Started with FixFlow</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Introduction to the Free Phone Service Management System architecture
                </p>
              </div>

              <p className="leading-relaxed">
                FixFlow is a comprehensive, multi-currency, multi-language phone repair laboratory and workshop management application designed for phone service technicians and shop administrators.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 space-y-2">
                  <div className="font-bold text-sm text-[var(--primary)]">Workshop Administrator</div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Has complete supervisory authority: registering technicians, setting repair costs, reassigning jobs, recording payments, exporting backups, and managing store policies.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 space-y-2">
                  <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">Workshop Technician</div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Focused workbench role: technicians view their assigned jobs in "My Services", record diagnostic notes, add replaced spare parts, and advance repair statuses.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. DASHBOARD */}
          {selectedTopic === 'dashboard' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-[var(--primary)]" />
                  <span>2. Dashboard Workbenches</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Real-time status tracking, metric cards, and workbench queues
                </p>
              </div>

              <p className="leading-relaxed">
                The dashboard adapts dynamically to whether an Administrator or Technician is logged in:
              </p>

              <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
                <li>
                  <strong>Admin Dashboard:</strong> Displays total repair volume, active repairs, completed jobs, revenue collected, and full job dispatch queues with filter by technician and search.
                </li>
                <li>
                  <strong>Technician Dashboard:</strong> Displays the technician's assigned jobs, quick action buttons to update diagnosis, add parts, and record customer handoffs.
                </li>
              </ul>
            </div>
          )}

          {/* 3. CUSTOMERS */}
          {selectedTopic === 'customers' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[var(--primary)]" />
                  <span>3. Customer Management</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Contact directories, lookup by phone, and recurring repair history
                </p>
              </div>

              <p className="leading-relaxed">
                Customer records are linked directly to service jobs. When creating a repair job, search or input the customer's phone number to automatically pull past repair history and device ownership.
              </p>
            </div>
          )}

          {/* 4. DEVICES */}
          {selectedTopic === 'devices' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[var(--primary)]" />
                  <span>4. Device & Hardware Registry</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Brand, model, serial, IMEI, and hardware condition logging
                </p>
              </div>

              <p className="leading-relaxed">
                Track every phone or tablet by Brand (Apple, Samsung, Xiaomi, etc.), Model, and IMEI/Serial Number. The system maintains full warranty and repair audit trails per device.
              </p>
            </div>
          )}

          {/* 5. SERVICE MANAGEMENT */}
          {selectedTopic === 'service-mgmt' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-[var(--primary)]" />
                  <span>5. Service Management & Repair Workflow</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Full lifecycle from intake to diagnosis, parts replacement, payment, and delivery
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  Standard Status Progression:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">1. Received</div>
                  <div className="p-2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">2. Diagnosing</div>
                  <div className="p-2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">3. Waiting Parts</div>
                  <div className="p-2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">4. Repairing</div>
                  <div className="p-2 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold">5. Ready</div>
                  <div className="p-2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">6. Completed</div>
                  <div className="p-2 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold">7. Delivered</div>
                  <div className="p-2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">Cancelled</div>
                </div>
              </div>
            </div>
          )}

          {/* 6. TECHNICIANS */}
          {selectedTopic === 'technicians' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-[var(--primary)]" />
                  <span>6. Technician Workstations & Roles</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Workload balancing, password resets, and permission boundaries
                </p>
              </div>

              <p className="leading-relaxed">
                Administrators can register technicians with workbench credentials. Each technician logs in with their own account, viewing only jobs assigned to their workbench. Financial settlement and configuration changes are restricted to Administrators.
              </p>
            </div>
          )}

          {/* 7. LICENSE */}
          {selectedTopic === 'license-system' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[var(--primary)]" />
                  <span>7. License Management & Owner Server Integration</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  License header badges, verification, expiration calculations, and client-only removal
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 space-y-3">
                <div className="font-bold text-xs uppercase tracking-wider text-[var(--text)]">
                  Owner License Server
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Server URL: <strong className="text-blue-600 dark:text-blue-400 font-mono">https://posowner.myominaung.xyz</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs">
                  <li>
                    <strong>[ Verify License ]:</strong> Contacts the Owner Server at posowner.myominaung.xyz and synchronizes real expiration, plan, and status.
                  </li>
                  <li>
                    <strong>[ Remove License ]:</strong> CLIENT-ONLY action. It clears local credentials and resets the client to Free without modifying or revoking the Owner Server license.
                  </li>
                  <li>
                    <strong>Anti-Tamper License Days:</strong> Expiration is calculated from server-verified UTC timestamps, preventing client-side clock manipulation.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* 8. FREE VS PAID */}
          {selectedTopic === 'plans-comparison' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[var(--primary)]" />
                  <span>8. FREE vs PAID Plan Breakdown</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Transparent feature availability matrix
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FREE Plan Box */}
                <div className="p-5 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
                    <span className="font-black text-sm uppercase text-blue-600 dark:text-blue-400">
                      FREE PLAN
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300">
                      Standard Community
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Basic Phone Service Management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Customer Management & Directory</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Device Registry & Hardware Inventory</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Basic Service Records & Receipts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Basic Workload & Performance Reports</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>User Guide & Workbench Help</span>
                    </li>
                    <li className="flex items-center gap-2 text-rose-500 opacity-80">
                      <Lock className="w-4 h-4 shrink-0" />
                      <span className="line-through">Telegram Bot Service</span>
                    </li>
                    <li className="flex items-center gap-2 text-rose-500 opacity-80">
                      <Lock className="w-4 h-4 shrink-0" />
                      <span className="line-through">Income Report System</span>
                    </li>
                  </ul>
                </div>

                {/* PAID Plan Box */}
                <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <span className="font-black text-sm uppercase text-emerald-600 dark:text-emerald-400">
                      PAID PLAN
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                      Professional Edition
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>All FREE Plan Features Included</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>Telegram Bot Service</strong> (automated dispatch alerts)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>Income Report System</strong> (P&L, expenses, custom dates)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Advanced Financial Settlements & Print Summaries</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Priority Support & Verified Updates</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 9. TELEGRAM BOT SERVICE */}
          {selectedTopic === 'telegram-service' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Send className="w-5 h-5 text-[var(--primary)]" />
                  <span>9. Telegram Bot Service</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Automated workshop repair event notifications
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="font-bold text-xs uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>FREE on all plans · Administrator setup</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Telegram Bot is available on FREE and PAID plans. An administrator can configure a bot token and workshop Chat ID, save settings, and test delivery.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-semibold text-sm">Capabilities when Activated:</div>
                <ul className="list-disc pl-5 space-y-1 text-[var(--text-muted)]">
                  <li>Sends instant message alerts when a new service job is received.</li>
                  <li>Notifies workshop staff when job status transitions (e.g. Waiting Parts → Ready).</li>
                  <li>Dispatches payment receipt summaries directly to your Telegram channel or group.</li>
                  <li>Real Telegram connection verification via [ Test Bot Connection ] button.</li>
                </ul>
              </div>
            </div>
          )}

          {/* 10. INCOME REPORT SYSTEM */}
          {selectedTopic === 'income-system' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[var(--primary)]" />
                  <span>10. Income Report System</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Revenue tracking, expense categories, profit and loss, and fiscal settlements
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="font-bold text-xs uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>Plan Requirement: PAID License</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  The Income Report System uses real stored transaction and payment data to generate financial statements. Accessible only under an active PAID license.
                </p>
              </div>

              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[var(--text-muted)]">
                <li>
                  <strong>Income Management:</strong> Records service payments, hardware sales, and deposits.
                </li>
                <li>
                  <strong>Expense Tracking:</strong> Categorizes spare parts purchases, lab rent, utilities, consumables, and technician compensation.
                </li>
                <li>
                  <strong>Financial Settlements:</strong> Reconciles daily or monthly balances with receipt printing.
                </li>
              </ul>
            </div>
          )}

          {/* 11. PAYMENTS */}
          {selectedTopic === 'payments' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[var(--primary)]" />
                  <span>11. Payment Methods & Regional Profiles</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Decoupled payment channels for Thailand, Myanmar, and Global regions
                </p>
              </div>

              <p className="leading-relaxed">
                FixFlow supports dedicated regional payment profiles:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li>
                  <strong>🇹🇭 Thailand Profile:</strong> Cash, Bank Transfer, PromptPay, K PLUS (Kasikornbank), SCB EASY, TrueMoney Wallet.
                </li>
                <li>
                  <strong>🇲🇲 Myanmar Profile:</strong> Cash, KBZPay, WavePay, AYA Pay, CB Pay, KBZ Bank Transfer.
                </li>
                <li>
                  <strong>🌐 Global Profile:</strong> Cash, International Wire/ACH, Credit/Debit Cards, PayPal.
                </li>
              </ul>
            </div>
          )}

          {/* 12. REPORTS */}
          {selectedTopic === 'reports' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
                  <span>12. Workload & Operational Reports</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Technician assignment breakdown, transaction history, and security audits
                </p>
              </div>

              <p className="leading-relaxed">
                Filter repair jobs by technician, status, and date range to inspect workbench capacity. Includes printable summary sheets for weekly and monthly team reviews.
              </p>
            </div>
          )}

          {/* 13. SETTINGS */}
          {selectedTopic === 'settings' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[var(--primary)]" />
                  <span>13. Workshop Settings & Backup Procedures</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Company branding, warranty duration, JSON database backups, and integrity verification
                </p>
              </div>

              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[var(--text-muted)]">
                <li>
                  <strong>Shop Profile:</strong> Name, phone, email, and address printed on invoice headers.
                </li>
                <li>
                  <strong>Default Warranty:</strong> Applied automatically to completed repairs (e.g. 90 days).
                </li>
                <li>
                  <strong>Database Backup & Restore:</strong> Create point-in-time JSON snapshots, validate structural integrity, and restore verified backups with full safety checks.
                </li>
              </ul>
            </div>
          )}

          {/* 14. THEME */}
          {selectedTopic === 'theme' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Palette className="w-5 h-5 text-[var(--primary)]" />
                  <span>14. Theme & Dark Mode</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Tailored UI palettes for daytime operations and workbench screens
                </p>
              </div>

              <p className="leading-relaxed">
                Choose between <strong>Light</strong>, <strong>Dark</strong>, or <strong>System</strong> (auto-syncs with your operating system). Switches instantly without reloading the page.
              </p>
            </div>
          )}

          {/* 15. LANGUAGE */}
          {selectedTopic === 'language' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Languages className="w-5 h-5 text-[var(--primary)]" />
                  <span>15. Language & Currency Synchronization</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Myanmar, English, Thai and Chinese
                </p>
              </div>

              <p className="leading-relaxed">
                Switch language anytime from the application header dropdown:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>🇲🇲 မြန်မာ (Myanmar Unicode standard)</li>
                <li>🇬🇧 English (International / US)</li>
                <li>🇹🇭 ไทย (Thai Unicode standard)</li>
                <li>🇨🇳 中文 (Simplified Chinese)</li>
              </ul>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Choose Ks (MMK), US dollars (USD), baht (THB), or yuan (CNY) in Settings → Currency. Language changes never change your selected currency. Existing transactions keep their recorded currency.
              </p>
            </div>
          )}

          {/* 16. TROUBLESHOOTING */}
          {selectedTopic === 'troubleshooting' && (
            <div className="space-y-4">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[var(--primary)]" />
                  <span>16. Troubleshooting & Diagnostics</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Common solutions and workbench error recovery
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30">
                  <div className="font-bold text-[var(--text)] mb-1">
                    Q: Why does Income Report show "🔒 Paid Feature"?
                  </div>
                  <p className="text-[var(--text-muted)]">
                    A: Income reports require an active PAID license from the local license registry. Navigate to Settings → License to enter your registered key. Telegram Bot is FREE on all plans.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30">
                  <div className="font-bold text-[var(--text)] mb-1">
                    Q: Can a technician edit payments or financial settlements?
                  </div>
                  <p className="text-[var(--text-muted)]">
                    A: No. By system security policy, all financial entries and settlements return 403 Forbidden for technician accounts.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30">
                  <div className="font-bold text-[var(--text)] mb-1">
                    Q: How do I backup workshop records before a major system upgrade?
                  </div>
                  <p className="text-[var(--text-muted)]">
                    A: Go to Settings → Backup & Restore, click [ Create Backup ], and download the generated JSON snapshot.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
