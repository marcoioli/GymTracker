# Design: GymTracker Batch 7 E2E Edge Cases

## Technical Approach

Agregar una capa de verificación E2E más granular sobre el comportamiento ya implementado. El foco no es crear nuevas reglas, sino capturar contratos frágiles del MVP en escenarios browser-level reproducibles usando Playwright, IndexedDB limpia y seeds consistentes.

## Architecture Decisions

### Decision: Reuse real browser storage instead of mocking repositories

**Choice**: Sembrar estado real con navegación UI o scripts de inicialización del browser.
**Alternatives considered**: Mockear repositorios o saltar directo a componentes aislados.
**Rationale**: Este batch busca regresiones de integración real entre router, Dexie, formularios y navegación.

### Decision: Split edge coverage by product risk

**Choice**: Separar tests por entrenamiento, backup y persistencia/empty states.
**Alternatives considered**: Un único spec gigante o duplicar seeds en cada test.
**Rationale**: Reduce ruido, mejora mantenibilidad y deja claro qué contrato rompe cada falla.

### Decision: Prefer minimal UI hardening over brittle selectors

**Choice**: Si un flujo no es verificable, agregar labels, roles o copy estable mínimos.
**Alternatives considered**: Selectores CSS frágiles o timeouts arbitrarios.
**Rationale**: La accesibilidad y la testabilidad buena suelen ser el mismo problema resuelto bien.

## Data Flow

```text
Playwright test
  -> limpia storage e IndexedDB
  -> siembra estado por UI o init script
  -> ejecuta flujo real en router
  -> verifica copy, navegación y persistencia
  -> recarga página cuando aplique
  -> revalida estado observable
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `e2e/mvp-flow.spec.ts` | Modify | Extraer helpers comunes o acotar happy path principal |
| `e2e/backup-flow.spec.ts` | Modify | Añadir import inválido y confirmación destructiva explícita |
| `e2e/edge-workout-flow.spec.ts` | Create | Casos borde de rutina activa, día sugerido y finalización anticipada |
| `e2e/offline-persistence.spec.ts` | Create | Recarga, estados vacíos y consistencia local visible |
| `e2e/support/*` | Create/Modify | Helpers de reset, seed y navegación reutilizable si hace falta |
| `src/features/dashboard/DashboardPage.tsx` | Modify | Endurecer copy/estado verificable si algún borde hoy es ambiguo |
| `src/features/backup/BackupPage.tsx` | Modify | Endurecer mensajes o estados de restore/import si hace falta |

## Interfaces / Contracts

```ts
type E2ESeedRoutine = {
  name: string
  status?: 'active' | 'paused'
  weeks: Array<{
    label: string
    days: Array<{ label: string; exercises: Array<{ name: string; targetSets: number; targetRir: number | null }> }>
  }>
}
```

Los helpers de seed deben producir estado observable equivalente al uso real, no shortcuts con shapes inventados.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Ninguno nuevo por defecto | Reusar cobertura actual |
| Integration | Solo si aparece bug de testabilidad | Ajuste puntual con RTL |
| E2E | Override de día, sesión anticipada, import inválido, restore, reload, empty states | Playwright con storage limpio y seeds repetibles |

## Migration / Rollout

No migration required.

## Open Questions

- [ ] Conviene introducir `e2e/support/seed.ts` ahora o recién cuando haya duplicación real.
