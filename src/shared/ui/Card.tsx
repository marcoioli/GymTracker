import type { HTMLAttributes, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'div' | 'section'
  children: ReactNode
  variant?: 'default' | 'subtle' | 'highlight'
}

export function Card({ as = 'article', children, className = '', variant = 'default', ...props }: CardProps) {
  const Component = as

  return (
    <Component className={['ui-card', variant === 'default' ? '' : `ui-card--${variant}`, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </Component>
  )
}
