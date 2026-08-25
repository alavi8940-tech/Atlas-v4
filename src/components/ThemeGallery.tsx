import { THEMES, useSettingsStore, type ThemeName } from '@/stores/settingsStore'
import { Check } from 'lucide-react'

/** گالری تمها — کارتهای گرادیانی مثل Serene Current */
export function ThemeGallery(): React.JSX.Element {
  const theme = useSettingsStore(s => s.theme)
  const setTheme = useSettingsStore(s => s.setTheme)

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {THEMES.map((t, i) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id as ThemeName)}
          data-active={theme === t.id}
          className={`theme-card rise-in stagger-${(i % 6) + 1}`}
          title={`${t.name} — ${t.mode === 'dark' ? 'تاریک' : 'روشن'}`}
        >
          <div className="theme-bg" style={{ background: t.preview }} />
          <span className="theme-name">{t.latin}</span>
          {theme === t.id && (
            <span className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-black shadow">
              <Check size={12} strokeWidth={3} />
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
