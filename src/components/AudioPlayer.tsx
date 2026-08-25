/**
 * AtlasAudioPlayer — پخشکنندهٔ صوتی بر پایهٔ wavesurfer.js آرسنال (نسخهٔ 7)
 * موج نمایشی + کنترل پخش + زمان + دانلود، همه در کارت شیشه‌ای Atlas
 */
import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { Pause, Play, Download } from 'lucide-react'

export interface AtlasAudioPlayerProps {
  /** آدرس فایل صوتی — http(s) یا data-uri */
  src: string
  filename?: string
}

const fmt = (s: number): string => {
  if (!Number.isFinite(s)) return '۰:۰۰'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

/** خواندن متغیر تم از CSS — رنگها را از خود قالب فعلی میگیریم */
function readVar(name: string, fallback: string): string {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return v || fallback
  } catch {
    return fallback
  }
}

export function AtlasAudioPlayer({ src, filename }: AtlasAudioPlayerProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el || !src) return

    // رنگها هنگام ساخت خوانده میشوند؛ تغییر تم بعداً روی موج فعلی اثر نمیگذارد (محدودیت شناختهشده)
    const accent = readVar('--accent', '#6c8cff')
    const waveColor = readVar('--glass-highlight', 'rgba(255,255,255,0.25)')

    const ws = WaveSurfer.create({
      container: el,
      height: 44,
      waveColor,
      progressColor: accent,
      barWidth: 2,
      barGap: 2,
      barRadius: 4,
      cursorWidth: 0,
      normalize: true,
      url: src
    })
    wsRef.current = ws

    ws.on('ready', () => {
      setReady(true)
      setDuration(ws.getDuration())
    })
    ws.on('play', () => setPlaying(true))
    ws.on('pause', () => setPlaying(false))
    ws.on('finish', () => setPlaying(false))
    ws.on('timeupdate', (t: number) => setCurrent(t))

    return () => {
      try { ws.destroy() } catch { /* ignore */ }
      wsRef.current = null
      setPlaying(false); setCurrent(0); setDuration(0); setReady(false)
    }
  }, [src])

  const toggle = (): void => { void wsRef.current?.playPause() }

  const href = /^data:/i.test(src) || /^(https?:|blob:)/i.test(src) ? src : undefined

  return (
    <div
      dir="ltr"
      className="glass my-1 flex w-full max-w-md items-center gap-3 rounded-2xl px-3 py-2"
      style={{ borderColor: 'var(--glass-border)' }}
      data-slot="atlas-audio-player"
    >
      <button
        type="button"
        onClick={toggle}
        disabled={!ready}
        aria-label={playing ? 'توقف پخش' : 'پخش'}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-105 disabled:opacity-50"
        style={{ background: 'var(--accent)' }}
      >
        {playing ? <Pause size={15} /> : <Play size={15} className="-mr-px translate-x-px" />}
      </button>

      <div ref={containerRef} className="min-w-0 flex-1" />

      <span className="shrink-0 text-[11px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
        {fmt(current)} / {fmt(duration)}
      </span>

      {filename && href && (
        <a
          href={href}
          download={filename}
          aria-label="دانلود فایل صوتی"
          className="shrink-0 rounded-md p-1 transition-colors hover:bg-white/10"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Download size={14} />
        </a>
      )}
    </div>
  )
}

export default AtlasAudioPlayer
