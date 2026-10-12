import { defaultPaymentSettings, removeDemoPaymentDetails } from '../utils/paymentDefaults.ts';
import fs from 'fs';
import path from 'path';
import { randomUUID, createHash } from 'node:crypto';
import {
  AppNotification,
  NotificationType,
  Customer,
  CustomerDeletionPreview,
  Device,
  IncomeRecord,
  ExpenseRecord,
  SettlementRecord,
  BackupMetadata,
  LoginAttempt,
  PaymentMethodConfig,
  PaymentProfileSettings,
  SecurityAudit,
  ServiceJob,
  ServiceJobPart,
  ServicePayment,
  SettingsState,
  Technician,
  User,
  LicenseState,
  TelegramBotConfig,
  LicenseRegistryItem,
} from '../types';

interface DatabaseSchema {
  users: User[];
  technicians: Technician[];
  customers: Customer[];
  devices: Device[];
  service_jobs: ServiceJob[];
  service_job_parts: ServiceJobPart[];
  service_payments: ServicePayment[];
  income_records: IncomeRecord[];
  expense_records: ExpenseRecord[];
  settlements: SettlementRecord[];
  security_audit: SecurityAudit[];
  login_attempts: LoginAttempt[];
  settings: SettingsState;
  licenses_registry: LicenseRegistryItem[];
  id_counters?: Record<string, number>;
  notifications?: AppNotification[];
}

const DB_PATH = path.resolve(process.env.FIXFLOW_DATA_DIR || path.resolve(process.cwd(), 'data'), 'db.json');

