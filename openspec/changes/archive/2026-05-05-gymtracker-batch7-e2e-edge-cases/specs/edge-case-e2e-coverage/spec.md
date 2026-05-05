# Edge Case E2E Coverage Specification

## Purpose

Definir los casos borde del flujo principal de entrenamiento que deben quedar protegidos por cobertura E2E.

## Requirements

### Requirement: Verifiable workout edge flows

The system MUST preserve the critical workout edge flows through real browser interaction, including suggested-day override, blocked start states, and early finish persistence.

#### Scenario: Override suggested workout day
- GIVEN an active routine with more than one trainable day
- WHEN the user opens workout start confirmation and selects a non-default day
- THEN the session MUST start on the chosen day
- AND the UI MUST reflect that chosen day in the session screen

#### Scenario: Block start when active routine has no trainable day
- GIVEN an active routine without any executable workout day
- WHEN the user lands on the dashboard
- THEN the primary start action MUST be disabled
- AND the dashboard MUST explain that the routine needs at least one valid day with exercises

#### Scenario: Persist early-finished session after reload
- GIVEN the user records partial data and ends a session early
- WHEN the app reloads after the save completes
- THEN the session MUST still appear in history
- AND analytics derived from that session MUST remain available locally
