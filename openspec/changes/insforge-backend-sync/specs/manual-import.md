# Manual Import — Spec

**Change:** `insforge-backend-sync`
**Area:** Manual import of existing local data after authentication

## Spec 3 — Manual Import of Existing Local Data

### Requirement 3.1: Explicit User Initiation

Manual import **MUST** be initiated by an explicit user action. No automatic background import **SHALL** occur.

### Requirement 3.2: Import Source

The import system **SHALL** support reading from:

- Existing Dexie/IndexedDB stores on the current device.
- Local JSON backup files exported via the current backup system (v1 format).

### Requirement 3.3: Import Preview

Before committing an import, the system **SHOULD** display a preview of what will be imported:

- Count of routines, sessions, and catalog entries to be imported.
- Any potential conflicts with existing cloud data.

### Requirement 3.4: User Confirmation

Import **MUST** require explicit confirmation after the preview step. Import is a mutating cloud action. It **SHALL NOT** be described as destructive unless the user explicitly chooses a replace operation for a clearly named target scope.

### Requirement 3.5: ID Preservation

During import, existing client-side UUIDs for routines, sessions, exercises, and sets **MUST** be preserved. The system **SHALL NOT** reassign IDs during import.

### Requirement 3.6: Legacy Normalization

Imported data **SHALL** pass through the existing normalization pipeline before being written to the cloud:

- Routine normalization (week count, exercise muscle defaults, set reference synthesis).
- Session normalization (notes sanitization, numeric parsing, muscle defaults).
- Exercise catalog deduplication by normalized name.

### Requirement 3.7: Import Atomicity Per Entity Type

Import of each entity type (routines, sessions, catalog, appState) **SHOULD** be treated as a batch operation. If a batch fails, the system **SHALL** not partially apply that batch.

### Requirement 3.8: Post-Import Sync State

After successful import, imported records **SHALL** be marked as synced (or created directly in the cloud) so that subsequent sync operations do not duplicate them.

### Requirement 3.9: Import Entry Point

The manual import UI entry point **SHALL** be accessible from the authenticated app. The exact location (More/Profile, Backup screen, or dedicated migration page) **MAY** be finalized at apply-time.

### Requirement 3.10: No Remote Overwrite on Import

Import **MUST NOT** silently overwrite existing remote cloud data. If the user's cloud account already has data:

- The system **SHOULD** show a conflict preview.
- The user **SHALL** choose to merge, skip, or replace (with confirmation).

### Requirement 3.11: Import Does Not Delete Local Data

The manual import process **SHALL NOT** delete existing local Dexie data as part of the import. Local data remains available until the user explicitly clears it.

### Requirement 3.12: Import Validation

The import system **MUST** validate the source data before import:

- For JSON backup files: validate `kind`, `version`, `exportedAt`, and array structure (existing v1 validation).
- For Dexie reads: validate that reads complete without corruption.
- Invalid or corrupted data **SHALL** abort import with an error message.

## Scenarios

### Scenario 3.1 — Import from Dexie: Preview and Confirm

**Given** an authenticated user with existing local Dexie data
**When** the user initiates manual import from Dexie
**Then** a preview is shown with counts of routines, sessions, and catalog entries
**And** the user must confirm before import proceeds

### Scenario 3.2 — Import from JSON Backup: Validate and Import

**Given** an authenticated user
**When** the user selects a local JSON backup file for import
**Then** the file is validated (kind, version, exportedAt, arrays)
**And** if valid, a preview is shown
**And** if confirmed, data is imported with existing IDs preserved

### Scenario 3.3 — Import from Invalid JSON: Error

**Given** an authenticated user
**When** the user selects an invalid or corrupted JSON backup file
**Then** import is aborted
**And** an error message explains the validation failure

### Scenario 3.4 — Import with Existing Cloud Data: Conflict Preview

**Given** an authenticated user who already has cloud data
**When** the user initiates import of local data
**Then** a conflict preview is shown
**And** the user can choose to merge, skip, or replace
**And** no data is silently overwritten

### Scenario 3.5 — Legacy Data Normalization During Import

**Given** an authenticated user importing legacy Dexie data
**When** the data contains missing muscle groups or set references
**Then** the normalization pipeline applies defaults (PG muscle, synthesized set refs)
**And** the imported data conforms to current schema expectations

### Scenario 3.6 — Import Does Not Delete Local Data

**Given** an authenticated user with local Dexie data
**When** the user completes an import to their cloud account
**Then** the local Dexie data remains intact in IndexedDB
**And** the user can clear it separately if desired
