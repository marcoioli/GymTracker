# Tasks: GymTracker Batch 6 Local Backup

## Phase 1: Domain and persistence

- [x] 1.1 Create `src/domain/backup.ts` with backup payload types and validation helpers.
- [x] 1.2 Create `src/features/backup/backupRepository.ts` to export all Dexie tables into one JSON payload.
- [x] 1.3 Implement transactional restore that replaces appState, routines, exerciseCatalog, and sessions safely.

## Phase 2: UI flow

- [x] 2.1 Add backup/export/import screen or utility section with clear action hierarchy.
- [x] 2.2 Implement file import flow with validation error messages and destructive-restore confirmation.
- [x] 2.3 Implement export trigger that downloads a versioned GymTracker JSON file.

## Phase 3: Verification

- [x] 3.1 Add unit tests for backup schema validation and invalid-file rejection.
- [x] 3.2 Add integration tests for export payload completeness and restore replacement behavior.
- [x] 3.3 Add or extend E2E only if the import/export UI is user-facing in this batch.
