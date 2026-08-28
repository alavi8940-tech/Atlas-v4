/**
 * ToolsPanel — میزبان قابلیت‌های پیشرفته Atlas (۱۲ ویژگی):
 * ماکروها، زمان‌بندی، حالت پلن، داشبورد سیستم، RAG محلی، مقایسه مدل‌ها،
 * جستجوی معنایی، بازپخش جلسه، همگام‌سازی ابری.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  X, Save, Trash2, Play, Plus, RefreshCw, Download, Upload,
  Clock, ListTree, Cpu, Search, Layers, Radio, History, Cloud
} from 'lucide-react'
import { useAui } from '@assistant-ui/react'
import { usePlanStore } from '@/stores/planStore'
import { useMacrosStore, type MacroStep } from '@/stores/macrosStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useActivityStore } from '@/stores/activityStore'
import { useToastStore } from '@/stores/toastStore'
import { AnimatedNumber } from '@/components/fx/AnimatedNumber'
import { celebrate } from '@/lib/celebrate'
import { useSettingsStore, getModelSettings } from '@/stores/settingsStore'
import { useConversationsStore, useMessagesStore } from '@/stores/conversationsStore'
import { proxyFetch } from '@/lib/modelCatalog'

type Tab = 'macros' | 'schedule' | 'plan' | 'system' | 'rag' | 'ensemble' | 'semantic' | 'replay' | 'sync'

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'macros', label: 'ماکروها', icon: <ListTree size={14} /> },
  { id: 'schedule', label: 'زمان‌بندی', icon: <Clock size={14} /> },
  { id: 'plan', label: 'حالت پلن', icon: <Radio size={14} /> },
  { id: 'system', label: 'داشبورد', icon: <Cpu size={14} /> },
  { id: 'rag', label: 'RAG محلی', icon: <Layers size={14} /> },
  { id: 'ensemble', label: 'مقایسه مدل‌ها', icon: <Layers size={14} /> },
  { id: 'semantic', label: 'جستجوی معنایی', icon: <Search size={14} /> },
  { id: 'replay', label: 'بازپخش جلسه', icon: <History size={14} /> },
  { id: 'sync', label: 'همگام‌سازی', icon: <Cloud size={14} /> },
]

export function ToolsPanel({ open, onClose }: { open: boolean; onClose: () => void }): React.JSX.Element | null {
  const [tab, setTab] = useState<Tab>('macros')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-start" role="dialog" aria-label="ابزارهای Atlas">
      <button aria-label="بستن" className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="glass-strong beam-border relative z-10 flex h-full w-[28rem] max-w-[94vw] flex-col rounded-none border-l p-4" style={{ background: 'var(--bg-base)' }}>
        <header className="mb-3 flex items-center gap-2">
          <span className="text-xl">🧰</span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold">ابزارهای پیشرفته</h2>
            <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>قابلیت‌های نسخهٔ بعدی Atlas</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 glass-hover" style={{ color: 'var(--text-secondary)' }}><X size={16} /></button>
        </header>

        <nav className="mb-3 flex flex-wrap gap-1 rounded-2xl p-1 glass">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="relative flex items-center gap-1 rounded-xl px-2 py-1 text-[10px] transition-colors"
              style={tab === t.id ? { color: 'var(--accent)' } : { color: 'var(--text-secondary)' }}>
              {tab === t.id && <motion.span layoutId="toolTab" className="absolute inset-0 rounded-xl" style={{ background: 'var(--accent-soft)' }} />}
              <span className="relative z-10 flex items-center gap-1">{t.icon} {t.label}</span>
            </button>
          ))}
        </nav>

        <div className="-mr-1 min-h-0 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-y-auto pl-1">
          {tab === 'macros' && <MacrosTab />}
          {tab === 'schedule' && <ScheduleTab />}
          {tab === 'plan' && <PlanTab />}
          {tab === 'system' && <SystemTab />}
          {tab === 'rag' && <RagTab />}
          {tab === 'ensemble' && <EnsembleTab />}
          {tab === 'semantic' && <SemanticTab />}
          {tab === 'replay' && <ReplayTab />}
          {tab === 'sync' && <SyncTab />}
        </div>
      </aside>
    </div>
  )
}

/* ─── ماکروها ─── */
function MacrosTab(): React.JSX.Element {
  const macros = useMacrosStore(s => s.macros)
  const save = useMacrosStore(s => s.save)
  const remove = useMacrosStore(s => s.remove)
  const run = useMacrosStore(s => s.run)
  const toast = useToastStore(s => s.push)
  const [name, setName] = useState('')
  const [stepsJson, setStepsJson] = useState('[\n  { "tool": "shell_exec", "args": { "command": "echo hi" } }\n]')
  const [busy, setBusy] = useState(false)

  const saveFromActivity = (): void => {
    const steps: MacroStep[] = useActivityStore.getState().entries
      .filter(e => !e.pending && e.tool !== 'screen_capture' && e.args)
      .slice(0, 8)
      .map(e => ({ tool: e.tool, args: e.args as Record<string, unknown> }))
    if (steps.length === 0) return
    save(name || 'ماکرو از فعالیت اخیر', steps)
    setName('')
  }

  const doRun = async (id: string): Promise<void> => {
    setBusy(true)
    try { await run(id); toast('ماکرو اجرا شد ✓', 'success'); celebrate() }
    catch { toast('خطا در اجرای ماکرو', 'error') }
    finally { setBusy(false) }
  }

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl p-3 glass">
        <p className="mb-2 text-xs font-medium">ماکروی جدید</p>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="نام ماکرو" className="mb-2 w-full rounded-xl bg-transparent px-3 py-2 text-xs outline-none" style={{ background: 'rgba(128,128,128,.08)', color: 'var(--text-primary)' }} />
        <textarea value={stepsJson} onChange={e => setStepsJson(e.target.value)} rows={5} className="w-full resize-none rounded-xl bg-transparent px-3 py-2 text-[11px] font-mono outline-none" style={{ background: 'rgba(128,128,128,.08)', color: 'var(--text-primary)' }} />
        <div className="mt-2 flex gap-2">
          <Button onClick={() => { try { const s = JSON.parse(stepsJson); if (Array.isArray(s)) { save(name, s); setName('') } } catch { alert('فرمت JSON نامعتبر') } }}><Save size={12} /> ذخیره دستی</Button>
          <Button onClick={saveFromActivity}>ذخیره از فعالیت اخیر</Button>
        </div>
      </div>
      {macros.map(m => (
        <div key={m.id} className="flex items-center gap-2 rounded-2xl p-3 glass">
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold">{m.name}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{m.steps.length} گام</div>
          </div>
          <Button disabled={busy} onClick={() => void doRun(m.id)}><Play size={12} /> اجرا</Button>
          <button onClick={() => remove(m.id)} className="rounded-xl p-1.5" style={{ color: '#f87171' }}><Trash2 size={13} /></button>
        </div>
      ))}
      {macros.length === 0 && <p className="text-center text-[11px]" style={{ color: 'var(--text-secondary)' }}>هنوز ماکرویی نداری — از فعالیت اخیر بساز 🪄</p>}
    </div>
  )
}

