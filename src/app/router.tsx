import { lazy, Suspense, useEffect, useRef } from 'react'
import { createBrowserRouter, NavLink, Outlet, RouterProvider, useLocation } from 'react-router-dom'

import { DashboardPage } from '../features/dashboard/DashboardPage'
import { RoutinesPage } from '../features/routines/RoutinesPage'
import { WorkoutSessionScreen } from '../features/session/WorkoutSessionScreen'
import { PageSection, StatusBanner } from '../shared/ui'

import { AppRouteErrorBoundary, NotFoundPage } from './error-boundary'
import { AppStatusDeck } from './pwa-runtime'

const HistoryPage = lazy(async () => ({ default: (await import('../features/history/HistoryPage')).HistoryPage }))
const AnalyticsPage = lazy(async () => ({ default: (await import('../features/analytics/AnalyticsPage')).AnalyticsPage }))
const BackupPage = lazy(async () => ({ default: (await import('../features/backup/BackupPage')).BackupPage }))

function RootLayout() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    mainRef.current?.focus()
  }, [location.pathname, location.search])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <header className="topbar" role="banner">
        <span className="eyebrow">GymTracker</span>
        <h1 className="title">Tu entrenamiento en un solo lugar</h1>
        <p className="lead">Base offline-first lista para crear rutinas, registrar sesiones y seguir progreso sin perder tiempo en el gimnasio.</p>
      </header>

      <AppStatusDeck />

      <main className="app-main" id="main-content" ref={mainRef} tabIndex={-1}>
        <Suspense fallback={<RouteLoadingState />}>
          <Outlet />
        </Suspense>
      </main>

      <nav className="bottom-nav" aria-label="Navegación principal">
        <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/" end>
          Inicio
        </NavLink>
        <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/routines">
          Rutinas
        </NavLink>
        <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/history">
          Historial
        </NavLink>
        <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/analytics">
          Métricas
        </NavLink>
        <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/backup">
          Respaldo
        </NavLink>
      </nav>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <AppRouteErrorBoundary />,
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'routines',
        element: <RoutinesPage />
      },
      {
        path: 'session/:routineId/:weekIndex/:dayId',
        element: <WorkoutSessionScreen />
      },
      {
        path: 'history',
        element: <HistoryPage />
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />
      },
      {
        path: 'backup',
        element: <BackupPage />
      },
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}

function RouteLoadingState() {
  return (
    <PageSection
      description="Cargando una vista secundaria y recuperando su contexto local."
      eyebrow="Navegación"
      title="Preparando pantalla"
      titleId="route-loading-title"
    >
      <StatusBanner tone="info">La app está abriendo el módulo sin bloquear la navegación principal.</StatusBanner>
    </PageSection>
  )
}
