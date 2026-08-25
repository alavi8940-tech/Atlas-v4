import { useEffect, useState, useRef } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Thread } from '@/components/assistant-ui/thread'
import { Welcome } from '@/components/Welcome'
import { SettingsDialog } from '@/components/SettingsDialog'
import {
  applyTheme, useSettingsStore,
  getModelSettings, engineLabel, activeModelName
} from '@/stores/settingsStore'
import {
  useConversationsStore, useMessagesStore
} from '@/stores/conversationsStore'
import type { ProviderKind } from '@/stores/settingsStore'
import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { useAtlasRuntime } from '@/lib/atlasRuntime'
import { PanelRightOpen, Sparkles } from 'lucide-react'

function App(): React.JSX.Element {
  const engine = useEngineInfo()
  const runtime = useAtlasRuntime()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const conversations = useConversationsStore(s => s.conversations)
  const activeId = useConversationsStore(s => s.activeId)
  const createConv = useConversationsStore(s => s.create)
  const ensureTitle = useConversationsStore(s => s.ensureTitle)
  const touch = useConversationsStore(s => s.touch)
  const saveThread = useMessagesStore(s => s.save)
  const loadThread = useMessagesStore(s => s.load)

  /** آخرین پیام کاربر که عنوان از آن ساخته شده — برای تشخیص اولین پیام */
  const lastUserCountRef = useRef(0)

  /* ─── میانبرها: Ctrl+B سایدبار ، Ctrl+, تنظیمات ، Ctrl+K مکالمهٔ جدید ─── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'b') { e.preventDefault(); setSidebarOpen(o => !o) }
      if (e.key === ',') { e.preventDefault(); setSettingsOpen(true) }
      if (k === 'k') {
        e.preventDefault()
        // اگر اجرا در جریان است، رد شود
        try {
          if (runtime.thread.getState().isRunning) return
        } catch { /* ignore */ }
        createConv()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [runtime, createConv])

  /* ─── شروع/توقف مکالمه برای نمایش Welcome یا Thread ─── */
  useEffect(() => {
    let alive = true
    const check = (): void => {
      if (!alive) return
      try {
        setHasStarted(runtime.thread.getState().messages.length > 0)
      } catch { /* هنوز آماده نیست */ }
    }
    check()
    const unsub = runtime.thread.subscribe(check)
    return () => { alive = false; unsub() }
  }, [runtime])

  /* ─── سوییچ مکالمه: ذخیرهٔ قبلی و بازیابی مقصد ─── */
  const prevActiveRef = useRef<string | null>(null)
  useEffect(() => {
    const prev = prevActiveRef.current
    prevActiveRef.current = activeId
    if (prev === activeId) return

    // ذخیرهٔ مکالمهٔ قبلی (اگر پیام دارد)
    if (prev) {
      try {
        const msgs = runtime.thread.getState().messages
        if (msgs.length > 0) {
          saveThread(prev, runtime.thread.export())
        }
      } catch { /* ignore */ }
    }

    // بارگذاری مکالمهٔ جدید
    try {
      const stored = activeId ? loadThread(activeId) : undefined
      if (stored?.repository) {
        runtime.thread.import(stored.repository as never)
      } else {
        runtime.thread.reset()
      }
    } catch { /* ignore */ }
    lastUserCountRef.current = 0
  }, [activeId, runtime, saveThread, loadThread])

  /* ─── عنوان خودکار + touch بعد از هر پاسخ کامل ─── */
  useEffect(() => {
    if (!activeId || !hasStarted) return
    try {
      const msgs = runtime.thread.getState().messages
      const userMsgs = msgs.filter(m => m.role === 'user')
      if (userMsgs.length > lastUserCountRef.current) {
        lastUserCountRef.current = userMsgs.length
        const first = userMsgs[0]
        const text = first?.content.find(p => p.type === 'text')
        if (text && 'text' in text) ensureTitle(activeId, String(text.text))
      }
      touch(activeId)
    } catch { /* ignore */ }
  }, [hasStarted, activeId, runtime, ensureTitle, touch])

  /* ─── ذخیرهٔ نهایی هنگام خروج صفحه ─── */
  useEffect(() => {
    const onSave = (): void => {
      if (!activeId) return
      try {
        if (runtime.thread.getState().messages.length > 0) {
          saveThread(activeId, runtime.thread.export())
        }
      } catch { /* ignore */ }
    }
    window.addEventListener('beforeunload', onSave)
    return () => window.removeEventListener('beforeunload', onSave)
  }, [activeId, runtime, saveThread])

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-full gap-0" dir="rtl" style={{ background: 'var(--bg-base)' }}>
        <div className="atlas-aurora-bg" aria-hidden />
        <div className="atlas-grain" aria-hidden />

        {sidebarOpen ? (
          <Sidebar onClose={() => setSidebarOpen(false)} />
        ) : (
          <button
            onClick={() => setSidebarOpen(true)}
            className="glass glass-hover m-3 ml-0 flex h-12 w-12 items-center justify-center rounded-2xl self-start"
            title="سایدبار (Ctrl+B)"
            style={{ color: 'var(--text-secondary)' }}
          >
            <PanelRightOpen size={18} />
          </button>
        )}

        <main className="glass relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-none m-0">
          {/* نوار بالا */}
          <div className="flex items-center gap-2 p-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="glass rounded-xl p-2" title="سایدبار" style={{ color: 'var(--text-secondary)' }}>
                <PanelRightOpen size={15} />
              </button>
            )}
            <span className="mr-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] glass" style={{ color: 'var(--text-secondary)' }}>
              <Sparkles size={11} style={{ color: 'var(--accent)' }} /> Atlas v4 · {engine}
              {conversations.length > 0 && ` · ${conversations.length} مکالمه`}
            </span>
          </div>

          <div className="min-h-0 flex-1">
            {hasStarted ? <Thread /> : <Welcome />}
          </div>
        </main>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </AssistantRuntimeProvider>
  )
}

/** دنبالکردن تنظیمات موتور برای نشان نوار بالا */
function useEngineInfo(): string {
  const [label, setLabel] = useState(() => {
    const s = getModelSettings()
    return engineLabel(s.provider, activeModelName(s))
  })
  useEffect(() => {
    const sync = (): void => {
      const s = useSettingsStore.getState()
      setLabel(engineLabel(s.provider, activeModelName(s)))
      applyTheme(s.theme)
    }
    sync()
    return useSettingsStore.subscribe(sync)
  }, [])
  return label
}

export default App

// حفظ سازگاری نوع پروایدر برای importهای آینده
export type { ProviderKind }
