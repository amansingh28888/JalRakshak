// JalRakshak — Language Utilities

import type { LanguageOption, AdvisoryResponse } from '../types';

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', isRtl: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRtl: true },
];

export const LANGUAGE_STORAGE_KEY = 'jalrakshak_language';
const ADVISORY_CACHE_PREFIX = 'jalrakshak_advisory_cache_';

export function getSavedLanguageCode(): string {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved) return saved;

  const browserLang = navigator.language.split('-')[0];
  const exists = LANGUAGES.find((l) => l.code === browserLang);
  return exists ? exists.code : 'en';
}

export function saveLanguageCode(code: string) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
}

export function getLanguageByCode(code: string): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) || { code, name: code };
}

// Simple local storage cache for advisories to save API calls
export function getCachedAdvisory(sampleId: number | string, languageCode: string): AdvisoryResponse | null {
  try {
    const key = `${ADVISORY_CACHE_PREFIX}${sampleId}_${languageCode}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached) as AdvisoryResponse;
    }
  } catch (e) {
    console.error('Error reading advisory cache', e);
  }
  return null;
}

export function setCachedAdvisory(sampleId: number | string, languageCode: string, advisory: AdvisoryResponse) {
  try {
    const key = `${ADVISORY_CACHE_PREFIX}${sampleId}_${languageCode}`;
    localStorage.setItem(key, JSON.stringify(advisory));
  } catch (e) {
    console.error('Error writing advisory cache', e);
  }
}
