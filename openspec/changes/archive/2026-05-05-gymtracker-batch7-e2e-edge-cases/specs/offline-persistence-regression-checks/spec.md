# Offline Persistence Regression Checks Specification

## Purpose

Definir los checks E2E de persistencia local y estados vacíos que sostienen el contrato offline-first del producto.

## Requirements

### Requirement: Durable local state and clear empty states

The system MUST preserve locally saved state across reloads and MUST present clear guidance when history, analytics, or routines have no usable data.

#### Scenario: Active routine persists after reload
- GIVEN the user has one active routine stored locally
- WHEN the browser reloads the application
- THEN the dashboard MUST still show that active routine
- AND the user MUST be able to continue from the same local context

#### Scenario: Empty history and analytics remain understandable
- GIVEN the device has no saved sessions
- WHEN the user opens history or analytics
- THEN each screen MUST show a clear empty-state explanation
- AND the user MUST not see broken summaries or misleading values

#### Scenario: Active and paused routines remain distinguishable
- GIVEN the device stores one active routine and at least one paused routine
- WHEN the user opens the routines screen after reload or navigation
- THEN the active routine MUST remain identifiable as active
- AND paused routines MUST remain available without stealing active state