/* ─── زمان‌بندی ─── */
function ScheduleTab(): React.JSX.Element {
  const tasks = useScheduleStore(s => s.tasks)
  const add = useScheduleStore(s => s.add)
  const remove = useScheduleStore(s => s.remove)
  const toggle = useScheduleStore(s => s.toggle)
  const [prompt, setPrompt] = useState('')
  const [at, setAt] = useState('09:00')
  const [everyMin, setEveryMin] = useState('')

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl p-3 glass">
        <p className="mb-2 text-xs font-medium">تسک زمان‌بندی‌شده</p>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={2} placeholder="پرامپتی که اجرا شود (مثل: گزارش وضعیت سیستم)" className="mb-2 w-full resize-none rounded-xl bg-transparent px-3 py-2 text-xs outline-none" style={{ background: 'rgba(128,128,128,.08)', color: 'var(--text-primary)' }} />
        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
          <label>هر روز ساعت</label>
          <input value={at} onChange={e => setAt(e.target.value)} type="time" className="rounded-lg px-2 py-1" style={{ background: 'rgba(128,128,128,.08)', color: 'var(--text-primary)' }} />
          <label>یا هر</label>
          <input value={everyMin} onChange={e => setEveryMin(e.target.value)} placeholder="۲۰" className="w-14 rounded-lg px-2 py-1" style={{ background: 'rgba(128,128,128,.08)', color: 'var(--text-primary)' }} />
          <label>دقیقه</label>
        </div>
        <div className="mt-2"><Button onClick={() => { if (prompt.trim()) { add({ prompt, at: everyMin ? undefined : at, everyMin: everyMin ? Number(everyMin) : undefined, enabled: true }); setPrompt('') } }}><Plus size={12} /> افزودن</Button></div>
      </div>
      {tasks.map(t => (
        <div key={t.id} className="flex items-center gap-2 rounded-2xl p-3 glass">
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold">{t.prompt}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{t.at ? `هر روز ${t.at}` : `هر ${t.everyMin} دقیقه`}{t.lastRun ? ` · آخرین اجرا ${new Date(t.lastRun).toLocaleTimeString('fa-IR')}` : ''}</div>
          </div>
          <Button onClick={() => toggle(t.id)} style={t.enabled ? { color: 'var(--accent)' } : undefined}>{t.enabled ? 'روشن' : 'خاموش'}</Button>
          <button onClick={() => remove(t.id)} className="rounded-xl p-1.5" style={{ color: '#f87171' }}><Trash2 size={13} /></button>
        </div>
      ))}
      {tasks.length === 0 && <p className="text-center text-[11px]" style={{ color: 'var(--text-secondary)' }}>تسکی ثبت نشده — مثلاً «هر روز ۰۹:۰۰ گزارش بده»</p>}
    </div>
  )
}

