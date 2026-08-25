import { useEffect, useState } from 'react'
import { Orb } from '@/components/Orb'
import { OrbLottie } from '@/components/OrbLottie'
import { useSettingsStore } from '@/stores/settingsStore'

type OrbState = 'idle' | 'thinking' | 'listening'

/**
 * AtlasOrb — گوی هوشمند که حالتش را از وضعیت چت میگیرد
 * idle: گوی شیشهای با چشم پلکزن
 * thinking: لتی روشن میشود + چشمها نیمبسته (وقتی مدل در حال تولید است)
 */
export function AtlasOrb({ size = 150, isThinking }: { size?: number; isThinking?: boolean }): React.JSX.Element {
  const [showLottie, setShowLottie] = useState(false)
  const setOrbState = useSettingsStore(s => s.setOrbState)
  const state: OrbState = isThinking ? 'thinking' : 'idle'

  // همگامسازی وضعیت سراسری
  useEffect(() => {
    setOrbState(state)
  }, [state, setOrbState])

  // لتی با ترنزیشن نرم ظاهر/محو میشود — فقط در حالت فکر کردن
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (isThinking) {
      timer = setTimeout(() => setShowLottie(true), 250)
    } else {
      setShowLottie(false)
    }
    return () => clearTimeout(timer)
  }, [isThinking])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* گوی پایه — همیشه زیر */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Orb size={size} state={state} />
      </div>
      {/* لتی — فقط هنگام فکر کردن، با fade */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
        style={{ opacity: showLottie ? 0.95 : 0, pointerEvents: 'none' }}
      >
        {showLottie && <OrbLottie size={size * 1.25} />}
      </div>
    </div>
  )
}
