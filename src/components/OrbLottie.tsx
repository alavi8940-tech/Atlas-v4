import { Lottie } from 'lottie-react'
import aiFlow from '@/assets/lottie/ai-flow.json'

/**
 * انیمیشن Lottie هوش مصنوعی — افکت فکر کردن روی گوی
 * فقط وقتی visible=true نمایش داده میشود (حین تولید پاسخ)
 */
export function OrbLottie({ size = 170, visible = false }: { size?: number; visible?: boolean }): React.JSX.Element {
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
      <Lottie src={aiFlow} loop autoplay style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default OrbLottie
