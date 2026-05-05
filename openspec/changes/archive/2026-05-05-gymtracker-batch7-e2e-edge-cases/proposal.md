# Proposal: GymTracker Batch 7 E2E Edge Cases

## Intent

Blindar el MVP con cobertura E2E sobre casos borde reales que hoy pueden romperse al tocar UX, persistencia o backup. Después de Batch 6, la prioridad correcta es confiabilidad del flujo, no features nuevas.

## Scope

### In Scope
- Cubrir con Playwright los bordes críticos del flujo de entrenamiento, backup y persistencia local.
- Validar estados vacíos y bloqueados que deben comunicar claramente qué hacer.
- Proteger contra regresiones al recargar la app y al restaurar datos locales.

### Out of Scope
- Nuevas features de producto, sync o cloud.
- Refactors grandes de UI o dominio fuera de lo necesario para testabilidad.

## Capabilities

### New Capabilities
- `edge-case-e2e-coverage`: Cobertura browser-level para bordes del flujo principal de entrenamiento.
- `backup-flow-regression-protection`: Protección E2E para export, import inválido y restore destructivo.
- `offline-persistence-regression-checks`: Verificación E2E de recarga, estados vacíos y consistencia local.

### Modified Capabilities
- None

## Approach

Extender Playwright con seeds y helpers reutilizables para preparar IndexedDB/localStorage, luego modelar escenarios de borde que ya son parte del contrato del producto. Si falta estabilidad por selectores o mensajes ambiguos, ajustar solo lo mínimo para hacer el comportamiento verificable.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `e2e/*.spec.ts` | Modified/New | Nuevos escenarios de borde y consolidación de helpers |
| `src/features/dashboard/*` | Modified | Ajustes mínimos si hace falta exponer estados verificables |
| `src/features/backup/*` | Modified | Ajustes mínimos para mensajes/confirmaciones estables |
| `src/features/history/*` | Modified | Ajustes mínimos para empty states o navegación verificable |
| `src/features/analytics/*` | Modified | Ajustes mínimos para empty states verificables |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| E2E frágiles por selectores débiles | Med | Favorecer roles, labels y textos estables |
| Tests lentos o redundantes | Med | Compartir helpers y agrupar por intención |
| Descubrir bugs reales fuera del scope | Med | Corregir solo lo necesario para cumplir el contrato |

## Rollback Plan

Revertir los specs E2E nuevos y cualquier ajuste mínimo de testabilidad sin tocar dominio ni persistencia central.

## Dependencies

- Playwright ya instalado y operativo en el proyecto.

## Success Criteria

- [ ] Los bordes críticos de entrenamiento, backup y persistencia tienen cobertura E2E explícita.
- [ ] La suite E2E detecta regresiones sobre estados vacíos, recarga local y restore destructivo.
- [ ] No se agregan features nuevas para “hacer pasar” los tests.
