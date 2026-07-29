import { GoogleGenAI } from '@google/genai';

const GEMINI_KEY_STORAGE = 'openreason_custom_gemini_api_key';
const OPENROUTER_KEY_STORAGE = 'openreason_custom_openrouter_api_key';

export function getStoredGeminiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
}

export function getStoredOpenRouterKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(OPENROUTER_KEY_STORAGE) || '';
}

export function getEffectiveGeminiKey(): string {
  const custom = getStoredGeminiKey();
  if (custom && custom.trim().length > 0) {
    return custom.trim();
  }
  return process.env.GEMINI_API_KEY || '';
}

export function getEffectiveOpenRouterKey(): string {
  const custom = getStoredOpenRouterKey();
  if (custom && custom.trim().length > 0) {
    return custom.trim();
  }
  return process.env.OPENROUTER_API_KEY || '';
}

export function setGeminiKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key || key.trim() === '') {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
  } else {
    localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
  }
}

export function setOpenRouterKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key || key.trim() === '') {
    localStorage.removeItem(OPENROUTER_KEY_STORAGE);
  } else {
    localStorage.setItem(OPENROUTER_KEY_STORAGE, key.trim());
  }
}

export function removeGeminiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GEMINI_KEY_STORAGE);
}

export function removeOpenRouterKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OPENROUTER_KEY_STORAGE);
}

export function hasCustomGeminiKey(): boolean {
  return getStoredGeminiKey().trim().length > 0;
}

export function hasCustomOpenRouterKey(): boolean {
  return getStoredOpenRouterKey().trim().length > 0;
}

export function getGenAIClient(): GoogleGenAI {
  const apiKey = getEffectiveGeminiKey();
  return new GoogleGenAI({ apiKey });
}

export const API_KEY_URLS = {
  GEMINI: 'https://aistudio.google.com/app/apikey',
  OPENROUTER: 'https://openrouter.ai/keys'
};
