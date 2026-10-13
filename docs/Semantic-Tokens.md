# Semantic tokens

Semantic tokens give primitives meaning. This document explains the relationship between the two layers, and documents each semantic collection.

For the primitives themselves see [Foundations.md](Foundations.md). For how generators work see [Token-Generation.md](Token-Generation.md).

---

## Contents

- [The two layers](#the-two-layers)
- [Why aliases, not copies](#why-aliases-not-copies)
- [Namespacing and Tailwind](#namespacing-and-tailwind)
- [The semantic qualifier](#the-semantic-qualifier)
- [The emission algorithm](#the-emission-algorithm)
- [Validation](#validation)
- [Collections](#collections)
  - [Colors](#colors)
  - [Spacing](#spacing)
  - [Container](#container)

---

## The two layers

A **primitive** is a raw value with no meaning attached. `spacing.4` is `1rem`. It is not "the padding of a container" — it is simply the fourth step of the spacing scale. Primitives answer _what values exist_.

A **semantic token** attaches meaning by pointing at a primitive. `container-padding-mobile` means "the horizontal padding a container uses on mobile", and it _happens_ to resolve to `spacing.4`. Semantic tokens answer _which value to use where_.

```
Figma _Primitives collection          Figma semantic collection
┌──────────────────────────┐          ┌────────────────────────────────┐
│ Spacing/4 (16px)         │◀─────────│ container-padding-mobile       │
│ Spacing/8 (32px)         │◀─────────│ container-padding-desktop      │
│ Spacing/320 (1,280px)    │◀─────────│ container-max-width-desktop    │
└──────────────────────────┘  aliases └────────────────────────────────┘
            │                                        │
            ▼                                        ▼
   --spacing-4: 1rem              --spacing-container-padding-mobile: var(--spacing-4)
   src/foundations/spacing/       src/semantic/container/
```

The layers live in separate trees, which is the structural expression of that distinction:

|                   | Primitives                  | Semantic                      |
| ----------------- | --------------------------- | ----------------------------- |
| Figma export      | `figma/exports/primitives/` | `figma/exports/semantic/`     |
| Generated CSS     | `src/foundations/<name>/`   | `src/semantic/<name>/`        |
| Generated TS      | `src/tokens/<name>/`        | `src/tokens/semantic/<name>/` |
| Storybook section | **Foundations**             | **Semantic**                  |
| Owns a value?     | Yes                         | **No** — it aliases one       |

**Components should consume semantic tokens, not primitives.** Reaching past the semantic layer into `spacing.4` discards the meaning and re-introduces exactly the drift the system exists to prevent. Primitives exist to build the semantic layer and to document the palette.

---

## Why aliases, not copies

A semantic token could be generated two ways. Mozaic uses the first:

```css
/* As generated — the alias is preserved */
--spacing-container-padding-mobile: var(--spacing-4);

/* Rejected — the value is copied */
--spacing-container-padding-mobile: 1rem;
```

Both render identically today. They differ the moment a primitive changes: with a `var()` reference the change propagates automatically, and with a copied literal it silently does not, leaving the two layers to drift apart with nothing to catch it.

This was verified rather than assumed. Overriding **only** `--spacing-4` at runtime moved an element styled with the semantic token from `16px` to `80px`, confirming the reference is live:

|                                             | Padding computed |
| ------------------------------------------- | ---------------- |
| Baseline                                    | `16px`           |
| After changing only `--spacing-4` to `5rem` | `80px`           |
| After restoring                             | `16px`           |

The TypeScript layer exposes both forms, because JavaScript cannot resolve a `var()`:

```ts
container['padding-mobile']; // 'var(--spacing-4)'  — for CSS contexts
containerResolved['padding-mobile']; // '1rem'      — for code needing a concrete value
```

`containerResolved` is a convenience, not a second source of truth: a fidelity test asserts it always equals what the primitive layer actually ships.

---

## Namespacing and Tailwind

Semantic tokens are **not** emitted under a prefix matching their collection name. They are emitted into the Tailwind v4 namespace that governs the CSS property they represent.

This is not a stylistic choice. Tailwind v4 reserves `--container-*` for `max-w-*` utilities — it ships 13 built-in values there. Emitting every container token under that prefix produces garbage, which was confirmed by compiling Tailwind against a test theme:

```css
/* What a naive --container-* emission generates */
.max-w-padding-mobile {
  max-width: var(--container-padding-mobile);
}
```

A `max-w-padding-mobile` utility is meaningless, and it pollutes Tailwind's container scale. Worse, `p-container-padding-mobile` generated **no rule at all**, because padding does not read that namespace — so the naive approach yields one nonsense utility per token and zero useful ones.

Mapping each token to its correct namespace instead yields real utilities:

| Semantic token      | CSS variable                          | Namespace       | Utilities gained                      |
| ------------------- | ------------------------------------- | --------------- | ------------------------------------- |
| `padding-mobile`    | `--spacing-container-padding-mobile`  | `--spacing-*`   | `p-*`, `px-*`, `py-*`, `m-*`, `gap-*` |
| `padding-desktop`   | `--spacing-container-padding-desktop` | `--spacing-*`   | as above                              |
| `max-width-desktop` | `--container-desktop`                 | `--container-*` | `max-w-desktop`                       |

Two consequences worth knowing:

- **The `container-` qualifier is kept** in the padding variables, unlike the `radius-` prefix which was stripped from radius keys. It has to be: those variables now live in `--spacing-*` alongside 32 primitive spacing tokens, and `--spacing-padding-mobile` would be ambiguous about _what_ it pads.
- **The max-width token drops its property name.** `--container-*` already means max-width in Tailwind, so `--container-max-width-desktop` would stutter into `max-w-max-width-desktop`. `--container-desktop` yields the clean `max-w-desktop`.

Because that mapping encodes a design decision that cannot be derived from a Figma name, it is declared explicitly in the generator's `NAMESPACE` table. A token absent from the table **fails the build** rather than being guessed into a namespace.

---

## The semantic qualifier

**Every semantic token is emitted as `--<tailwind-namespace>-semantic-<token>`.** One rule, all collections, no per-collection collision audit.

```
--spacing-semantic-md              semantic spacing
--spacing-semantic-container-padding-mobile   semantic container padding
--container-semantic-desktop       semantic container max-width
```

Built by `css.semantic_name()` in `scripts/common/css.py`, so a new collection inherits the convention rather than reinventing it.

### Why a qualifier is required, not stylistic

Tailwind namespaces are not one-to-one with utility families. **`--spacing-*` and `--container-*` both feed `w-*`, `min-w-*`, `max-w-*` and `basis-*`, and spacing wins.** Eleven of Tailwind's built-in container sizes are t-shirt names (`xs` through `7xl`), so emitting a semantic token as a bare `--spacing-md` silently redefines four utilities per name — **44 in total**:

| Utility    | Tailwind default | With a bare `--spacing-md` |
| ---------- | ---------------- | -------------------------- |
| `max-w-md` | `28rem`          | **8px**                    |
| `w-md`     | `28rem`          | **8px**                    |
| `min-w-md` | `28rem`          | **8px**                    |
| `basis-md` | `28rem`          | **8px**                    |

This is not theoretical. Semantic spacing shipped this way initially and broke the paragraph layout on all six Storybook docs pages — `max-w-3xl` silently became 24px. Nothing in the type system, lint, or the test suite caught it; only the rendered page did.

The qualifier makes the collision **structurally impossible**: Tailwind has no value named `semantic-md`, so there is nothing to shadow. Verified by feeding the real generated variable names into a Tailwind compile — all 44 size utilities resolve to `--container-*` exactly as they do with no custom theme at all, while `gap-semantic-md` and friends are still generated.

### Where it does and does not apply

The overload is specific to the spacing/container pair. Other namespaces are single-source, so a semantic token there overrides a _value_ rather than hijacking a different namespace — which is the intended theming mechanism:

| Namespace                            | Feeds                                                    | Risk                                                             |
| ------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------- |
| `--spacing-*`                        | padding, margin, gap **and** `w`/`min-w`/`max-w`/`basis` | **Overloaded** — qualifier essential                             |
| `--container-*`                      | `w`/`min-w`/`max-w`/`basis`                              | **Overloaded** — qualifier essential                             |
| `--radius-*`                         | `rounded-*` only                                         | Safe; `rounded-md` already reads `--radius-md` in stock Tailwind |
| `--color-*`                          | colour utilities only                                    | Safe                                                             |
| `--text-*`, `--shadow-*`, `--font-*` | one family each                                          | Safe                                                             |

The qualifier is applied **uniformly regardless**, so no contributor has to know this table to stay safe. `src/tokens/semantic/spacing/namespace.test.ts` asserts no semantic variable is ever a bare Tailwind name in an overloaded namespace.

### A note on the container collection

The container collection predates this convention and currently emits `--spacing-container-padding-mobile` and `--container-desktop` — qualified by _collection name_ rather than by `semantic`. Neither collides with a Tailwind value, so both are safe today, and they were left unchanged rather than folded into this refactor. Aligning them to `--spacing-semantic-container-*` and `--container-semantic-desktop` would make the convention fully uniform and is worth doing before more collections land.

---

## The emission algorithm

Collections whose tokens alias other tokens cannot be emitted in a single pass: whether a token can be emitted depends on whether its target can be, which depends on _its_ target. The semantic colour generator therefore runs five explicit passes. Every semantic collection that aliases will follow the same shape.

```
Pass 1  classify   every token, in every mode, following nothing
Pass 2  cycles     walk the reference graph; a repeat is a cycle
Pass 3  withhold   propagate failure to a fixpoint
Pass 4  attribute  record why each withheld token was withheld
Pass 5  emit       write only tokens that survived, then assert the invariant
```

### Pass 1 — classify

Each token, in each mode independently, is one of three things. Nothing is followed yet, so this pass cannot loop.

| Outcome | Meaning                                                            |
| ------- | ------------------------------------------------------------------ |
| `value` | Resolves outright — a primitive alias, or a literal Figma exported |
| `ref`   | Depends on another token in this export (a DTCG reference)         |
| `fail`  | Cannot resolve; a diagnostic is recorded with its root cause       |

Modes are classified separately because **54 tokens use a different mechanism in each mode** — a DTCG reference in light and a primitive alias in dark, say. Classifying per token rather than per token-and-mode would get those wrong.

### Pass 2 — cycle detection

Each token has at most one outgoing reference per mode, so per mode the reference graph is _functional_: every node has out-degree ≤ 1. That makes cycle detection a forward walk — follow successors until a node repeats or the chain ends.

This must run **before** the fixpoint. A cycle is not a cascade: no token in it ever fails on its own, so withholding-by-propagation would never touch it, and the generator would happily emit mutually-referencing variables that CSS discards at computed-value time — a colour that silently renders as nothing.

Detected cycles are reported with the **full path**, closing on the token it returns to:

```
cycle (light): text-accent -> bg-accent -> text-accent
cycle (dark):  utility-x -> utility-x
```

Self-references (`s -> s`) are cycles of length one and are caught by the same walk.

### Pass 3 — withhold to a fixpoint

A token referencing another can only be emitted if that target is emitted, so withholding **cascades**. The pass repeats until a round withholds nothing new.

Termination is bounded, not hoped for: each round withholds at least one token and never releases one, so at most _n_ rounds are possible for _n_ tokens. The generator asserts that bound and fails loudly if it is ever exceeded — an infinite loop would be a bug in cycle detection, and it should surface as an error rather than a hang.

### Pass 4 — attribute

Every withheld token records which root causes implicate it and which modes failed. A token can have more than one: 3 are withheld by both a deprecated primitive _and_ a broken chain.

### Pass 5 — emit, then verify

Only surviving tokens are written, then two invariants are asserted:

1. **Every emitted `var(--color-semantic-…)` names a variable that was also emitted.** Exactly the property the fixpoint exists to guarantee, so checking it turns a fixpoint bug into a build failure rather than a colour that renders as nothing.
2. **Every emitted token resolves to exactly one terminal** — a primitive reference or a literal, never another semantic token and never nothing. The generator walks each chain to its end and records the result in `semanticColorsSource[token][mode].terminal`, alongside `hops`. Because out-degree is at most one per mode, a token cannot fan out to two terminals; asserting it anyway means a future change that introduced branching fails here instead of silently picking a winner.

The recorded terminal is useful in its own right — it answers "what colour does this actually end up as" without walking the chain — and it makes the invariant checkable from TypeScript without reimplementing the walk.

`src/tokens/semantic/colors/graph.test.ts` re-checks the same properties against the committed output — acyclicity, single-terminal resolution, chain termination, reference validity, mode parity — so a regression fails CI even if the generator is not re-run. It independently walks each chain and asserts it lands on the same terminal and hop count the generator recorded: two computations agreeing is the actual guarantee.

### Why both modes are required

A token is emitted only when it resolves in **both** modes.

Emitting a light-only token would put it in `@theme` with no `.dark` override, so in dark mode it would silently keep the light colour. That is worse than absence: absence is a compile error the moment someone uses the token, while a wrong colour is a bug someone has to notice. Withholding turns a silent visual defect into a loud missing-property one.

The current export needs no such withholding — all 75 withheld tokens fail in both modes — but the rule is enforced regardless, and `mode-asymmetry` is a declared root cause with its own suggestion so a future one-sided export is diagnosed rather than shipped.

### Worked examples

**Emitted — primitive alias.** `text-primary` aliases a different primitive per mode:

```css
@theme static {
  --color-semantic-text-primary: var(--color-gray-light-900);
}
.dark {
  --color-semantic-text-primary: var(--color-gray-dark-50);
}
```

**Emitted — multi-level chain.** A DTCG reference stays a reference; the chain is never flattened into the primitive at its end:

```css
--color-semantic-text-creative-pink: var(--color-semantic-utility-pink-600);
--color-semantic-utility-pink-600: var(--color-pink-600);
```

Changing `--color-pink-600` moves both. Flattening the first to `var(--color-pink-600)` would render identically today and silently stop tracking `utility-pink-600` tomorrow.

**Withheld — missing primitive.** `utility-indigo-500` aliases `Colors/Indigo ✅/500`, absent from the primitives export. Root cause `missing-primitive`; fixed by re-exporting primitives.

**Withheld — cascade.** `bg-creative-blue` is itself well-formed: it references `utility-blue-50`. But that target is withheld, so emitting a `var()` at it would dangle. Root cause `upstream-alias-unresolved` — it needs no fix of its own and recovers automatically once the primitive lands.

---

## Validation

Semantic tokens are only as trustworthy as their aliases, so the generator validates the whole chain. Each guard has been exercised against a deliberately corrupted export to confirm it actually fires.

| Guard                  | Raised when                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Missing alias          | A semantic token has no `aliasData` — it would have nothing to be semantic about    |
| Dangling alias         | The target primitive does not exist in the primitives export                        |
| Self-contradiction     | The semantic token's `$value` disagrees with the primitive it claims to alias       |
| Unsupported collection | The alias points at a primitive collection the generator was not written to resolve |
| Unmapped namespace     | A token has no declared Tailwind namespace mapping                                  |
| Duplicate key          | Two tokens normalize to the same key                                                |

The generator therefore reads **two** exports — the semantic collection and the primitives it aliases — which is inherent to the layer and the reason a semantic generator cannot be a copy of a primitive one.

The fidelity suite goes further than the primitive equivalents, asserting the full chain: every token aliases a real primitive, the export does not contradict itself, the emitted CSS is a `var()` reference and never a literal, and the resolved value equals what the spacing foundation already ships.

---

## Collections

### Colors

The semantic colour layer over the primitive colour foundation, in **light and dark modes**.

|                 |                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------- |
| Source          | `figma/exports/semantic/colors-light.json`, `colors-dark.json`                               |
| Aliases         | `figma/exports/primitives/colors.json` → `Colors`, and other tokens in the same export       |
| Generator       | `scripts/generate-semantic-color-tokens.py` — run with `pnpm generate:semantic-color-tokens` |
| Generated files | `src/semantic/colors/colors.css`, `src/tokens/semantic/colors/index.ts`                      |
| Diagnostics     | `diagnostics/semantic-colors.json`                                                           |
| Storybook       | **Semantic → Colors → Tokens** (with a light/dark toggle)                                    |

Figma exports **395 token paths per mode**, identical in both, and 350 of them differ between modes. **320 are emitted**; 75 are withheld — see [unresolved aliases](#unresolved-aliases-and-diagnostics).

#### Why `--color-semantic-*` and not `--color-*`

Primitive colours own `--color-*`: `--color-brand-500`, `--color-gray-light-900`. Semantic colours are qualified `--color-semantic-*` for the same reason every other semantic collection is qualified — but here the argument is sharper, because both layers describe the _same_ CSS property:

- **They cannot collide.** A semantic token can never overwrite a primitive, or vice versa, regardless of what Figma names next.
- **The layer is legible in the value.** `var(--color-semantic-bg-primary)` says "the semantic background"; `var(--color-brand-500)` says "reach past the semantic layer into the raw palette" — a thing to notice in review.
- **Both still produce Tailwind utilities.** `--color-*` is single-source, feeding only colour utilities, so the qualifier costs nothing: `bg-semantic-bg-primary`, `text-semantic-text-primary`, `border-*`, `ring-*`, `fill-*`, `shadow-*` all generate. Verified by compiling Tailwind against the theme — **zero** utilities shadowed.

That last point is what separates colours from spacing. `--spacing-*` is overloaded with `--container-*`, so the qualifier there _prevents a bug_; here it is purely about layer clarity.

#### Two alias mechanisms

This is the first export to use more than one, and **54 tokens switch mechanism between modes**:

| Mechanism       | Figma shape                                          | Emitted as                               |
| --------------- | ---------------------------------------------------- | ---------------------------------------- |
| Primitive alias | `com.figma.aliasData` → `_Primitives`                | `var(--color-gray-light-900)`            |
| Semantic alias  | a DTCG reference to another token in the same export | `var(--color-semantic-utility-pink-600)` |
| Literal         | a colour object with no alias                        | `#252d38` or `rgb(23 27 34 / 0.05)`      |

Both alias kinds are preserved as `var()` references, so the chain semantic → semantic → primitive stays intact and a primitive change propagates the whole way. Figma ships a resolved value alongside `aliasData`; it is deliberately **ignored** in favour of the reference.

A literal is emitted **only** where Figma exported a literal. An alias is never degraded to one.

#### Naming

Names are derived mechanically from the leaf token name, which is globally unique across all 395 — verified, not assumed. Group names are redundant with it, so they are dropped:

| Figma path                                 | Token            | CSS variable                      |
| ------------------------------------------ | ---------------- | --------------------------------- |
| `Colors.Text ✅.text-primary (900)`        | `text-primary`   | `--color-semantic-text-primary`   |
| `Colors.Background ✅.bg-primary`          | `bg-primary`     | `--color-semantic-bg-primary`     |
| `Component colors.Alpha 📌.alpha-white-10` | `alpha-white-10` | `--color-semantic-alpha-white-10` |

Normalization strips Figma's status emoji (`✅` approved, `❌` deprecated, `📌` pinned, `⚠️` caution — 430 occurrences) and any parenthesised step, then lowercases and hyphenates. Nothing is invented.

#### Theme generation

There was no colour-mode architecture before this collection; it establishes one.

```css
@theme static {
  --color-semantic-text-primary: var(--color-gray-light-900); /* light */
}

.dark {
  --color-semantic-text-primary: var(--color-gray-dark-50); /* dark override */
}
```

Light lives in `@theme` because that is what Tailwind reads to decide which utilities exist — declaring both modes there would generate two sets. Dark re-declares the same custom properties inside `.dark`, overriding them at runtime with no extra utilities.

`src/index.css` repoints Tailwind's `dark:` variant at the same selector:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

**Class-based, not `prefers-color-scheme`**, so a consuming app can offer an explicit toggle and can theme a subtree independently. Verified in the browser: toggling `.dark` moves `text-primary` from `#252d38` to `#efefef` and `bg-primary` from `#ffffff` to `#1b1b1b`, resolving through the full alias chain.

#### Unresolved aliases and diagnostics

146 aliases across **75 tokens** reference primitive groups the primitives export does not contain. Those tokens are **withheld**, because the alternatives are worse: Figma's resolved value would silently duplicate a primitive and stop propagating, and a dangling `var()` would render as nothing.

Withholding **cascades**: a token whose DTCG reference points at a withheld token is itself withheld, computed to a fixpoint. Without that, a `var()` would point at a variable never declared.

A token is emitted only when it resolves in **both** modes — a light-only token would leave dark mode silently inheriting the light colour.

The generator does not abort on the first failure. It emits every valid token and writes `diagnostics/semantic-colors.json`, **grouped by root cause** — a flat list of 146 aliases is data, not information, because a handful of Figma problems produces all of them. Each group carries the action that fixes the whole group:

| Root cause                  | Tokens | Fix                                                               |
| --------------------------- | ------ | ----------------------------------------------------------------- |
| `deprecated-primitive`      | 62     | Repoint at the approved equivalent in Figma, or restore the group |
| `missing-primitive`         | 9      | Re-export primitives including the approved groups                |
| `upstream-alias-unresolved` | 4      | Nothing — recovers once the causes above are fixed                |

`circular-alias`, `dtcg-reference-not-found`, `unsupported-alias-shape` and `mode-asymmetry` are declared too, and report zero today.

The report also carries `withheldTokens` (every token with its root causes and failed modes), `cycles`, and the flat `unresolvedAliases` list for completeness. Two group fields remain for the primitive question specifically:

| Field                       | Meaning                                                                                                         | Fix                                                                                 |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `missingPrimitiveGroups`    | **Green, Indigo** — approved (`✅`) in Figma but absent from the primitives export                              | Re-export primitives including them                                                 |
| `deprecatedPrimitiveGroups` | **blue, blue dark, grayblue, green, orange, orange-dark, red, yellow** — marked `❌` in Figma, still referenced | A design decision: repoint those tokens at approved families, or restore the groups |

Raw Figma casing is preserved in the report so `Green ✅` and `green❌` stay distinguishable — different groups that normalize to the same name.

#### Two suites, two owners

Generator correctness and design-data completeness are verified separately, because they fail for different reasons and different people fix them:

| Command              | Question                     | Owner       | State today                  |
| -------------------- | ---------------------------- | ----------- | ---------------------------- |
| `pnpm test`          | Is the generator correct?    | Engineering | **Green**                    |
| `pnpm verify:tokens` | Is the design data complete? | Design      | **Red** — 75 tokens withheld |

CI runs both as separate jobs (`build` and `verify-tokens`), so a data problem never looks like a code regression.

They were originally one suite, which left `pnpm test` permanently red. That is corrosive: a suite that is always failing trains people to ignore it, and a real generator regression would have hidden behind the expected failure. Splitting them keeps the implementation verifiably green while still blocking incomplete design data from shipping.

Design-data assertions live in `*.verify.test.ts`, which the default run excludes and `vitest.verify.config.ts` includes. `pnpm verify:tokens` goes green with no code change once Figma is corrected.

#### Usage

```html
<div class="bg-semantic-bg-primary text-semantic-text-primary">…</div>
```

```ts
import { semanticColors, semanticColorsResolved, semanticColorsSource } from '@medibuddy/mozaic-ui';

semanticColors['text-primary']; // 'var(--color-gray-light-900)'  — light
semanticColorsResolved.dark['text-primary']; // 'var(--color-gray-dark-50)'
semanticColorsSource['text-primary'].light.kind; // 'primitive-alias'
```

Types: `SemanticColorToken`, `ColorMode`.

### Spacing

A t-shirt scale over the primitive spacing foundation. **17 tokens**, all aliasing spacing primitives.

|                 |                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Source          | `figma/exports/semantic/spacing.json` (Figma mode `Mode 1`)                                      |
| Aliases         | `figma/exports/primitives/colors.json` → `Spacing`                                               |
| Generator       | `scripts/generate-semantic-spacing-tokens.py` — run with `pnpm generate:semantic-spacing-tokens` |
| Generated files | `src/semantic/spacing/spacing.css`, `src/tokens/semantic/spacing/index.ts`                       |
| Storybook       | **Semantic → Spacing → Scale**                                                                   |

Variables are emitted as `--spacing-semantic-<key>` through the shared [`css.semantic_name()`](#the-semantic-qualifier) convention, so they cannot collide with a primitive step or with Tailwind's own values. They remain inside the spacing namespace, so they still yield ordinary utilities: `gap-semantic-md`, `p-semantic-xl`, `mt-semantic-xs`.

TypeScript exports are prefixed `semanticSpacing*` because the primitive foundation already exports `spacing`, `spacingSource` and `spacingVar`.

| Token  | Aliases                     | Resolves to      | CSS variable              |
| ------ | --------------------------- | ---------------- | ------------------------- |
| `none` | `spacing.0` (`0 (0px)`)     | `0rem` / 0px     | `--spacing-semantic-none` |
| `xxs`  | `spacing.0-5` (`0․5 (2px)`) | `0.125rem` / 2px | `--spacing-semantic-xxs`  |
| `xs`   | `spacing.1` (`1 (4px)`)     | `0.25rem` / 4px  | `--spacing-semantic-xs`   |
| `sm`   | `spacing.1-5` (`1․5 (6px)`) | `0.375rem` / 6px | `--spacing-semantic-sm`   |
| `md`   | `spacing.2` (`2 (8px)`)     | `0.5rem` / 8px   | `--spacing-semantic-md`   |
| `lg`   | `spacing.3` (`3 (12px)`)    | `0.75rem` / 12px | `--spacing-semantic-lg`   |
| `xl`   | `spacing.4` (`4 (16px)`)    | `1rem` / 16px    | `--spacing-semantic-xl`   |
| `2xl`  | `spacing.5` (`5 (20px)`)    | `1.25rem` / 20px | `--spacing-semantic-2xl`  |
| `3xl`  | `spacing.6` (`6 (24px)`)    | `1.5rem` / 24px  | `--spacing-semantic-3xl`  |
| `4xl`  | `spacing.8` (`8 (32px)`)    | `2rem` / 32px    | `--spacing-semantic-4xl`  |
| `5xl`  | `spacing.10` (`10 (40px)`)  | `2.5rem` / 40px  | `--spacing-semantic-5xl`  |
| `6xl`  | `spacing.12` (`12 (48px)`)  | `3rem` / 48px    | `--spacing-semantic-6xl`  |
| `7xl`  | `spacing.16` (`16 (64px)`)  | `4rem` / 64px    | `--spacing-semantic-7xl`  |
| `8xl`  | `spacing.20` (`20 (80px)`)  | `5rem` / 80px    | `--spacing-semantic-8xl`  |
| `9xl`  | `spacing.24` (`24 (96px)`)  | `6rem` / 96px    | `--spacing-semantic-9xl`  |
| `10xl` | `spacing.32` (`32 (128px)`) | `8rem` / 128px   | `--spacing-semantic-10xl` |
| `11xl` | `spacing.40` (`40 (160px)`) | `10rem` / 160px  | `--spacing-semantic-11xl` |

#### Usage

```html
<div class="gap-md p-xl flex flex-col">…</div>
```

```css
.stack {
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
}
```

```ts
import {
  semanticSpacing,
  semanticSpacingResolved,
  semanticSpacingScale,
} from '@medibuddy/mozaic-ui';

semanticSpacing.md; // 'var(--spacing-2)'
semanticSpacingResolved.md; // '0.5rem'
semanticSpacingScale; // ordered keys — iterate this, not Object.keys
```

Type: `SemanticSpacingToken`.

#### Independent scales: the same name can mean different things

Semantic spacing and the radius foundation are **separate scales that share t-shirt names**. Ten names appear in both, and five hold different values:

| Name  | `gap-*` / `p-*` | `rounded-*` |
| ----- | --------------- | ----------- |
| `lg`  | 12px            | 10px        |
| `xl`  | 16px            | 12px        |
| `2xl` | 20px            | 16px        |
| `3xl` | 24px            | 20px        |
| `4xl` | 32px            | 24px        |

Nothing breaks — they live in different CSS namespaces — but `gap-semantic-lg` and `rounded-lg` are **not** the same size. This is intentional: each family's scale comes from Figma independently, and neither was adjusted to match the other. A test asserts the divergence so it cannot change silently.

### Container

Layout container padding and max width. **3 tokens**, all aliasing spacing primitives.

|                 |                                                                                    |
| --------------- | ---------------------------------------------------------------------------------- |
| Source          | `figma/exports/semantic/container.json` (Figma mode `Value`)                       |
| Aliases         | `figma/exports/primitives/colors.json` → `Spacing`                                 |
| Generator       | `scripts/generate-container-tokens.py` — run with `pnpm generate:container-tokens` |
| Generated files | `src/semantic/container/container.css`, `src/tokens/semantic/container/index.ts`   |
| Storybook       | **Semantic → Container → Tokens**                                                  |

| Token               | Aliases                                 | Resolves to      | CSS variable                          |
| ------------------- | --------------------------------------- | ---------------- | ------------------------------------- |
| `padding-mobile`    | `spacing.4` (`Spacing/4 (16px)`)        | `1rem` / 16px    | `--spacing-container-padding-mobile`  |
| `padding-desktop`   | `spacing.8` (`Spacing/8 (32px)`)        | `2rem` / 32px    | `--spacing-container-padding-desktop` |
| `max-width-desktop` | `spacing.320` (`Spacing/320 (1,280px)`) | `80rem` / 1280px | `--container-desktop`                 |

#### Usage

```html
<div class="px-container-padding-mobile md:px-container-padding-desktop max-w-desktop mx-auto">
  …
</div>
```

```css
.container {
  padding-inline: var(--spacing-container-padding-mobile);
  max-width: var(--container-desktop);
}
```

```ts
import { container, containerResolved, containerVar } from '@medibuddy/mozaic-ui';

container['padding-mobile']; // 'var(--spacing-4)'
containerResolved['padding-mobile']; // '1rem'
containerVar('max-width-desktop'); // '--container-desktop'
```

Type: `ContainerToken`.

#### Notes for design review

| Observation                            | Detail                                                                                                                                                                                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Asymmetric coverage                    | Padding is defined for both breakpoints, but max-width only for desktop — mobile containers are fluid full-width. Preserved as exported; no token was invented. A test pins this so a future `container-max-width-mobile` is noticed rather than absorbed silently |
| Max width comes from the spacing scale | `container-max-width-desktop` aliases `Spacing/320`, not a sizing or width primitive. Defensible — 1280px is a real spacing step — but worth confirming, especially once the Sizing foundation exists                                                              |
| Values agree with primitives           | All three `$value`s match their aliased primitives exactly (16, 32, 1280), so the export is internally consistent and no alias is stale                                                                                                                            |
