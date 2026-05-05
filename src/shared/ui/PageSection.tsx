import type { ReactNode } from 'react'

import { EmptyState } from './EmptyState'

type PageSectionProps = {
  actions?: ReactNode
  children: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  emptyState?: ReactNode
  title: ReactNode
  titleId: string
}

export function PageSection({ actions, children, description, eyebrow, emptyState, title, titleId }: PageSectionProps) {
  return (
    <section className="panel" aria-labelledby={titleId}>
      <div className="panel-header">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 className="section-title" id={titleId}>
            {title}
          </h2>
          {description ? <div className="ui-section-description panel-copy">{description}</div> : null}
        </div>
        {actions}
      </div>
      {emptyState ? <EmptyState className="ui-section-empty-state" description={emptyState} title={null} /> : null}
      {children}
    </section>
  )
}