// Initial seed data
const initialSeed: DatabaseSchema = {
  licenses_registry: [
    {
      id: 'LIC-REG-001',
      license_key: 'PAID-PRO-2026-365D',
      plan: 'PAID',
      license_name: 'FixFlow Professional Phone Service System',
      days: 365,
      status: 'ACTIVE',
      created_at: '2026-01-01T00:00:00Z',
      created_by: 'system',
    },
    {
      id: 'LIC-REG-002',
      license_key: 'PAID-ENTERPRISE-LIFETIME',
      plan: 'PAID',
      license_name: 'FixFlow Enterprise Phone Service System',
      days: 3650,
      status: 'ACTIVE',
      created_at: '2026-01-01T00:00:00Z',
      created_by: 'system',
    },
  ],
  users: [
    {
      id: 'USR-001',
      username: 'admin',
      full_name: 'Lead Workshop Administrator',
      role: 'admin',
      created_at: '2026-08-01T08:00:00Z',
    },
    {
      id: 'USR-TECH-001',
      username: 'kyawzin',
      full_name: 'Kyaw Zin Win',
      role: 'technician',
      technician_id: 'TECH-001',
      created_at: '2026-08-01T09:00:00Z',
    },
    {
      id: 'USR-TECH-002',
      username: 'somchai',
      full_name: 'Somchai Prasert',
      role: 'technician',
      technician_id: 'TECH-002',
      created_at: '2026-08-02T10:00:00Z',
    },
    {
      id: 'USR-TECH-003',
      username: 'aungko',
      full_name: 'Aung Ko Min',
      role: 'technician',
      technician_id: 'TECH-003',
      created_at: '2026-08-05T11:00:00Z',
    },
    {
      id: 'USR-TECH-004',
      username: 'thiri',
      full_name: 'Thiri Htun',
      role: 'technician',
      technician_id: 'TECH-004',
      created_at: '2026-08-10T14:00:00Z',
    },
  ],

  technicians: [
    {
      id: 'TECH-001',
      full_name: 'Kyaw Zin Win',
      username: 'kyawzin',
      phone: '+95 9 444 888 111',
      email: 'kyawzin@fixflowlab.com',
      address: 'Bay 1 - Micro-soldering Station, Yangon Lab',
      status: 'active',
      level: 'Senior',
      specialization: ['Motherboard Micro-soldering', 'Power IC', 'Face ID'],
      created_at: '2026-08-01T09:00:00Z',
    },
    {
      id: 'TECH-002',
      full_name: 'Somchai Prasert',
      username: 'somchai',
      phone: '+66 81 234 5678',
      email: 'somchai@fixflowlab.com',
      address: 'Bay 2 - Screen Lamination & Glass Lab',
      status: 'active',
      level: 'Senior',
      specialization: ['OLED Lamination', 'Touch Digitizer', 'iPad Glass'],
      created_at: '2026-08-02T10:00:00Z',
    },
    {
      id: 'TECH-003',
      full_name: 'Aung Ko Min',
      username: 'aungko',
      phone: '+95 9 555 123 999',
      email: 'aungko@fixflowlab.com',
      address: 'Bay 3 - Mac & Logic Board Desk',
      status: 'active',
      level: 'Junior',
      specialization: ['MacBook Logic Board', 'Power Rail Short', 'Liquid Damage'],
      created_at: '2026-08-05T11:00:00Z',
    },
    {
      id: 'TECH-004',
      full_name: 'Thiri Htun',
      username: 'thiri',
      phone: '+95 9 777 222 333',
      email: 'thiri@fixflowlab.com',
      address: 'Bay 4 - Hardware Diagnostics & Intake',
      status: 'active',
      level: 'Junior',
      specialization: ['Battery Diagnostics', 'Charging Ports', 'Firmware Flash'],
      created_at: '2026-08-10T14:00:00Z',
    },
  ],

  customers: [
    {
      id: 'CUST-001',
      name: 'Ko Aung',
      phone: '+95 9 250 111 222',
      email: 'koaung@gmail.com',
      address: 'Sanchaung Township, Yangon',
      created_at: '2026-08-14T09:30:00Z',
    },
    {
      id: 'CUST-002',
      name: 'Anong Srichan',
      phone: '+66 89 876 5432',
      email: 'anong.s@outlook.com',
      address: 'Bang Rak, Bangkok',
      created_at: '2026-09-02T11:15:00Z',
    },
    {
      id: 'CUST-003',
      name: 'Htet Lin Aung',
      phone: '+95 9 421 999 888',
      email: 'htet.lin@gmail.com',
      address: 'Kamayut Township, Yangon',
      created_at: '2026-09-18T14:00:00Z',
    },
    {
      id: 'CUST-004',
      name: 'Marcus Vance',
      phone: '+1 415 555 0192',
      email: 'm.vance@techstudio.io',
      address: 'Bahan Diplomatic Zone, Yangon',
      created_at: '2026-09-25T16:20:00Z',
    },
    {
      id: 'CUST-005',
      name: 'Nang Kham Hlaing',
      phone: '+95 9 780 444 333',
      email: 'nangkham@gmail.com',
      address: 'Mayangone Township, Yangon',
      created_at: '2026-10-02T10:45:00Z',
    },
  ],

  devices: [
    {
      id: 'DEV-001',
      brand: 'Apple',
      model: 'iPhone 13',
      category: 'smartphone',
      serial_or_imei: '359482019482019',
      customer_id: 'CUST-001',
      condition_notes: 'Phone does not boot. Housing in good condition.',
      created_at: '2026-08-14T09:30:00Z',
    },
    {
      id: 'DEV-002',
      brand: 'Samsung',
      model: 'Galaxy S24 Ultra',
      category: 'smartphone',
      serial_or_imei: '990012847162940',
      customer_id: 'CUST-002',
      condition_notes: 'Dropped into water. Power IC shorted.',
      created_at: '2026-09-02T11:15:00Z',
    },
    {
      id: 'DEV-003',
      brand: 'Apple',
      model: 'MacBook Pro 16" (M2 Max)',
      category: 'laptop',
      serial_or_imei: 'C02FK309MD6T',
      customer_id: 'CUST-003',
      condition_notes: 'Screen backlight glitch past 90 degrees.',
      created_at: '2026-09-18T14:00:00Z',
    },
    {
      id: 'DEV-004',
      brand: 'Dell',
      model: 'XPS 15 9530',
      category: 'laptop',
      serial_or_imei: '8H29KQ3',
      customer_id: 'CUST-004',
      condition_notes: 'Battery swelling trackpad up.',
      created_at: '2026-09-25T16:20:00Z',
    },
    {
      id: 'DEV-005',
      brand: 'Apple',
      model: 'iPad Pro 12.9" (6th Gen)',
      category: 'tablet',
      serial_or_imei: 'DMPZM84JNR7G',
      customer_id: 'CUST-005',
      condition_notes: 'USB-C pin bent inside port.',
      created_at: '2026-10-02T10:45:00Z',
    },
    {
      id: 'DEV-006',
      brand: 'Samsung',
      model: 'Galaxy A54',
      category: 'smartphone',
      serial_or_imei: '354819028471620',
      customer_id: 'CUST-001',
      condition_notes: 'Charging port intermittent.',
      created_at: '2026-10-04T12:00:00Z',
    },
    {
      id: 'DEV-007',
      brand: 'Xiaomi',
      model: 'Redmi 12',
      category: 'smartphone',
      serial_or_imei: '864910293847192',
      customer_id: 'CUST-003',
      condition_notes: 'Cracked screen glass.',
      created_at: '2026-10-05T14:00:00Z',
    },
  ],

  service_jobs: [
    {
      id: 'JOB-001',
      service_number: 'SRV-202610-0001',
      customer_id: 'CUST-001',
      device_id: 'DEV-001',
      technician_id: 'TECH-001', // Assigned to Kyaw Zin Win
      status_id: 'repairing',
      priority: 'urgent',
      problem_description: 'No Power, completely unresponsive to charging.',
      diagnosis: 'VCC_MAIN short to ground caused by cracked ceramic decoupling capacitor near PMIC.',
      repair_notes: 'Removed shorted capacitor under microscope. Cleaned solder pads and re-flowed power rail.',
      service_charge: 50000,
      parts_cost: 0,
      total_cost: 50000,
      amount_paid: 20000,
      payment_status: 'partial',
      payment_method: 'digital_wallet',
      warranty_days: 30,
      passlock_pin: '1234',
      received_at: '2026-10-06T09:30:00Z',
      created_at: '2026-10-06T09:30:00Z',
      updated_at: '2026-10-07T14:00:00Z',
    },
    {
      id: 'JOB-002',
      service_number: 'SRV-202610-0002',
      customer_id: 'CUST-002',
      device_id: 'DEV-002',
      technician_id: 'TECH-001', // Assigned to Kyaw Zin Win
      status_id: 'waiting_parts',
      priority: 'express',
      problem_description: 'Dropped in swimming pool. Shuts off immediately after Samsung logo.',
      diagnosis: 'Corrosion under primary Power Management IC (PMIC). Replacement IC required.',
      repair_notes: 'Ultrasonic board clean completed. Ordered original PMIC chip from vendor.',
      service_charge: 65000,
      parts_cost: 45000,
      total_cost: 110000,
      amount_paid: 50000,
      payment_status: 'partial',
      payment_method: 'digital_wallet',
      warranty_days: 60,
      passlock_pin: '0000',
      received_at: '2026-10-05T11:00:00Z',
      created_at: '2026-10-05T11:00:00Z',
      updated_at: '2026-10-07T10:00:00Z',
    },
    {
      id: 'JOB-003',
      service_number: 'SRV-202610-0003',
      customer_id: 'CUST-003',
      device_id: 'DEV-003',
      technician_id: 'TECH-003', // Assigned to Aung Ko Min
      status_id: 'diagnosing',
      priority: 'normal',
      problem_description: 'Backlight turns off when display lid opened past 90 degrees.',
      diagnosis: 'Dustgate stress fracture on eDP embedded display port ribbon flex.',
      repair_notes: 'Inspecting with microscope to prepare micro-jumper wiring.',
      service_charge: 70000,
      parts_cost: 30000,
      total_cost: 100000,
      amount_paid: 0,
      payment_status: 'unpaid',
      warranty_days: 90,
      received_at: '2026-10-07T13:00:00Z',
      created_at: '2026-10-07T13:00:00Z',
      updated_at: '2026-10-07T15:30:00Z',
    },
    {
      id: 'JOB-004',
      service_number: 'SRV-202610-0004',
      customer_id: 'CUST-004',
      device_id: 'DEV-004',
      technician_id: 'TECH-004', // Assigned to Thiri Htun
      status_id: 'ready',
      priority: 'urgent',
      problem_description: 'Battery pouch swelling pushing up trackpad.',
      diagnosis: 'Severely degraded lithium polymer cell pack. Urgent replacement needed.',
      repair_notes: 'Safely extracted swollen battery. Installed genuine 86Wh Dell pack.',
      completion_notes: 'System stress test passed. Thermals stable. Device ready for pickup.',
      service_charge: 35000,
      parts_cost: 105000,
      total_cost: 140000,
      amount_paid: 140000,
      payment_status: 'paid',
      payment_method: 'transfer',
      warranty_days: 180,
      received_at: '2026-10-04T10:00:00Z',
      completed_at: '2026-10-07T16:00:00Z',
      created_at: '2026-10-04T10:00:00Z',
      updated_at: '2026-10-07T16:00:00Z',
    },
    {
      id: 'JOB-005',
      service_number: 'SRV-202610-0005',
      customer_id: 'CUST-005',
      device_id: 'DEV-005',
      technician_id: 'TECH-003', // Assigned to Aung Ko Min
      status_id: 'completed',
      priority: 'normal',
      problem_description: 'USB-C charging connector loose. Only charges at certain angle.',
      diagnosis: 'Damaged internal center pin block inside USB-C receptacle.',
      repair_notes: 'Replaced USB-C daughterboard module with OEM component.',
      completion_notes: 'Tested 30W Power Delivery and display video output. Full charging speed restored.',
      service_charge: 45000,
      parts_cost: 50000,
      total_cost: 95000,
      amount_paid: 95000,
      payment_status: 'paid',
      payment_method: 'cash',
      warranty_days: 90,
      received_at: '2026-10-02T11:00:00Z',
      completed_at: '2026-10-05T14:30:00Z',
      created_at: '2026-10-02T11:00:00Z',
      updated_at: '2026-10-05T14:30:00Z',
    },
    {
      id: 'JOB-006',
      service_number: 'SRV-202610-0006',
      customer_id: 'CUST-001',
      device_id: 'DEV-006',
      technician_id: 'TECH-002', // Assigned to Somchai Prasert
      status_id: 'repairing',
      priority: 'normal',
      problem_description: 'Intermittent charging and loose cable fit.',
      diagnosis: 'USB-C flex sub-board damaged.',
      repair_notes: 'Disassembled phone and replacing sub-board.',
      service_charge: 25000,
      parts_cost: 15000,
      total_cost: 40000,
      amount_paid: 0,
      payment_status: 'unpaid',
      warranty_days: 60,
      received_at: '2026-10-07T08:00:00Z',
      created_at: '2026-10-07T08:00:00Z',
      updated_at: '2026-10-07T11:00:00Z',
    },
    {
      id: 'JOB-007',
      service_number: 'SRV-202610-0007',
      customer_id: 'CUST-003',
      device_id: 'DEV-007',
      technician_id: 'TECH-001', // Assigned to Kyaw Zin Win
      status_id: 'ready',
      priority: 'normal',
      problem_description: 'Screen glass cracked, touch working.',
      diagnosis: 'Outer glass separation and OCA refurbishing.',
      repair_notes: 'Separated broken outer glass on heated vacuum platform. Laminated new 9H tempered glass lens.',
      completion_notes: 'Screen tested, touch sensitivity 100%. Ready for customer collection.',
      service_charge: 30000,
      parts_cost: 15000,
      total_cost: 45000,
      amount_paid: 45000,
      payment_status: 'paid',
      payment_method: 'cash',
      warranty_days: 90,
      received_at: '2026-10-06T14:00:00Z',
      completed_at: '2026-10-07T17:00:00Z',
      created_at: '2026-10-06T14:00:00Z',
      updated_at: '2026-10-07T17:00:00Z',
    },
    {
      id: 'JOB-008',
      service_number: 'SRV-202610-0008',
      customer_id: 'CUST-002',
      device_id: 'DEV-002',
      technician_id: 'TECH-001', // Assigned to Kyaw Zin Win
      status_id: 'completed',
      priority: 'normal',
      problem_description: 'Rear camera lens glass scratched.',
      diagnosis: 'Camera protective bezel scratch.',
      repair_notes: 'Replaced sapphire glass bezel.',
      completion_notes: 'Focus calibrated.',
      service_charge: 20000,
      parts_cost: 10000,
      total_cost: 30000,
      amount_paid: 30000,
      payment_status: 'paid',
      payment_method: 'transfer',
      warranty_days: 90,
      received_at: '2026-10-01T10:00:00Z',
      completed_at: '2026-10-03T12:00:00Z',
      delivered_at: '2026-10-04T15:00:00Z',
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-04T15:00:00Z',
    },
  ],

  service_job_parts: [
    {
      id: 'PART-001',
      service_job_id: 'JOB-002',
      part_name: 'PMIC Power Management IC BGA Chip',
      quantity: 1,
      unit_cost: 45000,
      total_cost: 45000,
      warranty: '60 Days',
    },
    {
      id: 'PART-002',
      service_job_id: 'JOB-003',
      part_name: 'Display Flex Jumper Wire & UV Mask',
      quantity: 1,
      unit_cost: 30000,
      total_cost: 30000,
      warranty: '90 Days',
    },
    {
      id: 'PART-003',
      service_job_id: 'JOB-004',
      part_name: 'Dell Original 86Wh Li-Ion Battery Pack',
      quantity: 1,
      unit_cost: 105000,
      total_cost: 105000,
      warranty: '180 Days',
    },
    {
      id: 'PART-004',
      service_job_id: 'JOB-005',
      part_name: 'OEM iPad Pro 12.9" USB-C Port Module',
      quantity: 1,
      unit_cost: 50000,
      total_cost: 50000,
      warranty: '90 Days',
    },
    {
      id: 'PART-005',
      service_job_id: 'JOB-006',
      part_name: 'Galaxy A54 Charging Board Flex',
      quantity: 1,
      unit_cost: 15000,
      total_cost: 15000,
      warranty: '60 Days',
    },
    {
      id: 'PART-006',
      service_job_id: 'JOB-007',
      part_name: 'Redmi 12 Gorilla Glass Front Lens',
      quantity: 1,
      unit_cost: 15000,
      total_cost: 15000,
      warranty: '90 Days',
    },
  ],

  service_payments: [
    {
      id: 'PAY-001',
      service_job_id: 'JOB-001',
      payment_method: 'KBZ Pay',
      amount: 20000,
      currency_code: 'MMK',
      paid_at: '2026-10-06T09:35:00Z',
      received_by: 'Admin',
      notes: 'Initial diagnosis advance deposit',
    },
    {
      id: 'PAY-002',
      service_job_id: 'JOB-002',
      payment_method: 'Wave Pay',
      amount: 50000,
      currency_code: 'MMK',
      paid_at: '2026-10-05T11:15:00Z',
      received_by: 'Admin',
      notes: 'Parts deposit for replacement PMIC',
    },
    {
      id: 'PAY-003',
      service_job_id: 'JOB-004',
      payment_method: 'Bank Transfer',
      amount: 140000,
      currency_code: 'MMK',
      paid_at: '2026-10-07T16:10:00Z',
      received_by: 'Thiri Htun',
      notes: 'Full payment settled upon battery replacement',
    },
    {
      id: 'PAY-004',
      service_job_id: 'JOB-005',
      payment_method: 'Cash',
      amount: 95000,
      currency_code: 'MMK',
      paid_at: '2026-10-05T14:40:00Z',
      received_by: 'Aung Ko Min',
      notes: 'Cash collected upon delivery',
    },
    {
      id: 'PAY-005',
      service_job_id: 'JOB-007',
      payment_method: 'Cash',
      amount: 45000,
      currency_code: 'MMK',
      paid_at: '2026-10-07T17:05:00Z',
      received_by: 'Kyaw Zin Win',
      notes: 'Screen refurbishment completed',
    },
    {
      id: 'PAY-006',
      service_job_id: 'JOB-008',
      payment_method: 'Bank Transfer',
      amount: 30000,
      currency_code: 'MMK',
      paid_at: '2026-10-03T12:00:00Z',
      received_by: 'Kyaw Zin Win',
      notes: 'Full settlement',
    },
  ],

  security_audit: [
    {
      id: 'AUD-001',
      user_id: 'USR-001',
      username: 'admin',
      action: 'SYSTEM_BOOT',
      target_type: 'system',
      target_id: 'SYS-MAIN',
      details: 'FixFlow system initialized with relational database tables.',
      ip_address: '127.0.0.1',
      created_at: '2026-10-08T08:00:00Z',
    },
    {
      id: 'AUD-002',
      user_id: 'USR-001',
      username: 'admin',
      technician_id: 'TECH-001',
      action: 'JOB_ASSIGNMENT',
      target_type: 'job',
      target_id: 'JOB-001',
      details: 'Assigned service job SRV-202610-0001 to technician Kyaw Zin Win (TECH-001).',
      ip_address: '127.0.0.1',
      created_at: '2026-10-06T09:30:00Z',
    },
    {
      id: 'AUD-003',
      user_id: 'USR-TECH-001',
      username: 'kyawzin',
      technician_id: 'TECH-001',
      action: 'STATUS_UPDATE',
      target_type: 'job',
      target_id: 'JOB-001',
      details: 'Technician Kyaw Zin Win changed status from Diagnosing to Repairing.',
      ip_address: '192.168.1.101',
      created_at: '2026-10-07T14:00:00Z',
    },
  ],

  income_records: [
    {
      id: 'INC-202610-0001',
      date: '2026-10-08T09:00:00Z',
      reference: 'REC-0912',
      service_number: 'SRV-202610-0001',
      service_job_id: 'JOB-001',
      customer_name: 'Ko Aung',
      technician_id: 'TECH-001',
      technician_name: 'Kyaw Zin Win',
      description: 'Phone Screen & Battery Replacement Service',
      amount: 50000,
      currency: 'MMK',
      payment_method: 'cash',
      created_by: 'admin',
      created_at: '2026-10-08T09:00:00Z',
    },
    {
      id: 'INC-202610-0002',
      date: '2026-10-08T10:30:00Z',
      reference: 'REC-0913',
      service_number: 'SRV-202610-0002',
      service_job_id: 'JOB-002',
      customer_name: 'Daw Mya Mya',
      technician_id: 'TECH-002',
      technician_name: 'Aung Kyaw Thu',
      description: 'Display Assembly Diagnostic & Repair',
      amount: 75000,
      currency: 'MMK',
      payment_method: 'kbzpay',
      created_by: 'admin',
      created_at: '2026-10-08T10:30:00Z',
    },
  ],

  expense_records: [
    {
      id: 'EXP-202610-0001',
      date: '2026-10-08T08:30:00Z',
      reference: 'INV-P-881',
      category: 'Parts',
      description: 'iPhone 13 OLED Screen Replacement Module',
      amount: 30000,
      currency: 'MMK',
      payment_method: 'cash',
      created_by: 'admin',
      created_at: '2026-10-08T08:30:00Z',
    },
    {
      id: 'EXP-202610-0002',
      date: '2026-10-07T11:00:00Z',
      reference: 'INV-T-102',
      category: 'Tools',
      description: 'Precision Soldering Tips and BGA Flux',
      amount: 15000,
      currency: 'MMK',
      payment_method: 'cash',
      created_by: 'admin',
      created_at: '2026-10-07T11:00:00Z',
    },
  ],

  settlements: [
    {
      id: 'SETTLE-202610-0001',
      settlement_type: 'daily',
      period_start: '2026-10-07T00:00:00Z',
      period_end: '2026-10-07T23:59:59Z',
      total_service_charges: 125000,
      total_payments: 125000,
      outstanding_balance: 0,
      total_income: 125000,
      total_expense: 45000,
      net_balance: 80000,
      currency: 'MMK',
      status: 'closed',
      closed_by: 'admin',
      closed_at: '2026-10-07T18:00:00Z',
      notes: 'Daily bench ledger reconciled and verified by admin.',
      created_at: '2026-10-07T18:00:00Z',
    },
  ],

  login_attempts: [
    {
      id: 'LOG-001',
      username: 'admin',
      success: true,
      ip_address: '127.0.0.1',
      attempted_at: '2026-10-08T08:01:00Z',
    },
    {
      id: 'LOG-002',
      username: 'kyawzin',
      success: true,
      ip_address: '192.168.1.101',
      attempted_at: '2026-10-08T08:15:00Z',
    },
  ],

  settings: {
    shopName: 'Hacked Shop',
    phone: '+95 9256060722',
    email: 'shwetaythan@gmail.com',
    address: 'Naypyitaw (Myanmar)',
    receiptFooterNote: 'All phone repairs carry limited warranty on replaced parts and workmanship. Liquid damage diagnostics carry inspection warranty only.',
    defaultWarrantyDays: 90,
    currency: 'MMK',
    currency_mode: 'manual',
    language: 'en',
    theme: 'system',
    dateFormat: 'DD MMM YYYY',
    paperSize: '80mm',
    taxPercentage: 0,
    paymentMethods: ['Cash', 'Bank Transfer', 'Digital Wallet'],
    paymentSettings: defaultPaymentSettings,
    license: {
      license_name: 'Free Phone Service Management System',
      plan: 'FREE',
      status: 'ACTIVE',
      license_key: 'FREE-COMMUNITY-EDITION',
      installation_id: 'FIXFLOW-INST-882194',
      license_days: 30,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_verified_at: new Date().toISOString(),
      server_url: 'https://posowner.myominaung.xyz',
      owner_verified: true,
    },
    telegramBot: {
      enabled: false,
      bot_token: '',
      chat_id: '',
      channel_username: '',
      notify_on_new_job: true,
      notify_on_status_change: true,
      notify_on_payment: false,
      notify_on_daily_summary: false,
      is_connected: false,
    },
  },
};

