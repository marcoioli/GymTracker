# Backup and Restore — Spec

**Change:** `insforge-backend-sync`
**Area:** Backup/restore semantics after InsForge cloud sync

## Spec 8 — Backup/Restore/Cloud Semantics

### Requirement 8.1: Local JSON Backup Preserved

The existing local JSON backup/export/restore flow **SHALL** remain available after InsForge sync is enabled. It **MUST NOT** be removed without explicit user consent.

### Requirement 8.2: Backup Format Compatibility

The system **SHALL** continue to support importing v1 backup JSON files (the current Dexie-shaped format). Any new backup format version **MUST** be backward-compatible or explicitly versioned with a migration path.

### Requirement 8.3: Restore Remains Destructive for Local Scope

Local JSON restore **SHALL** remain a destructive replacement of local Dexie data, consistent with current behavior. The user **MUST** see the existing confirmation prompt before restore.

### Requirement 8.4: Restore Does Not Affect Remote Data

Restoring a local JSON backup **MUST NOT** automatically overwrite remote InsForge data. If the user wants their restored local data to sync to the cloud, they **SHALL** initiate a sync after restore.

### Requirement 8.5: Cloud Backup (Future)

A cloud backup mechanism (storing backup snapshots in InsForge) **MAY** be introduced in a later phase. If introduced:
- Cloud backups **SHALL** be user-owned and RLS-protected.
- Cloud backup restore **SHALL** follow the same preview/confirmation pattern as local import.
- Cloud backup **SHOULD NOT** replace local JSON backup in v1.

### Requirement 8.6: Export Includes All User Data

The export function **SHALL** include all four data collections: `routines`, `exerciseCatalog`, `sessions`, and `appState`, consistent with the current `GymTrackerBackup` type.

### Requirement 8.7: Backup Page Copy Update

UI copy on the backup page that says "sin cloud", "local only", or "No hay merge ni cloud salvadora" **SHALL** be updated to reflect the new cloud sync capability while preserving the explicit-destructive nature of local restore.

### Requirement 8.8: Account Data Not in Backup

Backup JSON files **MUST NOT** contain auth credentials, tokens, or user IDs that could be used to impersonate a user on another device.

## Scenarios

### Scenario 8.1 — Local Export After Sync
**Given** an authenticated user with synced cloud data
**When** they export a local JSON backup
**Then** the export includes all local Dexie data (routines, catalog, sessions, appState)
**And** the backup file is v1-compatible

### Scenario 8.2 — Local Restore: Destructive Confirmation
**Given** an authenticated user with local Dexie data
**When** they select a JSON backup file for restore
**Then** the file is validated
**And** a destructive confirmation prompt is shown
**And** on confirm, all local Dexie stores are cleared and replaced with backup data
**And** remote InsForge data is unchanged

### Scenario 8.3 — Invalid Backup File: Reject
**Given** a user selects a backup file
**When** the file fails validation (wrong kind, version, or missing arrays)
**Then** restore is aborted
**And** an error message is shown
**And** no local data is modified

### Scenario 8.4 — Restore Then Sync
**Given** a user restored local data from a JSON backup
**When** sync runs after restore
**Then** the restored local data is pushed to InsForge
**And** any conflicts with existing remote data are handled per the conflict resolution policy
