import { normalizeExerciseName, resolveRoutineProgress, type Routine } from './routines'
import type { WorkoutSession } from './sessions'

export type WorkoutFrequencySummary = {
  weekStart: string
  sessionCount: number
}

export type RoutineAdherenceSummary = {
  routineId: string
  completedDays: number
  plannedDays: number
  adherenceRate: number
}

export type WeeklyVolumeSummary = {
  weekStart: string
  totalVolume: number
}

export type ExerciseProgressPoint = {
  exerciseName: string
  sessionId: string
  performedAt: string
  bestWeightKg: number | null
  totalReps: number
  totalVolume: number
}

export function getCurrentWeekFrequencySummary(
  sessions: WorkoutSession[],
  anchorDate = new Date().toISOString()
): WorkoutFrequencySummary {
  const weekStart = getWeekStart(anchorDate)

  return {
    weekStart,
    sessionCount: sessions.filter((session) => getWeekStart(session.endedAt) === weekStart).length
  }
}

export function getWeeklyVolumeSummaries(sessions: WorkoutSession[], limit = 4): WeeklyVolumeSummary[] {
  const totals = aggregateSessionsByWeek(sessions, (current, session) => current + getSessionVolume(session))

  return Array.from(totals.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-limit)
    .map(([weekStart, totalVolume]) => ({ weekStart, totalVolume }))
}

export function getWorkoutFrequencySummaries(sessions: WorkoutSession[], limit = 4): WorkoutFrequencySummary[] {
  const totals = aggregateSessionsByWeek(sessions, (current) => current + 1)

  return Array.from(totals.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-limit)
    .map(([weekStart, sessionCount]) => ({ weekStart, sessionCount }))
}

export function getRoutineAdherenceSummary(
  routine: Routine,
  sessions: WorkoutSession[],
  anchorDate = new Date().toISOString()
): RoutineAdherenceSummary {
  const progress = resolveRoutineProgress(routine)
  const currentWeek = routine.weeks[Math.min(Math.max(progress.currentWeekIndex, 0), routine.weeks.length - 1)]
  const plannedDays = currentWeek?.days.length ?? 0
  const weekStart = getWeekStart(anchorDate)
  const completedDays = new Set(
    sessions
      .filter((session) => session.routineId === routine.id && getWeekStart(session.endedAt) === weekStart)
      .map((session) => `${session.weekIndex}:${session.dayId}`)
  ).size

  return {
    routineId: routine.id,
    completedDays,
    plannedDays,
    adherenceRate: plannedDays > 0 ? Math.min(completedDays / plannedDays, 1) : 0
  }
}

export function getExerciseProgressPoints(
  sessions: WorkoutSession[],
  exerciseKey: string,
  limit = 8
): ExerciseProgressPoint[] {
  const normalizedKey = normalizeExerciseName(exerciseKey)

  return sessions
    .slice()
    .sort((left, right) => left.endedAt.localeCompare(right.endedAt))
    .flatMap((session) =>
      session.exercises.flatMap((exercise) => {
        if (!exercise.exerciseName.trim() && !exercise.exerciseTemplateId) {
          return []
        }

        const matches =
          exercise.exerciseTemplateId === exerciseKey || normalizeExerciseName(exercise.exerciseName) === normalizedKey

        if (!matches) {
          return []
        }

        const bestWeightKg = exercise.sets.reduce<number | null>((best, set) => {
          if (set.weightKg === null) {
            return best
          }

          return best === null ? set.weightKg : Math.max(best, set.weightKg)
        }, null)

        const totalReps = exercise.sets.reduce((total, set) => total + (set.reps ?? 0), 0)
        const totalVolume = exercise.sets.reduce((total, set) => total + getSetVolume(set.reps, set.weightKg), 0)

        return [
          {
            exerciseName: exercise.exerciseName,
            sessionId: session.id,
            performedAt: session.endedAt,
            bestWeightKg,
            totalReps,
            totalVolume
          }
        ]
      })
    )
    .slice(-limit)
}

export function getSessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce(
    (sessionTotal, exercise) => sessionTotal + exercise.sets.reduce((setTotal, set) => setTotal + getSetVolume(set.reps, set.weightKg), 0),
    0
  )
}

export function getWeekStart(value: string): string {
  const date = new Date(value)
  const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = normalized.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day

  normalized.setUTCDate(normalized.getUTCDate() + diff)

  return normalized.toISOString().slice(0, 10)
}

function aggregateSessionsByWeek(
  sessions: WorkoutSession[],
  project: (current: number, session: WorkoutSession) => number
): Map<string, number> {
  return sessions.reduce((totals, session) => {
    const weekStart = getWeekStart(session.endedAt)
    const current = totals.get(weekStart) ?? 0

    totals.set(weekStart, project(current, session))

    return totals
  }, new Map<string, number>())
}

function getSetVolume(reps: number | null, weightKg: number | null): number {
  if (reps === null || weightKg === null) {
    return 0
  }

  return reps * weightKg
}
