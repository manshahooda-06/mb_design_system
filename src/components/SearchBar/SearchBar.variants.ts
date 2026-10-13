import { focusRing } from '@utils/a11y';
import { defineVariants, type VariantProps } from '@utils/variants';

/**
 * Styling for SearchBar, declared as data.
 *
 * Measured from Figma `Search Bar` (node 4353:2239, 6 variants) and its private
 * `_Search animating text` set (node 4353:6249, 12 variants).
 *
 * The axis is `device`, not a size scale. Figma publishes three viewports — Mobile,
 * Desktop - 1280 and Desktop - 1920 — and they disagree on padding, both icon ramps,
 * the content gap and the type step, so each reads its own measurements rather than
 * sharing a ramp. Same axis, and the same reasoning, as InputDropdown.
 *
 * Only two states exist: Default and Filled. Figma draws no focused, hover, pressed,
 * disabled, error or loading variant, and none is invented here.
 */

/**
 * The container.
 *
 * Height is **derived, not pinned**. Figma's frame hugs its content and the padding
 * sums to the published height exactly at all three devices — 12+20+12 = 44,
 * 12+24+12 = 48, 16+28+16 = 60 — which is only true if the 1px stroke contributes
 * nothing to the box. So the stroke is an `inset-ring`, matching Input: Figma strokes
 * are inside-aligned, and a CSS border would make these 46, 50 and 62.
 *
 * `Shadow/Elevation 2` is byte-exact against `--shadow-elevation-2`. Radius is 12 at
 * every device; Figma binds `radius-xl` at both desktops and leaves Mobile's unbound,
 * which is a Figma inconsistency rather than a different value.
 */
export const searchBarRootVariants = defineVariants(
  [
    'flex w-full items-center gap-semantic-md',
    // The family is set here, not inherited. Inheriting works when Mozaic owns the page —
    // its preflight puts Lexend Deca on `html` — but `embed.css` ships no preflight, so a
    // component in a host app would inherit whatever that app happens to use. Figma
    // specifies the family as much as the size, so the root states it and children inherit.
    'font-sans',
    'rounded-xl bg-semantic-bg-primary',
    // Gray (Light mode)/50. No border-* semantic token resolves to it — see the
    // documented exceptions in token-usage.policy.ts.
    'inset-ring inset-ring-gray-light-50',
    'shadow-elevation-2',
    // Figma publishes no focus state for Search Bar. This is the library's shared
    // indicator rather than a treatment invented for this component: the alternative
    // is the browser's own ring, which is a differently-coloured rectangle in every
    // engine and ignores the 12px radius. It sits on the container, driven by
    // `focus-within`, so it traces the bar rather than the input inside it — the same
    // arrangement Input uses.
    'focus-within:ring-2 focus-within:ring-semantic-focus-ring',
    'focus-within:ring-offset-2 focus-within:ring-offset-semantic-bg-primary',
  ],
  {
    variants: {
      device: {
        // Mobile is the only device with asymmetric padding.
        mobile: 'px-semantic-xl py-semantic-lg',
        'desktop-1280': 'p-semantic-lg',
        'desktop-1920': 'p-semantic-xl',
      },
    },
    defaultVariants: { device: 'mobile' },
  },
);

/**
 * The row inside the container: icon, field, and the clear button at Filled.
 *
 * Figma's Content is `flex: 1 0 0` with `min-width: 1px` — the min-width is what lets
 * the value truncate instead of forcing the row wider. Its gap follows no ramp shared
 * with anything else: 6 / 8 / 12.
 */
export const searchBarContentVariants = defineVariants('flex min-w-px flex-1 items-center', {
  variants: {
    device: {
      mobile: 'gap-semantic-sm',
      'desktop-1280': 'gap-semantic-md',
      'desktop-1920': 'gap-semantic-lg',
    },
  },
  defaultVariants: { device: 'mobile' },
});

/**
 * The leading `search-01` box.
 *
 * `brand/600` in **both** states — Figma does not dim it when the field fills. 28px at
 * 1920 has no token: it is `spacing-7`, and the scale runs 6 (24) to 8 (32) with no 7
 * step.
 */
export const searchBarSearchIconVariants = defineVariants(
  'inline-flex shrink-0 items-center justify-center text-semantic-fg-brand-primary *:size-full',
  {
    variants: {
      device: {
        mobile: 'size-semantic-2xl',
        'desktop-1280': 'size-semantic-3xl',
        'desktop-1920': 'size-[28px]',
      },
    },
    defaultVariants: { device: 'mobile' },
  },
);

/**
 * The trailing `cancel-01` button, present only at Filled.
 *
 * `gray-light-mode/900`, which `fg-primary` aliases exactly. The ramp is the search
 * icon minus 4 at every device, so all three sizes are on the scale.
 *
 * `focusRing` is the shared keyboard indicator every interactive element in the library
 * carries, as Tag's close button does. It is not a Figma state — an icon-only button
 * with no visible focus is unusable by keyboard, and Figma specifies no alternative.
 */
