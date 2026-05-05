# Consistent Mobile Feedback Surfaces Specification

## Purpose

Definir cómo se presentan estados vacíos, alerts y feedback operativo de manera consistente en toda la app.

## Requirements

### Requirement: Empty states are consistent and actionable

The system MUST present empty states with shared structure, calm tone, and clear next-step guidance.

#### Scenario: Empty history or analytics
- GIVEN the device has no saved sessions
- WHEN the user opens history or analytics
- THEN the empty state MUST explain why the screen has no data
- AND it SHOULD orient the user toward the next meaningful action

#### Scenario: Empty routine sub-sections
- GIVEN a routine day or backup preview lacks expected content
- WHEN the user views that area
- THEN the UI MUST communicate the absence using the same empty-state pattern instead of ad hoc copy blocks

### Requirement: Status and alert feedback use shared tones

The system MUST present success, info, warning, and error feedback with shared visual semantics across screens.

#### Scenario: Successful operation feedback
- GIVEN the user completes a restore or saves a session
- WHEN the product acknowledges that result
- THEN the success state MUST use the shared success presentation pattern

#### Scenario: Error or destructive warning feedback
- GIVEN the user hits a validation problem or destructive restore warning
- WHEN the message is shown
- THEN the UI MUST use a shared error or warning pattern that remains readable on mobile
