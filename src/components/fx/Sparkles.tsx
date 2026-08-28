/**
 * Sparkles — الگوی آماده (سبک magicui): ذرات درخشان متحرک پشت المان‌ها.
 * بدون وابستگی خارجی؛ فقط CSS + چیدمان تصادفی.
 */
import { memo } from 'react'

const COLORS = ['#ffffff', '#c4b5fd', '#f0abfc', '#a5b4fc']

export const Sparkles = memo(function Sparkles({
  count = 16,
  className,
}: { count?: number; className?: string }): React.JSX.Element {
  const items = Array.from({ length: count }, (_, i) => {
    const top = Math.random() * 100
    const left = Math.random() * 100
    const size = 6 + Math.random() * 12
    const delay = Math.random() * 3
    const dur = 2.4 + Math.random() * 2.6
    return { top, left, size, delay, dur, color: COLORS[i % COLORS.length], id: i }
  })
  return (
    <div className={className} aria-hidden>
      {items.map(s => (
        <span
          key={s.id}
          className="spark"
          style={{
            position: 'absolute',
            top: `${s.top}%`,
            left: `${s.left}%`,
            fontSize: s.size,
            color: s.color,
            lineHeight: 1,
            animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            filter: 'drop-shadow(0 0 6px currentColor)',
          }}
        >
          ✦
        </span>
      ))}
    </div>
  )
})
