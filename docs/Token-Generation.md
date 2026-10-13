# Token generation architecture

How design tokens get from Figma into the published package, and the rules that keep them honest.

This is the reference for anyone changing a generator or adding a foundation. For the token values themselves, see [Foundations.md](Foundations.md). For contribution process, see [Contributing.md](Contributing.md).

---

## Contents

- [1. Pipeline overview](#1-pipeline-overview)
- [2. Generator architecture](#2-generator-architecture)
- [3. Module responsibilities](#3-module-responsibilities)
- [4. Adding a new foundation](#4-adding-a-new-foundation)
- [5. Validation rules](#5-validation-rules)
- [6. File generation flow](#6-file-generation-flow)
- [7. Testing strategy](#7-testing-strategy)
- [8. Regenerating after a Figma export changes](#8-regenerating-after-a-figma-export-changes)
- [9. Common pitfalls](#9-common-pitfalls)
- [10. Guidelines for contributors](#10-guidelines-for-contributors)

---

## 1. Pipeline overview

Figma is the single source of truth. Every token value in this repository is exported from it, and none is authored by hand.

```
┌──────────────────────────────────────────────────────────────┐
│ Figma Design System                                          │
│ Designers author variables. The only place values change.     │
└───────────────────────────┬──────────────────────────────────┘
                            │  manual export (see §8)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ figma/exports/primitives/*.json          COMMITTED           │
│ Raw exports. Never hand-edited or reformatted —              │
│ Prettier excludes figma/exports/** so bytes stay             │
│ exactly as Figma produced them.                              │
└───────────────────────────┬──────────────────────────────────┘
                            │  pnpm generate:<foundation>-tokens
                            ▼
┌──────────────────────────────────────────────────────────────┐
│ scripts/generate-<foundation>-tokens.py                       │
│ Parse → validate → normalize names → convert units → emit     │
│ Built on the shared framework in scripts/common/              │
└─────────────┬────────────────────────────┬───────────────────┘
              ▼                            ▼
┌───────────────────────────┐  ┌───────────────────────────────┐
│ src/foundations/<f>/<f>.css│  │ src/tokens/<f>/index.ts       │
│ Tailwind @theme static     │  │ Typed `as const` exports      │
└─────────────┬─────────────┘  └──────────────┬────────────────┘
              │                                │
              ▼                                ▼
┌───────────────────────────┐  ┌───────────────────────────────┐
│ dist/styles.css            │  │ dist/index.js + .d.ts         │
└───────────────────────────┘  └───────────────────────────────┘
```

Both generated layers are **build artifacts that happen to be committed**. They are committed so consumers and reviewers can read them and so CI needs no Python, but they are owned by the generator. Hand-editing one is a defect: the next regeneration silently overwrites it, and the fidelity tests fail in the meantime.

> **Raw exports are intentionally excluded from Prettier.**
> `.prettierignore` lists `figma/exports/**`, so every file under that path — regardless of name — is skipped by both `pnpm format` and `pnpm format:write`. This preserves the exports exactly as Figma produced them and keeps their byte-for-byte provenance intact, which matters because `*.source.test.ts` fidelity tests read these files directly ([§7](#7-testing-strategy)).
>
> The rule is path-based rather than filename-based on purpose: an earlier version listed the exports' original filenames (`*.tokens.json`), which stopped matching once they were restructured into `figma/exports/primitives/`, and Prettier silently reformatted both files' whitespace until that was caught and fixed. Token values were never affected — the fidelity tests parse JSON structurally, so whitespace is irrelevant to them — but the incident is why the rule now matches on directory rather than name.

### Why two output layers

| Layer                   | Consumed by                                                                  | Why it exists                                              |
| ----------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| CSS (`@theme`)          | Component classes, consumer Tailwind builds                                  | Utilities are tree-shaken and cost nothing at runtime      |
| TypeScript (`as const`) | Code that needs a value in JS — a chart colour, a duration passed to a timer | Serves that case without tempting anyone to hardcode a hex |

The two must always agree. A fidelity test asserts it per foundation ([§7](#7-testing-strategy)).

---

## 2. Generator architecture

One generator per foundation, each a standalone script sharing a framework:

```
scripts/
  common/
    __init__.py     Orientation: what lives where
    parser.py       Loading exports, flattening trees, normalizing names and units
    validation.py   Fail-fast guards
    diagnostics.py  Root-cause grouped diagnostics for generators that can partially succeed
    css.py          Block comments, @theme static emission, semantic naming
    typescript.py   Banners, doc comments, as const blocks, type aliases, safe key quoting
  generate-color-tokens.py
  generate-typography-tokens.py
  generate-spacing-tokens.py
  generate-radius-tokens.py
  generate-container-tokens.py    semantic — reads two exports (see below)
  generate-semantic-spacing-tokens.py
  generate-semantic-color-tokens.py   two modes + diagnostics (see below)
```

Generators are **Python**, deliberately — they are build tooling, not shipped code. Nothing in `dist/` depends on them, they need no dependencies beyond the standard library, and they never run in CI or at install time. The published package is pure TypeScript.

### The dividing line

`common/` holds only logic that is **genuinely identical** across foundations. This was measured, not assumed: before consolidation, `leaves()` was byte-identical in all three generators, `rem()` in two, and the banner / `@theme` / `as const` / file-write scaffolding in all three.

Everything foundation-specific stays in its own generator, where it reads in context:

| Foundation       | Stays local because                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Colors           | Hex vs `rgb(r g b / a)` encoding is a colour concern only                                     |
| Typography       | Weight-name mapping, composite style parsing, ramp deduplication                              |
| Spacing          | Parsing the pixel value embedded in each name, U+2024 decimal separator                       |
| Radius           | Reading a flat export with no collection wrapper; deciding `radius-full` gets no special case |
| Container        | Resolving aliases against the primitives export; the Tailwind namespace mapping table         |
| Semantic colours | Two alias mechanisms, per-mode resolution, and cascading withholding to a fixpoint            |

Resisting premature abstraction is part of the design. `const_object` takes pre-formatted entry lines rather than key/value pairs precisely because key quoting differs per foundation — colors leaves numeric ramp steps bare, spacing quotes everything — and one policy would be a leaky abstraction over a real difference.

**There is intentionally no `docs.py` or `storybook.py`.** Documentation tables are authored per foundation here in `docs/`; Storybook pages are hand-authored `.tsx` with bespoke visualizations (checkerboard swatches, live type specimens, proportional bars). A Python module cannot share code with React components, and generating `.tsx` from Python would make those pages harder to maintain. Revisit if a fourth foundation reveals a real repeated pattern.

---

## 3. Module responsibilities

### `parser.py` — reading and normalizing

| Function                | Purpose                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `load(path)`            | Parse an export; fails clearly if missing or invalid JSON                                                                                        |
| `leaves(node, path=())` | Flatten a token tree to `[(path, node)]`. A node is a leaf when it carries `$value`; **depth is never assumed**, because Figma nests arbitrarily |
| `collection(raw, name)` | Flatten one named collection, failing (and listing what was found) if absent                                                                     |
| `rem(px, root=16)`      | `px` → rem string, trailing zeros stripped: `14 → '0.875rem'`, `0 → '0rem'`                                                                      |
| `kebab(text)`           | `/` and spaces → `-`, lowercased                                                                                                                 |
| `step_sort(name)`       | Sort key putting numeric steps in numeric order ahead of named ones                                                                              |
| `ordered_unique(items)` | Deduplicate preserving first-seen order, so Figma's own ordering survives                                                                        |

`ROOT_FONT_SIZE = 16` is the single place the px→rem ratio is defined.

### `validation.py` — fail-fast guards

Never guess. If an export is malformed, self-contradictory, or contains something a generator was not written to handle, the build stops with a `token generator error:` prefix naming the offending token.

| Function                                          | Purpose                                                                      |
| ------------------------------------------------- | ---------------------------------------------------------------------------- |
| `fail(message)`                                   | Abort with the standard prefix                                               |
| `require(condition, message)`                     | Abort unless the condition holds                                             |
| `require_unique(key, seen, what)`                 | Abort if a key was already emitted; otherwise record it                      |
| `require_int_ratio(label, value, expected, what)` | Abort unless a computed ratio rounds to the expected integer                 |
| `warn(message)`                                   | Non-fatal note to **stderr**, so it is visible but never mistaken for output |

### `css.py` — stylesheet emission

| Function                                   | Purpose                                                                                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `block_comment(*paragraphs)`               | `/* ... */` banner, blank-separated between paragraphs. Also used by `typescript.py` — both languages take the same C-style comment, so the formatter lives once                           |
| `theme_block(sections)`                    | `@theme static { ... }` from `[(label \| None, [declarations])]`; sections blank-separated, labels become `/* label */`                                                                    |
| `declaration(name, value, comment=None)`   | `--name: value;` with an optional trailing comment                                                                                                                                         |
| `semantic_name(namespace, token)`          | `<namespace>-semantic-<token>` — the shared convention that stops a semantic token shadowing Tailwind values in an overloaded namespace ([why](Semantic-Tokens.md#the-semantic-qualifier)) |
| `write_stylesheet(path, banner, sections)` | Banner plus one theme block, trailing newline                                                                                                                                              |

`static` is not optional. Without it Tailwind tree-shakes theme variables its own utilities do not reference — which for a token library drops most of the scale from the published stylesheet. This was a real defect caught during the colors foundation.

### `typescript.py` — module emission

| Function                                     | Purpose                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `banner(*paragraphs)`                        | Alias of `css.block_comment`                                                                                                          |
| `doc(text)`                                  | One-line `/** ... */`                                                                                                                 |
| `doc_block(*paragraphs)`                     | Multi-line JSDoc                                                                                                                      |
| `const_object(name, entries, docs=None)`     | `export const <name> = { ... } as const;` — entries verbatim, caller-indented                                                         |
| `const_array(name, items, docs=None)`        | `export const <name> = [ ... ] as const;`                                                                                             |
| `type_alias(name, rhs, docs=None)`           | `export type <name> = <rhs>;`                                                                                                         |
| `arrow_const(name, params, body, docs=None)` | `export const <name> = (<params>) => <body>;`                                                                                         |
| `quote_key(key)`                             | A safe object key: bare if a valid identifier or canonical number, quoted otherwise (added for radius — see [§9](#9-common-pitfalls)) |
| `write_module(path, banner, blocks)`         | Banner plus blank-line-separated blocks                                                                                               |

---

## 4. Adding a new foundation

Foundations are built **one at a time, in a fixed order**, each reviewed and approved before the next begins:

`colors` → `typography` → `spacing` → `sizing` → `radius` → `border-width` → `opacity` → `elevation` → `motion` → `breakpoints` → `grid` → `z-index`

### Analyse before generating

**Do not write the generator first.** Read the export and report what is in it — structure, duplicates, naming inconsistencies, missing or contradictory data — and get naming decisions approved. Every foundation so far has turned up something requiring a human decision:

| Foundation | Surfaced                                                                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colors     | Three duplicate value pairs; a token whose alpha would be destroyed by hex                                                                            |
| Typography | Four styles with no size or weight; weights exported as strings, invalid in CSS; two properties uniformly zero                                        |
| Spacing    | A Unicode look-alike decimal separator; every variable flagged `hiddenFromPublishing`                                                                 |
| Radius     | No wrapping collection — a flat export unlike the other three; a scale mixing valid-identifier and digit-led keys, needing a new `quote_key()` helper |
| Container  | A hard collision with Tailwind's reserved `--container-*` namespace, which would have produced nonsense `max-w-padding-mobile` utilities              |

If a value is missing or ambiguous in Figma, resolve it **in Figma** with the design owner. Never fill the gap in code.

### Then build

1. Put the export at `figma/exports/primitives/<foundation>.json`. Confirm `.prettierignore` covers it.
2. Copy the closest generator — spacing is simplest, typography most involved.
3. Load with `parser.load()` and `parser.collection()` so a missing collection fails clearly.
4. Validate with `validation.require()` before emitting anything.
5. Normalize **names only**. Values are verbatim unless a transformation is explicitly approved and documented.
6. Emit via `css.write_stylesheet()` and `ts.write_module()`.
7. Add a `generate:<foundation>-tokens` npm script that also runs Prettier ([§6](#6-file-generation-flow)).
8. Confirm `src/foundations/foundations.css` imports the new stylesheet.
9. Re-export the tokens from `src/foundations/<foundation>/index.ts` and `src/index.ts`.
10. Write both test suites ([§7](#7-testing-strategy)).
11. Add a Storybook Foundations page — documentation only, no reusable components.
12. Document the foundation in [Foundations.md](Foundations.md), including every exclusion and its reason.
13. Run the full pipeline, then commit.

### Some generators can partially succeed

Most generators are all-or-nothing. A semantic collection that aliases primitives is not: one alias can be unresolvable while every other token is valid, and aborting on the first failure hides the rest and leaves nothing to review.

Those generators follow **classify → detect cycles → withhold to a fixpoint → attribute → emit**, using `common/diagnostics.py`. The build still fails, but only after producing reviewable output and a complete list of what to fix, grouped by root cause with the action that fixes each group. A token that cannot be resolved is **withheld**, never degraded to a literal.

Termination is asserted rather than assumed: the fixpoint is bounded by the token count, and exceeding it fails the build as a generator bug. The emission pass then asserts two invariants — every emitted reference names an emitted variable, and every emitted token resolves to exactly one terminal primitive or literal.

**Generator correctness and design-data completeness are separate suites.** `pnpm test` verifies the generator and must always be green; `pnpm verify:tokens` verifies the token set is complete and is red while Figma has unresolved aliases. CI runs both as separate jobs. A permanently red `pnpm test` would train people to ignore it and hide real regressions behind an expected failure.

See [the emission algorithm](Semantic-Tokens.md#the-emission-algorithm) for the full model.

### Semantic collections differ

A semantic generator is not a primitive generator with a different path. Two structural differences:

- **It reads two exports** — its own collection plus the primitives it aliases — because an alias cannot be validated against nothing.
- **It emits `var()` references, not values.** The alias relationship is the point; copying the literal would let the layers drift.

Semantic collections go under `figma/exports/semantic/`, `src/semantic/<name>/` and `src/tokens/semantic/<name>/`, and appear in Storybook under **Semantic** rather than **Foundations**. See [Semantic-Tokens.md](Semantic-Tokens.md).

### Approved transformations so far

Values are verbatim by default. Only these deviate, each explicitly approved:

| Transformation            | Applies to                  | Rationale                                                                                                                                      |
| ------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| px → rem (÷16)            | Typography, spacing, radius | Type, spacing and radius scale with the reader's browser font-size setting. Applied uniformly, including to sentinel values like `radius-full` |
| Weight name → CSS numeric | Typography                  | `font-weight: Semibold` is not valid CSS                                                                                                       |
| Hex lowercased            | Colors                      | Formatting, not a value change; keeps CSS, TS and Prettier in agreement                                                                        |

Anything not on this list is a value change and needs approval.

---

## 5. Validation rules

Generators are hostile to malformed input by design. It is better to fail a build than to publish a plausible-looking value nobody authored.

### Currently enforced

| Guard                         | Raised when                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Export missing / invalid JSON | File absent or unparseable                                                   |
| Collection missing            | A generator's collection is not in the export — lists what was found         |
| Unparseable name              | A spacing name does not match `<step> (<px>px)`                              |
| Label vs value disagreement   | A spacing name says `16px` but `$value` is something else                    |
| Broken step ratio             | Spacing step × 4 ≠ px                                                        |
| Duplicate key                 | Two tokens normalize to the same key                                         |
| Unrecognized weight           | A typography style name ends in a weight not in the scale                    |
| Weight name vs property       | A style's name-derived weight disagrees with its `Weight` property           |
| Conflicting ramp              | Two typography styles claim the same slot with different size or line height |
| Non-leaf top-level key        | A radius entry lacks `$value` — this export is assumed strictly flat         |
| Missing alias                 | A semantic token has no `aliasData` to reference a primitive                 |
| Dangling alias                | A semantic token aliases a primitive that does not exist                     |
| Alias self-contradiction      | A semantic token's `$value` disagrees with the primitive it aliases          |
| Unsupported alias collection  | A semantic token aliases a collection the generator cannot resolve           |
| Unmapped Tailwind namespace   | A semantic token has no declared namespace mapping                           |
| Unexpected `$type`            | A radius token's `$type` is not `"number"`                                   |
| Missing prefix                | A radius key does not start with `radius-`                                   |

Each guard has been exercised against a deliberately corrupted export to confirm it actually fires. A guard that has never been seen to fail is not known to work.

### What is _not_ a validation failure

| Situation                                    | Handling                                                                                                                                             |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Duplicate **values** under different names   | Preserved as separate tokens and reported. Collapsing them is a design decision — distinct names often mark a semantic distinction not yet split out |
| `hiddenFromPublishing: true`                 | Metadata only. Documented and flagged for design review, but never blocks generation                                                                 |
| Incomplete tokens                            | Excluded from output, documented, and pinned by a test that fails if a future export fills them in                                                   |
| Properties uniformly zero across every token | Omitted, with a test asserting they are still uniformly zero                                                                                         |

The pattern for every exclusion: **omit, document, and add a test that fails when the situation changes.** An exclusion nobody is told about becomes a silent bug.

---

## 6. File generation flow

```
pnpm generate:<foundation>-tokens
        │
        ├─ python3 scripts/generate-<foundation>-tokens.py
        │      load → validate → normalize → convert → write CSS + TS
        │
        └─ prettier --write <the two generated files>
```

**Prettier is part of the generation contract, not a cosmetic afterthought.** It strips unnecessary object-key quotes and normalizes formatting, so the committed files differ from the raw Python output. Two consequences:

- The generator's own output need not be Prettier-perfect; it must be _stable_ after Prettier.
- **Never compare generated files against bare `python3` output.** It will show false mismatches on key quoting. Always compare after the npm script.

### Idempotency

Re-running a generator on an unchanged export must produce **no diff**. This is a hard requirement: it is what makes generated files reviewable, and what lets CI trust that a committed file matches its export.

Verify with:

```bash
pnpm generate:color-tokens && pnpm generate:typography-tokens && pnpm generate:spacing-tokens
git diff --quiet && echo "idempotent" || git diff --stat
```

Idempotency breaks most often from non-deterministic ordering — iterating a Python `set`, or relying on dict ordering that depends on input order. Use `parser.ordered_unique()` and explicit sorts.

---

## 7. Testing strategy

Each foundation has **two** suites, with different jobs. Both live beside the tokens in `src/tokens/<foundation>/`.

### `<foundation>.test.ts` — shape and internal consistency

Does not read the export. Checks token counts, value formats, scale structure, key validity, ordering, and cross-consistency between related exports. Catches a generator that produces well-formed but structurally wrong output.

### `<foundation>.source.test.ts` — fidelity against Figma

**Re-derives every value straight from the export** and asserts the generated files match. This is what makes "Figma is the source of truth" enforceable rather than aspirational.

It deliberately **reimplements** the transformation in TypeScript rather than importing the Python. Two independent implementations agreeing is real evidence; a test that reuses the code under test proves nothing.

Each suite also asserts that the CSS and TypeScript layers agree, and that the theme block is declared `static`.

```
src/tokens/colors/       colors.test.ts (5)      colors.source.test.ts (3)
src/tokens/typography/   typography.test.ts (6)  typography.source.test.ts (7)
src/tokens/spacing/      spacing.test.ts (9)     spacing.source.test.ts (8)
src/tokens/radius/       radius.test.ts (7)      radius.source.test.ts (7)

src/tokens/semantic/container/
                         container.test.ts (8)   container.source.test.ts (9)
```

Because `*.source.test.ts` reads `figma/`, **the exports must stay committed** — CI has no other copy.

### Test-project separation

Tests use Node APIs (`node:fs`) to read exports, so they compile under `tsconfig.test.json` with `types: ["node"]`, separate from `tsconfig.app.json`. This keeps Node types out of the library's own typing, and keeps tests and stories out of the published build.

---

## 8. Regenerating after a Figma export changes

1. **Export from Figma.** Same collection, same shape.
2. **Replace the file** in `figma/exports/primitives/`. Do not edit it by hand.
3. **Run the generator** for that foundation only.
4. **Read the diff.** This is the important step, not a formality.
5. **Run the pipeline:** `pnpm lint && pnpm format && pnpm typecheck && pnpm test && pnpm build`.
6. **Update [Foundations.md](Foundations.md)** if counts, exclusions, or naming changed.
7. **Commit the export and the generated files together**, so the pair is always reviewable as one change.

### Reading the diff

| Diff shows                    | Meaning                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Nothing                       | Export was equivalent. Nothing to commit                                                                                    |
| Values changed                | **A visual change to every consuming product.** A `major` version bump — see [Publishing](../README.md#publishing-strategy) |
| Tokens added                  | `minor`                                                                                                                     |
| Tokens removed or renamed     | **Breaking.** `major`, plus a migration note                                                                                |
| A fidelity test now fails     | The generator needs updating for the new export shape — never "fix" it by editing a generated file                          |
| A pinned-exclusion test fails | Something previously incomplete is now complete. Drop the exclusion and regenerate                                          |

A token value change is breaking **even though types still compile**. It moves pixels in every product that installs the package.

---

## 9. Common pitfalls

Each of these has actually happened in this repository.

| Pitfall                                                         | What went wrong                                                                                                                                                                                                                                                                 | Guard                                                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Comparing against raw Python output**                         | Prettier strips key quotes, so bare `python3` output looks different from the committed file. Led to a false mismatch report                                                                                                                                                    | Always compare after the npm script                                                                             |
| **Tailwind tree-shaking the theme**                             | Without `static`, all 136 colour variables were dropped from the published stylesheet                                                                                                                                                                                           | `@theme static`, asserted by a test                                                                             |
| **Utilities harvested from prose**                              | Tailwind's auto content-detection scanned markdown and test files, publishing `px-2` from a test string and `red-600` from a _sentence_ in a doc                                                                                                                                | `source(none)` plus explicit `@source` in `src/index.css`                                                       |
| **Test files leaking into `dist/`**                             | Declaration output mirrored the source tree, publishing `cn.test.d.ts`                                                                                                                                                                                                          | `exclude` in the dts plugin, asserted at build time                                                             |
| **JS key-order hoisting**                                       | JavaScript hoists integer-like object keys above string keys, so `'0-5'` and `'1-5'` sorted _last_ and broke scale order                                                                                                                                                        | `spacingScale`, an explicit ordered array, plus a test asserting the hazard is real                             |
| **Alpha destroyed by hex**                                      | 8-bit hex rounds `0.98` to `0.98039`. Emitting alpha tokens as hex would corrupt them                                                                                                                                                                                           | Alpha tokens emit as `rgb(r g b / a)`                                                                           |
| **Unicode look-alikes in names**                                | Figma used U+2024 ONE DOT LEADER for a decimal point — visually identical to `.`, silently breaks string matching                                                                                                                                                               | Explicit normalization plus a parse guard                                                                       |
| **Deriving a value from a name only**                           | Typography took weight from the style name and never read the `Weight` property, so a disagreement would pass silently                                                                                                                                                          | Cross-check guard                                                                                               |
| **Markdown tables and exact-match edits**                       | Prettier re-pads table columns, so a string-replace on a table row silently no-ops. Left a stale status in the docs for a full commit                                                                                                                                           | Edit tables by regex, verify after                                                                              |
| **`__pycache__` staged for commit**                             | Python bytecode appeared in `git add -A`                                                                                                                                                                                                                                        | `.gitignore`                                                                                                    |
| **A theme namespace shadowing another**                         | Adding named keys to `--spacing-*` changed what `max-w-3xl` means, from 48rem to 24px, breaking every docs page. Tailwind resolves `max-w-*` against `--spacing-*` before its own `--container-*` scale                                                                         | A test scanning `src/` for shadowed utilities, plus the pinned list in [Semantic-Tokens.md](Semantic-Tokens.md) |
| **Ignore patterns outliving a rename**                          | `.prettierignore` protected `*.tokens.json`; the exports were later renamed to `colors.json` and `typography.json`, so the patterns stopped matching and Prettier reformatted both. Values were unaffected, byte-provenance was not. **Fixed** — see [§1](#1-pipeline-overview) | Path-based rule, `figma/exports/**`, immune to filename changes                                                 |
| **A reference to a withheld token**                             | Semantic colours emitted `var(--color-semantic-utility-orange-50)` for a token that was itself withheld, producing a dangling reference that CSS renders as nothing. Withholding has to cascade to a fixpoint, not one level                                                    | The fixpoint in pass 3, plus an emission-time assertion that every reference names an emitted variable          |
| **A cycle that no cascade can catch**                           | A token in an alias cycle never fails on its own, so propagating failure would never reach it — the generator would emit mutually-referencing variables that CSS discards                                                                                                       | Explicit forward-walk cycle detection in pass 2, before the fixpoint, reporting the full path                   |
| **A key that is neither a valid identifier nor a plain number** | Radius mixes `xxs`/`full` with `2xl`/`3xl`/`4xl`. Emitting the latter as bare object keys produced invalid TypeScript — identifiers cannot start with a digit, and `2xl` is not a pure number either. Caught immediately by `pnpm typecheck`                                    | `typescript.quote_key()`, added to the shared framework and used by the radius generator                        |

---

## 10. Guidelines for contributors

**Figma is the source of truth. No exceptions.** If a value is not in Figma, it is not in Mozaic. Do not eyeball a value from a screenshot, infer one from a sibling token, or "fix" one you believe is wrong — fix it in Figma and re-export.

**Never hand-edit a generated file.** They carry a `GENERATED FROM FIGMA — DO NOT EDIT BY HAND` banner. The next regeneration overwrites your change, and the fidelity tests fail meanwhile. Change the generator or change Figma.

**Never let a formatter touch a raw export.** Raw exports under `figma/exports/**` are intentionally excluded from Prettier — see `.prettierignore` — so they stay byte-for-byte identical to what Figma produced. If you add an export outside that path, extend the ignore rule rather than assuming a new file is covered.

**Fail loudly rather than guessing.** Adding a `validation.require()` is cheap. A generator that quietly emits a plausible wrong value is the worst outcome available, because nothing catches it.

**Report duplicates and oddities; do not resolve them.** Two tokens with the same value may be an accident or a semantic distinction not yet split out. That is a design decision. Surface it and let the design owner decide.

**Normalize names, never values.** Naming is engineering's call — kebab-case, valid CSS identifiers, no Unicode look-alikes. Values are design's call.

**Document every exclusion, and pin it with a test.** Anything omitted needs a row in Foundations.md saying what and why, plus a test that fails if the situation changes. Silent omissions become silent bugs.

**Keep generators idempotent.** No `set` iteration, no ordering that depends on input order.

**Prefer duplication over a premature abstraction.** Two similar-looking blocks in different generators are fine. Extract only when a third case proves the pattern — and only if the shared version does not need a flag to describe which caller it is serving.

**Verify, do not assume.** Every claim in this document was checked against the repository. When you assert that a guard works, corrupt an export and watch it fire. When you assert output is unchanged, compare hashes.

---

## Related

[Foundations.md](Foundations.md) — the token values · [Contributing.md](Contributing.md) — process and review · [scripts/README.md](../scripts/README.md) — quick reference beside the code · [figma/README.md](../figma/README.md) — the exports