export const searchBarClearVariants = defineVariants(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center',
    'text-semantic-fg-primary *:size-full',
    focusRing,
  ],
  {
    variants: {
      device: {
        mobile: 'size-semantic-xl',
        'desktop-1280': 'size-semantic-2xl',
        'desktop-1920': 'size-semantic-3xl',
      },
    },
    defaultVariants: { device: 'mobile' },
  },
);

/**
 * The field: the `<input>` and, while empty, the placeholder laid over it.
 *
 * Height is Figma's window height, which equals the line height at every device — 20 /
 * 24 / 28. It is fixed rather than derived so the placeholder overlay has a box to fill
 * and the word stack has a height to be clipped against.
 */
export const searchBarFieldVariants = defineVariants('relative flex min-w-px flex-1 items-center', {
  variants: {
    device: {
      mobile: 'h-semantic-2xl',
      'desktop-1280': 'h-semantic-3xl',
      'desktop-1920': 'h-[28px]',
    },
  },
  defaultVariants: { device: 'mobile' },
});

/**
 * The `<input>` itself, carrying Figma's Filled typography — Regular 400 in
 * `text-primary`.
 *
 * No native placeholder: Figma's Default state is two separately styled text elements,
 * which a `::placeholder` string cannot express, so it is drawn as an overlay instead.
 *
 * The focus indicator lives on the container, not here, so it traces the bar's radius
 * instead of a rectangle inside it — hence `outline-none` on the input itself.
 *
 * `type="search"` makes WebKit draw its own clear button, which would sit beside the
 * `cancel-01` Figma specifies. The pseudo-element reset removes the duplicate.
 */
export const searchBarInputVariants = defineVariants(
  [
    'h-full w-full min-w-px flex-1 truncate bg-transparent outline-none',
    'font-normal text-semantic-text-primary',
    'appearance-none [&::-webkit-search-cancel-button]:appearance-none',
  ],
  {
    variants: {
      device: {
        mobile: 'text-mobile-body-md',
        'desktop-1280': 'text-desktop-body-sm',
        'desktop-1920': 'text-desktop-body-md',
      },
    },
    defaultVariants: { device: 'mobile' },
  },
);

/**
 * The placeholder row — Figma's `_Search animating text`, while the field is empty.
 *
 * Light 300 in `text-secondary`, one weight and one colour below the value beside it.
 *
 * Two children, never one string: the static "Search by" and the animated stack. Figma
 * positions the stack with an absolute `left` of 70 / 81 / 102, which minus the measured
 * width of "Search by" (66 / 75 / 94) is exactly 4 / 6 / 8 — so the offset is expressed
 * as a layout gap, which holds even if Lexend Deca renders a pixel wider than Figma
 * measured.
 *
 * `pointer-events-none` so clicking the placeholder reaches the input underneath.
 */
export const searchBarPlaceholderVariants = defineVariants(
  [
    'pointer-events-none absolute inset-semantic-none flex items-center',
    'font-light text-semantic-text-secondary',
  ],
  {
    variants: {
      device: {
        mobile: 'gap-semantic-xs text-mobile-body-md',
        'desktop-1280': 'gap-semantic-sm text-desktop-body-sm',
        'desktop-1920': 'gap-semantic-md text-desktop-body-md',
      },
    },
    defaultVariants: { device: 'mobile' },
  },
);

/**
 * The static half of the placeholder: "Search by".
 *
 * Its own element, outside the clipped stack, so `showAnimatedText` and `type` cannot
 * reach it. Figma draws it at the same position in all twelve `_Search animating text`
 * variants.
 */
export const searchBarStaticTextVariants = defineVariants('shrink-0 whitespace-nowrap');

/**
 * The animated half: a one-line window onto the stack of four words.
 *
 * The window is the height of a single line, which is what makes exactly one word
 * visible at a time.
 */
export const searchBarAnimatingTextVariants = defineVariants('shrink-0 overflow-clip', {
  variants: {
    device: {
      mobile: 'h-semantic-2xl',
      'desktop-1280': 'h-semantic-3xl',
      'desktop-1920': 'h-[28px]',
    },
  },
  defaultVariants: { device: 'mobile' },
});

/**
 * The stack of all four words, which `type` offsets to select one.
 *
 * **The offset is not a class.** It is one line height plus the 4px stack gap — 24, 28 and
 * 32 per device — and it is applied by framer-motion in `components/SearchBarPlaceholder`,
 * following the frontend repo's motion layer. Expressing the same twelve positions as
 * Tailwind utilities would take nine arbitrary values (`-translate-y-[24px]` and friends),
 * each needing a documented token exception, to say what one measured number already says.
 * `MOTION.PITCH` in `constants.ts` is where those numbers live.
 *
 * Every word stays mounted at every `type` — Figma's own structure — so the offset is the
 * only thing that moves.
 */
export const searchBarAnimatingStackVariants = defineVariants('flex flex-col gap-semantic-xs');

/** One word in the stack. Exactly one line tall, which the pitch arithmetic depends on. */
export const searchBarAnimatingWordVariants = defineVariants('shrink-0 whitespace-nowrap');

export type SearchBarVariantProps = VariantProps<typeof searchBarRootVariants>;
