import { en } from './locales/en';
import { my } from './locales/my';
import { th } from './locales/th';
import { zh } from './locales/zh';
export const translations = { en, my, th, zh } as const;
export type TranslationKey = keyof typeof en;
