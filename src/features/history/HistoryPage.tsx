import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../../db/database'
import type { WorkoutSession } from '../../domain/sessions'
import { Button, Card, EmptyState, Field, FieldSelect, PageSection } from '../../shared/ui'

type SessionFilterOption = {
  key: string
  label: string
}

export function HistoryPage() {
  const routines = useLiveQuery(() => db.routines.toArray(), [], [])
  const sessions = useLiveQuery(() => db.sessions.orderBy('endedAt').reverse().toArray(), [], [])
  const [selectedRoutineId, setSelectedRoutineId] = useState('all')
  const [selectedDayKey, setSelectedDayKey] = useState('all')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  const routineOptions = useMemo(() => {
    const labels = new Map<string, string>()

    routines.forEach((routine) => labels.set(routine.id, routine.name))
    sessions.forEach((session) => labels.set(session.routineId, getSessionRoutineName(session, labels)))

    return Array.from(labels.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, label]) => ({ value, label }))
  }, [routines, sessions])

  const effectiveSelectedRoutineId = selectedRoutineId === 'all' || routineOptions.some((option) => option.value === selectedRoutineId) ? selectedRoutineId : 'all'

  const filteredByRoutine = useMemo(
    () => (effectiveSelectedRoutineId === 'all' ? sessions : sessions.filter((session) => session.routineId === effectiveSelectedRoutineId)),
    [effectiveSelectedRoutineId, sessions]
  )

  const dayOptions = useMemo<SessionFilterOption[]>(() => {
    const unique = new Map<string, string>()

    filteredByRoutine.forEach((session) => {
      const key = getSessionDayKey(session)

      unique.set(key, getSessionDayLabel(session))
    })

    return Array.from(unique.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([key, label]) => ({ key, label }))
  }, [filteredByRoutine])

  const effectiveSelectedDayKey = selectedDayKey === 'all' || dayOptions.some((option) => option.key === selectedDayKey) ? selectedDayKey : 'all'

  const filteredSessions = useMemo(
    () =>
      effectiveSelectedDayKey === 'all'
        ? filteredByRoutine
        : filteredByRoutine.filter((session) => getSessionDayKey(session) === effectiveSelectedDayKey),
    [effectiveSelectedDayKey, filteredByRoutine]
  )

  const effectiveSelectedSessionId =
    selectedSessionId && filteredSessions.some((session) => session.id === selectedSessionId) ? selectedSessionId : (filteredSessions[0]?.id ?? null)

  const selectedSession = filteredSessions.find((session) => session.id === effectiveSelectedSessionId) ?? null
  const routineLabels = useMemo(() => new Map(routineOptions.map((option) => [option.value, option.label])), [routineOptions])

  return (
    <>
      <PageSection
        description="Cada sesión queda congelada en este dispositivo. Si editás la rutina después, el historial NO se reescribe. Y eso está perfecto."
        title="Historial"
        titleId="history-title"
      >
        {sessions.length === 0 ? (
          <EmptyState
            className="history-empty"
            description="Entrená una vez y recién ahí vas a poder revisar el snapshot exacto de pesos, reps y volumen guardado localmente."
            title="Todavía no guardaste sesiones"
          />
        ) : (
          <div className="history-filter-grid">
            <Field label="Rutina">
              <FieldSelect value={effectiveSelectedRoutineId} onChange={(event) => setSelectedRoutineId(event.target.value)}>
                <option value="all">Todas</option>
                {routineOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FieldSelect>
            </Field>

            <Field label="Día guardado">
              <FieldSelect value={effectiveSelectedDayKey} onChange={(event) => setSelectedDayKey(event.target.value)}>
                <option value="all">Todos</option>
                {dayOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </FieldSelect>
            </Field>
          </div>
        )}
      </PageSection>

      {filteredSessions.length > 0 ? (
        <PageSection
          description="Elegí una sesión para revisar pesos, reps y volumen tal como quedaron grabados en ese momento."
          title={`Sesiones encontradas: ${filteredSessions.length}`}
          titleId="history-session-list-title"
        >
          <div className="history-layout">
            <div className="history-session-list" role="list" aria-label="Sesiones guardadas">
              {filteredSessions.map((session) => {
                const isSelected = session.id === effectiveSelectedSessionId

                return (
                  <Card className={`history-session-card${isSelected ? ' history-session-card--selected' : ''}`} key={session.id} role="listitem">
                    <div className="history-session-card__header">
                      <div>
                        <div className={`status-pill status-pill--${session.status === 'completed' ? 'active' : 'paused'}`}>
                          {session.status === 'completed' ? 'Completada' : 'Terminada antes'}
                        </div>
                        <h3 className="routine-card-title">{getSessionRoutineName(session, routineLabels)}</h3>
                        <p className="routine-summary">{getSessionDayLabel(session)}</p>
                      </div>
                      <Button variant="ghost" onClick={() => setSelectedSessionId(session.id)}>
                        {isSelected ? 'Viendo detalle' : 'Ver detalle'}
                      </Button>
                    </div>

                    <div className="history-session-meta">
                      <span>{formatSessionDate(session.endedAt)}</span>
                      <span>{session.exercises.length} ejercicios</span>
                      <span>{session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)} series</span>
                    </div>
                  </Card>
                )
              })}
            </div>

            {selectedSession ? <SessionDetail session={selectedSession} routineLabels={routineLabels} /> : null}
          </div>
        </PageSection>
      ) : null}
    </>
  )
}

