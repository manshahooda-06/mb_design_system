import { defineVariants, type VariantProps } from '@utils/variants';

/**
 * Styling for Tag, declared as data.
 *
 * Measured from Figma `Tag` (node 3307:417515, 72 variants):
 * `Size`(3) × `Icon`(4) × `Action`(3) × `Checkbox`(2). All 72 are implemented.
 *
 * **Tag has no state axis.** No hover, focus, pressed, disabled, selected or error
 * anywhere in the 72, and no filled or tonal type — every variant is white with a
 * 1px grey stroke. The only interactive states in the family belong to the nested
 * checkbox, which has its own file.
 *
 * The size scale is not monotonic: heights are **26 / 24 / 28**, so `md` is the
 * shortest tag. Reproduced as measured.
 */

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The tag itself. Hug × hug — height is `py + 20 + py`, never pinned.
 *
 * The stroke is an `inset-ring`, not a `border`, and here that is load-bearing
 * rather than stylistic: the box is content-sized, so a CSS border would add 2px
 * to a hug height that Figma measures at exactly 26/24/28.
 *
 * **Padding is the whole story of this component.** Figma's 72 variants carry 23
 * distinct `pl`/`pr` pairs, which look bespoke until decomposed:
 *
 * - `pl` depends on **size × leading element** — it shrinks as the thing on the
 *   left grows, so the optical inset stays even: nothing → dot → 16px media →
 *   checkbox. It does *not* depend on the action.
 * - `pr` depends on **size × action** only.
 *
 * That is 12 + 9 = 21 measured values rather than 72 pairs, and every one of them
 * was cross-checked against 17 direct Dev Mode measurements. Of the 21, seven land
 * on no step of any scale (5, 7, 9, 10 on the left; 3, 9, 10 on the right) and are
 * listed in `DOCUMENTED_EXCEPTIONS`.
 *
 * The root gap exists only for `X close`, because the close button is the one child
 * that sits outside `Content`.
 */
export const tagRootVariants = defineVariants(
  [
    'inline-flex items-center justify-center rounded-sm font-sans',
    'bg-semantic-bg-primary',
    'inset-ring inset-ring-semantic-border-primary',
    // Figma binds no effect to any of the 72 — Tag casts no shadow.
  ],
  {
    variants: {
      size: {
        // py is size-only. 3px lands on no spacing step.
        sm: 'py-[3px]',
        md: 'py-semantic-xxs',
        lg: 'py-semantic-xs',
      },
      /** The leading element, which is what `pl` compensates for. */
      lead: { none: '', dot: '', media: '', checkbox: '' },
      action: { text: '', close: 'gap-[3px]', count: '' },
    },
    compoundVariants: [
      /* pl — size × leading element. Measured, not derived. */
      { size: 'sm', lead: 'none', class: 'pl-semantic-md' } /*  8 */,
      { size: 'sm', lead: 'dot', class: 'pl-semantic-sm' } /*  6 */,
      { size: 'sm', lead: 'media', class: 'pl-semantic-xs' } /*  4 */,
      { size: 'sm', lead: 'checkbox', class: 'pl-[5px]' },
      { size: 'md', lead: 'none', class: 'pl-[9px]' },
      { size: 'md', lead: 'dot', class: 'pl-[7px]' },
      { size: 'md', lead: 'media', class: 'pl-[5px]' },
      { size: 'md', lead: 'checkbox', class: 'pl-semantic-xs' } /*  4 */,
      { size: 'lg', lead: 'none', class: 'pl-[10px]' },
      { size: 'lg', lead: 'dot', class: 'pl-[9px]' },
      { size: 'lg', lead: 'media', class: 'pl-[7px]' },
      { size: 'lg', lead: 'checkbox', class: 'pl-[5px]' },

      /* pr — size × action. Measured, not derived. */
      { size: 'sm', action: 'text', class: 'pr-semantic-md' } /*  8 */,
      { size: 'md', action: 'text', class: 'pr-[9px]' },
      { size: 'lg', action: 'text', class: 'pr-[10px]' },
      { size: 'sm', action: 'close', class: 'pr-semantic-xs' } /*  4 */,
      { size: 'md', action: 'close', class: 'pr-semantic-xs' } /*  4 */,
      { size: 'lg', action: 'close', class: 'pr-semantic-xs' } /*  4 */,
      { size: 'sm', action: 'count', class: 'pr-semantic-xs' } /*  4 */,
      { size: 'md', action: 'count', class: 'pr-[3px]' },
      { size: 'lg', action: 'count', class: 'pr-semantic-xs' } /*  4 */,
    ],
    defaultVariants: { size: 'sm', lead: 'none', action: 'text' },
  },
);

/** Figma "Content": everything except the close button. Gap 4 / **5** / 6 by size. */
export const tagContentVariants = defineVariants('flex items-center', {
  variants: {
    size: {
      sm: 'gap-semantic-xs',
      // 5px lands between spacing-xs 4 and spacing-sm 6, on no step of any scale.
      md: 'gap-[5px]',
      lg: 'gap-semantic-sm',
    },
  },
  defaultVariants: { size: 'sm' },
});

