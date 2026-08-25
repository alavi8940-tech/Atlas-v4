/** گوی شیشهای اطلس — با چشمهای پلکزن و سه حالت */
export function Orb({ size = 160, state = 'idle' }: { size?: number; state?: 'idle' | 'thinking' | 'listening' }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div className="atlas-orb" data-state={state} style={{ width: size, height: size }}>
        <div className="orb-eyes">
          <div className="orb-eye" />
          <div className="orb-eye" />
        </div>
      </div>
      <div className="orb-shadow" style={{ width: size * 0.55 }} />
    </div>
  )
}
