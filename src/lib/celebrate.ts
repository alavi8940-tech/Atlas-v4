import confetti from 'canvas-confetti'

const COLORS = ['#6c8cff', '#c4b5fd', '#f0abfc', '#4ade80', '#fbbf24']

/** جشن تعاملی آماده (canvas-confetti) برای لحظه‌های موفقیت */
export function celebrate(): void {
  const base = { colors: COLORS, disableForReducedMotion: true }
  confetti({ ...base, particleCount: 90, spread: 70, origin: { y: 0.72 }, startVelocity: 38 })
  setTimeout(() => confetti({ ...base, particleCount: 50, spread: 100, origin: { x: 0.2 }, angle: 60 }), 120)
  setTimeout(() => confetti({ ...base, particleCount: 50, spread: 100, origin: { x: 0.8 }, angle: 120 }), 120)
}
