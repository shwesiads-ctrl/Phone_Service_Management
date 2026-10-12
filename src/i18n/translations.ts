import { Language } from '../types';
import { en } from './locales/en';
import { my } from './locales/my';
import { th } from './locales/th';
import { zh } from './locales/zh';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { ja } from './locales/ja';
import { ko } from './locales/ko';
import { ar } from './locales/ar';
import { ru } from './locales/ru';
import { hi } from './locales/hi';
import { pt } from './locales/pt';
import { id } from './locales/id';
import { vi } from './locales/vi';
import { tl } from './locales/tl';
import { it } from './locales/it';
import { tr } from './locales/tr';
import { ms } from './locales/ms';
import { bn } from './locales/bn';

export const translations = {
  en,
  my,
  th,
  zh,
  es,
  fr,
  de,
  ja,
  ko,
  ar,
  ru,
  hi,
  pt,
  id,
  vi,
  tl,
  it,
  tr,
  ms,
  bn,
} as const;

export type TranslationKey = keyof typeof en;
