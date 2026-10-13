import { defineVariants } from '@utils/variants';

/**
 * Styling for Tooltip, declared as data.
 *
 * Measured from Figma `Tooltip` (node `1052:489`, 14 variants):
 * `Supporting text`(2) × `Arrow`(7). All 14 are implemented.
 *
 * **Tooltip has no state axis.** The component set publishes exactly two
 * properties, neither of which is a state: no hover, focus, open, disabled or
 * error variant exists anywhere in the 14, and no motion or delay is specified.
 * Nothing here reacts to interaction, because Figma draws nothing that does.
 *
 * The height arithmetic closes exactly, which is what pins the padding:
 *
 * - simple: `8 + 20 + 8 = 36` ✓ (Figma publishes 36)
 * - supporting: `12 + (20 + 2 + 48) + 12 = 94` ✓ (Figma publishes 94)
 *
 * and the arrow adds exactly 6px to whichever axis it attaches on — 42 vs 36 on
 * the verticals, 121 vs 115 on the sides.
 *
 * **Width is not pinned.** Figma's instances are 115 and 258 wide, but those are
 * canvas widths: `Content` is `w-full` inside them and the copy is sample text.
 * The bubble hugs its content and the caller caps it, the same call already
 * documented for InputDropdown's `w-[320px]`.
 */

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The wrapper that holds the body and the arrow, and the only thing that carries
 * the shadow.
 *
 * **The shadow is a filter, not a box-shadow, and that is load-bearing.** Figma
 * binds `uui-shadows/shadow-lg` to this wrapper rather than to the bubble, so it
 * traces the silhouette of body-plus-arrow as one shape. A `box-shadow` on the
 * bubble would leave the arrow unshadowed, and giving the arrow its own would draw
 * a seam along the edge where they join. `filter` is what makes the two read as one
 * object. See `SHADOW` in `constants.ts` for the layer-by-layer conversion.
 *
 * The arrow's position is reached through flex alignment rather than absolute
 * offsets, which is how Figma itself builds it — the exported wrapper differs only
 * by `items-center` / `items-start` / `items-end`. The two offset positions add one
 * `semantic-lg` of margin on the arrow instead of Figma's wider 28px arrow frame;
 * both put the arrow's near edge exactly 12px from the bubble's, and the margin
 * reaches it through a token where the 28px frame could not.
 */
export const tooltipRootVariants = defineVariants(
  [
    'inline-flex',
    '[filter:drop-shadow(0_2px_1px_#171b220a)_drop-shadow(0_4px_3px_#171b2208)_drop-shadow(0_12px_8px_#171b2214)]',
  ],
  {
    variants: {
      arrowPosition: {
        none: 'flex-col',
        'bottom-center': 'flex-col items-center',
        'bottom-left': 'flex-col items-start',
        'bottom-right': 'flex-col items-end',
        'top-center': 'flex-col items-center',
        left: 'flex-row items-center',
        right: 'flex-row items-center',
      },
    },
    defaultVariants: { arrowPosition: 'none' },
  },
);

/* -------------------------------------------------------------------------- */
/* Content — Figma's `Content`                                                */
/* -------------------------------------------------------------------------- */

/**
 * The bubble.
 *
 * `font-sans` because this is a text-bearing root: with no preflight in
 * `embed.css`, a host application's `font-family` would otherwise be inherited
 * straight through. See docs/Component-Architecture.md.
 *
 * Padding is the one place the two content modes diverge on the box itself —
 * `12/8` when the label stands alone, 12 all round once supporting text joins it.
 * Both are read from Figma, and the height arithmetic above is what confirms them.
 */
export const tooltipContentVariants = defineVariants(
  ['flex flex-col items-start rounded-md font-sans', 'bg-semantic-bg-primary-solid'],
  {
    variants: {
      hasSupportingText: {
        false: 'px-semantic-lg py-semantic-md',
        true: 'p-semantic-lg',
      },
    },
    defaultVariants: { hasSupportingText: false },
  },
);

/** Figma's `Text and supporting text` — the stacked pair, 2px apart. */
export const tooltipGroupVariants = defineVariants('flex flex-col items-start gap-semantic-xxs');

