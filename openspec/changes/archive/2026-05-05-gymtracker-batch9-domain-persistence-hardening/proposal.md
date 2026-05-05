# Proposal: GymTracker Batch 9 Domain Persistence Hardening

## Intent

Endurecer las reglas de dominio y los accesos a persistencia local para que datos parciales, estado inconsistente o inputs inválidos no degraden la app. Después de Batch 8, toca fortalecer cimientos, no maquillar más UI.

## Scope

### In Scope
- Validar y sanear drafts de sesión y rutina antes de persistir snapshots o estado activo.
- Hacer más resiliente la lectura de `activeRoutineId`, referencias previas y analytics frente a datos faltantes o inconsistentes.
- Endurecer invariantes de persistencia local con tests unitarios/integración.

### Out of Scope
- Sync/cloud, multi-device o backend.
- Nuevas features de producto visibles para el usuario.

## Capabilities

### New Capabilities
- `domain-integrity-guards`: Guards explícitos para snapshots, progreso y entidades persistidas.
- `resilient-local-persistence`: Lectura/escritura local tolerante a registros faltantes o estado huérfano.
- `session-input-sanitization`: Sanitización y validación consistente de inputs numéricos y drafts de sesión.

### Modified Capabilities
- None

## Approach

Concentrar la lógica defensiva en domain helpers y repositories, no en componentes. Primero definir invariantes y sanitización, después reforzar repositories, y finalmente cubrir corrupción local y edge cases con tests.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/*.ts` | Modified/New | Guards, validadores y helpers de integridad |
| `src/features/routines/routinesRepository.ts` | Modify | Estado activo y persistencia de rutinas más robustos |
| `src/features/session/sessionRepository.ts` | Modify | Sanitización de inputs y snapshot seguro |
| `src/db/database.ts` | Modify | Índices o version bump si hace falta endurecer queries |
| `src/**/*.test.ts(x)` | Modified/New | Cobertura de invariantes y corrupción local |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Endurecer demasiado y rechazar casos válidos | Med | Definir invariantes explícitas y testear antes |
| Migración local introducir drift | Med | Mantener cambios mínimos y versionados |
| Romper analytics por filtros nuevos | Low | Cubrir regresiones con tests de dominio e integración |

## Rollback Plan

Revertir guards o migraciones puntuales manteniendo snapshots existentes y sin tocar UI consolidada.

## Dependencies

- Base funcional actual de rutinas, sesiones, analytics y backup local.

## Success Criteria

- [ ] El sistema rechaza o sanea inputs y estado local inválido sin romper el flujo usable.
- [ ] `activeRoutineId`, snapshots y analytics siguen funcionando aunque existan registros faltantes o huérfanos.
- [ ] La nueva cobertura de tests captura invariantes de dominio y persistencia local.
