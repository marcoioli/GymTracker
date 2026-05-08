# Design: GymTracker Redesign Phase 1

## Technical Approach

El rediseño se implementa sobre la arquitectura existente React + Dexie sin tocar contratos de dominio. La estrategia es reemplazar el shell superior/sidebar por un shell mobile con navegación inferior fija, luego rearmar cada pantalla principal con bloques de overview, métricas y tarjetas reutilizables derivadas de datos reales.

## Architecture Decisions

### Decision: Keep the existing routes for secondary modules but move discovery into `Más`

**Choice**: Mantener `AnalyticsPage` y `BackupPage` como rutas propias, pero sacarlas de la navegación primaria y exponerlas desde una nueva pantalla `Más`.
**Alternatives considered**: Anidar rutas nuevas bajo `/more/*` o eliminar las rutas actuales.
**Rationale**: Minimiza ruptura técnica y mantiene el objetivo UX de agrupar secundarios sin abrir una migración de URLs innecesaria.

### Decision: Derive dashboard summaries only from current domain data

**Choice**: Mostrar rutina sugerida, días entrenados, racha, volumen, último entrenamiento y actividad semanal solo con datos disponibles en Dexie.
**Alternatives considered**: Inventar campos como calorías, objetivos o perfil persistido.
**Rationale**: El requerimiento exige datos reales. Si el dominio no tiene una señal, el UI debe degradar con honestidad en vez de mentir.

### Decision: Extend current shared primitives instead of introducing a new UI framework

**Choice**: Reusar `Button`, `Card`, `PageSection`, `EmptyState` y `Field`, apoyados por nuevas clases semánticas en `global.css`.
**Alternatives considered**: Reescribir todo con otra infraestructura de estilos o un kit nuevo de componentes.
**Rationale**: Menor riesgo, menor diff conceptual y mejor compatibilidad con la base ya consolidada en Batch 8.

## Data Flow

```text
Dexie live queries
  -> routine/session/domain analytics selectors
  -> page-level derived view models
  -> shared visual blocks and mobile shell
  -> rendered dark premium screens
```

## Navigation Flow

```text
Bottom nav item
  -> route change
  -> focused main content

Floating CTA
  -> suggested workout lookup from active routine
  -> navigate to session route when available
  -> fallback to routines page when no trainable day exists

More page
  -> secondary module card
  -> analytics or backup route
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/router.tsx` | Modify | Eliminar sidebar/topbar y crear shell mobile con bottom nav + CTA central |
| `src/styles/global.css` | Modify | Nuevo layout, tokens y superficies para el rediseño integral |
| `src/features/dashboard/DashboardPage.tsx` | Modify | Home premium con overview semanal, CTA y resumen real |
| `src/features/routines/RoutinesPage.tsx` | Modify | Cards de rutinas, filtros simples y formulario visualmente integrado |
| `src/features/history/HistoryPage.tsx` | Modify | Resumen mensual, filtros rápidos y mejor escaneo de sesiones |
| `src/features/analytics/AnalyticsPage.tsx` | Modify | Visualización moderna de frecuencia, volumen y progreso |
| `src/features/backup/BackupPage.tsx` | Modify | Módulo premium consistente para export/import |
| `src/features/more/MorePage.tsx` | Create | Hub secundario con accesos implementados y estado general |
| `src/features/*/*.test.tsx` | Modify | Ajuste de expectativas semánticas relevantes del nuevo UX |

## Interfaces / Contracts

```ts
type BottomNavigationItem = {
  to: string
  label: 'Inicio' | 'Rutinas' | 'Historial' | 'Más'
  icon: 'home' | 'routines' | 'history' | 'more'
}

type WeeklyActivityDay = {
  key: string
  label: string
  value: number
  completed: boolean
  isToday: boolean
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Helpers de métricas derivadas para Home si se agregan | Vitest |
| Integration | Dashboard, Historial y Respaldo mantienen navegación y datos reales visibles | RTL/Vitest |
| Integration | CTA principal y accesos secundarios siguen llevando al flujo correcto | RTL/Vitest |

## Migration / Rollout

No migration required. El cambio es de presentación y estructura de navegación sobre el mismo almacenamiento local.

## Open Questions

- [ ] Si en una fase posterior conviene persistir perfil/objetivos para completar la pantalla `Más` con datos reales adicionales.
