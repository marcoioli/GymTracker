# Change Proposal: GymTracker MVP Foundation

## Why

GymTracker arranca desde un workspace vacío y necesita una base sólida para convertirse en una PWA personal de seguimiento de gimnasio. El producto debe priorizar velocidad de uso durante la sesión, operación offline, historial persistente y estadísticas útiles sin depender de backend, login ni sincronización.

Además, el dominio ya quedó bastante claro: rutinas editables por semanas y días, una única rutina activa, sesiones históricas congeladas, catálogo reutilizable de ejercicios y dashboard mobile-first con CTA principal de inicio.

## What Changes

Se propone construir el MVP en batches, empezando por una fundación técnica y de dominio que permita crecer sin rehacer todo después.

### Batch 1 — Foundation + App Shell
- Inicializar la app con React + TypeScript + Vite + PWA.
- Preparar almacenamiento local y estructura base del dominio.
- Implementar navegación mobile-first y dashboard inicial vacío.

### Batch 2 — Routine Builder
- Crear rutinas con cantidad configurable de semanas.
- Permitir de 1 a 7 días por semana con nombre personalizado.
- Agregar ejercicios por texto libre, series y RIR objetivo.
- Guardar ejercicios en un catálogo reutilizable.

### Batch 3 — Workout Session Flow
- Mostrar la rutina activa y sugerir automáticamente el próximo día.
- Abrir modal de confirmación con posibilidad de cambiar el día antes de iniciar.
- Permitir registrar repeticiones, peso y RIR por serie con inputs vacíos.
- Mostrar referencia de la sesión anterior sin autocompletar.
- Finalizar sesión completa o anticipadamente, guardando snapshot histórico.

### Batch 4 — History + Analytics
- Mostrar historial de sesiones por rutina, día y ejercicio.
- Calcular progreso por ejercicio (peso, reps, volumen).
- Calcular métricas globales (frecuencia, adherencia, volumen semanal).
- Diseñar dashboard útil para consulta rápida desde el celular.

### Batch 5 — Routine Lifecycle
- Permitir una sola rutina activa y múltiples rutinas guardadas.
- Conservar el estado y progreso acumulado de rutinas pausadas.
- Reactivar rutinas guardadas sin perder contexto histórico.

## Capabilities

This change will introduce the following capabilities:
- `app-foundation`
- `routine-management`
- `workout-session-tracking`
- `workout-history-and-analytics`
- `routine-lifecycle`

## Impacted Areas

- Frontend application bootstrap
- Local persistence model
- Domain entities for routines, sessions, exercises and analytics
- Mobile UX for dashboard, routine editing and workout execution

## Risks

- Si mezclamos plantilla editable y sesiones históricas, se rompe el historial.
- Si el flujo de carga por serie tiene demasiada fricción, la app fracasa en su caso principal de uso.
- Si no diseñamos bien el modelo de rutina activa/pausada, después cuesta mucho sostener reanudación y estadísticas.

## Rollback Plan

- Mantener cada batch aislado para poder revertir componentes o módulos individuales.
- Si alguna decisión de UX del flujo de sesión no funciona, conservar el dominio y ajustar solo presentación/interacción.
- Si la PWA complica demasiado el primer corte, sostener React/Vite web-first y habilitar PWA en un batch técnico posterior.
