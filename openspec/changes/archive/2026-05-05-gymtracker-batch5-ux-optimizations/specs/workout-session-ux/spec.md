# Workout Session UX Specification

## Purpose

Definir mejoras de usabilidad para registrar entrenamientos más rápido y con menos fricción en el gimnasio.

## Requirements

### Requirement: Fast session input ergonomics

The system MUST optimize the workout session screen for quick mobile input with clear grouping, strong field affordance, and low cognitive load.

#### Scenario: Read and enter one set quickly
- GIVEN the user is inside an active workout session
- WHEN the user scans one exercise block
- THEN set number, previous reference, and input fields MUST be visually grouped
- AND the user SHOULD understand what to enter without reading extra instructions

#### Scenario: Use the screen with one hand
- GIVEN the user is holding the phone during training
- WHEN the user interacts with the session screen
- THEN primary actions and numeric inputs MUST remain easy to tap on mobile

### Requirement: Immediate session feedback

The system MUST provide clear visual feedback for saving, finishing early, and successful completion.

#### Scenario: Finish session early
- GIVEN the user recorded partial data
- WHEN the user ends the session early
- THEN the UI MUST show a clear in-progress saving state
- AND the user MUST return to a consistent post-save screen

#### Scenario: Missing or unavailable prior reference
- GIVEN no previous matching session exists
- WHEN the user views a set row
- THEN the UI MUST communicate that no prior reference is available
