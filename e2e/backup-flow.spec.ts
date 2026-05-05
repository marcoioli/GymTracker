import { expect, test } from '@playwright/test'

import { activateRoutine, createRoutine, resetLocalApp } from './support/app'

test('exporta un backup local y permite restaurarlo por reemplazo', async ({ page }) => {
  await resetLocalApp(page)

  await createRoutine(page, {
    name: 'Rutina backup seed',
    days: [{ label: 'Push', exercises: ['Press banca'] }]
  })
  await activateRoutine(page, 'Rutina backup seed')

  await page.getByRole('link', { name: /respaldo/i }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /exportar backup/i }).click()
  const download = await downloadPromise
  const downloadPath = await download.path()

  expect(download.suggestedFilename()).toMatch(/^gymtracker-backup-v1-.*\.json$/)
  expect(downloadPath).toBeTruthy()

  await createRoutine(page, {
    name: 'Rutina temporal',
    days: [{ label: 'Pull', exercises: ['Remo con barra'] }]
  })

  await page.getByRole('link', { name: /respaldo/i }).click()
  await page.getByLabel(/seleccionar archivo de backup/i).setInputFiles(downloadPath!)

  await expect(page.getByRole('heading', { name: /listo para restaurar/i })).toBeVisible()
  await page.getByRole('button', { name: /sí, reemplazar mis datos locales/i }).click()
  await expect(page.getByRole('status')).toContainText(/backup restaurado/i)

  await page.getByRole('link', { name: /inicio/i }).click()
  await expect(page.getByRole('heading', { name: /rutina activa: rutina backup seed/i })).toBeVisible()

  await page.getByRole('link', { name: /rutinas/i }).click()
  await expect(page.getByRole('heading', { name: 'Rutina backup seed' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Rutina temporal' })).toHaveCount(0)
})

test('rechaza archivos incompatibles sin habilitar el restore destructivo', async ({ page }) => {
  await resetLocalApp(page)

  await page.goto('/backup')
  await page.getByLabel(/seleccionar archivo de backup/i).setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ nope: true }))
  })

  await expect(page.getByRole('alert')).toContainText(/backup local válido|formato json esperado/i)
  await expect(page.getByRole('button', { name: /sí, reemplazar mis datos locales/i })).toHaveCount(0)
})
