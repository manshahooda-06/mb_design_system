# Figma exports

Raw variable exports from the Figma Design System. **This is the source of truth for every design token in Mozaic.**

Do not edit these files by hand. To change a value, change it in Figma and re-export.

## Layout

```
figma/exports/
  primitives/     Raw primitive scales, one file per foundation
  semantic/       Semantic token collections — alias primitives rather than holding values
```

## Exports

| Export                                                                     | Generator                                     | Generates                                                                        |
| -------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| `exports/primitives/colors.json` → `Colors`                                | `scripts/generate-color-tokens.py`            | `src/foundations/colors/colors.css`, `src/tokens/colors/index.ts`                |
| `exports/primitives/typography.json` → `Group`, `Font Family`              | `scripts/generate-typography-tokens.py`       | `src/foundations/typography/typography.css`, `src/tokens/typography/index.ts`    |
| `exports/primitives/colors.json` → `Spacing`                               | `scripts/generate-spacing-tokens.py`          | `src/foundations/spacing/spacing.css`, `src/tokens/spacing/index.ts`             |
| `exports/primitives/radius.json` (flat, no collection)                     | `scripts/generate-radius-tokens.py`           | `src/foundations/radius/radius.css`, `src/tokens/radius/index.ts`                |
| `exports/primitives/elevation.json` (flat, **transcribed** — see below)    | `scripts/generate-elevation-tokens.py`        | `src/foundations/elevation/elevation.css`, `src/tokens/elevation/index.ts`       |
| `exports/semantic/container.json` (aliases `Spacing`)                      | `scripts/generate-container-tokens.py`        | `src/semantic/container/container.css`, `src/tokens/semantic/container/index.ts` |
| `exports/semantic/spacing.json` (aliases `Spacing`)                        | `scripts/generate-semantic-spacing-tokens.py` | `src/semantic/spacing/spacing.css`, `src/tokens/semantic/spacing/index.ts`       |
| `exports/semantic/colors-light.json` + `colors-dark.json` (alias `Colors`) | `scripts/generate-semantic-color-tokens.py`   | `src/semantic/colors/colors.css`, `src/tokens/semantic/colors/index.ts`          |

Regenerate with `pnpm generate:elevation-tokens`, `pnpm generate:color-tokens`, `pnpm generate:typography-tokens`, `pnpm generate:spacing-tokens`, `pnpm generate:radius-tokens` `pnpm generate:container-tokens` `pnpm generate:semantic-spacing-tokens` or `pnpm generate:semantic-color-tokens`.

Semantic generators read **two** exports — their own collection plus the primitives it aliases — and fail if an alias does not resolve. See [docs/Semantic-Tokens.md](../docs/Semantic-Tokens.md).

## Guard

`src/tokens/colors/colors.source.test.ts`, `src/tokens/typography/typography.source.test.ts`, `src/tokens/spacing/spacing.source.test.ts` and `src/tokens/radius/radius.source.test.ts` read this directory directly and fail if the generated files drift from the export — so hand-editing a generated token breaks the build.

## Note on scope

`exports/primitives/colors.json` is a full Figma variable export, not a colors-only one. It contains three collections:

| Collection    | Status                                                           |
| ------------- | ---------------------------------------------------------------- |
| `Colors`      | Consumed by the colors foundation                                |
| `Spacing`     | Consumed by the spacing foundation                               |
| `Filled Text` | **Ignored** — a single scratch string that maps to no foundation |

The filename is therefore misleading. Renaming it is deferred because the colors and spacing generators and their fidelity tests reference this path.

## One export is transcribed, not exported

`exports/primitives/elevation.json` is the exception to "raw variable exports" above.

Figma **effect styles are not variables**, so the 8 elevation shadows cannot be produced by the variable export every other file here comes from. They were read from Dev Mode (node `4823:505`) and transcribed by hand. The file carries a `$transcription` block recording the node id, the file key, the layer ordering and why.

Consequences worth knowing:

- Re-exporting variables will **not** refresh elevation. Changing an elevation value in Figma means re-transcribing this file.
- `src/tokens/elevation/elevation.source.test.ts` is the only link between the design file and the generated stylesheet, so it checks all 8 tokens layer by layer rather than spot-checking.
- If Figma ever ships effect variables, this file should be replaced by a real export and the `$transcription` block deleted.
