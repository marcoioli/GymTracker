import { type Dispatch, type FormEvent, type SetStateAction, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '../../db/database'
import {
  cloneRoutineWeekStructure,
  DEFAULT_MUSCLE_GROUP,
  createExerciseSetReference,
  createRoutineDay,
  createRoutineProgress,
  createRoutineWeek,
  getCurrentWeeklyMuscleVolume,
  getSuggestedRoutineDay,
  MUSCLE_GROUPS,
  normalizeRoutineRecord,
  type Routine,
  type RoutineDay,
  type RoutineExercise,
  type RoutineExerciseSetReference,
  type RoutineWeek
} from '../../domain/routines'
import { Button, Card, EmptyState, Field, FieldInput, FieldSelect, PageSection, StatusBanner } from '../../shared/ui'
import { activateRoutine, pauseRoutine, saveRoutine, validateRoutineDraft } from './routinesRepository'

type RoutineFormState = {
  id?: string
  name: string
  status: Routine['status']
  progress: Routine['progress']
  createdAt?: string
  weeks: RoutineWeek[]
}

type RoutineFilter = 'all' | 'active' | 'paused'

const INITIAL_FORM_STATE = (): RoutineFormState => ({
  name: '',
  status: 'paused',
  progress: createRoutineProgress(),
  weeks: [createRoutineWeek(0)]
})

export function RoutinesPage() {
  const navigate = useNavigate()
  const routines = useLiveQuery(() => db.routines.orderBy('updatedAt').reverse().toArray(), [], [])
  const exerciseCatalog = useLiveQuery(() => db.exerciseCatalog.orderBy('name').toArray(), [], [])
  const [formState, setFormState] = useState<RoutineFormState | null>(null)
  const [weekCountInput, setWeekCountInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isTogglingRoutine, setIsTogglingRoutine] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [filter, setFilter] = useState<RoutineFilter>('all')

  const routineCards = useMemo(() => (routines ?? []).map(normalizeRoutineRecord), [routines])
  const filteredRoutines = useMemo(
    () => routineCards.filter((routine) => (filter === 'all' ? true : routine.status === filter)),
    [filter, routineCards]
  )

  function openCreateRoutineForm() {
    setFormState(INITIAL_FORM_STATE())
    setWeekCountInput('')
  }

  function openEditRoutineForm(routine: Routine) {
    const nextFormState = toFormState(routine)
    setFormState(nextFormState)
    setWeekCountInput(String(nextFormState.weeks.length))
  }

  function closeRoutineForm() {
    setFormState(null)
    setWeekCountInput('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!formState) {
      return
    }

    const validationErrors = validateRoutineDraft(formState)

    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors[0])
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      await saveRoutine(formState)
      closeRoutineForm()
    } catch {
      setErrorMessage('No pudimos guardar la rutina. Probá de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleRoutine(routine: Routine) {
    setIsTogglingRoutine(routine.id)

    try {
      if (routine.status === 'active') {
        await pauseRoutine(routine.id)
      } else {
        await activateRoutine(routine.id)
      }
    } finally {
      setIsTogglingRoutine(null)
    }
  }

  return (
    <>
      <PageSection
        description="Tus plantillas activas, pausadas y listas para entrenar."
        eyebrow="Rutinas"
        title="Rutinas"
        titleId="routines-title"
        actions={
          <Button size="compact" variant="secondary" onClick={openCreateRoutineForm}>
            Nueva rutina
          </Button>
        }
      >
        <div className="filter-chip-row" role="tablist" aria-label="Filtros de rutinas">
          {[
            { key: 'all', label: `Todas (${routineCards.length})` },
            { key: 'active', label: `Activas (${routineCards.filter((routine) => routine.status === 'active').length})` },
            { key: 'paused', label: `Pausadas (${routineCards.filter((routine) => routine.status === 'paused').length})` }
          ].map((item) => (
            <button
              key={item.key}
              aria-selected={filter === item.key}
              className={`filter-chip${filter === item.key ? ' active' : ''}`}
              role="tab"
              type="button"
              onClick={() => setFilter(item.key as RoutineFilter)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {routineCards.length === 0 ? (
          <EmptyState
            description="Creá la primera rutina, armá días realmente entrenables y recién ahí activá un plan para que Inicio y el CTA central tengan contexto real."
            title="Todavía no guardaste rutinas"
          />
        ) : (
          <div className="routine-list routine-list--premium">
            {filteredRoutines.map((routine) => {
              const totalDays = routine.weeks.reduce((count, week) => count + week.days.length, 0)
              const totalExercises = routine.weeks.reduce(
                (count, week) => count + week.days.reduce((dayCount, day) => dayCount + day.exercises.length, 0),
                0
              )
              const totalSets = routine.weeks.reduce(
                (count, week) => count + week.days.reduce((dayCount, day) => dayCount + day.exercises.reduce((sum, exercise) => sum + exercise.targetSets, 0), 0),
                0
              )
              const weeklyMuscleVolume = getCurrentWeeklyMuscleVolume(routine)
              const visibleWeeklyMuscleVolume = MUSCLE_GROUPS.filter((muscle) => weeklyMuscleVolume[muscle] > 0)
              const suggestedDay = getSuggestedRoutineDay(routine)

              return (
                <Card as="article" className="routine-card routine-card--premium" key={routine.id} variant={routine.status === 'active' ? 'highlight' : 'default'}>
                  <div className="routine-card-header">
                    <div>
                      <div className={`status-pill status-pill--${routine.status}`}>{getStatusLabel(routine.status)}</div>
                      <h3 className="routine-card-title">{routine.name}</h3>
                      <p className="routine-summary">
                        {totalDays} días · {totalExercises} ejercicios · {totalSets} series planificadas
                      </p>
                    </div>
                    <Button size="compact" variant="ghost" onClick={() => openEditRoutineForm(routine)}>
                      Editar
                    </Button>
                  </div>

                  <div className="stats-inline-grid stats-inline-grid--wide">
                    <StatInline label="Semana actual" value={routine.weeks[routine.progress.currentWeekIndex]?.label ?? 'Sin semana'} />
                    <StatInline label="Sugerido" value={suggestedDay ? suggestedDay.day.label : 'Sin día'} />
                    <StatInline label="Último registro" value={formatLastCompleted(routine.progress.lastCompletedAt)} />
                  </div>

                  <div className="routine-meta-grid">
                    {visibleWeeklyMuscleVolume.length === 0 ? (
                      <div className="meta-card">
                        <strong>Semana actual</strong>
                        <span>Todavía no hay series planificadas por grupo muscular.</span>
                      </div>
                    ) : (
                      visibleWeeklyMuscleVolume.map((muscle) => (
                        <div className="meta-card" key={muscle}>
                          <strong>{muscle}</strong>
                          <span>{weeklyMuscleVolume[muscle]} series</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="routine-card__actions">
                    {routine.status === 'active' && suggestedDay ? (
                      <Button
                        fullWidth
                        size="touch"
                        onClick={() =>
                          navigate(`/session/${routine.id}/${suggestedDay.weekIndex}/${suggestedDay.day.id}?startedAt=${encodeURIComponent(new Date().toISOString())}`)
                        }
                      >
                        Entrenar hoy
                      </Button>
                    ) : null}

                    <Button
                      fullWidth
                      size="touch"
                      variant={routine.status === 'active' ? 'ghost' : 'secondary'}
                      disabled={isTogglingRoutine === routine.id}
                      onClick={() => handleToggleRoutine(routine)}
                    >
                      {routine.status === 'active' ? 'Pausar rutina' : 'Activar rutina'}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </PageSection>

      {formState ? (
        <PageSection
          description="Editá semanas, días y ejercicios sin romper la estructura de la rutina."
          eyebrow="Editor"
          title={formState.id ? 'Editar rutina' : 'Nueva rutina'}
          titleId="routine-form-title"
          actions={
            <Button size="compact" variant="ghost" onClick={closeRoutineForm}>
              Cancelar
            </Button>
          }
        >
          <form className="routine-form" onSubmit={handleSubmit}>
            <Field label="Nombre de la rutina">
              <FieldInput
                name="routine-name"
                placeholder="Ej: Upper / Lower 4 días"
                type="text"
                value={formState.name}
                onChange={(event) => updateFormState(setFormState, (current) => ({ ...current, name: event.target.value }))}
              />
            </Field>

            <Field compact label="Cantidad de semanas">
              <FieldInput
                min={1}
                name="week-count"
                type="number"
                value={weekCountInput}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setWeekCountInput(nextValue)

                  if (nextValue.trim() === '') {
                    return
                  }

                  const weekCount = Number(nextValue)

                  if (Number.isInteger(weekCount) && weekCount >= 1) {
                    updateFormState(setFormState, (current) => ({ ...current, weeks: resizeWeeks(current.weeks, weekCount) }))
                  }
                }}
              />
            </Field>

            <div className="week-stack">
              {formState.weeks.map((week, weekIndex) => (
                <article className="week-card" key={week.id}>
                  <div className="week-card-header">
                    <Field label="Nombre de la semana">
                      <FieldInput
                        type="text"
                        value={week.label}
                        onChange={(event) => {
                          updateFormState(setFormState, (current) => ({
                            ...current,
                            weeks: current.weeks.map((currentWeek) =>
                              currentWeek.id === week.id ? { ...currentWeek, label: event.target.value } : currentWeek
                            )
                          }))
                        }}
                      />
                    </Field>

                    <Field compact label="Días">
                      <FieldInput
                        max={7}
                        min={1}
                        type="number"
                        value={week.days.length}
                        onChange={(event) => {
                          const dayCount = Number(event.target.value)

                          if (Number.isInteger(dayCount) && dayCount >= 1 && dayCount <= 7) {
                            updateFormState(setFormState, (current) => ({
                              ...current,
                              weeks: current.weeks.map((currentWeek) =>
                                currentWeek.id === week.id ? { ...currentWeek, days: resizeDays(currentWeek.days, dayCount) } : currentWeek
                              )
                            }))
                          }
                        }}
                      />
                    </Field>
                  </div>

                  {weekIndex > 0 ? (
                    <div className="week-card-tools">
                      <Button
                        size="compact"
                        variant="secondary"
                        onClick={() => {
                          updateFormState(setFormState, (current) => ({
                            ...current,
                            weeks: repeatWeekFromPrevious(current.weeks, weekIndex)
                          }))
                        }}
                      >
                        Repetir semana anterior
                      </Button>
                    </div>
                  ) : null}

                  <div className="day-stack">
                    {week.days.map((day, dayIndex) => (
                      <article className="day-card" key={day.id}>
                        <Field label="Nombre del día">
                          <FieldInput
                            placeholder={`Día ${dayIndex + 1}`}
                            type="text"
                            value={day.label}
                            onChange={(event) => {
                              updateFormState(setFormState, (current) => ({
                                ...current,
                                weeks: updateDay(current.weeks, week.id, day.id, { label: event.target.value })
                              }))
                            }}
                          />
                        </Field>

                        <div className="exercise-stack">
                          {day.exercises.length === 0 ? (
                            <EmptyState
                              description="Agregá al menos un ejercicio para que este día se vuelva entrenable y no quede como estructura vacía."
                              title="Todavía no hay ejercicios en este día"
                            />
                          ) : null}

                          {day.exercises.map((exercise, exerciseIndex) => (
                            <div className="routine-exercise-planner" key={exercise.id}>
                              <div className="routine-exercise-planner__top">
                                <Field className="exercise-row__name" label="Ejercicio">
                                  <FieldInput
                                    list="exercise-catalog-options"
                                    placeholder="Ej: Sentadilla frontal"
                                    type="text"
                                    value={exercise.name}
                                    onChange={(event) => {
                                      updateFormState(setFormState, (current) => ({
                                        ...current,
                                        weeks: updateExercise(current.weeks, week.id, day.id, exercise.id, {
                                          name: event.target.value
                                        })
                                      }))
                                    }}
                                  />
                                </Field>

                                <Field compact hint="Obligatorio para el resumen semanal." label="Grupo muscular">
                                  <FieldSelect
                                    required
                                    value={exercise.muscle}
                                    onChange={(event) => {
                                      updateFormState(setFormState, (current) => ({
                                        ...current,
                                        weeks: updateExercise(current.weeks, week.id, day.id, exercise.id, {
                                          muscle: event.target.value as RoutineExercise['muscle']
                                        })
                                      }))
                                    }}
                                  >
                                    {MUSCLE_GROUPS.map((muscle) => (
                                      <option key={muscle} value={muscle}>
                                        {muscle}
                                      </option>
                                    ))}
                                  </FieldSelect>
                                </Field>
                              </div>

                              <div className="routine-exercise-planner__summary">
                                <strong>{exercise.name.trim() || `Ejercicio ${exerciseIndex + 1}`}</strong>
                                <span>Referencia por serie para planificar la rutina. No afecta el tracking real.</span>
                              </div>

                              <div className="routine-series-planner" aria-label={`Planificación de series para ${exercise.name || `ejercicio ${exerciseIndex + 1}`}`}>
                                <div className="routine-series-planner__head" aria-hidden="true">
                                  <span>Set</span>
                                  <span>Repeticiones</span>
                                  <span>RIR</span>
                                  <span />
                                </div>

                                {(exercise.setReferences ?? []).map((setReference, setIndex) => (
                                  <div className="routine-series-planner__row" key={setReference.id}>
                                    <span className="routine-series-planner__index">{setIndex + 1}</span>

                                    <input
                                      aria-label={`Repeticiones objetivo serie ${setIndex + 1}`}
                                      className="track-set-input track-set-input--routine"
                                      placeholder="8-12"
                                      type="text"
                                      value={setReference.repsTarget}
                                      onChange={(event) => {
                                        updateFormState(setFormState, (current) => ({
                                          ...current,
                                          weeks: updateExerciseSetReference(current.weeks, week.id, day.id, exercise.id, setReference.id, {
                                            repsTarget: event.target.value
                                          })
                                        }))
                                      }}
                                    />

                                    <input
                                      aria-label={`RIR objetivo serie ${setIndex + 1}`}
                                      className="track-set-input track-set-input--routine"
                                      inputMode="text"
                                      placeholder="1-2"
                                      type="text"
                                      value={setReference.rirTarget}
                                      onChange={(event) => {
                                        updateFormState(setFormState, (current) => ({
                                          ...current,
                                          weeks: updateExerciseSetReference(current.weeks, week.id, day.id, exercise.id, setReference.id, {
                                            rirTarget: event.target.value
                                          })
                                        }))
                                      }}
                                    />

                                    <button
                                      aria-label={`Quitar serie ${setIndex + 1} del ejercicio ${exerciseIndex + 1}`}
                                      className="routine-series-planner__remove"
                                      disabled={exercise.targetSets <= 1}
                                      type="button"
                                      onClick={() => {
                                        updateFormState(setFormState, (current) => ({
                                          ...current,
                                          weeks: removeExerciseSetReference(current.weeks, week.id, day.id, exercise.id, setReference.id)
                                        }))
                                      }}
                                    >
                                      −
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <div className="routine-exercise-planner__actions">
                                <button
                                  className="routine-exercise-planner__add-set"
                                  type="button"
                                  onClick={() => {
                                    updateFormState(setFormState, (current) => ({
                                      ...current,
                                      weeks: addExerciseSetReference(current.weeks, week.id, day.id, exercise.id)
                                    }))
                                  }}
                                >
                                  Agregar serie
                                </button>

                                <button
                                  aria-label={`Eliminar ejercicio ${exerciseIndex + 1}`}
                                  className="routine-exercise-planner__remove-exercise"
                                  type="button"
                                  onClick={() => {
                                    updateFormState(setFormState, (current) => ({
                                      ...current,
                                      weeks: removeExercise(current.weeks, week.id, day.id, exercise.id)
                                    }))
                                  }}
                                >
                                  Quitar ejercicio
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => {
                            updateFormState(setFormState, (current) => ({
                              ...current,
                              weeks: updateDay(current.weeks, week.id, day.id, {
                                exercises: [...day.exercises, createExercise()]
                              })
                            }))
                          }}
                        >
                          Agregar ejercicio
                        </button>
                      </article>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            {errorMessage ? <StatusBanner tone="error">{errorMessage}</StatusBanner> : null}

            <Button disabled={isSaving} fullWidth size="touch" type="submit">
              {isSaving ? 'Guardando...' : formState.id ? 'Guardar cambios' : 'Guardar rutina'}
            </Button>
          </form>

          <datalist id="exercise-catalog-options">
            {exerciseCatalog.map((exercise) => (
              <option key={exercise.id} value={exercise.name} />
            ))}
          </datalist>
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

function formatLastCompleted(value: string | null): string {
  if (!value) {
    return 'Sin registro'
  }

  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(value))
}

function updateFormState(
  setFormState: Dispatch<SetStateAction<RoutineFormState | null>>,
  updater: (current: RoutineFormState) => RoutineFormState
) {
  setFormState((current) => (current ? updater(current) : current))
}

function resizeWeeks(weeks: RoutineWeek[], weekCount: number): RoutineWeek[] {
  if (weekCount <= weeks.length) {
    return weeks.slice(0, weekCount)
  }

  return [...weeks, ...Array.from({ length: weekCount - weeks.length }, (_, index) => createRoutineWeek(weeks.length + index))]
}

function resizeDays(days: RoutineDay[], dayCount: number): RoutineDay[] {
  if (dayCount <= days.length) {
    return days.slice(0, dayCount)
  }

  return [...days, ...Array.from({ length: dayCount - days.length }, (_, index) => createRoutineDay(days.length + index))]
}

function repeatWeekFromPrevious(weeks: RoutineWeek[], weekIndex: number): RoutineWeek[] {
  const sourceWeek = weeks[weekIndex - 1]
  const targetWeek = weeks[weekIndex]

  if (!sourceWeek || !targetWeek) {
    return weeks
  }

  return weeks.map((week, index) =>
    index === weekIndex ? cloneRoutineWeekStructure(sourceWeek, targetWeek.label) : week
  )
}

function updateDay(weeks: RoutineWeek[], weekId: string, dayId: string, patch: Partial<RoutineDay>): RoutineWeek[] {
  return weeks.map((week) =>
    week.id !== weekId
      ? week
      : {
          ...week,
          days: week.days.map((day) => (day.id === dayId ? { ...day, ...patch } : day))
        }
  )
}

function updateExercise(
  weeks: RoutineWeek[],
  weekId: string,
  dayId: string,
  exerciseId: string,
  patch: Partial<RoutineExercise>
): RoutineWeek[] {
  return weeks.map((week) =>
    week.id !== weekId
      ? week
      : {
          ...week,
          days: week.days.map((day) =>
            day.id !== dayId
              ? day
              : {
                  ...day,
                  exercises: day.exercises.map((exercise) =>
                    exercise.id === exerciseId ? { ...exercise, ...patch } : exercise
                  )
                }
          )
        }
  )
}

function updateExerciseSetReference(
  weeks: RoutineWeek[],
  weekId: string,
  dayId: string,
  exerciseId: string,
  setReferenceId: string,
  patch: Partial<RoutineExerciseSetReference>
): RoutineWeek[] {
  return updateExerciseReferenceCollection(weeks, weekId, dayId, exerciseId, (references) =>
    references.map((reference) => (reference.id === setReferenceId ? { ...reference, ...patch } : reference))
  )
}

function addExerciseSetReference(weeks: RoutineWeek[], weekId: string, dayId: string, exerciseId: string): RoutineWeek[] {
  return updateExerciseReferenceCollection(weeks, weekId, dayId, exerciseId, (references) => [
    ...references,
    createExerciseSetReference({ rirTarget: references.at(-1)?.rirTarget ?? '' })
  ])
}

function removeExerciseSetReference(
  weeks: RoutineWeek[],
  weekId: string,
  dayId: string,
  exerciseId: string,
  setReferenceId: string
): RoutineWeek[] {
  return updateExerciseReferenceCollection(weeks, weekId, dayId, exerciseId, (references) => {
    if (references.length <= 1) {
      return references
    }

    const nextReferences = references.filter((reference) => reference.id !== setReferenceId)
    return nextReferences.length > 0 ? nextReferences : references
  })
}

function updateExerciseReferenceCollection(
  weeks: RoutineWeek[],
  weekId: string,
  dayId: string,
  exerciseId: string,
  updater: (references: RoutineExerciseSetReference[]) => RoutineExerciseSetReference[]
): RoutineWeek[] {
  return weeks.map((week) =>
    week.id !== weekId
      ? week
      : {
          ...week,
          days: week.days.map((day) =>
            day.id !== dayId
              ? day
              : {
                  ...day,
                  exercises: day.exercises.map((exercise) => {
                    if (exercise.id !== exerciseId) {
                      return exercise
                    }

                    const baseReferences = exercise.setReferences?.length ? exercise.setReferences : Array.from({ length: Math.max(exercise.targetSets, 1) }, () => createExerciseSetReference())
                    const nextReferences = updater(baseReferences)
                    const normalizedReferences = nextReferences.length > 0 ? nextReferences : [createExerciseSetReference()]

                    return {
                      ...exercise,
                      setReferences: normalizedReferences,
                      targetSets: normalizedReferences.length,
                      targetRir: deriveRoutineExerciseTargetRir(normalizedReferences)
                    }
                  })
                }
          )
        }
  )
}

function removeExercise(weeks: RoutineWeek[], weekId: string, dayId: string, exerciseId: string): RoutineWeek[] {
  return weeks.map((week) =>
    week.id !== weekId
      ? week
      : {
          ...week,
          days: week.days.map((day) =>
            day.id !== dayId ? day : { ...day, exercises: day.exercises.filter((exercise) => exercise.id !== exerciseId) }
          )
        }
  )
}

function createExercise(): RoutineExercise {
  return {
    id: crypto.randomUUID(),
    name: '',
    targetSets: 3,
    targetRir: null,
    muscle: DEFAULT_MUSCLE_GROUP,
    setReferences: [createExerciseSetReference(), createExerciseSetReference(), createExerciseSetReference()]
  }
}

function deriveRoutineExerciseTargetRir(setReferences: RoutineExerciseSetReference[]): number | null {
  for (const reference of setReferences) {
    const normalized = reference.rirTarget.trim()

    if (/^\d+$/.test(normalized)) {
      return Number(normalized)
    }
  }

  return null
}

function getStatusLabel(status: Routine['status']): string {
  if (status === 'active') {
    return 'Activa'
  }

  if (status === 'completed') {
    return 'Completada'
  }

  return 'Pausada'
}

function toFormState(routine: Routine): RoutineFormState {
  return {
    id: routine.id,
    name: routine.name,
    status: routine.status,
    progress: routine.progress,
    createdAt: routine.createdAt,
    weeks: structuredClone(normalizeRoutineRecord(routine).weeks)
  }
}
