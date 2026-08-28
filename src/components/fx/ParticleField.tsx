/**
 * ParticleField — پس‌زمینهٔ ذرات متصل‌شونده (الگوی آماده، pure-canvas).
 * بدون وابستگی؛ با احترام به prefers-reduced-motion.
 */
import { useEffect, useRef } from 'react'

export function ParticleField({ count = 46, className }: { count?: number; className?: string }): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const parent = canvas.parentElement!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    const resize = (): void => {
      w = parent.clientWidth
      h = parent.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6c8cff'
    type P = { x: number; y: number; vx: number; vy: number; r: number }
    const ps: P[] = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.8 + 0.6,
    }))

    let raf = 0
    const draw = (): void => {
      ctx.clearRect(0, 0, w, h)
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = accent; ctx.globalAlpha = 0.5; ctx.fill()
      }
      ctx.globalAlpha = 1
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const dx = ps[i].x - ps[j].x
          const dy = ps[i].y - ps[j].y
          const d = Math.hypot(dx, dy)
          if (d < 110) {
            ctx.globalAlpha = (1 - d / 110) * 0.18
            ctx.strokeStyle = accent; ctx.lineWidth = 1
            ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    if (!reduce) raf = requestAnimationFrame(draw); else draw()
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [count])

  return <canvas ref={ref} className={className} aria-hidden />
}
