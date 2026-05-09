import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { readStoredTheme, THEME_STORAGE_KEY, ThemeContext, type AppTheme, type ThemeContextValue } from './theme-context'

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<AppTheme>(() => readStoredTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo<ThemeContextValue>(() => ({ setTheme, theme }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