/* -------------------------------------------------------------------------- */
/* Text                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Figma's `Text`.
 *
 * `Mobile/M-Title/S-medium` resolves to `Body-sm-Medium` — 12/20 at weight 500,
 * which `text-mobile-body-sm` matches exactly on both axes. Mozaic's typography
 * tokens carry size and line height only, so the weight arrives separately.
 *
 * **Alignment is a variant, not a constant.** Alone, the label is centred and
 * never wraps, exactly as Figma draws it — which does mean a long single-line
 * label will overflow rather than fold, and a caller who needs otherwise reaches
 * for `classNames.label`. With supporting text it becomes a full-width,
 * left-aligned block that wraps, because that is the published layout.
 */
export const tooltipLabelVariants = defineVariants(
  'text-mobile-body-sm font-medium text-semantic-text-white',
  {
    variants: {
      hasSupportingText: {
        false: 'text-center whitespace-nowrap',
        true: 'w-full',
      },
    },
    defaultVariants: { hasSupportingText: false },
  },
);

/**
 * Figma's `Supporting text` — `Caption-md-Light`, 10/16 at weight 300, matched
 * exactly by `text-mobile-caption-md`.
 *
 * **The colour is the one place Figma disagrees with itself.** The component binds
 * the primitive `Colors/gray-light mode/100` (#DBE0E6), while Figma's own semantic
 * variable `Components/Tooltips ✅/tooltip-supporting-text` aliases
 * `gray-light mode/300` (#A4B0C0) — a visibly darker grey, which Mozaic generated
 * as `--color-semantic-tooltip-supporting-text`. That variable is marked
 * `hiddenFromPublishing`, so the component's binding is what any consumer of the
 * library actually sees, and it wins here.
 *
 * `utility-gray-100` is the semantic token that carries #DBE0E6 exactly, so the
 * published value is reached without dropping to a primitive. Once the two are
 * reconciled in Figma this should become `text-semantic-tooltip-supporting-text`,
 * which is the purpose-named token for it.
 */
export const tooltipSupportingTextVariants = defineVariants(
  'w-full text-mobile-caption-md font-light text-semantic-utility-gray-100',
);

/* -------------------------------------------------------------------------- */
/* Arrow — Figma's `Tooltip` layer                                            */
/* -------------------------------------------------------------------------- */

/**
 * The arrow's footprint.
 *
 * 16 × 6 on the verticals and 6 × 16 on the sides — `semantic-xl` and
 * `semantic-sm` land on both exactly, so the one piece of geometry that looked
 * like it would need an off-scale value does not.
 *
 * The colour arrives as `currentColor` on a text utility so the glyph can never
 * drift from the bubble: both read `--color-semantic-bg-primary-solid`, and a
 * change to the bubble's surface moves the arrow with it.
 */
export const tooltipArrowVariants = defineVariants(
  'inline-flex shrink-0 items-center justify-center text-semantic-bg-primary-solid',
  {
    variants: {
      arrowPosition: {
        none: '',
        'bottom-center': 'h-semantic-sm w-semantic-xl',
        'bottom-left': 'ms-semantic-lg h-semantic-sm w-semantic-xl',
        'bottom-right': 'me-semantic-lg h-semantic-sm w-semantic-xl',
        'top-center': 'h-semantic-sm w-semantic-xl',
        left: 'h-semantic-xl w-semantic-sm',
        right: 'h-semantic-xl w-semantic-sm',
      },
    },
    defaultVariants: { arrowPosition: 'none' },
  },
);

/**
 * The glyph itself, rotated into place.
 *
 * Figma's exported path points **down**, so the three bottom positions need no
 * rotation at all. `top-center` is `rotate-180`, which is what Figma's own export
 * does. The sides turn a quarter: rotating a down-pointing shape clockwise puts it
 * on the left, so `left` is `rotate-90` and `right` is `-rotate-90`.
 *
 * The 16 × 6 glyph keeps its layout box under rotation and overflows the 6 × 16
 * container, which is harmless — nothing clips it, and the container centres it.
 * Figma's export relies on the same behaviour.
 */
export const tooltipArrowGlyphVariants = defineVariants('', {
  variants: {
    arrowPosition: {
      none: '',
      'bottom-center': '',
      'bottom-left': '',
      'bottom-right': '',
      'top-center': 'rotate-180',
      left: 'rotate-90',
      right: '-rotate-90',
    },
  },
  defaultVariants: { arrowPosition: 'none' },
});
