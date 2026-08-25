/**
 * SettingsDialog — پنجرهٔ تنظیمات Atlas (فاز ۱)
 * تب مدلها: انتخاب پروایدر، تنظیم اتصال، تست اتصال واقعی
 */
import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useSettingsStore, engineLabel } from '@/stores/settingsStore'
import type { ProviderKind } from '@/stores/settingsStore'
import { PlugZap, Loader2, CheckCircle2, XCircle } from 'lucide-react'

const PROVIDERS: Array<{ id: ProviderKind; name: string; desc: string }> = [
  { id: 'demo', name: 'حالت نمایش 🧭', desc: 'پاسخهای نمونهٔ ضبطشده — بدون مدل' },
  { id: 'ollama', name: 'Ollama (محلی)', desc: 'مدل روی دستگاه خودت — کاملاً خصوصی' },
  { id: 'openai', name: 'API سازگار OpenAI', desc: 'LM Studio ، LiteLLM آرسنال ، vLLM و ...' }
]

type TestState = { status: 'idle' | 'testing' | 'ok' | 'fail'; message?: string }

let t0 = 0

/** تست واقعی اتصال: درخواست چت کوچک به endpoint سازگار OpenAI */
async function testConnection(baseURL: string, apiKey: string, model: string): Promise<TestState> {
  try {
    const res = await fetch(`${baseURL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
        stream: false
      }),
      signal: AbortSignal.timeout(8000)
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { status: 'fail', message: `HTTP ${res.status} — ${body.slice(0, 140)}` }
    }
    const json: unknown = await res.json()
    if (typeof json !== 'object' || json === null || !('choices' in json)) {
      return { status: 'fail', message: 'پاسخ غیرمنتظره — این endpoint چت نیست' }
    }
    const latency = Date.now() - t0
    return { status: 'ok', message: `متصل ✓ (${latency}ms)` }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { status: 'fail', message: msg.slice(0, 160) }
  }
}

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }): React.JSX.Element {
  const s = useSettingsStore()
  const [test, setTest] = useState<TestState>({ status: 'idle' })

  const activeBase = s.provider === 'ollama' ? s.ollamaBaseURL : s.apiBaseURL
  const activeModel = s.provider === 'ollama' ? s.ollamaModel : s.apiModel
  const activeKey = s.provider === 'openai' ? s.apiKey : ''

  const runTest = (): void => {
    setTest({ status: 'testing' })
    t0 = Date.now()
    void testConnection(activeBase, activeKey, activeModel).then(setTest)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-h-[86vh] overflow-y-auto rounded-[1.4rem] sm:max-w-lg" style={{ background: 'var(--bg-base)' }}>
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
              className="rounded-xl bg-transparent px-3 py-2 font-mono text-xs outline-none"
              placeholder="http://localhost:11434/v1"
              style={{ color: 'var(--text-primary)', background: 'rgba(128,128,128,0.08)' }} />
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>نام مدل</label>
            <input dir="ltr" value={s.ollamaModel}
              onChange={e => s.setModel({ ollamaModel: e.target.value })}
              className="rounded-xl bg-transparent px-3 py-2 font-mono text-xs outline-none"
              placeholder="qwen3:8b"
              style={{ color: 'var(--text-primary)', background: 'rgba(128,128,128,0.08)' }} />
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              💡 اجرای مدل: <code dir="ltr">ollama pull {s.ollamaModel}</code>
            </p>
          </div>
        )}

        {/* ─── API سازگار OpenAI ─── */}
        {s.provider === 'openai' && (
          <div className="grid gap-2 rounded-2xl p-3 glass">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>آدرس پایه</label>
            <input dir="ltr" value={s.apiBaseURL}
              onChange={e => s.setModel({ apiBaseURL: e.target.value })}
              className="rounded-xl bg-transparent px-3 py-2 font-mono text-xs outline-none"
              placeholder="https://api.openai.com/v1"
              style={{ color: 'var(--text-primary)', background: 'rgba(128,128,128,0.08)' }} />
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>کلید API</label>
            <input dir="ltr" type="password" value={s.apiKey}
              onChange={e => s.setModel({ apiKey: e.target.value })}
              className="rounded-xl bg-transparent px-3 py-2 font-mono text-xs outline-none"
              placeholder="sk-..."
              style={{ color: 'var(--text-primary)', background: 'rgba(128,128,128,0.08)' }} />
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>نام مدل</label>
            <input dir="ltr" value={s.apiModel}
              onChange={e => s.setModel({ apiModel: e.target.value })}
              className="rounded-xl bg-transparent px-3 py-2 font-mono text-xs outline-none"
              placeholder="gpt-4o-mini"
              style={{ color: 'var(--text-primary)', background: 'rgba(128,128,128,0.08)' }} />
          </div>
        )}

        {/* ─── پارامترها ─── */}
        {(s.provider !== 'demo') && (
          <div className="grid gap-3 rounded-2xl p-3 glass">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>دما</span>
                <span className="font-mono">{s.temperature.toFixed(1)}</span>
              </div>
              <input type="range" min={0} max={2} step={0.1} value={s.temperature}
                onChange={e => s.setModel({ temperature: Number(e.target.value) })}
                className="w-full accent-current" style={{ accentColor: 'var(--accent)' }} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>حداکثر توکن</span>
                <span className="font-mono">{s.maxTokens}</span>
              </div>
              <input type="range" min={256} max={8192} step={256} value={s.maxTokens}
                onChange={e => s.setModel({ maxTokens: Number(e.target.value) })}
                className="w-full" style={{ accentColor: 'var(--accent)' }} />
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: 'var(--text-secondary)' }}>پرامپت سیستم</label>
              <textarea rows={3} value={s.systemPrompt}
                onChange={e => s.setModel({ systemPrompt: e.target.value })}
                className="w-full resize-none rounded-xl bg-transparent px-3 py-2 text-xs leading-relaxed outline-none"
                style={{ color: 'var(--text-primary)', background: 'rgba(128,128,128,0.08)' }} />
            </div>
          </div>
        )}

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
          {s.provider !== 'demo' && (
            <Button variant="outline" size="sm" onClick={runTest} disabled={test.status === 'testing'}
              className="gap-1.5 rounded-xl text-xs">
              {test.status === 'testing' ? <Loader2 size={13} className="animate-spin" /> : <PlugZap size={13} />}
              {test.status === 'testing' ? 'در حال تست...' : 'تست اتصال'}
            </Button>
          )}
          <Button size="sm" onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs text-white" style={{ background: 'var(--accent)' }}>
            ذخیره و بستن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
