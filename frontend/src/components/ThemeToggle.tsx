import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { type ThemePreference, useThemeStore } from '@/store/themeStore'

const ORDER: ThemePreference[] = ['system', 'light', 'dark']
const ICONS = { system: MonitorIcon, light: SunIcon, dark: MoonIcon }

/** Cycles system → light → dark. The choice is persisted by the Zustand theme store. */
export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
  const Icon = ICONS[theme]

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${theme}. Switch to ${next}.`}
      title={`Theme: ${theme}`}
    >
      <Icon />
    </Button>
  )
}
