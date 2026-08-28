/**
 * Plan Store — گام‌های «در انتظار تأیید» در حالت پلن.
 * وقتی ایجنت قصد اجرای ابزار خطرناک را دارد و planMode روشن است،
 * بک‌اند به‌جای اجرا یک ورودی pending برمیگرداند که کاربر تأیید/رد میکند.
 */
import { create } from 'zustand'
import type { AtlasAPI } from '@/types/atlas-api'

export interface PendingStep {
  id: string
  tool: string
  args: Record<string, unknown>
}

interface PlanState {
  pending: PendingStep[]
  add: (tool: string, args: Record<string, unknown>) => void
  approve: (id: string) => Promise<void>
  reject: (id: string) => void
}

function getApi(): AtlasAPI | undefined {
  return (window as unknown as { atlasAPI?: AtlasAPI }).atlasAPI
}

export const usePlanStore = create<PlanState>((set, get) => ({
  pending: [],
  add: (tool, args) =>
    set(s => ({ pending: [...s.pending, { id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, tool, args }] })),
  approve: async id => {
    const step = get().pending.find(p => p.id === id)
    if (!step) return
    set(s => ({ pending: s.pending.filter(p => p.id !== id) }))
    const api = getApi()
    // ارسال دوباره با نشانهٔ approved ← بک‌اند گیت را دور میزند و اجرا میکند
    await api?.invokeTool(step.tool, { ...step.args, approved: true })
  },
  reject: id => set(s => ({ pending: s.pending.filter(p => p.id !== id) })),
}))
