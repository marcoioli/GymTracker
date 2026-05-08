# Proposal: GymTracker Redesign Phase 1

## Intent

Rediseñar la experiencia principal mobile de GymTracker para alinearla con la nueva dirección dark + naranja definida en `redesign.md` y `design.md`, sin tocar la lógica de negocio ni reemplazar datos reales por mocks.

## Scope

### In Scope
- Reemplazar la navegación principal actual por una navegación inferior de 4 entradas con CTA central flotante.
- Rediseñar `Inicio`, `Rutinas`, `Historial`, `Métricas` y `Respaldo` bajo un sistema visual consistente y mobile-first.
- Incorporar una nueva pantalla `Más` para agrupar accesos secundarios ya implementados.
- Reusar datos reales de Dexie para rutina sugerida, actividad semanal, historial, métricas y respaldo.

### Out of Scope
- Cambios de dominio, persistencia o contratos de datos.
- Nuevas capacidades funcionales como perfil editable, objetivos persistidos, ayuda real o sincronización cloud.
- Reescribir el flujo de carga de sesión más allá del mínimo necesario para conservar coherencia visual.

## Capabilities

### New Capabilities
- `mobile-primary-navigation-redesign`: Navegación inferior consistente con CTA central de inicio rápido.
- `more-control-hub`: Centro secundario para accesos a métricas, respaldo y estado general de la app.

### Modified Capabilities
- `shared-ui-foundations`: Extensión visual del sistema dark premium sobre las primitivas existentes.
- `workout-history-and-analytics`: Presentación más clara y escaneable de historial y progreso sin alterar cálculos.

## Approach

Mantener el dominio intacto y redibujar la capa de presentación desde tres ejes: shell global mobile, bloques de overview con datos reales y superficies reutilizables con jerarquía más fuerte. La navegación pasa a priorizar 4 áreas principales y “Más” absorbe módulos secundarios existentes.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/router.tsx` | Modified | Nuevo shell mobile, navegación inferior y acceso rápido central |
| `src/styles/global.css` | Modified | Nuevo sistema visual dark premium y layouts principales |
| `src/features/dashboard/*` | Modified | Home rediseñada con rutina sugerida, métricas y actividad semanal |
| `src/features/routines/*` | Modified | Lista de rutinas más visual sin cambiar edición/activación |
| `src/features/history/*` | Modified | Historial escaneable con resumen y tarjetas más densas |
| `src/features/analytics/*` | Modified | Métricas visuales alineadas al nuevo sistema |
| `src/features/backup/*` | Modified | Respaldo presentado como módulo secundario premium |
| `src/features/more/*` | New | Nueva pantalla hub para opciones secundarias |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cambiar la navegación y romper orientación del usuario | Med | Mantener 4 áreas claras y CTA central ligado a la rutina sugerida real |
| Rediseñar con información inexistente | High | Mostrar solo datos derivados del dominio actual; no hardcodear métricas ficticias |
| Introducir mucho CSS y afectar pantallas de sesión | Med | Aislar clases nuevas y verificar tests de navegación y features principales |

## Rollback Plan

Revertir cambios de shell y estilos por feature page sin tocar dominio, Dexie ni repositorios.

## Dependencies

- `design.md`
- `redesign.md`
- `src/domain/routines.ts`
- `src/domain/analytics.ts`
- `src/features/session/sessionRepository.ts`

## Success Criteria

- [ ] La app usa navegación inferior de 4 entradas y un CTA central flotante.
- [ ] Home responde en pocos segundos qué rutina toca hoy usando datos reales.
- [ ] `Más` agrupa accesos secundarios existentes sin duplicar navegación principal.
- [ ] Rutinas, Historial, Métricas y Respaldo comparten el mismo lenguaje visual premium.
- [ ] No se agregan datos mockeados ni se alteran contratos de dominio para sostener el rediseño.
