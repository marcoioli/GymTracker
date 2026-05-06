import { lazy, Suspense, useEffect, useRef, useState } from 'react'
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

const navigationItems = [
  { to: '/', label: 'Inicio', icon: 'home', helper: 'Resumen del día', end: true },
  { to: '/routines', label: 'Rutinas', icon: 'routines', helper: 'Plan activo y semanas', end: false },
  { to: '/history', label: 'Historial', icon: 'history', helper: 'Sesiones guardadas', end: false },
  { to: '/analytics', label: 'Métricas', icon: 'analytics', helper: 'Progreso y tendencias', end: false },
  { to: '/backup', label: 'Respaldo', icon: 'backup', helper: 'Exportar o restaurar', end: false }
] as const

type NavigationIconName = (typeof navigationItems)[number]['icon']

function SidebarIcon({ name }: { name: NavigationIconName }) {
  switch (name) {
    case 'home':
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M4 10.5L12 4l8 6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M6.5 9.5V19h11V9.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M10 19v-4.5h4V19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      )
    case 'routines':
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M7 6.5h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M7 12h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M7 17.5h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <circle cx="4.5" cy="6.5" r="1.25" fill="currentColor" />
          <circle cx="4.5" cy="12" r="1.25" fill="currentColor" />
          <circle cx="4.5" cy="17.5" r="1.25" fill="currentColor" />
        </svg>
      )
    case 'history':
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M4.5 12a7.5 7.5 0 107.5-7.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M4.5 6v4.5H9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M12 8.25V12l2.75 1.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      )
    case 'analytics':
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M5 18.5h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M7.5 16V11.5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
          <path d="M12 16V8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
          <path d="M16.5 16V5.5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
      )
    case 'backup':
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M12 5v9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M8.75 10.75L12 14l3.25-3.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M5 18.5h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      )
  }
}

function RootLayout() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    mainRef.current?.focus()
  }, [location.pathname, location.search])

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!isSidebarOpen) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <button
        aria-controls="primary-sidebar"
        aria-expanded={isSidebarOpen}
        aria-label={isSidebarOpen ? 'Cerrar navegación' : 'Abrir navegación'}
        className={`sidebar-toggle${isSidebarOpen ? ' active' : ''}`}
        type="button"
        onClick={() => setIsSidebarOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      <div
        aria-hidden={!isSidebarOpen}
        className={`sidebar-backdrop${isSidebarOpen ? ' active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside aria-label="Navegación principal" className={`sidebar${isSidebarOpen ? ' open' : ''}`} id="primary-sidebar">
        <div className="sidebar__header">
          <span className="eyebrow">GymTracker</span>
          <button aria-label="Cerrar navegación" className="sidebar-close" type="button" onClick={() => setIsSidebarOpen(false)}>
            ×
          </button>
        </div>

        <div className="sidebar__copy">
          <strong>Todo el flujo en un solo lugar</strong>
          <p>Abrí el panel, navegá entre módulos y seguí entrenando sin pelearte con la interfaz.</p>
        </div>

        <nav className="sidebar-nav" aria-label="Secciones de la app">
          {navigationItems.map(({ to, label, icon, helper, end }) => (
            <NavLink key={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} to={to} end={end}>
              <span className="sidebar-link__icon" aria-hidden="true">
                <SidebarIcon name={icon} />
              </span>
              <span className="sidebar-link__content">
                <span className="sidebar-link__label">{label}</span>
                <span className="sidebar-link__helper">{helper}</span>
              </span>
              <span className="sidebar-link__chevron" aria-hidden="true">
                ›
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <span className="sidebar__footer-mark">Offline-first</span>
          <p>La navegación queda más limpia y el contenido recupera todo el ancho útil.</p>
        </div>
      </aside>

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
