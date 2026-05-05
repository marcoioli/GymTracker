# Routine Management Specification

## Purpose

Definir cómo se crean y editan las rutinas de entrenamiento reutilizando ejercicios del usuario.

## Requirements

### Requirement: Configurable routine structure

The system MUST allow the user to create a routine with a configurable number of weeks, and each week MUST contain 1 to 7 named training days.

#### Scenario: Create routine with custom day names
- GIVEN the user is creating a routine
- WHEN the user defines weeks and names each day
- THEN the routine MUST store the selected week count
- AND each day MUST keep its custom label and order

#### Scenario: Invalid day count
- GIVEN the user is editing a week structure
- WHEN the user tries to create fewer than 1 or more than 7 days in a week
- THEN the system MUST reject the invalid configuration

### Requirement: Exercise planning per day

The system MUST allow each day to contain any number of exercises, and each exercise MUST store its name, target set count, and target RIR guidance.

#### Scenario: Add free-text exercise
- GIVEN the user is editing a routine day
- WHEN the user enters an exercise name, set count, and target RIR
- THEN the exercise MUST be added to that day plan
- AND its definition MUST be available for reuse later

#### Scenario: Edit routine after past sessions exist
- GIVEN a routine already has historical sessions
- WHEN the user edits future exercises or structure
- THEN the routine template MUST update
- AND past recorded sessions MUST remain unchanged
