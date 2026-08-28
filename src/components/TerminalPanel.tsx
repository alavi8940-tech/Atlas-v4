import { useEffect, useRef, useState } from 'react'
import { Terminal as TermIcon, SendHorizontalIcon } from 'lucide-react'

interface Line {
  kind: 'in' | 'out' | 'err' | 'sys'
  text: string
}

const COLOR: Record<Line['kind'], string> = {
  in: 'var(--accent)',
  out: 'var(--text-primary)',
  err: '#f87171',
  sys: 'var(--text-secondary)',
}

export function TerminalPanel(): React.JSX.Element {
  const isElectron = typeof window !== 'undefined' && Boolean((window as unknown as { atlasAPI?: unknown }).atlasAPI)
  const [lines, setLines] = useState<Line[]>([
    { kind: 'sys', text: isElectron ? 'ترمینال محلی آماده است — دستورت را بنویس:' : 'ترمینال فقط در نسخهٔ دسکتاپ در دسترس است.' },
  ])
  const [cmd, setCmd] = useState('')
  const [busy, setBusy] = useState(false)
  const outRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight })
  }, [lines])

  const run = async (): Promise<void> => {
    const c = cmd.trim()
    if (!c || busy) return
    setLines((l) => [...l, { kind: 'in', text: `$ ${c}` }])
    setCmd('')
    setBusy(true)
    if (!isElectron) {
      setLines((l) => [...l, { kind: 'err', text: 'ناموجود در نسخهٔ مرورگر' }])
      setBusy(false)
      return
    }
    try {
      const api = (window as unknown as { atlasAPI: { invokeTool: (t: string, a: Record<string, unknown>) => Promise<{ stdout?: string; stderr?: string }> } }).atlasAPI
      const res = await api.invokeTool('shell_exec', { command: c })
      const out = `${res.stdout ?? ''}${res.stderr ? `\n${res.stderr}` : ''}`.trim()
      setLines((l) => [...l, { kind: 'out', text: out || '(بدون خروجی)' }])
    } catch (e) {
      setLines((l) => [...l, { kind: 'err', text: String((e as { message?: string })?.message ?? e) }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col" dir="ltr">
      <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass)' }}>
        <TermIcon size={15} style={{ color: 'var(--accent)' }} />
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>ترمینال — Atlas</span>
      </div>
      <div ref={outRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-2 font-mono text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)', background: 'rgba(0,0,0,.25)' }}>
        {lines.map((ln, i) => (
          <pre key={i} className="whitespace-pre-wrap break-words" style={{ color: COLOR[ln.kind], margin: 0 }}>{ln.text}</pre>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t p-2" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass)' }}>
        <span className="font-mono text-sm" style={{ color: 'var(--accent)' }}>$</span>
        <input
          value={cmd}
          disabled={!isElectron || busy}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void run() }}
          placeholder={isElectron ? 'دستور...' : 'نسخهٔ دسکتاپ'}
          dir="ltr"
          className="min-w-0 flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm outline-none disabled:opacity-50"
          style={{ color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
        />
        <button onClick={() => void run()} disabled={!isElectron || busy} className="glass glass-hover flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm" style={{ color: 'var(--accent)' }} title="اجرا (Enter)">
          <SendHorizontalIcon size={15} />
        </button>
      </div>
    </div>
  )
}
