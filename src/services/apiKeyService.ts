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
  return getStoredGeminiKey().trim();
}

export function getEffectiveOpenRouterKey(): string {
  return getStoredOpenRouterKey().trim();
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

export async function generateGeminiContentProxy(params: {
  model: string;
  contents: any;
  config?: any;
}): Promise<{ text: string; candidates?: any; usage?: any }> {
  const customKey = getStoredGeminiKey().trim();

  // If user provided custom BYOK key, execute directly on client with user's key
  if (customKey) {
    const ai = new GoogleGenAI({ apiKey: customKey });
    const res = await ai.models.generateContent({
      model: params.model,
      contents: params.contents,
      config: params.config
    });
    return {
      text: res.text || "",
      candidates: res.candidates,
      usage: res.usageMetadata
    };
  }

  // Otherwise, route through server /api/chat endpoint where GEMINI_API_KEY is safely stored on Node server
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: params.model,
      contents: params.contents,
      config: params.config
    })
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => null);
    throw new Error(errorJson?.message || `Server returned HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.text || "",
    candidates: data.candidates || [],
    usage: data.usage || null
  };
}

export const API_KEY_URLS = {
  GEMINI: 'https://aistudio.google.com/app/apikey',
  OPENROUTER: 'https://openrouter.ai/keys'
};
