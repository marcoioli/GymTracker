import { expect, test } from '@playwright/test'

import { activateRoutine, createRoutine, resetLocalApp } from './support/app'

test('bloquea iniciar entrenamiento si la rutina activa no tiene días con ejercicios', async ({ page }) => {
  await resetLocalApp(page)

  await createRoutine(page, {
    name: 'Rutina vacía activa',
    days: [{ label: 'Push' }]
  })

  await activateRoutine(page, 'Rutina vacía activa')
  await page.getByRole('link', { name: 'Inicio' }).click()

  await expect(page.getByRole('button', { name: /iniciar rutina/i })).toHaveCount(0)
  await expect(page.locator('.tracker-focus-card')).toHaveCount(0)
})

test('permite cambiar manualmente el día sugerido antes de iniciar la sesión', async ({ page }) => {
  await resetLocalApp(page)

  await createRoutine(page, {
    name: 'Upper Lower Edge',
    days: [
      { label: 'Push', exercises: ['Press banca'] },
      { label: 'Pull', exercises: ['Remo con barra'] }
    ]
  })

  await activateRoutine(page, 'Upper Lower Edge')
  await page.getByRole('link', { name: 'Inicio' }).click()
  await page.getByRole('button', { name: /iniciar rutina/i }).click()

  const dialog = page.getByRole('dialog', { name: /confirmá el día/i })
  await expect(dialog.getByText(/semana 1 · push/i)).toBeVisible()
  await dialog.getByText(/semana 1 · pull/i).click()
  await dialog.getByRole('button', { name: /iniciar pull/i }).click()

  await expect(page.getByRole('heading', { name: 'Pull' })).toBeVisible()
  await expect(page.getByText(/semana 1 · pull/i)).toBeVisible()
  await expect(page.getByText(/upper lower edge/i)).toBeVisible()
})

test('mantiene una sesión terminada antes después de recargar la app', async ({ page }) => {
  await resetLocalApp(page)

  await createRoutine(page, {
    name: 'Persistencia sesión',
    days: [{ label: 'Pull', exercises: ['Remo con barra'] }]
  })

  await activateRoutine(page, 'Persistencia sesión')
  await page.getByRole('link', { name: 'Inicio' }).click()
  await page.getByRole('button', { name: /iniciar rutina/i }).click()
  await page.getByRole('button', { name: /iniciar pull/i }).click()

  await page.getByLabel(/reps serie 1/i).fill('8')
  await page.getByLabel(/peso kg serie 1/i).fill('70')
  await page.getByLabel(/rir real serie 1/i).fill('1')
  await page.getByRole('button', { name: /terminar antes/i }).click()
  await expect(page.getByRole('status')).toContainText(/sesión guardada como terminada antes/i)

  await page.reload()
  await page.getByRole('link', { name: 'Historial' }).click()
  await expect(page.getByText(/sesiones encontradas: 1/i)).toBeVisible()
  await expect(page.locator('.history-session-card').filter({ hasText: 'Terminada antes' }).first()).toBeVisible()

  await page.getByRole('link', { name: 'Más' }).click()
  await page.getByRole('link', { name: /progreso y tendencias/i }).click()
  await expect(page.locator('.kpi-card').filter({ hasText: 'Sesiones visibles' })).toHaveText(/1/)
  await expect(page.getByText(/progreso: remo con barra/i)).toBeVisible()
})
