/**
 * Theme preference (Zustand, persisted). "system" follows the OS setting.
 *
 * The chosen theme is applied as a `dark` class on <html>, which the shadcn CSS variables
 * use. An inline script in index.html applies it before React loads to avoid a flash.
 */
import { useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'system' | 'light' | 'dark'

interface ThemeState {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
}

export const THEME_STORAGE_KEY = 'acme-events-theme'

export const useThemeStore = create<ThemeState>()(
  persist((set) => ({ theme: 'system', setTheme: (theme) => set({ theme }) }), {
    name: THEME_STORAGE_KEY,
  }),
)

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

/** Resolve "system" to the actual light/dark value. */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useThemeStore((state) => state.theme)
  if (theme !== 'system') return theme
  return darkQuery().matches ? 'dark' : 'light'
}

/** Keep the `dark` class on <html> in sync with the preference and the OS setting. */
export function useApplyTheme() {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    const media = darkQuery()
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
}
