# Token generators

Each foundation has one generator that reads a Figma export from [`figma/`](../figma) and writes two files: a Tailwind `@theme` stylesheet under `src/foundations/`, and a TypeScript token module under `src/tokens/`.

> This is a quick reference kept beside the code. The full architecture — pipeline, module responsibilities, validation rules, testing strategy, regeneration workflow and known pitfalls — lives in **[docs/Token-Generation.md](../docs/Token-Generation.md)**.

```
scripts/
  common/
    __init__.py     What lives where
    parser.py       Loading exports, flattening trees, normalizing names and units
    validation.py   Fail-fast guards
    diagnostics.py  Root-cause grouped diagnostics, for generators that partially succeed
    css.py          `/* */` banners, `@theme static` emission, semantic naming
    typescript.py   Banners, doc comments, `as const` blocks, type aliases
  generate-color-tokens.py
  generate-typography-tokens.py
  generate-spacing-tokens.py
```

## Running them

```bash
pnpm generate:color-tokens
pnpm generate:typography-tokens
pnpm generate:spacing-tokens
```

Each npm script runs the generator and then Prettier over its two outputs — **Prettier is part of the contract, not a cosmetic afterthought.** It strips unnecessary object-key quotes and normalizes hex case, so the committed files differ from the raw Python output. Compare generated files only after running the npm script, never the bare `python3` invocation.

All generators are idempotent: re-running on an unchanged export produces no diff.

## What belongs in `common/`

Only logic that is genuinely identical across foundations. Before the refactor, `leaves()` was duplicated verbatim three times, `rem()` twice, and the banner / `@theme` / `as const` / file-write scaffolding in all three.

What stays in each generator is the part that is genuinely different, and is clearer read in context:

| Foundation | Foundation-specific logic                                                      |
| ---------- | ------------------------------------------------------------------------------ |
| Colors     | Hex vs `rgb(r g b / a)` encoding so alpha is never lost                        |
| Typography | Weight-name → CSS numeric mapping, composite style parsing, ramp deduplication |
| Spacing    | Parsing the pixel value embedded in each name, U+2024 decimal separator        |

`const_object` takes pre-formatted entry lines rather than key/value pairs on purpose. Key quoting differs per foundation — colors leaves numeric ramp steps bare, spacing quotes everything — and forcing one policy would be a leaky abstraction over a real difference.

## Fail-fast, never guess

A generator must never invent a value. `validation.py` aborts the build with a greppable `token generator error:` prefix when an export is missing, malformed, self-contradictory, or contains something the generator was not written to handle.

Guards currently enforced:

| Guard                          | Raised when                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------- |
| Export missing or invalid JSON | The file is absent or unparseable                                            |
| Collection missing             | A generator's collection is not in the export (lists what was found)         |
| Unparseable name               | A spacing name does not match `<step> (<px>px)`                              |
| Label vs value disagreement    | A spacing name says `16px` but `$value` is something else                    |
| Broken step ratio              | Spacing step × 4 ≠ px                                                        |
| Duplicate key                  | Two tokens normalize to the same key                                         |
| Unrecognized weight            | A typography style name ends in a weight not in the scale                    |
| Weight name vs property        | A style's name-derived weight disagrees with its `Weight` property           |
| Conflicting ramp               | Two typography styles claim the same slot with different size or line height |

## Adding a generator

1. Put the export in `figma/exports/primitives/<foundation>.json`.
2. Copy the closest existing generator — spacing is the simplest, typography the most involved.
3. Use `parser.collection()` so a missing collection fails clearly.
4. Reach for `validation.require()` rather than assuming the export is well-formed.
5. Emit via `css.write_stylesheet()` and `ts.write_module()`.
6. Add a `generate:<foundation>-tokens` script that also runs Prettier.
7. Write a `*.source.test.ts` fidelity test that re-derives values from the export.
8. Document it in [`docs/Foundations.md`](../docs/Foundations.md).

## Why there is no `docs.py` or `storybook.py`

Both were considered and deliberately left out, because neither has duplicated logic to extract today:

- **Documentation** is authored per foundation in `docs/Foundations.md`. Only the token reference tables are mechanical, and those are currently written by hand as each foundation lands. A `docs.py` would need generators to emit markdown fragments — a change to generated output, which this refactor explicitly avoided.
- **Storybook pages** are hand-authored `.tsx`, and each is a bespoke visualization: a checkerboard for translucent swatches, live type specimens, proportional spacing bars. A Python module cannot meaningfully share code with React components, and generating `.tsx` from Python would make those pages harder to maintain, not easier.

Both are worth revisiting once a fourth foundation reveals a real, repeated pattern — extracting an abstraction from three examples is sound, inventing one from zero is not.
