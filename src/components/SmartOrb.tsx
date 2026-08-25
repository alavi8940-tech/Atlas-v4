import { useEffect, useState } from 'react'
import { useAuiState } from '@assistant-ui/react'
import { Orb } from '@/components/Orb'
import { useSettingsStore } from '@/stores/settingsStore'

type LottieComp = React.ComponentType<{ src: unknown; loop?: boolean; autoplay?: boolean; style?: React.CSSProperties }>

/**
 * گوی هوشمند Atlas:
 * - حالت عادی: گوی شیشهای با چشمهای پلکزن
 * - حالت فکر کردن (مدل در حال تولید): لتی روشن میشود + چشمها نیمبسته + هاله تپنده
 */
export function SmartOrb({ size = 150 }: { size?: number }): React.JSX.Element {
  const isRunning = useAuiState(s => s.thread.isRunning)
  const setOrbState = useSettingsStore(s => s.setOrbState)
  const [LottieComp, setLottieComp] = useState<LottieComp | null>(null)

  // بارگذاری تنبل لتی — فقط وقتی اولین بار لازم شد
  useEffect(() => {
    if (!isRunning || LottieComp) return
    import('lottie-react').then(mod => {
      const m = mod as unknown as Record<string, unknown>
      const C = (m.Lottie ?? m.default) as LottieComp | undefined
      if (C) setLottieComp(() => C)
    })
  }, [isRunning, LottieComp])

  // همگامسازی وضعیت با استور سراسری
  useEffect(() => {
    setOrbState(isRunning ? 'thinking' : 'idle')
  }, [isRunning, setOrbState])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size + 40, height: size + 40 }}>
      {/* هاله فکر کردن */}
      {isRunning && (
        <div
          className="absolute inset-0 animate-ping rounded-full"
          style={{
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 65%)',
            animationDuration: '1.8s'
          }}
          aria-hidden
        />
      )}

      {/* گوی پایه */}
      <div className="absolute">
        <Orb size={size} state={isRunning ? 'thinking' : 'idle'} />
      </div>

      {/* لتی — فقط حین فکر کردن */}
      {isRunning && LottieComp && (
        <div
          className="rise-in absolute drop-shadow-2xl"
          style={{ width: size + 30, height: size + 30 }}
        >
          <LottieComp src={aiFlowSrc} loop autoplay style={{ width: '100%', height: '100%' }} />
        </div>
      )}
    </div>
  )
}

// بارگذاری یکباره JSON لتی
import aiFlowJson from '@/assets/lottie/ai-flow.json'
const aiFlowSrc = aiFlowJson

export default SmartOrb
