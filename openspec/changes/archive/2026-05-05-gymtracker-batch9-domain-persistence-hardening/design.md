# Design: GymTracker Batch 9 Domain Persistence Hardening

## Technical Approach

Mover la defensa del sistema al núcleo: helpers de dominio para validar/sanitizar y repositories que nunca asuman que IndexedDB está perfecta. La UI sigue delgada; la robustez vive en domain + persistence.

## Architecture Decisions

### Decision: Validate at repository boundaries

**Choice**: Aplicar guards justo antes de persistir o proyectar datos desde Dexie.
**Alternatives considered**: Validar solo en componentes.
**Rationale**: La UI no es la única puerta de entrada: restore, seeds y futuras migraciones también escriben datos.

### Decision: Favor recoverable fallbacks over silent corruption

**Choice**: Si `activeRoutineId` apunta a una rutina inexistente o inválida, caer a un fallback seguro o limpiar estado huérfano.
**Alternatives considered**: Seguir devolviendo `undefined` y dejar que cada pantalla improvise.
**Rationale**: La resiliencia debe ser consistente, no accidental.

### Decision: Keep sanitization deterministic

**Choice**: Centralizar parseo numérico y reglas mínimas de sesión en helpers puros testeables.
**Alternatives considered**: Sanitización dispersa por input o componente.
**Rationale**: Menos duplicación, menos drift, más confianza en snapshots históricos.

## Data Flow

```text
UI draft / restored data
  -> domain guard / sanitizer
  -> repository boundary
  -> Dexie write or safe fallback
  -> selectors / analytics consume normalized data
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/sessions.ts` | Modify | Reglas e invariantes de snapshot/sets |
| `src/domain/routines.ts` | Modify | Helpers para días entrenables, progreso y rutinas válidas |
| `src/domain/analytics.ts` | Modify | Filtrado seguro frente a sesiones huérfanas o incompletas |
| `src/features/session/sessionRepository.ts` | Modify | Sanitización y guardas de sesión |
| `src/features/routines/routinesRepository.ts` | Modify | Recuperación de rutina activa y persistencia robusta |
| `src/db/database.ts` | Modify | Version bump o índices si la persistencia endurecida lo necesita |
| `src/**/*.test.ts(x)` | Modify/New | Cobertura de corrupción local e inputs inválidos |

## Interfaces / Contracts

```ts
type SessionDraftValidation = { success: true; data: SaveWorkoutSessionDraft } | { success: false; error: string }
type ActiveRoutineResolution = { routine: Routine | null; repairedState: boolean }
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Guards, sanitización numérica, fallbacks de rutina activa | Vitest |
| Integration | Persistencia de rutina/sesión con estado inconsistente restaurado | RTL + fake IndexedDB |
| E2E | Solo si algún fallback cambia comportamiento visible | Playwright puntual |

## Migration / Rollout

Puede requerir version bump de Dexie si se agregan índices o reparaciones automáticas sobre `appState`.

## Open Questions

- [ ] Conviene reparar `activeRoutineId` automáticamente en lectura o solo al mutar rutinas.
