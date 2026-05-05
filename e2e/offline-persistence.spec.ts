import { expect, test } from '@playwright/test'

import { activateRoutine, createRoutine, resetLocalApp } from './support/app'

test('mantiene la rutina activa y distingue rutinas pausadas después de recargar', async ({ page }) => {
  await resetLocalApp(page)

  await createRoutine(page, {
    name: 'Rutina activa persistida',
    days: [{ label: 'Push', exercises: ['Press banca'] }]
  })

  await activateRoutine(page, 'Rutina activa persistida')

  await createRoutine(page, {
    name: 'Rutina pausada visible',
    days: [{ label: 'Pull', exercises: ['Remo con barra'] }]
  })
  await page.reload()

  const activeCard = page.locator('.routine-card').filter({ hasText: 'Rutina activa persistida' }).first()
  const pausedCard = page.locator('.routine-card').filter({ hasText: 'Rutina pausada visible' }).first()

  await expect(activeCard.getByText(/^Activa$/)).toBeVisible()
  await expect(activeCard.getByRole('button', { name: /pausar rutina/i })).toBeVisible()
  await expect(pausedCard.getByText(/^Pausada$/)).toBeVisible()
  await expect(pausedCard.getByRole('button', { name: /activar rutina/i })).toBeVisible()

  await page.getByRole('link', { name: 'Inicio' }).click()
  await page.reload()
  await expect(page.getByRole('heading', { name: /rutina activa: rutina activa persistida/i })).toBeVisible()
})

test('muestra empty states claros cuando no hay sesiones en historial ni métricas', async ({ page }) => {
  await resetLocalApp(page)

  await page.goto('/history')
  await expect(page.getByText(/todavía no guardaste sesiones/i)).toBeVisible()
  await expect(page.getByText(/sesiones encontradas:/i)).toHaveCount(0)

  await page.goto('/analytics')
  await expect(page.getByText(/todavía no hay historial suficiente/i)).toBeVisible()
  await expect(page.getByText(/resumen global/i)).toHaveCount(0)
})
