import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import {
  getCurrentWeekFrequencySummary,
  getExerciseMilestoneSummary,
  getExerciseProgressPoints,
  getExerciseSetProgressChart,
  getRoutineAdherenceSummary,
  getWeeklyVolumeSummaries,
  type ExerciseSetProgressChart,
  type ExerciseSetProgressSeries,
  type ExerciseProgressPoint
} from '../../domain/analytics'
import { normalizeExerciseName } from '../../domain/routines'
import { db } from '../../db/database'
import { Card, EmptyState, Field, FieldSelect, PageSection } from '../../shared/ui'
import { getSessionDayKey, getSessionDayLabel, type SessionFilterOption } from '../history/historyShared'

type ExerciseOption = {
  key: string
  label: string
}

export function AnalyticsPage() {
  const routines = useLiveQuery(() => db.routines.orderBy('updatedAt').reverse().toArray(), [], [])
  const sessions = useLiveQuery(() => db.sessions.orderBy('endedAt').reverse().toArray(), [], [])
  const [selectedRoutineId, setSelectedRoutineId] = useState('all')
  const [selectedDayKey, setSelectedDayKey] = useState('all')
  const [selectedExerciseKey, setSelectedExerciseKey] = useState('')

  const effectiveSelectedRoutineId = selectedRoutineId === 'all' || routines.some((routine) => routine.id === selectedRoutineId) ? selectedRoutineId : 'all'

  const filteredByRoutine = useMemo(
    () => (effectiveSelectedRoutineId === 'all' ? sessions : sessions.filter((session) => session.routineId === effectiveSelectedRoutineId)),
    [effectiveSelectedRoutineId, sessions]
  )

  const dayOptions = useMemo<SessionFilterOption[]>(() => {
    const labels = new Map<string, string>()

    filteredByRoutine.forEach((session) => {
      labels.set(getSessionDayKey(session), getSessionDayLabel(session))
    })

    return Array.from(labels.entries())
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

  const exerciseOptions = useMemo<ExerciseOption[]>(() => {
    const labels = new Map<string, string>()

    filteredSessions.forEach((session) => {
      session.exercises.forEach((exercise) => {
        const key = exercise.exerciseTemplateId ?? normalizeExerciseName(exercise.exerciseName)

        if (!labels.has(key)) {
          labels.set(key, exercise.exerciseName)
        }
      })
    })

    return Array.from(labels.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([key, label]) => ({ key, label }))
  }, [filteredSessions])

  const effectiveSelectedExerciseKey =
    exerciseOptions.length === 0 ? '' : exerciseOptions.some((option) => option.key === selectedExerciseKey) ? selectedExerciseKey : exerciseOptions[0].key

  const frequency = getCurrentWeekFrequencySummary(filteredSessions)
  const weeklyVolume = getWeeklyVolumeSummaries(filteredSessions)
  const adherence = routines
    .filter((routine) => effectiveSelectedRoutineId === 'all' || routine.id === effectiveSelectedRoutineId)
    .map((routine) => ({ routine, summary: getRoutineAdherenceSummary(routine, sessions) }))
  const progressPoints = effectiveSelectedExerciseKey ? getExerciseProgressPoints(filteredSessions, effectiveSelectedExerciseKey) : []
  const progressChart = effectiveSelectedExerciseKey ? getExerciseSetProgressChart(filteredSessions, effectiveSelectedExerciseKey) : null
  const progressSummary = effectiveSelectedExerciseKey ? getExerciseMilestoneSummary(filteredSessions, effectiveSelectedExerciseKey) : null

  return (
    <>
      <PageSection
        description="Progreso real derivado de sesiones guardadas en este dispositivo. Sin backend, sin inventos, sin métricas cosméticas."
        eyebrow="Métricas"
        title="Tendencias y rendimiento"
        titleId="analytics-title"
        actions={
          <Link className="ghost-button" to="/more">
            Volver
          </Link>
        }
      >
        {sessions.length === 0 ? (
          <EmptyState
            className="history-empty"
            description="Entrená al menos una vez y recién ahí tiene sentido hablar de frecuencia, volumen o progreso. Primero datos, después diseño."
            title="Todavía no hay historial suficiente"
          />
        ) : (
          <>
            <div className="history-filter-grid">
              <Field label="Rutina">
                <FieldSelect value={effectiveSelectedRoutineId} onChange={(event) => setSelectedRoutineId(event.target.value)}>
                  <option value="all">Todas</option>
                  {routines.map((routine) => (
                    <option key={routine.id} value={routine.id}>
                      {routine.name}
                    </option>
                  ))}
                </FieldSelect>
              </Field>

              <Field label="Día guardado">
                <FieldSelect disabled={dayOptions.length === 0} value={effectiveSelectedDayKey} onChange={(event) => setSelectedDayKey(event.target.value)}>
                  <option value="all">Todos</option>
                  {dayOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </FieldSelect>
              </Field>

              <Field label="Ejercicio">
                <FieldSelect disabled={exerciseOptions.length === 0} value={effectiveSelectedExerciseKey} onChange={(event) => setSelectedExerciseKey(event.target.value)}>
                  {exerciseOptions.length === 0 ? <option value="">Sin datos</option> : null}
                  {exerciseOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </FieldSelect>
              </Field>
            </div>

            <div className="kpi-grid analytics-kpi-grid">
              <AnalyticsKpi label="Frecuencia esta semana" value={`${frequency.sessionCount}`} caption={formatWeekLabel(frequency.weekStart)} />
              <AnalyticsKpi
                label="Volumen semanal"
                value={formatCompactVolume(weeklyVolume.at(-1)?.totalVolume ?? 0)}
                caption={weeklyVolume.at(-1) ? formatWeekLabel(weeklyVolume.at(-1)!.weekStart) : 'Sin datos'}
              />
              <AnalyticsKpi
                label="Rutinas con adherencia"
                value={`${adherence.filter((entry) => entry.summary.plannedDays > 0).length}`}
                caption="Calculadas sobre la semana actual"
              />
              <AnalyticsKpi label="Sesiones visibles" value={`${filteredSessions.length}`} caption="Base usada en el análisis" />
            </div>
          </>
        )}
      </PageSection>

      {sessions.length > 0 ? (
        <PageSection
          description="Tres señales para no perder el norte: frecuencia, volumen y adherencia sobre la rutina actual."
          title="Resumen global"
          titleId="analytics-summary-title"
        >
          <div className="analytics-subsection">
            <h3 className="section-title analytics-subsection__title">Volumen por semana</h3>
            <div className="analytics-trend-grid analytics-trend-grid--bars">
              {weeklyVolume.map((week) => (
                <Card className="analytics-trend-card analytics-trend-card--bar" key={week.weekStart}>
                  <strong>{formatWeekLabel(week.weekStart)}</strong>
                  <div className="mini-bar-track">
                    <span
                      className="mini-bar-track__fill"
                      style={{ width: `${Math.max(12, Math.round((week.totalVolume / Math.max(...weeklyVolume.map((entry) => entry.totalVolume), 1)) * 100))}%` }}
                    />
                  </div>
                  <span className="kpi-value analytics-trend-card__value">{formatCompactVolume(week.totalVolume)}</span>
                </Card>
              ))}
            </div>
          </div>

          <div className="analytics-subsection">
            <h3 className="section-title analytics-subsection__title">Adherencia</h3>
            <div className="analytics-adherence-grid">
              {adherence.map(({ routine, summary }) => (
                <Card className="analytics-adherence-card" key={routine.id}>
                  <strong>{routine.name}</strong>
                  <span className="routine-summary">
                    {summary.completedDays}/{summary.plannedDays || 0} días en la semana actual
                  </span>
                  <strong className="analytics-adherence-card__value">{Math.round(summary.adherenceRate * 100)}%</strong>
                </Card>
              ))}
            </div>
          </div>
        </PageSection>
      ) : null}

      {progressPoints.length > 0 ? (
        <PageSection
          description="La progresión usa sesiones reales guardadas. Peso, volumen por serie y badges de récord salen del historial inmutable, no de la plantilla actual."
          title={`Progreso: ${exerciseOptions.find((option) => option.key === effectiveSelectedExerciseKey)?.label ?? 'Ejercicio'}`}
          titleId="analytics-progress-title"
        >
          {progressSummary ? (
            <div className="kpi-grid analytics-kpi-grid analytics-kpi-grid--records">
              <AnalyticsKpi
                label="Mejor peso"
                value={progressSummary.bestWeightKg !== null ? `${progressSummary.bestWeightKg} kg` : 'Sin dato'}
                caption={progressSummary.latestBestWeightAt ? formatWorkoutDate(progressSummary.latestBestWeightAt) : 'Sin registro válido'}
              />
              <AnalyticsKpi
                label="Mejor serie"
                value={progressSummary.bestSetVolume !== null ? formatCompactVolume(progressSummary.bestSetVolume) : 'Sin dato'}
                caption={progressSummary.latestBestSetAt ? formatWorkoutDate(progressSummary.latestBestSetAt) : 'Sin registro válido'}
              />
              <AnalyticsKpi
                label="Sesiones con récord"
                value={`${progressSummary.sessionsWithAnyMilestone}`}
                caption={progressSummary.latestMilestoneAt ? `Último hito ${formatWorkoutDate(progressSummary.latestMilestoneAt)}` : 'Sin hitos todavía'}
              />
            </div>
          ) : null}

          {progressChart?.series.length ? <ExerciseSetProgressChartPanel key={effectiveSelectedExerciseKey} chart={progressChart} /> : null}

          <div className="analytics-progress-stack">
            {progressPoints.map((point) => (
              <ProgressPointCard key={`${point.sessionId}:${point.performedAt}`} point={point} />
            ))}
          </div>
        </PageSection>
      ) : sessions.length > 0 ? (
        <PageSection title="Sin progresión todavía" titleId="analytics-empty-progress-title">
          <EmptyState
            description="No hay suficientes repeticiones del ejercicio filtrado para mostrar una línea de progreso útil."
            title="Todavía no hay puntos comparables"
          />
        </PageSection>
      ) : null}

      <PageSection title="Volver al control" titleId="analytics-back-title">
        <Link className="module-link-card" to="/more">
          <span className="eyebrow">Más</span>
          <strong className="routine-card-title">Ir al panel secundario</strong>
          <span className="routine-summary">Desde ahí podés saltar entre métricas, respaldo y próximas extensiones.</span>
          <span aria-hidden="true" className="module-link-card__arrow">
            ↗
          </span>
        </Link>
      </PageSection>
    </>
  )
}

function AnalyticsKpi({ caption, label, value }: { caption: string; label: string; value: string }) {
  return (
    <Card as="article" className="kpi-card dashboard-kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="analytics-kpi-card__caption">{caption}</div>
    </Card>
  )
}

function ExerciseSetProgressChartPanel({ chart }: { chart: ExerciseSetProgressChart }) {
  const [hiddenSetNumbers, setHiddenSetNumbers] = useState<number[]>([])

  const visibleSeries = useMemo(
    () => chart.series.filter((entry) => !hiddenSetNumbers.includes(entry.setNumber)),
    [chart.series, hiddenSetNumbers]
  )

  const yDomain = resolveWeightDomain(chart.minWeightKg, chart.maxWeightKg)
  const xPositions = buildXPositions(chart.timeline.map((entry) => entry.performedAt), 320)
  const yTicks = buildWeightTicks(yDomain)
  const xTicks = buildTimelineTicks(chart.timeline, xPositions)

  return (
    <Card className="analytics-set-chart-card" variant="highlight">
      <div className="history-session-card__header">
        <div>
          <strong>Gráfico por set</strong>
          <p className="routine-summary">Peso en kg por sesión real guardada. Cada línea respeta el número de set del historial, sin promedios truchos.</p>
        </div>
        <strong className="analytics-progress-card__weight">{chart.maxWeightKg !== null ? `${chart.maxWeightKg} kg` : 'Sin peso'}</strong>
      </div>

      <div className="filter-chip-row analytics-set-chart__toggles" role="toolbar" aria-label="Alternar líneas por set">
        {chart.series.map((entry) => {
          const isVisible = !hiddenSetNumbers.includes(entry.setNumber)
          const seriesColor = getSetSeriesColor(entry.setNumber)

          return (
            <button
              key={entry.setNumber}
              aria-pressed={isVisible}
              className={`filter-chip analytics-set-toggle${isVisible ? ' active' : ''}`}
              style={isVisible ? { borderColor: seriesColor, boxShadow: `inset 0 0 0 1px ${seriesColor}33` } : undefined}
              type="button"
              onClick={() =>
                setHiddenSetNumbers((current) =>
                  current.includes(entry.setNumber)
                    ? current.filter((setNumber) => setNumber !== entry.setNumber)
                    : [...current, entry.setNumber].sort((left, right) => left - right)
                )
              }
            >
              Set {entry.setNumber}
            </button>
          )
        })}
      </div>

      <div className="analytics-set-chart" role="img" aria-label={`Gráfico de progreso por sets de ${chart.exerciseName}`}>
        <svg className="analytics-set-chart__svg" viewBox="0 0 360 240" aria-hidden="true">
          {yTicks.map((tick) => {
            const y = toChartY(tick, yDomain, 180)

            return (
              <g key={tick}>
                <line className="analytics-set-chart__grid" x1="32" x2="332" y1={y} y2={y} />
                <text className="analytics-set-chart__axis-label" x="0" y={y + 4}>
                  {formatWeightLabel(tick)}
                </text>
              </g>
            )
          })}

          <line className="analytics-set-chart__axis" x1="32" x2="332" y1="180" y2="180" />
          <line className="analytics-set-chart__axis" x1="32" x2="32" y1="24" y2="180" />

          {visibleSeries.map((entry) => (
            <g key={entry.setNumber} data-testid={`analytics-set-series-${entry.setNumber}`}>
              <path
                className="analytics-set-chart__line"
                d={buildSeriesPath(entry, xPositions, yDomain, 180)}
                stroke={getSetSeriesColor(entry.setNumber)}
              />
              {entry.points.map((point, pointIndex) => {
                if (point.weightKg === null) {
                  return null
                }

                return (
                  <circle
                    key={`${point.sessionId}:${entry.setNumber}`}
                    className="analytics-set-chart__point"
                    cx={xPositions[pointIndex]}
                    cy={toChartY(point.weightKg, yDomain, 180)}
                    fill={getSetSeriesColor(entry.setNumber)}
                    r="4"
                  />
                )
              })}
            </g>
          ))}

          {xTicks.map((tick) => (
            <g key={tick.sessionId}>
              <line className="analytics-set-chart__tick" x1={tick.x} x2={tick.x} y1="180" y2="188" />
              <text className="analytics-set-chart__axis-label" textAnchor="middle" x={tick.x} y="206">
                {formatChartDate(tick.performedAt)}
              </text>
              <text className="analytics-set-chart__axis-label analytics-set-chart__axis-label--subtle" textAnchor="middle" x={tick.x} y="222">
                {formatChartTime(tick.performedAt)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <p className="analytics-set-chart__summary">
        {visibleSeries.length > 0
          ? `${visibleSeries.length} línea${visibleSeries.length === 1 ? '' : 's'} visible${visibleSeries.length === 1 ? '' : 's'} sobre ${chart.timeline.length} sesiones comparables.`
          : 'No hay sets visibles ahora mismo. Activá al menos uno para recuperar la lectura del progreso.'}
      </p>
    </Card>
  )
}

function ProgressPointCard({ point }: { point: ExerciseProgressPoint }) {
  return (
    <Card className="analytics-progress-card">
      <div className="history-session-card__header">
        <div>
          <strong>{formatWorkoutDate(point.performedAt)}</strong>
          <p className="routine-summary">{point.exerciseName}</p>
        </div>
        <strong className="analytics-progress-card__weight">{point.bestWeightKg !== null ? `${point.bestWeightKg} kg` : 'Sin peso'}</strong>
      </div>

      <div className="history-session-meta">
        <span>{point.totalReps} reps totales</span>
        <span>{formatCompactVolume(point.totalVolume)} volumen</span>
        <span>{point.bestSetVolume !== null ? `${formatCompactVolume(point.bestSetVolume)} mejor serie` : 'Sin serie válida'}</span>
      </div>

      {point.hitBestWeight || point.hitBestSet ? (
        <div className="record-badge-row" aria-label={`Hitos de ${point.exerciseName} en ${formatWorkoutDate(point.performedAt)}`}>
          {point.hitBestWeight ? <span className="record-badge record-badge--weight">Mejor peso</span> : null}
          {point.hitBestSet ? <span className="record-badge record-badge--set">Mejor serie</span> : null}
        </div>
      ) : null}
    </Card>
  )
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(`${weekStart}T00:00:00.000Z`)
  const end = new Date(start)

  end.setUTCDate(end.getUTCDate() + 6)

  return `${new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(start)} → ${new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short'
  }).format(end)}`
}

function formatWorkoutDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium'
  }).format(new Date(value))
}

function formatCompactVolume(value: number): string {
  return `${Math.round(value).toLocaleString('es-AR')} kg`
}

const ANALYTICS_SET_SERIES_COLORS = ['#ff8a34', '#cf6416', '#db6d19', '#ffb067', '#b45309', '#f59e0b']

function getSetSeriesColor(setNumber: number): string {
  return ANALYTICS_SET_SERIES_COLORS[(setNumber - 1) % ANALYTICS_SET_SERIES_COLORS.length]
}

function buildXPositions(values: string[], width: number): number[] {
  if (values.length <= 1) {
    return values.map(() => 182)
  }

  const timestamps = values.map((value) => new Date(value).getTime())
  const min = Math.min(...timestamps)
  const max = Math.max(...timestamps)

  if (min === max) {
    return timestamps.map((_, index) => 32 + (width * index) / Math.max(values.length - 1, 1))
  }

  return timestamps.map((timestamp) => 32 + ((timestamp - min) / (max - min)) * width)
}

function buildSeriesPath(series: ExerciseSetProgressSeries, xPositions: number[], yDomain: { min: number; max: number }, chartBottom: number): string {
  const commands: string[] = []
  let segmentOpen = false

  series.points.forEach((point, index) => {
    if (point.weightKg === null) {
      segmentOpen = false

      return
    }

    const x = xPositions[index]
    const y = toChartY(point.weightKg, yDomain, chartBottom)

    commands.push(`${segmentOpen ? 'L' : 'M'} ${x} ${y}`)
    segmentOpen = true
  })

  return commands.join(' ')
}

function resolveWeightDomain(minWeightKg: number | null, maxWeightKg: number | null): { min: number; max: number } {
  if (minWeightKg === null || maxWeightKg === null) {
    return { min: 0, max: 1 }
  }

  if (minWeightKg === maxWeightKg) {
    return {
      min: Math.max(0, minWeightKg - 2.5),
      max: maxWeightKg + 2.5
    }
  }

  const padding = Math.max((maxWeightKg - minWeightKg) * 0.12, 2.5)

  return {
    min: Math.max(0, minWeightKg - padding),
    max: maxWeightKg + padding
  }
}

function buildWeightTicks(domain: { min: number; max: number }): number[] {
  const step = (domain.max - domain.min) / 3

  return Array.from({ length: 4 }, (_, index) => Number((domain.max - step * index).toFixed(1)))
}

function buildTimelineTicks(timeline: ExerciseSetProgressChart['timeline'], xPositions: number[]) {
  if (timeline.length <= 4) {
    return timeline.map((entry, index) => ({
      ...entry,
      x: xPositions[index]
    }))
  }

  const candidateIndexes = [0, Math.floor((timeline.length - 1) / 2), timeline.length - 1]

  return Array.from(new Set(candidateIndexes)).map((index) => ({
    ...timeline[index],
    x: xPositions[index]
  }))
}

function toChartY(weightKg: number, domain: { min: number; max: number }, chartBottom: number): number {
  const ratio = (weightKg - domain.min) / Math.max(domain.max - domain.min, 1)

  return chartBottom - ratio * 156
}

function formatWeightLabel(weightKg: number): string {
  return `${weightKg.toLocaleString('es-AR', { maximumFractionDigits: 1 })} kg`
}

function formatChartDate(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short'
  }).format(new Date(value))
}

function formatChartTime(value: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}
