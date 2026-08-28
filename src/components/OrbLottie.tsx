import { useEffect, useState } from 'react'
import { Lottie } from 'lottie-react'

/**
 * انیمیشن Lottie هوش مصنوعی — افکت فکر کردن روی گوی
 * فقط وقتی visible=true نمایش داده میشود (حین تولید پاسخ)
 * بارگذاری تنبل JSON لتی (۴.۶ مگابایت) → خارج از باندل اصلی
 */
export function OrbLottie({ size = 170, visible = false }: { size?: number; visible?: boolean }): React.JSX.Element {
  const [data, setData] = useState<object | null>(null)
  useEffect(() => {
    let alive = true
    import('@/assets/lottie/ai-flow.json').then((m) => { if (alive) setData(m.default) }).catch(() => {})
    return () => { alive = false }
  }, [])
  return (
    <div
      style={{
        width: size,
        height: size,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s cubic-bezier(0.32,0.72,0,1)',
        pointerEvents: 'none'
      }}
      className="drop-shadow-2xl"
    >
      {data && <Lottie src={data} loop autoplay style={{ width: '100%', height: '100%' }} />}
    </div>
  )
}

export default OrbLottie
