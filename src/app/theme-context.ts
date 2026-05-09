import { createContext, useContext } from 'react'

export type AppTheme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'gymtracker:theme'

export type ThemeContextValue = {
  setTheme: (theme: AppTheme) => void
  theme: AppTheme
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}

export function readStoredTheme(): AppTheme {
  if (typeof window === 'undefined') {
    return 'dark'
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

  return storedTheme === 'light' ? 'light' : 'dark'
}
