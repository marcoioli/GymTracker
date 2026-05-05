import { type Dispatch, type SetStateAction, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../../db/database'
import { getRoutineDaySelection, normalizeExerciseName } from '../../domain/routines'
import { Button, Card, EmptyState, NumericInput, PageSection, StatusBanner } from '../../shared/ui'
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
  const savingMessage =
    isSaving === 'completed'
      ? 'Guardando sesión finalizada...'
      : isSaving === 'ended-early'
        ? 'Guardando sesión terminada antes...'
        : null

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
        <Button size="touch" variant="ghost" onClick={() => navigateHome()}>
          Salir
        </Button>
      }
      description={`${getWorkoutDayLabel(selection)} · ${routineName}`}
      eyebrow="Sesión en curso"
      title={selection.day.label}
      titleId="workout-session-title"
    >
      <Card as="article" className="session-summary-card" variant="highlight">
        <div className="day-option__meta">
          <strong>{selection.day.exercises.length} ejercicios cargados</strong>
          <span className="status-pill status-pill--active">Flujo rápido</span>
        </div>
        <p className="routine-summary">Cada bloque junta serie, referencia previa y carga actual para que escanees y registres sin fricción.</p>
      </Card>

      {savingMessage ? <StatusBanner tone="info">{savingMessage}</StatusBanner> : null}

      {errorMessage ? <StatusBanner tone="error">{errorMessage}</StatusBanner> : null}

      <div className="session-stack">
        {selection.day.exercises.map((exercise, exerciseIndex) => {
          const exerciseDraft = exerciseDrafts[exerciseIndex]
          const reference = previousReferences[exercise.id] ?? previousReferences[normalizeExerciseName(exercise.name)]

          return (
            <Card as="article" className="session-exercise-card" key={exercise.id}>
              <div className="session-exercise-card__header">
                <div>
                  <h3 className="routine-card-title">{exercise.name}</h3>
                  <p className="routine-summary">
                    {exercise.targetSets} series {exercise.targetRir !== null ? `· RIR objetivo ${exercise.targetRir}` : ''}
                  </p>
                </div>
                <span className="session-exercise-card__badge">{exerciseDraft.sets.length} bloques</span>
              </div>

              <div className="session-set-stack">
                {exerciseDraft.sets.map((set, setIndex) => (
                  <div className="session-set-row" key={set.id}>
                    <div className="session-set-row__label">
                      <div className="session-set-row__title-line">
                        <strong>Serie {setIndex + 1}</strong>
                        <span className="session-inline-label">Carga rápida</span>
                      </div>
                      <PreviousReference reference={reference} setIndex={setIndex} />
                    </div>

                    <div className="session-set-grid">
                      <NumericInput
                        align="center"
                        hint="Reps"
                        label={`Reps serie ${setIndex + 1}`}
                        placeholder="--"
                        size="touch"
                        value={exerciseDraft.sets[setIndex]?.reps ?? ''}
                        onChange={(event) => updateExerciseDraft(setExerciseDrafts, exerciseIndex, setIndex, 'reps', event.target.value)}
                      />

                      <NumericInput
                        align="center"
                        hint="Peso kg"
                        label={`Peso kg serie ${setIndex + 1}`}
                        placeholder="--"
                        size="touch"
                        value={exerciseDraft.sets[setIndex]?.weightKg ?? ''}
                        onChange={(event) => updateExerciseDraft(setExerciseDrafts, exerciseIndex, setIndex, 'weightKg', event.target.value)}
                      />

                      <NumericInput
                        align="center"
                        hint="RIR real"
                        label={`RIR real serie ${setIndex + 1}`}
                        placeholder="--"
                        size="touch"
                        value={exerciseDraft.sets[setIndex]?.actualRir ?? ''}
                        onChange={(event) => updateExerciseDraft(setExerciseDrafts, exerciseIndex, setIndex, 'actualRir', event.target.value)}
                      />
                    </div>
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

function PreviousReference({ reference, setIndex }: { reference?: PreviousExerciseReference; setIndex: number }) {
  const setReference = reference?.sets[setIndex]

  if (!setReference) {
    return <span className="session-reference session-reference--empty">Sin referencia previa para esta serie</span>
  }

  return (
    <span className="session-reference">
      Última referencia: {setReference.reps ?? '—'} reps · {setReference.weightKg ?? '—'} kg · RIR {setReference.actualRir ?? '—'}
    </span>
  )
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
