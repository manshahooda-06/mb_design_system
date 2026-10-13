# Contributing

How to contribute to the Mozaic Design System.

Read the [philosophy section of the README](../README.md#design-system-philosophy) first. The rules below follow from it — particularly that **Figma is the single source of truth** and **no token value is ever hand-written**.

---

## Contents

- [Before you start](#before-you-start)
- [Branch naming](#branch-naming)
- [Commit message convention](#commit-message-convention)
- [Pull request checklist](#pull-request-checklist)
- [How to add a new foundation](#how-to-add-a-new-foundation)
- [How to add a new component](#how-to-add-a-new-component)
- [Code review guidelines](#code-review-guidelines)

---

## Before you start

```bash
pnpm install
pnpm storybook
```

Run the full pipeline before pushing — it is exactly what CI runs:

```bash
pnpm lint && pnpm format && pnpm typecheck && pnpm test && pnpm build
```

If `pnpm format` fails, run `pnpm format:write`.

---

## Branch naming

```
<type>/<short-kebab-description>
```

Branch off `main`. Keep names short and specific.

| Type         | Use for                                  | Example                           |
| ------------ | ---------------------------------------- | --------------------------------- |
| `feat`       | New component, hook, or utility          | `feat/button-component`           |
| `foundation` | A design foundation                      | `foundation/colors`               |
| `fix`        | Bug fix                                  | `fix/tooltip-focus-trap`          |
| `docs`       | Documentation only                       | `docs/contributing-guide`         |
| `chore`      | Tooling, config, dependencies            | `chore/upgrade-storybook`         |
| `refactor`   | Internal change, no API or visual change | `refactor/extract-use-controlled` |
| `test`       | Tests only                               | `test/button-keyboard-nav`        |

**Rules**

- Lowercase and kebab-case only.
- No personal prefixes (`monica/fix-thing`).
- No ticket IDs in the branch name — put them in the PR description.
- One concern per branch. A branch that adds a foundation _and_ refactors the build is two PRs.

---

## Commit message convention

[Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:** `feat` · `fix` · `docs` · `style` · `refactor` · `test` · `chore` · `perf` · `build` · `ci` · `revert`

**Scope** is the area touched — a foundation (`colors`), a component (`Button`), or a subsystem (`build`, `storybook`, `deps`). Omit it if the change is genuinely repository-wide.

**Subject**

- Imperative mood: "add", not "added" or "adds".
- Lowercase first letter, no trailing period.
- Under 72 characters.

**Examples**

```
feat(colors): add color foundation generated from Figma
feat(Button): add loading and destructive variants
fix(Tooltip): restore focus to trigger on Escape
docs(readme): document publishing strategy
chore(deps): upgrade Storybook to 10.5
refactor(cn): simplify class merge order
```

**Breaking changes** get a `!` after the type/scope and a footer explaining the migration:

```
feat(spacing)!: rename spacing scale from t-shirt sizes to numeric steps

BREAKING CHANGE: `spacing.md` is now `spacing.4`. Update all consumers.
```

A token value change that visibly moves existing UI is a breaking change even when types still compile. See the [versioning table](../README.md#publishing-strategy).

---

## Pull request checklist

Copy this into the PR description and tick it off.

**Scope**

- [ ] The PR does one thing. Unrelated changes have been split out.
- [ ] The description explains _why_, not just _what_.
- [ ] Linked to its ticket or Figma frame.

**Quality gates** (all must be green — CI enforces them)

- [ ] `pnpm lint`
- [ ] `pnpm format`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm build`

**Design system rules**

- [ ] No hardcoded design values — no hex codes, `px`, `rem`, or easing curves in components.
- [ ] Every value traces back to a Figma export.
- [ ] Generated token files were regenerated, not hand-edited.
- [ ] Public API additions are exported from `src/index.ts`.

**Components** (skip if not applicable)

- [ ] Storybook stories cover every variant and state.
- [ ] The a11y addon panel reports zero violations.
- [ ] Keyboard interaction works and is tested.
- [ ] `ref` is forwarded; `className` is accepted and merged with `cn()`.
- [ ] Tests cover behavior, not implementation detail.
- [ ] Documented in `docs/Components.md`.

**Foundations** (skip if not applicable)

- [ ] CSS variables, Tailwind `@theme`, and TypeScript exports are all in sync.
- [ ] Documented in `docs/Foundations.md`.
- [ ] Approved before the next foundation was started.

**Breaking changes**

- [ ] Marked with `!` and a `BREAKING CHANGE:` footer.
- [ ] Migration path documented.
- [ ] Downstream consumers identified and notified.

---

## How to add a new foundation

Foundations are built **one at a time, in a fixed order**, each approved before the next begins:

`colors` → `typography` → `spacing` → `sizing` → `radius` → `border-width` → `opacity` → `elevation` → `motion` → `breakpoints` → `grid` → `z-index`

> **Never invent a value.** If something is missing or ambiguous in Figma, resolve it in Figma with the design owner first. Do not fill the gap in code.

### 1. Export from Figma

Export the variable collection for this foundation. Attach the raw export to the PR so reviewers can diff generated output against source.

### 2. Analyze

Inventory what came out. Identify duplicates, near-duplicates, one-off values used in a single frame, and anything inconsistent. Raise these with the design owner **before** generating — a design system is the moment to resolve drift, not encode it.

### 3. Normalize

Agree the naming scheme and scale structure. Naming rules:

- kebab-case throughout
- Namespaced by category: `--color-*`, `--spacing-*`, `--radius-*`
- Semantic over literal where a semantic meaning exists — `--color-text-danger`, not `--color-red-600`
- Primitive scales may stay literal (`--color-red-600`) when they back semantic aliases

> Generators are built on the shared framework in `scripts/common/` — see [Token-Generation.md](Token-Generation.md) for the full architecture. Use `parser.collection()` and `validation.require()` rather than assuming the export is well-formed: a generator must fail loudly rather than emit a guessed value.

### 4. Generate CSS variables and Tailwind tokens

Both live in `src/foundations/<category>/<category>.css` inside the `@theme` block. Tailwind v4 derives utilities from these automatically.

```css
/* src/foundations/radius/radius.css */
@theme {
  --radius-sm: /* value from Figma */;
  --radius-md: /* value from Figma */;
}
```

The file is already imported by `src/foundations/foundations.css` — no wiring needed.

### 5. Generate TypeScript exports

Mirror the same values in `src/tokens/<category>/index.ts`, typed and `as const`:

```ts
export const radius = {
  sm: '...',
  md: '...',
} as const;

export type Radius = keyof typeof radius;
```

Values must match the CSS exactly. A mismatch between the two layers is a defect.

### 6. Export publicly

Re-export from `src/index.ts` so consumers can import from the package root.

### 7. Document

Add a section to `docs/Foundations.md`: what the foundation covers, the full token table, usage guidance, and anything deliberately excluded.

### 8. Review and approve

Get sign-off from both a design owner (values match Figma) and an engineering owner (structure and naming). **Only then start the next foundation.**

---

## How to add a new component

> Components were gated on the foundations being complete and approved. That gate has been lifted; the five populated foundations plus the semantic layer are what components draw from today.

### Structure

```
src/components/<Component>/
├── <Component>.tsx           Implementation
├── <Component>.test.tsx      Tests
├── <Component>.stories.tsx   Stories
├── types.ts                  Public prop types (if substantial)
└── index.ts                  Barrel
```

### Steps

**1. Confirm the Figma spec.** Every variant, state (default, hover, focus, active, disabled, loading, error), and responsive behavior. Build from the spec, not a screenshot.

**2. Define the public API before implementing.** Props are the contract and are expensive to change later. Extend the underlying element's props:

```ts
import type { ComponentPropsWithoutRef } from 'react';

export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
};
```

**3. Implement.** Compose foundation tokens only. Forward the ref. Accept `className` and merge it last through `cn()` so consumer overrides win:

```tsx
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], className)} {...props} />
  ),
);
Button.displayName = 'Button';
```

**4. Write stories** — one per variant and state, plus an interactive playground. Check the a11y panel; resolve every violation.

**5. Write tests.** Query by role and accessible name. Cover rendering, every variant, keyboard interaction, disabled behavior, and ref forwarding. No markup snapshots.

**6. Export** from the component barrel and from `src/index.ts`, including its types.

**7. Document** in `docs/Components.md`.

### Definition of done

- [ ] Matches the Figma spec across every variant and state
- [ ] Zero hardcoded design values
- [ ] Zero a11y violations; keyboard fully operable
- [ ] Ref forwarded, `className` merged, native props passed through
- [ ] Stories cover all variants and states
- [ ] Tests cover behavior and a11y contract
- [ ] Exported publicly and documented

---

## Code review guidelines

### For authors

- Keep PRs small. A reviewer catches more in 200 lines than in 2,000.
- Review your own diff first — you will catch the obvious things yourself.
- Explain the _why_ in the description. The diff already shows the _what_.
- Include before/after screenshots for anything visual.
- Call out the parts you are unsure about. That is where you want attention.
- Respond to every comment, even if only to say you disagree and why.

### For reviewers

Review in this order — do not spend attention on naming before confirming the approach is right.

**1. Correctness of approach.** Is this the right solution? Does it belong in the design system at all, or is it product-specific?

**2. Design system integrity.** This is the review that matters most here:

- Does every value trace back to Figma?
- Any hardcoded hex, `px`, `rem`, or easing curve?
- Are CSS and TypeScript token layers in sync?
- Does this create a second way to do something the system already does?

**3. Public API.** Props are a long-lived contract. Is the naming consistent with existing components? Is anything exported that should stay internal?

**4. Accessibility.** Roles and labels, keyboard operability, focus management, contrast. Do not defer these to a follow-up.

**5. Tests.** Do they test behavior or implementation? Would they catch a real regression? Are the failure modes covered, not just the happy path?

**6. Style and naming.** Last, and lowest stakes — most of it is already enforced by ESLint and Prettier.

### Conventions

Prefix comments so authors know what is blocking:

| Prefix      | Meaning                                                |
| ----------- | ------------------------------------------------------ |
| `blocking:` | Must be resolved before merge                          |
| `question:` | I need to understand before I can approve              |
| `nit:`      | Minor; author's discretion, never blocks               |
| `praise:`   | Worth calling out — good reviews are not only critique |

**Norms**

- Two approvals for a new component or foundation. One for docs, chores, and small fixes.
- At least one approval must come from a design system owner.
- Foundations additionally need design sign-off that values match Figma.
- Reviewers respond within one business day; say so if you cannot.
- Authors do not merge their own PR without an approval.
- Disagreements go to the design system owner rather than a comment thread war.

### What always blocks

- A hardcoded design value
- A hand-edited generated token file
- An a11y violation
- A failing quality gate
- An undocumented breaking change
- A new public API with no tests
