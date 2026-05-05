# Design: GymTracker Batch 8 Design System Consolidation

## Technical Approach

Convertir el estilo actual en un sistema explícito: tokens CSS semánticos + primitivas React chicas en `src/shared/ui`. La implementación va de adentro hacia afuera: primero foundations, después migración de pantallas, y al final limpieza de CSS repetido.

## Architecture Decisions

### Decision: Keep CSS global but introduce semantic tokens

**Choice**: Consolidar variables y estados en `global.css` sin mover todavía a CSS Modules o CSS-in-JS.
**Alternatives considered**: Reescribir styling infra completa.
**Rationale**: El producto ya funciona; este batch ordena sin abrir un frente técnico gigante.

### Decision: Prefer small primitives over one giant layout kit

**Choice**: Agregar piezas chicas (`Field`, `EmptyState`, `StatusBanner`, variantes extra de `Card`/`PageSection`).
**Alternatives considered**: Un componente mega-configurable para todo.
**Rationale**: Composición simple, menor acoplamiento y mejor legibilidad en features.

### Decision: Migrate screen by screen

**Choice**: Adoptar primitives primero en dashboard, backup, history, analytics y rutinas.
**Alternatives considered**: Cambiar toda la app en un solo diff de CSS.
**Rationale**: Reduce riesgo de regresiones visuales y facilita ver qué patrón realmente se repite.

## Data Flow

```text
Feature page
  -> shared UI primitive
  -> semantic class / token
  -> global.css foundation
  -> rendered mobile surface
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/shared/ui/Button.tsx` | Modify | Variantes y tamaños más explícitos si falta |
| `src/shared/ui/Card.tsx` | Modify | Variantes de superficie o densidad |
| `src/shared/ui/PageSection.tsx` | Modify | Encabezados y acciones consistentes |
| `src/shared/ui/Field.tsx` | Create | Wrapper compartido para label, hint y error |
| `src/shared/ui/EmptyState.tsx` | Create | Estado vacío reutilizable |
| `src/shared/ui/StatusBanner.tsx` | Create | Éxito, info y error consistentes |
| `src/shared/ui/index.ts` | Modify | Exports de nuevas primitivas |
| `src/styles/global.css` | Modify | Tokens semánticos, utilidades y limpieza de duplicación |
| `src/features/**/*Page.tsx` | Modify | Migración gradual a shared UI |

## Interfaces / Contracts

```ts
type StatusBannerTone = 'success' | 'info' | 'error' | 'warning'
type SurfaceVariant = 'default' | 'subtle' | 'highlight'
type FieldMessageTone = 'default' | 'error'
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Render de nuevas primitivas y variantes | RTL/Vitest |
| Integration | Pantallas migradas mantienen copy, roles y jerarquía | RTL/Vitest |
| E2E | Solo ajustar snapshots/flows si cambia algún selector estable | Playwright mínimo |

## Migration / Rollout

No migration required. Cambio incremental de presentación sobre features existentes.

## Open Questions

- [ ] Conviene introducir una primitive específica para métricas/KPI o alcanza con variantes de `Card`.
