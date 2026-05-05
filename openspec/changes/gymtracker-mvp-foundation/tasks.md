# Tasks: GymTracker MVP Foundation

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Crear `package.json`, `tsconfig*.json`, `vite.config.ts` y bootstrap React/Vite/PWA para una app vacía mobile-first.
- [x] 1.2 Instalar y configurar `vitest`, `@testing-library/react`, `playwright`, `eslint`, `prettier` y scripts de calidad en `package.json`.
- [x] 1.3 Crear `src/app/App.tsx`, `src/app/router.tsx` y `src/app/providers.tsx` con shell inicial, rutas y providers.
- [x] 1.4 Crear `src/db/database.ts` con Dexie y tablas para routines, exerciseCatalog, sessions y appState.

## Phase 2: Domain / Routine Model

- [x] 2.1 Crear `src/domain/routines.ts` con tipos de rutina, semanas, días, ejercicios y progreso de rutina activa.
- [x] 2.2 Crear `src/domain/sessions.ts` con snapshot de sesión, estados `completed` y `ended-early`, y payload por serie.
- [x] 2.3 Crear `src/domain/analytics.ts` con contratos para frecuencia, adherencia, volumen semanal y progreso por ejercicio.
- [x] 2.4 Implementar `src/features/routines/` para crear/editar rutinas con semanas, días nombrables y ejercicios reutilizables.
- [x] 2.5 Implementar activación/pausa de rutinas en `src/features/routines/` garantizando un solo `activeRoutineId`.

## Phase 3: Workout Session Flow

- [x] 3.1 Implementar `src/features/dashboard/` para mostrar home vacía o rutina activa con CTA dominante de iniciar entrenamiento.
- [x] 3.2 Implementar modal en `src/features/session/ConfirmWorkoutDayModal.tsx` con día sugerido preseleccionado y override manual.
- [x] 3.3 Implementar `src/features/session/WorkoutSessionScreen.tsx` con inputs vacíos de repeticiones, peso y RIR usando `inputmode='numeric'`.
- [x] 3.4 Mostrar referencia visible de la sesión anterior por ejercicio/serie sin autocompletar valores editables.
- [x] 3.5 Persistir finalización completa o anticipada en IndexedDB como snapshot inmutable y actualizar progreso de rutina.

## Phase 4: History / Analytics / UI

- [x] 4.1 Implementar `src/features/history/` para listar sesiones por rutina, día y detalle histórico congelado.
- [x] 4.2 Implementar `src/features/analytics/` con vistas de progreso por ejercicio y resumen global local.
- [x] 4.3 Crear `src/shared/ui/` con botones, cards, numeric inputs y layout siguiendo tipografía/paleta del design system.
- [x] 4.4 Aplicar accesibilidad móvil: labels visibles, `role='alert'`, foco visible y `overscroll-behavior: contain`.

## Phase 5: Testing / Verification

- [x] 5.1 Escribir tests unitarios para sugerencia del próximo día y selectores de volumen/adherencia en `src/domain/*.test.ts`.
- [x] 5.2 Escribir tests de integración para crear rutina, cambiar rutina activa y guardar sesión temprana sin mutar historial.
- [x] 5.3 Escribir E2E con Playwright: crear rutina, iniciar entrenamiento, cambiar día, cargar series y finalizar anticipadamente.
