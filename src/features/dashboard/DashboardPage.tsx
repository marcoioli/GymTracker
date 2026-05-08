import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { getCurrentWeekFrequencySummary, getSessionVolume, getWeeklyVolumeSummaries } from '../../domain/analytics'
import { getSuggestedRoutineDay, type Routine } from '../../domain/routines'
import type { WorkoutSession } from '../../domain/sessions'
import { db } from '../../db/database'
import { Button, Card, EmptyState, PageSection, StatusBanner } from '../../shared/ui'
import { getActiveRoutine } from '../routines/routinesRepository'
import { ConfirmWorkoutDayModal } from '../session/ConfirmWorkoutDayModal'
import { getWorkoutDayLabel } from '../session/sessionRepository'

type WeekDayOverview = {
  dateKey: string
  dayLetter: string
  dayNumber: string
  completed: boolean
  isToday: boolean
  volume: number
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const activeRoutine = useLiveQuery(() => getActiveRoutine(), [], undefined)
  const sessions = useLiveQuery(() => db.sessions.orderBy('endedAt').reverse().toArray(), [], [])
  const suggestedDay = activeRoutine ? getSuggestedRoutineDay(activeRoutine) : null
  const sessionSaved = searchParams.get('sessionSaved')

  const weekOverview = useMemo(() => buildWeekOverview(sessions), [sessions])
  const latestSession = sessions[0] ?? null
  const monthlyDays = getMonthTrainingDays(sessions)
  const streak = getCurrentStreak(sessions)
  const weeklyFrequency = getCurrentWeekFrequencySummary(sessions)
  const weeklyVolume = getWeeklyVolumeSummaries(sessions, 1)[0]?.totalVolume ?? 0
  const sessionSavedMessage = useMemo(() => {
    if (sessionSaved === 'completed') {
      return 'Sesión finalizada y guardada. El historial y las métricas ya reflejan este entrenamiento.'
    }

    if (sessionSaved === 'ended-early') {
      return 'Sesión guardada como terminada antes. El snapshot quedó disponible en tu historial.'
    }

    return null
  }, [sessionSaved])

  return (
    <>
      <PageSection
        description="Entendé en segundos qué día es, qué rutina toca y cómo venís entrenando, sin romper el flujo de gimnasio."
        eyebrow="Inicio"
        title={<DashboardHeroTitle />}
        titleId="home-summary-title"
      >
        {sessionSavedMessage ? <StatusBanner tone="success">{sessionSavedMessage}</StatusBanner> : null}

        <div className="week-strip" aria-label="Actividad de la semana actual">
          {weekOverview.map((day) => (
            <div className={`week-strip__day${day.isToday ? ' is-today' : ''}${day.completed ? ' is-completed' : ''}`} key={day.dateKey}>
              <span>{day.dayLetter}</span>
              <strong>{day.dayNumber}</strong>
              <small>{day.completed ? '●' : '·'}</small>
            </div>
          ))}
        </div>

        {activeRoutine && suggestedDay ? (
          <Card as="article" className="today-routine-card" variant="highlight">
            <div className="today-routine-card__header">
              <div>
                <p className="eyebrow">Rutina de hoy</p>
                <h3 className="routine-card-title">{suggestedDay.day.label}</h3>
                <p className="routine-summary">{activeRoutine.name} · {getWorkoutDayLabel(suggestedDay)}</p>
              </div>
              <span className="status-pill status-pill--highlight">Lista para arrancar</span>
            </div>

            <div className="stats-inline-grid">
              <StatInline label="Ejercicios" value={`${suggestedDay.day.exercises.length}`} />
              <StatInline label="Series" value={`${suggestedDay.day.exercises.reduce((total, exercise) => total + exercise.targetSets, 0)}`} />
              <StatInline label="Última vez" value={formatLastCompleted(activeRoutine)} />
            </div>

            <div className="today-routine-card__actions">
              <Button fullWidth size="touch" onClick={() => setIsModalOpen(true)}>
                Iniciar rutina
              </Button>
              <Button fullWidth size="touch" variant="secondary" onClick={() => navigate('/routines')}>
                Ver detalle
              </Button>
            </div>
          </Card>
        ) : activeRoutine ? (
          <EmptyState
            className="dashboard-highlight-card"
            description="La rutina activa todavía no tiene un día entrenable. Dejá al menos un ejercicio real cargado para destrabar el inicio rápido."
            title="Falta un día usable"
          />
        ) : (
          <EmptyState
            className="dashboard-highlight-card"
            description="Primero necesitás crear o activar una rutina. Recién ahí la Home puede decirte qué toca hoy con honestidad."
            title="Todavía no hay rutina activa"
          />
        )}
      </PageSection>

      <PageSection title="Resumen rápido" titleId="kpis-title">
        <div className="kpi-grid dashboard-kpi-grid">
          <KpiCard label="Días este mes" value={`${monthlyDays}`} />
          <KpiCard label="Racha" value={`${streak} días`} />
          <KpiCard label="Sesiones semana" value={`${weeklyFrequency.sessionCount}`} />
          <KpiCard label="Volumen semana" value={`${Math.round(weeklyVolume).toLocaleString('es-AR')} kg`} />
        </div>
      </PageSection>

      {latestSession ? (
        <PageSection title="Último entrenamiento" titleId="latest-workout-title">
          <Card as="article" className="latest-workout-card">
            <div className="latest-workout-card__header">
              <div>
                <h3 className="routine-card-title">{latestSession.routineName ?? 'Rutina guardada'}</h3>
                <p className="routine-summary">{latestSession.weekLabel ?? `Semana ${latestSession.weekIndex + 1}`} · {latestSession.dayLabel ?? 'Día guardado'}</p>
              </div>
              <span className="status-pill status-pill--active">{latestSession.status === 'completed' ? 'Completada' : 'Terminada antes'}</span>
            </div>

            <div className="stats-inline-grid stats-inline-grid--wide">
              <StatInline label="Duración" value={formatDuration(latestSession.startedAt, latestSession.endedAt)} />
              <StatInline label="Series" value={`${latestSession.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)}`} />
              <StatInline label="Volumen" value={`${Math.round(getSessionVolume(latestSession)).toLocaleString('es-AR')} kg`} />
            </div>
          </Card>
        </PageSection>
      ) : null}

      <PageSection title="Actividad semanal" titleId="activity-week-title">
        {sessions.length === 0 ? (
          <EmptyState
            description="Apenas guardes entrenamientos, acá vas a ver el ritmo semanal real de la app."
            title="Todavía no hay actividad registrada"
          />
        ) : (
          <Card as="article" className="activity-chart-card">
            <div className="activity-chart">
              {weekOverview.map((day) => {
                const maxVolume = Math.max(...weekOverview.map((entry) => entry.volume), 1)
                const height = Math.max(10, Math.round((day.volume / maxVolume) * 100))

                return (
                  <div className="activity-chart__bar-group" key={day.dateKey}>
                    <span className="activity-chart__bar" style={{ height: `${height}%` }} />
                    <strong>{day.dayLetter}</strong>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </PageSection>

      {activeRoutine && isModalOpen ? (
        <ConfirmWorkoutDayModal
          key={`${activeRoutine.id}:${activeRoutine.progress.currentWeekIndex}:${activeRoutine.progress.lastCompletedDayId ?? 'none'}`}
          routine={activeRoutine}
          onClose={() => setIsModalOpen(false)}
          onConfirm={({ weekIndex, dayId }) => {
            setIsModalOpen(false)
            navigate(`/session/${activeRoutine.id}/${weekIndex}/${dayId}?startedAt=${encodeURIComponent(new Date().toISOString())}`)
          }}
        />
      ) : null}
    </>
  )
}

function DashboardHeroTitle() {
  const today = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date())

  return (
    <div className="dashboard-hero-title">
      <span>Hola</span>
      <small>{capitalize(today)}</small>
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card as="article" className="kpi-card dashboard-kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </Card>
  )
}

function StatInline({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-inline-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function buildWeekOverview(sessions: WorkoutSession[]): WeekDayOverview[] {
  const today = new Date()
  const monday = getWeekMonday(today)
  const grouped = sessions.reduce<Map<string, number>>((map, session) => {
    const key = session.endedAt.slice(0, 10)
    const current = map.get(key) ?? 0
    map.set(key, current + getSessionVolume(session))
    return map
  }, new Map())

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday)
    current.setUTCDate(monday.getUTCDate() + index)
    const dateKey = current.toISOString().slice(0, 10)

    return {
      dateKey,
      dayLetter: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][index],
      dayNumber: new Intl.DateTimeFormat('es-AR', { day: 'numeric' }).format(current),
      completed: grouped.has(dateKey),
      isToday: dateKey === new Date().toISOString().slice(0, 10),
      volume: grouped.get(dateKey) ?? 0
    }
  })
}

function getWeekMonday(anchor: Date): Date {
  const current = new Date(Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()))
  const day = current.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  current.setUTCDate(current.getUTCDate() + diff)
  return current
}

function getMonthTrainingDays(sessions: WorkoutSession[]): number {
  const now = new Date()
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return new Set(sessions.map((session) => session.endedAt.slice(0, 10)).filter((day) => day.startsWith(prefix))).size
}

function getCurrentStreak(sessions: WorkoutSession[]): number {
  const uniqueDays = Array.from(new Set(sessions.map((session) => session.endedAt.slice(0, 10)))).sort((a, b) => b.localeCompare(a))

  if (uniqueDays.length === 0) {
    return 0
  }

  let streak = 0
  let expectedDate = new Date(`${uniqueDays[0]}T00:00:00.000Z`)

  for (const day of uniqueDays) {
    const current = new Date(`${day}T00:00:00.000Z`)
    if (current.toISOString().slice(0, 10) !== expectedDate.toISOString().slice(0, 10)) {
      break
    }

    streak += 1
    expectedDate.setUTCDate(expectedDate.getUTCDate() - 1)
  }

  return streak
}

function formatLastCompleted(routine: Routine): string {
  if (!routine.progress.lastCompletedAt) {
    return 'Sin registro'
  }

  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(routine.progress.lastCompletedAt))
}

function formatDuration(startedAt: string, endedAt: string): string {
  const durationMs = Math.max(new Date(endedAt).getTime() - new Date(startedAt).getTime(), 0)
  const totalMinutes = Math.round(durationMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  return `${hours}h ${String(minutes).padStart(2, '0')}m`
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
