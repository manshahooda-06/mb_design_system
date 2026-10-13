# Component architecture

The shared foundation every Mozaic component is built on: folder layout, variant system, slots, accessibility helpers, token rules, and the generator that wires them together.

This is the reference for anyone adding or changing a component. For what each component does, see [Components.md](Components.md). For where token values come from, see [Token-Generation.md](Token-Generation.md).

**No components exist yet.** The architecture landed first, deliberately: Button is its first implementation and its first real test, and building the framework against a real component tends to bake that component's assumptions into the framework.

---

## Contents

- [1. What the framework provides](#1-what-the-framework-provides)
- [2. Folder structure](#2-folder-structure)
- [3. The generator](#3-the-generator)
- [4. Token consumption](#4-token-consumption)
- [5. Variant architecture](#5-variant-architecture)
- [6. Slot architecture](#6-slot-architecture)
- [7. TypeScript conventions](#7-typescript-conventions)
- [8. Accessibility helpers](#8-accessibility-helpers)
- [9. Styling conventions](#9-styling-conventions)
- [10. Testing](#10-testing)
- [11. Storybook](#11-storybook)
- [12. Adding a component](#12-adding-a-component)
- [13. Design decisions](#13-design-decisions)
- [14. Deferred](#14-deferred)

---

## 1. What the framework provides

| Concern        | Where                                             | What it gives a component                               |
| -------------- | ------------------------------------------------- | ------------------------------------------------------- |
| Class merging  | `src/utils/cn.ts`                                 | Tailwind conflict resolution, consumer `className` wins |
| Variants       | `src/utils/variants.ts`                           | Styling as data, with prop types derived from it        |
| Slots          | `src/utils/slot.tsx`, `src/utils/compose-refs.ts` | `asChild` rendering into the caller's element           |
| Accessibility  | `src/utils/a11y.ts`                               | Shared focus ring, ARIA attribute helpers               |
| Prop contracts | `src/types/index.ts`                              | The prop shapes every component agrees on               |
| Token rule     | `src/components/token-usage.policy.ts`            | Enforcement that components use semantic tokens         |
| Conformance    | `src/components/architecture.test.ts`             | Enforcement that components have the required shape     |
| Scaffolding    | `scripts/generate-component.py`                   | A working component with all of the above wired up      |

Everything is exported from the package entry, so consumers building on top of Mozaic get the same primitives its own components use.

---

## 2. Folder structure

One directory per component, five files, no exceptions:

```
src/components/
  index.ts                  Generated barrel — lists exactly the components that exist
  Button/
    Button.tsx              The component. Chooses props; decides no classes.
    Button.variants.ts      Every class the component can apply, as data.
    Button.test.tsx         Behaviour, including the shared contract.
    Button.stories.tsx      Documentation and visual review.
    index.ts                Public exports for this component.
```

The split between `Button.tsx` and `Button.variants.ts` is the one that carries weight. Styling declared as data can be reviewed without reading a render function and tested without mounting anything, and it gives Tailwind a single file to scan. A class string inline in JSX is styling that no test and no reviewer will reliably see.

`architecture.test.ts` enforces this layout, so a component missing its stories or naming its variants file something else fails CI.

A component may add a file beyond the five when something genuinely is not one of them. Two exist today, both for the same reason — a module that exports a component and something else defeats React Fast Refresh, so the something else moves out:

- `Avatar/get-initials.ts` — a pure helper, also exported for callers who need the same abbreviation.
- `src/assets/avatar/` — the thirteen relationship illustrations. **Artwork is not implementation**, so it sits outside `components/` entirely: one file per drawing, each exported individually, plus a lookup map Avatar reads for its `relationship` prop. A consumer can import a single illustration without reaching into a component's internals.

`token-usage.test.ts` scans `src/assets/` as well as `src/components/`, so moving artwork out of a component does not move it out of the token rule.

---

## 3. The generator

```bash
pnpm generate:component Button --element button
```

Writes the five files and regenerates the barrel. `--element` sets the DOM element the component renders and defaults to `div`.

**It never overwrites.** Token generators own their output and overwrite every run; component files are authored by people after scaffolding, and clobbering those would destroy work. Re-running is a safe no-op that reports what it skipped — which also makes it the way to regenerate the barrel after deleting a component.

The skeleton it emits is a **working component**, not a stub: it compiles, lints, passes its own tests, and obeys the token rule on the first run. A scaffold that starts red teaches people to ignore red.

Shared helpers live in `scripts/common/scaffold.py`, alongside the token generator framework. Name casing, placeholder substitution and the write-once semantics are there; the templates are in the generator.

---

## 4. Token consumption

**The rule.** A component styles itself from semantic tokens. Where a semantic collection does not exist yet, it may use the corresponding primitive. Today that exemption covers exactly **typography and radius**. Any other primitive is a violation, as is a hardcoded arbitrary value such as `p-[13px]`.

| Category   | Semantic collection | Components use                                 |
| ---------- | ------------------- | ---------------------------------------------- |
| Colour     | ✅ 320 tokens       | `bg-semantic-*`, `text-semantic-*`             |
| Spacing    | ✅ 17 tokens        | `p-semantic-*`, `gap-semantic-*`               |
| Container  | ✅ 3 tokens         | `max-w-desktop`                                |
| Radius     | ❌ none yet         | `rounded-md` — exempt                          |
| Typography | ❌ none yet         | `text-desktop-body-md`, `font-medium` — exempt |

**The exemption expires by itself.** The allowlist is derived from which semantic collections exist on disk, not from a constant someone must remember to edit. The day `src/semantic/radius/` is generated, radius leaves the allowlist and every component still using `rounded-md` fails — the migration prompt arrives exactly when the migration becomes possible. `token-usage.test.ts` proves this with a synthetic index rather than waiting for it to happen.

**Why enforced rather than documented.** "Use semantic tokens" is the kind of rule that holds for three components and then quietly stops, because `text-gray-500` is always the fastest way to finish. By the time the drift is visible it is everywhere and a theme change no longer works.

The rule also catches two things beyond primitives:

- **Arbitrary values** — `bg-[#ffffff]` bypasses the token layer entirely and cannot be themed.
- **Dangling semantic names** — `bg-semantic-bg-primry` matches no token, so Tailwind emits nothing and the element renders unstyled. Nothing warns, and it reads as correct in review. This is the class-name equivalent of the dangling `var()` check the token layer already has.

The check reads token names out of the generated stylesheets rather than from a list, so adding or renaming a token needs no change here. It classifies a token as semantic by **which directory declared it**, not by whether its name contains `semantic-` — the Container collection predates that convention and emits `--container-desktop`, which a name-based test would wrongly forbid.

---

## 5. Variant architecture

Built on [`class-variance-authority`](https://cva.style), wrapped once as `defineVariants`:

```ts
export const buttonVariants = defineVariants(
  ['inline-flex items-center justify-center', 'rounded-md font-medium', focusRing],
  {
    variants: {
      variant: { primary: 'bg-semantic-bg-brand-solid', secondary: 'bg-semantic-bg-secondary' },
      size: { sm: 'px-semantic-md', md: 'px-semantic-lg' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
```

The wrapper exists for one reason: CVA joins classes with `cx`, which concatenates. A base of `rounded-md` and a compound variant of `rounded-full` would both survive, and which won would depend on the order Tailwind emitted them in rather than on what the component asked for. `defineVariants` routes the result through `cn`, so the variant wins. Wrapping here rather than at each call site means a component cannot forget.

It is typed as `typeof cva`, so `VariantProps<>` inference behaves exactly as it would with CVA itself.

### `cn` and the semantic scales

`cn` is `clsx` plus a **configured** tailwind-merge. The configuration is not cosmetic: tailwind-merge decides whether two classes conflict by validating the value against the scale it expects, and `semantic-lg` matches none of its built-in validators. Unconfigured, `twMerge('px-semantic-lg', 'px-semantic-xl')` returns **both** classes — so a caller's `className` would not reliably override a variant's padding.

Colours hid this: `bg-*` accepts any value, so semantic colours deduped correctly while semantic spacing silently did not.

---

## 6. Slot architecture

Three distinct things share the name "slot"; the framework distinguishes them.

**Content slots** — caller-supplied nodes at fixed positions, `startSlot` and `endSlot`. Named by position rather than content, because position is what the component controls: it cannot enforce that the node is an icon, and `left` is wrong under right-to-left text.

**Style slots** — for components with more than one styled element. They accept `classNames={{ root, label }}`, keyed by the same names their variant definition uses, so the styling surface and the override surface cannot drift apart. Typed by `SlotClassNames<Slot>`.

**`asChild`** — renders into the caller's own element instead of the component's:

```tsx
<Button asChild>
  <a href="/settings">Settings</a>
</Button>
```

The alternative is wrapping, and wrapping is quietly wrong: an extra element around a flex or grid child changes the layout, a `<button>` around an `<a>` nests two interactive elements, and the outer element takes the focus ring while the inner takes the click.

`Slot` merges props onto the child with per-kind precedence — event handlers **compose** (both run, slot first, because overriding either silently cancels behaviour the other side assumed), `className` merges through `cn`, `style` merges shallowly, `ref` composes via `composeRefs`, and everything else takes the child's value. It throws on anything but exactly one element child: two children have no correct interpretation, and silently picking one produces a component that ignores half its own props while looking right in the inspector.

Content slots are **not** applied under `asChild` — the caller owns the content there.

---

## 7. TypeScript conventions

`src/types/index.ts` holds the intersection of every component, not the union:

| Type                 | Purpose                                                             |
| -------------------- | ------------------------------------------------------------------- |
| `BaseComponentProps` | `className` and `children`, accepted by everything                  |
| `AsChildProps`       | The `asChild` flag                                                  |
| `ContentSlotProps`   | `startSlot` and `endSlot`                                           |
| `SlotClassNames<S>`  | Per-slot class overrides for multi-part components                  |
| `PolymorphicProps`   | Own props plus every prop valid on the element `as` resolves to     |
| `Size`, `Intent`     | Shared scales, so `size="md"` means the same step across components |

React 19 makes `ref` an ordinary prop, so nothing wraps `forwardRef` and `ComponentPropsWithRef` carries the right ref type on its own.

A component narrows the shared scales to what it actually implements rather than accepting a size it renders identically.

---

## 8. Accessibility helpers

Small on purpose — each entry exists because more than one component needs it and getting it wrong is a defect, not a preference.

- **`focusRing`** / **`focusRingError`** — the shared indicator. One string holds both `outline-none` and its replacement so the two cannot be separated; removing an outline without replacing it is the most common accessibility regression in a component library. Uses `focus-visible`, because a ring on every mouse click is the noise that drives teams to delete it.
- **`ariaAttr(condition)`** — returns `true` or `undefined`. React stringifies `false` into `aria-invalid="false"`, which is not the same as omitting the attribute.
- **`dataAttr(condition)`** — state exposed to CSS without pushing state into `className`.
- **`composeIds(...)`** — joins ids for `aria-describedby`, dropping absent ones. A stray `undefined` points at an element that does not exist, which assistive technology skips silently.

No visually-hidden helper: Tailwind ships `sr-only`, and a second implementation is one more thing to keep correct.

---

## 9. Styling conventions

1. **Classes are declared in `*.variants.ts`, never inline in JSX.** Enforced by `architecture.test.ts`.
2. **Semantic tokens only**, per [§4](#4-token-consumption). Enforced by `token-usage.test.ts`.
3. **`className` is merged last** and always wins, so consumers never need `!important`.
4. **No arbitrary values.** If no token fits, the token is missing from Figma — that is the fix.

### Tailwind source registration

`src/index.css` uses `source(none)` and declares sources explicitly. Two details matter:

- The glob is `./components/**/*.{ts,tsx}`. A `*.tsx`-only glob scans render functions and misses **all** the styling, because styling lives in `.variants.ts`. The component then ships with no utilities of its own and renders unstyled — while passing every unit test, since jsdom applies no CSS.
- Tests, stories and `*.policy.ts` are excluded with `@source not`. A class written only in an assertion is not a class the library uses. Storybook adds story files back as a source of its own in `.storybook/storybook.css`, so docs pages still render.

`architecture.test.ts` asserts both, because both failed silently the first time.

---

## 10. Testing

Every scaffolded component starts with the **shared contract** — the behaviour a consumer expects from any component, so breaking one breaks an expectation set by all of them:

- renders children
- applies its default variant, and a requested one
- lets `className` win over a variant class
- forwards a ref to the rendered element
- renders content slots around children
- renders the caller's element under `asChild`
- passes through arbitrary DOM props

Add component-specific cases below these; do not delete them.

Framework code has its own tests — `cn`, `defineVariants`, `Slot`, `composeRefs` and the a11y helpers are covered directly, and the token rule is proven against synthetic fixtures so it is verified from the day it lands rather than the day a component first breaks it.

---

## 11. Storybook

Each component gets `Default`, `Variants`, `Sizes`, `WithSlots` and `AsChild` stories under `Components/<Name>`, with `autodocs` on and controls wired to the variant props.

`Variants` and `Sizes` render the whole set side by side rather than one per story, because a scale is judged as a progression and a change to one step is only visible against the others.

---

## 12. Adding a component

1. `pnpm generate:component <Name> --element <tag>`
2. Fill in the variant definition using semantic tokens.
3. Implement the component; keep classes out of the JSX.
4. Extend the generated tests; keep the shared contract cases.
5. Extend the stories.
6. `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
7. Document it in [Components.md](Components.md).

The token rule and the conformance test will tell you if steps 2–4 drifted.

---

## 13. Design decisions

**No component token layer.** An earlier proposal put a `--component-*` alias layer between components and tokens so the typography and radius gap could be hidden behind it. Rejected as an abstraction that pays for itself only once, in exchange for a permanent extra indirection on every lookup. The enforced allowlist achieves the same migration safety with no runtime layer, and the exemption is visible in the rule rather than buried in an alias file.

**CVA rather than tailwind-variants.** `tailwind-variants` has first-class style slots, which is tempting given [§6](#6-slot-architecture). It also bundles its own tailwind-merge, which would duplicate the configured one in `cn` and quietly use the _unconfigured_ defaults for semantic scales — the exact bug described in [§5](#5-variant-architecture). CVA plus `cn` keeps one merge configuration.

**`asChild` rather than `as` in the skeleton.** Both exist; `PolymorphicProps` is available for components that genuinely need `as`. The scaffold uses `asChild` because it covers the common case — render as a link, a router link, a label — without the generic-inference cost that polymorphic components impose on every prop.

**Python generator, TypeScript rule.** Scaffolding joins the existing Python generator framework because it is build tooling. The token rule is TypeScript because it runs in Vitest alongside everything else it guards, and because it reads the same generated stylesheets the browser will.

---

## 14. Deferred

Worth doing, deliberately not done yet — each would be speculative without a component to justify its shape:

- **A `useControllableState` hook** for components that are both controlled and uncontrolled (Input, Modal, Toggle). The right API depends on the first two real consumers.
- **Focus trapping and scroll locking** for Modal. Genuinely shared across overlays, but there is one overlay planned and no second data point.
- **Icon slot conventions** — sizing an icon relative to the component's text size needs the semantic typography collection first.
- **Compound components** (`Modal.Header`, `Modal.Body`). No component needs them yet, and the context plumbing is easy to get wrong in the abstract.
- **Visual regression testing.** Chromatic was removed from the scaffold; whether to reintroduce it is a question for when there are components to regress.
- **`border-width` in the token rule.** `border-2` reads `--border-width-*`, which has no export yet, so only the colour reading of `border-*` is checkable today.

---

## Open architectural decision: the `device` prop

**Status: measured, still undecided. Nothing here is implemented.**

Two components expose a `device` prop: `SearchBar` (`mobile` | `desktop-1280` |
`desktop-1920`) and `InputDropdown` (`desktop` | `mobile`). Nothing else does; every other
component sizes through a `size` prop, and the library contains **zero** breakpoint variants.

### Why it exists

Figma publishes these as a **variant axis**, not a size scale. The three Search Bar viewports
disagree on padding, both icon ramps, the content gap and the type step, sharing only the
fill, stroke, radius and shadow. A `device` prop reproduces exactly what the file publishes.

### Why it is a mismatch

The consuming frontend repository resolves responsiveness in CSS: **742 breakpoint-variant
occurrences across 153 of its 317 component files**, plus 83 fluid `autoScale()` type tokens,
and **no `device`-style prop anywhere**. Measured in a real consumer app, every
intrinsically-sized Mozaic component is **byte-identical at 375, 1280 and 1920** — a Search
Bar left at `device="mobile"` stays 44px tall on a 1920 desktop until someone changes the prop.

### The prototype, and what it settles

A breakpoint-gated prototype was built in isolation and measured against the current
implementation at all three reference widths, on ten properties: height, padding, root gap,
content gap, search icon, clear icon, typography, static-to-window gap, window height and
placeholder pitch.

| Reference width          | Responsive prototype vs current | Mismatches |
| ------------------------ | ------------------------------- | ---------- |
| below `xl` (mobile band) | identical                       | **0 / 10** |
| 1280                     | identical                       | **0 / 10** |
| 1920                     | identical                       | **0 / 10** |

**Responsive CSS can preserve Figma exactly.** The feared typography conflict does not arise:
gating discrete tokens behind media queries keeps 1280 at Figma's **16/24**. The 17.55/24.73
figure only appears if the frontend's fluid `autoScale()` ramp is adopted _instead of_ the
discrete tokens — a different change, and one that would break parity.

### What it would still cost

1. **A new breakpoint token.** Tailwind's `xl` is 1280, so Figma's Desktop-1280 maps for
   free — but there is no 1920 breakpoint (`2xl` is 1536). `--breakpoint-*` would need a
   120rem entry, and `src/foundations/breakpoints/breakpoints.css` is an empty `@theme {}`
   reserved for _Figma-sourced_ tokens. Figma names 1920 as a device variant, not as a
   breakpoint, so adding it is a design decision rather than a transcription.
2. **Stepped, not fluid.** At 1600px the prototype still shows the 1280 band (16/24) where
   the frontend's fluid ramp would give 18.78/26.37. Mozaic would step where their own
   components interpolate — exact at the reference widths, visibly different between them.
3. **Class growth.** Every per-device slot triples.
4. **An API decision.** Whether `device` is removed, kept as an override, or joined by an
   opt-in responsive mode.

### Recommendation

A backwards-compatible path exists: keep `device` as an explicit override and add an opt-in
responsive mode, so nothing currently rendering changes and consumers who want CSS-driven
behaviour get it. That needs the 1920 breakpoint decision first. **Not implemented — this is
a design call, and points 1 and 2 are genuine disagreements between the two sources of truth
rather than things to settle in code.**

---

## Consumption model: verified findings

Recorded so these are not re-litigated. Each was measured, not inferred.

### ESM only — no CJS build needed

Their application source contains **zero `require()` calls** across `ui/src` and `util/src`.
The only `require()` in the archive is their Tailwind config, which is Node-loaded CJS and
never imports Mozaic — Mozaic ships compiled CSS rather than a Tailwind preset, so that path
does not exist. Their bundlers (Vite for Storybook, Next for the app) both consume ESM.
**Conclusion: keep ESM-only.** Revisit only if Mozaic is ever vendored into their Nx workspace
as a lib, where their existing tooling expects tsup's dual output.

### framer-motion is a peerDependency, floor set by the consumer

The frontend team confirmed their stack: **React 19.0.0, react-dom 19.0.0, Next 15.2.8,
framer-motion `^11.3.30`, Nx workspace, ESM-only.** That closes the question this section
previously left open.

- `peerDependencies: "^11.3.30 || ^12.0.0 || ^13.0.0"` — matches their declared range, so the
  consumer supplies the single copy and Mozaic needs no release when they move within 11→13.
- `devDependencies: "^11.13.5"` — deliberately a **higher floor than the peer**. 11.12.0 and
  earlier ship React-18-era types where `motion.span` rejects `className` under React 19
  types (it resolves to `HTMLAttributesWithoutMotionProps<unknown, unknown>`); 11.13.5 is the
  first 11.x declaring `react: ^18.0.0 || ^19.0.0`. This is a _compile-time_ constraint on
  Mozaic's own source, not on consumers.
- The lower peer floor is safe because **no shipped `.d.ts` imports framer-motion types.** The
  two declarations that mention it do so only in prose, and `SearchBarPlaceholder` is not
  re-exported from any `index.d.ts`. A consumer pinned to 11.3.30 gets no type friction.
- Runtime verified _at_ that floor: the full suite passes **1375/1375 on framer-motion
  11.3.30**, with transforms identical to 13 — `translateY(-24px)` between steps and `none` at
  rest. Animation timing and visual behaviour are unchanged.
- One installed copy proven rather than assumed: a Next 15.2.8 consumer installed from the
  packed tarball resolved exactly one
  `framer-motion@11.3.30_react-dom@19.0.0_react@19.0.0`, and `dist/index.js` still emits a
  bare `import { motion, useReducedMotion } from "framer-motion"` with zero internals inlined.

### Nx workspace consumption

`project.json` at the repo root lets Mozaic drop into their workspace as
`libs/mozaic/` — an Nx library whose targets delegate to Mozaic's own scripts
(`nx:run-commands`, their existing pattern) rather than re-describing the pipeline. It adds
`outputs` and `cache: true`, which their own `ui` project omits; that is a deliberate
improvement, not a divergence to reconcile.

Why delegation rather than adopting their build: Mozaic is **Tailwind v4** and their workspace
is **v3**. Under pnpm's isolated layout Mozaic's v4, Vite and Storybook 10 stay in its own
`node_modules` and never collide with the workspace's v3. Two consequences worth stating:

- **Do not add Mozaic's source to their `tailwind.config.js` `content` globs.** Their globs are
  explicit per-lib joins, so it is excluded today. Mozaic ships compiled CSS; scanning its
  source with v3 would generate nothing useful and invites confusion.
- The `$schema` path in `project.json` assumes depth `libs/mozaic/`. Move it and that relative
  path needs to match.

Their scope is `@medibuddyweb/*` and Mozaic publishes as `@medibuddy/mozaic-ui`; if they want
scope consistency inside the workspace that is a rename decision, not a technical blocker.

### Verified against the real consumer

A Next.js 15.2.8 App Router app, React 19.0.0, Tailwind v3.4.19, installing Mozaic from
`pnpm pack` output:

- `next build` **compiled and typechecked** against `@types/react@19.0.0` and **prerendered
  4/4 static pages** — so all 12 components server-render, and the `'use client'` banner
  satisfies the App Router from a Server Component page importing every one of them.
- **No host-style leak.** The host's `body`, `h1`, `p`, `input` and `button` all stayed
  Georgia, with Tailwind v3 preflight intact (`h1` 16px/400, `button` transparent). No
  stylesheet in the page — Mozaic's or Tailwind's — sets `color-scheme`, `background` or
  `color` on `:root`/`html`/`body`.
- **v3 preflight does not defeat Mozaic typography.** SearchBar resolves Figma's discrete
  values inside the v3 host: **14/20 mobile, 16/24 at desktop-1280, 20/28 at desktop-1920** —
  not the workspace's fluid 17.55/24.73 at 1280. Heights 44/48/60 as measured from Figma.
- Geometry is viewport-independent: identical at 375, 1280 and 1920, confirming `device`
  drives the variant and nothing steps on it. Zero console errors.
- `IconButton` alone omits `font-sans` and inherits the host family. That is correct — it
  renders no visible text; its `loadingLabel` is `sr-only`.

### Storybook is consumed as source, not as a package

Their `.storybook/main.ts` aliases every internal package to `…/src`, so they run Storybook
against source rather than built output. They maintain **3 stories for 111 components**;
Mozaic has **20 stories for 12**. Nothing about their setup constrains ours: the version
difference (their 8.6, ours 10.5) only matters if the two Storybooks are merged into one
composition, which nothing in the archive suggests. **No change warranted.**

### Component file structure

Their conventions across 317 files: `constants.ts` in 4, `types.ts`/`type.ts` in 17,
`variants/` in 7, `components/` in 8 — all minority patterns applied where a component earned
them, not blanket structure. Mozaic matches that shape (`constants.ts` ×2, `types.ts` ×1,
`components/` ×2), using `<Name>.variants.ts` where they use `variants/`. **Creating these
files for the remaining components would be structure for its own sake.** The only unhoisted
strings are four prop defaults — `loadingLabel`, `removeLabel` and a placeholder — each
already declared once and already overridable.
