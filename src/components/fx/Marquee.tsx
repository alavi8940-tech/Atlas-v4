/**
 * Marquee — الگوی آماده (سبک aceternity): ردیف لغزندهٔ بینهایت.
 * با هاور متوقف میشود. فقط CSS.
 */
export function Marquee({ items, className }: { items: string[]; className?: string }): React.JSX.Element {
  const row = [...items, ...items]
  return (
    <div className={`marquee-mask overflow-hidden ${className ?? ''}`}>
      <div className="marquee-track flex w-max gap-2">
        {row.map((t, i) => (
          <span
            key={i}
            className="glass shrink-0 rounded-full px-3 py-1 text-[11px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
