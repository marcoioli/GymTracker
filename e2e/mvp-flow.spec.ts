import { expect, test } from '@playwright/test'

test('completa el flujo principal del MVP para demo local', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.indexedDB.deleteDatabase('gymtracker-db')
  })

  await page.goto('/')

  await expect(page.getByRole('heading', { name: /hoy todavía no hay rutina activa/i })).toBeVisible()

  await page.getByRole('button', { name: /crear o activar rutina/i }).click()

  await expect(page).toHaveURL(/\/routines$/)
  await page.getByRole('button', { name: /nueva rutina/i }).click()

  await page.getByLabel(/nombre de la rutina/i).fill('Upper / Lower Demo')
  await page.getByLabel(/cantidad de semanas/i).fill('2')
  await page.getByLabel(/^días$/i).nth(0).fill('2')
  await page.getByLabel(/^días$/i).nth(1).fill('2')

  const dayNameInputs = page.getByLabel(/nombre del día/i)
  await dayNameInputs.nth(0).fill('Push')
  await dayNameInputs.nth(1).fill('Pull')

  const addExerciseButtons = page.getByRole('button', { name: /agregar ejercicio/i })
  await addExerciseButtons.nth(0).click()
  await addExerciseButtons.nth(1).click()

  const exerciseInputs = page.getByLabel(/^ejercicio$/i)
  await exerciseInputs.nth(0).fill('Press banca')
  await exerciseInputs.nth(1).fill('Remo con barra')

  const seriesInputs = page.getByLabel(/^series$/i)
  await seriesInputs.nth(0).fill('3')
  await seriesInputs.nth(1).fill('2')

  const rirInputs = page.getByLabel(/rir objetivo/i)
  await rirInputs.nth(0).fill('2')
  await rirInputs.nth(1).fill('1')

  await page.getByRole('button', { name: /guardar rutina/i }).click()

  await expect(page.getByRole('heading', { name: 'Upper / Lower Demo' })).toBeVisible()
  await expect(page.getByText(/2 semanas · 4 días · 2 ejercicios planificados/i)).toBeVisible()

  await page.getByRole('button', { name: /activar rutina/i }).click()
  await expect(page.getByRole('button', { name: /pausar rutina/i })).toBeVisible()

  await page.getByRole('link', { name: 'Inicio' }).click()
  await expect(page.getByText(/rutina activa: upper \/ lower demo/i)).toBeVisible()

  await page.getByRole('button', { name: /iniciar entrenamiento/i }).click()

  const dialog = page.getByRole('dialog', { name: /confirmá el día/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/semana 1 · push/i)).toBeVisible()
  await expect(dialog.getByText(/sugerido para hoy/i)).toBeVisible()

  await dialog.getByText(/semana 1 · pull/i).click()
  await dialog.getByRole('button', { name: /iniciar pull/i }).click()

  await expect(page.getByRole('heading', { name: 'Pull' })).toBeVisible()
  await page.getByLabel(/reps serie 1/i).fill('8')
  await page.getByLabel(/peso kg serie 1/i).fill('70')
  await page.getByLabel(/rir real serie 1/i).fill('1')

  await page.getByRole('button', { name: /terminar antes/i }).click()
  await expect(page.getByRole('heading', { name: /rutina activa: upper \/ lower demo/i })).toBeVisible()
  await expect(page.getByRole('status')).toContainText(/sesión guardada como terminada antes/i)

  await page.getByRole('link', { name: 'Historial' }).click()
  await expect(page.getByRole('heading', { name: 'Historial' })).toBeVisible()
  await expect(page.getByText(/sesiones encontradas: 1/i)).toBeVisible()
  await expect(page.locator('.history-session-card').filter({ hasText: 'Terminada antes' }).first()).toBeVisible()
  await expect(page.locator('.history-session-card').filter({ hasText: 'Upper / Lower Demo' }).first()).toBeVisible()
  await expect(page.locator('.history-detail-card').filter({ hasText: 'Semana 1 · Pull' })).toBeVisible()
  await expect(page.getByText('8 reps')).toBeVisible()
  await expect(page.getByText('70 kg')).toBeVisible()
  await expect(page.getByText('RIR 1', { exact: true })).toBeVisible()
  await expect(page.getByText('560 kg volumen')).toBeVisible()

  await page.getByRole('link', { name: 'Métricas' }).click()
  await expect(page.getByRole('heading', { name: 'Métricas' })).toBeVisible()
  await expect(page.locator('.kpi-card').filter({ hasText: 'Frecuencia esta semana' })).toHaveText(/1/)
  await expect(page.locator('.kpi-card').filter({ hasText: 'Volumen semanal' })).toHaveText(/560 kg/)
  await expect(page.locator('.kpi-card').filter({ hasText: 'Sesiones locales' })).toHaveText(/1/)
  await expect(page.getByText(/1\/2 días en la semana actual/i)).toBeVisible()
  await expect(page.getByText('50%')).toBeVisible()
  await expect(page.getByText(/progreso: remo con barra/i)).toBeVisible()
  await expect(page.getByText(/8 reps totales/i)).toBeVisible()
})
