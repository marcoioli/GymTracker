# Session Input Sanitization Specification

## Purpose

Definir la sanitización y validación de inputs numéricos usados para guardar sesiones.

## Requirements

### Requirement: Session numeric input is normalized consistently

The system MUST normalize numeric workout input consistently before saving local snapshots.

#### Scenario: Accept comma decimal input
- GIVEN the user enters numeric text with comma decimal separators
- WHEN the session draft is normalized
- THEN the persisted numeric value MUST be parsed consistently

#### Scenario: Ignore non-numeric garbage safely
- GIVEN the user leaves garbage text in a numeric input
- WHEN the repository sanitizes the draft
- THEN that field MUST resolve to a safe null-like value
- AND the snapshot save MUST remain structurally valid

### Requirement: Session draft shape matches planned structure

The system MUST preserve alignment between planned exercises/sets and the saved session snapshot.

#### Scenario: Draft has fewer sets than planned
- GIVEN the draft omits some planned set inputs
- WHEN the repository builds the snapshot
- THEN the missing planned sets MUST still exist in the saved structure
- AND omitted values MUST be normalized safely
