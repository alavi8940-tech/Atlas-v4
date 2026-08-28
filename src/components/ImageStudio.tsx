/**
 * ImageStudio — ویرایشگر سادهٔ اسکرین‌شات: کشیدن کادر قرمز + یادداشت روی تصویر
 * و خروجی به‌عنوان فایل (یا ارسال به چت). MVP سبک.
 */
import { useRef, useState } from 'react'
import { X, Download, Check } from 'lucide-react'

export function ImageStudio({ src, onClose }: { src: string; onClose: () => void }): React.JSX.Element {
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const start = useRef({ x: 0, y: 0 })
  const [note, setNote] = useState('')
  const [rects, setRects] = useState<Array<{ x: number; y: number; w: number; h: number }>>([])

  const pos = (e: React.MouseEvent): { x: number; y: number } => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onDown = (e: React.MouseEvent): void => {
    drawing.current = true
    start.current = pos(e)
  }
  const onUp = (e: React.MouseEvent): void => {
    if (!drawing.current) return
    drawing.current = false
    const p = pos(e)
    const rect = {
      x: Math.min(start.current.x, p.x),
      y: Math.min(start.current.y, p.y),
      w: Math.abs(p.x - start.current.x),
      h: Math.abs(p.y - start.current.y),
    }
    if (rect.w > 4 && rect.h > 4) setRects(rs => [...rs, rect])
  }
  const onMove = (e: React.MouseEvent): void => {
    if (!drawing.current || !canvasRef.current) return
    const p = pos(e)
    const c = canvasRef.current
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 3
    const cur = { x: Math.min(start.current.x, p.x), y: Math.min(start.current.y, p.y), w: Math.abs(p.x - start.current.x), h: Math.abs(p.y - start.current.y) }
    rects.forEach(r => ctx.strokeRect(r.x, r.y, r.w, r.h))
    ctx.strokeRect(cur.x, cur.y, cur.w, cur.h)
  }

  const save = (): void => {
    const img = imgRef.current!
    const out = document.createElement('canvas')
    out.width = img.naturalWidth
    out.height = img.naturalHeight
    const sx = img.naturalWidth / (canvasRef.current?.clientWidth || img.naturalWidth)
    const sy = img.naturalHeight / (canvasRef.current?.clientHeight || img.naturalHeight)
    const ctx = out.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 3 * Math.max(sx, sy)
    rects.forEach(r => ctx.strokeRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy))
    if (note.trim()) {
      ctx.fillStyle = 'rgba(239,68,68,.92)'
      ctx.font = `${Math.round(18 * Math.max(sx, sy))}px sans-serif`
      ctx.fillText(note, 12 * sx, 28 * sy)
    }
    const url = out.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'atlas-annotated.png'
    a.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-label="استودیو تصویر">
      <div className="glass-strong flex max-h-[90vh] w-[640px] max-w-full flex-col rounded-2xl p-3" style={{ background: 'var(--bg-base)' }}>
        <header className="mb-2 flex items-center gap-2">
          <span className="text-lg">🎨</span>
          <span className="text-sm font-bold">استودیو تصویر</span>
          <button onClick={onClose} className="mr-auto rounded-xl p-2 glass-hover" style={{ color: 'var(--text-secondary)' }}><X size={16} /></button>
        </header>
        <div className="relative flex-1 overflow-auto">
          <img ref={imgRef} src={src} alt="edit" className="max-h-[60vh] w-full rounded-lg" />
          <canvas
            ref={canvasRef}
            onMouseDown={onDown}
            onMouseUp={onUp}
            onMouseMove={onMove}
            className="absolute inset-0 h-full w-full cursor-crosshair"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="یادداشت (روی تصویر)" className="flex-1 rounded-xl bg-transparent px-3 py-2 text-xs outline-none" style={{ background: 'rgba(128,128,128,.08)', color: 'var(--text-primary)' }} />
          <button onClick={save} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-white" style={{ background: 'var(--accent)' }}><Download size={13} /> ذخیره</button>
          <button onClick={() => setRects([])} className="rounded-xl px-3 py-2 text-xs glass glass-hover">پاک</button>
        </div>
        <p className="mt-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}><Check size={10} className="inline" /> روی تصویر بکش تا کادر قرمز اضافه شود.</p>
      </div>
    </div>
  )
}
