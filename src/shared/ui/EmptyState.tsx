import type { ReactNode } from 'react'

type EmptyStateProps = {
  action?: ReactNode
  className?: string
  description: ReactNode
  title?: ReactNode
}

export function EmptyState({ action, className = '', description, title = 'Todavía no hay nada para mostrar' }: EmptyStateProps) {
  return (
    <div className={['ui-empty-state', className].filter(Boolean).join(' ')}>
      <strong className="ui-empty-state__title">{title}</strong>
      <p className="ui-empty-state__description">{description}</p>
      {action ? <div className="ui-empty-state__action">{action}</div> : null}
    </div>
  )
}
