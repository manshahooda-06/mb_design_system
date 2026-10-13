# Foundations

Reference documentation for each design foundation in Mozaic.

See [Contributing → How to add a new foundation](Contributing.md#how-to-add-a-new-foundation) for the process, and [Token-Generation.md](Token-Generation.md) for the generator architecture.

This document covers **primitive** foundations. For the semantic layer that gives them meaning, see [Semantic-Tokens.md](Semantic-Tokens.md).

## Progress

Foundations are built in this order, one at a time, each approved before the next begins.

| #   | Foundation   | Status                                              |
| --- | ------------ | --------------------------------------------------- |
| 1   | Colors       | 🟡 Primitives complete — semantic layer not started |
| 2   | Typography   | 🟢 Complete                                         |
| 3   | Spacing      | 🟢 Complete                                         |
| 4   | Sizing       | ⬜ Not started                                      |
| 5   | Radius       | 🟢 Complete                                         |
| 6   | Border width | ⬜ Not started                                      |
| 7   | Opacity      | ⬜ Not started                                      |
| 8   | Elevation    | 🟢 Complete                                         |
| 9   | Motion       | ⬜ Not started                                      |
| 10  | Breakpoints  | ⬜ Not started                                      |
| 11  | Grid         | ⬜ Not started                                      |
| 12  | Z-index      | ⬜ Not started                                      |

---

# Colors

## Primitive colors

The raw color palette, generated verbatim from the Figma Design System. **136 tokens across 12 groups.**

Primitives are the complete set of colors the system may draw from. They carry no meaning — `error-500` is a red, not "the color of an error message". Assigning meaning is the job of the semantic layer.

> **Do not consume primitives directly in components.** Components reference semantic tokens (`--color-text-danger`), which resolve to primitives. Reaching past the semantic layer into a primitive re-introduces exactly the drift the system exists to prevent. Primitives are for building the semantic layer and for documentation.

### Source and generation

|                 |                                                                             |
| --------------- | --------------------------------------------------------------------------- |
| Source          | Figma Design System export (`Colors` collection)                            |
| Generated files | `src/foundations/colors/colors.css`, `src/tokens/colors/index.ts`           |
| Values          | Verbatim from Figma — never hand-edited                                     |
| Names           | Normalized to kebab-case; see [naming normalization](#naming-normalization) |

To update after a new Figma export, replace the file in `figma/` and run:

```bash
pnpm generate:color-tokens
```

The generator is idempotent — re-running it on an unchanged export produces no diff.

Two test suites guard the output. `colors.test.ts` checks token count, value formats, and ramp shape. `colors.source.test.ts` re-derives every value straight from the Figma export and fails if the generated CSS or TypeScript has drifted from it — so a hand-edit to a generated file breaks the build.

### Scale structure

Eleven groups share an identical **12-step ramp**, light to dark:

`25` · `50` · `100` · `200` · `300` · `400` · `500` · `600` · `700` · `800` · `900` · `950`

The twelfth group, `base`, holds four standalone tokens rather than a ramp.

| Group             | Steps   | Notes                                                                          |
| ----------------- | ------- | ------------------------------------------------------------------------------ |
| `base`            | 4 named | `white`, `black`, `transparent`, `off-white`                                   |
| `gray-light`      | 12      | Neutral ramp for light mode                                                    |
| `gray-dark`       | 12      | Neutral ramp for dark mode — a distinct ramp, not an inversion of `gray-light` |
| `gray-dark-alpha` | 12      | White at descending opacity, for overlays on dark surfaces                     |
| `brand`           | 12      | MediBuddy blue                                                                 |
| `error`           | 12      |                                                                                |
| `warning`         | 12      |                                                                                |
| `success`         | 12      |                                                                                |
| `skin`            | 12      |                                                                                |
| `cyan`            | 12      |                                                                                |
| `purple`          | 12      |                                                                                |
| `pink`            | 12      |                                                                                |

### Why the theme block is `static`

`colors.css` declares `@theme static`. Without `static`, Tailwind tree-shakes theme variables that its own utilities do not reference — which for a token library means the published stylesheet ships almost no tokens. `static` forces all 136 into the output so consumers can rely on them.

### Value formats

Fully opaque tokens are emitted as **hex**, exactly as Figma exports them:

```css
--color-brand-500: #1f7df8;
```

Tokens with an alpha channel are emitted as **`rgb(r g b / a)`**, because hex would either lose the alpha or distort it through 8-bit rounding:

```css
--color-gray-dark-alpha-300: rgb(255 255 255 / 0.8);
```

This applies to the twelve `gray-dark-alpha` tokens and to `base-transparent`.

> `base-transparent` is **white at zero alpha**, not the CSS `transparent` keyword (which is _black_ at zero alpha). The two are indistinguishable when painted flat but differ when interpolated in a gradient. The Figma value is preserved.

### Naming normalization

Values were not touched. Four names were normalized to kebab-case so they are valid CSS identifiers and consistent with the rest of the system.

| Figma                  | Mozaic            | Reason                                            |
| ---------------------- | ----------------- | ------------------------------------------------- |
| `gray-light mode`      | `gray-light`      | Spaces are not valid in CSS custom property names |
| `gray-dark mode`       | `gray-dark`       | As above                                          |
| `gray-dark mode alpha` | `gray-dark-alpha` | As above                                          |
| `off white`            | `off-white`       | As above                                          |

### Known duplicate values

Three pairs of tokens resolve to the same value. They are **preserved as separate tokens** — collapsing them is a design decision, and distinct names often mark a semantic distinction that has not been split out yet. Flagged for design review.

| Value                  | Tokens                                    | Likely reading                                                          |
| ---------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| `#f5f7f8`              | `base-off-white`, `gray-light-25`         | `off-white` looks like an alias of the lightest neutral                 |
| `rgb(255 255 255 / 0)` | `base-transparent`, `gray-dark-alpha-950` | Ramp endpoint coinciding with the standalone token                      |
| `#884100`              | `warning-800`, `skin-700`                 | Two unrelated families colliding — worth confirming this is intentional |

## Browse in Storybook

Every token is rendered as a swatch, grouped by family, at **Foundations → Primitive Colors → Palette**.

```bash
pnpm storybook
```

Each swatch shows the token name, a color preview, and the verbatim value. Translucent tokens are rendered over a checkerboard so their opacity is visible — otherwise the `gray-dark-alpha` ramp and `base-transparent` would appear blank on a white page.

The page is generated from the same `colors` export the package ships, so it cannot drift from the tokens. It lives at `src/foundations/colors/Colors.stories.tsx` and is documentation only — it exports no reusable component and nothing from it is published.

## Usage

### Tailwind utilities

Every token generates the full set of Tailwind color utilities:

```html
<div class="bg-brand-500 text-base-white border-gray-light-200">…</div>
```

### CSS variables

```css
.thing {
  background: var(--color-brand-500);
}
```

### TypeScript

For the rare case where a value is genuinely needed in JavaScript:

```ts
import { colors, colorTokens, colorVar } from '@medibuddy/mozaic-ui';

colors.brand[500]; // '#1F7DF8'  — nested
colorTokens['brand-500']; // '#1F7DF8'  — flat
colorVar('brand-500'); // '--color-brand-500'
```

Types: `ColorGroup`, `ColorToken`, `ColorScaleStep`.

## Token reference

Tailwind utility column shows the suffix — prefix with `bg-`, `text-`, `border-`, `ring-`, `fill-`, etc.

### `base`

| Token              | CSS variable               | Tailwind utility     | Value                  |
| ------------------ | -------------------------- | -------------------- | ---------------------- |
| `base-black`       | `--color-base-black`       | `*-base-black`       | `#000000`              |
| `base-off-white`   | `--color-base-off-white`   | `*-base-off-white`   | `#f5f7f8`              |
| `base-transparent` | `--color-base-transparent` | `*-base-transparent` | `rgb(255 255 255 / 0)` |
| `base-white`       | `--color-base-white`       | `*-base-white`       | `#ffffff`              |

### `gray-light`

| Token            | CSS variable             | Tailwind utility   | Value     |
| ---------------- | ------------------------ | ------------------ | --------- |
| `gray-light-25`  | `--color-gray-light-25`  | `*-gray-light-25`  | `#f5f7f8` |
| `gray-light-50`  | `--color-gray-light-50`  | `*-gray-light-50`  | `#ebeef1` |
| `gray-light-100` | `--color-gray-light-100` | `*-gray-light-100` | `#dbe0e6` |
| `gray-light-200` | `--color-gray-light-200` | `*-gray-light-200` | `#bfc8d2` |
| `gray-light-300` | `--color-gray-light-300` | `*-gray-light-300` | `#a4b0c0` |
| `gray-light-400` | `--color-gray-light-400` | `*-gray-light-400` | `#8a99ad` |
| `gray-light-500` | `--color-gray-light-500` | `*-gray-light-500` | `#70829b` |
| `gray-light-600` | `--color-gray-light-600` | `*-gray-light-600` | `#596c86` |
| `gray-light-700` | `--color-gray-light-700` | `*-gray-light-700` | `#47566a` |
| `gray-light-800` | `--color-gray-light-800` | `*-gray-light-800` | `#364251` |
| `gray-light-900` | `--color-gray-light-900` | `*-gray-light-900` | `#252d38` |
| `gray-light-950` | `--color-gray-light-950` | `*-gray-light-950` | `#171b22` |

### `gray-dark`

| Token           | CSS variable            | Tailwind utility  | Value     |
| --------------- | ----------------------- | ----------------- | --------- |
| `gray-dark-25`  | `--color-gray-dark-25`  | `*-gray-dark-25`  | `#f7f7f7` |
| `gray-dark-50`  | `--color-gray-dark-50`  | `*-gray-dark-50`  | `#efefef` |
| `gray-dark-100` | `--color-gray-dark-100` | `*-gray-dark-100` | `#dfdfdf` |
| `gray-dark-200` | `--color-gray-dark-200` | `*-gray-dark-200` | `#c7c7c7` |
| `gray-dark-300` | `--color-gray-dark-300` | `*-gray-dark-300` | `#afafaf` |
| `gray-dark-400` | `--color-gray-dark-400` | `*-gray-dark-400` | `#989898` |
| `gray-dark-500` | `--color-gray-dark-500` | `*-gray-dark-500` | `#818181` |
| `gray-dark-600` | `--color-gray-dark-600` | `*-gray-dark-600` | `#6b6b6b` |
| `gray-dark-700` | `--color-gray-dark-700` | `*-gray-dark-700` | `#555555` |
| `gray-dark-800` | `--color-gray-dark-800` | `*-gray-dark-800` | `#414141` |
| `gray-dark-900` | `--color-gray-dark-900` | `*-gray-dark-900` | `#2d2d2d` |
| `gray-dark-950` | `--color-gray-dark-950` | `*-gray-dark-950` | `#1b1b1b` |

### `gray-dark-alpha`

| Token                 | CSS variable                  | Tailwind utility        | Value                     |
| --------------------- | ----------------------------- | ----------------------- | ------------------------- |
| `gray-dark-alpha-25`  | `--color-gray-dark-alpha-25`  | `*-gray-dark-alpha-25`  | `rgb(255 255 255 / 0.98)` |
| `gray-dark-alpha-50`  | `--color-gray-dark-alpha-50`  | `*-gray-dark-alpha-50`  | `rgb(255 255 255 / 0.96)` |
| `gray-dark-alpha-100` | `--color-gray-dark-alpha-100` | `*-gray-dark-alpha-100` | `rgb(255 255 255 / 0.94)` |
| `gray-dark-alpha-200` | `--color-gray-dark-alpha-200` | `*-gray-dark-alpha-200` | `rgb(255 255 255 / 0.92)` |
| `gray-dark-alpha-300` | `--color-gray-dark-alpha-300` | `*-gray-dark-alpha-300` | `rgb(255 255 255 / 0.8)`  |
| `gray-dark-alpha-400` | `--color-gray-dark-alpha-400` | `*-gray-dark-alpha-400` | `rgb(255 255 255 / 0.56)` |
| `gray-dark-alpha-500` | `--color-gray-dark-alpha-500` | `*-gray-dark-alpha-500` | `rgb(255 255 255 / 0.5)`  |
| `gray-dark-alpha-600` | `--color-gray-dark-alpha-600` | `*-gray-dark-alpha-600` | `rgb(255 255 255 / 0.35)` |
| `gray-dark-alpha-700` | `--color-gray-dark-alpha-700` | `*-gray-dark-alpha-700` | `rgb(255 255 255 / 0.16)` |
| `gray-dark-alpha-800` | `--color-gray-dark-alpha-800` | `*-gray-dark-alpha-800` | `rgb(255 255 255 / 0.08)` |
| `gray-dark-alpha-900` | `--color-gray-dark-alpha-900` | `*-gray-dark-alpha-900` | `rgb(255 255 255 / 0.04)` |
| `gray-dark-alpha-950` | `--color-gray-dark-alpha-950` | `*-gray-dark-alpha-950` | `rgb(255 255 255 / 0)`    |

### `brand`

| Token       | CSS variable        | Tailwind utility | Value     |
| ----------- | ------------------- | ---------------- | --------- |
| `brand-25`  | `--color-brand-25`  | `*-brand-25`     | `#f1f7ff` |
| `brand-50`  | `--color-brand-50`  | `*-brand-50`     | `#e2f0ff` |
| `brand-100` | `--color-brand-100` | `*-brand-100`    | `#c6e2ff` |
| `brand-200` | `--color-brand-200` | `*-brand-200`    | `#9acbff` |
| `brand-300` | `--color-brand-300` | `*-brand-300`    | `#72b3ff` |
| `brand-400` | `--color-brand-400` | `*-brand-400`    | `#4999ff` |
| `brand-500` | `--color-brand-500` | `*-brand-500`    | `#1f7df8` |
| `brand-600` | `--color-brand-600` | `*-brand-600`    | `#0066dc` |
| `brand-700` | `--color-brand-700` | `*-brand-700`    | `#004fb6` |
| `brand-800` | `--color-brand-800` | `*-brand-800`    | `#003c91` |
| `brand-900` | `--color-brand-900` | `*-brand-900`    | `#00296a` |
| `brand-950` | `--color-brand-950` | `*-brand-950`    | `#001846` |

### `error`

| Token       | CSS variable        | Tailwind utility | Value     |
| ----------- | ------------------- | ---------------- | --------- |
| `error-25`  | `--color-error-25`  | `*-error-25`     | `#fff4f5` |
| `error-50`  | `--color-error-50`  | `*-error-50`     | `#fee9ea` |
| `error-100` | `--color-error-100` | `*-error-100`    | `#fdd6d7` |
| `error-200` | `--color-error-200` | `*-error-200`    | `#fcb5b8` |
| `error-300` | `--color-error-300` | `*-error-300`    | `#fa9195` |
| `error-400` | `--color-error-400` | `*-error-400`    | `#f9696e` |
| `error-500` | `--color-error-500` | `*-error-500`    | `#f62f36` |
| `error-600` | `--color-error-600` | `*-error-600`    | `#d80008` |
| `error-700` | `--color-error-700` | `*-error-700`    | `#ae0006` |
| `error-800` | `--color-error-800` | `*-error-800`    | `#880005` |
| `error-900` | `--color-error-900` | `*-error-900`    | `#620004` |
| `error-950` | `--color-error-950` | `*-error-950`    | `#400002` |

### `warning`

| Token         | CSS variable          | Tailwind utility | Value     |
| ------------- | --------------------- | ---------------- | --------- |
| `warning-25`  | `--color-warning-25`  | `*-warning-25`   | `#fffaf6` |
| `warning-50`  | `--color-warning-50`  | `*-warning-50`   | `#fff5ed` |
| `warning-100` | `--color-warning-100` | `*-warning-100`  | `#feebda` |
| `warning-200` | `--color-warning-200` | `*-warning-200`  | `#fcd9b8` |
| `warning-300` | `--color-warning-300` | `*-warning-300`  | `#faba7e` |
| `warning-400` | `--color-warning-400` | `*-warning-400`  | `#f89840` |
| `warning-500` | `--color-warning-500` | `*-warning-500`  | `#f27400` |
| `warning-600` | `--color-warning-600` | `*-warning-600`  | `#cd6300` |
| `warning-700` | `--color-warning-700` | `*-warning-700`  | `#ab5200` |
| `warning-800` | `--color-warning-800` | `*-warning-800`  | `#884100` |
| `warning-900` | `--color-warning-900` | `*-warning-900`  | `#693200` |
| `warning-950` | `--color-warning-950` | `*-warning-950`  | `#492300` |

### `success`

| Token         | CSS variable          | Tailwind utility | Value     |
| ------------- | --------------------- | ---------------- | --------- |
| `success-25`  | `--color-success-25`  | `*-success-25`   | `#f8fbfa` |
| `success-50`  | `--color-success-50`  | `*-success-50`   | `#f1f8f5` |
| `success-100` | `--color-success-100` | `*-success-100`  | `#e0f8e8` |
| `success-200` | `--color-success-200` | `*-success-200`  | `#cce5d9` |
| `success-300` | `--color-success-300` | `*-success-300`  | `#a3d1bc` |
| `success-400` | `--color-success-400` | `*-success-400`  | `#7abd9d` |
| `success-500` | `--color-success-500` | `*-success-500`  | `#51a87f` |
| `success-600` | `--color-success-600` | `*-success-600`  | `#26935f` |
| `success-700` | `--color-success-700` | `*-success-700`  | `#0f7a48` |
| `success-800` | `--color-success-800` | `*-success-800`  | `#0c6139` |
| `success-900` | `--color-success-900` | `*-success-900`  | `#094b2c` |
| `success-950` | `--color-success-950` | `*-success-950`  | `#07341f` |

### `skin`

| Token      | CSS variable       | Tailwind utility | Value     |
| ---------- | ------------------ | ---------------- | --------- |
| `skin-25`  | `--color-skin-25`  | `*-skin-25`      | `#fff6e7` |
| `skin-50`  | `--color-skin-50`  | `*-skin-50`      | `#fdedc4` |
| `skin-100` | `--color-skin-100` | `*-skin-100`     | `#fedb9e` |
| `skin-200` | `--color-skin-200` | `*-skin-200`     | `#f7bb83` |
| `skin-300` | `--color-skin-300` | `*-skin-300`     | `#e1a264` |
| `skin-400` | `--color-skin-400` | `*-skin-400`     | `#cb8a45` |
| `skin-500` | `--color-skin-500` | `*-skin-500`     | `#b57127` |
| `skin-600` | `--color-skin-600` | `*-skin-600`     | `#a05909` |
| `skin-700` | `--color-skin-700` | `*-skin-700`     | `#884100` |
| `skin-800` | `--color-skin-800` | `*-skin-800`     | `#6f2d00` |
| `skin-900` | `--color-skin-900` | `*-skin-900`     | `#4e1f00` |
| `skin-950` | `--color-skin-950` | `*-skin-950`     | `#301300` |

### `cyan`

| Token      | CSS variable       | Tailwind utility | Value     |
| ---------- | ------------------ | ---------------- | --------- |
| `cyan-25`  | `--color-cyan-25`  | `*-cyan-25`      | `#f4fdfe` |
| `cyan-50`  | `--color-cyan-50`  | `*-cyan-50`      | `#e9fafd` |
| `cyan-100` | `--color-cyan-100` | `*-cyan-100`     | `#d2f5fc` |
| `cyan-200` | `--color-cyan-200` | `*-cyan-200`     | `#a4eaf8` |
| `cyan-300` | `--color-cyan-300` | `*-cyan-300`     | `#53d7f2` |
| `cyan-400` | `--color-cyan-400` | `*-cyan-400`     | `#20bfdf` |
| `cyan-500` | `--color-cyan-500` | `*-cyan-500`     | `#1ca6c1` |
| `cyan-600` | `--color-cyan-600` | `*-cyan-600`     | `#178da4` |
| `cyan-700` | `--color-cyan-700` | `*-cyan-700`     | `#147589` |
| `cyan-800` | `--color-cyan-800` | `*-cyan-800`     | `#105e6d` |
| `cyan-900` | `--color-cyan-900` | `*-cyan-900`     | `#0c4753` |
| `cyan-950` | `--color-cyan-950` | `*-cyan-950`     | `#08313a` |

### `purple`

| Token        | CSS variable         | Tailwind utility | Value     |
| ------------ | -------------------- | ---------------- | --------- |
| `purple-25`  | `--color-purple-25`  | `*-purple-25`    | `#fafaff` |
| `purple-50`  | `--color-purple-50`  | `*-purple-50`    | `#f1edfe` |
| `purple-100` | `--color-purple-100` | `*-purple-100`   | `#e4dafd` |
| `purple-200` | `--color-purple-200` | `*-purple-200`   | `#d0befc` |
| `purple-300` | `--color-purple-300` | `*-purple-300`   | `#baa1fa` |
| `purple-400` | `--color-purple-400` | `*-purple-400`   | `#a584f9` |
| `purple-500` | `--color-purple-500` | `*-purple-500`   | `#8f65f8` |
| `purple-600` | `--color-purple-600` | `*-purple-600`   | `#7750d9` |
| `purple-700` | `--color-purple-700` | `*-purple-700`   | `#5e40ad` |
| `purple-800` | `--color-purple-800` | `*-purple-800`   | `#483185` |
| `purple-900` | `--color-purple-900` | `*-purple-900`   | `#33225c` |
| `purple-950` | `--color-purple-950` | `*-purple-950`   | `#1e1538` |

### `pink`

| Token      | CSS variable       | Tailwind utility | Value     |
| ---------- | ------------------ | ---------------- | --------- |
| `pink-25`  | `--color-pink-25`  | `*-pink-25`      | `#fef6fb` |
| `pink-50`  | `--color-pink-50`  | `*-pink-50`      | `#fde9f7` |
| `pink-100` | `--color-pink-100` | `*-pink-100`     | `#fbd4ef` |
| `pink-200` | `--color-pink-200` | `*-pink-200`     | `#f8b1e3` |
| `pink-300` | `--color-pink-300` | `*-pink-300`     | `#f48cd5` |
| `pink-400` | `--color-pink-400` | `*-pink-400`     | `#f162c6` |
| `pink-500` | `--color-pink-500` | `*-pink-500`     | `#db41ad` |
| `pink-600` | `--color-pink-600` | `*-pink-600`     | `#b63690` |
| `pink-700` | `--color-pink-700` | `*-pink-700`     | `#922b73` |
| `pink-800` | `--color-pink-800` | `*-pink-800`     | `#702159` |
| `pink-900` | `--color-pink-900` | `*-pink-900`     | `#4f173e` |
| `pink-950` | `--color-pink-950` | `*-pink-950`     | `#300e26` |

---

# Typography

Generated verbatim from the Figma Design System. **118 composite text styles** across two breakpoints, composed from **41 size/line-height slots**, **6 weights**, and **2 font families**.

### Source and generation

|                 |                                                                                      |
| --------------- | ------------------------------------------------------------------------------------ |
| Source          | `figma/exports/primitives/typography.json` → `Group` and `Font Family`               |
| Generator       | `scripts/generate-typography-tokens.py` — run with `pnpm generate:typography-tokens` |
| Generated files | `src/foundations/typography/typography.css`, `src/tokens/typography/index.ts`        |

To update after a new Figma export, replace the file in `figma/exports/primitives/` and run:

```bash
pnpm generate:typography-tokens
```

The generator is idempotent. Two test suites guard the output: `typography.test.ts` checks shape and internal consistency, and `typography.source.test.ts` re-derives every value from the export and fails if the generated files have drifted.

### Structure

Figma models typography as composite styles named `<Category>-<scale>-<Weight>`, scoped by breakpoint. Size and line height are provably constant across the weight variants of a given category and scale, so they are emitted **once per slot** rather than repeated for each weight:

```
--text-mobile-body-md: 0.875rem;               /* size slot, shared by 4 weights */
--text-mobile-body-md--line-height: 1.25rem;
--font-weight-regular: 400;                     /* weight scale, shared by all slots */
```

The `--text-*--line-height` suffix is Tailwind v4's pairing convention: a single `text-mobile-body-md` utility sets both properties.

`mobile` and `desktop` are **genuinely distinct ramps** — no shared style has identical values across the two, so desktop is not a scaled copy of mobile.

### Approved transformations

Values are otherwise verbatim. Two conversions were applied, both approved:

**1. px → rem.** Figma authors sizes in px; they are divided by 16 so type respects the reader's browser font-size setting. At the default 16px root these resolve back to the exact Figma pixel values — `0.875rem` computes to `14px`. Every size and line height in the export divides cleanly, with no repeating decimals.

**2. Weight names → CSS numerics.** Figma exports weight as a string, which is not valid CSS. Mapped using the standard OpenType equivalents:

| Figma     | CSS   | Figma       | CSS   |
| --------- | ----- | ----------- | ----- |
| `Light`   | `300` | `Semibold`  | `600` |
| `Regular` | `400` | `Bold`      | `700` |
| `Medium`  | `500` | `Extrabold` | `800` |

### Deliberate exclusions

Three things in the export are **not** generated. Each is guarded by a test that fails if a future export changes the situation.

| Excluded                                            | Why                                                                                                                                                  |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Letter Spacing`                                    | `0` on all 118 styles — the export defines no variation, so the CSS default applies                                                                  |
| `Paragraph spacing`                                 | `0` on all 118 styles, and it has no direct CSS property (it is block margin)                                                                        |
| `Mobile/Caption-lg-{Light,Regular,Medium,Semibold}` | Contain only `Paragraph spacing` — no size, weight, or line height, and no Desktop counterpart. Unusable as exported. **Flagged for design review.** |

### Known issues for design review

| Issue                  | Detail                                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Four empty styles      | The `Mobile/Caption-lg-*` styles above appear to be unfinished in Figma                                                                                 |
| Duplicate families     | `Font Family Body` and `Font Family Display` are both `Lexend Deca`. Preserved as two tokens — the distinction may be intentional for future divergence |
| Missing desktop styles | Mobile defines 8 styles with no desktop equivalent: the four `Caption-lg-*` above and `Body-lg-{Light,Regular,Medium,Semibold}`                         |

### How the family reaches the page

The foundation declares `--font-body: 'Lexend Deca'`, but naming a family does not load one and does not apply it. Two things outside the generated foundation complete the chain, both in `src/index.css`:

```css
@import '@fontsource-variable/lexend-deca'; /* loads it, self-hosted */
@theme {
  --font-sans: 'Lexend Deca Variable', var(--font-body), sans-serif;
}
```

The binding matters because Tailwind's preflight sets `html { font-family: var(--default-font-family) }`, which resolves to `--font-sans`. Leaving that at Tailwind's built-in system stack left `--font-body` declared but orphaned, and every component rendered in a system face.

The order in the stack matters too: the variable webfont is published as **`Lexend Deca Variable`** while Figma names the family **`Lexend Deca`**. Asking only for the Figma name matches a locally _installed_ copy and ignores the one the package ships — correct on a designer's machine, wrong everywhere else.

Components declare no family of their own and inherit it. `font-family.test.ts` guards every link.

> The webfont is inlined as base64 into `dist/styles.css` — Vite's library mode inlines referenced assets regardless of `assetsInlineLimit`. That costs roughly 90KB and removes the benefit of `unicode-range` subsetting for consumers of the built package, though it also removes any font-swap flash. Worth revisiting if the stylesheet size becomes a problem.

## Browse in Storybook

Every style is rendered as a live specimen, grouped by breakpoint and category, at **Foundations → Typography → Scale**.

```bash
pnpm storybook
```

Each row shows the rendered specimen, token name, weight, size/line-height, and CSS variable. The page renders from the package's own exports, so it cannot drift.

## Usage

### Tailwind utilities

```html
<p class="text-mobile-body-md font-regular">…</p>
```

### CSS variables

```css
.thing {
  font-family: var(--font-body);
  font-size: var(--text-desktop-heading-lg);
  line-height: var(--text-desktop-heading-lg--line-height);
  font-weight: var(--font-weight-semibold);
}
```

### TypeScript

```ts
import { fontFamily, fontSize, fontWeight, textStyles } from '@medibuddy/mozaic-ui';

fontFamily.body; // 'Lexend Deca'
fontWeight.semibold; // 600
fontSize['mobile-body-md']; // { size: '0.875rem', lineHeight: '1.25rem' }
textStyles['mobile-body-md-regular']; // { fontSize, lineHeight, fontWeight }
```

Types: `FontFamily`, `FontWeight`, `FontSizeToken`, `TextStyleToken`.

## Type scale reference

Each size slot below is shared by the weights listed. The full composite token name is `<slot>-<weight>` — for example `mobile-body-md-regular`.

#### mobile

| Size slot                   | CSS variable                       | Size       | Line height | Weights                                    |
| --------------------------- | ---------------------------------- | ---------- | ----------- | ------------------------------------------ |
| `mobile-caption-sm`         | `--text-mobile-caption-sm`         | `0.5rem`   | `0.75rem`   | light, regular, medium, semibold           |
| `mobile-caption-md`         | `--text-mobile-caption-md`         | `0.625rem` | `1rem`      | light, regular, medium, semibold           |
| `mobile-body-sm`            | `--text-mobile-body-sm`            | `0.75rem`  | `1.25rem`   | light, regular, medium, semibold           |
| `mobile-body-md`            | `--text-mobile-body-md`            | `0.875rem` | `1.25rem`   | light, regular, medium, semibold           |
| `mobile-body-lg`            | `--text-mobile-body-lg`            | `1rem`     | `1.5rem`    | light, regular, medium, semibold           |
| `mobile-heading-sm`         | `--text-mobile-heading-sm`         | `1rem`     | `1.5rem`    | light, regular, medium, semibold           |
| `mobile-heading-md`         | `--text-mobile-heading-md`         | `1.25rem`  | `2rem`      | light, regular, medium, semibold           |
| `mobile-heading-lg`         | `--text-mobile-heading-lg`         | `1.5rem`   | `2.25rem`   | light, regular, medium, semibold           |
| `mobile-display-xs`         | `--text-mobile-display-xs`         | `1.5rem`   | `2.25rem`   | regular, medium, semibold, bold, extrabold |
| `mobile-display-sm`         | `--text-mobile-display-sm`         | `1.75rem`  | `2.5rem`    | regular, medium, semibold, bold, extrabold |
| `mobile-display-md`         | `--text-mobile-display-md`         | `2rem`     | `3rem`      | regular, medium, semibold, bold, extrabold |
| `mobile-display-lg`         | `--text-mobile-display-lg`         | `2.5rem`   | `3.25rem`   | regular, medium, semibold, bold, extrabold |
| `mobile-banner-headline-sm` | `--text-mobile-banner-headline-sm` | `0.75rem`  | `1rem`      | semibold                                   |
| `mobile-banner-headline-md` | `--text-mobile-banner-headline-md` | `0.875rem` | `1.125rem`  | semibold                                   |
| `mobile-banner-headline-lg` | `--text-mobile-banner-headline-lg` | `1rem`     | `1.25rem`   | semibold                                   |
| `mobile-banner-body-md`     | `--text-mobile-banner-body-md`     | `0.625rem` | `1rem`      | regular                                    |
| `mobile-banner-body-lg`     | `--text-mobile-banner-body-lg`     | `0.75rem`  | `1.125rem`  | regular                                    |
| `mobile-banner-label-md`    | `--text-mobile-banner-label-md`    | `0.625rem` | `0.875rem`  | medium                                     |
| `mobile-banner-label-lg`    | `--text-mobile-banner-label-lg`    | `0.75rem`  | `1rem`      | medium                                     |
| `mobile-banner-cta-md`      | `--text-mobile-banner-cta-md`      | `0.625rem` | `0.875rem`  | semibold                                   |
| `mobile-banner-cta-lg`      | `--text-mobile-banner-cta-lg`      | `0.75rem`  | `1rem`      | semibold                                   |

#### desktop

| Size slot                    | CSS variable                        | Size       | Line height | Weights                                    |
| ---------------------------- | ----------------------------------- | ---------- | ----------- | ------------------------------------------ |
| `desktop-caption-sm`         | `--text-desktop-caption-sm`         | `0.75rem`  | `1rem`      | light, regular, medium, semibold           |
| `desktop-caption-md`         | `--text-desktop-caption-md`         | `0.875rem` | `1.25rem`   | light, regular, medium, semibold           |
| `desktop-body-sm`            | `--text-desktop-body-sm`            | `1rem`     | `1.5rem`    | light, regular, medium, semibold           |
| `desktop-body-md`            | `--text-desktop-body-md`            | `1.25rem`  | `1.75rem`   | light, regular, medium, semibold           |
| `desktop-heading-sm`         | `--text-desktop-heading-sm`         | `1.5rem`   | `2.25rem`   | light, regular, medium, semibold           |
| `desktop-heading-md`         | `--text-desktop-heading-md`         | `1.75rem`  | `2.5rem`    | light, regular, medium, semibold           |
| `desktop-heading-lg`         | `--text-desktop-heading-lg`         | `2rem`     | `3rem`      | light, regular, medium, semibold           |
| `desktop-display-xs`         | `--text-desktop-display-xs`         | `2rem`     | `3rem`      | regular, medium, semibold, bold, extrabold |
| `desktop-display-sm`         | `--text-desktop-display-sm`         | `2.5rem`   | `3.25rem`   | regular, medium, semibold, bold, extrabold |
| `desktop-display-md`         | `--text-desktop-display-md`         | `3rem`     | `3.75rem`   | regular, medium, semibold, bold, extrabold |
| `desktop-display-lg`         | `--text-desktop-display-lg`         | `3.75rem`  | `4.5rem`    | regular, medium, semibold, bold, extrabold |
| `desktop-banner-headline-sm` | `--text-desktop-banner-headline-sm` | `1.5rem`   | `2rem`      | semibold                                   |
| `desktop-banner-headline-md` | `--text-desktop-banner-headline-md` | `1.75rem`  | `2.25rem`   | semibold                                   |
| `desktop-banner-headline-lg` | `--text-desktop-banner-headline-lg` | `2rem`     | `3rem`      | semibold                                   |
| `desktop-banner-body-md`     | `--text-desktop-banner-body-md`     | `1.25rem`  | `2rem`      | regular                                    |
| `desktop-banner-body-lg`     | `--text-desktop-banner-body-lg`     | `1.5rem`   | `2.25rem`   | regular                                    |
| `desktop-banner-label-md`    | `--text-desktop-banner-label-md`    | `1.25rem`  | `1.5rem`    | medium                                     |
| `desktop-banner-label-lg`    | `--text-desktop-banner-label-lg`    | `1.5rem`   | `1.75rem`   | medium                                     |
| `desktop-banner-cta-md`      | `--text-desktop-banner-cta-md`      | `1.25rem`  | `1.5rem`    | semibold                                   |
| `desktop-banner-cta-lg`      | `--text-desktop-banner-cta-lg`      | `1.5rem`   | `1.75rem`   | semibold                                   |

---

# Spacing

A **32-step scale** generated verbatim from the Figma Design System, `0` through `1920px`. Every step is a multiple of 4px.

### Source and generation

|                 |                                                                                |
| --------------- | ------------------------------------------------------------------------------ |
| Source          | `figma/exports/primitives/colors.json` → `Spacing` collection                  |
| Generator       | `scripts/generate-spacing-tokens.py` — run with `pnpm generate:spacing-tokens` |
| Generated files | `src/foundations/spacing/spacing.css`, `src/tokens/spacing/index.ts`           |

> **The `Spacing` collection lives in `colors.json`,** because that file is a full Figma variable export rather than a colors-only one. The filename is misleading; renaming it is deferred so the colors generator and its fidelity test keep working. The `Filled Text` collection in the same file is ignored entirely — it holds a single scratch string that maps to no foundation.

To update after a new Figma export, replace the file and run:

```bash
pnpm generate:spacing-tokens
```

The generator is idempotent. Two suites guard the output: `spacing.test.ts` checks shape and ordering, and `spacing.source.test.ts` re-derives every value from the export and round-trips each rem value back to its original pixels.

### Naming

Figma names each token by its **step number** with the pixel value appended — `4 (16px)` means step 4 = 16px. The generator parses the step and drops the parenthetical.

Two names required normalization:

| Figma       | Mozaic | Reason                                                                                                                                                                                 |
| ----------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0․5 (2px)` | `0-5`  | The decimal point is **U+2024 ONE DOT LEADER**, not a period — Figma reserves `.` as its group separator. A literal `.` is also invalid in a CSS custom property name without escaping |
| `1․5 (6px)` | `1-5`  | As above                                                                                                                                                                               |

The U+2024 character is visually indistinguishable from a period and would silently break any string matching. `spacingSource` retains the exact original name for every token.

### Values

px is divided by 16 to give rem, matching typography, so spacing scales with the reader's browser font-size setting. Every value divides cleanly — no repeating decimals — and each rem value round-trips back to its exact original pixel count.

The generator refuses to guess: it fails the build if a name is unparseable, if the pixel value embedded in a name disagrees with its `$value`, or if step × 4 ≠ px.

### A note on `hiddenFromPublishing`

All 32 variables are flagged `hiddenFromPublishing: true` in Figma — unlike the colors collection, where none are. This is treated as **metadata only** and does not block generation, per explicit direction. It may mean the design team considers these internal or draft. **Flagged for design review.**

### Why iteration order needs `spacingScale`

`spacing` is an object for O(1) lookup, but **its key order is not the scale order**. JavaScript hoists integer-like keys (`'4'`) above string keys (`'0-5'`), so enumerating the object puts the two fractional steps _last_:

```ts
Object.keys(spacing); // '0', '1', '2', … '480', '0-5', '1-5'  ← wrong
spacingScale; //        '0', '0-5', '1', '1-5', '2', … '480'   ← correct
```

Always iterate `spacingScale` when order matters. A test asserts this hazard is real so the array is never "simplified" away. The CSS file is unaffected — it is written as an ordered list.

## Browse in Storybook

The full scale with proportional bars is at **Foundations → Spacing → Scale**.

```bash
pnpm storybook
```

Bars render at true pixel width up to 640px and are capped beyond that so the largest steps stay on screen.

## Usage

### Tailwind utilities

Every token generates the full set of spacing utilities — padding, margin, gap, width, height, inset:

```html
<div class="mt-0-5 gap-2 p-4">…</div>
```

### CSS variables

```css
.thing {
  padding: var(--spacing-4);
  gap: var(--spacing-2);
}
```

### TypeScript

```ts
import { spacing, spacingScale, spacingSource } from '@medibuddy/mozaic-ui';

spacing['4']; // '1rem'
spacing['0-5']; // '0.125rem'
spacingScale; // ordered keys — use this to iterate
spacingSource['4']; // { figmaName: '4 (16px)', px: 16, step: 4 }
```

Type: `SpacingToken`.

## Scale reference

| Token | CSS variable    | rem        | px     | Step | Figma name      |
| ----- | --------------- | ---------- | ------ | ---- | --------------- |
| `0`   | `--spacing-0`   | `0rem`     | 0px    | 0    | `0 (0px)`       |
| `0-5` | `--spacing-0-5` | `0.125rem` | 2px    | 0.5  | `0․5 (2px)`     |
| `1`   | `--spacing-1`   | `0.25rem`  | 4px    | 1    | `1 (4px)`       |
| `1-5` | `--spacing-1-5` | `0.375rem` | 6px    | 1.5  | `1․5 (6px)`     |
| `2`   | `--spacing-2`   | `0.5rem`   | 8px    | 2    | `2 (8px)`       |
| `3`   | `--spacing-3`   | `0.75rem`  | 12px   | 3    | `3 (12px)`      |
| `4`   | `--spacing-4`   | `1rem`     | 16px   | 4    | `4 (16px)`      |
| `5`   | `--spacing-5`   | `1.25rem`  | 20px   | 5    | `5 (20px)`      |
| `6`   | `--spacing-6`   | `1.5rem`   | 24px   | 6    | `6 (24px)`      |
| `8`   | `--spacing-8`   | `2rem`     | 32px   | 8    | `8 (32px)`      |
| `10`  | `--spacing-10`  | `2.5rem`   | 40px   | 10   | `10 (40px)`     |
| `12`  | `--spacing-12`  | `3rem`     | 48px   | 12   | `12 (48px)`     |
| `16`  | `--spacing-16`  | `4rem`     | 64px   | 16   | `16 (64px)`     |
| `20`  | `--spacing-20`  | `5rem`     | 80px   | 20   | `20 (80px)`     |
| `24`  | `--spacing-24`  | `6rem`     | 96px   | 24   | `24 (96px)`     |
| `32`  | `--spacing-32`  | `8rem`     | 128px  | 32   | `32 (128px)`    |
| `40`  | `--spacing-40`  | `10rem`    | 160px  | 40   | `40 (160px)`    |
| `48`  | `--spacing-48`  | `12rem`    | 192px  | 48   | `48 (192px)`    |
| `56`  | `--spacing-56`  | `14rem`    | 224px  | 56   | `56 (224px)`    |
| `64`  | `--spacing-64`  | `16rem`    | 256px  | 64   | `64 (256px)`    |
| `80`  | `--spacing-80`  | `20rem`    | 320px  | 80   | `80 (320px)`    |
| `96`  | `--spacing-96`  | `24rem`    | 384px  | 96   | `96 (384px)`    |
| `120` | `--spacing-120` | `30rem`    | 480px  | 120  | `120 (480px)`   |
| `140` | `--spacing-140` | `35rem`    | 560px  | 140  | `140 (560px)`   |
| `160` | `--spacing-160` | `40rem`    | 640px  | 160  | `160 (640px)`   |
| `180` | `--spacing-180` | `45rem`    | 720px  | 180  | `180 (720px)`   |
| `192` | `--spacing-192` | `48rem`    | 768px  | 192  | `192 (768px)`   |
| `256` | `--spacing-256` | `64rem`    | 1024px | 256  | `256 (1,024px)` |
| `320` | `--spacing-320` | `80rem`    | 1280px | 320  | `320 (1,280px)` |
| `360` | `--spacing-360` | `90rem`    | 1440px | 360  | `360 (1,440px)` |
| `400` | `--spacing-400` | `100rem`   | 1600px | 400  | `400 (1,600px)` |
| `480` | `--spacing-480` | `120rem`   | 1920px | 480  | `480 (1,920px)` |

---

# Radius

An **11-step scale** generated verbatim from the Figma Design System, `none` through `full`.

### Source and generation

|                 |                                                                              |
| --------------- | ---------------------------------------------------------------------------- |
| Source          | `figma/exports/primitives/radius.json`                                       |
| Generator       | `scripts/generate-radius-tokens.py` — run with `pnpm generate:radius-tokens` |
| Generated files | `src/foundations/radius/radius.css`, `src/tokens/radius/index.ts`            |

> **This export has no wrapping collection**, unlike colors, typography and spacing. Every top-level key (aside from Figma's `$extensions` metadata) is already a complete token — `radius-none`, `radius-full`, and so on — so the generator reads the export directly rather than through `parser.collection()`.

To update after a new Figma export, replace the file and run:

```bash
pnpm generate:radius-tokens
```

The generator is idempotent. Two suites guard the output: `radius.test.ts` checks shape, ordering and the none-to-4xl ascent, and `radius.source.test.ts` re-derives every value from the export — including asserting that `radius-full` is _not_ special-cased.

### Naming

Every Figma key already carries a `radius-` prefix (`radius-xxs`), unlike the other foundations, where the category lives only in the CSS variable. The prefix is stripped from the bare token key to match them:

| Figma         | Token key | CSS variable    | TypeScript    |
| ------------- | --------- | --------------- | ------------- |
| `radius-xxs`  | `xxs`     | `--radius-xxs`  | `radius.xxs`  |
| `radius-full` | `full`    | `--radius-full` | `radius.full` |

No value is touched by this — it is a naming convention only.

### Values, including `radius-full`

px is divided by 16 to give rem, matching typography and spacing. **`radius-full` (Figma value `9999`) goes through the identical pipeline as every other step — it is not special-cased.** `9999 / 16 = 624.9375rem` exactly, with no rounding, so nothing is lost or reinterpreted by treating it uniformly. The original Figma name and pixel value for every token, including `full`, are preserved in `radiusSource` for traceability.

`radius-full` is Figma's conventional "pill/circle" sentinel — a corner radius large enough that it always fully rounds the element regardless of its size — rather than a literal point on the linear scale. The Storybook page caps its rendered preview at 96px so the swatch doesn't overflow, while the labelled value shown is the real `624.9375rem` / `9999px`.

### A new generator finding: quoted TypeScript keys

Radius is the first foundation whose scale mixes purely-alphabetic keys (`xxs`, `full`) with keys that start with a digit but are not purely numeric (`2xl`, `3xl`, `4xl`). `2xl` is not a valid _bare_ TypeScript object key — identifiers cannot start with a digit — even though it is not a plain number either. Generating it unquoted produced invalid TypeScript that failed to compile.

This was fixed once, generally, in the shared framework: `scripts/common/typescript.py` gained `quote_key()`, which bare-emits a key only when it is a valid identifier or a canonical numeric literal, and quotes everything else. It is used by the radius generator; the other three generators' existing key-quoting logic was left untouched, since none of their token sets hit this case.

## Browse in Storybook

Every token renders as a live corner-radius preview at **Foundations → Radius → Scale**.

```bash
pnpm storybook
```

## Usage

### Tailwind utilities

```html
<div class="rounded-md">…</div>
<div class="rounded-full">…</div>
```

### CSS variables

```css
.thing {
  border-radius: var(--radius-lg);
}
```

### TypeScript

```ts
import { radius, radiusSource, radiusVar } from '@medibuddy/mozaic-ui';

radius.md; // '0.5rem'
radius.full; // '624.9375rem'
radiusSource.full; // { figmaName: 'radius-full', px: 9999 }
radiusVar('md'); // '--radius-md'
```

Type: `RadiusToken`.

## Scale reference

| Token  | CSS variable    | rem           | px     | Figma name    |
| ------ | --------------- | ------------- | ------ | ------------- |
| `none` | `--radius-none` | `0rem`        | 0px    | `radius-none` |
| `xxs`  | `--radius-xxs`  | `0.125rem`    | 2px    | `radius-xxs`  |
| `xs`   | `--radius-xs`   | `0.25rem`     | 4px    | `radius-xs`   |
| `sm`   | `--radius-sm`   | `0.375rem`    | 6px    | `radius-sm`   |
| `md`   | `--radius-md`   | `0.5rem`      | 8px    | `radius-md`   |
| `lg`   | `--radius-lg`   | `0.625rem`    | 10px   | `radius-lg`   |
| `xl`   | `--radius-xl`   | `0.75rem`     | 12px   | `radius-xl`   |
| `2xl`  | `--radius-2xl`  | `1rem`        | 16px   | `radius-2xl`  |
| `3xl`  | `--radius-3xl`  | `1.25rem`     | 20px   | `radius-3xl`  |
| `4xl`  | `--radius-4xl`  | `1.5rem`      | 24px   | `radius-4xl`  |
| `full` | `--radius-full` | `624.9375rem` | 9999px | `radius-full` |

---

# Elevation

8 tokens: four levels, each in a downward and an upward direction. Measured from Figma `Section > Shadows` (node `4823:505`).

### Source and generation

`figma/exports/primitives/elevation.json` → `pnpm generate:elevation-tokens` → `src/foundations/elevation/elevation.css` + `src/tokens/elevation/index.ts`.

**This export is transcribed, not exported.** Figma effect styles are not variables, so they cannot travel through the variable export every other foundation comes from. The 8 styles were read from Dev Mode and written into the export by hand; the file's `$transcription` block records the node id and the reason. `src/tokens/elevation/elevation.source.test.ts` is therefore the only thing tying the generated stylesheet to the recorded measurements, and it checks all 8 tokens layer by layer.

### Scale structure

Each token is a **two-layer** drop shadow. Every one of the 16 layers has **x offset 0** and **spread 0** — asserted by the generator, so a re-export that introduces either fails loudly rather than silently dropping it.

| Token            | Front layer           | Back layer              |
| ---------------- | --------------------- | ----------------------- |
| `elevation-1`    | `0 1px 1px` @ 1.96%   | `0 2px 4px` @ 3.92%     |
| `elevation-2`    | `0 1px 4px` @ 3.92%   | `0 4px 10px` @ 5.10%    |
| `elevation-3`    | `0 2px 20px` @ 3.92%  | `0 8px 32px` @ 7.84%    |
| `elevation-4`    | `0 8px 20px` @ 5.88%  | `0 24px 60px` @ 12.16%  |
| `elevation-1-up` | `0 -1px 1px` @ 1.18%  | `0 -2px 4px` @ 3.14%    |
| `elevation-2-up` | `0 -1px 4px` @ 3.14%  | `0 -4px 10px` @ 3.92%   |
| `elevation-3-up` | `0 -2px 20px` @ 3.14% | `0 -8px 32px` @ 7.06%   |
| `elevation-4-up` | `0 -8px 20px` @ 5.10% | `0 -24px 60px` @ 10.20% |

Every `-up` level is fainter than its downward twin at both layers — asserted in the fidelity test, not assumed.

### Layer order

Layers are stored and emitted in **CSS paint order — front first**. Figma's effect panel lists them the other way round, widest first. Both orderings were cross-checked against the `box-shadow` Figma's own codegen emits for all 8 styles.

### Values stay in pixels

Unlike colors, typography, spacing and radius, elevation is **not** converted to rem. Shadow geometry is absolute in Figma, and a shadow that rescaled with the root font size would change how high the surface appears — the one thing an elevation scale exists to hold fixed.

### Colours are not aliased

Every layer is pure black with an alpha, carried as the 8-digit hex Figma reports (`#0000001f`), because:

- Figma binds **no variable** to any of these colours. They are raw in the design file.
- All 21 existing `--color-semantic-shadow-*` tokens are `rgb(23 27 34 / α)` — a **different** scale, from `Colors/Effects/Shadows 📌`. Reverse-lookup confirms **none** is pure black, so aliasing one would change the colour.

Figma's own codegen rounds the alphas (`0A` → `0.04`); the hex is authoritative and is what the foundation carries.

### No dark mode

Figma publishes no dark-mode elevation. Note the contrast: our semantic shadow _colours_ do have a dark story — every one resolves to `transparent` in dark mode — but Elevation cannot participate, because it is not variable-backed.

## Usage

```html
<div class="shadow-elevation-2">…</div>
<div class="shadow-elevation-3-up">…</div>
```

Do **not** put a `shadow-<color>` utility beside an elevation token: that sets `--tw-shadow-color`, which Tailwind substitutes into _every_ layer, collapsing a two-tone shadow into one colour.

### Elevation is the only shadow system

Elevation is the only shadow foundation in Mozaic. Nothing else publishes a shadow,
and no component defines one of its own.

**`elevation-1` is the lowest level available.** Every resting control — Button,
IconButton, Input, Textarea, OtpInput and InputDropdown's trigger — takes it. The
dropdown menu takes `elevation-4`.

The four `-up` tokens exist for surfaces that cast upward, such as a bottom sheet or
a docked bar. **No component uses one today**, because no Figma component in the set
casts an upward shadow.

The scale is exactly the 8 tokens Figma publishes. There is no level below
`elevation-1`, no compatibility alias, and nothing generated to bridge an older
shadow scale.

```ts
import { elevation, elevationVar } from '@medibuddy/mozaic-ui';

elevation['elevation-4']; // '0px 8px 20px 0px #0000000f, 0px 24px 60px 0px #0000001f'
elevationVar('elevation-4'); // '--shadow-elevation-4'
```

---

# What the missing foundations owe

Four foundations are unstarted, and two of them are already being paid for in
`DOCUMENTED_EXCEPTIONS`. This is the running bill, so the value of building them is
visible before anyone starts.

## Sizing — 8 classes across two causes

The largest gap. Components pin dimensions Figma publishes that no scale carries.

| cause                   | classes                                                    | what would repay it                                                                              |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Pinned control heights  | `h-[44px]`, `h-[56px]`, `h-[120px]`, `h-[132px]`           | Input, Textarea and OtpInput frame heights, which provably do not equal padding plus line height |
| Glyph and control sizes | `size-[10px]`, `size-[14px]`, `size-[18px]`, `size-[36px]` | Tag's glyphs, Avatar's box and badge                                                             |

A Sizing foundation has to carry **component dimensions in their own collection, not alias
the spacing scale.** Several pinned values are expressible today through
`size-semantic-*` tokens that resolve to exactly the same pixels, and they are still
pinned as literals on purpose: a spacing ramp and a component's published dimensions are
different things. The ramp is free to re-scale, and a component that borrowed from it would
silently drift off its design. Aliasing would reintroduce the coupling these literals exist
to avoid.

## Border width — no exception outstanding

Every component in the library uses a bare `border`, which is 1px. Nothing currently forces
a `--border-width-*` token, so the foundation stays an empty stub until something does.

## Opacity, Motion, Breakpoints, Grid, Z-index

No component has needed one yet, and none is currently forcing an exception.
