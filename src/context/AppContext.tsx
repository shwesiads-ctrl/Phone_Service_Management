import { defaultPaymentSettings } from '../utils/paymentDefaults';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Customer,
  CustomerDeletionPreview,
  Device,
  IncomeRecord,
  ExpenseRecord,
  BackupMetadata,
  Language,
  Currency,
  PaymentProfile,
  PaymentMethodConfig,
  Role,
  SecurityAudit,
  ServiceJob,
  ServicePayment,
  ServiceStatus,
  SettingsState,
  Technician,
  Theme,
  User,
  LicenseState,
  LicensePlan,
  TelegramBotConfig,
} from '../types';
import { translations, TranslationKey } from '../i18n/translations';
import {
  formatCurrency as formatCurrencyUtil,
  formatLocalizedDate,
  getCurrencySymbol as getCurrencySymbolUtil,
} from '../utils/formatters';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  role: Role;
  technicianId?: string;

  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';

  language: Language;
  setLanguage: (lang: Language) => void;

  currency: Currency;
  setCurrency: (cur: Currency) => void;
  getCurrencySymbol: () => string;

  activePaymentProfile: PaymentProfile;
  setPaymentProfile: (profile: PaymentProfile) => Promise<void>;
  availablePaymentMethods: PaymentMethodConfig[];
  updatePaymentMethodConfig: (
    profile: PaymentProfile,
    methodId: string,
    updates: Partial<PaymentMethodConfig>
  ) => Promise<void>;

  settings: SettingsState;
  updateSettings: (newSettings: Partial<SettingsState>) => Promise<void>;

  jobs: ServiceJob[];
  loadingJobs: boolean;
  refreshJobs: () => Promise<void>;
  createJob: (jobData: any) => Promise<ServiceJob>;
  updateJob: (id: string, updates: Partial<ServiceJob>) => Promise<ServiceJob>;
  deleteJob: (id: string) => Promise<void>;
  reassignJob: (jobId: string, newTechId: string) => Promise<ServiceJob>;

  payments: ServicePayment[];
  loadingPayments: boolean;
  refreshPayments: () => Promise<void>;
  recordPayment: (paymentData: {
    service_job_id: string;
    payment_method: string;
    amount: number;
    currency_code?: Currency;
    reference_number?: string;
    payment_note?: string;
    notes?: string;
    received_by?: string;
  }) => Promise<ServicePayment>;

  technicians: Technician[];
  loadingTechnicians: boolean;
  refreshTechnicians: () => Promise<void>;
  createTechnician: (tech: Omit<Technician, 'id' | 'created_at'>) => Promise<Technician>;
  updateTechnician: (id: string, updates: Partial<Technician>) => Promise<Technician>;
  resetTechnicianPassword: (id: string, newPass: string) => Promise<void>;
  deleteTechnician: (id: string) => Promise<void>;

  customers: Customer[];
  createCustomer: (cust: Omit<Customer, 'id' | 'created_at'>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  previewCustomerDeletion: (ids: string[]) => Promise<CustomerDeletionPreview>;
  deleteCustomersWithRecords: (ids: string[], revision: string) => Promise<void>;
  devices: Device[];
  createDevice: (dev: Omit<Device, 'id' | 'created_at'>) => Promise<Device>;
  updateDevice: (id: string, updates: Partial<Device>) => Promise<Device>;
  updateDeviceCategory: (id: string, category: string) => Promise<Device>;
  deleteDevice: (id: string) => Promise<void>;
  previewDeviceDeletion: (ids:string[])=>Promise<CustomerDeletionPreview>;
  deleteDevicesWithRecords: (ids:string[],revision:string)=>Promise<void>;
  auditTrail: SecurityAudit[];
  refreshAuditTrail: () => Promise<void>;

  // Finance & Accounting (Admin only)
  incomeRecords: IncomeRecord[];
  expenseRecords: ExpenseRecord[];
  refreshFinance: () => Promise<void>;
  createIncome: (data: {
    date?: string;
    reference?: string;
    service_number?: string;
    service_job_id?: string;
    customer_name?: string;
    technician_id?: string;
    description: string;
    amount: number;
    currency?: Currency;
    payment_method?: string;
  }) => Promise<IncomeRecord>;
  createExpense: (data: {
    date?: string;
    reference?: string;
    category: string;
    description: string;
    amount: number;
    currency?: Currency;
    payment_method?: string;
  }) => Promise<ExpenseRecord>;
  deleteIncome: (id: string) => Promise<void>;
  updateExpense: (id: string, data: Partial<ExpenseRecord>) => Promise<ExpenseRecord>;
  deleteExpense: (id: string) => Promise<void>;

  // Backup & Restore (Admin only)
  backupMetadata: BackupMetadata | null;
  fetchBackupMetadata: () => Promise<BackupMetadata | null>;
  createBackup: () => Promise<any>;
  restoreBackup: (data: any) => Promise<{ success: boolean; message?: string; error?: string }>;
  getAuthHeaders: () => Record<string, string>;

  // License & Plan Control (Client State & Verification)
  license: LicenseState;
  refreshLicense: () => Promise<void>;
  verifyLicense: () => Promise<any>;
  activateLicense: (key: string) => Promise<any>;
  removeLicense: () => Promise<any>;
  canAccessFeature: (feature: 'telegram_bot' | 'income_report' | 'advanced_reports') => boolean;

  // Telegram Bot Service (all plans)
  telegramBot: TelegramBotConfig;
  refreshTelegramBot: () => Promise<void>;
  updateTelegramBot: (updates: Partial<TelegramBotConfig>) => Promise<void>;
  testTelegramBot: (token: string, chatId?: string) => Promise<any>;
  getTelegramChatIds: (token: string) => Promise<{ success: boolean; chats?: any[]; error?: string }>;
  sendDailyTelegramSummary: () => Promise<any>;

  currentPath: string;
  navigate: (pathOrTab: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;

  formatCurrency: (amount: number, overrideCurrency?: Currency) => string;
  formatDate: (date: string | Date | undefined) => string;
  t: (key: TranslationKey) => string;

  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;

  // Real Server & Internet Health System
  serverStatus: 'online' | 'offline' | 'checking';
  isCheckingServer: boolean;
  checkServerHealth: () => Promise<boolean>;
  isInternetOnline: boolean;
}

const defaultLicense: LicenseState = {
  license_name: 'Free Phone Service Management System',
  plan: 'FREE',
  status: 'ACTIVE',
  license_key: 'FREE-COMMUNITY-EDITION',
  installation_id: 'FIXFLOW-INST-882194',
  license_days: 30,
  expires_at: null,
  last_verified_at: null,
  server_url: 'https://posowner.myominaung.xyz',
  owner_verified: true,
};

const defaultTelegramBot: TelegramBotConfig = {
  enabled: false,
  bot_token: '',
  chat_id: '',
  channel_username: '',
  notify_on_new_job: true,
  notify_on_status_change: true,
  notify_on_payment: false,
  notify_on_daily_summary: false,
  is_connected: false,
};

const defaultAdminUser: User = {
  id: 'USR-001',
  username: 'admin',
  full_name: 'Lead Workshop Administrator',
  role: 'admin',
  created_at: '2026-08-01T08:00:00Z',
};

const defaultSettings: SettingsState = {
  shopName: 'FixFlow Workshop',
  phone: '',
  email: '',
  address: '',
  receiptFooterNote: 'All phone repairs carry limited warranty on replaced parts and workmanship.',
  defaultWarrantyDays: 90,
  currency: 'MMK',
  currency_mode: 'manual',
  language: 'en',
  theme: 'system',
  dateFormat: 'DD MMM YYYY',
  paperSize: '80mm',
  taxPercentage: 0,
  paymentMethods: ['Cash', 'Bank Transfer', 'KBZ Pay', 'Wave Pay', 'AYA Pay', 'CB Pay', 'Other'],
  paymentSettings: defaultPaymentSettings,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current logged in user
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    if (!localStorage.getItem('fixflow_auth_token')) return null;
    const saved = localStorage.getItem('fixflow_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('fixflow_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fixflow_current_user');
      localStorage.removeItem('fixflow_auth_token');
    }
  };

  const role = currentUser ? currentUser.role : 'guest';
  const technicianId = currentUser ? currentUser.technician_id : undefined;

  const activeUser = currentUser || { id: '', username: 'guest', full_name: 'Guest', role: 'guest' as Role };

  // URL path & navigation
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      return p && p !== '/' ? p : (defaultAdminUser.role === 'admin' ? '/admin/dashboard' : '/technician/dashboard');
    }
    return '/admin/dashboard';
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Navigate helper
  const navigate = useCallback((target: string) => {
    let targetPath = target;
    let targetTab = target;

    if (target === '/admin/dashboard' || (target === 'dashboard' && activeUser.role === 'admin')) {
      targetPath = '/admin/dashboard';
      targetTab = 'dashboard';
    } else if (target === '/technician/dashboard' || (target === 'dashboard' && activeUser.role === 'technician')) {
      targetPath = '/technician/dashboard';
      targetTab = 'dashboard';
    } else if (target === '/cashier/dashboard' || (target === 'dashboard' && activeUser.role === 'cashier')) {
      targetPath = '/cashier/dashboard'; targetTab = 'dashboard';
    } else if (target.startsWith('/')) {
      targetTab = target.replace(/^\//, '');
    } else {
      targetPath = `/${target}`;
    }

    setCurrentPath(targetPath);
    setActiveTab(targetTab);
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, [activeUser.role]);

  // Route sync
  const syncRouteFromPath = useCallback((pathname: string, userRole: Role) => {
    if (pathname === '/admin/dashboard') {
      setActiveTab('dashboard');
      setCurrentPath('/admin/dashboard');
    } else if (pathname === '/technician/dashboard') {
      setActiveTab('dashboard');
      setCurrentPath('/technician/dashboard');
    } else if (pathname === '/cashier/dashboard') {
      setActiveTab('dashboard'); setCurrentPath('/cashier/dashboard');
    } else if (pathname === '/' || pathname === '') {
      const defaultRoute = userRole === 'admin' ? '/admin/dashboard' : userRole === 'cashier' ? '/cashier/dashboard' : '/technician/dashboard';
      setActiveTab('dashboard');
      setCurrentPath(defaultRoute);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', defaultRoute);
      }
    } else {
      const tab = pathname.replace(/^\//, '');
      setActiveTab(tab);
      setCurrentPath(pathname);
    }
  }, []);

  // Listen to browser popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      syncRouteFromPath(window.location.pathname, activeUser.role);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeUser.role, syncRouteFromPath]);

  // Initial sync on mount
  useEffect(() => {
    syncRouteFromPath(window.location.pathname, activeUser.role);
  }, [syncRouteFromPath, activeUser.role]);

  // Global search
  const [searchQuery, setSearchQuery] = useState<string>('');
  useEffect(() => { setSearchQuery(''); }, [currentUser?.id]);

  // Theme
  const [theme, setThemeState] = useState<Theme>(() => {
    const value=localStorage.getItem('fixflow_theme');return ['light','dark','system'].includes(value || '')?value as Theme:'system';
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(()=>{const sync=(event:StorageEvent)=>{if(event.key==='fixflow_theme')setThemeState(['light','dark','system'].includes(event.newValue || '')?event.newValue as Theme:'system');};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);

  const effectiveTheme: 'light' | 'dark' =
    theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme;

  const setTheme = (newTheme: Theme) => {
    if(!['light','dark','system'].includes(newTheme))return;
    setThemeState(newTheme);
    localStorage.setItem('fixflow_theme', newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, [effectiveTheme]);

  // Language
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('fixflow_lang');
    return ['my','en','th','zh'].includes(saved || '') ? saved as Language : 'en';
  });

  // Settings
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);

  const currency: Currency = settings.currency || 'MMK';

  // Helper for auth headers
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('fixflow_auth_token');
    if (token && currentUser?.id) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, [currentUser?.id]);

  // Settings update
  const updateSettings = async (newSettings: Partial<SettingsState>): Promise<void> => {
    const res = await fetch('/api/settings', {
      method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(newSettings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save settings');
    setSettings(data);
  };

  // Interface language and accounting currency are independent.
  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('fixflow_lang', newLang);
  };
  const setCurrency = (newCurrency: Currency) => {
    updateSettings({ currency: newCurrency, currency_mode: 'manual' }).catch(err => alert(err.message));
  };

  const getCurrencySymbol = () => {
    return getCurrencySymbolUtil(currency);
  };

  // Payment profiles remain independent of the interface language.
  const activePaymentProfile: PaymentProfile = settings.paymentSettings?.active_profile || 'global';

  const setPaymentProfile = async (profile: PaymentProfile) => {
    const current = settings.paymentSettings || defaultSettings.paymentSettings!;
    await updateSettings({
      paymentSettings: {
        ...current,
        mode: 'manual',
        active_profile: profile,
      },
    });
  };

  const availablePaymentMethods: PaymentMethodConfig[] = (settings.paymentSettings || defaultSettings.paymentSettings!)[activePaymentProfile]?.methods.filter(m=>m.enabled) || [];

  const updatePaymentMethodConfig = async (
    profile: PaymentProfile,
    methodId: string,
    updates: Partial<PaymentMethodConfig>
  ) => {
    const current = settings.paymentSettings || defaultSettings.paymentSettings!;
    const profileKey = profile as PaymentProfile;
    const updatedMethods = (current[profileKey]?.methods || []).map((m) =>
      m.id === methodId ? { ...m, ...updates } : m
    );

    await updateSettings({
      paymentSettings: {
        ...current,
        [profileKey]: {
          ...current[profileKey],
          methods: updatedMethods,
        },
      },
    });
  };

  // Real Server & Internet Health System
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [isCheckingServer, setIsCheckingServer] = useState<boolean>(false);
  const [isInternetOnline, setIsInternetOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Track browser/device internet connection separately
  useEffect(() => {
    const handleOnline = () => setIsInternetOnline(true);
    const handleOffline = () => setIsInternetOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real HTTP Server Health Check function
  const checkServerHealth = useCallback(async (): Promise<boolean> => {
    setIsCheckingServer(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.ok) {
          setServerStatus('online');
          setIsCheckingServer(false);
          return true;
        }
      }
      setServerStatus('offline');
      setIsCheckingServer(false);
      return false;
    } catch (e) {
      clearTimeout(timeoutId);
      setServerStatus('offline');
      setIsCheckingServer(false);
      return false;
    }
  }, []);

  // Auto Server Check:
  // 1. Application startup
  // 2. Window/tab focus or active
  // 3. Periodic interval (every 15s)
  useEffect(() => {
    checkServerHealth();

    const intervalId = setInterval(() => {
      checkServerHealth();
    }, 15000);

    const handleFocus = () => {
      checkServerHealth();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkServerHealth();
      }
    });

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkServerHealth]);

  // Data states
  const [jobs, setJobs] = useState<ServiceJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [payments, setPayments] = useState<ServicePayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [auditTrail, setAuditTrail] = useState<SecurityAudit[]>([]);

  // Finance states (Admin only)
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [expenseRecords, setExpenseRecords] = useState<ExpenseRecord[]>([]);
  const [backupMetadata, setBackupMetadata] = useState<BackupMetadata | null>(null);

  // License State (Client State & Verified Server Response)
  const [license, setLicense] = useState<LicenseState>(defaultLicense);

  // Telegram Bot Configuration
  const [telegramBot, setTelegramBot] = useState<TelegramBotConfig>(defaultTelegramBot);

  const refreshLicense = useCallback(async () => {
    try {
      const res = await fetch('/api/license');
      if (res.ok) {
        const data = await res.json();
        setLicense(data);
      }
    } catch (e) {
      console.warn('Failed to load license', e);
    }
  }, []);

  const refreshTelegramBot = useCallback(async () => {
    try {
      const res = await fetch('/api/telegram', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTelegramBot(data);
      }
    } catch (e) {
      // 403 on FREE plan is expected
    }
  }, [getAuthHeaders]);

  const verifyLicense = async (): Promise<any> => {
    // If client internet is explicitly offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Internet Connection Required: License verification requires an active Internet connection to contact the Owner Server (posowner.myominaung.xyz).');
    }

    const res = await fetch('/api/license/verify', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to verify license with Owner Server.');
    }
    if (data.license) {
      setLicense(data.license);
    }
    return data;
  };

  const activateLicense = async (key: string): Promise<any> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('Internet Connection Required: License activation requires an active Internet connection to contact the Owner Server (posowner.myominaung.xyz).');
    }

    const res = await fetch('/api/license/activate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ license_key: key }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to activate license with Owner Server.');
    }
    if (data.license) {
      setLicense(data.license);
      await Promise.all([refreshFinance(), refreshTelegramBot()]);
    }
    return data;
  };

  const removeLicense = async (): Promise<any> => {
    const res = await fetch('/api/license/remove', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (data.license) {
      setLicense(data.license);
    }
    return data;
  };

  const canAccessFeature = (feature: 'telegram_bot' | 'income_report' | 'advanced_reports'): boolean => {
    return feature === 'telegram_bot' || (license.plan === 'PAID' && license.status === 'ACTIVE');
  };

  const updateTelegramBot = async (updates: Partial<TelegramBotConfig>): Promise<void> => {
    const res = await fetch('/api/telegram', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      setTelegramBot(data);
    } else {
      const data = await res.json();
      throw new Error(data.error || 'Could not save Telegram settings.');
    }
  };

  const testTelegramBot = async (token: string, chatId?: string): Promise<any> => {
    const res = await fetch('/api/telegram/test', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bot_token: token, chat_id: chatId }),
    });
    const data = await res.json();
    if (data.config) {
      setTelegramBot(data.config);
    }
    return data;
  };

  const getTelegramChatIds = async (token: string): Promise<{ success: boolean; chats?: any[]; error?: string }> => {
    const res = await fetch('/api/telegram/get-chat-ids', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ bot_token: token }),
    });
    return res.json();
  };

  const sendDailyTelegramSummary = async (): Promise<any> => {
    const res = await fetch('/api/telegram/daily-summary', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json();
  };

  const refreshFinance = useCallback(async () => {
    if (activeUser.role !== 'admin') return;
    try {
      const [incRes, expRes] = await Promise.all([
        fetch('/api/finance/income', { headers: getAuthHeaders() }),
        fetch('/api/finance/expense', { headers: getAuthHeaders() }),
      ]);
      if (incRes.ok) setIncomeRecords(await incRes.json());
      if (expRes.ok) setExpenseRecords(await expRes.json());
    } catch (err) {
      console.error('Failed to load finance records', err);
    }
  }, [activeUser.role, getAuthHeaders]);

  const fetchBackupMetadata = useCallback(async () => {
    if (activeUser.role !== 'admin') return null;
    try {
      const res = await fetch('/api/backup', { headers: getAuthHeaders() });
      if (res.ok) {
        const meta = await res.json();
        setBackupMetadata(meta);
        return meta;
      }
    } catch (err) {
      console.error('Failed to fetch backup metadata', err);
    }
    return null;
  }, [activeUser.role, getAuthHeaders]);

  // Fetch Jobs
  const refreshJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch('/api/jobs', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setLoadingJobs(false);
    }
  }, [getAuthHeaders]);

  // Fetch Payments
  const refreshPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const res = await fetch('/api/payments', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoadingPayments(false);
    }
  }, [getAuthHeaders]);

  // Fetch Technicians
  const refreshTechnicians = useCallback(async () => {
    setLoadingTechnicians(true);
    try {
      const res = await fetch('/api/technicians', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setTechnicians(data);
      }
    } catch (err) {
      console.error('Failed to load technicians', err);
    } finally {
      setLoadingTechnicians(false);
    }
  }, [getAuthHeaders]);

  // Fetch Customers & Devices
  const refreshMetadata = useCallback(async () => {
    try {
      const [cRes, dRes, sRes] = await Promise.all([
        fetch('/api/customers', { headers: getAuthHeaders() }),
        fetch('/api/devices', { headers: getAuthHeaders() }),
        fetch('/api/settings', { headers: getAuthHeaders() }),
      ]);
      if (cRes.ok) setCustomers(await cRes.json());
      if (dRes.ok) setDevices(await dRes.json());
      if (sRes.ok) {
        const loadedSettings: SettingsState = await sRes.json();
        setSettings(loadedSettings);
      }
    } catch (err) {
      console.error('Failed to load metadata', err);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (!currentUser?.id) return;
    let active = true;
    const refreshSettings = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const response = await fetch('/api/settings', { headers: getAuthHeaders() });
        if (response.ok) { const value = await response.json(); if (active) setSettings(value); }
      } catch { /* Existing settings remain usable while the LAN server is offline. */ }
    };
    const interval = window.setInterval(refreshSettings, 30000);
    window.addEventListener('focus', refreshSettings);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener('focus', refreshSettings); };
  }, [currentUser?.id, getAuthHeaders]);

  useEffect(()=>{
    if(!currentUser?.id)return;let active=true;
    const check=async()=>{try{const response=await fetch('/api/auth/me',{headers:getAuthHeaders()});if(active&&response.status===401)setCurrentUser(null);}catch{}};
    const timer=window.setInterval(check,30000);window.addEventListener('focus',check);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',check);};
  },[currentUser?.id,getAuthHeaders]);

  // Fetch Audit Trail
  const refreshAuditTrail = useCallback(async () => {
    if (activeUser.role !== 'admin') return;
    try {
      const res = await fetch('/api/audit', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setAuditTrail(await res.json());
      }
    } catch (err) {
      console.error('Failed to load audit trail', err);
    }
  }, [activeUser.role, getAuthHeaders]);

  // A saved UI profile is not proof of an authenticated session.
  useEffect(() => {
    const token = localStorage.getItem('fixflow_auth_token');
    if (!token) return;
    let cancelled = false;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => {
        if (cancelled) return;
        if (res.status === 401) setCurrentUser(null);
        else if (res.ok) {
          const data = await res.json();
          if (!cancelled) setCurrentUser(data.user);
        }
      }).catch(err => console.error('Session validation failed', err));
    return () => { cancelled = true; };
  }, []);

  // Reload data whenever currentUser changes
  useEffect(() => {
    refreshLicense();
    if (!currentUser) {
      setJobs([]); setPayments([]); setTechnicians([]); setCustomers([]); setDevices([]);
      setAuditTrail([]); setIncomeRecords([]); setExpenseRecords([]); setBackupMetadata(null);
      setTelegramBot(defaultTelegramBot);
      return;
    }
    refreshJobs();
    refreshPayments();
    refreshTechnicians();
    refreshMetadata();
    refreshAuditTrail();
    if (activeUser.role === 'admin') {
      refreshFinance();
      fetchBackupMetadata();
      refreshTelegramBot();
    }
  }, [currentUser?.id, activeUser.role, refreshJobs, refreshPayments, refreshTechnicians, refreshMetadata, refreshAuditTrail, refreshFinance, fetchBackupMetadata, refreshLicense, refreshTelegramBot]);

  // Job operations with API
  const createJob = async (jobData: any): Promise<ServiceJob> => {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create service job');
    }
    const created: ServiceJob = await res.json();
    window.dispatchEvent(new Event('fixflow:notifications-changed'));
    await Promise.all([refreshJobs(), refreshPayments(), refreshTechnicians()]);
    return created;
  };

  const updateJob = async (id: string, updates: Partial<ServiceJob>): Promise<ServiceJob> => {
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update service job');
    }
    const updated: ServiceJob = await res.json();
    window.dispatchEvent(new Event('fixflow:notifications-changed'));
    await Promise.all([refreshJobs(), refreshPayments(), refreshTechnicians()]);
    return updated;
  };

  const deleteJob = async (id: string): Promise<void> => {
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete service job');
    }
    await Promise.all([refreshJobs(), refreshPayments(), refreshTechnicians()]);
  };

  const reassignJob = async (jobId: string, newTechId: string): Promise<ServiceJob> => {
    return updateJob(jobId, { technician_id: newTechId });
  };

  // Payment operations
  const recordPayment = async (paymentData: {
    service_job_id: string;
    payment_method: string;
    amount: number;
    currency_code?: Currency;
    reference_number?: string;
    payment_note?: string;
    notes?: string;
    received_by?: string;
  }): Promise<ServicePayment> => {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...paymentData,
        currency_code: paymentData.currency_code || jobs.find(job => job.id === paymentData.service_job_id)?.currency_code,
        reference_number: paymentData.reference_number || '',
        payment_note: paymentData.payment_note || paymentData.notes || '',
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record payment');
    }
    const created: ServicePayment = await res.json();
    window.dispatchEvent(new Event('fixflow:notifications-changed'));
    await Promise.all([refreshJobs(), refreshPayments(), refreshTechnicians()]);
    return created;
  };

  // Technician operations
  const createTechnician = async (tech: Omit<Technician, 'id' | 'created_at'>): Promise<Technician> => {
    const res = await fetch('/api/technicians', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(tech),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register technician');
    }
    const created = await res.json();
    await refreshTechnicians();
    return created;
  };

  const updateTechnician = async (id: string, updates: Partial<Technician>): Promise<Technician> => {
    const res = await fetch(`/api/technicians/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update technician');
    }
    const updated = await res.json();
    await refreshTechnicians();
    return updated;
  };

  const resetTechnicianPassword = async (id: string, newPass: string): Promise<void> => {
    const res = await fetch(`/api/technicians/${id}/password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ new_password: newPass }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reset password');
    }
    window.dispatchEvent(new Event('fixflow-password-changed'));
  };

  const deleteTechnician = async (id: string): Promise<void> => {
    const res = await fetch(`/api/technicians/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete technician');
    }
    await Promise.all([refreshTechnicians(), refreshJobs()]);
  };

  // Customer & Device creation & management
  const createCustomer = async (cust: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cust),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create customer');
    }
    const created: Customer = await res.json();
    await refreshMetadata();
    return created;
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<Customer> => {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update customer');
    }
    const updated: Customer = await res.json();
    await refreshMetadata();
    return updated;
  };

  const previewCustomerDeletion = async (ids: string[]): Promise<CustomerDeletionPreview> => {
    const response = await fetch('/api/customers/delete-preview', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ customer_ids: ids }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not preview deletion');
    return data;
  };
  const deleteCustomersWithRecords = async (ids: string[], revision: string): Promise<void> => {
    const response = await fetch('/api/customers/delete-confirmed', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ customer_ids: ids, revision }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not delete customer records');
    await Promise.all([refreshMetadata(), refreshJobs(), refreshPayments(), refreshTechnicians(), refreshFinance(), refreshAuditTrail()]);
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    const res = await fetch(`/api/customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete customer');
    }
    await refreshMetadata();
  };

  const createDevice = async (dev: Omit<Device, 'id' | 'created_at'>): Promise<Device> => {
    const res = await fetch('/api/devices', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dev),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create device');
    }
    const created: Device = await res.json();
    await refreshMetadata();
    return created;
  };

  const updateDevice = async (id: string, updates: Partial<Device>): Promise<Device> => {
    const res = await fetch(`/api/devices/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update device');
    }
    const updated: Device = await res.json();
    await refreshMetadata();
    return updated;
  };

  const updateDeviceCategory = async (id: string, category: string): Promise<Device> => {
    const response = await fetch(`/api/devices/${encodeURIComponent(id)}/category`, {method:'PUT',headers:getAuthHeaders(),body:JSON.stringify({category})});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update category');
    await Promise.all([refreshMetadata(), refreshJobs()]);
    return result;
  };

  const previewDeviceDeletion=async(ids:string[]):Promise<CustomerDeletionPreview>=>{
    const response=await fetch('/api/devices/delete-preview',{method:'POST',headers:getAuthHeaders(),body:JSON.stringify({device_ids:ids})});const value=await response.json();if(!response.ok)throw new Error(value.error);return value;
  };
  const deleteDevicesWithRecords=async(ids:string[],revision:string):Promise<void>=>{
    const response=await fetch('/api/devices/delete-confirmed',{method:'POST',headers:getAuthHeaders(),body:JSON.stringify({device_ids:ids,revision})});const value=await response.json();if(!response.ok)throw new Error(value.error);
    await Promise.all([refreshMetadata(),refreshJobs(),refreshPayments(),refreshTechnicians(),refreshFinance(),refreshAuditTrail()]);
  };

  const deleteDevice = async (id: string): Promise<void> => {
    const res = await fetch(`/api/devices/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete device');
    }
    await refreshMetadata();
  };

  // Finance Actions (Admin only)
  const createIncome = async (data: any): Promise<IncomeRecord> => {
    const res = await fetch('/api/finance/income', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create income record');
    }
    const created: IncomeRecord = await res.json();
    await refreshFinance();
    return created;
  };

  const createExpense = async (data: any): Promise<ExpenseRecord> => {
    const res = await fetch('/api/finance/expense', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create expense record');
    }
    const created: ExpenseRecord = await res.json();
    await refreshFinance();
    return created;
  };

  const updateExpense = async (id: string, data: Partial<ExpenseRecord>): Promise<ExpenseRecord> => {
    const response = await fetch(`/api/finance/expense/${encodeURIComponent(id)}`, {method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data)});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update expense');
    await refreshFinance();
    return result;
  };

  const deleteIncome = async (id: string): Promise<void> => {
    const res = await fetch(`/api/finance/income/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete income record');
    }
    await refreshFinance();
  };

  const deleteExpense = async (id: string): Promise<void> => {
    const res = await fetch(`/api/finance/expense/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete expense record');
    }
    await refreshFinance();
  };

  const createBackup = async (): Promise<any> => {
    const res = await fetch('/api/backup', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create backup');
    }
    const backup = await res.json();
    setBackupMetadata(backup.metadata);
    await refreshAuditTrail();
    return backup;
  };

  const restoreBackup = async (data: any): Promise<{ success: boolean; message?: string; error?: string }> => {
    const res = await fetch('/api/restore', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      return { success: false, error: result.error || 'Failed to restore database' };
    }
    await Promise.all([
      refreshJobs(),
      refreshPayments(),
      refreshTechnicians(),
      refreshMetadata(),
      refreshAuditTrail(),
      refreshFinance(),
      fetchBackupMetadata(),
    ]);
    return { success: true, message: result.message || 'Database successfully restored and verified.' };
  };

  const login = async (username: string, password?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {const data=await res.json();throw new Error(data.error || 'Login failed.');}
      if (res.ok) {
        const { user, token } = await res.json();
        localStorage.setItem('fixflow_auth_token', token);
        setCurrentUser(user);
        const targetRoute = user.role === 'admin' ? '/admin/dashboard' : user.role === 'cashier' ? '/cashier/dashboard' : '/technician/dashboard';
        navigate(targetRoute);
        return true;
      }
    } catch (e) {
      throw e instanceof Error ? e : new Error('Cannot connect to the login server.');
    }
    return false;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (e) {}
    setCurrentUser(null);
    navigate('/');
  };

  const changePassword = async (current_password: string, new_password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ current_password, new_password }),
      });
      const data = await res.json();
      if (res.ok) {
        window.dispatchEvent(new Event('fixflow-password-changed'));
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to change password.' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  // Formatters
  const formatCurrency = (amount: number, overrideCurrency?: Currency) => {
    return formatCurrencyUtil(amount, overrideCurrency || currency);
  };

  const formatDate = (date: string | Date | undefined) => {
    return formatLocalizedDate(date, language, settings.dateFormat);
  };

  const t = (key: TranslationKey): string => {
    const langDict: Partial<Record<TranslationKey, string>> = translations[language] || translations.en;
    return (langDict[key] || translations.en[key] || key) as string;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        role,
        technicianId,
        theme,
        setTheme,
        effectiveTheme,
        language,
        setLanguage,
        currency,
        setCurrency,
        getCurrencySymbol,
        activePaymentProfile,
        setPaymentProfile,
        availablePaymentMethods,
        updatePaymentMethodConfig,
        settings,
        updateSettings,
        jobs,
        loadingJobs,
        refreshJobs,
        createJob,
        updateJob,
        deleteJob,
        reassignJob,
        payments,
        loadingPayments,
        refreshPayments,
        recordPayment,
        technicians,
        loadingTechnicians,
        refreshTechnicians,
        createTechnician,
        updateTechnician,
        resetTechnicianPassword,
        deleteTechnician,
        customers,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        previewCustomerDeletion,
        deleteCustomersWithRecords,
        devices,
        createDevice,
        updateDevice,
        updateDeviceCategory,
        deleteDevice,
        previewDeviceDeletion,
        deleteDevicesWithRecords,
        auditTrail,
        refreshAuditTrail,
        incomeRecords,
        expenseRecords,
        refreshFinance,
        createIncome,
        createExpense,
        updateExpense,
        deleteIncome,
        deleteExpense,
        backupMetadata,
        fetchBackupMetadata,
        createBackup,
        restoreBackup,
        getAuthHeaders,
        license,
        refreshLicense,
        verifyLicense,
        activateLicense,
        removeLicense,
        canAccessFeature,
        telegramBot,
        refreshTelegramBot,
        updateTelegramBot,
        testTelegramBot,
        getTelegramChatIds,
        sendDailyTelegramSummary,
        currentPath,
        navigate,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        formatCurrency,
        formatDate,
        t,
        login,
        logout,
        changePassword,
        serverStatus,
        isCheckingServer,
        checkServerHealth,
        isInternetOnline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return {
    ...context,
    currentUser: context.currentUser as User,
  };
};
