import release from '../config/release.json';
import { accountLabels } from '../i18n/accountLabels';
import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Wrench,
  Users,
  Smartphone,
  UserCog,
  BarChart3,
  Settings,
  Heart,
  Info,
  X,
  Cpu,
  Shield,
  Layers,
  FileText,
  DollarSign,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    role,
    currentUser,
    activeTab,
    setActiveTab,
    currentPath,
    navigate,
    settings,
    t,
    language,
  } = useApp();

  // Admin menu items
  const adminMenuItems = [
    { id: 'dashboard', path: '/admin/dashboard', label: language==='my'?'ပင်မစာမျက်နှာ':t('adminDashboard'), icon: LayoutDashboard },
    { id: 'service', path: '/service', label: language==='my'?'ဝန်ဆောင်မှုများ':t('service'), icon: Wrench },
    { id: 'records', path: '/records', label: language==='my'?'ပြုပြင်မှတ်တမ်း':t('repairRecords'), icon: FileText },
    { id: 'finance', path: '/finance', label: language==='my'?'ဝင်ငွေ / အသုံးစရိတ်':t('finance'), icon: DollarSign },
    { id: 'customers', path: '/customers', label: t('customers'), icon: Users },
    { id: 'devices', path: '/devices', label: t('devices'), icon: Smartphone },
    { id: 'users', path: '/users', label: language==='my'?'အကောင့်များ':'Account Management', icon: Users },
    { id: 'cashiers', path: '/cashiers', label: language==='my'?'ငွေလက်ခံအကောင့်':accountLabels(language).cashier, icon: DollarSign },
    { id: 'technicians', path: '/technicians', label: language==='my'?'ပညာရှင်များ':t('technicians'), icon: UserCog },
    { id: 'reports', path: '/reports', label: language==='my'?'အစီရင်ခံစာ':t('reports'), icon: BarChart3 },
    { id: 'settings', path: '/settings', label: t('settings'), icon: Settings },
    { id: 'about', path: '/about', label: t('about'), icon: Info },
  ];

  // Technician menu items
  const techMenuItems = [
    { id: 'dashboard', path: '/technician/dashboard', label: t('technicianDashboard'), icon: LayoutDashboard },
    { id: 'service', path: '/service', label: t('myServices'), icon: Wrench },
    { id: 'devices', path: '/devices', label: t('devices'), icon: Smartphone },
    { id: 'about', path: '/about', label: t('about'), icon: Info },
  ];

  const cashierMenuItems = [{ id: 'dashboard', path: '/cashier/dashboard', label: 'Cashier Dashboard', icon: DollarSign }, { id: 'service', path: '/service', label: t('service'), icon: Wrench }, { id: 'records', path: '/records', label: language==='my'?'ကျွန်ုပ်၏ပြုပြင်မှတ်တမ်း':'My Repair Records', icon: FileText }, { id: 'customers', path: '/customers', label: t('customers'), icon: Users }, { id: 'about', path: '/about', label: t('about'), icon: Info }];
  const menuItems = role === 'admin' ? adminMenuItems : role === 'cashier' ? cashierMenuItems : techMenuItems;

  const handleNavClick = (item: (typeof menuItems)[0]) => {
    navigate(item.path);
    if (mobileOpen) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)]">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-white font-bold text-base shadow-sm">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-[var(--text)] leading-tight">
              FixFlow
            </span>
            <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[145px]">
              {settings.shopName || 'Phone Service Lab'}
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Technician Badge when in Technician Mode */}
      {role === 'technician' && (
        <div className="p-3 mx-3 mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Wrench className="w-3.5 h-3.5" />
            <span>{t('activeTechnician')}</span>
          </div>
          <div className="font-bold text-sm text-[var(--text)] mt-1 truncate">
            {currentUser.full_name}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
            Workbench ID: {currentUser.technician_id}
          </div>
        </div>
      )}

      {/* Admin Mode Badge */}
      {role === 'admin' && (
        <div className="p-2.5 mx-3 mt-3 rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-500 shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-blue-600 dark:text-blue-400">Admin Bay</div>
            <div className="text-[10px] text-[var(--text-muted)]">Full Job Assignment Authority</div>
          </div>
        </div>
      )}

      {/* Main Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text)] hover:bg-[var(--surface-2)] text-opacity-80 hover:text-opacity-100'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-white' : 'text-[var(--text-muted)]'
                }`}
              />
              <span className={`min-w-0 truncate ${language==='my'?'text-[13px] leading-6':''}`} style={language==='my'?{fontFamily:'Noto Sans Myanmar, sans-serif'}:undefined}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer System Info */}
      <div className="p-3 border-t border-[var(--border)] shrink-0 text-xs text-[var(--text-muted)] flex items-center justify-between">
        <span className="font-mono text-[11px]">Free Edition</span>
        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">v{release.version}</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-60 xl:w-64 shrink-0 h-screen sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Off-Canvas */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-[var(--surface)] transform transition-transform duration-200 ease-in-out lg:hidden shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
