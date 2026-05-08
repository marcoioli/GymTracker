# Spec: Secondary Control Hub

## Overview

GymTracker MUST ofrecer una pantalla `Más` que concentre módulos secundarios ya implementados y resuma el estado general del usuario sin agregar dependencias nuevas de dominio.

## Requirements

### Requirement: More groups secondary modules consistently

La pantalla `Más` SHALL actuar como centro de control secundario.

#### Scenario: Implemented secondary modules exist

Given que `Métricas` y `Respaldo` ya existen en la aplicación
When el usuario abre `Más`
Then la app MUST mostrar accesos visibles a esos módulos
And SHOULD acompañarlos con una breve descripción de propósito

### Requirement: More summary uses real app state

La cabecera o resumen de `Más` SHALL usar estado real derivado de la app.

#### Scenario: User has training data

Given que existen rutinas o sesiones guardadas
When la pantalla `Más` renderiza su resumen superior
Then la app SHOULD mostrar indicadores reales como rutina activa, racha, sesiones o volumen
And MUST evitar presentar objetivos o perfiles ficticios como si estuvieran persistidos
