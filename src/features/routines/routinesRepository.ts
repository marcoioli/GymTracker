import { db, type AppStateRecord } from '../../db/database'
import {
  createRoutineProgress,
  isMuscleGroup,
  isValidDayCount,
  normalizeRoutineRecord,
  normalizeExerciseName,
  resolveActiveRoutine,
  type ExerciseCatalogEntry,
  type Routine,
  type RoutineWeek
} from '../../domain/routines'

export type SaveRoutineDraft = {
  id?: string
  name: string
  status?: Routine['status']
  progress?: Routine['progress']
  createdAt?: string
  weeks: RoutineWeek[]
}

export function validateRoutineDraft(draft: SaveRoutineDraft): string[] {
  const errors: string[] = []

  if (!draft.name.trim()) {
    errors.push('La rutina necesita un nombre.')
  }

  if (draft.weeks.length === 0) {
    errors.push('La rutina necesita al menos una semana.')
  }

  draft.weeks.forEach((week, weekIndex) => {
    if (!isValidDayCount(week.days.length)) {
      errors.push(`La semana ${weekIndex + 1} debe tener al menos 1 día.`)
    }

    week.days.forEach((day, dayIndex) => {
      if (!day.label.trim()) {
        errors.push(`El día ${dayIndex + 1} de la semana ${weekIndex + 1} necesita un nombre.`)
      }

      day.exercises.forEach((exercise, exerciseIndex) => {
        if (!exercise.name.trim()) {
          errors.push(`El ejercicio ${exerciseIndex + 1} del ${day.label || `día ${dayIndex + 1}`} necesita un nombre.`)
        }

        if (!Number.isInteger(exercise.targetSets) || exercise.targetSets < 1) {
          errors.push(`El ejercicio ${exercise.name || exerciseIndex + 1} debe tener al menos una serie.`)
        }

        if (exercise.targetRir !== null && (!Number.isInteger(exercise.targetRir) || exercise.targetRir < 0)) {
          errors.push(`El RIR objetivo de ${exercise.name || `ejercicio ${exerciseIndex + 1}`} es inválido.`)
        }

        if (!isMuscleGroup(exercise.muscle)) {
          errors.push(`El ejercicio ${exercise.name || exerciseIndex + 1} necesita un grupo muscular válido.`)
        }
      })
    })
  })

  return errors
}

export async function saveRoutine(draft: SaveRoutineDraft): Promise<Routine> {
  const validationErrors = validateRoutineDraft(draft)

  if (validationErrors.length > 0) {
    throw new Error(validationErrors[0])
  }

  const now = new Date().toISOString()
  const routine = normalizeRoutineRecord({
    id: draft.id ?? crypto.randomUUID(),
    name: draft.name.trim(),
    status: draft.status ?? 'paused',
    progress: draft.progress ?? createRoutineProgress(),
    createdAt: draft.createdAt ?? now,
    updatedAt: now,
    weekCount: draft.weeks.length,
    weeks: draft.weeks
  })

  await db.transaction('rw', db.routines, db.exerciseCatalog, async () => {
    await db.routines.put(routine)
    await upsertExerciseCatalogEntries(routine)
  })

  return routine
}

export async function activateRoutine(routineId: string): Promise<void> {
  const now = new Date().toISOString()

  await db.transaction('rw', db.routines, db.appState, async () => {
    const routines = await db.routines.toArray()
    const targetRoutine = routines.find((routine) => routine.id === routineId)

    if (!targetRoutine) {
      return
    }

    await Promise.all(
      routines
        .filter((routine) => routine.id !== routineId && routine.status === 'active')
        .map((routine) => db.routines.update(routine.id, { status: 'paused', updatedAt: now }))
    )

    await db.routines.update(routineId, { status: 'active', updatedAt: now })
    await db.appState.put({ key: 'activeRoutineId', value: routineId })
  })
}

export async function pauseRoutine(routineId: string): Promise<void> {
  const now = new Date().toISOString()

  await db.transaction('rw', db.routines, db.appState, async () => {
    const routine = await db.routines.get(routineId)

    if (!routine) {
      return
    }

    await db.routines.update(routineId, { status: 'paused', updatedAt: now })

    const activeRoutine = await db.appState.get('activeRoutineId')

    if (activeRoutine?.value === routineId) {
      await db.appState.delete('activeRoutineId')
    }
  })
}

export async function getActiveRoutine(): Promise<Routine | undefined> {
  const [activeRoutineId, routines] = await Promise.all([db.appState.get('activeRoutineId'), db.routines.toArray()])
  const normalizedRoutines = routines.map(normalizeRoutineRecord)
  const resolution = resolveActiveRoutine(normalizedRoutines, activeRoutineId?.value ?? null)

  return resolution.routine ?? undefined
}

export async function repairActiveRoutineState(): Promise<Routine | undefined> {
  return db.transaction('rw', db.routines, db.appState, async () => {
    const [activeRoutineId, routines] = await Promise.all([db.appState.get('activeRoutineId'), db.routines.toArray()])
    const normalizedRoutines = routines.map(normalizeRoutineRecord)
    const resolution = resolveActiveRoutine(normalizedRoutines, activeRoutineId?.value ?? null)

    if (resolution.repairedState) {
      const chosenRoutineId = resolution.routine?.id ?? null

      await Promise.all(
        normalizedRoutines.map((routine) => {
          const nextStatus = routine.id === chosenRoutineId ? 'active' : routine.status === 'active' ? 'paused' : routine.status

          if (nextStatus === routine.status) {
            return Promise.resolve()
          }

          return db.routines.update(routine.id, { status: nextStatus })
        })
      )

      if (chosenRoutineId) {
        await db.appState.put({ key: 'activeRoutineId', value: chosenRoutineId })
      } else {
        await db.appState.delete('activeRoutineId')
      }
    }

    return resolution.routine ?? undefined
  })
}

async function upsertExerciseCatalogEntries(routine: Routine): Promise<void> {
  const seenNames = new Set<string>()

  for (const week of routine.weeks) {
    for (const day of week.days) {
      for (const exercise of day.exercises) {
        const normalizedName = normalizeExerciseName(exercise.name)

        if (!normalizedName || seenNames.has(normalizedName)) {
          continue
        }

        seenNames.add(normalizedName)

        const existingEntry = await db.exerciseCatalog.where('normalizedName').equals(normalizedName).first()

        if (existingEntry) {
          await db.exerciseCatalog.update(existingEntry.id, {
            name: exercise.name.trim(),
            updatedAt: routine.updatedAt
          })

          continue
        }

        const entry: ExerciseCatalogEntry = {
          id: crypto.randomUUID(),
          name: exercise.name.trim(),
          normalizedName,
          createdAt: routine.updatedAt,
          updatedAt: routine.updatedAt
        }

        await db.exerciseCatalog.add(entry)
      }
    }
  }
}

export async function getAppStateRecord(key: AppStateRecord['key']): Promise<AppStateRecord | undefined> {
  return db.appState.get(key)
}
