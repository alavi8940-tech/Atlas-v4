/**
 * VoiceOrb — اورب صوتی متحرک (الگوی آماده): هسته‌ای که با سطح صدا بزرگ/کوچک میشه،
 * و در حالت گوش/صحبت با حلقه‌های پالس احاطه میشه.
 */
import { Mic } from 'lucide-react'

export function VoiceOrb({
  level = 0,
  state = 'idle',
  size = 220,
}: { level?: number; state?: 'idle' | 'listening' | 'speaking'; size?: number }): React.JSX.Element {
  const scale = 1 + Math.min(level, 1) * 0.38
  const color = state === 'speaking' ? '#4ade80' : state === 'listening' ? 'var(--accent)' : 'var(--text-secondary)'
  const ringShown = state !== 'idle'

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            width: size * 0.62,
            height: size * 0.62,
            border: `1.5px solid ${color}`,
            opacity: ringShown ? 0.45 : 0.18,
            animation: ringShown ? `voice-pulse 2.4s ease-out ${i * 0.5}s infinite` : 'none',
          }}
        />
      ))}

      <div
        className="rounded-full"
        style={{
          width: size * 0.56,
          height: size * 0.56,
          transform: `scale(${scale})`,
          transition: 'transform 80ms linear',
          background: 'var(--orb-grad)',
          boxShadow: `0 0 ${28 + level * 46}px ${color}`,
        }}
      />
      <Mic size={size * 0.16} className="absolute text-white/90" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.4))' }} />
    </div>
  )
}
