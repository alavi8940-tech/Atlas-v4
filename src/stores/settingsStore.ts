import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeName =
  | 'midnight' | 'aurora' | 'paper' | 'lavender'
  | 'sunset' | 'ocean' | 'rose' | 'forest'

export interface ThemeMeta {
  id: ThemeName
  name: string      // نام فارسی
  latin: string     // نام لاتین روی کارت
  preview: string   // گرادیان پیشنمایش کارت
  mode: 'dark' | 'light'
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'midnight', name: 'نیمهشب', latin: 'Midnight', mode: 'dark',
    preview: 'linear-gradient(120deg, #0f172a 0%, #4f46e5 55%, #a5b4fc 100%)'
  },
  {
    id: 'aurora', name: 'شفق', latin: 'Aurora', mode: 'dark',
    preview: 'linear-gradient(120deg, #022c22 0%, #0d9488 55%, #6ee7b7 100%)'
  },
  {
    id: 'sunset', name: 'غروب', latin: 'Sunset', mode: 'dark',
    preview: 'linear-gradient(120deg, #1c0a02 0%, #c2410c 55%, #fdba74 100%)'
  },
  {
    id: 'ocean', name: 'اقیانوس', latin: 'Ocean', mode: 'dark',
    preview: 'linear-gradient(120deg, #082f49 0%, #0369a1 55%, #7dd3fc 100%)'
  },
  {
    id: 'forest', name: 'جنگل', latin: 'Forest', mode: 'dark',
    preview: 'linear-gradient(120deg, #052e16 0%, #16a34a 55%, #86efac 100%)'
  },
  {
    id: 'paper', name: 'کاغذی', latin: 'Paper', mode: 'light',
    preview: 'linear-gradient(120deg, #f6f1e7 0%, #e7c98f 60%, #b45309 130%)'
  },
  {
    id: 'lavender', name: 'لاوندری', latin: 'Lavender', mode: 'light',
    preview: 'linear-gradient(120deg, #eef0fb 0%, #c4b5fd 60%, #6366f1 130%)'
  },
  {
    id: 'rose', name: 'رز', latin: 'Rose', mode: 'light',
    preview: 'linear-gradient(120deg, #fdf2f6 0%, #f9a8d4 60%, #db2777 140%)'
  }
]

/* ═════════ تنظیمات مدل (بخش ۳ مستند — نسخهٔ فاز ۱) ═════════ */

/** حالتهای موتور: نمایشی، Ollama محلی، یا هر سرویس سازگار با OpenAI */
export type ProviderKind = 'demo' | 'ollama' | 'openai'

export interface ModelSettings {
  provider: ProviderKind
  /** Ollama — پایگاهنشانی سازگار با OpenAI */
  ollamaBaseURL: string
  ollamaModel: string
  /** سرویس سازگار با OpenAI — LM Studio ، LiteLLM آرسنال ، vLLM و ... */
  apiBaseURL: string
  apiKey: string
  apiModel: string
  /** پارامترهای تولید */
  temperature: number
  maxTokens: number
  systemPrompt: string
}

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  provider: 'demo',
  ollamaBaseURL: 'http://localhost:11434/v1',
  ollamaModel: 'qwen3:8b',
  apiBaseURL: 'http://localhost:4000/v1',
  apiKey: '',
  apiModel: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt:
    'تو «Atlas» هستی، دستیار هوشمند محلی کاربر. فارسی روان پاسخ میدهی، ' +
    'کوتاه و دقیق هستی و برای کد از بلوک مارکداون استفاده میکنی. ' +
    'دادههای کاربر روی دستگاه خودش میماند.'
}

interface SettingsState extends ModelSettings {
  theme: ThemeName
  setTheme: (t: ThemeName) => void
  /** وضعیت گوی: idle | thinking | listening */
  orbState: 'idle' | 'thinking' | 'listening'
  setOrbState: (s: 'idle' | 'thinking' | 'listening') => void
  /** بهروزرسانی جزئی تنظیمات مدل */
  setModel: (patch: Partial<ModelSettings>) => void
  /** برگرداندن تنظیمات مدل به پیشفرض */
  resetModel: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_MODEL_SETTINGS,
      theme: 'midnight',
      setTheme: theme => set({ theme }),
      orbState: 'idle',
      setOrbState: orbState => set({ orbState }),
      setModel: patch => set(patch),
      resetModel: () => set({ ...DEFAULT_MODEL_SETTINGS })
    }),
    {
      name: 'atlas-settings',
      version: 1,
      // orbState گذراست و نباید ذخیره شود
      partialize: s => ({
        theme: s.theme,
        provider: s.provider,
        ollamaBaseURL: s.ollamaBaseURL,
        ollamaModel: s.ollamaModel,
        apiBaseURL: s.apiBaseURL,
        apiKey: s.apiKey,
        apiModel: s.apiModel,
        temperature: s.temperature,
        maxTokens: s.maxTokens,
        systemPrompt: s.systemPrompt
      })
    }
  )
)

/** خواندن لحظهای تنظیمات مدل — برای استفاده خارج از React (آداپتور چت) */
export function getModelSettings(): ModelSettings {
  const s = useSettingsStore.getState()
  return {
    provider: s.provider,
    ollamaBaseURL: s.ollamaBaseURL,
    ollamaModel: s.ollamaModel,
    apiBaseURL: s.apiBaseURL,
    apiKey: s.apiKey,
    apiModel: s.apiModel,
    temperature: s.temperature,
    maxTokens: s.maxTokens,
    systemPrompt: s.systemPrompt
  }
}

/** برچسب فارسی وضعیت موتور — نشان نوار بالا */
export function engineLabel(provider: ProviderKind, model: string): string {
  switch (provider) {
    case 'demo': return 'حالت نمایش'
    case 'ollama': return `Ollama · ${model}`
    case 'openai': return `API · ${model}`
  }
}

export function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme
}
