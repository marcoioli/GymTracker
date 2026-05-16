# Local-First Sync — Spec

**Change:** `insforge-backend-sync`
**Covers:** local-first/offline behavior, routine sync, one-active-routine semantics

## Spec 4 — Local-First / Offline Behavior With InsForge Sync

### Requirement 4.1: Dexie Remains Runtime Cache

The app MUST keep a local Dexie cache for user-owned workout data so routine browsing, workout entry, history, and analytics can render without blocking on network requests.

### Requirement 4.2: Network Writes Are Deferred From Workout UX

Workout set entry and session finish actions MUST write locally first. They MUST NOT wait for a successful remote InsForge write before updating the UI.

### Requirement 4.3: Sync Metadata

Local entities that sync to InsForge MUST include metadata sufficient to determine dirty/pending/conflict state, including at minimum local update time, remote update time or version, sync status, and last sync error.

### Requirement 4.4: Pull on Session Restore and Focus

When an authenticated session is restored and the app comes online or regains focus, the app SHOULD pull remote changes and reconcile them into the local cache without blocking primary navigation.

### Requirement 4.5: Push Pending Local Changes

When authenticated and online, the app SHOULD push pending local changes in the background and surface sync failures without losing local edits.

### Requirement 4.6: Offline Indicator

The app SHOULD show a clear sync/offline status when changes are pending or sync failed.

### Requirement 4.7: No Silent Remote Destruction

The sync system MUST NOT delete remote data based solely on a local missing record in v1.

### Requirement 4.8: Timezone Consistency

Week-based sync and analytics behavior MUST use the same timezone policy chosen in design. V1 SHOULD use `America/Argentina/Buenos_Aires` for user-visible week boundaries.

## Spec 5 — Routine Sync and One-Active-Routine Semantics

### Requirement 5.1: Routine Graph Sync

The app MUST sync the complete routine graph: routine, weeks, days, exercises, and per-set references while preserving existing UUIDs and order.

### Requirement 5.2: Order Preservation

Synced routine weeks, days, exercises, and set references MUST preserve current array order via explicit position fields.

### Requirement 5.3: Exercise Catalog Sync

The app MUST sync exercise catalog entries by normalized exercise name per user and SHOULD avoid creating duplicate catalog rows for the same normalized name.

### Requirement 5.4: Account-Wide Active Routine

The backend MUST represent one account-wide active routine. The app MUST converge local state to that backend state after sync.

### Requirement 5.5: One Active Routine Enforcement

The backend SHOULD enforce at most one active routine per user with a database invariant where feasible. The app MUST also repair conflicts defensively.

### Requirement 5.6: Routine Conflict Detection

If a routine has been modified locally and remotely since the last successful sync, the app MUST detect the conflict and avoid silently overwriting either side.

### Requirement 5.7: Conflict Resolution UX

V1 MUST provide a safe conflict outcome: keep local, keep remote, or duplicate as copy. Auto-merge MAY be added later but MUST NOT be required for v1.

## Scenarios

### Scenario 4.1 — Offline Workout Save

Given the user is authenticated and the device is offline
When the user completes a workout session
Then the session MUST be saved locally
And the UI MUST navigate as today
And the session MUST be marked pending sync.

### Scenario 4.2 — Pending Changes Sync Later

Given the user has pending local changes
And network connectivity returns
When background sync runs
Then pending changes SHOULD be uploaded to InsForge
And successful rows SHOULD be marked synced.

### Scenario 4.3 — Sync Failure Does Not Lose Local Data

Given a local routine edit is pending sync
When the remote write fails
Then the local edit MUST remain available
And the app SHOULD show a recoverable sync error.

### Scenario 4.4 — Pull Remote Session

Given the user completed a workout on another device
When this device comes online and pulls remote changes
Then the remote session SHOULD appear in local history
And analytics SHOULD include it after reconciliation.

### Scenario 5.1 — Routine Graph Preserves Order

Given a routine has two weeks with days and exercises
When the routine syncs to InsForge and back
Then the local routine MUST preserve week, day, exercise, and set-reference order.

### Scenario 5.2 — One Active Routine Converges

Given two devices have different active routines
When both devices sync
Then the app MUST converge to one account-wide active routine
And any conflict MUST be handled according to the selected conflict policy.

### Scenario 5.3 — Routine Edit Conflict

Given device A edits a routine offline
And device B edits the same routine online
When device A reconnects
Then the app MUST detect a conflict
And MUST NOT silently overwrite the remote edit.
