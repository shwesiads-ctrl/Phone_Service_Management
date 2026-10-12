import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Language, Theme } from '../types';
import { ProfileModal } from '../modals/ProfileModal';
import { NewUserRegisterModal } from '../modals/NewUserRegisterModal';
import { NotificationCenter } from './NotificationCenter';
import type { ServiceJob } from '../types';
import { ChangePasswordModal } from '../modals/ChangePasswordModal';
import {
  Sun,
  Moon,
  Monitor,
  Search,
  Plus,
  Menu,
  ChevronDown,
  Check,
  UserCheck,
  Shield,
  Wrench,
  User as UserIcon,
  LogOut,
  KeyRound,
  ShieldCheck,
  ExternalLink,
  Wifi,
  WifiOff,
  Server,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  onOpenNewJobModal: () => void;
  onOpenNotificationJob: (job: ServiceJob) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileMenu,
  onOpenNewJobModal,
  onOpenNotificationJob,
}) => {
  const {
    currentUser,
    role,
    technicians,
    theme,
    setTheme,
    language,
    setLanguage,
    activeTab,
    searchQuery,
    setSearchQuery,
    loginAs,
    logout,
    license,
    navigate,
    t,
    serverStatus,
    isCheckingServer,
    checkServerHealth,
    isInternetOnline,
  } = useApp();

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setThemeDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: { code: Language; label: string; flag: string; country: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧', country: 'Global / US / UK' },
    { code: 'my', label: 'မြန်မာ', flag: '🇲🇲', country: 'Myanmar' },
    { code: 'th', label: 'ไทย', flag: '🇹🇭', country: 'Thailand' },
    { code: 'zh', label: '中文 (简体)', flag: '🇨🇳', country: 'China / Singapore' },
  ];

  const currentLangObj = languages.find((l) => l.code === language) || languages[1];

  const themeOptions: { code: Theme; label: string; icon: React.ReactNode }[] = [
  ];

  const currentThemeIcon =
    theme === 'light' ? (
      <Sun className="w-4 h-4 text-amber-500" />
    ) : theme === 'dark' ? (
      <Moon className="w-4 h-4 text-indigo-400" />
    ) : (
      <Monitor className="w-4 h-4 text-slate-400" />
    );

  const getSectionTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return role === 'admin' ? t('adminDashboard') : role === 'cashier' ? 'Cashier Dashboard' : t('technicianDashboard');
      case 'service':
        return role === 'technician' ? t('myServices') : t('service');
      case 'customers':
        return t('customers');
      case 'devices':
        return t('devices');
      case 'cashiers': return 'Cashier Accounts';
      case 'technicians':
        return t('technicians');
      case 'reports':
        return t('reports');
      case 'settings':
        return t('settings');
      case 'about':
        return t('about');
      case 'user-guide':
      case 'guide':
      case 'help':
        return 'User Guide';
      default:
        return 'FixFlow';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--surface)] border-b border-[var(--border)] px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
      {/* Zone 1: Mobile Hamburger + Current View Title */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold tracking-tight text-[var(--text)] max-w-24 sm:max-w-none truncate">
            {getSectionTitle()}
          </span>
          <span
            className={`hidden sm:inline-block text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
              role === 'admin'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}
          >
            {role === 'admin' ? t('roleAdmin') : role === 'cashier' ? 'Cashier' : t('roleTechnician')}
          </span>
        </div>
      </div>

      {/* Zone 2: Global Search Bar */}
      <div className="flex-1 min-w-0 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value.trim() && activeTab !== 'service') navigate('/service'); }}
            aria-label="Search all service jobs"
            onKeyDown={e => { if (e.key === 'Enter') navigate('/service'); if (e.key === 'Escape') setSearchQuery(''); }}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
      </div>

      {/* Zone 3: Actions, Quick Add, Language, Theme, Account Switcher */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        <NotificationCenter onOpenJob={onOpenNotificationJob} />
        {/* LOCAL SERVER & NETWORK STATUS BADGE */}
        <div className="relative" ref={statusRef}>
          <button
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              serverStatus === 'online'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : serverStatus === 'offline'
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300 animate-pulse'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
            }`}
            title="Click to view Local Server, LAN Network, Internet & Owner License status"
            aria-label="View server and connection status"
          >
            {/* Status dot */}
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                serverStatus === 'online'
                  ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
                  : serverStatus === 'offline'
                  ? 'bg-rose-500 ring-2 ring-rose-500/30'
                  : 'bg-amber-500 ring-2 ring-amber-500/30 animate-pulse'
              }`}
            />
            {/* Label */}
            <span className="hidden sm:inline font-bold text-[11px] whitespace-nowrap">
              {serverStatus === 'online'
                ? '● Server Online'
                : serverStatus === 'offline'
                ? '● Server Offline'
                : 'Checking...'}
            </span>
          </button>

          {/* Detailed 4-State Status Popover */}
          {statusDropdownOpen && (
            <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-72 sm:w-80 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[var(--primary)]" />
                  <span className="font-bold text-sm text-[var(--text)]">System & Network Status</span>
                </div>
                <button
                  type="button"
                  onClick={() => checkServerHealth()}
                  disabled={isCheckingServer}
                  className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] cursor-pointer"
                  title="Check server now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingServer ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* 4 Distinct Systems */}
              <div className="space-y-2.5 font-mono text-[11px]">
                {/* 1. LOCAL SERVER */}
                <div className="p-2 rounded-lg bg-[var(--surface-2)]/60 border border-[var(--border)] flex items-center justify-between">
                  <div>
                    <span className="font-sans font-bold text-[var(--text)] block text-xs">1. LOCAL SERVER</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">Node.js @ port 3000 (0.0.0.0)</span>
                  </div>
                  <span
                    className={`font-black px-2 py-0.5 rounded text-[10px] uppercase ${
                      serverStatus === 'online'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : serverStatus === 'offline'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    ● {serverStatus === 'online' ? 'Online' : serverStatus === 'offline' ? 'Offline' : 'Checking...'}
                  </span>
                </div>

                {/* 2. INTERNET */}
                <div className="p-2 rounded-lg bg-[var(--surface-2)]/60 border border-[var(--border)] flex items-center justify-between">
                  <div>
                    <span className="font-sans font-bold text-[var(--text)] block text-xs">2. INTERNET</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-sans">
                      {isInternetOnline ? 'WAN Active' : 'Local LAN Only (No WAN)'}
                    </span>
                  </div>
                  <span
                    className={`font-black px-2 py-0.5 rounded text-[10px] uppercase ${
                      isInternetOnline
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ● {isInternetOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* 3. LICENSE */}
                <div className="p-2 rounded-lg bg-[var(--surface-2)]/60 border border-[var(--border)] flex items-center justify-between">
                  <div>
                    <span className="font-sans font-bold text-[var(--text)] block text-xs">3. SYSTEM LICENSE</span>
                    <span className="text-[10px] text-[var(--text-muted)] block">
                      {license.plan} Plan ({license.license_days} Days)
                    </span>
                  </div>
                  <span
                    className={`font-black px-2 py-0.5 rounded text-[10px] uppercase ${
                      license.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : license.status === 'EXPIRED'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ● {license.status}
                  </span>
                </div>
              </div>

              {/* Offline Warning Banner & Retry */}
              {serverStatus === 'offline' && (
                <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] space-y-2">
                  <div className="flex items-start gap-1.5 font-semibold font-sans">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>Unable to connect to the local application server.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => checkServerHealth()}
                    className="w-full py-1 px-2 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    Retry Connection
                  </button>
                </div>
              )}

              {/* Informational Note for LAN & Internet isolation */}
              <div className="mt-3 pt-2.5 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)] font-sans">
                💡 Local Server runs normal workshop operations even when Internet is Offline. Internet is required only for Owner License verification.
              </div>
            </div>
          )}
        </div>

        {/* Admin only: New Job Button */}
        {['admin','cashier'].includes(role) && (
          <button
            onClick={onOpenNewJobModal}
            aria-label={t('newTicket')}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('newTicket')}</span>
            
          </button>
        )}

        {/* Language Selector */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] transition-colors cursor-pointer"
            aria-label="Select language"
            title="Language"
          >
            <span className="text-base leading-none">{currentLangObj.flag}</span>
            <span className="hidden lg:inline">{currentLangObj.label}</span>
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-[var(--text-muted)] opacity-70" />
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 max-h-80 overflow-y-auto rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl py-1 z-50">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase text-[var(--text-muted)] border-b border-[var(--border)] sticky top-0 bg-[var(--surface)] z-10 flex items-center justify-between">
                <span>{t('settings_language')}</span>
                <span className="text-[10px] font-mono font-normal text-[var(--primary)]">{languages.length} Countries</span>
              </div>
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLanguage(l.code);
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm text-left hover:bg-[var(--surface-2)] transition-colors cursor-pointer ${
                    language === l.code ? 'font-bold text-[var(--primary)] bg-[var(--primary)]/10' : 'text-[var(--text)]'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span className="text-base">{l.flag}</span>
                    <span className="truncate">{l.label}</span>
                  </span>
                  {language === l.code && <Check className="w-4 h-4 text-[var(--primary)] shrink-0 ml-1" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Switcher */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] transition-colors cursor-pointer"
            aria-label="Select theme"
            title="Theme"
          >
            {currentThemeIcon}
            <span className="hidden lg:inline capitalize text-xs">
              {theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}
            </span>
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-[var(--text-muted)] opacity-70" />
          </button>

          {themeDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl py-1 z-50">
              <div className="px-3 py-1 text-[11px] font-bold uppercase text-[var(--text-muted)] border-b border-[var(--border)]">
                {t('settings_appearance')}
              </div>
              {themeOptions.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => {
                    setTheme(opt.code);
                    setThemeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm text-left hover:bg-[var(--surface-2)] transition-colors cursor-pointer ${
                    theme === opt.code ? 'font-bold text-[var(--primary)]' : 'text-[var(--text)]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {opt.icon}
                    <span>{opt.label}</span>
                  </span>
                  {theme === opt.code && <Check className="w-4 h-4 text-[var(--primary)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* USER MENU */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            aria-label="Account menu"
            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)] text-xs font-bold text-[var(--text)] transition-colors cursor-pointer"
          >
            {role === 'admin' ? (
              <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            ) : (
              <Wrench className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <span className="hidden sm:inline max-w-[100px] truncate">
              @{currentUser.username}
            </span>
            <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-[var(--text-muted)]" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 border-b border-[var(--border)]">
                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                  {t('loggedInAs')}
                </div>
                <div className="font-black text-sm text-[var(--text)] truncate">
                  {currentUser.full_name}
                </div>
                <div className="text-xs text-[var(--primary)] font-mono">
                  {role === 'admin' ? 'Administrator Account' : role === 'cashier' ? 'Cashier Account' : `Technician (${currentUser.technician_id})`}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    setProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-semibold">User Profile</span>
                </button>

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    setChangePasswordModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-semibold">Change Password</span>
                </button>
              </div>

              {role === 'admin' && <button onClick={() => { setRegisterModalOpen(true); setUserDropdownOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold hover:bg-[var(--surface-2)]"><UserCheck className="w-3.5 h-3.5" />{language === 'my' ? 'User အသစ် Register' : 'New User Register'}</button>}
              <div className="border-t border-[var(--border)] mt-1 pt-1">
                <button
                  onClick={() => {
                    logout();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-500/10 font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {registerModalOpen && role === 'admin' && <NewUserRegisterModal onClose={() => setRegisterModalOpen(false)} />}
      {profileModalOpen && (
        <ProfileModal
          onClose={() => setProfileModalOpen(false)}
          onChangePasswordClick={() => setChangePasswordModalOpen(true)}
        />
      )}

      {changePasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setChangePasswordModalOpen(false)}
        />
      )}
    </header>
  );
};
