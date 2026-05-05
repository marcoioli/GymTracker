import { DEFAULT_MUSCLE_GROUP, isMuscleGroup, type MuscleGroup } from './routines'

export type SessionStatus = 'completed' | 'ended-early'

export type SessionSetInputDraft = {
  reps?: string
  weightKg?: string
  actualRir?: string
}

export type SessionExerciseInputDraft = {
  exerciseId: string
  exerciseName: string
  sets: SessionSetInputDraft[]
}

export type SessionSetRecord = {
  id: string
  setNumber: number
  reps: number | null
  weightKg: number | null
  actualRir: number | null
}

export type SessionExerciseSnapshot = {
  id: string
  exerciseTemplateId: string | null
  exerciseName: string
  targetSets: number
  targetRir: number | null
  muscle: MuscleGroup
  sets: SessionSetRecord[]
}

export type WorkoutSession = {
  id: string
  routineId: string
  routineName?: string
  dayId: string
  weekIndex: number
  weekLabel?: string
  dayLabel?: string
  status: SessionStatus
  exercises: SessionExerciseSnapshot[]
  startedAt: string
  endedAt: string
}

type LegacySessionExerciseSnapshot = Omit<SessionExerciseSnapshot, 'muscle'> & {
  muscle?: unknown
}

type LegacyWorkoutSession = Omit<WorkoutSession, 'exercises'> & {
  exercises: LegacySessionExerciseSnapshot[]
}

export function parseSessionNumericInput(value: string | undefined): number | null {
  if (!value?.trim()) {
    return null
  }

  const normalizedValue = value.replace(',', '.').trim()
  const parsedValue = Number(normalizedValue)

  return Number.isFinite(parsedValue) ? parsedValue : null
}

export function buildSanitizedSessionSetRecords(
  plannedSetCount: number,
  inputSets: SessionSetInputDraft[]
): Omit<SessionSetRecord, 'id'>[] {
  return Array.from({ length: Math.max(0, plannedSetCount) }, (_, setIndex) => {
    const input = inputSets[setIndex]

    return {
      setNumber: setIndex + 1,
      reps: parseSessionNumericInput(input?.reps),
      weightKg: parseSessionNumericInput(input?.weightKg),
      actualRir: parseSessionNumericInput(input?.actualRir)
    }
  })
}

export function normalizeSessionExerciseSnapshot(exercise: LegacySessionExerciseSnapshot): SessionExerciseSnapshot {
  return {
    ...exercise,
    muscle: isMuscleGroup(exercise.muscle) ? exercise.muscle : DEFAULT_MUSCLE_GROUP
  }
}

export function normalizeWorkoutSessionRecord(session: LegacyWorkoutSession): WorkoutSession {
  return {
    ...session,
    exercises: session.exercises.map(normalizeSessionExerciseSnapshot)
  }
}
