# Workout History and Analytics Specification

## Purpose

Definir el historial persistente y las métricas del MVP para seguimiento de progreso.

## Requirements

### Requirement: Immutable workout history

The system MUST preserve completed or early-finished sessions as historical records independent from later routine edits.

#### Scenario: View old session after routine changes
- GIVEN a past session exists for a routine that was later edited
- WHEN the user opens that historical session
- THEN the app MUST show the original recorded workout snapshot
- AND it MUST NOT rewrite the session using the new template

#### Scenario: Keep history after routine pause
- GIVEN a routine is no longer active
- WHEN the user reviews history
- THEN its previous sessions MUST remain available

### Requirement: MVP progress metrics

The system MUST provide analytics at exercise level and global level using locally stored history.

#### Scenario: Exercise progress view
- GIVEN multiple sessions exist for the same exercise
- WHEN the user opens exercise analytics
- THEN the app MUST show progress trends for weight, reps, or volume over time

#### Scenario: Global summary view
- GIVEN the user has recorded historical workouts
- WHEN the user opens dashboard analytics
- THEN the app MUST show frequency, weekly volume, and adherence indicators
