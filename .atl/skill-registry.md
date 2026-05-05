# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When asked to improve accessibility, run an a11y audit, ensure WCAG compliance, add screen reader support, keyboard navigation, or make a UI accessible | accessibility | C:\Users\marko\.agents\skills\accessibility\SKILL.md |
| When creating a pull request, opening a PR, or preparing changes for review | branch-pr | C:\Users\marko\.config\opencode\skills\branch-pr\SKILL.md |
| When the user asks how to do something via an installable skill, wants to find a skill, or extend agent capabilities | find-skills | C:\Users\marko\.agents\skills\find-skills\SKILL.md |
| When building or styling web components, pages, apps, dashboards, posters, or other frontend UI with strong visual quality | frontend-design | C:\Users\marko\.agents\skills\frontend-design\SKILL.md |
| When the task needs a visually strong landing page, site, app, prototype, demo, or game UI with restrained composition | frontend-skill | C:\Users\marko\.agents\skills\frontend-skill\SKILL.md |
| When writing Go tests, using teatest, or adding test coverage | go-testing | C:\Users\marko\.config\opencode\skills\go-testing\SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature | issue-creation | C:\Users\marko\.config\opencode\skills\issue-creation\SKILL.md |
| When the user asks for judgment day / dual adversarial review | judgment-day | C:\Users\marko\.config\opencode\skills\judgment-day\SKILL.md |
| When asked to improve SEO, optimize for search, fix meta tags, add structured data, or improve sitemap/search visibility | seo | C:\Users\marko\.agents\skills\seo\SKILL.md |
| When creating a new AI skill, adding agent instructions, or documenting reusable AI patterns | skill-creator | C:\Users\marko\.config\opencode\skills\skill-creator\SKILL.md |
| When doing UI/UX design work that benefits from the local searchable design-system database | ui-ux-pro-max | C:\GymTracker\.opencode\skills\ui-ux-pro-max\SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### accessibility
- Use semantic HTML first; add ARIA only when native semantics cannot express the behavior.
- Ensure keyboard access for every interactive control; no keyboard traps.
- Keep visible focus states with sufficient contrast; never remove outlines without replacing them.
- Meet WCAG 2.2 AA contrast targets and do not rely on color alone for errors or state.
- Give icon-only controls accessible names and decorative graphics empty alt/`aria-hidden` treatment.
- Preserve skip links, focus order, and scroll offsets so focused content is not hidden by sticky UI.

### branch-pr
- Every PR MUST link exactly one approved issue before opening.
- Branch names must follow `type/description` with lowercase `a-z0-9._-`.
- PR body must include issue linkage, summary bullets, file changes, and a concrete test plan.
- Add exactly one `type:*` label matching the change category.
- Use conventional commits only; never add `Co-Authored-By` trailers.
- Run required validation relevant to the changed area before requesting review.

### find-skills
- Treat skill discovery as a package search problem: identify domain, task, and likely reusable workflow.
- Check popular/high-trust sources first; do not recommend obscure skills blindly.
- Prefer skills with meaningful install counts and reputable maintainers.
- Present the install command and why the skill matches the user’s need.
- If no good skill exists, say so clearly and offer direct help or suggest creating one.

### frontend-design
- Choose a strong visual direction before coding; intentionality matters more than ornament.
- Start from typography, color system, composition, and motion rather than default component libraries.
- Avoid generic AI aesthetics, timid palettes, and repetitive SaaS-card layouts.
- Use memorable hierarchy, spacing, and visual anchors tailored to the product context.
- Match implementation complexity to the chosen aesthetic: bold ideas need deliberate execution, not clutter.

### frontend-skill
- Start with visual thesis, content plan, and interaction thesis before building.
- Prefer full-bleed or dominant visual composition; treat the first viewport like a poster.
- Default to cardless layouts; use cards only when the card itself is the interaction.
- Give each section one job, one dominant idea, and one primary takeaway.
- Use short utility-first copy for app surfaces; avoid marketing filler in operational UIs.
- Ship 2-3 intentional motions that improve hierarchy or atmosphere, not noise.

### go-testing
- Prefer table-driven tests for logic with multiple scenarios.
- Test Bubble Tea model transitions directly before reaching for full integration tests.
- Use teatest for interactive TUI flows and golden files for stable visual output.
- Cover success, failure, and edge cases explicitly; do not stop at happy paths.
- Use `t.TempDir()` and dependency seams for file system or process side effects.

### issue-creation
- Blank issues are disabled; always use the proper GitHub issue template.
- Search for duplicates before creating a new bug or feature request.
- Fill every required field, including reproduction steps or problem statement.
- New issues land in `status:needs-review`; implementation waits for maintainer approval.
- Questions belong in Discussions, not Issues.

### judgment-day
- Never self-review; launch two blind judges in parallel with identical scope and standards.
- Resolve relevant project skills first and inject compact rules into judge/fix prompts.
- Classify warnings as real vs theoretical based on realistic user-triggered impact.
- Fix only confirmed issues, then re-judge; stop after two iterations unless the user asks to continue.
- If no skill registry exists, warn that review falls back to generic standards.

### seo
- Ensure crawlability basics: robots, canonicals, sitemap, HTTPS, and indexable URLs.
- Give every page a unique, descriptive title and meta description aligned with its content.
- Maintain proper heading hierarchy with one clear `<h1>` per page.
- Optimize image filenames, alt text, dimensions, and lazy loading.
- Prefer clean, lowercase, keyword-relevant URLs without unnecessary parameters.

### skill-creator
- Create a skill only for reusable, non-trivial patterns or workflows.
- Follow the standard `skills/{name}/SKILL.md` structure with complete frontmatter.
- Put the most critical patterns first; keep examples minimal and focused.
- Use `assets/` for templates/schemas and `references/` only for local docs.
- Register the new skill in the relevant instructions/index after creation.

### ui-ux-pro-max
- Start with the `--design-system` search flow before implementing UI.
- Use the local searchable datasets to derive pattern, palette, typography, and anti-patterns.
- Persist design-system output when the project needs reusable master/page overrides.
- Default stack guidance to `html-tailwind` unless the user specifies another stack.
- Validate interaction polish: real iconography, stable hover states, accessible motion, and contrast.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| — | — | No project-root convention files (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `GEMINI.md`, `copilot-instructions.md`) were found in `C:\GymTracker`. |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
