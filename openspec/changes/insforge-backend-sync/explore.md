# InsForge Backend Sync — Explore

**Change:** `insforge-backend-sync`
**Issue:** #64
**Phase:** explore
**Status:** complete
**Mode:** parent-authored fallback after async SDD runner failure

## Executive Summary

GymTracker/Treino is currently a React + TypeScript + Vite PWA with Dexie/IndexedDB persistence. The product promise is local-first/offline-first and the core workout flow must stay fast on mobile. The backend should therefore be designed as **InsForge-backed sync over a local Dexie cache**, not as a naïve online-only replacement.

Approved decisions:

- Strategy: **local-first + InsForge sync**.
- Auth v1: **login mandatory**.
- Existing local data: **manual import**.
- Delivery: **forced chained PRs**.
- Review budget: **400 changed lines per PR**.
- Artifact store: **OpenSpec + Engram**.

The repo is already linked to an InsForge project named `Treino`; `.insforge/project.json` exists and contains the backend URL and admin API key. The API key must remain server-only. No local InsForge migrations, `insforge.toml`, or checked-in function directories exist yet.

## Evidence Read

- `openspec/config.yaml`
- `package.json`
- `src/db/database.ts`
- `src/domain/routines.ts`
- `src/domain/sessions.ts`
- `src/domain/analytics.ts`
- `src/domain/backup.ts`
- `src/features/**` repositories/pages
- `e2e/**`
- `sdd-context/data-model.md`
- `sdd-context/product-flows.md`
- `sdd-context/insforge-plan.md`

## Current Data Model

Current local stores:

| Dexie store | Purpose |
| --- | --- |
| `routines` | Nested routine templates: weeks, days, exercises, per-set targets, progress |
| `exerciseCatalog` | Derived autocomplete/catalog by normalized exercise name |
| `sessions` | Immutable workout session snapshots |
| `appState` | Active routine pointer and future app keys |

Important invariants:

- Routine/session IDs are client UUIDs and are referenced across history.
- Session history must remain immutable and snapshot-based.
- Routine order is currently array order; backend tables need explicit `position` columns.
- There is exactly one effective active routine today via app logic/repair.
- Analytics are derived from saved session snapshots, not current routine templates.
- Backup/restore currently works as local JSON and destructive local replacement.

## Backend Direction

Recommended v1 architecture:

```text
React UI
  ↓ reads/writes fast local state
Dexie local cache + sync metadata
  ↓ background/manual sync
InsForge SDK client
  ↓ RLS-protected tables/functions
InsForge Postgres/Auth
```

The backend should provide:

- mandatory auth gate before app use;
- manual import flow for old local data/backups;
- user-owned relational schema;
- RLS from day one;
- append-only/idempotent session sync;
- conflict-aware routine sync;
- local JSON backup preserved as fallback;
- InsForge backend branch/migration workflow before parent backend mutation.

## Key Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Dropping offline behavior | Breaks current product promise and E2E assumptions | Keep Dexie cache and local writes; sync separately |
| Exposing API key | Critical security issue | Only `VITE_INSFORGE_URL` and `VITE_INSFORGE_ANON_KEY` in frontend |
| Mutating live backend during planning | Could break linked project | No live backend mutation in SDD; use branch during apply |
| Routine edit conflicts across devices | Could silently lose workouts/templates | Add sync metadata and conflict policy |
| Session duplication | Could double-count history/analytics | Use client UUIDs and idempotent upserts |
| Backup restore overwrites cloud data | Data loss | Manual import preview/confirmation; no silent remote overwrite |
| Large review diff | Reviewer fatigue | Forced chained PRs, 400-line max budget |

## Open Questions Resolved

- **Delivery strategy:** chained PRs are forced.
- **Auth:** login is mandatory in v1.
- **Migration of existing local data:** manual import, not automatic claim.
- **Sync strategy:** local-first + InsForge sync.

## Remaining Questions for Apply-Time Confirmation

These do not block planning, but should be confirmed before implementation:

1. Auth provider for v1: email/password only, or OAuth too?
2. Exact manual import UX entry point: login screen, More/Profile, Backup, or a dedicated migration page?
3. Whether active routine is account-wide or device-local after sync. Proposal assumes account-wide.
4. Whether routine/session deletion is in v1. Proposal assumes no destructive delete in backend v1.
5. Whether InsForge backend branch is available on the linked project. Apply must check via CLI.

## Phase Result

```yaml
status: complete
executive_summary: Local-first sync with mandatory auth and manual import is feasible but requires schema/RLS/sync foundations before feature rewrites.
artifacts:
  - openspec/changes/insforge-backend-sync/explore.md
  - sdd-context/data-model.md
  - sdd-context/product-flows.md
  - sdd-context/insforge-plan.md
next_recommended: proposal
risks:
  - backend branch availability unknown until CLI inspection
  - auth provider details still need apply-time confirmation
  - review workload requires chained PR discipline
skill_resolution: injected
```
