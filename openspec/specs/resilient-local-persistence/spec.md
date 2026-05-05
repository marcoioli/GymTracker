# Resilient Local Persistence Specification

## Purpose

Definir cómo debe reaccionar la capa local cuando IndexedDB contiene estado huérfano, faltante o inconsistente.

## Requirements

### Requirement: Active routine resolution is self-healing

The system MUST resolve active routine state safely even if `appState` points to a missing or stale routine.

#### Scenario: Orphaned activeRoutineId
- GIVEN local state contains an `activeRoutineId` that no longer exists
- WHEN the app resolves the active routine
- THEN it MUST return a safe fallback result
- AND the stale local pointer SHOULD be repaired or cleared consistently

#### Scenario: Competing active routine sources
- GIVEN `appState` and routine statuses disagree about which routine is active
- WHEN the repository resolves the active routine
- THEN the system MUST choose one deterministic source of truth
- AND it MUST avoid exposing multiple active routines downstream

### Requirement: Read paths tolerate partial historical data

The system MUST keep history, references, and analytics usable when older sessions contain partial but structurally acceptable data.

#### Scenario: Analytics reads partial snapshot
- GIVEN a stored session has missing optional values in some sets
- WHEN analytics or previous-reference selectors consume it
- THEN they MUST ignore only the invalid fragments
- AND the rest of the session MUST remain usable
