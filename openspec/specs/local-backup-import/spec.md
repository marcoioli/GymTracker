# Local Backup Import Specification

## Purpose

Definir cómo se importa un backup JSON local en GymTracker.

## Requirements

### Requirement: Validated local import

The system MUST validate backup structure before restoring data.

#### Scenario: Import valid backup
- GIVEN the user selects a valid GymTracker backup file
- WHEN the system validates the file
- THEN the restore flow MUST allow continuing

#### Scenario: Import invalid backup
- GIVEN the user selects a malformed or incompatible file
- WHEN validation fails
- THEN the system MUST reject the import
- AND the user MUST see a clear error message
