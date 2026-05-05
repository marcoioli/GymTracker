import type { ReactNode } from 'react'

type StatusBannerTone = 'success' | 'info' | 'error' | 'warning'

type StatusBannerProps = {
  children: ReactNode
  className?: string
  tone?: StatusBannerTone
}

export function StatusBanner({ children, className = '', tone = 'info' }: StatusBannerProps) {
  const isAlert = tone === 'error' || tone === 'warning'

  return (
    <div
      aria-live={isAlert ? undefined : 'polite'}
      className={['ui-status-banner', `ui-status-banner--${tone}`, className].filter(Boolean).join(' ')}
      role={isAlert ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}
