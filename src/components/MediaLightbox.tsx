/**
 * MediaLightbox — لایت‌باکس تصویر بر پایهٔ yet-another-react-lightbox آرسنال
 * بهجای پرتال دستی، از کتابخانهٔ آماده استفاده میکنیم (قانون همیشگی پروژه)
 * تم شیشه‌ای Atlas: پسزمینه بلور + دکمههای --glass + لهجهٔ --accent
 */
import { Lightbox } from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'

export interface MediaLightboxProps {
  open: boolean
  onClose: () => void
  src: string
  alt?: string
}

/** استایل شیشه‌ای Atlas روی کانتینر و کنترلهای لایت‌باکس */
const atlasStyles = {
  container: {
    backgroundColor: 'rgba(8, 10, 20, 0.72)',
    backdropFilter: 'blur(28px) saturate(1.35)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.35)'
  },
  navigationPrev: {
    background: 'var(--glass-bg-strong)',
    border: '1px solid var(--glass-border)',
    borderRadius: '16px',
    color: 'var(--text-primary)'
  },
  navigationNext: {
    background: 'var(--glass-bg-strong)',
    border: '1px solid var(--glass-border)',
    borderRadius: '16px',
    color: 'var(--text-primary)'
  },
  header: { color: 'var(--text-primary)' }
}

export function MediaLightbox({ open, onClose, src, alt }: MediaLightboxProps): React.JSX.Element {
  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={[{ src, alt: alt ?? 'Image content' }]}
      plugins={[Zoom]}
      zoom={{
        maxZoomPixelRatio: 6,
        scrollToZoom: true,
        zoomInMultiplier: 1.6
      }}
      animation={{ zoom: 320, fade: 220 }}
      carousel={{ finite: true }}
      controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
      styles={atlasStyles}
      render={{
        iconPrev: () => <ChevronRight size={22} />,
        iconNext: () => <ChevronLeft size={22} />,
        iconClose: () => <X size={20} />,
        iconZoomIn: () => <ZoomIn size={20} />
      }}
      labels={{
        'Close': 'بستن',
        'Previous': 'قبلی',
        'Next': 'بعدی',
        'Zoom in': 'بزرگنمایی',
        'Zoom out': 'کوچکنمایی'
      }}
    />
  )
}

export default MediaLightbox
