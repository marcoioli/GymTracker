import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { db } from '../../db/database'
import { Button, Card, EmptyState, Field, FieldSelect, PageSection } from '../../shared/ui'
import {
  buildHistorySearchParams,
  buildSummary,
  filterSessionsByRange,
  formatSessionDate,
  getSessionDayKey,
  getSessionDayLabel,
  getSessionRoutineName,
  getSessionSetCount,
  parseRangeFilter,
  type RangeFilter,
  type SessionFilterOption
} from './historyShared'

export function HistoryPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const routines = useLiveQuery(() => db.routines.toArray(), [], [])
  const sessions = useLiveQuery(() => db.sessions.orderBy('endedAt').reverse().toArray(), [], [])
  const selectedRoutineId = searchParams.get('routineId') ?? 'all'
  const selectedDayKey = searchParams.get('dayKey') ?? 'all'
  const rangeFilter = parseRangeFilter(searchParams.get('range'))

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

  const routineLabels = useMemo(() => new Map(routineOptions.map((option) => [option.value, option.label])), [routineOptions])
  const summary = useMemo(() => buildSummary(filteredSessions), [filteredSessions])

  function updateFilters(next: { dayKey?: string; range?: RangeFilter; routineId?: string }) {
    setSearchParams(
      buildHistorySearchParams({
        range: next.range ?? rangeFilter,
        routineId: next.routineId ?? effectiveSelectedRoutineId,
        dayKey: next.dayKey ?? effectiveSelectedDayKey
      })
    )
  }

  function openSessionDetail(sessionId: string) {
    const nextSearch = buildHistorySearchParams({
      range: rangeFilter,
      routineId: effectiveSelectedRoutineId,
      dayKey: effectiveSelectedDayKey
    }).toString()

    navigate(`/history/${sessionId}${nextSearch ? `?${nextSearch}` : ''}`)
  }

  return (
    <>
      <PageSection
        headerHidden
        title="Historial de entrenamientos"
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
                  onClick={() => updateFilters({ range: item.key as RangeFilter })}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <Card as="article" className="history-summary-card" variant="highlight">
              <div className="stats-inline-grid stats-inline-grid--wide">
                <StatInline label="Entrenamientos" value={`${summary.sessionCount}`} />
                <StatInline label="Duración total" value={summary.totalDuration} />
              </div>
            </Card>

            <div className="history-filter-grid">
              <Field label="Rutina">
                <FieldSelect value={effectiveSelectedRoutineId} onChange={(event) => updateFilters({ routineId: event.target.value })}>
                  <option value="all">Todas</option>
                  {routineOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FieldSelect>
              </Field>

              <Field label="Día guardado">
                <FieldSelect value={effectiveSelectedDayKey} onChange={(event) => updateFilters({ dayKey: event.target.value })}>
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
          description="Elegí una sesión y abrí su detalle completo sin perder el filtro actual."
          title={`Sesiones encontradas: ${filteredSessions.length}`}
          titleId="history-session-list-title"
        >
          <div className="history-session-list" role="list" aria-label="Sesiones guardadas">
            {filteredSessions.map((session) => (
              <Card className="history-session-card" key={session.id} role="listitem">
                <div className="history-session-card__header">
                  <div>
                    <div className={`status-pill status-pill--${session.status === 'completed' ? 'active' : 'paused'}`}>
                      {session.status === 'completed' ? 'Completada' : 'Terminada antes'}
                    </div>
                    <h3 className="routine-card-title">{getSessionRoutineName(session, routineLabels)}</h3>
                    <p className="routine-summary">{getSessionDayLabel(session)}</p>
                  </div>
                  <Button variant="ghost" onClick={() => openSessionDetail(session.id)}>
                    Ver detalle
                  </Button>
                </div>

                <div className="history-session-meta history-session-meta--compact">
                  <span>{formatSessionDate(session.endedAt)}</span>
                  <span>{session.exercises.length} ejercicios</span>
                  <span>{getSessionSetCount(session)} series</span>
                </div>

                <div className="history-preview-tags" aria-label="Ejercicios principales de la sesión">
                  {session.exercises.slice(0, 3).map((exercise) => (
                    <span className="history-preview-tag" key={`${session.id}:${exercise.id}`}>
                      {exercise.exerciseName}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
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

function StatInline({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-inline-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}
