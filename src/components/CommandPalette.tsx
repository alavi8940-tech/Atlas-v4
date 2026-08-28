/**
 * CommandPalette — پالت فرمان (⌘K / Ctrl+K): جستجوی سریع و اجرای اکشن‌ها.
 * روی استانداردهای موجود (Dialog + motion + lucide + cn) سوار شده.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAui } from '@assistant-ui/react'
import {
  Dialog, DialogContent,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/settingsStore'
import { useMacrosStore } from '@/stores/macrosStore'
import { useToastStore } from '@/stores/toastStore'
import {
  Plus, Settings, Wrench, Puzzle, Bot, Radio, Palette, Sparkles,
  MessageSquarePlus, CornerDownLeft, Search, Mic
} from 'lucide-react'

interface Action {
  id: string
  title: string
  hint?: string
  icon: React.ReactNode
  keywords: string
  run: () => void
}

const TEMPLATES = [
  'وضعیت سیستمم رو تحلیل کن و بهینه‌سازی پیشنهاد بده',
  'یه اسکریپت بکاپ خودکار برام بنویس',
  'فایلهای بزرگ رو پیدا کن و گزارش بده',
  'از صفحه عکس بگیر و خلاصه‌ش کن',
  'یه ایمیل رسمی فارسی برای پیگیری بنویس',
]

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }): React.JSX.Element {
  const aui = useAui()
  const s = useSettingsStore()
  const macros = useMacrosStore(st => st.macros)
  const toast = useToastStore(st => st.push)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const actions = useMemo<Action[]>(() => {
    const list: Action[] = [
      { id: 'new', title: 'مکالمهٔ جدید', icon: <Plus size={16} />, keywords: 'new chat مکالمه جدید', run: () => window.dispatchEvent(new CustomEvent('atlas:new-chat')) },
      { id: 'voice', title: 'چت صوتی', icon: <Mic size={16} />, keywords: 'voice صوتی میکروفون', run: () => window.dispatchEvent(new CustomEvent('atlas:open-voice')) },
      { id: 'settings', title: 'تنظیمات', icon: <Settings size={16} />, keywords: 'settings تنظیمات', run: () => window.dispatchEvent(new CustomEvent('atlas:open-settings')) },
      { id: 'tools', title: 'ابزارهای پیشرفته', icon: <Wrench size={16} />, keywords: 'tools ابزارها', run: () => window.dispatchEvent(new CustomEvent('atlas:open-tools')) },
      { id: 'skills', title: 'فروشگاه مهارتها', icon: <Puzzle size={16} />, keywords: 'skills مهارت', run: () => window.dispatchEvent(new CustomEvent('atlas:open-skills')) },
      { id: 'agent', title: `حالت عامل: ${s.agentEnabled ? 'خاموش' : 'روشن'}`, icon: <Bot size={16} />, keywords: 'agent عامل', run: () => s.setAgentEnabled(!s.agentEnabled) },
      { id: 'plan', title: `حالت پلن: ${s.planMode ? 'خاموش' : 'روشن'}`, icon: <Radio size={16} />, keywords: 'plan پلن', run: () => s.setPlanMode(!s.planMode) },
      { id: 'theme', title: 'چرخش تم بعدی', icon: <Palette size={16} />, keywords: 'theme تم', run: () => cycleTheme() },
      ...macros.map<Action>(m => ({
        id: `macro-${m.id}`, title: `ماکرو: ${m.name}`, hint: `${m.steps.length} گام`, icon: <Sparkles size={16} />, keywords: `macro ماکرو ${m.name}`,
        run: () => { void useMacrosStore.getState().run(m.id) },
      })),
      ...TEMPLATES.map<Action>(t => ({
        id: `tpl-${t}`, title: t, icon: <MessageSquarePlus size={16} />, keywords: `template پرامپت ${t}`,
        run: () => aui.thread.append(t),
      })),
    ]
    return list
  }, [aui, s, macros])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return actions
    return actions.filter(a => (a.title + ' ' + a.keywords).toLowerCase().includes(term))
  }, [actions, q])

  useEffect(() => { if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30) } }, [open])
  useEffect(() => { setActive(0) }, [q])

  const choose = (a?: Action): void => {
    if (!a) return
    onClose()
    setTimeout(() => { a.run(); toast(`اجرا شد: ${a.title}`, 'success') }, 10)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass-strong beam-border top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden rounded-2xl p-0" style={{ background: 'var(--bg-base)' }}>
        <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--glass-border)' }}>
          <Search size={16} style={{ color: 'var(--text-secondary)' }} />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, filtered.length - 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
              if (e.key === 'Enter') { e.preventDefault(); choose(filtered[active]) }
              if (e.key === 'Escape') onClose()
            }}
            placeholder="جستجو در دستورها، مهارتها، پرامپت‌های آماده…"
            className="w-full bg-transparent text-sm outline-none placeholder:opacity-50"
            style={{ color: 'var(--text-primary)' }}
          />
          <kbd className="rounded-md px-1.5 py-0.5 text-[9px] glass">ESC</kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>موردی پیدا نشد</p>
          )}
          {filtered.map((a, i) => (
            <button
              key={a.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(a)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-sm transition-colors',
                i === active ? 'bg-[var(--accent-soft)]' : 'hover:bg-white/5'
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--glass-bg)', color: 'var(--accent)' }}>{a.icon}</span>
              <span className="min-w-0 flex-1 truncate">{a.title}</span>
              {a.hint && <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{a.hint}</span>}
              {i === active && <CornerDownLeft size={14} style={{ color: 'var(--text-secondary)' }} />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t px-4 py-2 text-[10px]" style={{ borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}>
          <span><kbd className="rounded bg-white/10 px-1">↑↓</kbd> حرکت</span>
          <span><kbd className="rounded bg-white/10 px-1">↵</kbd> اجرا</span>
          <span className="mr-auto">Atlas Command</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function cycleTheme(): void {
  const order = ['midnight', 'aurora', 'sunset', 'ocean', 'forest', 'lavender', 'rose', 'paper']
  const cur = useSettingsStore.getState().theme
  const next = order[(order.indexOf(cur) + 1) % order.length] as typeof cur
  useSettingsStore.getState().setTheme(next)
}
