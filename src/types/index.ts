export type Role = 'admin' | 'technician' | 'cashier' | 'guest';

export type Theme = 'light' | 'dark' | 'system';

export type Language = 'my' | 'en' | 'th' | 'zh';

export type Currency = 'MMK' | 'USD' | 'THB' | 'CNY';

export type CurrencyMode = 'manual';

export type PaymentProfile = 'thailand' | 'myanmar' | 'china' | 'global';

export type DateFormat = 'DD-MM-YYYY' | 'DD MMM YYYY' | 'YYYY-MM-DD';

export type ServiceStatus =
  | 'received'
  | 'diagnosing'
  | 'waiting_parts'
  | 'repairing'
  | 'ready'
  | 'completed'
  | 'delivered'
  | 'cancelled';

export type TicketPriority = 'normal' | 'urgent' | 'express';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface User {
  staff_code?: string;
  address?: string;
  password?: string;
  active?: boolean;
  id: string;
  username: string;
  full_name: string;
  role: Role;
  technician_id?: string;
  profile_photo?: string;
  email?: string;
  phone?: string;
  created_at: string;
}

export interface Technician {
  is_demo?: boolean;
  id: string; // e.g. "TECH-001"
  full_name: string;
  username: string;
  password?: string; // used for reset/form
  password_hash?: string;
  phone: string;
  email: string;
  address: string;
  profile_photo?: string;
  status: 'active' | 'inactive';
  level?: 'Senior' | 'Junior';
  specialization: string[];
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  created_at: string;
}

export interface Device {
  id: string;
  brand: string;
  model: string;
  category: 'smartphone' | 'laptop' | 'tablet' | 'desktop' | 'audio' | 'other';
  serial_or_imei: string;
  customer_id: string;
  condition_notes: string;
  created_at: string;
}

export interface ServiceJobPart {
  id: string;
  service_job_id: string;
  part_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  warranty: string;
}

export interface ServiceJob {
  intake_received_by?: string;
  intake_cashier_id?: string;
  intake_username?: string;
  id: string;
  service_number: string; // e.g. "SRV-202610-0001"
  customer_id: string; // FK -> customers.id
  device_id: string; // FK -> devices.id
  technician_id: string; // FK -> technicians.id (MANDATORY RELATIONSHIP)
  category_id?: string;
  status_id: ServiceStatus;
  priority: TicketPriority;
  problem_description: string;
  diagnosis?: string;
  repair_notes?: string;
  completion_notes?: string;
  service_charge: number;
  parts_cost: number;
  total_cost: number;
  amount_paid: number;
  currency_code?: Currency; // Monetary accounting currency
  payment_status: PaymentStatus;
  payment_method?: string;
  warranty_days: number;
  passlock_pin?: string;
  received_at: string;
  completed_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;

  // Populated relational models
  technician?: Technician;
  customer?: Customer;
  device?: Device;
  parts_used?: ServiceJobPart[];
  payments?: ServicePayment[];
}

export interface ServicePayment {
  cashier_id?: string;
  id: string; // e.g. "PAY-202610-0001"
  service_job_id: string;
  service_number?: string;
  customer_name?: string;
  technician_id?: string;
  technician_name?: string; // MUST be the assigned job's technician name
  payment_method: string; // e.g. "kplus", "scb_easy", "promptpay", "cash", etc.
  amount: number;
  currency_code: Currency;
  reference_number?: string; // bank reference / slip / txn id
  payment_note?: string; // note or memo
  notes?: string; // alias for note
  paid_at: string;
  received_by: string;
  created_by?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  delete_reason?: string;
  updated_at?: string;
  updated_by?: string;
  edit_reason?: string;
  status?: 'completed' | 'deleted' | 'settled';
}

