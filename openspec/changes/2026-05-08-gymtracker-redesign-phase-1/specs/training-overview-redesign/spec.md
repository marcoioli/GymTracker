# Spec: Training Overview Redesign

## Overview

GymTracker MUST rediseñar sus pantallas principales para que la información crítica se entienda rápido durante un entrenamiento real, usando datos derivados del almacenamiento local existente.

## Requirements

### Requirement: Home prioritizes today's workout

La Home SHALL responder qué rutina toca hoy y cuál es la acción principal sin requerir exploración adicional.

#### Scenario: Active routine exists

Given que existe una rutina activa
When el usuario abre `Inicio`
Then la app MUST mostrar el día sugerido o el siguiente entrenamiento disponible
And MUST presentar un CTA principal para iniciar entrenamiento
And SHOULD mostrar contexto adicional como series, ejercicios, última vez o actividad semanal usando datos reales

#### Scenario: No active routine exists

Given que no existe una rutina activa
When el usuario abre `Inicio`
Then la app MUST mostrar un estado vacío claro
And MUST ofrecer una acción principal para crear o activar una rutina

### Requirement: Routine and history screens remain data truthful

Las pantallas de `Rutinas` y `Historial` SHALL mejorar jerarquía visual sin inventar entidades que el dominio todavía no soporta.

#### Scenario: Missing secondary concepts

Given que el dominio no tiene plantillas, favoritos, calorías o perfil persistido
When la UI se rediseña
Then la app MUST NOT mostrar valores falsos o hardcodeados como si fueran reales
And SHOULD adaptar la presentación a métricas derivables del estado actual

### Requirement: History remains a frozen snapshot viewer

El historial SHALL seguir mostrando los datos congelados de la sesión guardada.

#### Scenario: Routine template changes after session save

Given que una sesión fue guardada y luego la rutina fue editada
When el usuario revisa esa sesión en `Historial`
Then la app MUST mostrar el snapshot de la sesión guardada
And MUST NOT reemplazarlo con datos actuales de la plantilla