/* ─── حالت پلن ─── */
function PlanTab(): React.JSX.Element {
  const pending = usePlanStore(s => s.pending)
  const approve = usePlanStore(s => s.approve)
  const reject = usePlanStore(s => s.reject)
  const planMode = useSettingsStore(s => s.planMode)
  const setPlanMode = useSettingsStore(s => s.setPlanMode)
  const toast = useToastStore(s => s.push)
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between rounded-2xl p-3 glass">
        <div>
          <div className="text-xs font-medium">حالت پلن (Plan &amp; Approve)</div>
          <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>دستورات خطرناک ابتدا در انتظار تأیید میمانند</div>
        </div>
        <Button onClick={() => setPlanMode(!planMode)} style={planMode ? { color: 'var(--accent)' } : undefined}>{planMode ? 'روشن' : 'خاموش'}</Button>
      </div>
      {pending.map(p => (
        <div key={p.id} className="rounded-2xl p-3 glass">
          <div className="text-xs font-semibold">{p.tool}</div>
          <pre className="mt-1 max-h-28 overflow-auto rounded-lg p-2 text-[10px]" style={{ background: 'rgba(128,128,128,.08)', color: 'var(--text-secondary)' }}>{JSON.stringify(p.args, null, 2)}</pre>
          <div className="mt-2 flex gap-2">
            <Button onClick={() => { void approve(p.id); toast('دستور تأیید و اجرا شد ✓', 'success'); celebrate() }} style={{ color: '#4ade80' }}>تأیید و اجرا</Button>
            <Button onClick={() => { reject(p.id); toast('دستور رد شد', 'info') }} style={{ color: '#f87171' }}>رد</Button>
          </div>
        </div>
      ))}
      {pending.length === 0 && <p className="text-center text-[11px]" style={{ color: 'var(--text-secondary)' }}>گام در انتظاری نیست. وقتی ایجنت بخواهد دستور خطرناک اجرا کند اینجا ظاهر میشود.</p>}
    </div>
  )
}

