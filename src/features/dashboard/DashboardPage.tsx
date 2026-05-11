import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { getSessionVolume } from '../../domain/analytics'
import { getSuggestedRoutineDay } from '../../domain/routines'
import type { WorkoutSession } from '../../domain/sessions'
import { db } from '../../db/database'
import { Button, Card, EmptyState, PageSection, StatusBanner } from '../../shared/ui'
import { getActiveRoutine } from '../routines/routinesRepository'
import { ConfirmWorkoutDayModal } from '../session/ConfirmWorkoutDayModal'
import { getWorkoutDayLabel } from '../session/sessionRepository'

const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires'

export function DashboardPage() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const activeRoutine = useLiveQuery(() => getActiveRoutine(), [], undefined)
  const sessions = useLiveQuery(() => db.sessions.orderBy('endedAt').reverse().toArray(), [], [])
  const suggestedDay = activeRoutine ? getSuggestedRoutineDay(activeRoutine) : null
  const sessionSaved = searchParams.get('sessionSaved')

  const sessionSavedMessage = useMemo(() => {
    if (sessionSaved === 'completed') {
      return 'Sesión finalizada y guardada. El historial ya quedó actualizado.'
    }

    if (sessionSaved === 'ended-early') {
      return 'Sesión guardada como terminada antes. El snapshot quedó disponible.'
    }

    return null
  }, [sessionSaved])

  return (
    <>
      <PageSection title={<span className="sr-only">Tracker</span>} titleId="tracker-title">
        {sessionSavedMessage ? <StatusBanner tone="success">{sessionSavedMessage}</StatusBanner> : null}

        <TrackerWeekOverview />

        {activeRoutine && suggestedDay ? (
          <Card as="article" className="tracker-focus-card" variant="highlight">
            <div className="tracker-focus-card__header">
              <div>
                <p className="eyebrow">Ready to train</p>
                <h3 className="routine-card-title">{suggestedDay.day.label}</h3>
                <p className="routine-summary">
                  {activeRoutine.name} · {getWorkoutDayLabel(suggestedDay)}
                </p>
              </div>
              <span className="tracker-focus-card__badge">{suggestedDay.day.exercises.length} ejercicios</span>
            </div>

            <div className="tracker-focus-card__stats">
              <TrackerMiniStat label="Series" value={`${suggestedDay.day.exercises.reduce((total, exercise) => total + exercise.targetSets, 0)}`} />
              <TrackerMiniStat label="Última vez" value={formatLastCompleted(activeRoutine.progress.lastCompletedAt)} />
            </div>

            <div className="tracker-focus-card__actions">
              <Button fullWidth size="touch" onClick={() => setIsModalOpen(true)}>
                Iniciar rutina
              </Button>
              <Button fullWidth size="touch" variant="ghost" onClick={() => navigate('/routines')}>
                Ver rutina
              </Button>
            </div>
          </Card>
        ) : null}

        <div className="tracker-section-heading">
          <h3>Historial de entrenamientos</h3>
          {sessions.length > 0 ? (
            <Button size="compact" variant="ghost" onClick={() => navigate('/history')}>
              Ver todo
            </Button>
          ) : null}
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            className="history-empty"
            description="Cuando guardes tu primera sesión, este tracker va a empezar a parecerse al diseño de verdad: historial real, no maquillaje." 
            title="Todavía no hay entrenamientos"
          />
        ) : (
          <div className="tracker-history-stack" role="list" aria-label="Historial reciente de entrenamientos">
            {sessions.slice(0, 8).map((session) => (
              <TrackerHistoryCard key={session.id} session={session} />
            ))}
          </div>
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

function TrackerWeekOverview() {
  const today = new Date()
  const currentDayLabel = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: ARGENTINA_TIME_ZONE
  }).format(today)

  const monday = getWeekMonday(today)
  const todayKey = formatArgentinaDateKey(today)
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday)
    current.setDate(monday.getDate() + index)
    const isToday = formatArgentinaDateKey(current) === todayKey

    return {
      id: formatArgentinaDateKey(current),
      isToday,
      letter: new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: ARGENTINA_TIME_ZONE }).format(current).slice(0, 1).toUpperCase(),
      dayNumber: new Intl.DateTimeFormat('es-AR', { day: 'numeric', timeZone: ARGENTINA_TIME_ZONE }).format(current)
    }
  })

  return (
    <Card as="article" className="tracker-week-overview">
      <div className="tracker-week-overview__header">
        <div>
          <p className="eyebrow">Semana actual</p>
          <h3 className="routine-card-title">{capitalize(currentDayLabel)}</h3>
        </div>
        <span className="tracker-week-overview__today-pill">Hoy</span>
      </div>

      <div className="tracker-week-overview__days" aria-label="Días de la semana actual">
        {weekDays.map((day) => (
          <div className={`tracker-week-overview__day${day.isToday ? ' is-today' : ''}`} key={day.id}>
            <span>{day.letter}</span>
            <strong>{day.dayNumber}</strong>
          </div>
        ))}
      </div>
    </Card>
  )
}

function TrackerHistoryCard({ session }: { session: WorkoutSession }) {
  const setCount = session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)

  return (
    <Card as="article" className="tracker-history-card" role="listitem">
      <div className="tracker-history-card__header">
        <div>
          <h3 className="routine-card-title">{formatSessionTitle(session)}</h3>
          <p className="routine-summary">{session.routineName ?? 'Tracked Workout'}</p>
        </div>
        <span aria-hidden="true" className="tracker-history-card__menu">
          •••
        </span>
      </div>

      <p className="tracker-history-card__preview">{formatExercisePreview(session)}</p>

      <div className="tracker-history-card__metrics" aria-label="Resumen de la sesión">
        <TrackerMetric label="Sets Logged" value={`${setCount}`} />
        <TrackerMetric label="Duration" value={formatDuration(session.startedAt, session.endedAt)} />
        <TrackerMetric accent label="Volume" value={`${Math.round(getSessionVolume(session)).toLocaleString('es-AR')} kg`} />
      </div>
    </Card>
  )
}

function TrackerMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="tracker-mini-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function TrackerMetric({ accent = false, label, value }: { accent?: boolean; label: string; value: string }) {
  return (
    <div className={`tracker-metric${accent ? ' tracker-metric--accent' : ''}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function formatDuration(startedAt: string, endedAt: string) {
  const diffMs = Math.max(new Date(endedAt).getTime() - new Date(startedAt).getTime(), 0)
  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function formatSessionTitle(session: WorkoutSession) {
  const label = session.dayLabel ?? 'Workout'
  const date = new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit'
  }).format(new Date(session.endedAt))

  return `${label} ${date}`
}

function formatExercisePreview(session: WorkoutSession) {
  return session.exercises.slice(0, 4).map((exercise) => exercise.exerciseName).join(', ')
}

function formatLastCompleted(value?: string | null) {
  if (!value) {
    return 'Nunca'
  }

  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(value))
}

function getWeekMonday(anchor: Date): Date {
  const current = new Date(anchor)
  current.setHours(12, 0, 0, 0)
  const day = getArgentinaWeekdayIndex(current)
  const diff = day === 0 ? -6 : 1 - day
  current.setDate(current.getDate() + diff)
  return current
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatArgentinaDateKey(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(value)
}

function getArgentinaWeekdayIndex(value: Date) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: ARGENTINA_TIME_ZONE,
    weekday: 'short'
  }).format(value)

  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday)
}
