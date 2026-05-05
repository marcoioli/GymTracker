# Local Backup Export Specification

## Purpose

Definir cómo el usuario exporta una copia local completa de sus datos de GymTracker.

## Requirements

### Requirement: Full local export

The system MUST export routines, app state, exercise catalog, sessions, and backup metadata into one JSON file.

#### Scenario: Export current data
- GIVEN the user has local GymTracker data
- WHEN the user triggers export
- THEN the system MUST generate one downloadable JSON backup
- AND the file MUST include all persisted product entities

#### Scenario: Export with empty data
- GIVEN the user has no routines or sessions yet
- WHEN the user triggers export
- THEN the system MUST still generate a valid JSON backup
