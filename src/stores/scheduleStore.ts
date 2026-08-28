/**
 * Schedule Store — زمان‌بندی تسک‌ها: اجرای خودکار یک پرامپت در ساعت مشخص
 * یا هر چند دقیقه. اجراکننده واقعی در App.tsx است (چون به runtime دسترسی دارد).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ScheduledTask {
  id: string
  prompt: string
  /** اجرا در ساعتِ مشخص هر روز (فرمت HH:MM) — با everyMin حصری است */
  at?: string
  /** اجرا هر این تعداد دقیقه */
  everyMin?: number
  enabled: boolean
  lastRun?: number
}

interface ScheduleState {
  tasks: ScheduledTask[]
  add: (t: Omit<ScheduledTask, 'id'>) => void
  remove: (id: string) => void
  toggle: (id: string) => void
  markRun: (id: string) => void
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      tasks: [],
      add: t =>
        set(s => ({
          tasks: [
            { ...t, id: `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}` },
            ...s.tasks,
          ],
        })),
      remove: id => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
      toggle: id =>
        set(s => ({ tasks: s.tasks.map(t => (t.id === id ? { ...t, enabled: !t.enabled } : t)) })),
      markRun: id =>
        set(s => ({ tasks: s.tasks.map(t => (t.id === id ? { ...t, lastRun: Date.now() } : t)) })),
    }),
    { name: 'atlas-schedule', version: 1 }
  )
)

/** آیا تسک در لحظهٔ اکنون موعد اجراست؟ (با پنجرهٔ ۶۰ ثانیه) */
export function isTaskDue(task: ScheduledTask, now: Date, lastCheck: number): boolean {
  if (!task.enabled || !task.prompt.trim()) return false
  const mins = now.getHours() * 60 + now.getMinutes()
  if (task.everyMin) {
    const due = task.lastRun ? now.getTime() - task.lastRun >= task.everyMin * 60_000 - 5000 : true
    return due
  }
  if (task.at) {
    const [h, m] = task.at.split(':').map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return false
    const target = h * 60 + m
    return mins === target && now.getTime() - lastCheck <= 60_000
  }
  return false
}
