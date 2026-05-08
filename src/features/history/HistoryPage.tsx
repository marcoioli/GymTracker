import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { getSessionVolume } from '../../domain/analytics'
import { db } from '../../db/database'
import type { WorkoutSession } from '../../domain/sessions'
import { Button, Card, EmptyState, Field, FieldSelect, PageSection } from '../../shared/ui'

type SessionFilterOption = {
  key: string
  label: string
}

type RangeFilter = 'all' | 'week' | 'month'

export function HistoryPage() {
  const routines = useLiveQuery(() => db.routines.toArray(), [], [])
  const sessions = useLiveQuery(() => db.sessions.orderBy('endedAt').reverse().toArray(), [], [])
  const [selectedRoutineId, setSelectedRoutineId] = useState('all')
  const [selectedDayKey, setSelectedDayKey] = useState('all')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>('all')

  const rangeFilteredSessions = useMemo(() => filterSessionsByRange(sessions, rangeFilter), [rangeFilter, sessions])

  const routineOptions = useMemo(() => {
    const labels = new Map<string, string>()

    routines.forEach((routine) => labels.set(routine.id, routine.name))
    rangeFilteredSessions.forEach((session) => labels.set(session.routineId, getSessionRoutineName(session, labels)))

    return Array.from(labels.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, label]) => ({ value, label }))
  }, [rangeFilteredSessions, routines])

  const effectiveSelectedRoutineId = selectedRoutineId === 'all' || routineOptions.some((option) => option.value === selectedRoutineId) ? selectedRoutineId : 'all'

  const filteredByRoutine = useMemo(
    () => (effectiveSelectedRoutineId === 'all' ? rangeFilteredSessions : rangeFilteredSessions.filter((session) => session.routineId === effectiveSelectedRoutineId)),
    [effectiveSelectedRoutineId, rangeFilteredSessions]
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
  const summary = useMemo(() => buildSummary(filteredSessions), [filteredSessions])

  return (
    <>
      <PageSection
        description="Revisá sesiones guardadas como snapshots reales. Si la plantilla cambió después, el historial NO se reescribe, y así tiene que ser."
        eyebrow="Historial"
        title="Tus entrenamientos guardados"
        titleId="history-title"
      >
        {sessions.length === 0 ? (
          <EmptyState
            className="history-empty"
            description="Entrená una vez y recién ahí vas a poder revisar pesos, reps, duración y volumen congelados en el momento real de la sesión."
            title="Todavía no guardaste sesiones"
          />
        ) : (
          <>
            <div className="filter-chip-row" role="tablist" aria-label="Filtros rápidos de historial">
              {[
                { key: 'all', label: 'Todo' },
                { key: 'week', label: 'Esta semana' },
                { key: 'month', label: 'Este mes' }
              ].map((item) => (
                <button
                  key={item.key}
                  aria-selected={rangeFilter === item.key}
                  className={`filter-chip${rangeFilter === item.key ? ' active' : ''}`}
                  role="tab"
                  type="button"
                  onClick={() => setRangeFilter(item.key as RangeFilter)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <Card as="article" className="history-summary-card" variant="highlight">
              <div className="stats-inline-grid stats-inline-grid--wide">
                <StatInline label="Entrenamientos" value={`${summary.sessionCount}`} />
                <StatInline label="Duración total" value={summary.totalDuration} />
                <StatInline label="Volumen" value={summary.totalVolume} />
              </div>
            </Card>

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
          </>
        )}
      </PageSection>

      {filteredSessions.length > 0 ? (
        <PageSection
          description="Elegí una sesión para revisar el snapshot exacto que quedó guardado en ese momento."
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

                    <div className="history-session-meta history-session-meta--compact">
                      <span>{formatSessionDate(session.endedAt)}</span>
                      <span>{session.exercises.length} ejercicios</span>
                      <span>{session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)} series</span>
                    </div>

                    <div className="history-preview-tags" aria-label="Ejercicios principales de la sesión">
                      {session.exercises.slice(0, 3).map((exercise) => (
                        <span className="history-preview-tag" key={`${session.id}:${exercise.id}`}>
                          {exercise.exerciseName}
                        </span>
                      ))}
                    </div>
                  </Card>
                )
              })}
            </div>

            {selectedSession ? <SessionDetail routineLabels={routineLabels} session={selectedSession} /> : null}
          </div>
        </PageSection>
      ) : sessions.length > 0 ? (
        <PageSection title="Sin resultados" titleId="history-empty-filter-title">
          <EmptyState
            description="No encontramos sesiones con esa combinación de rango y filtros. Ajustá el criterio y listo."
            title="Ese filtro dejó el historial vacío"
          />
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
          <p className="empty-note">
            {getSessionDayLabel(session)} · {formatSessionDate(session.endedAt)}
          </p>
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

function StatInline({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-inline-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
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

function filterSessionsByRange(sessions: WorkoutSession[], range: RangeFilter): WorkoutSession[] {
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monday = getWeekMonday(now).toISOString().slice(0, 10)

  if (range === 'week') {
    return sessions.filter((session) => session.endedAt.slice(0, 10) >= monday)
  }

  if (range === 'month') {
    return sessions.filter((session) => session.endedAt.slice(0, 7) === thisMonth)
  }

  return sessions
}

function buildSummary(sessions: WorkoutSession[]) {
  const totalMinutes = sessions.reduce((total, session) => total + Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000), 0)
  const hours = Math.floor(Math.max(totalMinutes, 0) / 60)
  const minutes = Math.max(totalMinutes, 0) % 60
  const totalVolume = sessions.reduce((total, session) => total + getSessionVolume(session), 0)

  return {
    sessionCount: sessions.length,
    totalDuration: `${hours}h ${String(minutes).padStart(2, '0')}m`,
    totalVolume: `${Math.round(totalVolume).toLocaleString('es-AR')} kg`
  }
}

function getWeekMonday(anchor: Date): Date {
  const current = new Date(Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate()))
  const day = current.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  current.setUTCDate(current.getUTCDate() + diff)
  return current
}
