# History and Analytics — Spec

**Change:** `insforge-backend-sync`
**Area:** History and analytics preservation after InsForge sync

## Spec 7 — History/Analytics Preservation

### Requirement 7.1: History Works Offline

The history page **SHALL** load and display sessions from the local Dexie cache without requiring a network connection.

### Requirement 7.2: History Includes Synced Sessions

After a successful sync pull, history **SHALL** include sessions synced from other devices, appearing alongside locally created sessions.

### Requirement 7.3: History Based on Snapshots

History display **SHALL** use the frozen session snapshot data, not the current state of routines. Editing a routine **MUST NOT** change how historical sessions appear.

### Requirement 7.4: History Filters

History filters (date range, routine, saved day) **SHALL** continue to work over the combined local + synced session dataset.

### Requirement 7.5: Session Detail: Snapshot Congelado

The session detail view **SHALL** communicate that it displays a frozen snapshot. Routine edits **MUST NOT** affect the detail view of any previously saved session.

### Scenario 7.1 — Offline History Display
**Given** a user with no network connectivity
**When** they open the history page
**Then** sessions are loaded from local Dexie
**And** all filters work normally

### Scenario 7.2 — Synced Sessions in History
**Given** a user synced sessions from another device
**When** they open the history page
**Then** all sessions (local and synced) appear in a single list
**And** the list is ordered by endedAt descending

### Scenario 7.3 — Session Detail Unchanged After Routine Edit
**Given** a user views a historical session detail
**When** they edit the routine that created the session
**Then** the session detail still shows the original routine name, day label, exercise names, targets, and set values

## Spec 7B — Analytics Preservation

### Requirement 7B.1: Analytics Work Offline

Analytics **SHALL** compute from the local Dexie session dataset without requiring a network connection.

### Requirement 7B.2: Analytics Include Synced Data

After a successful sync pull, analytics **SHOULD** incorporate sessions synced from other devices in their computations.

### Requirement 7B.3: Analytics Scope

Analytics computations **SHALL** remain scoped to the currently visible/filtered session subset, consistent with current behavior.

### Requirement 7B.4: Milestones Based on Snapshots

Progress milestones (best weight, best set volume) **SHALL** be derived from session snapshot data, not from the current routine template.

### Requirement 7B.5: Adherence Calculation

Routine adherence **SHALL** count distinct `(weekIndex, dayId)` sessions for the routine in the current week and compare to planned days, consistent with the current `countAdherence()` logic.

### Requirement 7B.6: Analytics Copy Update

UI copy that says the app has "no backend" or "local only" **SHALL** be updated to reflect the new cloud sync capability while preserving the offline-first trust message.

### Requirement 7B.7: Week Timezone Consistency

User-visible week calculations for analytics, adherence, streaks, and dashboard trained-day summaries **SHALL** use `America/Argentina/Buenos_Aires` in v1. Existing UTC Monday helper behavior **MUST** be replaced or wrapped so backend sync does not preserve contradictory week boundaries.

### Requirement 7B.8: Client-Side Computation v1

In v1, analytics **SHALL** remain client-side computations over the local synced dataset. Server-side analytics aggregation **MAY** be introduced in a later phase.

## Scenarios

### Scenario 7B.1 — Offline Analytics
**Given** a user with no network connectivity
**When** they open the analytics page
**Then** KPIs (frequency, volume, adherence) are computed from local Dexie sessions
**And** charts and progress data display normally

### Scenario 7B.2 — Analytics Update After Sync
**Given** a user synced new sessions from another device
**When** they open the analytics page
**Then** KPIs and progress charts reflect the newly synced sessions
**And** milestones are recalculated

### Scenario 7B.3 — Exercise Progress by Template ID or Name
**Given** a user tracks the same exercise across multiple routines
**When** they filter analytics by that exercise
**Then** progress data uses `exerciseTemplateId` when available, falling back to normalized exercise name
**And** the progress line includes all matching sessions

### Scenario 7B.4 — Best Weight Milestone
**Given** a user has sessions with varying set weights for an exercise
**When** they view the session detail for their heaviest set
**Then** the best-weight badge is shown for that set
**And** the badge reflects the all-time maximum across all sessions
