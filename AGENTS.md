# GymTracker workflow guardrails

## Mandatory workflow for EVERY change

This applies to new features, small tweaks, refactors, and bug fixes.

1. Verify the problem or request first. Never assume.
2. Create a GitHub issue before coding.
3. Use a short-lived branch with conventional naming:
   - `feat/<description>`
   - `fix/<description>`
   - `chore/<description>`
   - `test/<description>`
   - `refactor/<description>`
4. Do not commit directly to `main`.
5. Use conventional commits only.
6. Run the relevant validations before asking for merge:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test:run`
   - `npm run test:e2e` when the UI flow is affected
7. Open a PR linking the issue and summarizing validation.

## Recommended branch strategy

- `main` = production, always stable
- `staging` = pre-production / integration, used for real validation before production

### Standard delivery flow

1. Create issue
2. Branch from `staging` for normal work
3. Open PR into `staging`
4. Validate CI + Vercel preview/staging + manual smoke test
5. Promote with PR from `staging` into `main`
6. Merge `main` only when staging is green and accepted

### Hotfix exception

If production is broken and needs an urgent fix:

1. Branch from `main`
2. Fix and validate
3. PR into `main`
4. Immediately sync the same fix back into `staging`

## PR expectations

Every PR should include:

- linked issue (`Closes #<number>`)
- why the change exists
- what risk it touches
- validations executed

## Repo hygiene

- Prefer small PRs
- One concern per branch
- If E2E fails after a redesign, first verify whether selectors/assertions are stale before assuming a product regression
- Never build locally just to satisfy process unless explicitly requested
