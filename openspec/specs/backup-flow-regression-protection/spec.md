# Backup Flow Regression Protection Specification

## Purpose

Definir qué comportamientos del backup local deben quedar protegidos contra regresiones con cobertura E2E.

## Requirements

### Requirement: Safe backup import and restore flows

The system MUST protect export/import flows with observable browser-level behavior for invalid files, destructive confirmation, and post-restore consistency.

#### Scenario: Reject incompatible backup file
- GIVEN the user selects a malformed or incompatible file in backup import
- WHEN validation fails
- THEN the system MUST reject the import
- AND the destructive restore action MUST remain unavailable

#### Scenario: Require explicit confirmation before replace
- GIVEN a valid backup file is loaded
- WHEN the user reaches the restore preview
- THEN the UI MUST warn that current local data will be replaced
- AND restore MUST only happen after explicit user confirmation

#### Scenario: Replaced data survives navigation after restore
- GIVEN the user confirms restore from a valid backup
- WHEN the app navigates to routines, history, or dashboard after completion
- THEN only the restored local dataset MUST be visible
- AND the replaced temporary data MUST no longer appear
