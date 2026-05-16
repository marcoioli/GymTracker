# Delivery Constraints — Spec

**Change:** `insforge-backend-sync`
**Area:** Chained PR and review constraints for user-visible and process-critical changes

## Spec 11 — Chained PR / Review Constraints

### Requirement 11.1: Forced Chained PRs

All implementation PRs for this change **MUST** use the chained PR delivery strategy. Single-PR delivery **SHALL NOT** be used unless an explicit exception is granted by the user.

### Requirement 11.2: Review Budget

Each PR **SHALL** target a maximum of 400 changed lines. If a PR would exceed 400 lines, it **MUST** be split into smaller PRs unless an explicit exception is granted.

### Requirement 11.3: PR Ordering

The chained PRs **SHOULD** follow this ordering:
1. SDD artifacts PR (specs, design, tasks).
2. InsForge env/SDK foundation PR.
3. Schema/RLS migrations PR.
4. Auth gate PR.
5. Manual import PR.
6. Routine sync PR(s).
7. Session snapshot sync PR(s).
8. History/analytics integration PR(s).
9. Backup/sync status/rollout docs PR.

### Requirement 11.4: Branch Strategy

Each PR **SHALL** branch from `staging` (or the appropriate base) and target `staging`. Direct commits to `main` **MUST NOT** occur except for hotfixes per the repo's hotfix exception policy.

### Requirement 11.5: PR Content Requirements

Every PR **MUST** include:
- Linked issue (`Closes #<number>`).
- Why the change exists.
- What risk it touches.
- Validation evidence (`npm run lint`, `npm run typecheck`, `npm run test:run`, and `npm run test:e2e` when UI flow is affected).

### Requirement 11.6: Fresh Review

Each PR **SHALL** be reviewed by a fresh-context reviewer before merge. The author **SHOULD NOT** self-approve.

### Requirement 11.7: Conventional Branches and Commits

Implementation branches **SHALL** use conventional branch prefixes such as `feat/`, `fix/`, `chore/`, `test/`, or `refactor/`. Commit messages **SHALL** use conventional commit format such as `feat(scope): summary`, `fix(scope): summary`, or `chore(scope): summary`.

### Requirement 11.8: Backend Branch for Migrations

Schema/RLS/auth migration PRs **SHOULD** apply changes to an InsForge backend branch, not the parent project, until validation is complete.

### Requirement 11.9: No Live Backend Mutation During SDD

No changes **SHALL** be applied to the live InsForge backend during SDD planning. All planning artifacts **SHALL** remain as files in the repository.

### Requirement 11.10: Validation Gates

Before asking for merge, each PR **MUST** pass:
- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- `npm run test:e2e` (when UI flows are affected)

### Requirement 11.11: Small PRs

PRs **SHOULD** address one concern each. If a PR addresses multiple unrelated concerns, it **SHOULD** be split.

## Scenarios

### Scenario 11.1 — PR Exceeds Budget: Must Split
**Given** an implementation PR with 600 changed lines
**When** the PR is reviewed
**Then** it exceeds the 400-line budget
**And** it must be split into smaller PRs
**And** cannot be merged as-is without explicit exception

### Scenario 11.2 — Schema PR Without Fresh Review
**Given** a schema/RLS migration PR is ready
**When** it has not been reviewed by a fresh-context reviewer
**Then** it must not be merged
**And** a fresh reviewer must audit it first

### Scenario 11.3 — Auth PR Validation
**Given** the auth gate PR is complete
**When** the author requests merge
**Then** lint, typecheck, and unit tests must be green
**And** E2E tests must be green (auth affects UI flows)
**And** the PR must link the issue and describe the risk

### Scenario 11.4 — SDD Planning: No Backend Mutation
**Given** the SDD planning phase is active
**When** spec, design, and task artifacts are written
**Then** no live InsForge backend changes have been made
**And** all artifacts exist only as files in the repository
