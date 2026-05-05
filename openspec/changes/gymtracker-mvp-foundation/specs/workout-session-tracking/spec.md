# Workout Session Tracking Specification

## Purpose

Definir el flujo de inicio, carga y cierre de una sesión de entrenamiento.

## Requirements

### Requirement: Suggested day with manual override

The system MUST suggest the next workout day from the active routine and MUST allow the user to confirm or change that day before the session starts.

#### Scenario: Start suggested workout day
- GIVEN an active routine has a next suggested day
- WHEN the user taps the start workout CTA
- THEN the app MUST open a confirmation modal
- AND the suggested day MUST be preselected

#### Scenario: Override suggested day
- GIVEN the confirmation modal is open
- WHEN the user selects a different valid day from the active routine
- THEN the session MUST start for the chosen day

### Requirement: Set-by-set workout capture

The system MUST capture repetitions, weight, and actual RIR for each set, using empty inputs and visible reference data from the previous session.

#### Scenario: Enter set performance
- GIVEN a session is active for a planned exercise
- WHEN the user records set data
- THEN each set MUST accept repetitions, weight, and actual RIR
- AND previous-session reference data SHOULD be visible without autofilling inputs

#### Scenario: Finish session early
- GIVEN some sets were recorded but the full plan was not completed
- WHEN the user ends the workout early
- THEN the session MUST be saved with recorded progress only
- AND the session status MUST indicate early completion
