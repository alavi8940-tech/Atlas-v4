/**
 * Typewriter — الگوی آماده: چرخش خودکار متن با افکت تایپ/پاک‌کردن.
 */
import { useEffect, useState } from 'react'

export function Typewriter({ words, className }: { words: string[]; className?: string }): React.JSX.Element {
  const [text, setText] = useState('')
  const [wi, setWi] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = words[wi % words.length]
    const t = setTimeout(() => {
      if (!deleting) {
        const next = word.slice(0, text.length + 1)
        setText(next)
        if (next.length === word.length) setTimeout(() => setDeleting(true), 1300)
      } else {
        const next = word.slice(0, Math.max(0, text.length - 1))
        setText(next)
        if (next.length === 0) { setDeleting(false); setWi(wi + 1) }
      }
    }, deleting ? 38 : 78)
    return () => clearTimeout(t)
  }, [text, wi, deleting, words])

  return (
    <span className={className}>
      {text}
      <span className="caret" style={{ color: 'var(--accent)' }}>|</span>
    </span>
  )
}
