# Change Proposal: GymTracker Batch 5 UX Optimizations

## Why

GymTracker ya cumple el flujo funcional del MVP, pero todavía puede mejorar mucho en su caso de uso principal: registrar una sesión rápida en el gimnasio sin fricción innecesaria. El siguiente salto de calidad no pasa por agregar features nuevas, sino por hacer más cómodo, claro y confiable el flujo de uso diario.

## What Changes

### Batch 5 — UX de uso real en gimnasio
- Refinar la pantalla de sesión para entrada rápida con una sola mano.
- Mejorar CTA, jerarquía visual y feedback de guardado/finalización.
- Hacer más clara la referencia de la sesión previa y el progreso inmediato.
- Ajustar navegación, foco y accesibilidad móvil para reducir errores.
- Consolidar componentes UI usados en sesión, dashboard e historial.

## Capabilities

This change will introduce the following capabilities:
- `workout-session-ux`
- `mobile-feedback-and-accessibility`

## Impacted Areas

- Workout session screen
- Dashboard start-workout flow
- Shared UI primitives
- Accessibility and mobile interaction patterns

## Risks

- Si recargamos la pantalla de sesión con demasiado detalle visual, perdemos velocidad de uso.
- Si el feedback de guardado no es claro, el usuario puede dudar si la serie o la sesión quedó persistida.
- Si tocamos navegación o tab order sin cuidado, podemos romper accesibilidad o E2E existentes.

## Rollback Plan

- Mantener intactas las reglas de dominio y tocar primero solo presentación e interacción.
- Si alguna mejora visual complica el flujo, revertir los componentes de UI sin tocar persistencia ni snapshots.
