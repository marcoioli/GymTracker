# Spec: Mobile Primary Navigation Redesign

## Overview

GymTracker MUST ofrecer una navegación primaria mobile de 4 entradas con un CTA central flotante, manteniendo acceso rápido a las áreas principales sin depender de sidebar.

## Requirements

### Requirement: Bottom navigation as the primary mobile shell

La app SHALL renderizar una barra inferior consistente en `Inicio`, `Rutinas`, `Historial` y `Más`.

#### Scenario: Active destination is visible at a glance

Given que el usuario está en una de las pantallas principales
When la app renderiza la navegación inferior
Then el ítem activo MUST estar resaltado visualmente
And los otros ítems SHOULD seguir siendo legibles sobre fondo oscuro

### Requirement: Central workout CTA

La app SHALL mostrar un botón central flotante ligado al entrenamiento.

#### Scenario: Suggested workout exists

Given que existe una rutina activa con un día entrenable sugerido
When el usuario toca el CTA central
Then la app MUST navegar al flujo de sesión correspondiente

#### Scenario: Suggested workout does not exist

Given que no existe una rutina activa utilizable
When el usuario toca el CTA central
Then la app MUST llevar al usuario a `Rutinas`

### Requirement: Secondary modules move under Más discovery

La app SHALL dejar de mostrar `Métricas` y `Respaldo` como entradas primarias.

#### Scenario: User opens More

Given que el usuario entra a la pantalla `Más`
When revisa las opciones secundarias
Then la app MUST ofrecer accesos a `Métricas` y `Respaldo`
And MAY mostrar otros módulos solo si tienen un estado honesto de disponibilidad
