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
  bestSetVolume: number | null
  totalReps: number
  totalVolume: number
  hitBestWeight: boolean
  hitBestSet: boolean
}

export type ExerciseMilestoneSummary = {
  exerciseName: string
  bestWeightKg: number | null
  bestSetVolume: number | null
  sessionsWithBestWeight: number
  sessionsWithBestSet: number
  sessionsWithAnyMilestone: number
  latestBestWeightAt: string | null
  latestBestSetAt: string | null
  latestMilestoneAt: string | null
}

export type SessionExerciseMilestone = {
  bestWeightKg: number | null
  bestSetVolume: number | null
  hitBestWeight: boolean
  hitBestSet: boolean
  bestWeightSetIds: string[]
  bestSetSetIds: string[]
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
  const occurrences = getExerciseOccurrences(sessions, exerciseKey)
  const milestoneSummary = buildExerciseMilestoneSummary(occurrences)

  if (!milestoneSummary) {
    return []
  }

  return occurrences
    .map((occurrence) => ({
      exerciseName: occurrence.exerciseName,
      sessionId: occurrence.sessionId,
      performedAt: occurrence.performedAt,
      bestWeightKg: occurrence.bestWeightKg,
      bestSetVolume: occurrence.bestSetVolume,
      totalReps: occurrence.totalReps,
      totalVolume: occurrence.totalVolume,
      hitBestWeight: milestoneSummary.bestWeightKg !== null && occurrence.bestWeightKg === milestoneSummary.bestWeightKg,
      hitBestSet: milestoneSummary.bestSetVolume !== null && occurrence.bestSetVolume === milestoneSummary.bestSetVolume
    }))
    .slice(-limit)
}

export function getExerciseMilestoneSummary(
  sessions: WorkoutSession[],
  exerciseKey: string
): ExerciseMilestoneSummary | null {
  return buildExerciseMilestoneSummary(getExerciseOccurrences(sessions, exerciseKey))
}

export function getSessionExerciseMilestones(
  sessions: WorkoutSession[],
  targetSession: WorkoutSession
): Record<string, SessionExerciseMilestone> {
  const summaryByExercise = new Map<string, ExerciseMilestoneSummary | null>()

  return targetSession.exercises.reduce<Record<string, SessionExerciseMilestone>>((milestones, exercise) => {
    const key = getExerciseHistoryKey(exercise.exerciseTemplateId, exercise.exerciseName)

    if (!key) {
      return milestones
    }

    if (!summaryByExercise.has(key)) {
      summaryByExercise.set(key, getExerciseMilestoneSummary(sessions, key))
    }

    const summary = summaryByExercise.get(key)

    if (!summary) {
      return milestones
    }

    const bestWeightSetIds =
      summary.bestWeightKg === null
        ? []
        : exercise.sets.filter((set) => set.weightKg === summary.bestWeightKg).map((set) => set.id)
    const bestSetSetIds =
      summary.bestSetVolume === null
        ? []
        : exercise.sets.filter((set) => getSetVolume(set.reps, set.weightKg) === summary.bestSetVolume).map((set) => set.id)

    milestones[exercise.id] = {
      bestWeightKg: summary.bestWeightKg,
      bestSetVolume: summary.bestSetVolume,
      hitBestWeight: bestWeightSetIds.length > 0,
      hitBestSet: bestSetSetIds.length > 0,
      bestWeightSetIds,
      bestSetSetIds
    }

    return milestones
  }, {})
}