// Ensure data directory exists and read/write db.json
class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadDatabase();
  }

  private ensureDirectory() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_PATH)) {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        const mergedSettings: SettingsState = {
          ...initialSeed.settings,
          ...(parsed.settings || {}),
          paymentSettings: {
            ...defaultPaymentSettings,
            ...(parsed.settings?.paymentSettings || {}),
            thailand: {
              methods: defaultPaymentSettings.thailand.methods.map((defaultMethod: PaymentMethodConfig) => {
                const existing = parsed.settings?.paymentSettings?.thailand?.methods?.find((m: any) => m.id === defaultMethod.id);
                return existing ? { ...defaultMethod, ...removeDemoPaymentDetails('thailand', existing) } : defaultMethod;
              }),
            },
            myanmar: {
              methods: defaultPaymentSettings.myanmar.methods.map((defaultMethod: PaymentMethodConfig) => {
                const existing = parsed.settings?.paymentSettings?.myanmar?.methods?.find((m: any) => m.id === defaultMethod.id);
                return existing ? { ...defaultMethod, ...removeDemoPaymentDetails('myanmar', existing) } : defaultMethod;
              }),
            },
            global: {
              methods: defaultPaymentSettings.global.methods.map((defaultMethod: PaymentMethodConfig) => {
                const existing = parsed.settings?.paymentSettings?.global?.methods?.find((m: any) => m.id === defaultMethod.id);
                return existing ? { ...defaultMethod, ...removeDemoPaymentDetails('global', existing) } : defaultMethod;
              }),
            },
          },
        };
        mergedSettings.currency_mode = 'manual';
        if (!['my','en','th','zh'].includes(mergedSettings.language)) mergedSettings.language = 'en';
        if (!['MMK','USD','THB','CNY'].includes(mergedSettings.currency)) mergedSettings.currency = 'MMK';
        return {
          ...initialSeed,
          ...parsed,
          income_records: parsed.income_records ?? [],
          expense_records: parsed.expense_records ?? [],
          settlements: parsed.settlements ?? [],
          settings: mergedSettings,
        };
      }
    } catch (err) {
      // Never overwrite an existing unreadable database with demo records.
      throw new Error('Cannot read data/db.json; restore a valid backup before starting.', { cause: err });
    }
    this.saveDatabase(initialSeed);
    return JSON.parse(JSON.stringify(initialSeed));
  }

  private saveDatabase(dataToSave?: DatabaseSchema) {
    try {
      const data = dataToSave || this.data;
      const temporaryPath = `${DB_PATH}.tmp`;
      fs.writeFileSync(temporaryPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(temporaryPath, DB_PATH);
    } catch (err) {
      throw new Error('Database could not be saved.', { cause: err });
    }
  }

  private nextNumber(key: string): number {
    const records = (this.data as any)[key] as { id: string }[];
    const maximum = records.reduce((maximum, record) => {
      const suffix = Number(record.id.match(/-(\d+)$/)?.[1] || 0);
      return Math.max(maximum, suffix);
    }, 0);
    this.data.id_counters ??= {};
    const next = Math.max(maximum, this.data.id_counters[key] || 0) + 1;
    this.data.id_counters[key] = next;
    return next;
  }

  // --- Populated query helper ---
  public populateJob(job: ServiceJob): ServiceJob {
    const technician = this.data.technicians.find((t) => t.id === job.technician_id);
    const customer = this.data.customers.find((c) => c.id === job.customer_id);
    const device = this.data.devices.find((d) => d.id === job.device_id);
    const parts = this.data.service_job_parts.filter((p) => p.service_job_id === job.id);
    const payments = this.getPaymentsByJobId(job.id);

    return {
      ...job,
      technician: technician || undefined,
      customer: customer || undefined,
      device: device || undefined,
      parts_used: parts,
      payments,
    };
  }

  // Notifications are recipient-specific and share the event's database commit.
  private addNotification(type: NotificationType, job: ServiceJob, recipientIds: string[], details: Partial<AppNotification> = {}) {
    this.data.notifications ??= [];
    const recipients = new Set(recipientIds);
    for (const userId of recipients) {
      this.data.notifications.unshift({
        ...details,
        id: `NTF-${randomUUID()}`, user_id: userId, type,
        service_job_id: job.id, service_number: job.service_number,
        created_at: new Date().toISOString(),
      });
    }
    // Bound inbox growth to the latest 250 events per account.
    const counts = new Map<string, number>();
    this.data.notifications = this.data.notifications.filter(notification => {
      const count = (counts.get(notification.user_id) || 0) + 1;
      counts.set(notification.user_id, count);
      return count <= 250;
    });
  }

  private adminRecipients(): string[] {
    return this.data.users.filter(user => user.role === 'admin').map(user => user.id);
  }

  private technicianRecipients(technicianId: string): string[] {
    return this.data.users.filter(user => user.role === 'technician' && user.technician_id === technicianId).map(user => user.id);
  }

  public getNotifications(userId: string): AppNotification[] {
    return (this.data.notifications || []).filter(notification => notification.user_id === userId && !notification.dismissed_at);
  }

  public markNotificationRead(id: string, userId: string): AppNotification | null {
    const notification = this.getNotifications(userId).find(notification => notification.id === id);
    if (!notification) return null;
    if (!notification.read_at) {
      notification.read_at = new Date().toISOString();
      this.saveDatabase();
    }
    return notification;
  }

  public markAllNotificationsRead(userId: string): number {
    const unread = this.getNotifications(userId).filter(notification => !notification.read_at);
    if (unread.length) {
      const timestamp = new Date().toISOString();
      unread.forEach(notification => { notification.read_at = timestamp; });
      this.saveDatabase();
    }
    return unread.length;
  }

  public dismissNotification(id: string, userId: string): boolean {
    const notification = this.getNotifications(userId).find(notification => notification.id === id);
    if (!notification) return false;
    notification.dismissed_at = new Date().toISOString();
    this.saveDatabase();
    return true;
  }

  public clearReadNotifications(userId: string): number {
    const read = this.getNotifications(userId).filter(notification => notification.read_at);
    if (read.length) {
      const timestamp = new Date().toISOString();
      read.forEach(notification => { notification.dismissed_at = timestamp; });
      this.saveDatabase();
    }
    return read.length;
  }

  // --- Technicians ---
  public getTechnicians(): Technician[] {
    return this.data.technicians;
  }

  public getTechnicianById(id: string): Technician | undefined {
    return this.data.technicians.find((t) => t.id === id);
  }

  public createTechnician(tech: Omit<Technician, 'id' | 'created_at'>): Technician {
    const nextNum = this.nextNumber('technicians');
    const newId = `TECH-${String(nextNum).padStart(3, '0')}`;
    const newTech: Technician = {
      ...tech,
      id: newId,
      status: tech.status || 'active',
      created_at: new Date().toISOString(),
    };
    this.data.technicians.push(newTech);

    // Also create corresponding user account
    const newUser: User = {
      id: `USR-${newId}`,
      username: tech.username,
      full_name: tech.full_name,
      role: 'technician',
      phone: tech.phone,
      email: tech.email,
      technician_id: newId,
      created_at: new Date().toISOString(),
    };
    this.data.users.push(newUser);

    this.saveDatabase();
    return newTech;
  }

  public updateTechnician(id: string, updates: Partial<Technician>): Technician | null {
    const index = this.data.technicians.findIndex((t) => t.id === id);
    if (index === -1) return null;

    this.data.technicians[index] = {
      ...this.data.technicians[index],
      ...updates,
      id,
      created_at: this.data.technicians[index].created_at,
    };

    // Update user if name or username changed
    const userIndex = this.data.users.findIndex((u) => u.technician_id === id);
    if (userIndex !== -1) {
      if (updates.full_name) this.data.users[userIndex].full_name = updates.full_name;
      if (updates.username) this.data.users[userIndex].username = updates.username;
    }

    this.saveDatabase();
    return this.data.technicians[index];
  }

  public deleteTechnician(id: string): boolean {
    const fallbackTech = this.data.technicians.find((t) => t.id !== id)?.id || 'TECH-001';
    if (this.data.service_jobs) {
      this.data.service_jobs.forEach((job) => {
        if (job.technician_id === id) {
          job.technician_id = fallbackTech;
        }
      });
    }
    this.data.technicians = this.data.technicians.filter((t) => t.id !== id);
    const removedUserIds = new Set(this.data.users.filter(user => user.technician_id === id).map(user => user.id));
    this.data.notifications = (this.data.notifications || []).filter(notification => !removedUserIds.has(notification.user_id));
    this.data.users = this.data.users.filter((u) => u.technician_id !== id);
    this.saveDatabase();
    return true;
  }

  // --- Users & Auth ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public createCashier(input: { username: string; full_name: string; password: string }): User {
    const user: User = { id: `USR-CASH-${randomUUID()}`, username: input.username, full_name: input.full_name, password: input.password, role: 'cashier', active: true, created_at: new Date().toISOString() };
    this.data.users.push(user); this.saveDatabase(); return user;
  }
  public updateCashier(id: string, updates: Partial<User>): User | null {
    const user = this.data.users.find(u => u.id === id && u.role === 'cashier');
    if (!user) return null;
    Object.assign(user, updates); this.saveDatabase(); return user;
  }
  public deleteCashier(id: string): boolean {
    const user = this.data.users.find(u => u.id === id && u.role === 'cashier');
    if (!user) return false;
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.data.notifications = (this.data.notifications || []).filter(n => n.user_id !== id);
    this.saveDatabase(); return true;
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
  }

  public resetPasswordTransaction(userId: string, password: string, ip = 'local'): () => void {
    const previous = structuredClone(this.data);
    const user = this.data.users.find(u => u.id === userId);
    if (!user) throw new Error('Unknown account.');
    try {
      user.password = password;
      const technician = this.data.technicians.find(t => t.id === user.technician_id);
      if (technician) technician.password = password;
      this.data.security_audit.unshift({ id: `AUD-${String(this.nextNumber('security_audit')).padStart(4,'0')}`, user_id: user.id, username: user.username, action: 'PASSWORD_RECOVERED', target_type: 'auth', target_id: user.id, details: 'Password recovered with this PC’s key; recovery key rotated.', ip_address: ip, created_at: new Date().toISOString() });
      this.saveDatabase();
    } catch (error) { this.data = previous; throw error; }
    return () => { this.data = previous; this.saveDatabase(); };
  }

  public updatePassword(userId: string, newPass: string): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return false;
    if (user.technician_id) {
      const tech = this.data.technicians.find((t) => t.id === user.technician_id);
      if (tech) {
        (tech as any).password = newPass;
      }
    }
    (user as any).password = newPass;
    this.saveDatabase();
    return true;
  }

  public updateProfile(userId: string, updates: Partial<User>): User | null {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;
    Object.assign(user, updates);
    if (user.technician_id) {
      const tech = this.data.technicians.find((t) => t.id === user.technician_id);
      if (tech) {
        if (updates.full_name) tech.full_name = updates.full_name;
        if (updates.username) tech.username = updates.username;
        if (updates.email !== undefined) tech.email = updates.email;
        if (updates.phone !== undefined) tech.phone = updates.phone;
        if (updates.profile_photo !== undefined) tech.profile_photo = updates.profile_photo;
      }
    }
    this.saveDatabase();
    return user;
  }

  public recordLoginAttempt(username: string, success: boolean, ip: string) {
    const attempt: LoginAttempt = {
      id: `LOG-${randomUUID()}`,
      username,
      success,
      ip_address: ip,
      attempted_at: new Date().toISOString(),
    };
    this.data.login_attempts.push(attempt);
    this.saveDatabase();
  }

  public auditTransaction(audit: Omit<SecurityAudit, 'id' | 'created_at'>): () => void {
    const previous = structuredClone(this.data);
    try { this.recordAudit(audit); }
    catch (error) { this.data = previous; throw error; }
    return () => { this.data = previous; this.saveDatabase(); };
  }

  public recordAudit(audit: Omit<SecurityAudit, 'id' | 'created_at'>) {
    const entry: SecurityAudit = {
      ...audit,
      id: `AUD-${randomUUID()}`,
      created_at: new Date().toISOString(),
    };
    this.data.security_audit.unshift(entry);
    this.saveDatabase();
  }

  public getAuditTrail(): SecurityAudit[] {
    return this.data.security_audit;
  }

  // --- Service Jobs ---
  public getJobs(): ServiceJob[] {
    return this.data.service_jobs.map((j) => this.populateJob(j));
  }

  public getJobById(id: string): ServiceJob | undefined {
    const job = this.data.service_jobs.find((j) => j.id === id);
    return job ? this.populateJob(job) : undefined;
  }

  public createJob(jobData: Omit<ServiceJob, 'id' | 'service_number' | 'created_at' | 'updated_at'>): ServiceJob {
    const nextNum = this.nextNumber('service_jobs');
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const service_number = `SRV-${yearMonth}-${String(nextNum).padStart(4, '0')}`;
    const id = `JOB-${String(nextNum).padStart(3, '0')}`;

    const newJob: ServiceJob = {
      ...jobData,
      id,
      service_number,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.service_jobs.unshift(newJob);

    // If advance payment was made, record it in service_payments
    if (newJob.amount_paid > 0) {
      const payNum = this.nextNumber('service_payments');
      const payId = `PAY-${yearMonth}-${String(payNum).padStart(4, '0')}`;
      this.data.service_payments.unshift({
        id: payId,
        service_job_id: id,
        payment_method: newJob.payment_method || 'Cash',
        amount: newJob.amount_paid,
        currency_code: newJob.currency_code || this.data.settings.currency || 'MMK',
        paid_at: new Date().toISOString(),
        received_by: 'Admin',
        notes: 'Initial intake advance deposit',
      });
    }

    // Save parts if provided
    if (jobData.parts_used && jobData.parts_used.length > 0) {
      jobData.parts_used.forEach((part) => {
        this.data.service_job_parts.push({
          ...part,
          id: part.id || `PART-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          service_job_id: id,
        });
      });
    }

    this.addNotification('new_job', newJob, this.adminRecipients());
    this.addNotification('assigned_job', newJob, this.technicianRecipients(newJob.technician_id));
    if (newJob.amount_paid > 0) {
      this.addNotification('payment_received', newJob, this.adminRecipients(), {
        amount: newJob.amount_paid, currency_code: newJob.currency_code || this.data.settings.currency,
      });
    }
    this.saveDatabase();
    return this.populateJob(newJob);
  }

  public updateJob(id: string, updates: Partial<ServiceJob>): ServiceJob | null {
    const index = this.data.service_jobs.findIndex((j) => j.id === id);
    if (index === -1) return null;

    const previousJob = { ...this.data.service_jobs[index] };

    // Handle parts updates if included
    if (updates.parts_used) {
      // Remove old parts
      this.data.service_job_parts = this.data.service_job_parts.filter(
        (p) => p.service_job_id !== id
      );
      // Insert new parts
      updates.parts_used.forEach((part) => {
        this.data.service_job_parts.push({
          ...part,
          id: part.id || `PART-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          service_job_id: id,
        });
      });
    }

    const { parts_used, technician, customer, device, payments, ...jobFields } = updates;

    this.data.service_jobs[index] = {
      ...this.data.service_jobs[index],
      ...jobFields,
      id,
      service_number: this.data.service_jobs[index].service_number,
      created_at: this.data.service_jobs[index].created_at,
      updated_at: new Date().toISOString(),
    };

    this.recalcJobPayments(id);
    const updatedJob = this.data.service_jobs[index];
    if (updatedJob.technician_id !== previousJob.technician_id) {
      this.addNotification('reassigned_job', updatedJob, this.adminRecipients());
      this.addNotification('assigned_job', updatedJob, this.technicianRecipients(updatedJob.technician_id));
    }
    if (updatedJob.status_id !== previousJob.status_id) {
      this.addNotification('status_change', updatedJob,
        [...this.adminRecipients(), ...this.technicianRecipients(updatedJob.technician_id)],
        { status_id: updatedJob.status_id, previous_status: previousJob.status_id });
    }
    this.saveDatabase();
    return this.populateJob(this.data.service_jobs[index]);
  }

  public deleteJob(id: string): boolean {
    const initialLength = this.data.service_jobs.length;
    this.data.service_jobs = this.data.service_jobs.filter((j) => j.id !== id);
    this.data.service_job_parts = this.data.service_job_parts.filter((p) => p.service_job_id !== id);
    this.data.service_payments = this.data.service_payments.filter((p) => p.service_job_id !== id);
    this.saveDatabase();
    return this.data.service_jobs.length < initialLength;
  }

  // --- Payments ---
  private recalcJobPayments(jobId: string) {
    const jobIndex = this.data.service_jobs.findIndex((j) => j.id === jobId);
    if (jobIndex === -1) return;
    const job = this.data.service_jobs[jobIndex];
    // Active payments only (exclude soft deleted)
    const activePayments = this.data.service_payments.filter(
      (p) => p.service_job_id === job.id && !p.is_deleted
    );
    const totalPaid = activePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalCost = job.total_cost || (job.service_charge + job.parts_cost);

    this.data.service_jobs[jobIndex] = {
      ...job,
      amount_paid: totalPaid,
      payment_status:
        totalPaid >= totalCost && totalCost > 0
          ? 'paid'
          : totalPaid > 0
          ? 'partial'
          : 'unpaid',
      updated_at: new Date().toISOString(),
    };
  }

  public getPayments(includeDeleted = false): ServicePayment[] {
    const list = includeDeleted
      ? this.data.service_payments
      : this.data.service_payments.filter((p) => !p.is_deleted);

    return list.map((p) => {
      const job = this.data.service_jobs.find((j) => j.id === p.service_job_id);
      const cust = job ? this.data.customers.find((c) => c.id === job.customer_id) : undefined;
      const tech = job ? this.data.technicians.find((t) => t.id === job.technician_id) : undefined;
      return {
        ...p,
        service_number: job?.service_number,
        customer_name: cust?.name,
        technician_id: job?.technician_id,
        technician_name: tech?.full_name, // Must be the related Service Job technician
      };
    });
  }

  public getPaymentById(id: string): ServicePayment | undefined {
    const p = this.data.service_payments.find((x) => x.id === id);
    if (!p) return undefined;
    const job = this.data.service_jobs.find((j) => j.id === p.service_job_id);
    const cust = job ? this.data.customers.find((c) => c.id === job.customer_id) : undefined;
    const tech = job ? this.data.technicians.find((t) => t.id === job.technician_id) : undefined;
    return {
      ...p,
      service_number: job?.service_number,
      customer_name: cust?.name,
      technician_id: job?.technician_id,
      technician_name: tech?.full_name,
    };
  }

  public getPaymentsByJobId(jobId: string, includeDeleted = false): ServicePayment[] {
    return this.data.service_payments
      .filter((p) => p.service_job_id === jobId && (includeDeleted || !p.is_deleted))
      .map((p) => {
        const job = this.data.service_jobs.find((j) => j.id === p.service_job_id);
        const cust = job ? this.data.customers.find((c) => c.id === job.customer_id) : undefined;
        const tech = job ? this.data.technicians.find((t) => t.id === job.technician_id) : undefined;
        return {
          ...p,
          service_number: job?.service_number,
          customer_name: cust?.name,
          technician_id: job?.technician_id,
          technician_name: tech?.full_name,
        };
      });
  }

  public createPayment(payment: Omit<ServicePayment, 'id'>): ServicePayment {
    const nextNum = this.nextNumber('service_payments');
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const id = `PAY-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

    const newPayment: ServicePayment = {
      ...payment,
      id,
      paid_at: payment.paid_at || new Date().toISOString(),
      is_deleted: false,
      status: 'completed',
    };

    this.data.service_payments.unshift(newPayment);

    // Recalculate parent service job payments
    this.recalcJobPayments(payment.service_job_id);
    const notificationJob = this.data.service_jobs.find(job => job.id === payment.service_job_id);
    if (notificationJob) this.addNotification('payment_received', notificationJob, this.adminRecipients(), {
      amount: newPayment.amount, currency_code: newPayment.currency_code,
    });

    this.saveDatabase();

    const job = this.data.service_jobs.find((j) => j.id === payment.service_job_id);
    const cust = job ? this.data.customers.find((c) => c.id === job.customer_id) : undefined;
    const tech = job ? this.data.technicians.find((t) => t.id === job.technician_id) : undefined;

    return {
      ...newPayment,
      service_number: job?.service_number,
      customer_name: cust?.name,
      technician_id: job?.technician_id,
      technician_name: tech?.full_name,
    };
  }

  public updatePayment(
    id: string,
    updates: Partial<ServicePayment>,
    editedBy: string,
    editReason?: string
  ): ServicePayment | null {
    const index = this.data.service_payments.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const oldPayment = { ...this.data.service_payments[index] };
    const oldJobId = oldPayment.service_job_id;

    this.data.service_payments[index] = {
      ...oldPayment,
      ...updates,
      updated_by: editedBy,
      updated_at: new Date().toISOString(),
      edit_reason: editReason || updates.edit_reason,
    };

    // Recalculate parent jobs
    this.recalcJobPayments(this.data.service_payments[index].service_job_id);
    if (updates.service_job_id && updates.service_job_id !== oldJobId) {
      this.recalcJobPayments(oldJobId);
    }

    this.saveDatabase();
    return this.getPaymentById(id) || null;
  }

  public deletePayment(
    id: string,
    deletedBy: string,
    deleteReason: string
  ): ServicePayment | null {
    const index = this.data.service_payments.findIndex((p) => p.id === id);
    if (index === -1) return null;

    this.data.service_payments[index] = {
      ...this.data.service_payments[index],
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
      delete_reason: deleteReason,
      status: 'deleted',
    };

    this.recalcJobPayments(this.data.service_payments[index].service_job_id);
    this.saveDatabase();
    return this.getPaymentById(id) || null;
  }

  // --- Income & Expense Accounting ---
  public getIncome(includeDeleted = false): IncomeRecord[] {
    const list = includeDeleted
      ? (this.data.income_records || [])
      : (this.data.income_records || []).filter((r) => !r.is_deleted);

    return list.map((inc) => {
      let techName = inc.technician_name;
      if (inc.technician_id && !techName) {
        techName = this.data.technicians.find((t) => t.id === inc.technician_id)?.full_name;
      }
      return { ...inc, technician_name: techName };
    });
  }

  public createIncome(data: Omit<IncomeRecord, 'id' | 'created_at'>): IncomeRecord {
    if (!this.data.income_records) this.data.income_records = [];
    const nextNum = this.nextNumber('income_records');
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const id = `INC-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

    const newRecord: IncomeRecord = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      is_deleted: false,
    };

    this.data.income_records.unshift(newRecord);
    this.saveDatabase();
    return newRecord;
  }

  public updateIncome(id: string, updates: Partial<IncomeRecord>): IncomeRecord | null {
    if (!this.data.income_records) return null;
    const index = this.data.income_records.findIndex((r) => r.id === id);
    if (index === -1) return null;

    this.data.income_records[index] = {
      ...this.data.income_records[index],
      ...updates,
    };
    this.saveDatabase();
    return this.data.income_records[index];
  }

  public deleteIncome(id: string, deletedBy: string): boolean {
    if (!this.data.income_records) return false;
    const index = this.data.income_records.findIndex((r) => r.id === id);
    if (index === -1) return false;

    this.data.income_records[index] = {
      ...this.data.income_records[index],
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
    };
    this.saveDatabase();
    return true;
  }

  public getExpenses(includeDeleted = false): ExpenseRecord[] {
    return includeDeleted
      ? (this.data.expense_records || [])
      : (this.data.expense_records || []).filter((r) => !r.is_deleted);
  }

  public createExpense(data: Omit<ExpenseRecord, 'id' | 'created_at'>): ExpenseRecord {
    if (!this.data.expense_records) this.data.expense_records = [];
    const nextNum = this.nextNumber('expense_records');
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const id = `EXP-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

    const newRecord: ExpenseRecord = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      is_deleted: false,
    };

    this.data.expense_records.unshift(newRecord);
    this.saveDatabase();
    return newRecord;
  }

  public updateExpense(id: string, updates: Partial<ExpenseRecord>): ExpenseRecord | null {
    if (!this.data.expense_records) return null;
    const index = this.data.expense_records.findIndex((r) => r.id === id);
    if (index === -1) return null;

    this.data.expense_records[index] = {
      ...this.data.expense_records[index],
      ...updates,
    };
    this.saveDatabase();
    return this.data.expense_records[index];
  }

  public deleteExpense(id: string, deletedBy: string): boolean {
    if (!this.data.expense_records) return false;
    const index = this.data.expense_records.findIndex((r) => r.id === id);
    if (index === -1) return false;

    this.data.expense_records[index] = {
      ...this.data.expense_records[index],
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
    };
    this.saveDatabase();
    return true;
  }

  // --- Settlements ---
  public getSettlements(): SettlementRecord[] {
    return this.data.settlements || [];
  }

  public createSettlement(data: Omit<SettlementRecord, 'id' | 'created_at'>): SettlementRecord {
    if (!this.data.settlements) this.data.settlements = [];
    const nextNum = this.nextNumber('settlements');
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const id = `SETTLE-${yearMonth}-${String(nextNum).padStart(4, '0')}`;

    const newRecord: SettlementRecord = {
      ...data,
      status: data.status || 'open',
      id,
      created_at: new Date().toISOString(),
    };

    this.data.settlements.unshift(newRecord);
    this.saveDatabase();
    return newRecord;
  }

  public closeSettlement(id: string, closedBy: string): SettlementRecord | null {
    if (!this.data.settlements) return null;
    const index = this.data.settlements.findIndex((r) => r.id === id);
    if (index === -1) return null;

    this.data.settlements[index] = {
      ...this.data.settlements[index],
      status: 'closed',
      closed_by: closedBy,
      closed_at: new Date().toISOString(),
    };
    this.saveDatabase();
    return this.data.settlements[index];
  }

  // --- Database Backup & Restore ---
  public createBackupSnapshot() {
    const snapshot = JSON.parse(JSON.stringify(this.data));
    const timestamp = new Date().toISOString();
    const filename = `fixflow_backup_${timestamp.replace(/[:.]/g, '-')}.json`;
    const jsonStr = JSON.stringify(snapshot, null, 2);
    const sizeBytes = Buffer.byteLength(jsonStr, 'utf-8');

    const metadata: BackupMetadata = {
      id: `BAK-${Date.now()}`,
      filename,
      created_at: timestamp,
      size_bytes: sizeBytes,
      item_counts: {
        customers: (this.data.customers || []).length,
        devices: (this.data.devices || []).length,
        technicians: (this.data.technicians || []).length,
        service_jobs: (this.data.service_jobs || []).length,
        service_job_parts: (this.data.service_job_parts || []).length,
        service_payments: (this.data.service_payments || []).length,
        income_records: (this.data.income_records || []).length,
        expense_records: (this.data.expense_records || []).length,
        settlements: (this.data.settlements || []).length,
        security_audit: (this.data.security_audit || []).length,
      },
      status: 'valid',
    };

    return {
      metadata,
      data: snapshot,
    };
  }

  public clearDemoData(): void {
    this.data.service_jobs = [];
    this.data.service_job_parts = [];
    this.data.service_payments = [];
    this.data.customers = [];
    this.data.devices = [];
    this.data.technicians = [];
    this.data.income_records = [];
    this.data.expense_records = [];
    this.data.security_audit = [];
    this.data.notifications = [];
    this.data.settlements = [];
    this.data.users = this.data.users.filter((u) => u.role === 'admin');
    this.saveDatabase();
  }

  public restoreBackupSnapshot(backupData: any, restoredBy: string): { success: boolean; error?: string } {
    if (!backupData || typeof backupData !== 'object') {
      return { success: false, error: 'Invalid backup file: Not a valid JSON object.' };
    }

    const requiredKeys = ['users', 'technicians', 'customers', 'devices', 'service_jobs', 'settings'];
    for (const key of requiredKeys) {
      if (!(key in backupData)) {
        return { success: false, error: `Incompatible backup file: missing required key "${key}".` };
      }
    }

    const arrayKeys = ['users', 'technicians', 'customers', 'devices', 'service_jobs', 'service_job_parts',
      'service_payments', 'income_records', 'expense_records', 'settlements', 'security_audit', 'login_attempts', 'licenses_registry', 'notifications'];
    for (const key of arrayKeys) {
      const records = backupData[key];
      if (records === undefined && !requiredKeys.includes(key)) continue;
      if (!Array.isArray(records) || records.some((record: any) => !record || typeof record !== 'object' ||
          typeof record.id !== 'string' || !record.id) || new Set(records.map((record: any) => record.id)).size !== records.length) {
        return { success: false, error: `Invalid backup collection: ${key}. Expected records with unique IDs.` };
      }
    }
    if (backupData.users.some((user: any) => typeof user.username !== 'string' || !user.username || !['admin', 'technician', 'cashier'].includes(user.role))) {
      return { success: false, error: 'Invalid backup user account.' };
    }
    const foreignKeys = [
      ['devices', 'customer_id', 'customers'], ['service_jobs', 'customer_id', 'customers'],
      ['service_jobs', 'device_id', 'devices'], ['service_jobs', 'technician_id', 'technicians'],
      ['service_job_parts', 'service_job_id', 'service_jobs'], ['service_payments', 'service_job_id', 'service_jobs'],
    ];
    for (const [collection, field, target] of foreignKeys) {
      const targetIds = new Set(backupData[target].map((record: any) => record.id));
      if ((backupData[collection] || []).some((record: any) => !targetIds.has(record[field]))) {
        return { success: false, error: `Backup contains broken references: ${collection}.${field}.` };
      }
    }
    const notificationTypes = ['new_job', 'assigned_job', 'reassigned_job', 'status_change', 'payment_received'];
    const statuses = ['received', 'diagnosing', 'waiting_parts', 'repairing', 'ready', 'completed', 'delivered', 'cancelled'];
    if ((backupData.notifications || []).some((notification: any) =>
        !backupData.users.some((user: any) => user.id === notification.user_id) ||
        !notificationTypes.includes(notification.type) || typeof notification.service_job_id !== 'string' ||
        typeof notification.service_number !== 'string' || !Number.isFinite(Date.parse(notification.created_at)) ||
        (notification.amount !== undefined && (!Number.isFinite(notification.amount) || notification.amount < 0)) ||
        (notification.currency_code !== undefined && typeof notification.currency_code !== 'string') ||
        (notification.status_id !== undefined && !statuses.includes(notification.status_id)) ||
        (notification.previous_status !== undefined && !statuses.includes(notification.previous_status)) ||
        (notification.read_at !== undefined && !Number.isFinite(Date.parse(notification.read_at))) ||
        (notification.dismissed_at !== undefined && !Number.isFinite(Date.parse(notification.dismissed_at))))) {
      return { success: false, error: 'Invalid backup notification.' };
    }
    if (backupData.id_counters !== undefined && (!backupData.id_counters || typeof backupData.id_counters !== 'object' || Array.isArray(backupData.id_counters) || Object.values(backupData.id_counters).some(value => !Number.isSafeInteger(value) || Number(value) < 0))) {
      return { success: false, error: 'Invalid backup ID counters.' };
    }
    if (!backupData.settings || typeof backupData.settings !== 'object' || Array.isArray(backupData.settings)) {
      return { success: false, error: 'Invalid backup settings.' };
    }
    if (!backupData.users.some((user: any) => user.role === 'admin' && typeof user.username === 'string' && user.username)) {
      return { success: false, error: 'Backup must contain an administrator account.' };
    }

    // Safety automatic backup file
    const safetyBackup = JSON.parse(JSON.stringify(this.data));
    const safetyDir = path.join(path.dirname(DB_PATH), 'backups');
    if (!fs.existsSync(safetyDir)) {
      fs.mkdirSync(safetyDir, { recursive: true });
    }
    const safetyFile = path.resolve(safetyDir, `safety_before_restore_${Date.now()}_${randomUUID()}.json`);
    try {
      fs.writeFileSync(safetyFile, JSON.stringify(safetyBackup, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not write local safety file', e);
    }

    try {
      this.data = {
        notifications: backupData.notifications || [],
        id_counters: Object.fromEntries(Object.keys({ ...safetyBackup.id_counters, ...backupData.id_counters }).map(key => [key, Math.max(safetyBackup.id_counters?.[key] || 0, backupData.id_counters?.[key] || 0)])),
        users: backupData.users || [],
        technicians: backupData.technicians || [],
        customers: backupData.customers || [],
        devices: backupData.devices || [],
        service_jobs: backupData.service_jobs || [],
        service_job_parts: backupData.service_job_parts || [],
        service_payments: backupData.service_payments || [],
        income_records: backupData.income_records || [],
        expense_records: backupData.expense_records || [],
        settlements: backupData.settlements || [],
        security_audit: backupData.security_audit || [],
        login_attempts: backupData.login_attempts || [],
        licenses_registry: backupData.licenses_registry || initialSeed.licenses_registry,
        settings: backupData.settings || initialSeed.settings,
      };

      this.saveDatabase();
      return { success: true };
    } catch (err: any) {
      this.data = safetyBackup;
      this.saveDatabase();
      return { success: false, error: err?.message || 'Failed restoring database state.' };
    }
  }

  // --- Customers & Devices ---
  public getCustomers(): Customer[] {
    return this.data.customers;
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.data.customers.find((c) => c.id === id);
  }

  public createCustomer(cust: Omit<Customer, 'id' | 'created_at'>): Customer {
    const id = `CUST-${String(this.nextNumber('customers')).padStart(3, '0')}`;
    const newCust: Customer = {
      ...cust,
      id,
      created_at: new Date().toISOString(),
    };
    this.data.customers.push(newCust);
    this.saveDatabase();
    return newCust;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const index = this.data.customers.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.data.customers[index] = { ...this.data.customers[index], ...updates, id, created_at: this.data.customers[index].created_at };
    this.saveDatabase();
    return this.data.customers[index];
  }

  private customerDeletionRecords(ids: string[]) {
    const selected = new Set(ids);
    const customers = this.data.customers.filter(c => selected.has(c.id));
    const devices = this.data.devices.filter(d => selected.has(d.customer_id));
    const deviceIds = new Set(devices.map(d => d.id));
    if (this.data.service_jobs.some(j => deviceIds.has(j.device_id) && !selected.has(j.customer_id))) {
      throw new Error('A selected device belongs to another customer’s repair job. Correct that relationship before deleting.');
    }
    const jobs = this.data.service_jobs.filter(j => selected.has(j.customer_id));
    const jobIds = new Set(jobs.map(j => j.id));
    const jobNumbers = new Set(jobs.map(j => j.service_number));
    const payments = this.data.service_payments.filter(p => jobIds.has(p.service_job_id));
    const paymentIds = new Set(payments.map(p => p.id));
    return {
      customers, devices, jobs,
      parts: this.data.service_job_parts.filter(p => jobIds.has(p.service_job_id)),
      payments,
      income: (this.data.income_records || []).filter(i => (i.service_job_id && jobIds.has(i.service_job_id)) || (i.service_number && jobNumbers.has(i.service_number)) || paymentIds.has(i.reference)),
      notifications: (this.data.notifications || []).filter(n => jobIds.has(n.service_job_id)),
    };
  }

  public previewCustomerDeletion(ids: string[]): CustomerDeletionPreview {
    const records = this.customerDeletionRecords(ids);
    return {
      names: records.customers.map(c => c.name),
      customers: records.customers.length, devices: records.devices.length, jobs: records.jobs.length,
      parts: records.parts.length, payments: records.payments.length, income: records.income.length,
      notifications: records.notifications.length,
      revision: createHash('sha256').update(JSON.stringify(records)).digest('hex'),
    };
  }

  public deleteCustomersWithRecords(ids: string[], revision: string, actor: User, ip: string): { backup: string; deleted: CustomerDeletionPreview } {
    const preview = this.previewCustomerDeletion(ids);
    if (preview.revision !== revision) throw new Error('Records changed. Close this dialog and review the deletion again.');
    const records = this.customerDeletionRecords(ids);
    // Require a recoverable backup before any state is changed.
    const backupDirectory = path.join(path.dirname(DB_PATH), 'backups');
    fs.mkdirSync(backupDirectory, { recursive: true });
    const backup = `before_customer_delete_${Date.now()}_${randomUUID()}.json`;
    fs.writeFileSync(path.join(backupDirectory, backup), JSON.stringify(this.data, null, 2), { mode: 0o600 });
    const previous = structuredClone(this.data);
    const retain = <T extends { id: string }>(all: T[], removed: T[]): T[] => {
      const removedIds = new Set(removed.map(row => row.id));
      return all.filter(row => !removedIds.has(row.id));
    };
    try {
      this.data.customers = retain(this.data.customers, records.customers);
      this.data.devices = retain(this.data.devices, records.devices);
      this.data.service_jobs = retain(this.data.service_jobs, records.jobs);
      this.data.service_job_parts = retain(this.data.service_job_parts, records.parts);
      this.data.service_payments = retain(this.data.service_payments, records.payments);
      this.data.income_records = retain(this.data.income_records || [], records.income);
      this.data.notifications = retain(this.data.notifications || [], records.notifications);
      this.data.security_audit.unshift({ id: `AUD-${String(this.nextNumber('security_audit')).padStart(4, '0')}`, user_id: actor.id, username: actor.username, action: 'CUSTOMERS_AND_LINKED_RECORDS_DELETED', target_type: 'system', target_id: ids.join(','), details: `Deleted ${preview.customers} customers, ${preview.devices} devices, ${preview.jobs} jobs, ${preview.payments} payments and ${preview.income} income records. Safety backup: ${backup}`, ip_address: ip, created_at: new Date().toISOString() });
      this.saveDatabase();
      return { backup, deleted: preview };
    } catch (error) { this.data = previous; throw error; }
  }

  public deleteCustomer(id: string): boolean {
    const initialLength = this.data.customers.length;
    this.data.customers = this.data.customers.filter((c) => c.id !== id);
    if (this.data.customers.length !== initialLength) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public getDevices(): Device[] {
    return this.data.devices;
  }

  public getDeviceById(id: string): Device | undefined {
    return this.data.devices.find((d) => d.id === id);
  }

  public createDevice(dev: Omit<Device, 'id' | 'created_at'>): Device {
    const id = `DEV-${String(this.nextNumber('devices')).padStart(3, '0')}`;
    const newDev: Device = {
      ...dev,
      id,
      created_at: new Date().toISOString(),
    };
    this.data.devices.push(newDev);
    this.saveDatabase();
    return newDev;
  }

  public updateDevice(id: string, updates: Partial<Device>): Device | null {
    const index = this.data.devices.findIndex((d) => d.id === id);
    if (index === -1) return null;
    this.data.devices[index] = { ...this.data.devices[index], ...updates, id, created_at: this.data.devices[index].created_at };
    this.saveDatabase();
    return this.data.devices[index];
  }

  public deleteDevice(id: string): boolean {
    const index = this.data.devices.findIndex((d) => d.id === id);
    if (index !== -1) {
      this.data.devices.splice(index, 1);
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // --- Settings ---
  public getSettings(): SettingsState {
    this.data.settings.currency_mode = 'manual';
    if (!['my','en','th','zh'].includes(this.data.settings.language)) this.data.settings.language = 'en';
    return this.data.settings;
  }

  public updateSettings(newSettings: Partial<SettingsState>): SettingsState {
    this.data.settings = { ...this.data.settings, ...newSettings, currency_mode: 'manual' };
    this.saveDatabase();
    return this.data.settings;
  }

  // --- License Management (Client State) ---
  public getLicense(): LicenseState {
    if (!this.data.settings.license) {
      this.data.settings.license = {
        license_name: 'Free Phone Service Management System',
        plan: 'FREE',
        status: 'ACTIVE',
        license_key: 'FREE-COMMUNITY-EDITION',
        installation_id: 'FIXFLOW-INST-882194',
        license_days: 30,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        last_verified_at: new Date().toISOString(),
        server_url: 'https://posowner.myominaung.xyz',
        owner_verified: true,
      };
      this.saveDatabase();
    }

    const lic = this.data.settings.license;
    // Calculate license_days based on actual verified expiration date against server UTC time
    // This prevents client-side clock manipulation from extending the license
    if (lic.expires_at) {
      const now = Date.now();
      const expTime = new Date(lic.expires_at).getTime();
      const diffDays = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
      lic.license_days = Math.max(0, diffDays);
      if (lic.license_days <= 0 && lic.status === 'ACTIVE') {
        lic.status = 'EXPIRED';
      }
    } else if (lic.status === 'NOT_ACTIVATED') {
      lic.license_days = 0;
    }

    return lic;
  }

  public updateLicense(updates: Partial<LicenseState>): LicenseState {
    const current = this.getLicense();
    this.data.settings.license = {
      ...current,
      ...updates,
    };
    this.saveDatabase();
    return this.getLicense();
  }

  // --- Telegram Bot Service ---
  public getTelegramBot(): TelegramBotConfig {
    if (!this.data.settings.telegramBot) {
      this.data.settings.telegramBot = {
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
      this.saveDatabase();
    }
    return this.data.settings.telegramBot;
  }

  public updateTelegramBot(updates: Partial<TelegramBotConfig>): TelegramBotConfig {
    const current = this.getTelegramBot();
    this.data.settings.telegramBot = {
      ...current,
      ...updates,
    };
    this.saveDatabase();
    return this.getTelegramBot();
  }

  public getLicensesRegistry(): LicenseRegistryItem[] {
    if (!this.data.licenses_registry) {
      this.data.licenses_registry = initialSeed.licenses_registry;
      this.saveDatabase();
    }
    return this.data.licenses_registry;
  }

  public generateLicenseKey(plan: 'FREE' | 'PAID', days: number, licenseName: string, createdBy: string): LicenseRegistryItem {
    const registry = this.getLicensesRegistry();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const prefix = plan === 'PAID' ? 'PAID-PRO' : 'FREE-COMM';
    const key = `${prefix}-${new Date().getFullYear()}-${days}D-${randomSuffix}`;
    const newItem: LicenseRegistryItem = {
      id: `LIC-${Date.now()}`,
      license_key: key,
      plan,
      license_name: licenseName || (plan === 'PAID' ? 'FixFlow Professional Phone Service System' : 'Free Phone Service Management System'),
      days,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      created_by: createdBy || 'admin',
    };
    registry.unshift(newItem);
    this.saveDatabase();
    return newItem;
  }

  public revokeLicenseKey(keyId: string): void {
    const registry = this.getLicensesRegistry();
    const idx = registry.findIndex(l => l.id === keyId || l.license_key === keyId);
    if (idx !== -1) {
      registry[idx].status = 'REVOKED';
      if (this.data.settings.license?.license_key === registry[idx].license_key) {
        this.data.settings.license.status = 'REVOKED';
        this.data.settings.license.owner_verified = false;
      }
      this.saveDatabase();
    }
  }
}

export const db = new Database();
