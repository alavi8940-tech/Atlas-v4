/**
 * Skills Store — مدیریت مهارتهای نصبشده
 * ماندگار (persist) — نصب روی کل برنامه میماند و در سطح مکالمه فعال/غیرفعال میشود
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InstalledSkill } from '@/lib/skillsApi'

interface SkillsState {
  /** همهٔ مهارتهای نصبشده — کلید: id */
  installed: Record<string, InstalledSkill>
  /** مهارتهای غیرفعالشده برای یک مکالمهٔ خاص — کلید: conversationId */
  disabledForConv: Record<string, string[]>
  install: (skill: InstalledSkill) => void
  uninstall: (id: string) => void
  isInstalled: (id: string) => boolean
  setEnabledForConv: (convId: string, skillId: string, enabled: boolean) => void
  enabledSkillsForConv: (convId: string) => InstalledSkill[]
}

export const useSkillsStore = create<SkillsState>()(
  persist(
    (set, get) => ({
      installed: {},
      disabledForConv: {},

      install: skill =>
        set(s => ({ installed: { ...s.installed, [skill.id]: skill } })),

      uninstall: id =>
        set(s => {
          const { [id]: _removed, ...rest } = s.installed
          // از لیستهای غیرفعالسازی هم پاک شود
          const disabledForConv: Record<string, string[]> = {}
          for (const [conv, ids] of Object.entries(s.disabledForConv)) {
            disabledForConv[conv] = ids.filter(x => x !== id)
          }
          return { installed: rest, disabledForConv }
        }),

      isInstalled: id => id in get().installed,

      setEnabledForConv: (convId, skillId, enabled) =>
        set(s => {
          const current = new Set(s.disabledForConv[convId] ?? [])
          if (enabled) current.delete(skillId)
          else current.add(skillId)
          return { disabledForConv: { ...s.disabledForConv, [convId]: [...current] } }
        }),

      enabledSkillsForConv: convId => {
        const s = get()
        const disabled = new Set(s.disabledForConv[convId] ?? [])
        return Object.values(s.installed).filter(sk => !disabled.has(sk.id))
      }
    }),
    {
      name: 'atlas-skills',
      version: 1,
      partialize: s => ({ installed: s.installed, disabledForConv: s.disabledForConv })
    }
  )
)