function SessionDetail({
  session,
  routineLabels
}: {
  session: WorkoutSession
  routineLabels: Map<string, string>
}) {
  return (
    <Card as="section" className="history-detail-card" aria-labelledby="history-detail-title">
      <div className="history-detail-header">
        <div>
          <p className="eyebrow">Snapshot congelado</p>
          <h3 className="section-title" id="history-detail-title">
            {getSessionRoutineName(session, routineLabels)}
          </h3>
          <p className="empty-note">{getSessionDayLabel(session)} · {formatSessionDate(session.endedAt)}</p>
        </div>
        <div className={`status-pill status-pill--${session.status === 'completed' ? 'active' : 'paused'}`}>
          {session.status === 'completed' ? 'Completada' : 'Terminada antes'}
        </div>
      </div>

      <p className="history-detail-note">Este detalle sale del snapshot guardado. No depende de cómo esté editada hoy la plantilla.</p>

      <div className="history-exercise-stack">
        {session.exercises.map((exercise) => (
          <Card className="history-exercise-card" key={exercise.id}>
            <div className="session-exercise-card__header">
              <div>
                <h4 className="routine-card-title">{exercise.exerciseName}</h4>
                <p className="routine-summary">
                  {exercise.targetSets} series {exercise.targetRir !== null ? `· objetivo RIR ${exercise.targetRir}` : ''}
                </p>
              </div>
              <strong className="history-volume-chip">{formatVolume(exercise.sets)}</strong>
            </div>

            <div className="history-set-stack">
              {exercise.sets.map((set) => (
                <div className="history-set-row" key={set.id}>
                  <span>Serie {set.setNumber}</span>
                  <span>{set.reps ?? '—'} reps</span>
                  <span>{set.weightKg ?? '—'} kg</span>
                  <span>RIR {set.actualRir ?? '—'}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Card>
  )
}

function getSessionRoutineName(session: WorkoutSession, routineLabels: Map<string, string>): string {
  return session.routineName ?? routineLabels.get(session.routineId) ?? 'Rutina archivada'
}

function getSessionDayLabel(session: WorkoutSession): string {
  const weekLabel = session.weekLabel ?? `Semana ${session.weekIndex + 1}`

  return `${weekLabel} · ${session.dayLabel ?? 'Día guardado'}`
}

function getSessionDayKey(session: WorkoutSession): string {
  return `${session.weekIndex}:${session.dayId}:${session.weekLabel ?? ''}:${session.dayLabel ?? ''}`
}

function formatSessionDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

function formatVolume(sets: WorkoutSession['exercises'][number]['sets']): string {
  const totalVolume = sets.reduce((total, set) => total + (set.reps !== null && set.weightKg !== null ? set.reps * set.weightKg : 0), 0)

  return `${totalVolume.toFixed(0)} kg volumen`
}
