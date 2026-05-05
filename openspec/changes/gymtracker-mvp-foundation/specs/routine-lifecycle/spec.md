# Routine Lifecycle Specification

## Purpose

Definir cómo conviven rutinas activas, pausadas y reactivadas dentro del producto.

## Requirements

### Requirement: Single active routine policy

The system MUST allow many saved routines but SHALL keep only one routine active at a time.

#### Scenario: Activate a new routine
- GIVEN one routine is active and another saved routine exists
- WHEN the user activates the saved routine
- THEN the newly selected routine MUST become active
- AND the previously active routine MUST stop being active

#### Scenario: Prevent ambiguous active state
- GIVEN the user manages saved routines
- WHEN the system evaluates routine states
- THEN two routines MUST NOT remain active simultaneously

### Requirement: Resume paused routine context

The system MUST preserve each routine's own progress state and history so a paused routine can be resumed later.

#### Scenario: Resume paused routine
- GIVEN a routine was used for two weeks and then paused
- WHEN the user reactivates that routine later
- THEN the routine MUST restore its saved progress context
- AND its historical sessions MUST still be available for reference
