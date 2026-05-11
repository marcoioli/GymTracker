import { db } from '../../db/database'
import {
  advanceRoutineProgress,
  getRoutineDaySelection,
  getSuggestedRoutineDay,
  normalizeExerciseName,
  normalizeRoutineRecord,
  resolveActiveRoutine,
  type Routine,
  type RoutineDaySelection
} from '../../domain/routines'
import {
  buildSanitizedSessionSetRecords,
  normalizeSessionNote,
  normalizeWorkoutSessionRecord,
  type SessionExerciseInputDraft,
  type SessionStatus,
  type WorkoutSession
} from '../../domain/sessions'

export type SessionExerciseInput = SessionExerciseInputDraft

export type PreviousSetReference = {
  reps: number | null
  weightKg: number | null
  actualRir: number | null
}

export type PreviousExerciseReference = {
  exerciseId: string
  exerciseName: string
  notes?: string
  sets: PreviousSetReference[]
}

export type PreviousSessionContext = {
  sessionNote?: string
  exercises: Record<string, PreviousExerciseReference>
}

export type SaveWorkoutSessionDraft = {
  routineId: string
  weekIndex: number
  dayId: string
  startedAt: string
  endedAt?: string
  status: SessionStatus
  notes?: string
  exercises: SessionExerciseInput[]
}

export async function getSuggestedWorkoutDay() {
  const [activeRoutine, routines] = await Promise.all([db.appState.get('activeRoutineId'), db.routines.toArray()])
  const routine = resolveActiveRoutine(routines.map(normalizeRoutineRecord), activeRoutine?.value ?? null).routine

  if (!routine) {
    return null
  }

  return {
    routine,
    suggestion: getSuggestedRoutineDay(routine)
  }
}

export async function getPreviousSessionReferences(routineId: string, dayId: string): Promise<PreviousSessionContext> {
  const latestSession = await db.sessions
    .where('[routineId+dayId]')
    .equals([routineId, dayId])
    .reverse()
    .sortBy('endedAt')
    .then((sessions) => sessions.at(-1))

  if (!latestSession) {
    return { exercises: {} }
  }

  const normalizedSession = normalizeWorkoutSessionRecord(latestSession)

  return {
    sessionNote: normalizedSession.notes,
    exercises: normalizedSession.exercises.reduce<Record<string, PreviousExerciseReference>>((references, exercise) => {
      if (!exercise.exerciseName.trim() && !exercise.exerciseTemplateId) {
        return references
      }

      const key = exercise.exerciseTemplateId ?? normalizeExerciseName(exercise.exerciseName)

      if (!key) {
        return references
      }

      references[key] = {
        exerciseId: key,
        exerciseName: exercise.exerciseName,
        notes: exercise.notes,
        sets: exercise.sets.map((set) => ({
          reps: set.reps,
          weightKg: set.weightKg,
          actualRir: set.actualRir
        }))
      }

      return references
    }, {})
  }
}

export async function saveWorkoutSession(draft: SaveWorkoutSessionDraft): Promise<WorkoutSession> {
  const endedAt = draft.endedAt ?? new Date().toISOString()

  return db.transaction('rw', db.routines, db.sessions, async () => {
    const storedRoutine = await db.routines.get(draft.routineId)
    const routine = storedRoutine ? normalizeRoutineRecord(storedRoutine) : undefined

    if (!routine) {
      throw new Error('Routine not found')
    }

    const selection = getRoutineDaySelection(routine, draft.weekIndex, draft.dayId)

    if (!selection) {
      throw new Error('Workout day not found')
    }

    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      routineId: routine.id,
      routineName: routine.name,
      dayId: selection.day.id,
      weekIndex: selection.weekIndex,
      weekLabel: selection.weekLabel,
      dayLabel: selection.day.label,
      status: draft.status,
      notes: normalizeSessionNote(draft.notes),
      startedAt: draft.startedAt,
      endedAt,
      exercises: selection.day.exercises.map((exercise, exerciseIndex) => {
        const exerciseInput = draft.exercises[exerciseIndex]

        return {
          id: crypto.randomUUID(),
          exerciseTemplateId: exercise.id,
          exerciseName: exercise.name,
          targetSets: exercise.targetSets,
          targetRir: exercise.targetRir,
          muscle: exercise.muscle,
          notes: normalizeSessionNote(exerciseInput?.notes),
          sets: buildSanitizedSessionSetRecords(exercise.targetSets, exerciseInput?.sets ?? []).map((set) => ({
            id: crypto.randomUUID(),
            ...set
          }))
        }
      })
    }

    const updatedRoutine: Routine = {
      ...routine,
      progress: advanceRoutineProgress(routine, selection, endedAt),
      updatedAt: endedAt
    }

    await db.sessions.add(session)
    await db.routines.put(updatedRoutine)

    return session
  })
}

export function getWorkoutDayLabel(selection: RoutineDaySelection): string {
  return `${selection.weekLabel} · ${selection.day.label}`
}
