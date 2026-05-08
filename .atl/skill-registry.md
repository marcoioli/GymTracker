# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When creating a pull request, opening a PR, or preparing changes for review. | branch-pr | C:\Users\marko\.config\opencode\skills\branch-pr\SKILL.md |
| When writing Go tests, using teatest, or adding test coverage. | go-testing | C:\Users\marko\.config\opencode\skills\go-testing\SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature. | issue-creation | C:\Users\marko\.config\opencode\skills\issue-creation\SKILL.md |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen". | judgment-day | C:\Users\marko\.config\opencode\skills\judgment-day\SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI. | skill-creator | C:\Users\marko\.config\opencode\skills\skill-creator\SKILL.md |
| Use when asked to "improve accessibility", "a11y audit", "WCAG compliance", "screen reader support", "keyboard navigation", or "make accessible". | accessibility | C:\Users\marko\.agents\skills\accessibility\SKILL.md |
| Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). | frontend-design | C:\Users\marko\.agents\skills\frontend-design\SKILL.md |
| Use when the task asks for a visually strong landing page, website, app, prototype, demo, or game UI. | frontend-skill | C:\Users\marko\.agents\skills\frontend-skill\SKILL.md |
| Use when asked to "improve SEO", "optimize for search", "fix meta tags", "add structured data", "sitemap optimization", or "search engine optimization". | seo | C:\Users\marko\.agents\skills\seo\SKILL.md |
| This skill should be used when the user is looking for functionality that might exist as an installable skill. | find-skills | C:\Users\marko\.agents\skills\find-skills\SKILL.md |
| UI/UX design intelligence with searchable database | ui-ux-pro-max | C:\GymTracker\.opencode\skills\ui-ux-pro-max\SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### branch-pr
- Every PR MUST link an approved issue and include exactly one `type:*` label.
- Use branch names `type/description` matching `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)/[a-z0-9._-]+$`.
- Use conventional commits only; never add `Co-Authored-By` trailers.
- PR body MUST include issue linkage, summary bullets, file changes table, and test plan.
- Run required validation before merge; blank PRs or missing issue linkage will be blocked.

### go-testing
- Prefer table-driven tests for pure or multi-case logic.
- Test Bubble Tea state transitions by calling `Update()` directly before using higher-level flows.
- Use `teatest.NewTestModel()` for end-to-end TUI interaction flows.
- Use golden files for stable rendered output comparisons.
- Use `t.TempDir()` and mocked dependencies for filesystem/system side effects.

### issue-creation
- Always search for duplicates before opening a new issue.
- Use the repository issue templates; blank issues are not allowed.
- New issues receive `status:needs-review`; implementation waits for maintainer `status:approved`.
- Questions belong in Discussions, not Issues.
- Use conventional issue titles like `fix(scope): ...` or `feat(scope): ...`.

### judgment-day
- Resolve relevant compact rules from the registry BEFORE launching judges.
- Launch exactly two blind judges in parallel with identical scope and standards.
- Classify warnings as `real` vs `theoretical`; only real warnings block approval.
- Present Round 1 findings and get user confirmation before fixing confirmed issues.
- Re-judge after confirmed critical fixes; after 2 fix iterations, escalate to the user.

### skill-creator
- Create a skill only for reusable, non-trivial patterns or workflows.
- Use the standard structure: `skills/{skill-name}/SKILL.md` with optional `assets/` and `references/`.
- Frontmatter MUST include `name`, `description` with Trigger text, `license`, and metadata.
- Keep critical patterns actionable and examples minimal; do not duplicate existing docs.
- Register the new skill in `AGENTS.md` after creation.

### accessibility
- Every meaningful image needs alt text; decorative images use empty alt and presentation semantics.
- All interactive controls need accessible names, visible focus states, and keyboard support.
- Maintain WCAG AA contrast and never rely on color alone for state or errors.
- Provide skip links, associated labels, and screen-reader error announcements.
- Respect `prefers-reduced-motion` and ensure touch targets are at least 24x24 CSS px.

### frontend-design
- Choose a bold, explicit aesthetic direction before coding and keep it consistent.
- Start with typography, color system, motion, and composition; avoid generic AI-looking UI.
- Prefer distinctive fonts, strong visual hierarchy, and contextual atmospherics over default patterns.
- Match implementation complexity to the design vision: maximalism needs richer code, minimalism needs precision.
- Never default to cliché gradients, generic card grids, or overused font choices.

### frontend-skill
- Start with composition, not components; each section gets one job and one dominant idea.
- Treat the first viewport as a poster with strong brand hierarchy and a real visual anchor.
- Default to cardless layouts; use cards only when the card itself is the interaction.
- Keep copy short, utilitarian where needed, and remove filler aggressively.
- Ship 2-3 intentional motions that improve hierarchy or atmosphere without noise.

### seo
- Ensure crawlability with correct `robots.txt`, meta robots, canonical URLs, and sitemap coverage.
- Write unique title tags and meta descriptions with natural keyword placement.
- Maintain semantic heading hierarchy with one clear `<h1>` per page.
- Use descriptive, optimized image filenames and alt text.
- Prefer clean HTTPS URLs and avoid duplicate or parameter-heavy canonical pages.

### find-skills
- When users ask for a capability, identify the domain and search for an existing skill first.
- Check the skills leaderboard before CLI search when possible.
- Verify quality before recommending: installs, source reputation, and GitHub credibility.
- Present the skill with what it does, source, installs, and exact install command.
- If no fit exists, offer direct help and suggest creating a custom skill if the pattern recurs.

### ui-ux-pro-max
- Start every UI/UX task by generating a design system with `search.py --design-system`.
- Default stack guidance to `html-tailwind` unless the user specifies another stack.
- Supplement the design system with focused domain searches for UX, typography, charts, or style.
- Use SVG icon systems, stable hover states, visible focus, and responsive checks across key breakpoints.
- Avoid emoji icons, low-contrast light mode surfaces, invisible borders, and layout-shifting hover effects.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| — | — | No project convention index files detected at the repository root. |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
