import { useEffect, useState } from 'react'
import { useAuiState } from '@assistant-ui/react'
import { Lottie } from 'lottie-react'
import { Orb } from '@/components/Orb'
import { useSettingsStore } from '@/stores/settingsStore'

/**
 * گوی هوشمند Atlas:
 * - حالت عادی: گوی شیشهای با چشمهای پلکزن
 * - حالت فکر کردن (مدل در حال تولید): لتی روشن میشود + چشمها نیمبسته + هاله تپنده
 */
export function SmartOrb({ size = 150 }: { size?: number }): React.JSX.Element {
  const isRunning = useAuiState(s => s.thread.isRunning)
  const setOrbState = useSettingsStore(s => s.setOrbState)
  const [aiFlowSrc, setAiFlowSrc] = useState<object | null>(null)

  // بارگذاری تنبل JSON لتی (۴.۶ مگابایت) — خارج از باندل اصلی
  useEffect(() => {
    if (!isRunning || aiFlowSrc) return
    import('@/assets/lottie/ai-flow.json').then(mod => setAiFlowSrc(mod.default)).catch(() => {})
  }, [isRunning, aiFlowSrc])

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
      {isRunning && aiFlowSrc && (
        <div
          className="rise-in absolute drop-shadow-2xl"
          style={{ width: size + 30, height: size + 30 }}
        >
          <Lottie src={aiFlowSrc} loop autoplay style={{ width: '100%', height: '100%' }} />
        </div>
      )}
    </div>
  )
}

export default SmartOrb
