import { AppErrorBoundary } from './error-boundary'
import { AppRouter } from './router'
import { AppProviders } from './providers'

export function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </AppErrorBoundary>
  )
}
