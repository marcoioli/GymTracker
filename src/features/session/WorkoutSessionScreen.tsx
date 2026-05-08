import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../../db/database'
import { getRoutineDaySelection, normalizeExerciseName } from '../../domain/routines'
import { Button, Card, EmptyState, PageSection, StatusBanner } from '../../shared/ui'
import {
  getPreviousSessionReferences,
  getWorkoutDayLabel,
  saveWorkoutSession,
  type PreviousExerciseReference,
  type SessionExerciseInput
} from './sessionRepository'

type ExerciseDraftState = SessionExerciseInput

export function WorkoutSessionScreen() {
  const navigate = useNavigate()
  const { routineId = '', weekIndex = '', dayId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const startedAt = searchParams.get('startedAt') ?? new Date().toISOString()
  const routine = useLiveQuery(() => db.routines.get(routineId), [routineId], undefined)
  const previousReferences = useLiveQuery(() => getPreviousSessionReferences(routineId, dayId), [routineId, dayId], {})

  const selection = useMemo(() => {
    if (!routine) {
      return null
    }

    return getRoutineDaySelection(routine, Number(weekIndex), dayId)
  }, [dayId, routine, weekIndex])

  if (!routine || !selection) {
    return (
      <section className="panel" aria-labelledby="session-missing-title">
        <h2 className="section-title" id="session-missing-title">
          No encontramos ese día de entrenamiento
        </h2>
        <EmptyState
          className="history-empty"
          description="Volvé al dashboard y arrancá desde la rutina activa para generar la sesión correcta, no una URL colgada sin contexto."
          title="La sesión ya no tiene contexto válido"
        />
        <button className="cta-button" type="button" onClick={() => navigate('/')}>
          Volver al inicio
        </button>
      </section>
    )
  }

  return (
    <WorkoutSessionForm
      key={`${routine.id}:${selection.weekIndex}:${selection.day.id}:${startedAt}`}
      navigateHome={(status) => navigate(status ? `/?sessionSaved=${status}` : '/')}
      previousReferences={previousReferences}
      routineId={routine.id}
      routineName={routine.name}
      selection={selection}
      startedAt={startedAt}
    />
  )
}

function WorkoutSessionForm({
  navigateHome,
  previousReferences,
  routineId,
  selection,
  startedAt,
  routineName
}: {
  navigateHome: (status?: 'completed' | 'ended-early') => void
  previousReferences: Record<string, PreviousExerciseReference>
  routineId: string
  selection: NonNullable<ReturnType<typeof getRoutineDaySelection>>
  startedAt: string
  routineName: string
}) {
  const [exerciseDrafts, setExerciseDrafts] = useState<ExerciseDraftState[]>(() =>
    selection.day.exercises.map((exercise) => ({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: Array.from({ length: exercise.targetSets }, () => ({ reps: '', weightKg: '', actualRir: '' }))
    }))
  )
  const [isSaving, setIsSaving] = useState<'completed' | 'ended-early' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [elapsedLabel, setElapsedLabel] = useState(() => formatElapsed(startedAt, new Date().toISOString()))

  const enteredVolume = useMemo(
    () =>
      exerciseDrafts.reduce(
        (total, exercise) =>
          total +
          exercise.sets.reduce((exerciseTotal, set) => exerciseTotal + (Number(set.reps || 0) * Number(set.weightKg || 0) || 0), 0),
        0
      ),
    [exerciseDrafts]
  )
  const workingSetCount = useMemo(() => exerciseDrafts.reduce((total, exercise) => total + exercise.sets.length, 0), [exerciseDrafts])
  const savingMessage =
    isSaving === 'completed'
      ? 'Guardando sesión finalizada...'
      : isSaving === 'ended-early'
        ? 'Guardando sesión terminada antes...'
        : null

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedLabel(formatElapsed(startedAt, new Date().toISOString()))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [startedAt])

  async function handleFinish(status: 'completed' | 'ended-early') {
    setIsSaving(status)
    setErrorMessage(null)

    try {
      await saveWorkoutSession({
        routineId,
        weekIndex: selection.weekIndex,
        dayId: selection.day.id,
        startedAt,
        status,
        exercises: exerciseDrafts
      })

      navigateHome(status)
    } catch {
      setErrorMessage('No pudimos guardar la sesión. Revisá los datos y probá de nuevo.')
    } finally {
      setIsSaving(null)
    }
  }

  return (
    <PageSection
      actions={
        <Button size="compact" variant="ghost" onClick={() => navigateHome()}>
          Salir
        </Button>
      }
      description={routineName}
      eyebrow="Track Workout"
      title={selection.day.label}
      titleId="workout-session-title"
    >
      <Card as="article" className="track-workout-hero" variant="highlight">
        <div className="track-workout-hero__field">
          <span>Workout Name</span>
          <strong>{selection.day.label}</strong>
        </div>
        <div className="track-workout-hero__field track-workout-hero__field--muted">
          <span>Add description or note</span>
          <strong>{getWorkoutDayLabel(selection)}</strong>
        </div>

        <div className="track-workout-hero__stats">
          <SessionStat value={`${workingSetCount}`} label="Working Sets" />
          <SessionStat value={elapsedLabel} label="Duration" />
          <SessionStat value={`${Math.round(enteredVolume).toLocaleString('es-AR')} kg`} label="Logged Volume" />
        </div>
      </Card>

      {savingMessage ? <StatusBanner tone="info">{savingMessage}</StatusBanner> : null}

      {errorMessage ? <StatusBanner tone="error">{errorMessage}</StatusBanner> : null}

      <div className="track-workout-stack">
        {selection.day.exercises.map((exercise, exerciseIndex) => {
          const exerciseDraft = exerciseDrafts[exerciseIndex]
          const reference = previousReferences[exercise.id] ?? previousReferences[normalizeExerciseName(exercise.name)]

          return (
            <Card as="article" className="track-exercise-card" key={exercise.id}>
              <div className="track-exercise-card__header">
                <div>
                  <h3 className="routine-card-title">{exercise.name}</h3>
                  <p className="routine-summary">
                    {exercise.targetSets} series {exercise.targetRir !== null ? `· objetivo RIR ${exercise.targetRir}` : ''}
                  </p>
                </div>
                <span className="track-exercise-card__badge">{exerciseDraft.sets.length} sets</span>
              </div>

              <div className="track-set-grid track-set-grid--head" aria-hidden="true">
                <span>Set</span>
                <span>Previous</span>
                <span>Weight</span>
                <span>Reps</span>
                <span>RIR</span>
              </div>

              <div className="track-set-stack">
                {exerciseDraft.sets.map((set, setIndex) => (
                  <div className="track-set-grid" key={`${exercise.id}:set-${setIndex + 1}`}>
                    <span className="track-set-grid__index">{setIndex + 1}</span>
                    <span className="track-set-grid__previous">{formatCompactReference(reference, setIndex)}</span>

                    <input
                      aria-label={`Peso kg serie ${setIndex + 1}`}
                      className="track-set-input"
                      inputMode="numeric"
                      placeholder="24"
                      type="text"
                      value={set.weightKg ?? ''}
                      onChange={(event) => updateExerciseDraft(setExerciseDrafts, exerciseIndex, setIndex, 'weightKg', event.target.value)}
                    />

                    <input
                      aria-label={`Reps serie ${setIndex + 1}`}
                      className="track-set-input"
                      inputMode="numeric"
                      placeholder="12"
                      type="text"
                      value={set.reps ?? ''}
                      onChange={(event) => updateExerciseDraft(setExerciseDrafts, exerciseIndex, setIndex, 'reps', event.target.value)}
                    />

                    <input
                      aria-label={`RIR real serie ${setIndex + 1}`}
                      className="track-set-input track-set-input--subtle"
                      inputMode="numeric"
                      placeholder="2"
                      type="text"
                      value={set.actualRir ?? ''}
                      onChange={(event) => updateExerciseDraft(setExerciseDrafts, exerciseIndex, setIndex, 'actualRir', event.target.value)}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      <div className="session-actions" aria-label="Acciones de la sesión">
        <Button disabled={isSaving !== null} size="touch" variant="danger" onClick={() => handleFinish('ended-early')}>
          {isSaving === 'ended-early' ? 'Guardando corte...' : 'Terminar antes'}
        </Button>
        <Button disabled={isSaving !== null} fullWidth size="touch" onClick={() => handleFinish('completed')}>
          {isSaving === 'completed' ? 'Guardando finalización...' : 'Finalizar sesión'}
        </Button>
      </div>
    </PageSection>
  )
}

function SessionStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="track-session-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function formatElapsed(startedAt: string, now: string) {
  const diffMs = Math.max(new Date(now).getTime() - new Date(startedAt).getTime(), 0)
  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours > 0 ? `${hours}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatCompactReference(reference: PreviousExerciseReference | undefined, setIndex: number) {
  const setReference = reference?.sets[setIndex]

  if (!setReference) {
    return '—'
  }

  const weight = setReference.weightKg !== null ? `${setReference.weightKg} kg` : '— kg'
  const reps = setReference.reps !== null ? `${setReference.reps}` : '—'

  return `(${weight}) × ${reps}`
}

function updateExerciseDraft(
  setExerciseDrafts: Dispatch<SetStateAction<ExerciseDraftState[]>>,
  exerciseIndex: number,
  setIndex: number,
  field: 'reps' | 'weightKg' | 'actualRir',
  value: string
) {
  setExerciseDrafts((current) =>
    current.map((exercise, currentExerciseIndex) => {
      if (currentExerciseIndex !== exerciseIndex) {
        return exercise
      }

      return {
        ...exercise,
        sets: exercise.sets.map((set, currentSetIndex) =>
          currentSetIndex === setIndex
            ? {
                ...set,
                [field]: value
              }
            : set
        )
      }
    })
  )
}
