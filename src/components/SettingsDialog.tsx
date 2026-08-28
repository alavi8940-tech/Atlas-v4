/**
 * SettingsDialog — پنجرهٔ تنظیمات Atlas (فاز ۲ — بازطراحی بزرگ)
 * تغییرات نسبت به فاز ۱: حذف دما/حداکثر توکن/تایپ دستی نام مدل/حالت نمایش،
 * افزودن پروتکل Anthropic، فچ لیست مدلها از API با Dropdown شادکن.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { useSettingsStore, engineLabel, activeModelName } from '@/stores/settingsStore'
import type { ProviderKind } from '@/stores/settingsStore'
import {
  fetchModelCatalog, MODEL_KIND_META, proxyFetch, withTimeout,
  type CatalogModel, type Protocol
} from '@/lib/modelCatalog'
import { PlugZap, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'

const PROVIDERS: Array<{ id: ProviderKind; name: string; desc: string }> = [
  { id: 'ollama', name: 'Ollama (محلی)', desc: 'مدل روی دستگاه خودت — کاملاً خصوصی' },
  { id: 'openai', name: 'API سازگار OpenAI', desc: 'LM Studio ، LiteLLM آرسنال ، vLLM و ...' },
  { id: 'anthropic', name: 'Anthropic', desc: 'API رسمی Claude — ابری' }
]

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1'

type TestState = { status: 'idle' | 'testing' | 'ok' | 'fail'; message?: string }

/** تست واقعی اتصال بر اساس پروتکل انتخابی (بدون fallback گمراه‌کننده) */
async function testConnection(
  protocol: Protocol,
  baseURL: string,
  apiKey: string,
  model: string
): Promise<TestState> {
  try {
    const t0 = Date.now()
    const base = baseURL.replace(/\/+$/, '')

    const headers: Record<string, string> =
      protocol === 'anthropic'
        ? {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          }
        : {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
          }

    // آنتراپیک مسیر متفاوتی دارد؛ بقیه /chat/completions
    const url = protocol === 'anthropic' ? `${base}/messages` : `${base}/chat/completions`
    const body = JSON.stringify(
      protocol === 'anthropic'
        ? { model, max_tokens: 5, messages: [{ role: 'user', content: 'ping' }] }
        : { model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 5, stream: false }
    )

    const res = await proxyFetch(url, { method: 'POST', headers, body, signal: withTimeout(8000) })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { status: 'fail', message: `HTTP ${res.status} — ${text.slice(0, 140)}` }
    }
    const json: unknown = await res.json()
    const okShape =
      typeof json === 'object' && json !== null &&
      ('choices' in json || ('content' in json && 'role' in json))
    if (!okShape) {
      return { status: 'fail', message: 'پاسخ غیرمنتظره — این endpoint چت نیست' }
    }
    return { status: 'ok', message: `متصل ✓ (${Date.now() - t0}ms)` }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { status: 'fail', message: msg.slice(0, 160) }
  }
}

/* ─── فیلد انتخاب مدل با فچ از API ─── */

