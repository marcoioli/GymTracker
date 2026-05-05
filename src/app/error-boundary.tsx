import { Component, type ErrorInfo, type PropsWithChildren } from 'react'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'

import { Button, StatusBanner } from '../shared/ui'

type AppErrorBoundaryState = {
  error: Error | null
}

type ProblemScreenProps = {
  description: string
  errorMessage?: string
  eyebrow?: string
  headingLevel?: 'h1' | 'h2'
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
  primaryActionLabel?: string
  secondaryActionLabel?: string
  title: string
}

export class AppErrorBoundary extends Component<PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled application error', error, errorInfo)
  }

  private readonly handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    return (
      <ProblemScreen
        description="Intenta reabrir esta vista. Si el fallo vino de una actualizacion o de un estado transitorio, la app deberia recuperarse sin tocar tus datos locales."
        errorMessage={this.state.error.message}
        eyebrow="Recuperacion global"
        onPrimaryAction={this.handleReset}
        onSecondaryAction={() => window.location.reload()}
        primaryActionLabel="Reintentar"
        secondaryActionLabel="Recargar app"
        title="La app encontro un error inesperado"
      />
    )
  }
}

export function AppRouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  const title = isRouteErrorResponse(error)
    ? error.status === 404
      ? 'No encontramos esa pantalla'
      : `La vista devolvio ${error.status}`
    : 'No pudimos abrir esta pantalla'
  const description = isRouteErrorResponse(error)
    ? error.status === 404
      ? 'La ruta que pediste no existe o quedo vieja. Volve al inicio y segui desde una pantalla valida.'
      : error.statusText || 'La navegacion fallo antes de mostrar contenido usable.'
    : 'Proba volver al inicio o recargar. La base local no deberia perderse por este error de interfaz.'
  const errorMessage = error instanceof Error ? error.message : undefined

  return (
    <ProblemScreen
      description={description}
      errorMessage={errorMessage}
      eyebrow="Error de navegacion"
      onPrimaryAction={() => navigate('/')}
      onSecondaryAction={() => window.location.reload()}
      primaryActionLabel="Volver al inicio"
      secondaryActionLabel="Recargar app"
      title={title}
    />
  )
}

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <ProblemPanel
      description="La pantalla que buscas no existe dentro del flujo actual. Volve al dashboard y segui desde navegacion real, no desde una URL colgada."
      eyebrow="Ruta invalida"
      onPrimaryAction={() => navigate('/')}
      primaryActionLabel="Ir al inicio"
      title="Pantalla no encontrada"
      headingLevel="h2"
    />
  )
}

function ProblemScreen({
  description,
  errorMessage,
  eyebrow,
  headingLevel,
  onPrimaryAction,
  onSecondaryAction,
  primaryActionLabel,
  secondaryActionLabel,
  title
}: ProblemScreenProps) {
  return (
    <div className="app-shell app-shell--problem">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <main className="app-main" id="main-content" tabIndex={-1}>
        <ProblemPanel
          description={description}
          errorMessage={errorMessage}
          eyebrow={eyebrow}
          headingLevel={headingLevel}
          onPrimaryAction={onPrimaryAction}
          onSecondaryAction={onSecondaryAction}
          primaryActionLabel={primaryActionLabel}
          secondaryActionLabel={secondaryActionLabel}
          title={title}
        />
      </main>
    </div>
  )
}

function ProblemPanel({
  description,
  errorMessage,
  eyebrow,
  headingLevel = 'h1',
  onPrimaryAction,
  onSecondaryAction,
  primaryActionLabel,
  secondaryActionLabel,
  title
}: ProblemScreenProps) {
  const TitleTag = headingLevel

  return (
    <section className="panel" aria-labelledby="problem-screen-title">
      <p className="eyebrow">{eyebrow ?? 'Error'}</p>
      <TitleTag className="section-title problem-screen__title" id="problem-screen-title">
        {title}
      </TitleTag>
      <p className="empty-note problem-screen__description">{description}</p>

      {errorMessage ? <StatusBanner tone="error">{errorMessage}</StatusBanner> : null}

      <div className="problem-screen__actions">
        {onPrimaryAction && primaryActionLabel ? <Button fullWidth onClick={onPrimaryAction}>{primaryActionLabel}</Button> : null}
        {onSecondaryAction && secondaryActionLabel ? <Button fullWidth variant="ghost" onClick={onSecondaryAction}>{secondaryActionLabel}</Button> : null}
      </div>
    </section>
  )
}
