import { AnimatePresence, motion } from 'motion/react'
import { Check, Info, XCircle } from 'lucide-react'
import { useToastStore } from '@/stores/toastStore'

export function Toaster(): React.JSX.Element {
  const toasts = useToastStore(s => s.toasts)
  return (
    <div className="fixed bottom-4 left-4 z-[60] flex w-72 max-w-[90vw] flex-col gap-2" dir="rtl">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="glass-strong flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs shadow-lg"
            style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
          >
            {t.kind === 'success' && <Check size={15} style={{ color: '#4ade80' }} />}
            {t.kind === 'error' && <XCircle size={15} style={{ color: '#f87171' }} />}
            {t.kind === 'info' && <Info size={15} style={{ color: 'var(--accent)' }} />}
            <span className="flex-1">{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
