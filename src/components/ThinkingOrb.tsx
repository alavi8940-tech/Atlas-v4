/**
 * ThinkingOrb — گوی شیشهای + لتی فکر کردن
 * لتی فقط وقتی isRunning است ظاهر میشود (افکت فکر کردن)
 */
import { Lottie } from 'lottie-react'
import aiFlow from '@/assets/lottie/ai-flow.json'
import { Orb } from '@/components/Orb'

export function ThinkingOrb({
  size = 150,
  isThinking
}: {
  size?: number
  isThinking: boolean
}): React.JSX.Element {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size + 40, height: size + 40 }}>
      {/* گوی پایه — با حالت thinking */}
      <div className="absolute">
        <Orb size={size} state={isThinking ? 'thinking' : 'idle'} />
      </div>

      {/* لتی فکر کردن — فقط حین تولید */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-all duration-700"
        style={{
          opacity: isThinking ? 1 : 0,
          transform: isThinking ? 'scale(1)' : 'scale(0.7)',
          filter: isThinking ? 'blur(0px)' : 'blur(8px)',
          pointerEvents: 'none'
        }}
      >
        <div style={{ width: size + 55, height: size + 55 }} className="drop-shadow-2xl">
          <Lottie src={aiFlow} loop autoplay style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    </div>
  )
}