export interface IncomeRecord {
  id: string; // e.g. "INC-202610-0001"
  date: string;
  reference: string;
  service_number?: string;
  service_job_id?: string;
  customer_name?: string;
  technician_id?: string;
  technician_name?: string;
  description: string;
  amount: number;
  currency: Currency;
  payment_method: string;
  created_by: string;
  created_at: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

export interface ExpenseRecord {
  id: string; // e.g. "EXP-202610-0001"
  date: string;
  reference: string;
  category: 'Parts' | 'Tools' | 'Rent' | 'Utilities' | 'Salary' | 'Consumables' | 'Shipping' | 'Other' | string;
  description: string;
  amount: number;
  currency: Currency;
  payment_method: string;
  created_by: string;
  created_at: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

export interface SettlementRecord {
  id: string; // e.g. "SETTLE-202610-0001"
  settlement_type: 'daily' | 'monthly' | 'custom';
  period_start: string;
  period_end: string;
  total_service_charges: number;
  total_payments: number;
  outstanding_balance: number;
  total_income: number;
  total_expense: number;
  net_balance: number;
  currency: Currency;
  status: 'draft' | 'closed';
  closed_by?: string;
  closed_at?: string;
  notes?: string;
  created_at: string;
}

export interface BackupMetadata {
  id: string;
  filename: string;
  created_at: string;
  size_bytes: number;
  item_counts: Record<string, number>;
  status: 'valid' | 'corrupted';
}

export interface SecurityAudit {
  id: string;
  user_id: string;
  username: string;
  technician_id?: string;
  action: string;
  target_type: 'job' | 'technician' | 'auth' | 'system' | 'payment' | 'finance' | 'backup';
  target_id: string;
  details: string;
  old_value?: any;
  new_value?: any;
  reason?: string;
  ip_address: string;
  created_at: string;
}

export interface LoginAttempt {
  id: string;
  username: string;
  success: boolean;
  ip_address: string;
  attempted_at: string;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  thai_name?: string;
  enabled: boolean;
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  qr_code?: string;
  instructions?: string;
}

export interface PaymentProfileSettings {
  mode: 'auto' | 'manual';
  active_profile?: PaymentProfile;
  thailand: {
    methods: PaymentMethodConfig[];
  };
  myanmar: {
    methods: PaymentMethodConfig[];
  };
  global: {
    methods: PaymentMethodConfig[];
  };
  china: { methods: PaymentMethodConfig[]; };
}

export type LicensePlan = 'FREE' | 'PAID';

export type LicenseStatus =
  | 'NOT_ACTIVATED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'REVOKED'
  | 'DEACTIVATED';

export interface LicenseState {
  license_name: string;
  plan: LicensePlan;
  status: LicenseStatus;
  license_key: string;
  installation_id: string;
  license_days: number;
  expires_at: string | null;
  last_verified_at: string | null;
  server_url: string;
  device_token?: string;
  owner_verified?: boolean;
}

export interface LicenseRegistryItem {
  id: string;
  license_key: string;
  plan: LicensePlan;
  license_name: string;
  days: number;
  status: LicenseStatus;
  created_at: string;
  created_by: string;
  activated_at?: string | null;
  installation_id?: string | null;
}

export interface TelegramBotConfig {
  enabled: boolean;
  bot_token: string;
  chat_id: string;
  channel_username?: string;
  notify_on_new_job: boolean;
  notify_on_status_change: boolean;
  notify_on_payment: boolean;
  notify_on_daily_summary: boolean;
  is_connected: boolean;
  bot_name?: string;
  bot_username?: string;
  last_tested_at?: string;
}

export interface SettingsState {
  shopName: string;
  phone: string;
  email: string;
  address: string;
  shopLogo?: string;
  receiptFooterNote: string;
  defaultWarrantyDays: number;
  currency: Currency;
  currency_mode: CurrencyMode;
  language: Language;
  theme: Theme;
  dateFormat: DateFormat;
  paperSize: 'A4' | '80mm';
  taxPercentage: number;
  taxEnabled?: boolean;
  taxId?: string;
  paymentMethods: string[];
  paymentSettings?: PaymentProfileSettings;
  license?: LicenseState;
  telegramBot?: TelegramBotConfig;
}

export type NotificationType = 'new_job' | 'assigned_job' | 'reassigned_job' | 'status_change' | 'payment_received';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  service_job_id: string;
  service_number: string;
  status_id?: ServiceStatus;
  previous_status?: ServiceStatus;
  amount?: number;
  currency_code?: Currency;
  created_at: string;
  read_at?: string;
  dismissed_at?: string;
}

export interface CustomerDeletionPreview {
  names: string[];
  customers: number;
  devices: number;
  jobs: number;
  parts: number;
  payments: number;
  income: number;
  notifications: number;
  revision: string;
}