/* ─── داشبورد سیستم ─── */
function SystemTab(): React.JSX.Element {
  const [info, setInfo] = useState<Record<string, unknown> | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const refresh = useCallback(() => {
    const api = (window as unknown as { atlasAPI?: { invokeTool: (t: string, a: Record<string, unknown>) => Promise<Record<string, unknown>> } }).atlasAPI
    api?.invokeTool('system_info', {}).then(r => setInfo(r)).catch(() => {})
  }, [])
  useEffect(() => { refresh(); timer.current = setInterval(refresh, 3000); return () => { if (timer.current) clearInterval(timer.current) } }, [refresh])
  if (!info) return <p className="text-center text-[11px]" style={{ color: 'var(--text-secondary)' }}>در حال دریافت اطلاعات سیستم… (فقط دسکتاپ)</p>
  const total = Number(info.totalMemMB) || 1
  const free = Number(info.freeMemMB) || 0
  const usedPct = Math.round((1 - free / total) * 100)
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="سیستم" value={String(info.platform)} />
        <Stat label="هسته‌ها" value={String(info.cpus)} />
        <Stat label="نمایشگر" value={String(info.displays)} />
        <Stat label="حافظه کل" value={`${Math.round(total)}MB`} />
      </div>
      <div className="rounded-2xl p-3 glass">
        <div className="mb-1 flex justify-between text-[11px]" style={{ color: 'var(--text-secondary)' }}><span>مصرف حافظه</span><span>{usedPct}%</span></div>
        <div className="h-2 overflow-hidden rounded-full" style={{ background: 'rgba(128,128,128,.15)' }}>
          <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${usedPct}%`, background: 'linear-gradient(90deg,var(--accent),var(--accent2))' }} />
        </div>
      </div>
      <Button onClick={refresh}><RefreshCw size={12} /> بروزرسانی</Button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }): React.JSX.Element {
  const isNum = /^[0-9.]+$/.test(value)
  return (
    <div className="animate-in fade-in zoom-in-95 rounded-2xl p-3 glass duration-500">
      <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{label}</div>
      <div className="mt-0.5 truncate text-sm font-semibold">{isNum ? <AnimatedNumber value={Number(value)} /> : value}</div>
    </div>
  )
}

/* ─── RAG محلی ─── */
function RagTab(): React.JSX.Element {
  const aui = useAui()
  const [docs, setDocs] = useState('')
  const [q, setQ] = useState('')
  const onFiles = (files: FileList | null): void => {
    if (!files) return
    let txt = ''
    Array.from(files).forEach(f => {
      const r = new FileReader()
      r.onload = () => { txt += `\n\n=== ${f.name} ===\n${String(r.result ?? '')}`; setDocs(d => d + txt) }
      r.readAsText(f)
    })
  }
  const ask = (): void => {
    if (!q.trim()) return
    const body = `[مدارک محلی]\n${docs.slice(0, 20000)}\n\nسوال بر اساس مدارک بالا: ${q}`
    aui.thread.append(body)
    setQ('')
  }
  return (
    <div className="grid gap-3">
      <div className="rounded-2xl p-3 glass">
        <p className="mb-2 text-xs font-medium">مدارک محلی (RAG سبک)</p>
        <textarea value={docs} onChange={e => setDocs(e.target.value)} rows={6} placeholder="متن اسناد را اینجا بچسبان یا فایل اضافه کن…" className="w-full resize-none rounded-xl bg-transparent px-3 py-2 text-[11px] outline-none" style={{ background: 'rgba(128,128,128,.08)', color: 'var(--text-primary)' }} />
        <div className="mt-2 flex items-center gap-2">
          <input type="file" multiple hidden id="rag-files" onChange={e => onFiles(e.target.files)} />
          <Button asLabel htmlFor="rag-files">افزودن فایل</Button>
        </div>
      </div>
      <div className="flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="سوال از مدارک…" className="flex-1 rounded-xl bg-transparent px-3 py-2 text-xs outline-none" style={{ background: 'rgba(128,128,128,.08)', color: 'var(--text-primary)' }} />
        <Button onClick={ask}>پرسش</Button>
      </div>
      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>مدارک به‌همراه سوال به چت ارسال میشوند تا مدل پاسخ دهد. نسخهٔ کامل با ایمبدینگ محلی ارتقا مییابد.</p>
    </div>
  )
}

/* ─── مقایسه مدل‌ها (Ensemble) ─── */
function chatCompletion(opts: { baseURL: string; key: string; model: string; prompt: string }): Promise<string> {
  const base = opts.baseURL.replace(/\/+$/, '')
  return proxyFetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(opts.key ? { Authorization: `Bearer ${opts.key}` } : {}) },
    body: JSON.stringify({ model: opts.model, messages: [{ role: 'user', content: opts.prompt }], max_tokens: 600, stream: false }),
  }).then(async r => {
    const j = await r.json().catch(() => ({})) as { choices?: Array<{ message?: { content?: string } }> }
    return j.choices?.[0]?.message?.content ?? '(پاسخی دریافت نشد)'
  })
}

function EnsembleTab(): React.JSX.Element {
  const s = getModelSettings()
  const [prompt, setPrompt] = useState('')
  const [bModel, setBModel] = useState('')
  const [bUrl, setBUrl] = useState('http://localhost:11434/v1')
  const [bKey, setBKey] = useState('')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [busy, setBusy] = useState(false)
  const run = async (): Promise<void> => {
    if (!prompt.trim() || !bModel.trim()) return
    setBusy(true)
    const aBase = s.provider === 'ollama' ? s.ollamaBaseURL : s.apiBaseURL
    const aKey = s.provider === 'anthropic' ? s.anthropicApiKey : s.apiKey
    const aModel = s.provider === 'anthropic' ? s.anthropicModel : s.provider === 'ollama' ? s.ollamaModel : s.apiModel
    try {
      const [ra, rb] = await Promise.all([
        chatCompletion({ baseURL: aBase, key: aKey, model: aModel, prompt }),
        chatCompletion({ baseURL: bUrl, key: bKey, model: bModel, prompt }),
      ])
      setA(ra); setB(rb)
    } finally { setBusy(false) }
  }
  return (
    <div className="grid gap-3">
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={2} placeholder="پرامپت مشترک برای مقایسهٔ دو مدل…" className="w-full resize-none rounded-xl bg-transparent px-3 py-2 text-xs outline-none" style={{ background: 'rgba(128,128,128,.08)', color: 'var(--text-primary)' }} />
      <div className="rounded-2xl p-3 glass">
        <p className="mb-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>مدل دوم (سازگار با OpenAI)</p>
        <input value={bUrl} onChange={e => setBUrl(e.target.value)} placeholder="baseURL" className="mb-1 w-full rounded-lg px-2 py-1 text-[11px]" style={{ background: 'rgba(128,128,128,.08)', color: 'var(--text-primary)' }} />
        <input value={bModel} onChange={e => setBModel(e.target.value)} placeholder="نام مدل" className="mb-1 w-full rounded-lg px-2 py-1 text-[11px]" style={{ background: 'rgba(128,128,128,.08)', color: 'var(--text-primary)' }} />
        <input value={bKey} onChange={e => setBKey(e.target.value)} placeholder="کلید (اختیاری)" className="w-full rounded-lg px-2 py-1 text-[11px]" style={{ background: 'rgba(128,128,128,.08)', color: 'var(--text-primary)' }} />
      </div>
      <Button disabled={busy} onClick={() => void run()}>{busy ? 'در حال مقایسه…' : 'مقایسه'}</Button>
      {(a || b) && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl p-3 glass text-[11px] leading-relaxed"><div className="mb-1 font-semibold" style={{ color: 'var(--accent)' }}>مدل ۱</div>{a}</div>
          <div className="rounded-2xl p-3 glass text-[11px] leading-relaxed"><div className="mb-1 font-semibold" style={{ color: 'var(--accent2)' }}>مدل ۲</div>{b}</div>
        </div>
      )}
    </div>
  )
}

/* ─── جستجوی معنایی (MVP) ─── */
function embed(text: string): Promise<number[] | null> {
  const s = getModelSettings()
  if (s.provider !== 'ollama') return Promise.resolve(null)
  const base = s.ollamaBaseURL.replace(/\/v1$/, '')
  return proxyFetch(`${base}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: s.ollamaModel || 'nomic-embed-text', prompt: text }),
  }).then(r => r.json().then((j: { embedding?: number[] }) => j.embedding ?? null)).catch(() => null)
}
function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)
}
function SemanticTab(): React.JSX.Element {
  const [q, setQ] = useState('')
  const [ranked, setRanked] = useState<Array<{ id: string; title: string; score: number }>>([])
  const [busy, setBusy] = useState(false)
  const run = async (): Promise<void> => {
    if (!q.trim()) return
    setBusy(true)
    const convs = useConversationsStore.getState().conversations
    const texts = convs.map(c => {
      const t = useMessagesStore.getState().threads[c.id]
      return `${c.title}\n${JSON.stringify(t?.repository ?? '').slice(0, 2000)}`
    })
    const qe = await embed(q)
    if (qe) {
      const emb = await Promise.all(texts.map(t => embed(t)))
      const res = convs.map((c, i) => ({ id: c.id, title: c.title, score: emb[i] ? cosine(qe, emb[i]!) : 0 }))
        .sort((x, y) => y.score - x.score).slice(0, 8)
      setRanked(res)
    } else {
      // فال‌بک: رتبه‌بندی بر اساس همپوشانی کلمات
      const qw = q.toLowerCase().split(/\s+/)
      const res = convs.map(c => {
        const text = `${c.title} ${JSON.stringify(useMessagesStore.getState().threads[c.id]?.repository ?? '')}`.toLowerCase()
        const score = qw.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0)
        return { id: c.id, title: c.title, score }
      }).sort((x, y) => y.score - x.score).slice(0, 8)
      setRanked(res)
    }
    setBusy(false)
  }
  return (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="جستجوی معنایی در مکالمه‌ها…" className="flex-1 rounded-xl bg-transparent px-3 py-2 text-xs outline-none" style={{ background: 'rgba(128,128,128,.08)', color: 'var(--text-primary)' }} />
        <Button disabled={busy} onClick={() => void run()}>جستجو</Button>
      </div>
      {ranked.map(r => (
        <div key={r.id} className="flex items-center gap-2 rounded-2xl p-3 glass">
          <div className="min-w-0 flex-1 truncate text-xs">{r.title}</div>
          <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>نمره {r.score.toFixed(2)}</span>
        </div>
      ))}
      {ranked.length === 0 && <p className="text-center text-[11px]" style={{ color: 'var(--text-secondary)' }}>با Ollama و مدل embed (مثل nomic-embed-text) رتبه‌بندی واقعی؛ در غیر این صورت فال‌بک کلماتی.</p>}
    </div>
  )
}

