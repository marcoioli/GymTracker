# Proposal: GymTracker Batch 8 Design System Consolidation

## Intent

Consolidar el design system real del producto para dejar de depender de clases sueltas y estilos repetidos. Después de blindar confiabilidad en Batch 7, toca ordenar la capa visual para que próximas mejoras no rompan consistencia ni accesibilidad mobile.

## Scope

### In Scope
- Extraer tokens y primitivas UI reutilizables para acciones, campos, estados y superficies.
- Unificar empty states, status banners y jerarquías visuales entre dashboard, rutinas, historial, métricas y backup.
- Reducir duplicación en `global.css` y en componentes de features sin cambiar el flujo del producto.

### Out of Scope
- Rediseño total de marca o cambio de identidad visual.
- Nuevas features funcionales o refactor de dominio/persistencia.

## Capabilities

### New Capabilities
- `shared-ui-foundations`: Tokens y primitivas compartidas para botones, cards, secciones, campos y estados.
- `consistent-mobile-feedback-surfaces`: Presentación consistente de alerts, empty states y feedback de éxito/error en toda la app.

### Modified Capabilities
- None

## Approach

Tomar los patrones que hoy ya existen y formalizarlos en `src/shared/ui` y tokens CSS semánticos. La regla es simple: primero consolidar fundamentos, después migrar pantallas a esas piezas, y recién al final limpiar estilos duplicados.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/shared/ui/*` | Modified/New | Nuevas primitivas y props semánticas |
| `src/styles/global.css` | Modified | Tokens, estados y reducción de duplicación |
| `src/features/**/*Page.tsx` | Modified | Adopción gradual de componentes compartidos |
| `src/features/session/*` | Modified | Unificar banners, bloques y jerarquía mobile |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cambiar demasiado CSS y romper layout | Med | Migración incremental por primitivas |
| Crear componentes demasiado abstractos | Med | Consolidar solo patrones ya repetidos |
| Mezclar limpieza visual con nuevas features | Low | Mantener scope estrictamente UI/shared |

## Rollback Plan

Revertir las nuevas primitivas o tokens por pantalla afectada, manteniendo intacto el dominio y la persistencia.

## Dependencies

- Base visual existente en `src/shared/ui/*` y `src/styles/global.css`.

## Success Criteria

- [ ] Las pantallas principales usan primitivas compartidas para acciones, secciones, campos y estados.
- [ ] Empty states y status banners se ven y se comportan de forma consistente en mobile.
- [ ] Se reduce duplicación visible de estilos sin cambiar contratos funcionales.
