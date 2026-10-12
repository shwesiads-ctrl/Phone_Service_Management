import type { PaymentProfileSettings, PaymentMethodConfig, PaymentProfile } from '../types';
export const defaultPaymentSettings: PaymentProfileSettings = {
  mode: 'auto',
  active_profile: 'thailand',
  thailand: {
    methods: [
      {
        id: 'cash',
        name: 'เงินสด (Cash)',
        thai_name: 'เงินสด (Cash)',
        enabled: true,
        instructions: 'ชำระเงินสดที่เคาน์เตอร์ศูนย์บริการ',
      },
      {
        id: 'bank_transfer',
        name: 'โอนเงินผ่านธนาคาร (Bank Transfer)',
        thai_name: 'โอนเงินผ่านธนาคาร (Bank Transfer)',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
      {
        id: 'promptpay',
        name: 'PromptPay',
        thai_name: 'PromptPay',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
      {
        id: 'kplus',
        name: 'K PLUS',
        thai_name: 'K PLUS',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
      {
        id: 'scb_easy',
        name: 'SCB EASY',
        thai_name: 'SCB EASY',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
      {
        id: 'truemoney',
        name: 'TrueMoney Wallet',
        thai_name: 'TrueMoney Wallet',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
      {
        id: 'rabbit_line_pay',
        name: 'Rabbit LINE Pay',
        thai_name: 'Rabbit LINE Pay',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
      {
        id: 'shopeepay',
        name: 'ShopeePay',
        thai_name: 'ShopeePay',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
      {
        id: 'card',
        name: 'บัตรเครดิต/เดบิต (Credit/Debit Card)',
        thai_name: 'บัตรเครดิต/เดบิต (Credit/Debit Card)',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
      {
        id: 'other',
        name: 'อื่นๆ (Other)',
        thai_name: 'อื่นๆ (Other)',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
    ],
  },
  myanmar: {
    methods: [
      {
        id: 'kbz_pay',
        name: 'KBZ Pay',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
      {
        id: 'wave_pay',
        name: 'Wave Pay',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
      {
        id: 'aya_pay',
        name: 'AYA Pay',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
      {
        id: 'cb_pay',
        name: 'CB Pay',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
      {
        id: 'cash',
        name: 'Cash',
        enabled: true,
        instructions: 'Cash payment in Myanmar Kyats',
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
    ],
  },
  china: {
    methods: [
      { id: 'cash', name: 'Cash / 现金', enabled: true, instructions: 'Cash payment at the counter.' },
      { id: 'alipay', name: 'Alipay / 支付宝', enabled: false, instructions: 'Configure your verified Alipay account and merchant-issued QR.' },
      { id: 'wechat_pay', name: 'WeChat Pay / 微信支付', enabled: false, instructions: 'Configure your verified WeChat Pay account and merchant-issued QR.' },
      { id: 'unionpay', name: 'UnionPay / 银联', enabled: false, instructions: 'Configure your verified UnionPay merchant account and bank-issued QR.' },
      { id: 'bank_transfer', name: 'Bank Transfer / 银行转账', enabled: false, instructions: 'Configure your verified Chinese bank account.' },
    ],
  },
  global: {
    methods: [
      {
        id: 'cash',
        name: 'Cash',
        enabled: true,
        instructions: 'Cash settlement at shop desk counter',
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
      {
        id: 'card',
        name: 'Credit/Debit Card',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
      {
        id: 'paypal',
        name: 'PayPal',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
      {
        id: 'other',
        name: 'Other',
        enabled: false,
        instructions: 'Configure your verified payment account and bank-issued QR before enabling.',
      },
    ],
  },
};

// Exact known sample beneficiaries; custom configurations and bank-issued QR images are retained.
const demoAccounts: Record<string, Record<string, string[]>> = {
  "thailand": {
    "bank_transfer": [
      "FixFlow Mobile Services",
      "123-4-56789-0"
    ],
    "promptpay": [
      "FixFlow Mobile Solution Co., Ltd.",
      "0891234567"
    ],
    "kplus": [
      "FixFlow Mobile Solution",
      "045-2-98765-4"
    ],
    "scb_easy": [
      "FixFlow Mobile Solution",
      "168-2-34567-8"
    ],
    "truemoney": [
      "FixFlow Shop",
      "089-123-4567"
    ],
    "rabbit_line_pay": [
      "FixFlow Official",
      "LINE-FIXFLOW-PAY"
    ],
    "shopeepay": [
      "FixFlow Service Store",
      "SPAY-0891234567"
    ]
  },
  "myanmar": {
    "kbz_pay": [
      "Hacked Shop",
      "09256060722"
    ],
    "wave_pay": [
      "FixFlow Mobile",
      "09790123456"
    ],
    "aya_pay": [
      "FixFlow Service",
      "09790123456"
    ],
    "cb_pay": [
      "FixFlow Service",
      "09790123456"
    ],
    "bank_transfer": [
      "FixFlow Mobile Lab",
      "20010199928371"
    ]
  },
  "global": {
    "bank_transfer": [
      "FixFlow Technologies Inc.",
      "US9820192831092"
    ],
    "paypal": [
      "billing@fixflowlab.com",
      ""
    ]
  }
};
export function removeDemoPaymentDetails(profile: PaymentProfile, method: PaymentMethodConfig): PaymentMethodConfig {
  const sample = demoAccounts[profile]?.[method.id];
  if (!sample || method.qr_code || (method.account_name || '') !== sample[0] || (method.account_number || '') !== sample[1]) return method;
  const { account_name, account_number, bank_name, ...rest } = method;
  return { ...rest, enabled: false, instructions: 'Configure your verified payment account and bank-issued QR before enabling.' };
}
