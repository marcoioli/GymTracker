# Backup Validation and Restore Specification

## Purpose

Definir cómo se confirma y ejecuta la restauración local de datos.

## Requirements

### Requirement: Safe restore confirmation

The system MUST require explicit confirmation before replacing current local data with imported backup content.

#### Scenario: Confirm destructive restore
- GIVEN valid backup data is ready to restore
- WHEN the user is about to continue
- THEN the UI MUST clearly warn that current local data will be replaced
- AND restore MUST only proceed after explicit confirmation

#### Scenario: Complete restore
- GIVEN the user confirms restore
- WHEN restoration finishes successfully
- THEN the imported data MUST replace the current local data consistently
- AND the app MUST be usable immediately after restore
