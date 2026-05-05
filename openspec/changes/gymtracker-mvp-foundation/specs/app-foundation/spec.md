# App Foundation Specification

## Purpose

Definir la base operativa de GymTracker como PWA personal, offline-first y mobile-first.

## Requirements

### Requirement: Offline-first app shell

The system MUST load as a mobile-first PWA and MUST preserve core functionality without network connectivity.

#### Scenario: Open app without internet
- GIVEN the app was installed or opened previously
- WHEN the user opens GymTracker without connection
- THEN the shell MUST render successfully
- AND previously saved local data MUST remain available

#### Scenario: First-time empty state
- GIVEN no routines or sessions exist yet
- WHEN the user opens the app home
- THEN the app MUST show an empty but usable dashboard
- AND the primary CTA to create or start a routine MUST remain visible

### Requirement: Fast home entry point

The system MUST present a dashboard home with a dominant action for starting the active workout flow.

#### Scenario: Active routine exists
- GIVEN one routine is active
- WHEN the user lands on the home screen
- THEN the app MUST show the suggested workout day
- AND a prominent start button MUST be available

#### Scenario: No active routine exists
- GIVEN no routine is active
- WHEN the user lands on the home screen
- THEN the app MUST NOT show a misleading workout CTA
- AND the app MUST guide the user to create or activate a routine
