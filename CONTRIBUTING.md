# Contributing

## Branching workflow

### Desired normal flow

This repository uses `staging` as the integration branch and `main` as the stable branch.

Normal day-to-day work should follow this order:

1. Create an issue first.
2. Get the issue approved.
3. Create a feature/fix branch from `staging`.
4. Open the pull request back into `staging`.
5. After validation, open a promotion PR from `staging` into `main`.

In short:

- `feature -> staging`
- `staging -> main`

### Temporary exception

If `staging` is behind `main`, do **not** branch from an outdated base.

In that case:

1. Sync `staging` with `main` first, **or**
2. If the work must continue immediately, branch from `main` as an explicit exception and document why in the PR.

This exception should be rare. If it becomes common, the branch strategy is being ignored.

## Branch naming

Use conventional branch names:

- `feat/<description>`
- `fix/<description>`
- `chore/<description>`
- `docs/<description>`
- `refactor/<description>`
- `test/<description>`

Examples:

- `feat/light-dark-theme`
- `fix/history-empty-state`
- `chore/sync-staging-with-main`

## Issue workflow

Every implementation should start from an issue.

Minimum rule:

1. Open the issue.
2. Add the `status:approved` label before opening the PR.

## Pull request workflow

Every PR must:

1. Link the issue with `Closes #<number>`.
2. Target the correct base branch:
   - normally `staging`
   - only use `main` when the exception above applies
3. Have exactly one `type:*` label.

Current PR type labels:

- `type:feature`
- `type:bug`
- `type:docs`
- `type:refactor`
- `type:chore`
- `type:breaking-change`

## Commits

Use conventional commits.

Examples:

- `feat: add persisted light theme toggle`
- `fix: correct history detail empty state`
- `docs: document branching workflow`

Do not add `Co-Authored-By` trailers.

## Validation

Before asking for review:

1. Run the relevant checks for the change.
2. Mention any existing baseline failures that are unrelated to your work.
3. Do not mix unrelated files into the same PR.

## Practical rule

If you are unsure where a branch should go:

- ask whether `staging` is up to date
- if yes, branch from `staging`
- if no, fix `staging` first or explicitly document the exception
