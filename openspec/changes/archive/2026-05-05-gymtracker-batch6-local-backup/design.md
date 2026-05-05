# Design: GymTracker Batch 6 Local Backup

## Technical Approach

Implement backup as a client-only JSON export/import flow over the existing Dexie database. The feature will read all persisted tables, package them with version metadata, and restore them transactionally after validation and user confirmation.

## Architecture Decisions

### Decision: JSON backup over raw IndexedDB dump
**Choice**: Use explicit JSON schema with metadata and table payloads.
**Alternatives considered**: Browser-native DB dump, ad hoc per-table exports.
**Rationale**: JSON is portable, inspectable, versionable, and easier to validate.

### Decision: Transactional replace on restore
**Choice**: Clear and repopulate tables inside one restore flow.
**Alternatives considered**: Merge imported data into existing local data.
**Rationale**: Merge logic is ambiguous and dangerous for this product; replace is simpler and safer if clearly confirmed.

### Decision: Backup UI stays outside workout flow
**Choice**: Expose backup actions in a low-frequency utility/settings area.
**Alternatives considered**: Put backup controls on dashboard.
**Rationale**: Backup is important, but not part of the daily workout loop.

## Data Flow

Backup action → Read Dexie tables → Build JSON payload → Download file
Import action → Read file → Validate schema/version → Confirm replace → Replace Dexie data → Refresh app state

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/db/database.ts` | Modify | Expose backup-safe table access helpers if needed |
| `src/features/settings/*` or `src/features/backup/*` | Create | Backup/export/import UI and actions |
| `src/features/backup/backupRepository.ts` | Create | Read/write backup payloads over Dexie |
| `src/domain/backup.ts` | Create | Backup payload types and validation contracts |
| `src/app/router.tsx` | Modify | Add navigation entry for backup/settings area |

## Interfaces / Contracts

```ts
type GymTrackerBackup = {
  version: 1
  exportedAt: string
  appState: unknown[]
  routines: unknown[]
  exerciseCatalog: unknown[]
  sessions: unknown[]
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Backup payload validation and version checks | Vitest |
| Integration | Export payload contents and restore replacement flow | React Testing Library + fake IndexedDB |
| E2E | Export/import happy path if browser download/upload flow is added | Playwright |

## Migration / Rollout

No data migration required. First version of backup schema starts at `version: 1`.

## Open Questions

- [ ] Whether backup actions should live in a new Settings screen or under a utility panel.
