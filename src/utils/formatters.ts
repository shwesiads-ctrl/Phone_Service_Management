import { Currency, DateFormat, Language } from '../types';

/**
 * Get currency symbol based on currency code
 */
export function getCurrencySymbol(currency: Currency): string {
  switch (currency) {
    case 'MMK':
      return 'Ks';
    case 'USD':
      return '$';
    case 'THB':
      return '฿';
    default:
      return currency;
  }
}

/**
 * Get formatted sample amount for currency
 */
export function getCurrencySample(currency: Currency): string {
  switch (currency) {
    case 'MMK':
      return 'Ks 50,000';
    case 'USD':
      return '$50.00';
    case 'THB':
      return '฿1,500.00';
    default:
      return `${currency} 50`;
  }
}

/**
 * Get default currency mapped to language in automatic currency mode:
 * Myanmar -> MMK
 * English -> USD
 * Thai    -> THB
 */
export function getDefaultCurrencyForLanguage(language: Language): Currency {
  switch (language) {
    case 'my':
      return 'MMK';
    case 'th':
      return 'THB';
    case 'en':
    default:
      return 'USD';
  }
}

/**
 * Central currency formatter.
 * Formats numeric monetary amounts using the configured currency code.
 *
 * MMK -> Ks 50,000
 * USD -> $50.00
 * THB -> ฿1,500.00
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  switch (currency) {
    case 'MMK': {
      // Kyats are typically whole integer denominations with thousands commas
      const formatted = Math.round(safeAmount).toLocaleString('en-US');
      return `Ks ${formatted}`;
    }
    case 'USD': {
      // US Dollars with 2 decimal places
      const formatted = safeAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `$${formatted}`;
    }
    case 'THB': {
      // Thai Baht with 2 decimal places
      const formatted = safeAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `฿${formatted}`;
    }
    default:
      return `${currency} ${safeAmount.toLocaleString('en-US')}`;
  }
}

/**
 * Localized date formatter.
 * Respects active language and configured date format.
 *
 * Myanmar: 08-10-2026
 * English: 08 Oct 2026
 * Thai: 8 ต.ค. 2026
 */
export function formatLocalizedDate(
  dateInput: string | Date | undefined,
  language: Language,
  formatPreference?: DateFormat
): string {
  if (!dateInput) return '—';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return String(dateInput);

  const day = date.getDate();
  const dayPadded = String(day).padStart(2, '0');
  const month = date.getMonth() + 1;
  const monthPadded = String(month).padStart(2, '0');
  const year = date.getFullYear();

  // If explicit format preference is selected
  if (formatPreference === 'DD-MM-YYYY') {
    return `${dayPadded}-${monthPadded}-${year}`;
  }
  if (formatPreference === 'YYYY-MM-DD') {
    return `${year}-${monthPadded}-${dayPadded}`;
  }

  // Localized representation based on language
  switch (language) {
    case 'my':
      // Myanmar format: DD-MM-YYYY
      return `${dayPadded}-${monthPadded}-${year}`;

    case 'th': {
      // Thai short month e.g. 8 ต.ค. 2026
      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
      ];
      return `${day} ${thaiMonths[date.getMonth()]} ${year}`;
    }

    case 'en':
    default: {
      // English format: 08 Oct 2026
      const enMonths = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return `${dayPadded} ${enMonths[date.getMonth()]} ${year}`;
    }
  }
}
