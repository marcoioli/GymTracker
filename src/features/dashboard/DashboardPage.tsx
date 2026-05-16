import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { getSuggestedRoutineDay } from '../../domain/routines'
import type { WorkoutSession } from '../../domain/sessions'
import { db } from '../../db/database'
import { Button, Card, EmptyState, PageSection, StatusBanner } from '../../shared/ui'
import { getActiveRoutine } from '../routines/routinesRepository'
import { ConfirmWorkoutDayModal } from '../session/ConfirmWorkoutDayModal'
import { getWorkoutDayLabel } from '../session/sessionRepository'
import { TrackerWeekOverview } from './TrackerWeekOverview'

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
                <p className="eyebrow">Listo para entrenar</p>
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
              <TrackerHistoryCard key={session.id} navigate={navigate} session={session} />
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

function TrackerHistoryCard({ session, navigate }: { session: WorkoutSession; navigate: (path: string) => void }) {
  const setCount = session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)

  function handleClick() {
    navigate(`/history/${session.id}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`/history/${session.id}`)
    }
  }

  return (
    <Card
      aria-label={`Ver detalles de la sesión: ${formatSessionTitle(session)}`}
      as="article"
      className="tracker-history-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="listitem"
      tabIndex={0}
    >
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


