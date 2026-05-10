import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import {
  getCurrentWeekFrequencySummary,
  getExerciseMilestoneSummary,
  getExerciseProgressPoints,
  getRoutineAdherenceSummary,
  getWeeklyVolumeSummaries,
  type ExerciseProgressPoint
} from '../../domain/analytics'
import { normalizeExerciseName } from '../../domain/routines'
import { db } from '../../db/database'
import { Card, EmptyState, Field, FieldSelect, PageSection } from '../../shared/ui'

type ExerciseOption = {
  key: string
  label: string
}

export function AnalyticsPage() {
  const routines = useLiveQuery(() => db.routines.orderBy('updatedAt').reverse().toArray(), [], [])
  const sessions = useLiveQuery(() => db.sessions.orderBy('endedAt').reverse().toArray(), [], [])
  const [selectedRoutineId, setSelectedRoutineId] = useState('all')
  const [selectedExerciseKey, setSelectedExerciseKey] = useState('')

  const effectiveSelectedRoutineId = selectedRoutineId === 'all' || routines.some((routine) => routine.id === selectedRoutineId) ? selectedRoutineId : 'all'

  const filteredSessions = useMemo(
    () => (effectiveSelectedRoutineId === 'all' ? sessions : sessions.filter((session) => session.routineId === effectiveSelectedRoutineId)),
    [effectiveSelectedRoutineId, sessions]
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
