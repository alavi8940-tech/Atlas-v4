/**
 * AnimatedNumber — الگوی آماده: شمارش صعودی نرم (count-up) با requestAnimationFrame.
 */
import { useEffect, useRef, useState } from 'react'

export function AnimatedNumber({ value, className }: { value: number; className?: string }): React.JSX.Element {
  const [disp, setDisp] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) return
    const start = performance.now()
    const dur = 600
    const tick = (t: number): void => {
      const p = Math.min(1, (t - start) / dur)
      const e = 1 - Math.pow(1 - p, 3)
      setDisp(from + (to - from) * e)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value])

  return <span className={className}>{Math.round(disp)}</span>
}
