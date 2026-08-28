/**
 * Macros Store — ماکروهای کاربر: توالی ابزارهای عامل که با یک کلیک اجرا میشوند.
 * اجرا از طریق IPC پروسهٔ اصلی (درست مثل ایجنت) انجام میشود.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AtlasAPI } from '@/types/atlas-api'

export interface MacroStep {
  tool: string
  args: Record<string, unknown>
}

export interface Macro {
  id: string
  name: string
  steps: MacroStep[]
  createdAt: number
}

interface MacrosState {
  macros: Macro[]
  save: (name: string, steps: MacroStep[]) => void
  remove: (id: string) => void
  run: (id: string) => Promise<Array<Record<string, unknown>>>
}

function getApi(): AtlasAPI | undefined {
  return (window as unknown as { atlasAPI?: AtlasAPI }).atlasAPI
}

export const useMacrosStore = create<MacrosState>()(
  persist(
    (set, get) => ({
      macros: [],
      save: (name, steps) => {
        const macro: Macro = {
          id: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          name: name.trim() || 'ماکروی بی‌نام',
          steps,
          createdAt: Date.now(),
        }
        set(s => ({ macros: [macro, ...s.macros] }))
      },
      remove: id => set(s => ({ macros: s.macros.filter(m => m.id !== id) })),
      run: async id => {
        const macro = get().macros.find(m => m.id === id)
        if (!macro) return []
        const api = getApi()
        if (!api?.invokeTool) return []
        const out: Array<Record<string, unknown>> = []
        for (const step of macro.steps) {
          const r = await api.invokeTool(step.tool, step.args)
          out.push(r)
        }
        return out
      },
    }),
    { name: 'atlas-macros', version: 1 }
  )
)
