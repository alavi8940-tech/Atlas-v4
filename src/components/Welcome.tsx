/**
 * Welcome — صفحهٔ خوشآمد وصل به runtime
 * گوی با افکت فکر کردن + ارسال واقعی پیام
 */
import { useState } from 'react'
import { useAui, useAuiState } from '@assistant-ui/react'
import { ThinkingOrb } from '@/components/ThinkingOrb'
import { ThemeGallery } from '@/components/ThemeGallery'
import { Sparkles, Mic, Paperclip, Globe, Code2, SendHorizontalIcon } from 'lucide-react'

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

  const send = (value: string): void => {
    const v = value.trim()
    if (!v) return
    aui.thread.append(v)
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
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(text)
              }
            }}
            placeholder={isRunning ? 'دارم جواب میدم...' : 'از Atlas بپرس...'}
            autoFocus
            disabled={isRunning}
            className="w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:opacity-50 disabled:opacity-50"
            style={{ color: 'var(--text-primary)' }}
          />
          <div className="flex items-center gap-1 px-1 pb-1">
            {[Paperclip, Globe, Sparkles, Code2].map((Icon, i) => (
              <button
                key={i}
                onClick={() => {
                  const hints = [
                    'پیوست فایل در فاز بعدی فعال میشود — فعلاً متن/کد بفرست',
                    'جستوجوی وب در فاز بعدی فعال میشود',
                    'مهارتها را از فروشگاه سایدبار نصب کن 🧩',
                    'اجرای کد در فاز بعدی فعال میشود'
                  ]
                  setHint(hints[i])
                }}
                className="rounded-xl p-2 transition-all hover:scale-110"
                style={{ color: 'var(--text-secondary)' }}
                title="اطلاعات"
              >
                <Icon size={16} />
              </button>
            ))}
            {text.trim() ? (
              <button
                onClick={() => send(text)}
                className="mr-auto flex h-9 w-9 items-center justify-center rounded-full text-white transition-all hover:scale-110"
                style={{ background: 'var(--accent)' }}
                title="ارسال (Enter)"
              >
                <SendHorizontalIcon size={16} />
              </button>
            ) : (
              <button
                onClick={() => setHint('ورودی صوتی در فاز بعدی فعال میشود 🎙️')}
                className="mr-auto flex h-9 w-9 items-center justify-center rounded-full text-white transition-all hover:scale-105"
                style={{ background: 'var(--accent)' }}
                title="ورودی صوتی"
              >
                <Mic size={16} />
              </button>
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
