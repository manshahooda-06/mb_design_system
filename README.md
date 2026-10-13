# Mozaic Design System

MediBuddy's enterprise React design system, distributed internally as **`@medibuddy/mozaic-ui`**.

Mozaic is the single implementation of MediBuddy's visual language. Product teams consume it instead of re-implementing buttons, inputs, and spacing scales per surface — so a change made once in Figma propagates to every product that installs the package.

---

## Table of contents

- [Status](#status)
- [Design system philosophy](#design-system-philosophy)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Folder structure](#folder-structure)
- [Getting started](#getting-started)
- [Development workflow](#development-workflow)
- [Build scripts](#build-scripts)
- [Storybook usage](#storybook-usage)
- [Adding a foundation](#adding-a-foundation)
- [Adding a component](#adding-a-component)
- [Coding standards](#coding-standards)
- [Publishing strategy](#publishing-strategy)
- [Contributing](#contributing)

---

## Status

**Five primitive foundations, three semantic collections, and seven components.**

Four foundations have landed: 136 primitive color tokens, 118 composite typography styles, a 32-step spacing scale, and an 11-step radius scale, all generated from Figma. Built out of the documented order — Radius (#5) shipped ahead of Sizing (#4) at the user's direction. The remaining eight foundations are empty, wired-up placeholders awaiting their exports.

| Layer       | State                                                                    |
| ----------- | ------------------------------------------------------------------------ |
| Tooling     | ✅ Complete                                                              |
| Foundations | 🟡 5 of 12 — colors, typography, spacing, radius, elevation              |
| Tokens      | 🟡 4 of 12 — colors, typography, spacing, radius                         |
| Themes      | ⬜ Architecture only                                                     |
| Icons       | ⬜ Structure only                                                        |
| Components  | 🟡 7 — Button, IconButton, Input, Textarea, OtpInput, InputDropdown, Tag |

---

## Design system philosophy

**1. Figma is the single source of truth.**
Every color, type ramp, spacing step, radius, shadow, and easing curve originates in the Figma Design System. No token value is invented, guessed, eyeballed from a screenshot, or hand-typed in this repository. If a value is not in Figma, it is not in Mozaic.

**2. Tokens are generated, not written.**
Token files are treated as build output. Hand-editing a generated token is a defect, because the next export will silently overwrite it. When a value is wrong, it is fixed in Figma and re-exported.

**3. Foundations before components.**
A component built on ad-hoc values bakes in drift that is expensive to remove later. All twelve foundations are completed and reviewed before the first component is written, so every component composes tokens from day one.

**4. One way to do each thing.**
The system is opinionated. Where Tailwind offers many escape hatches, Mozaic exposes the sanctioned path. Consumers should rarely need arbitrary values.

**5. Accessibility is a build requirement, not a review comment.**
`eslint-plugin-jsx-a11y` runs in CI and `@storybook/addon-a11y` runs on every story. Contrast, focus behavior, keyboard interaction, and semantics are acceptance criteria for a component, not follow-up tickets.

**6. Changes are additive and versioned.**
Downstream products upgrade on their own schedule. Breaking changes are batched, documented, and released deliberately.

---

## Tech stack

| Concern         | Choice                     | Notes                                                      |
| --------------- | -------------------------- | ---------------------------------------------------------- |
| UI runtime      | React 19                   | Declared as a peer dependency, never bundled               |
| Language        | TypeScript 6 (strict)      | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` |
| Styling         | Tailwind CSS v4            | CSS-first config via `@theme` — no `tailwind.config.js`    |
| Bundler         | Vite 8 (library mode)      | ESM output, externalized React                             |
| Types           | `unplugin-dts`             | Emits `.d.ts` alongside the bundle                         |
| Docs / dev env  | Storybook 10               | Primary development surface                                |
| Tests           | Vitest 4 + Testing Library | jsdom environment, v8 coverage                             |
| Lint            | ESLint 10 (flat config)    | TypeScript, react-hooks, jsx-a11y, storybook rules         |
| Format          | Prettier 3                 | With `prettier-plugin-tailwindcss` for class sorting       |
| Hooks           | Husky + lint-staged        | Lint and format staged files pre-commit                    |
| Package manager | pnpm 11                    | Pinned via `packageManager`                                |
| CI              | GitHub Actions             | Install → lint → format → typecheck → test → build         |

---

## Architecture

Mozaic separates design decisions into **three layers**, each with a distinct consumer.

```
┌──────────────────────────────────────────────────────────┐
│  Figma Design System            (source of truth)        │
└────────────────────────┬─────────────────────────────────┘
                         │  export · analyze · normalize
                         ▼
┌──────────────────────────────────────────────────────────┐
│  src/foundations/**   CSS layer                          │
│  Tailwind @theme blocks → CSS variables + utilities      │
│  Consumed by: component classNames, product Tailwind     │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│  src/tokens/**        TypeScript layer                   │
│  Typed exports of the same values                        │
│  Consumed by: logic that needs a value in JS             │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│  src/components/**    Component layer                    │
│  Composes foundations only — never raw values            │
└──────────────────────────────────────────────────────────┘
```

**Why two token layers?** Most styling should be CSS — utilities are tree-shaken by Tailwind and cost nothing at runtime. But some code genuinely needs a value in JavaScript (an inline chart color, an animation duration passed to a timer). `tokens/` serves that case without tempting anyone to hardcode a hex.

Both layers carry the **same twelve categories**, so a foundation is always findable in the same place:

`colors` · `typography` · `spacing` · `sizing` · `radius` · `border-width` · `opacity` · `elevation` · `motion` · `breakpoints` · `grid` · `z-index`

**Theming** is layered on top: `src/themes/light.css` and `dark.css` override the CSS variables that `foundations/` defines. Components never branch on theme — they reference variables that resolve differently per theme.

### Package outputs

`pnpm build` produces two independent entry points:

| Output            | Import                            | Contents                         |
| ----------------- | --------------------------------- | -------------------------------- |
| `dist/index.js`   | `@medibuddy/mozaic-ui`            | Components, hooks, utils, tokens |
| `dist/styles.css` | `@medibuddy/mozaic-ui/styles.css` | Compiled Tailwind + all tokens   |

They are separate so a consumer importing one component does not pull the entire stylesheet through the JS graph. React is externalized, never bundled.

---

## Folder structure

```
mozaic-design-system/
├── .github/workflows/ci.yml     CI pipeline
├── .husky/pre-commit            lint-staged hook
├── .storybook/                  Storybook config (main, preview)
├── diagnostics/                 Generator reports (alias resolution)
├── figma/                       Raw Figma exports — source of truth
├── scripts/                     Token generators
│   └── common/                  Shared generator framework
├── docs/
│   ├── Foundations.md           Per-foundation documentation
│   ├── Components.md            Per-component documentation
│   └── Contributing.md          Contribution guide
├── playground/                  Local scratch space (not published)
└── src/
    ├── foundations/             CSS layer — 12 categories
    │   ├── <category>/
    │   │   ├── <category>.css   Tailwind @theme block
    │   │   └── index.ts         Barrel
    │   └── foundations.css      Imports all 12 partials
    ├── tokens/                  TypeScript layer — same 12 categories
    │   └── <category>/index.ts
    ├── themes/
    │   ├── light.css
    │   └── dark.css
    ├── components/              UI components (empty)
    ├── icons/
    │   ├── svg/                 Raw SVG sources
    │   ├── Icon.tsx             Shared icon wrapper
    │   └── index.ts
    ├── hooks/                   Shared React hooks
    ├── utils/
    │   ├── cn.ts                clsx + tailwind-merge
    │   └── index.ts
    ├── types/                   Shared TypeScript types
    ├── styles/                  Global stylesheets
    ├── index.ts                 Public API barrel
    └── index.css                Tailwind entry
```

### Path aliases

Configured identically in `tsconfig.app.json` and `vite.config.ts`:

| Alias            | Resolves to         |
| ---------------- | ------------------- |
| `@/*`            | `src/*`             |
| `@foundations/*` | `src/foundations/*` |
| `@tokens/*`      | `src/tokens/*`      |
| `@themes/*`      | `src/themes/*`      |
| `@components/*`  | `src/components/*`  |
| `@icons/*`       | `src/icons/*`       |
| `@hooks/*`       | `src/hooks/*`       |
| `@utils/*`       | `src/utils/*`       |
| `@types/*`       | `src/types/*`       |
| `@styles/*`      | `src/styles/*`      |

Prefer aliases over deep relative paths (`../../../utils`).

---

## Getting started

**Prerequisites:** Node (see `.nvmrc`) and pnpm 11.

```bash
pnpm install
```

```bash
pnpm storybook
```

Storybook opens on [http://localhost:6006](http://localhost:6006), with a page per foundation and per component.

---

## Development workflow

1. **Branch** from `main` — see [naming rules](docs/Contributing.md#branch-naming).
2. **Develop in Storybook.** It is the primary surface; there is no separate dev app.
3. **Write tests alongside the source** as `*.test.ts(x)`.
4. **Commit.** Husky runs `eslint --fix` and `prettier --write` on staged files automatically.
5. **Open a PR.** CI runs two independent jobs — `build` (lint → format → typecheck → test → build) and `verify-tokens`.
6. **Get review** per the [code review guidelines](docs/Contributing.md#code-review-guidelines).

Run the `build` job locally before pushing. It must be green:

```bash
pnpm lint && pnpm format && pnpm typecheck && pnpm test && pnpm build
```

`pnpm verify:tokens` is the second job and answers a different question: is the _design data_ complete? It is **red today** — 75 semantic colour tokens are withheld pending Figma fixes — and goes green with no code change once those are made. It is deliberately kept out of the chain above so a data gap never looks like a code regression. See [Semantic-Tokens.md](docs/Semantic-Tokens.md#two-suites-two-owners).

```bash
pnpm verify:tokens
```

---

## Build scripts

| Script                    | What it does                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm storybook`          | Start Storybook on port 6006                                                          |
| `pnpm build`              | Typecheck, then build the library into `dist/`                                        |
| `pnpm build:storybook`    | Build the static Storybook site into `storybook-static/`                              |
| `pnpm lint`               | ESLint across the repository                                                          |
| `pnpm format`             | Prettier check — **fails** if anything is unformatted                                 |
| `pnpm format:write`       | Prettier write — applies formatting                                                   |
| `pnpm typecheck`          | TypeScript project-reference build, no emit                                           |
| `pnpm test`               | Vitest, single run                                                                    |
| `pnpm test:ui`            | Vitest with the interactive UI                                                        |
| `pnpm test:coverage`      | Vitest with a v8 coverage report                                                      |
| `pnpm verify:tokens`      | Verify design-data completeness — unresolved aliases, missing primitives, mode parity |
| `pnpm generate:component` | Scaffold a component onto the shared architecture                                     |

> `pnpm format` only checks. Use `pnpm format:write` to fix. CI runs the checking variant.

---

## Storybook usage

Storybook is where components are built, documented, and reviewed. Two addons are installed:

- **`@storybook/addon-docs`** — autodocs. Every component gets a generated docs page from its props and JSDoc.
- **`@storybook/addon-a11y`** — runs axe against each story and reports violations in the panel.

Controls, actions, viewport, backgrounds, toolbars, measure, and outline are **built into Storybook 10 core** — the old `@storybook/addon-essentials` package no longer exists and must not be re-added.

Global config lives in `.storybook/preview.tsx`, which imports `.storybook/storybook.css` — a Storybook-only stylesheet that wraps `src/index.css` and additionally registers story files as a Tailwind source. The published stylesheet deliberately scans shipped components only, so documentation pages would otherwise render unstyled.

### Token generators

Each foundation is generated from its Figma export by a script under [`scripts/`](scripts), built on a shared framework in `scripts/common/`. The full architecture — pipeline, module responsibilities, validation rules, testing strategy, regeneration workflow and known pitfalls — is documented in [docs/Token-Generation.md](docs/Token-Generation.md); [scripts/README.md](scripts/README.md) is a short reference kept beside the code.

Generators are idempotent, and each npm script runs Prettier over its output as part of the contract.

### Foundations pages

Foundations are documented as Storybook pages under the **Foundations** section, alongside their markdown reference in [docs/Foundations.md](docs/Foundations.md).

| Page                                     | Source                                              |
| ---------------------------------------- | --------------------------------------------------- |
| Foundations → Primitive Colors → Palette | `src/foundations/colors/Colors.stories.tsx`         |
| Foundations → Typography → Scale         | `src/foundations/typography/Typography.stories.tsx` |

These pages are documentation only. They render tokens directly from the package's own exports — so they cannot drift — and export no reusable components.

To enable a11y violations as hard failures, change `parameters.a11y.test` in `.storybook/preview.tsx` from `'todo'` to `'error'`.

---

## Adding a foundation

Foundations are built **one at a time, in this order**, each reviewed and approved before the next begins:

`colors` → `typography` → `spacing` → `sizing` → `radius` → `border-width` → `opacity` → `elevation` → `motion` → `breakpoints` → `grid` → `z-index`

Each follows the same eight-step pipeline:

| #   | Step                        | Output                                        |
| --- | --------------------------- | --------------------------------------------- |
| 1   | Export from Figma           | Raw token export                              |
| 2   | Analyze                     | Inventory of values, duplicates, and outliers |
| 3   | Normalize                   | Agreed naming and scale structure             |
| 4   | Generate CSS variables      | `src/foundations/<category>/<category>.css`   |
| 5   | Generate Tailwind tokens    | `@theme` block in the same file               |
| 6   | Generate TypeScript exports | `src/tokens/<category>/index.ts`              |
| 7   | Document                    | Section in `docs/Foundations.md`              |
| 8   | Review and approve          | Sign-off before the next foundation starts    |

Step-by-step instructions: [docs/Contributing.md](docs/Contributing.md#how-to-add-a-new-foundation).

---

## Adding a component

Components were gated on the foundations being complete and approved — see [philosophy](#design-system-philosophy). That gate has been lifted. Each component ships as a directory under `src/components/`:

```
src/components/<Component>/
├── <Component>.tsx           Implementation
├── <Component>.test.tsx      Unit and interaction tests
├── <Component>.stories.tsx   Storybook stories
├── types.ts                  Public prop types (if substantial)
└── index.ts                  Barrel
```

Every component must compose foundation tokens, expose a typed public API, pass axe with no violations, support keyboard interaction, forward refs, and be exported from `src/index.ts`.

Full checklist: [docs/Contributing.md](docs/Contributing.md#how-to-add-a-new-component).

---

## Coding standards

**TypeScript**

- Strict mode is on and not negotiable. No `any`; use `unknown` and narrow.
- No `@ts-ignore`. `@ts-expect-error` is allowed only with an explanatory comment.
- Prefer `type` for props and unions; `interface` when extending.
- Use `import type` for type-only imports (`verbatimModuleSyntax` is enabled).
- Export every public type from the component barrel.

**React**

- Function components only. No class components.
- Forward refs on any component that renders a DOM element.
- Extend the matching intrinsic props (`ComponentPropsWithoutRef<'button'>`) so consumers can pass through native attributes.
- Never spread unknown props onto a DOM node without typing them.
- Keep components controlled-first; add uncontrolled convenience only when warranted.

**Styling**

- Compose tokens. Never hardcode a hex, px, rem, or easing curve in a component.
- Merge classes through `cn()` from `@utils/cn` so consumer overrides win predictably.
- Accept a `className` prop on every component and merge it last.
- No inline `style` unless the value is genuinely dynamic at runtime.

**Naming**

| Thing                | Convention              | Example                  |
| -------------------- | ----------------------- | ------------------------ |
| Component file       | PascalCase              | `Button.tsx`             |
| Component directory  | PascalCase              | `src/components/Button/` |
| Hook                 | camelCase, `use` prefix | `useDisclosure.ts`       |
| Utility              | camelCase               | `cn.ts`                  |
| Foundation directory | kebab-case              | `border-width/`          |
| Type / interface     | PascalCase              | `ButtonProps`            |
| CSS variable         | kebab-case, namespaced  | `--color-brand-primary`  |

**Testing**

- Test behavior, not implementation. Query by role and accessible name.
- Every component needs coverage of its states, its keyboard interaction, and its a11y contract.
- No snapshot tests of rendered markup — they fail on cosmetic change and assert nothing meaningful.

**Imports**

- Use path aliases, not deep relative paths.
- Import from barrels (`@utils`), not internal files (`@utils/cn`), outside the owning module.

---

## Publishing strategy

**Registry.** Private and internal. The package is marked `private: true` while scaffolding; publishing is enabled by removing that flag and pointing `publishConfig.registry` at MediBuddy's internal registry.

**Versioning.** Semantic versioning, interpreted for a design system:

| Change                                                           | Bump      |
| ---------------------------------------------------------------- | --------- |
| Removing or renaming a component, prop, or token                 | **major** |
| Changing a token's value in a way that visibly moves existing UI | **major** |
| Changing default visual behavior of an existing component        | **major** |
| Adding a component, prop, variant, or token                      | **minor** |
| Bug fix, docs, internal refactor with no API or visual change    | **patch** |

A token value change is a **breaking change** even though types still compile — it moves pixels in every consuming product. Treat visual regressions with the same seriousness as type errors.

**What ships.** Only `dist/` (enforced by `files`). Source, tests, stories, and Storybook are not published.

**Consuming:**

```ts
import { cn } from '@medibuddy/mozaic-ui';
import '@medibuddy/mozaic-ui/styles.css';
```

`sideEffects` is set to `["**/*.css"]` so bundlers tree-shake unused JS while never dropping the stylesheet.

**Release flow.** Merge to `main` → CI green → version bump → tag → publish. Releases are deliberate, not automatic on merge.

---

## Contributing

Branch naming, commit conventions, the PR checklist, and code review guidelines live in **[docs/Contributing.md](docs/Contributing.md)**.

Reference docs: [docs/Semantic-Tokens.md](docs/Semantic-Tokens.md) · [docs/Foundations.md](docs/Foundations.md) · [docs/Component-Architecture.md](docs/Component-Architecture.md) · [docs/Components.md](docs/Components.md)
