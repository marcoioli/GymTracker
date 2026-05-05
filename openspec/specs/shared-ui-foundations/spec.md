# Shared UI Foundations Specification

## Purpose

Definir las bases visuales compartidas que sostienen la interfaz mobile-first de GymTracker.

## Requirements

### Requirement: Shared primitives for core UI actions and fields

The system MUST provide shared UI primitives for actions, cards, sections, and form fields so the main screens preserve a coherent mobile interaction model.

#### Scenario: Primary and secondary actions look consistent
- GIVEN the user navigates across dashboard, routines, backup, history, or analytics
- WHEN the user sees primary and secondary actions
- THEN those actions MUST preserve consistent size, emphasis, and tap affordance

#### Scenario: Form fields preserve shared label and spacing rules
- GIVEN the user edits routines or workout inputs
- WHEN the screen renders text or numeric fields
- THEN labels, hints, spacing, and focus states MUST follow the same shared pattern

### Requirement: Shared surfaces preserve visual hierarchy

The system MUST render cards, sections, and grouped content with a consistent visual hierarchy across the product.

#### Scenario: Section headers remain structurally recognizable
- GIVEN the user moves between major screens
- WHEN each screen shows a titled section
- THEN header, description, and actions MUST follow the same structural pattern

#### Scenario: Informational cards do not compete with primary workflow
- GIVEN the screen mixes summary cards and main actions
- WHEN the user scans the mobile layout
- THEN supportive surfaces MUST remain visually subordinate to the primary action path