function ModelField(props: {
  protocol: Protocol
  value: string
  onChange: (id: string) => void
  /** پارامترهای اتصال برای فچ کاتالوگ */
  conn: { baseURL: string; apiKey?: string; ollamaBaseURL?: string }
}): React.JSX.Element {
  const { protocol, value, onChange, conn } = props
  const [models, setModels] = useState<CatalogModel[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [loadedOnce, setLoadedOnce] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const list = await fetchModelCatalog(protocol, conn)
      setModels(list)
      if (list.length === 0) setErr('هیچ مدلی گزارش نشد — سرور را بررسی کن')
    } catch (e) {
      setErr(e instanceof Error ? e.message.slice(0, 120) : 'خطا در گرفتن لیست مدلها')
    } finally {
      setLoading(false)
      setLoadedOnce(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocol, conn.baseURL, conn.apiKey, conn.ollamaBaseURL])

  // اولین ورود به پنل → فچ خودکار؛ بعدش فقط با دکمهٔ رفرش
  useEffect(() => {
    if (!loadedOnce) void load()
  }, [loadedOnce, load])

  // اگر مقدار فعلی در لیست نیست (مثلاً قبل از فچ)، موقتاً به لیست اضافه کن تا نمایش نپرد
  const items = useMemo(() => {
    if (value && !models.some(m => m.id === value)) {
      return [{ id: value }, ...models]
    }
    return models
  }, [models, value])

  return (
    <div className="grid gap-1">
      <div className="flex items-center gap-1.5">
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger size="sm" dir="ltr"
            className="flex-1 rounded-xl border-none font-mono text-xs"
            style={{ background: 'rgba(128,128,128,0.08)', color: 'var(--text-primary)' }}>
            <SelectValue placeholder={loading ? 'در حال گرفتن مدلها...' : 'مدل را انتخاب کن'} />
          </SelectTrigger>
          <SelectContent>
            {items.map(m => (
              <SelectItem key={m.id} value={m.id} dir="ltr" className="font-mono text-xs">
                {m.kind ? `${MODEL_KIND_META[m.kind].icon}  ${m.id}` : m.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => void load()} disabled={loading}
          title="گرفتن مجدد لیست مدلها"
          className="size-8 shrink-0 rounded-xl">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
        </Button>
      </div>
      {err && (
        <p className="px-1 text-[10px] leading-relaxed text-red-400">{err}</p>
      )}
    </div>
  )
}

/* ─── دیالوگ اصلی ─── */

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const s = useSettingsStore()
  const [test, setTest] = useState<TestState>({ status: 'idle' })
  const [confirmDangerous, setConfirmDangerous] = useState(true)
  const toggleConfirm = (): void => {
    const next = !confirmDangerous
    setConfirmDangerous(next)
    window.atlasAPI?.setConfirm?.(next)
  }

  const activeBase =
    s.provider === 'ollama' ? s.ollamaBaseURL :
    s.provider === 'anthropic' ? ANTHROPIC_BASE : s.apiBaseURL
  const activeKey =
    s.provider === 'anthropic' ? s.anthropicApiKey :
    s.provider === 'openai' ? s.apiKey : ''
  const activeModel = activeModelName(s)

  const conn = useMemo(() => ({
    baseURL: s.provider === 'ollama' ? '' : s.provider === 'anthropic' ? ANTHROPIC_BASE : s.apiBaseURL,
    apiKey: s.provider === 'anthropic' ? s.anthropicApiKey : s.provider === 'openai' ? s.apiKey : '',
    ollamaBaseURL: s.provider === 'ollama' ? s.ollamaBaseURL : ''
  }), [s.provider, s.apiBaseURL, s.apiKey, s.anthropicApiKey, s.ollamaBaseURL])

  const runTest = (): void => {
    if (!activeModel.trim()) {
      setTest({ status: 'fail', message: 'اول یک مدل انتخاب کن' })
      return
    }
    setTest({ status: 'testing' })
    void testConnection(s.provider, activeBase, activeKey, activeModel).then(setTest)
  }

  const inputCls = 'rounded-xl bg-transparent px-3 py-2 font-mono text-xs outline-none'
  const inputStyle = { color: 'var(--text-primary)', background: 'rgba(128,128,128,0.08)' }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong beam-border max-h-[86vh] overflow-y-auto rounded-[1.4rem] sm:max-w-lg" style={{ background: 'var(--bg-base)' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">⚙️ تنظیمات Atlas</DialogTitle>
          <DialogDescription className="text-right">
            موتور فعلی: <strong style={{ color: 'var(--accent)' }}>{engineLabel(s.provider, activeModel)}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* ─── انتخاب پروایدر ─── */}
        <div className="grid gap-2">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => { s.setModel({ provider: p.id }); setTest({ status: 'idle' }) }}
              data-active={s.provider === p.id}
              className="theme-card flex flex-row items-center gap-3 rounded-2xl p-3 text-right"
              style={{
                border: s.provider === p.id
                  ? '1px solid color-mix(in srgb, var(--accent) 55%, transparent)'
                  : '1px solid var(--glass-border)',
                background: s.provider === p.id ? 'var(--accent-soft)' : 'var(--glass-bg)',
                aspectRatio: 'auto',
                height: 'auto'
              }}
            >
              <span className="text-sm font-semibold">{p.name}</span>
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{p.desc}</span>
            </button>
          ))}
        </div>

        {/* ─── Ollama ─── */}
        {s.provider === 'ollama' && (
          <div className="grid gap-2 rounded-2xl p-3 glass">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>آدرس سرور</label>
            <input dir="ltr" value={s.ollamaBaseURL}
              onChange={e => s.setModel({ ollamaBaseURL: e.target.value })}
              className={inputCls} style={inputStyle}
              placeholder="http://localhost:11434/v1" />
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>مدل</label>
            <ModelField protocol="ollama" value={s.ollamaModel}
              onChange={id => s.setModel({ ollamaModel: id })}
              conn={conn} />
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              💡 اجرای سرور محلی: <code dir="ltr">ollama serve</code> — لیست مدلها از همین دکمهٔ ↻ گرفته میشود
            </p>
          </div>
        )}

        {/* ─── API سازگار OpenAI ─── */}
        {s.provider === 'openai' && (
          <div className="grid gap-2 rounded-2xl p-3 glass">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>آدرس پایه</label>
            <input dir="ltr" value={s.apiBaseURL}
              onChange={e => s.setModel({ apiBaseURL: e.target.value })}
              className={inputCls} style={inputStyle}
              placeholder="https://api.openai.com/v1" />
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>کلید API</label>
            <input dir="ltr" type="password" value={s.apiKey}
              onChange={e => s.setModel({ apiKey: e.target.value })}
              className={inputCls} style={inputStyle}
              placeholder="sk-..." />
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>مدل</label>
            <ModelField protocol="openai" value={s.apiModel}
              onChange={id => s.setModel({ apiModel: id })}
              conn={conn} />
          </div>
        )}

        {/* ─── Anthropic ─── */}
        {s.provider === 'anthropic' && (
          <div className="grid gap-2 rounded-2xl p-3 glass">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>کلید API</label>
            <input dir="ltr" type="password" value={s.anthropicApiKey}
              onChange={e => s.setModel({ anthropicApiKey: e.target.value })}
              className={inputCls} style={inputStyle}
              placeholder="sk-ant-..." />
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>مدل</label>
            <ModelField protocol="anthropic" value={s.anthropicModel}
              onChange={id => s.setModel({ anthropicModel: id })}
              conn={conn} />
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
               💡 کلید را از console.anthropic.com بگیر — روی نسخهٔ دسکتاپ درخواستها از پروسهٔ اصلی عبور میکنند (کلید در مرورگر دیده نمیشود)
             </p>
          </div>
        )}

        {/* ─── پرامپت سیستم ─── */}
        <div className="grid gap-2 rounded-2xl p-3 glass">
          <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>پرامپت سیستم</label>
          <textarea rows={3} value={s.systemPrompt} maxLength={8000}
            onChange={e => s.setModel({ systemPrompt: e.target.value })}
            className="w-full resize-none rounded-xl bg-transparent px-3 py-2 text-xs leading-relaxed outline-none"
            style={inputStyle} />
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            این پرامپت به پرامپت پایهٔ قفل Atlas زنجیر میشود.
          </p>
        </div>

        {/* ─── حالت عامل (Agent) ─── */}
        <div className="flex items-center justify-between gap-3 rounded-2xl p-3 glass">
          <div className="grid gap-0.5">
            <span className="text-sm font-medium">حالت عامل (Agent)</span>
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              دسترسی ابزارهای سیستمی: شل، فایل، موس، کیبورد، صفحه‌نمایش، حافظه. فقط در نسخهٔ دسکتاپ.
            </span>
          </div>
          <button
            role="switch"
            aria-checked={s.agentEnabled}
            onClick={() => s.setAgentEnabled(!s.agentEnabled)}
            className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
            style={{ background: s.agentEnabled ? 'var(--accent)' : 'rgba(128,128,128,0.3)' }}
            title="حالت عامل"
          >
            <span
              className="absolute top-0.5 size-5 rounded-full bg-white transition-all duration-200"
              style={{ insetInlineStart: s.agentEnabled ? '22px' : '2px' }}
            />
          </button>
        </div>

        {/* ─── تأیید دستورات خطرناک ─── */}
        <div className="flex items-center justify-between gap-3 rounded-2xl p-3 glass">
          <div className="grid gap-0.5">
            <span className="text-sm font-medium">تأیید دستورات خطرناک</span>
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              پیش از اجرای شل یا کشتن فرآیند، دیالوگ تأیید نشان داده شود. فقط در نسخهٔ دسکتاپ.
            </span>
          </div>
          <button
            role="switch"
            aria-checked={confirmDangerous}
            onClick={toggleConfirm}
            className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
            style={{ background: confirmDangerous ? 'var(--accent)' : 'rgba(128,128,128,0.3)' }}
            title="تأیید دستورات خطرناک"
          >
            <span
              className="absolute top-0.5 size-5 rounded-full bg-white transition-all duration-200"
              style={{ insetInlineStart: confirmDangerous ? '22px' : '2px' }}
            />
          </button>
        </div>

        {/* ─── حالت پلن ─── */}
        <div className="flex items-center justify-between gap-3 rounded-2xl p-3 glass">
          <div className="grid gap-0.5">
            <span className="text-sm font-medium">حالت پلن (Plan &amp; Approve)</span>
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              دستورات خطرناک ابتدا در انتظار تأیید میمانند — فقط دسکتاپ.
            </span>
          </div>
          <button
            role="switch"
            aria-checked={s.planMode}
            onClick={() => s.setPlanMode(!s.planMode)}
            className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
            style={{ background: s.planMode ? 'var(--accent)' : 'rgba(128,128,128,0.3)' }}
            title="حالت پلن"
          >
            <span className="absolute top-0.5 size-5 rounded-full bg-white transition-all duration-200" style={{ insetInlineStart: s.planMode ? '22px' : '2px' }} />
          </button>
        </div>

        {/* ─── حریم خصوصی ─── */}
        <div className="flex items-center justify-between gap-3 rounded-2xl p-3 glass">
          <div className="grid gap-0.5">
            <span className="text-sm font-medium">حالت حریم خصوصی</span>
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              فعالیت ابزارهای عامل ثبت نشود (پنل فعالیت خالی میماند).
            </span>
          </div>
          <button
            role="switch"
            aria-checked={s.privacyMode}
            onClick={() => s.setPrivacyMode(!s.privacyMode)}
            className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
            style={{ background: s.privacyMode ? 'var(--accent)' : 'rgba(128,128,128,0.3)' }}
            title="حریم خصوصی"
          >
            <span className="absolute top-0.5 size-5 rounded-full bg-white transition-all duration-200" style={{ insetInlineStart: s.privacyMode ? '22px' : '2px' }} />
          </button>
        </div>

        {/* ─── نتیجهٔ تست ─── */}
        {test.status !== 'idle' && test.status !== 'testing' && (
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
            test.status === 'ok' ? 'text-green-400' : 'text-red-400'}`}
            style={{ background: 'rgba(128,128,128,0.08)' }}>
            {test.status === 'ok' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            <span>{test.message}</span>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" size="sm" onClick={runTest} disabled={test.status === 'testing'}
            className="gap-1.5 rounded-xl text-xs">
            {test.status === 'testing' ? <Loader2 size={13} className="animate-spin" /> : <PlugZap size={13} />}
            {test.status === 'testing' ? 'در حال تست...' : 'تست اتصال'}
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs text-white" style={{ background: 'var(--accent)' }}>
            ذخیره و بستن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