export function getSessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce(
    (sessionTotal, exercise) => sessionTotal + exercise.sets.reduce((setTotal, set) => setTotal + (getSetVolume(set.reps, set.weightKg) ?? 0), 0),
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

type ExerciseOccurrence = {
  exerciseName: string
  sessionId: string
  performedAt: string
  bestWeightKg: number | null
  bestSetVolume: number | null
  totalReps: number
  totalVolume: number
}

function getExerciseOccurrences(sessions: WorkoutSession[], exerciseKey: string): ExerciseOccurrence[] {
  const requestedKey = normalizeExerciseName(exerciseKey)

  return sessions
    .slice()
    .sort((left, right) => left.endedAt.localeCompare(right.endedAt))
    .flatMap((session) =>
      session.exercises.flatMap((exercise) => {
        const key = getExerciseHistoryKey(exercise.exerciseTemplateId, exercise.exerciseName)

        if (!key || key !== requestedKey) {
          return []
        }

        const bestWeightKg = exercise.sets.reduce<number | null>((best, set) => {
          if (set.weightKg === null) {
            return best
          }

          return best === null ? set.weightKg : Math.max(best, set.weightKg)
        }, null)
        const bestSetVolume = exercise.sets.reduce<number | null>((best, set) => {
          const volume = getSetVolume(set.reps, set.weightKg)

          if (volume === null) {
            return best
          }

          return best === null ? volume : Math.max(best, volume)
        }, null)
        const totalReps = exercise.sets.reduce((total, set) => total + (set.reps ?? 0), 0)
        const totalVolume = exercise.sets.reduce((total, set) => total + (getSetVolume(set.reps, set.weightKg) ?? 0), 0)

        return [
          {
            exerciseName: exercise.exerciseName,
            sessionId: session.id,
            performedAt: session.endedAt,
            bestWeightKg,
            bestSetVolume,
            totalReps,
            totalVolume
          }
        ]
      })
    )
}

function buildExerciseMilestoneSummary(occurrences: ExerciseOccurrence[]): ExerciseMilestoneSummary | null {
  if (occurrences.length === 0) {
    return null
  }

  const bestWeightKg = occurrences.reduce<number | null>((best, occurrence) => {
    if (occurrence.bestWeightKg === null) {
      return best
    }

    return best === null ? occurrence.bestWeightKg : Math.max(best, occurrence.bestWeightKg)
  }, null)
  const bestSetVolume = occurrences.reduce<number | null>((best, occurrence) => {
    if (occurrence.bestSetVolume === null) {
      return best
    }

    return best === null ? occurrence.bestSetVolume : Math.max(best, occurrence.bestSetVolume)
  }, null)
  const sessionsWithBestWeight =
    bestWeightKg === null ? 0 : occurrences.filter((occurrence) => occurrence.bestWeightKg === bestWeightKg).length
  const sessionsWithBestSet =
    bestSetVolume === null ? 0 : occurrences.filter((occurrence) => occurrence.bestSetVolume === bestSetVolume).length
  const sessionsWithAnyMilestone = occurrences.filter(
    (occurrence) =>
      (bestWeightKg !== null && occurrence.bestWeightKg === bestWeightKg) ||
      (bestSetVolume !== null && occurrence.bestSetVolume === bestSetVolume)
  ).length
  const latestBestWeightAt = bestWeightKg === null ? null : findLatestOccurrenceDate(occurrences, (occurrence) => occurrence.bestWeightKg === bestWeightKg)
  const latestBestSetAt = bestSetVolume === null ? null : findLatestOccurrenceDate(occurrences, (occurrence) => occurrence.bestSetVolume === bestSetVolume)

  return {
    exerciseName: occurrences.at(-1)?.exerciseName ?? occurrences[0].exerciseName,
    bestWeightKg,
    bestSetVolume,
    sessionsWithBestWeight,
    sessionsWithBestSet,
    sessionsWithAnyMilestone,
    latestBestWeightAt,
    latestBestSetAt,
    latestMilestoneAt: [latestBestWeightAt, latestBestSetAt].filter((value): value is string => value !== null).sort().at(-1) ?? null
  }
}

function getExerciseHistoryKey(exerciseTemplateId: string | null, exerciseName: string): string {
  return normalizeExerciseName(exerciseTemplateId ?? exerciseName)
}

function findLatestOccurrenceDate(
  occurrences: ExerciseOccurrence[],
  predicate: (occurrence: ExerciseOccurrence) => boolean
): string | null {
  for (let index = occurrences.length - 1; index >= 0; index -= 1) {
    const occurrence = occurrences[index]

    if (predicate(occurrence)) {
      return occurrence.performedAt
    }
  }

  return null
}

function getSetVolume(reps: number | null, weightKg: number | null): number | null {
  if (reps === null || weightKg === null) {
    return null
  }

  return reps * weightKg
}
