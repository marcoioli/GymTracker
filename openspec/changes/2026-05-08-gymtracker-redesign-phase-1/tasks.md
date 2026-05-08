# Tasks: GymTracker Redesign Phase 1

## Phase 1: SDD foundation

- [ ] 1.1 Crear el change de `openspec` para el rediseño y documentar alcance, riesgos y rollback.
- [ ] 1.2 Auditar rutas, pantallas y selectores de dominio existentes para mapear qué datos reales puede mostrar el nuevo UI.

## Phase 2: App shell and navigation

- [ ] 2.1 Reemplazar sidebar/topbar por un shell mobile con navegación inferior fija de 4 entradas.
- [ ] 2.2 Implementar un CTA central flotante que arranque la rutina sugerida o derive a `Rutinas` si no existe un día entrenable.
- [ ] 2.3 Crear la nueva pantalla `Más` y mover allí el descubrimiento de módulos secundarios ya implementados.

## Phase 3: Primary screen redesign

- [ ] 3.1 Rediseñar `DashboardPage` con resumen del día, selector semanal, CTA visible, último entrenamiento y actividad semanal basada en sesiones reales.
- [ ] 3.2 Rediseñar `RoutinesPage` para priorizar escaneo, activación y edición sin perder el formulario existente.
- [ ] 3.3 Rediseñar `HistoryPage` para mejorar lectura rápida, resumen superior y detalle de snapshots.

## Phase 4: Secondary screen redesign

- [ ] 4.1 Rediseñar `AnalyticsPage` con KPIs, tendencias y progreso manteniendo los cálculos actuales.
- [ ] 4.2 Rediseñar `BackupPage` como módulo secundario coherente con la nueva estética.

## Phase 5: Verification

- [ ] 5.1 Ajustar o agregar tests RTL para navegación, dashboard e historial donde cambie semántica visible.
- [ ] 5.2 Ejecutar `npm run test:run` y `npm run typecheck`, corrigiendo solo regresiones reales causadas por el redesign.