/* ─── بازپخش جلسه ─── */
function ReplayTab(): React.JSX.Element {
  const entries = useActivityStore(s => s.entries)
  const [i, setI] = useState(0)
  const exportJson = (): void => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'atlas-session.json'; a.click()
    URL.revokeObjectURL(url)
  }
  const cur = entries[i]
  return (
    <div className="grid gap-3">
      <Button onClick={exportJson}><Download size={12} /> خروجی جلسه (JSON)</Button>
      {entries.length === 0 && <p className="text-center text-[11px]" style={{ color: 'var(--text-secondary)' }}>فعالیتی برای بازپخش ثبت نشده.</p>}
      {cur && (
        <div className="rounded-2xl p-3 glass">
          <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            <span>{i + 1} / {entries.length}</span>
            <span>{new Date(cur.ts).toLocaleTimeString('fa-IR')}</span>
          </div>
          <div className="mt-1 text-sm font-semibold">{cur.tool}{cur.pending ? ' (در انتظار)' : ''}</div>
          <pre className="mt-1 max-h-40 overflow-auto rounded-lg p-2 text-[10px]" style={{ background: 'rgba(128,128,128,.08)', color: 'var(--text-secondary)' }}>{JSON.stringify(cur.args ?? cur.result ?? cur.error ?? {}, null, 2)}</pre>
          <div className="mt-2 flex gap-2">
            <Button disabled={i === 0} onClick={() => setI(i - 1)}>قبلی</Button>
            <Button disabled={i === entries.length - 1} onClick={() => setI(i + 1)}>بعدی</Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── همگام‌سازی ابری (export/import) ─── */
function SyncTab(): React.JSX.Element {
  const toast = useToastStore(s => s.push)
  const exportAll = (): void => {
    const payload = {
      version: 1,
      settings: useSettingsStore.getState(),
      conversations: useConversationsStore.getState(),
      messages: useMessagesStore.getState(),
      macros: useMacrosStore.getState(),
      schedule: useScheduleStore.getState(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'atlas-backup.json'; a.click()
    URL.revokeObjectURL(url)
    toast('پشتیبان خروجی گرفته شد ✓', 'success'); celebrate()
  }
  const importAll = (file: File): void => {
    const r = new FileReader()
    r.onload = () => {
      try {
        const d = JSON.parse(String(r.result ?? ''))
        if (d.settings) useSettingsStore.setState(d.settings)
        if (d.conversations) useConversationsStore.setState(d.conversations)
        if (d.messages) useMessagesStore.setState(d.messages)
        if (d.macros) useMacrosStore.setState(d.macros)
        if (d.schedule) useScheduleStore.setState(d.schedule)
        toast('بازیابی انجام شد ✓', 'success')
      } catch { toast('فایل پشتیبان نامعتبر', 'error') }
    }
    r.readAsText(file)
  }
  return (
    <div className="grid gap-3">
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>پشتیبان‌گیری رمزنگذاری‌شدهٔ محلی (export/import). همگام‌سازی ابری واقعی در نسخهٔ بعدی.</p>
      <Button onClick={exportAll}><Download size={12} /> خروجی گرفتن (backup)</Button>
      <div>
        <input type="file" accept="application/json" hidden id="sync-in" onChange={e => { const f = e.target.files?.[0]; if (f) importAll(f) }} />
        <Button asLabel htmlFor="sync-in"><Upload size={12} /> وارد کردن (restore)</Button>
      </div>
    </div>
  )
}

/* دکمهٔ مشترک (با امکان label برای input مخفی) */
function Button({ children, onClick, asLabel, htmlFor, disabled, style }: {
  children: React.ReactNode; onClick?: () => void; asLabel?: boolean; htmlFor?: string; disabled?: boolean; style?: React.CSSProperties
}): React.JSX.Element {
  if (asLabel) return <label htmlFor={htmlFor} className="glass glass-hover inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px]" style={style}>{children}</label>
  return <button onClick={onClick} disabled={disabled} className="glass glass-hover inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] disabled:opacity-40" style={style}>{children}</button>
}
