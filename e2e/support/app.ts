import { expect, type Page } from '@playwright/test'

type RoutineSeed = {
  name: string
  days: Array<{
    label: string
    exercises?: string[]
  }>
}

export async function resetLocalApp(page: Page) {
  await page.goto('/')
  await page.evaluate(async () => {
    window.localStorage.clear()
    window.sessionStorage.clear()

    await new Promise<void>((resolve, reject) => {
      const request = window.indexedDB.deleteDatabase('gymtracker-db')

      request.onerror = () => reject(request.error)
      request.onblocked = () => resolve()
      request.onsuccess = () => resolve()
    })
  })
  await page.goto('/')
}

export async function createRoutine(page: Page, routine: RoutineSeed) {
  await page.goto('/routines')
  await page.getByRole('button', { name: /nueva rutina/i }).click()
  await page.getByLabel(/nombre de la rutina/i).fill(routine.name)

  if (routine.days.length > 1) {
    await page.getByLabel(/^días$/i).first().fill(String(routine.days.length))
  }

  const dayNameInputs = page.getByLabel(/nombre del día/i)

  for (const [dayIndex, day] of routine.days.entries()) {
    await dayNameInputs.nth(dayIndex).fill(day.label)
  }

  for (const [dayIndex, day] of routine.days.entries()) {
    for (const exerciseName of day.exercises ?? []) {
      await page.getByRole('button', { name: /agregar ejercicio/i }).nth(dayIndex).click()
      await page.getByLabel(/^ejercicio$/i).nth(dayIndex).fill(exerciseName)
    }
  }

  await page.getByRole('button', { name: /guardar rutina/i }).click()
  await expect(page.getByRole('heading', { name: routine.name })).toBeVisible()
}

export async function activateRoutine(page: Page, routineName: string) {
  const card = page.locator('.routine-card').filter({ hasText: routineName }).first()
  await card.getByRole('button', { name: /activar rutina/i }).click()
  await expect(card.getByRole('button', { name: /pausar rutina/i })).toBeVisible()
}
