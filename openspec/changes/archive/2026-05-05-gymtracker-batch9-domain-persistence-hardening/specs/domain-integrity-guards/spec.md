# Domain Integrity Guards Specification

## Purpose

Definir las invariantes mínimas que deben sostener rutinas, progreso y snapshots antes de persistirse o consumirse.

## Requirements

### Requirement: Persisted domain entities remain structurally valid

The system MUST reject or sanitize domain writes that would leave routines, progress, or session snapshots in an invalid structural state.

#### Scenario: Reject invalid routine draft
- GIVEN a routine draft with missing identity, invalid day counts, or malformed exercises
- WHEN the repository validates that draft
- THEN the write MUST be rejected with a deterministic validation error

#### Scenario: Sanitize incomplete session set input
- GIVEN a session draft with blank or malformed numeric values
- WHEN the repository prepares the snapshot
- THEN invalid numbers MUST be normalized safely
- AND the resulting snapshot MUST keep a valid set structure

### Requirement: Progress never points outside the routine structure

The system MUST keep routine progress within valid week/day boundaries.

#### Scenario: Restore or mutation leaves stale progress
- GIVEN a routine whose stored progress no longer matches the current structure
- WHEN the domain resolves progress-dependent behavior
- THEN it MUST fall back to a safe valid position instead of reading out-of-bounds data
