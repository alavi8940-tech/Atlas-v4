import { useEffect, useState } from 'react'
import { useAuiState } from '@assistant-ui/react'
import { Lottie } from 'lottie-react'

/**
 * افکت فکر کردن — لتی فقط حین تولید پاسخ روشن میشود
 * روی گوی شیشهای با fade نرم. بارگذاری تنبل JSON لتی.
 */
export function ThinkingEffect(): React.JSX.Element | null {
  const isRunning = useAuiState(s => s.thread.isRunning)
  const [show, setShow] = useState(false)
  const [data, setData] = useState<object | null>(null)
  useEffect(() => {
    let alive = true
    import('@/assets/lottie/ai-flow.json').then((m) => { if (alive) setData(m.default) }).catch(() => {})
    return () => { alive = false }
  }, [])

  // تاخیر کوتاه برای جلوگیری از چشمک در پیامهای سریع
  useEffect(() => {
    if (isRunning) {
      const t = setTimeout(() => setShow(true), 250)
      return () => clearTimeout(t)
    }
    setShow(false)
  }, [isRunning])

  if (!show) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{ animation: 'rise-in 0.4s ease both' }}
      aria-hidden
    >
      <div className="drop-shadow-2xl" style={{ width: 190, height: 190, opacity: 0.92 }}>
        {data && <Lottie src={data} loop autoplay style={{ width: '100%', height: '100%' }} />}
      </div>
    </div>
  )
}
