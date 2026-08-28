/**
 * Welcome — صفحهٔ خوشآمد وصل به runtime
 * گوی با افکت فکر کردن + ارسال واقعی پیام
 */
import { useState, useRef } from 'react'
import { useAui, useAuiState } from '@assistant-ui/react'
import { ThinkingOrb } from '@/components/ThinkingOrb'
import { ThemeGallery } from '@/components/ThemeGallery'
import { useUiStore } from '@/stores/uiStore'
import { Sparkles, Mic, Paperclip, Globe, Code2, SendHorizontalIcon, X, FileText } from 'lucide-react'

const SUGGESTIONS = [
  { icon: '📊', text: 'وضعیت سیستمم رو تحلیل کن' },
  { icon: '🗂️', text: 'فایلهای بزرگ رو پیدا کن' },
  { icon: '📸', text: 'از صفحه عکس بگیر و خلاصه کن' },
  { icon: '💾', text: 'یه اسکریپت بکاپ بنویس' }
]

export function Welcome(): React.JSX.Element {
  const aui = useAui()
  const isRunning = useAuiState(s => s.thread.isRunning)
  const [text, setText] = useState('')
  const [hint, setHint] = useState('')
  const [attachments, setAttachments] = useState<{ name: string; content: string; mime?: string }[]>([])
  const [listening, setListening] = useState(false)
  const [listenAlways, setListenAlways] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const recRef = useRef<unknown>(null)
  const openBrowser = useUiStore((s) => s.openBrowser)
  const openTerminal = useUiStore((s) => s.openTerminal)

  const send = (value: string): void => {
    const v = value.trim()
    let body = ''
    if (attachments.length) {
      body += attachments
        .map((a) => `[پیوست فایل: ${a.name}${a.mime ? ` (${a.mime})` : ''}]\n${a.content}`)
        .join('\n\n') + '\n\n'
    }
    if (v) body += v
    if (!body.trim()) return
    aui.thread.append(body)
    setText('')
    setAttachments([])
  }

  const onPick = (files: FileList | null): void => {
    if (!files) return
    Array.from(files).forEach((f) => {
      const r = new FileReader()
      // خواندن به‌صورت data URL (base64) تا فایلهای باینری مثل تصویر/PDF خراب نشوند
      r.onload = () =>
        setAttachments((a) => [...a, { name: f.name, mime: f.type || undefined, content: String(r.result ?? '') }])
      r.readAsDataURL(f)
    })
  }

  const startVoice = (): void => {
    const SR = (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition
    if (!SR) {
      setHint('مرورگرت از ورودی صوتی پشتیبانی نمی‌کند')
      return
    }
    const rec = new SR() as { lang: string; interimResults: boolean; onresult: (e: unknown) => void; onend: () => void; start: () => void }
    rec.lang = 'fa-IR'
    rec.interimResults = true
    rec.onresult = (e: unknown) => {
      const res = (e as { results: Array<Array<{ transcript: string }>> }).results
      let t = ''
      for (let i = 0; i < res.length; i++) t += res[i][0].transcript
      setText(t)
    }
    rec.onend = () => setListening(false)
    recRef.current = rec
    setListening(true)
    rec.start()
  }

  /** دستیار صوتی همیشه‌روشن: با گفتن «اطلس» دستور بعدی اجرا میشود */
  const toggleAlways = (): void => {
    const SR = (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition
    if (!SR) {
      setHint('ورودی صوتی در این مرورگر پشتیبانی نمیشود')
      return
    }
    if (listenAlways) {
      setListenAlways(false)
      try { (recRef.current as { stop?: () => void } | null)?.stop?.() } catch { /* ignore */ }
      return
    }
    const rec = new SR() as { lang: string; interimResults: boolean; continuous: boolean; onresult: (e: unknown) => void; onend: () => void; start: () => void }
    rec.lang = 'fa-IR'
    rec.interimResults = true
    rec.continuous = true
    rec.onresult = (e: unknown) => {
      const res = (e as { results: Array<Array<{ transcript: string }>> }).results
      let t = ''
      for (let i = 0; i < res.length; i++) t += res[i][0].transcript
      setText(t)
      const m = t.match(/(?:اطلس|atlas)\s+(.*)$/i)
      if (m && m[1].trim()) {
        send(m[1].trim())
        setText('')
      }
    }
    rec.onend = () => { if (listenAlways) try { rec.start() } catch { /* ignore */ } }
    recRef.current = rec
    setListenAlways(true)
    rec.start()
  }

  return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-6 pb-4">
      {/* گوی با افکت فکر کردن */}
      <div className="rise-in">
        <ThinkingOrb size={145} isThinking={isRunning} />
      </div>

      {/* سلام */}
      <div className="rise-in stagger-1 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {isRunning ? 'دارم فکر میکنم...' : 'چطور میتونم کمک کنم؟'}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {isRunning ? 'لحظهای صبر کن ✨' : 'من Atlas هستم — به هر مدلی وصل میشم، سیستم تو رو میفهمم'}
        </p>
      </div>

      {/* کادر نوشتن — وصل به runtime */}
      <div className="rise-in stagger-2 w-full max-w-xl">
        <div className="glass glass-accent-ring rounded-[1.6rem] p-2">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2 pb-2">
              {attachments.map((a, i) => (
                <span key={i} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] glass" style={{ color: 'var(--text-secondary)' }}>
                  <FileText size={12} /> {a.name}
                  <button onClick={() => setAttachments((arr) => arr.filter((_, j) => j !== i))} className="rounded-full p-0.5 hover:bg-white/10"><X size={11} /></button>
                </span>
              ))}
            </div>
          )}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(text)
              }
            }}
            placeholder={isRunning ? 'دارم جواب می‌دهم...' : 'از Atlas بپرس...'}
            autoFocus
            disabled={isRunning}
            className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:opacity-50 disabled:opacity-50"
            style={{ color: 'var(--text-primary)' }}
          />
          <input ref={fileRef} type="file" multiple hidden onChange={(e) => onPick(e.target.files)} />
          <div className="flex items-center gap-1 px-1 pb-1">
            <button onClick={() => fileRef.current?.click()} className="rounded-xl p-2 transition-all hover:scale-110" style={{ color: 'var(--text-secondary)' }} title="پیوست فایل"><Paperclip size={16} /></button>
            <button onClick={() => openBrowser(text ? `https://duckduckgo.com/html/?q=${encodeURIComponent(text)}` : undefined)} className="rounded-xl p-2 transition-all hover:scale-110" style={{ color: 'var(--text-secondary)' }} title="جستجوی وب"><Globe size={16} /></button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('atlas:open-skills'))} className="rounded-xl p-2 transition-all hover:scale-110" style={{ color: 'var(--text-secondary)' }} title="فروشگاه مهارتها"><Sparkles size={16} /></button>
            <button onClick={() => openTerminal()} className="rounded-xl p-2 transition-all hover:scale-110" style={{ color: 'var(--text-secondary)' }} title="اجرای کد / ترمینال"><Code2 size={16} /></button>
            <button onClick={toggleAlways} className={`rounded-xl p-2 transition-all hover:scale-110 ${listenAlways ? 'animate-pulse' : ''}`} style={{ color: listenAlways ? 'var(--accent)' : 'var(--text-secondary)' }} title="دستیار صوتی همیشه‌روشن (بگو: اطلس ...)">🎧</button>
            {text.trim() ? (
              <button onClick={() => send(text)} className="mr-auto flex h-9 w-9 items-center justify-center rounded-full text-white transition-all hover:scale-110" style={{ background: 'var(--accent)' }} title="ارسال (Enter)"><SendHorizontalIcon size={16} /></button>
            ) : (
              <button onClick={startVoice} className={`mr-auto flex h-9 w-9 items-center justify-center rounded-full text-white transition-all hover:scale-105 ${listening ? 'animate-pulse' : ''}`} style={{ background: listening ? '#ef4444' : 'var(--accent)' }} title="ورودی صوتی"><Mic size={16} /></button>
            )}
          </div>
          {hint && (
            <p className="mt-1.5 px-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              💡 {hint}
            </p>
          )}
        </div>

        {/* چیپهای پیشنهاد — ارسال واقعی */}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={s.text}
              onClick={() => send(s.text)}
              disabled={isRunning}
              className={`glass glass-hover rise-in stagger-${Math.min(i + 3, 6)} rounded-full px-3.5 py-1.5 text-xs disabled:opacity-40`}
            >
              {s.icon} {s.text}
            </button>
          ))}
        </div>
      </div>

      {/* گالری تمها */}
      <div className="rise-in stagger-5 w-full max-w-xl">
        <p className="mb-2 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
          🎨 دنیای خودت رو انتخاب کن
        </p>
        <ThemeGallery />
      </div>
    </div>
  )
}
