# Session Snapshot Sync — Spec

**Change:** `insforge-backend-sync`
**Area:** Immutable workout session snapshot sync with InsForge

## Spec 6 — Immutable Session Snapshot Sync

### Requirement 6.1: Session Immutability

Once a workout session is saved (status `completed` or `ended-early`), it **SHALL** be treated as immutable. No field of a saved session **MAY** be modified after creation.

### Requirement 6.2: Idempotent Upload

Uploading the same session snapshot multiple times (e.g., due to retry after network failure) **MUST** be idempotent. The session **SHALL** be identified by its client UUID, and duplicate uploads **SHALL NOT** create additional records or affect analytics counts.

### Requirement 6.3: Snapshot Completeness

Each synced session snapshot **SHALL** include all fields required for history and analytics display without joining to the current routine:
- Session-level: `id`, `routineId`, `routineName` (snapshot), `dayId`, `weekIndex`, `weekLabel` (snapshot), `dayLabel` (snapshot), `status`, `notes`, `startedAt`, `endedAt`.
- Exercise-level: `id`, `exerciseTemplateId`, `exerciseName`, `targetSets`, `targetRir`, `muscle`, `notes`, `sets[]`.
- Set-level: `id`, `setNumber`, `reps`, `weightKg`, `actualRir`.

### Requirement 6.4: Session Push Timing

A completed or ended-early session **SHOULD** be pushed to InsForge as soon as possible after the local Dexie save, but the local save **MUST NOT** wait for the push to complete.

### Requirement 6.5: Session Pull on Sync

During a pull sync, the system **SHALL** check for sessions that exist remotely but not locally and add them to Dexie.

### Requirement 6.6: Session Ordering

Sessions **SHALL** be ordered by `endedAt` descending for history display, consistent with the current Dexie query behavior.

### Requirement 6.7: Session Indexes

Remote session tables **SHALL** have indexes supporting:
- `(user_id, ended_at desc)` — history list.
- `(user_id, routine_id, day_id, ended_at desc)` — previous session references per routine/day.
- `(user_id, routine_id)` — routine-scoped history and analytics.

### Requirement 6.8: No Session Edit or Delete in v1

The system **SHALL NOT** support editing or deleting saved sessions in v1. Sessions are append-only after creation.

### Requirement 6.9: Atomic Session + Progress Update

When a session is saved, the associated routine progress update **SHALL** be performed in the same logical transaction (either via Dexie transaction locally, or via a single InsForge mutation/RPC remotely) to prevent session/progress divergence.

## Scenarios

### Scenario 6.1 — Session Save: Local First, Then Sync
**Given** a user finishes a workout
**When** they tap save
**Then** the session is saved immediately to Dexie
**And** the session is queued for async push to InsForge
**And** the user is returned to the app without waiting for network

### Scenario 6.2 — Idempotent Session Upload
**Given** a session was pushed to InsForge
**When** the sync service retries the same session due to a failed acknowledgment
**Then** InsForge recognizes the client UUID
**And** no duplicate session is created
**And** analytics counts are unaffected

### Scenario 6.3 — History Shows Remote Sessions
**Given** a user completed a session on device A and synced it
**When** they open history on device B after sync
**Then** the session from device A appears in history
**And** all snapshot fields (routine name, sets, notes) are displayed
**And** the display does not depend on the current state of the routine

### Scenario 6.4 — Previous Session References Across Devices
**Given** a user completed a session for routine X / day Y on device A
**When** they start a new session for routine X / day Y on device B after sync
**Then** the previous session references (notes, sets) from device A are available
**And** weight suggestions can use those references

### Scenario 6.5 — Session Snapshot Unchanged After Routine Edit
**Given** a user has a saved session with routine name "Push A"
**When** the user edits the routine and renames it to "Push Day 1"
**Then** the session still shows "Push A" as the routine name
**And** all exercise names, targets, and set records from the session are unchanged
