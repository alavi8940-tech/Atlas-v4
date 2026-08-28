import { createElement, useEffect, useRef, useState } from 'react'
import { useUiStore } from '@/stores/uiStore'
import { ArrowLeft, ArrowRight, RotateCw, Home, ExternalLink, Globe } from 'lucide-react'

const HOME = 'https://duckduckgo.com/html/'

export function InternalBrowser(): React.JSX.Element {
  const initial = useUiStore((s) => s.browserUrl)
  const [url, setUrl] = useState(initial ?? HOME)
  const [input, setInput] = useState(initial ?? HOME)
  const webviewRef = useRef<unknown>(null)
  const isElectron = typeof window !== 'undefined' && Boolean((window as unknown as { atlasAPI?: unknown }).atlasAPI)

  useEffect(() => {
    if (initial) {
      setUrl(initial)
      setInput(initial)
    }
  }, [initial])

  const go = (u?: string): void => {
    const raw = u ?? input
    const final = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    setUrl(final)
    setInput(final)
  }

  return (
    <div className="flex h-full flex-col" dir="ltr">
      <div className="flex items-center gap-1 border-b p-2" style={{ borderColor: 'var(--glass-border)', background: 'var(--glass)' }}>
        <button onClick={() => (webviewRef.current as { goBack?: () => void })?.goBack?.()} className="glass glass-hover rounded-lg p-2" title="بازگشت"><ArrowLeft size={15} /></button>
        <button onClick={() => (webviewRef.current as { goForward?: () => void })?.goForward?.()} className="glass glass-hover rounded-lg p-2" title="جلو"><ArrowRight size={15} /></button>
        <button onClick={() => (webviewRef.current as { reload?: () => void })?.reload?.()} className="glass glass-hover rounded-lg p-2" title="بارگذاری دوباره"><RotateCw size={15} /></button>
        <button onClick={() => go(HOME)} className="glass glass-hover rounded-lg p-2" title="خانه"><Home size={15} /></button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') go() }}
          placeholder="یک نشانی وارد کن..."
          className="mx-1 min-w-0 flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm outline-none"
          style={{ color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
        />
        <button onClick={() => go()} className="glass glass-hover flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm" style={{ color: 'var(--accent)' }}><Globe size={14} /> برو</button>
        {!isElectron && (
          <button onClick={() => window.open(url, '_blank', 'noopener')} className="glass glass-hover rounded-lg p-2" title="باز کردن در مرورگر سیستم"><ExternalLink size={15} /></button>
        )}
      </div>
      <div className="min-h-0 flex-1" dir="rtl">
        {isElectron ? (
          createElement('webview', {
            ref: webviewRef,
            src: url,
            className: 'h-full w-full',
            style: { width: '100%', height: '100%', border: 'none' },
          })
        ) : (
          <iframe
            src={url}
            title="Atlas Browser"
            className="h-full w-full"
            style={{ border: 'none' }}
          />
        )}
      </div>
    </div>
  )
}