/**
 * The label. 12/20/500 at sm, 14/20/500 at md and lg.
 *
 * `whitespace-nowrap` with **no** ellipsis, matching Figma: a tag grows to fit its
 * label rather than truncating it.
 */
export const tagLabelVariants = defineVariants(
  'shrink-0 text-center font-medium whitespace-nowrap text-semantic-text-secondary',
  {
    variants: {
      size: { sm: 'text-mobile-body-sm', md: 'text-mobile-body-md', lg: 'text-mobile-body-md' },
    },
    defaultVariants: { size: 'sm' },
  },
);

/* -------------------------------------------------------------------------- */
/* Leading icon                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The leading icon box.
 *
 * Three shapes, because Figma's four `Icon` values are three shapes plus none:
 *
 * - `dot` — an 8px box holding a 6px filled circle, always `success/500`. There is
 *   no colour axis, so a status dot can only ever mean success.
 * - `flag` — 16px, clipped, **not** rounded.
 * - `avatar` — 16px, clipped, `rounded-full`.
 *
 * `Country` and `Avatar` are geometrically identical at every size (verified: all
 * 24 root widths match), which is why they share one box size and differ only in
 * radius. **None of the three scales with `size`** — Figma holds 8 and 16 across
 * sm, md and lg.
 *
 * The avatar's contrast ring is deliberately absent: it belongs to the `_Avatar`
 * component, not to Tag, so it arrives with whatever node the caller passes.
 */
export const tagIconVariants = defineVariants('inline-flex shrink-0 items-center justify-center', {
  variants: {
    variant: {
      // `*:size-full` stretches a caller's glyph to fill the box, which is right for
      // media and wrong for the dot: the dot's child is ours and is deliberately
      // 6px inside an 8px box, so filling it would round the dot up to 8.
      dot: 'size-semantic-md',
      flag: 'size-semantic-xl overflow-clip *:size-full',
      avatar: 'size-semantic-xl overflow-clip rounded-full *:size-full',
    },
  },
  defaultVariants: { variant: 'dot' },
});

/** The dot's fill: a 6px circle in `success/500`, which `fg-success-secondary` aliases. */
export const tagDotVariants = defineVariants(
  'size-semantic-sm rounded-full bg-semantic-fg-success-secondary',
);

/* -------------------------------------------------------------------------- */
/* Count                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The count pill. Inlined rather than its own component: 3 size variants, no
 * state, no behaviour — five declarations.
 *
 * Figma pins the sm and md text boxes to a single character's width (`w-8` / `w-9`)
 * and the sm one to `h-16` against an 18px line height, so its own text overflows
 * by 2px. Neither pin is reproduced — they would break any two-digit count, and the
 * lg variant does not have them.
 */
export const tagCountVariants = defineVariants(
  [
    'inline-flex shrink-0 flex-col items-center justify-center',
    'bg-semantic-bg-tertiary font-medium text-semantic-text-secondary',
    // 3px lands between radius-xxs 2 and radius-xs 4.
    'rounded-[3px]',
  ],
  {
    variants: {
      size: {
        sm: 'px-semantic-xs text-mobile-banner-body-lg',
        // 5px again lands on no step.
        md: 'px-[5px] text-mobile-banner-body-lg',
        lg: 'px-semantic-sm text-mobile-body-md',
      },
    },
    defaultVariants: { size: 'sm' },
  },
);

/* -------------------------------------------------------------------------- */
/* Close                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The close button.
 *
 * Reproduces what the Tag set **currently instantiates**: a `p-2` wrapper around a
 * 10px `cancel-01`, giving a flat 14×14 at every size, with no radius and no hover.
 *
 * Figma also publishes `_Tag close X` — 6 variants with a 14/16/20 ramp, a 3px
 * radius and a `gray-50` hover — and Tag does not use it. Input `Tags` and Textarea
 * `Tags` still render the older `_Tag close X`; InputDropdown's multi-select
 * renders this one. That mismatch is a Figma synchronisation issue and is
 * deliberately not encoded here: the published Tag set is the source of truth.
 *
 * A real `<button>` with the shared focus ring, which Figma's plain frame is not —
 * the one place this component adds interactivity the file does not draw, because a
 * removable tag that cannot be reached by keyboard is not shippable.
 */
export const tagCloseVariants = defineVariants([
  'inline-flex shrink-0 cursor-pointer items-center justify-center',
  // 14px total: a 10px glyph in `spacing-xxs` padding. Neither 14 nor 10 is on a
  // scale, so the box is expressed as padding + glyph rather than a fixed size.
  'p-semantic-xxs',
  'text-semantic-fg-quinary',
  'outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus-ring',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-semantic-bg-primary',
  'disabled:cursor-not-allowed',
]);

/** The close glyph. 10px at every size — Figma does not scale it. */
export const tagCloseIconVariants = defineVariants('size-[10px] shrink-0 *:size-full');

export type TagVariantProps = VariantProps<typeof tagRootVariants>;
