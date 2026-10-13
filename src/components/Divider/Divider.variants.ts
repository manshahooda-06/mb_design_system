import { defineVariants } from '@utils/variants';

/**
 * Styling for Divider, declared as data.
 *
 * Measured from Figma `Divider` (node `4725:3274`) — **8 published variants**:
 * `Orientation`(2) × `Style`(2) × `Variant`(2). All 8 are implemented.
 *
 * **The line is 1px of fill on a zero-thickness box, and Figma's own geometry says so.**
 * Its horizontal frames measure `328 × 0.0000287` and its vertical ones
 * `0.0000143 × 328`: the cross axis is zero, and everything visible is the stroke. The
 * stroke is centred on that zero axis — the exported SVG draws `<line y1="0.5" y2="0.5">`
 * in a 1px-tall box with no `stroke-width`, so it defaults to 1 and spans exactly 0→1.
 *
 * So the thickness arrives here as a 1px box that is entirely fill: `h-px` across, or
 * `w-px` down. **Nothing carries a border**, which is what keeps a 1px line from becoming
 * a 2px one — a border on a box that already has thickness would draw both.
 *
 * **328 is Figma's sample length, not a constraint.** It appears on the *long* axis in
 * both orientations — 328 wide when horizontal, 328 tall when vertical — which is the
 * signature of a canvas frame rather than a specification. The divider fills its
 * container instead, and `className` pins it for a caller who needs a fixed run.
 *
 * **Dashed is a gradient rather than `border-dashed`, and that is a measured decision.**
 * CSS leaves dashed-border geometry to the browser, and Chrome's does not match Figma:
 * rendered against each other over the same 40px, Figma's `2 2` pattern gives 10 dashes
 * while a 1px dashed border gives 8 — a period of 5px against Figma's 4, with dashes half
 * again as long. A `repeating-linear-gradient` with hard stops reproduces 2/2 exactly and
 * needs no exported asset.
 */

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

/*
 * The four dashed fills, written out rather than composed.
 *
 * Each names its colour as the same semantic token the solid styles reach through a
 * `bg-*` class, so the token rule can see it: the policy scans `var()` references and
 * checks them against the semantic layer exactly as it checks a class. Composing these
 * from fragments would hide that reference from it.
 *
 * The stops are hard — `0 2px` then `2px 4px` — so there is no interpolation between the
 * colour and `transparent`, and therefore none of the grey fringing a soft stop produces.
 */
const DASH = {
  horizontal: {
    normal:
      '[background-image:repeating-linear-gradient(to_right,var(--color-semantic-utility-gray-100)_0_2px,transparent_2px_4px)]',
    lighter:
      '[background-image:repeating-linear-gradient(to_right,var(--color-semantic-utility-gray-50)_0_2px,transparent_2px_4px)]',
  },
  vertical: {
    normal:
      '[background-image:repeating-linear-gradient(to_bottom,var(--color-semantic-utility-gray-100)_0_2px,transparent_2px_4px)]',
    lighter:
      '[background-image:repeating-linear-gradient(to_bottom,var(--color-semantic-utility-gray-50)_0_2px,transparent_2px_4px)]',
  },
} as const;

/**
 * The rule.
 *
 * `shrink-0` because a 1px flex child is the first thing a crowded row collapses, and a
 * divider that vanishes under pressure is worse than one that overflows. It changes no
 * measurement — the line is 1px either way.
 *
 * The colours are `utility-gray-*` rather than a `border-*` token, and the reason is that
 * only one of the two has a border-role token at all: `border-tertiary` carries
 * `gray-light-100` for Normal, but nothing in the border family carries `gray-light-50`
 * for Lighter — the gap SearchBar's stroke already documents. Reaching one through its
 * role and the other through the value family would split one axis across two families,
 * so both come from `utility-*`, which is the value-addressable family and is already
 * used this way: Tooltip for a text colour, TagCheckbox for a ring. Both tokens are
 * theme-aware, where a raw primitive would not be.
 */
export const dividerVariants = defineVariants('shrink-0', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'h-full w-px',
    },
    style: {
      solid: '',
      dashed: '',
    },
    variant: {
      normal: '',
      lighter: '',
    },
  },
  compoundVariants: [
    /* Solid is a flat fill; the orientation already set the 1px axis. */
    { style: 'solid', variant: 'normal', class: 'bg-semantic-utility-gray-100' },
    { style: 'solid', variant: 'lighter', class: 'bg-semantic-utility-gray-50' },

    /* Dashed runs the pattern along the long axis, so it needs the orientation too. */
    {
      style: 'dashed',
      orientation: 'horizontal',
      variant: 'normal',
      class: DASH.horizontal.normal,
    },
    {
      style: 'dashed',
      orientation: 'horizontal',
      variant: 'lighter',
      class: DASH.horizontal.lighter,
    },
    { style: 'dashed', orientation: 'vertical', variant: 'normal', class: DASH.vertical.normal },
    { style: 'dashed', orientation: 'vertical', variant: 'lighter', class: DASH.vertical.lighter },
  ],
  defaultVariants: { orientation: 'horizontal', style: 'solid', variant: 'normal' },
});
