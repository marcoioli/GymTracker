import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { db } from '../../db/database'
import { getSessionExerciseMilestones } from '../../domain/analytics'
import { Button, Card, EmptyState, PageSection, StatusBanner } from '../../shared/ui'
import {
  buildHistorySearchParams,
  formatSessionDate,
  formatVolume,
  getSessionDurationLabel,
  getSessionRoutineName,
  getSessionSetCount,
  getSessionWeekLabel,
  getSessionWorkoutTitle,
  parseRangeFilter
} from './historyShared'

export function HistorySessionDetailPage() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const selectedRange = parseRangeFilter(searchParams.get('range'))
  const selectedRoutineId = searchParams.get('routineId') ?? 'all'
  const selectedDayKey = searchParams.get('dayKey') ?? 'all'

  const sessionRecord = useLiveQuery(
    async () => {
      if (!sessionId) {
        return { session: null, sessions: [] }
      }

      const [session, sessions] = await Promise.all([db.sessions.get(sessionId), db.sessions.toArray()])

      return {
        session: session ?? null,
        sessions
      }
    },
    [sessionId],
    undefined
  )
  const routines = useLiveQuery(() => db.routines.toArray(), [], [])

  const routineLabels = useMemo(() => new Map(routines.map((routine) => [routine.id, routine.name])), [routines])
  const exerciseMilestones = useMemo(
    () => (sessionRecord?.session ? getSessionExerciseMilestones(sessionRecord.sessions, sessionRecord.session) : {}),
    [sessionRecord]
  )

  const backSearch = useMemo(
    () =>
      buildHistorySearchParams({
        range: selectedRange,
        routineId: selectedRoutineId,
        dayKey: selectedDayKey
      }).toString(),
    [selectedDayKey, selectedRange, selectedRoutineId]
  )

  function goBackToHistory() {
    navigate(`/history${backSearch ? `?${backSearch}` : ''}`)
  }

  if (sessionRecord === undefined) {
    return (
      <PageSection description="Buscando el snapshot de la sesión elegida." eyebrow="History" title="Cargando detalle" titleId="history-session-loading-title">
        <StatusBanner tone="info">Estamos recuperando el entrenamiento guardado.</StatusBanner>
      </PageSection>
    )
  }

  if (!sessionRecord.session) {
    return (
      <PageSection description="Ese detalle ya no existe en la base local o el enlace quedó viejo." eyebrow="History" title="Sesión no encontrada" titleId="history-session-missing-title">
        <EmptyState
          className="history-empty"
          description="Volvé al historial y abrí otra sesión guardada. Si restauraste un backup raro, puede que el ID ya no exista."
          title="No encontramos este entrenamiento"
        />
        <Button variant="secondary" onClick={goBackToHistory}>
          Volver al historial
        </Button>
      </PageSection>
    )
  }

  const session = sessionRecord.session
  const totalVolume = session.exercises.reduce(
    (total, exercise) => total + exercise.sets.reduce((exerciseTotal, set) => exerciseTotal + (set.reps !== null && set.weightKg !== null ? set.reps * set.weightKg : 0), 0),
    0
  )

  return (
    <PageSection
      actions={
        <Button size="compact" variant="ghost" onClick={goBackToHistory}>
          Volver
        </Button>
      }
      description={`${getSessionWeekLabel(session)} · ${getSessionRoutineName(session, routineLabels)}`}
      eyebrow="History Detail"
      title={getSessionWorkoutTitle(session)}
      titleId="history-session-detail-title"
    >
      <Card as="section" className="history-detail-screen" aria-labelledby="history-session-detail-title">
        <div className="history-detail-screen__hero">
          <div className="history-detail-screen__hero-copy">
            <p className="eyebrow">Snapshot congelado</p>
            <h3 className="section-title">{getSessionWorkoutTitle(session)}</h3>
            <p className="history-detail-screen__subtitle">{getSessionWeekLabel(session)} · {getSessionRoutineName(session, routineLabels)}</p>
            <p className="history-detail-screen__meta">{formatSessionDate(session.endedAt)}</p>
          </div>

          <div className={`status-pill status-pill--${session.status === 'completed' ? 'active' : 'paused'}`}>
            {session.status === 'completed' ? 'Completada' : 'Terminada antes'}
          </div>
        </div>

        <div className="history-detail-screen__stats" aria-label="Resumen de la sesión">
          <DetailStat label="Duración" value={getSessionDurationLabel(session)} />
          <DetailStat label="Volumen" value={`${Math.round(totalVolume).toLocaleString('es-AR')} kg`} />
          <DetailStat label="Series" value={`${getSessionSetCount(session)}`} />
        </div>

        <p className="history-detail-note">Este detalle sale del snapshot guardado en el momento real del entrenamiento. Si la rutina cambió después, acá igual ves lo que pasó ese día.</p>

        <div className="history-detail-screen__section-heading">
          <h4>Exercises</h4>
          <span>{getSessionSetCount(session)} sets</span>
        </div>

        <div className="history-exercise-stack">
          {session.exercises.map((exercise) => {
            const milestone = exerciseMilestones[exercise.id]

            return (
              <Card className="history-exercise-card history-exercise-card--detail" key={exercise.id}>
                <div className="session-exercise-card__header">
                  <div>
                    <h4 className="routine-card-title">{exercise.exerciseName}</h4>
                    {milestone?.hitBestWeight || milestone?.hitBestSet ? (
                      <div className="record-badge-row" aria-label={`Hitos históricos de ${exercise.exerciseName}`}>
                        {milestone.hitBestWeight ? <span className="record-badge record-badge--weight">Mejor peso</span> : null}
                        {milestone.hitBestSet ? <span className="record-badge record-badge--set">Mejor serie</span> : null}
                      </div>
                    ) : null}
                    <p className="routine-summary">
                      {exercise.targetSets} series {exercise.targetRir !== null ? `· objetivo RIR ${exercise.targetRir}` : ''}
                    </p>
                  </div>
                  <strong className="history-volume-chip">{formatVolume(exercise.sets)}</strong>
                </div>

                <div className="history-set-stack history-set-stack--detail">
                  {exercise.sets.map((set) => {
                    const hitsBestWeight = milestone?.bestWeightSetIds.includes(set.id) ?? false
                    const hitsBestSet = milestone?.bestSetSetIds.includes(set.id) ?? false

                    return (
                      <div className="history-set-row history-set-row--detail" key={set.id}>
                        <span className="history-set-row__index">{set.setNumber}</span>
                        <span className="history-set-row__summary">
                          {set.weightKg ?? '—'} kg, {set.reps ?? '—'} reps, RIR {set.actualRir ?? '—'}
                        </span>
                        {hitsBestWeight || hitsBestSet ? (
                          <div className="record-badge-row record-badge-row--detail" aria-label={`Hitos de la serie ${set.setNumber}`}>
                            {hitsBestWeight ? <span className="record-badge record-badge--weight">Mejor peso</span> : null}
                            {hitsBestSet ? <span className="record-badge record-badge--set">Mejor serie</span> : null}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      </Card>
    </PageSection>
  )
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="history-detail-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}
