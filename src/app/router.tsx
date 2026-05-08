import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { createBrowserRouter, NavLink, Outlet, RouterProvider, useLocation, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { DashboardPage } from '../features/dashboard/DashboardPage'
import { MorePage } from '../features/more/MorePage'
import { RoutinesPage } from '../features/routines/RoutinesPage'
import { getSuggestedWorkoutDay } from '../features/session/sessionRepository'
import { WorkoutSessionScreen } from '../features/session/WorkoutSessionScreen'
import { PageSection, StatusBanner } from '../shared/ui'

import { AppRouteErrorBoundary, NotFoundPage } from './error-boundary'
import { AppStatusDeck } from './pwa-runtime'

const HistoryPage = lazy(async () => ({ default: (await import('../features/history/HistoryPage')).HistoryPage }))
const AnalyticsPage = lazy(async () => ({ default: (await import('../features/analytics/AnalyticsPage')).AnalyticsPage }))
const BackupPage = lazy(async () => ({ default: (await import('../features/backup/BackupPage')).BackupPage }))

const navigationItems = [
  { to: '/', label: 'Inicio', icon: 'home' },
  { to: '/routines', label: 'Rutinas', icon: 'routines' },
  { to: '/history', label: 'Historial', icon: 'history' },
  { to: '/more', label: 'Más', icon: 'more' }
] as const

type NavigationIconName = (typeof navigationItems)[number]['icon']

function NavigationIcon({ name }: { name: NavigationIconName }) {
  switch (name) {
    case 'home':
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M4.5 10.5L12 4.5l7.5 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M6.5 10V19h11v-9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M10 19v-4.25h4V19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      )
    case 'routines':
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M7 6.5h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M7 12h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M7 17.5h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <circle cx="4.5" cy="6.5" r="1.15" fill="currentColor" />
          <circle cx="4.5" cy="12" r="1.15" fill="currentColor" />
          <circle cx="4.5" cy="17.5" r="1.15" fill="currentColor" />
        </svg>
      )
    case 'history':
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M4.5 12A7.5 7.5 0 1012 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M4.5 6v4.5H9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          <path d="M12 8v4l2.75 1.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      )
    case 'more':
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M5 7.5h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          <path d="M5 16.5h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      )
  }
}

function RootLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const mainRef = useRef<HTMLElement | null>(null)
  const suggestedWorkout = useLiveQuery(() => getSuggestedWorkoutDay(), [], undefined)

  useEffect(() => {
    mainRef.current?.focus()
  }, [location.pathname, location.search])

  const fabCopy = useMemo(() => {
    if (suggestedWorkout?.routine && suggestedWorkout.suggestion) {
      return {
        helper: suggestedWorkout.suggestion.day.label,
        label: 'Iniciar rutina rápida'
      }
    }

    return {
      helper: 'Rutinas',
      label: 'Ir a rutinas'
    }
  }, [suggestedWorkout])

  function handleQuickStart() {
    if (suggestedWorkout?.routine && suggestedWorkout.suggestion) {
      navigate(
        `/session/${suggestedWorkout.routine.id}/${suggestedWorkout.suggestion.weekIndex}/${suggestedWorkout.suggestion.day.id}?startedAt=${encodeURIComponent(new Date().toISOString())}`
      )
      return
    }

    navigate('/routines')
  }

  return (
    <div className="app-shell app-shell--mobile">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>

      <AppStatusDeck />

      <main className="app-main app-main--mobile" id="main-content" ref={mainRef} tabIndex={-1}>
        <Suspense fallback={<RouteLoadingState />}>
          <Outlet />
        </Suspense>
      </main>

      <button aria-label={fabCopy.label} className="quick-action-fab" type="button" onClick={handleQuickStart}>
        <span className="quick-action-fab__plus" aria-hidden="true">
          +
        </span>
        <span className="quick-action-fab__label">{fabCopy.helper}</span>
      </button>

      <nav aria-label="Navegación principal" className="bottom-nav">
        {navigationItems.map(({ to, label, icon }) => {
          const isActive =
            to === '/'
              ? location.pathname === '/'
              : to === '/more'
                ? location.pathname === '/more' || location.pathname.startsWith('/analytics') || location.pathname.startsWith('/backup')
                : location.pathname.startsWith(to)

          return (
            <NavLink key={to} className={`bottom-nav__item${isActive ? ' active' : ''}`} to={to} end={to === '/'}>
              <span className="bottom-nav__icon" aria-hidden="true">
                <NavigationIcon name={icon} />
              </span>
              <span className="bottom-nav__label">{label}</span>
            </NavLink>
          )
        })}
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
        path: 'more',
        element: <MorePage />
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
      <StatusBanner tone="info">La app está abriendo el módulo sin romper el flujo mobile principal.</StatusBanner>
    </PageSection>
  )
}
