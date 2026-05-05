import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import {
  getCurrentWeekFrequencySummary,
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

  return (
    <>
      <PageSection
        description="Todo sale de sesiones locales guardadas en este dispositivo. Sin backend, sin magia, sin humo. Historia real y listo."
        title="Métricas"
        titleId="analytics-title"
      >
        {sessions.length === 0 ? (
          <EmptyState
            className="history-empty"
            description="Entrená al menos una vez en este dispositivo y recién ahí tiene sentido calcular frecuencia, volumen o progreso."
            title="Todavía no hay historial suficiente"
          />
        ) : (
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
        )}
      </PageSection>

      {sessions.length > 0 ? (
        <PageSection
          description="Tres indicadores mínimos para no perder el norte: cuántas veces entrenaste, cuánto volumen moviste y qué tan alineado venís con el plan."
          title="Resumen global"
          titleId="analytics-summary-title"
        >
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
            <AnalyticsKpi label="Sesiones locales" value={`${filteredSessions.length}`} caption="Base para progreso y volumen" />
          </div>

          <div className="analytics-subsection">
            <h3 className="section-title analytics-subsection__title">Volumen por semana</h3>
            <div className="analytics-trend-grid">
              {weeklyVolume.map((week) => (
                <Card className="analytics-trend-card" key={week.weekStart}>
                  <strong>{formatWeekLabel(week.weekStart)}</strong>
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
          description="La progresión se calcula con sesiones reales guardadas. Peso, reps y volumen sin depender de la plantilla actual."
          title={`Progreso: ${exerciseOptions.find((option) => option.key === effectiveSelectedExerciseKey)?.label ?? 'Ejercicio'}`}
          titleId="analytics-progress-title"
        >
          <div className="analytics-progress-stack">
            {progressPoints.map((point) => (
              <ProgressPointCard key={`${point.sessionId}:${point.performedAt}`} point={point} />
            ))}
          </div>
        </PageSection>
      ) : null}
    </>
  )
}

function AnalyticsKpi({ caption, label, value }: { caption: string; label: string; value: string }) {
  return (
    <Card as="article" className="kpi-card">
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
      </div>
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
