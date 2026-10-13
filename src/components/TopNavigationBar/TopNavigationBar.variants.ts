import { defineVariants } from '@utils/variants';

/**
 * Styling for TopNavigationBar, declared as data.
 *
 * Measured from Figma `Mobile Top Navigation Bar` (node `2180:49648`) and
 * `Desktop Top Navigation Bar` (node `2180:49909`).
 *
 * **These are two Figma components, not two variants of one.** Different nodes,
 * different published properties — mobile exposes five booleans, desktop exposes none
 * — and no shared children. `device` therefore selects a layout rather than retuning
 * one: almost every slot below is either mobile-only or desktop-only, and the two that
 * are shared (`_Middle Slot` and its heading row) differ on every value.
 *
 * **Neither bar has a state axis.** No hover, focus, pressed or disabled treatment
 * appears anywhere in either node, and no motion. The interactive parts get the
 * library's shared `focusRing` because they are real buttons and Figma draws no focus
 * state for them — the same deliberate deviation recorded for SearchBar.
 *
 * The height arithmetic closes on both:
 *
 * - mobile: 64 is pinned on the frame, and `semantic-7xl` is exactly 64
 * - desktop: `16 + 60 + 16 = 92`, so height is padding plus the logo box rather than a
 *   pinned frame — which is why no 92 appears here
 */

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The bar itself.
 *
 * `font-sans` because this is a text-bearing root: with no preflight in `embed.css` a
 * host application's family would otherwise be inherited straight through.
 *
 * Both shadows are exact Mozaic elevation tokens — Figma binds `shadow/elevation-1` to
 * the mobile bar and `shadow/elevation-2` to the desktop one, and both match the
 * generated foundation layer for layer. Unlike Tooltip, these are plain rectangles, so
 * a `box-shadow` is correct and no filter is needed.
 *
 * `px-[112px]` is the one padding on either bar with no token: 112 sits between
 * `semantic-9xl` (96) and `semantic-10xl` (128), and on no primitive step either.
 */
export const topNavigationBarRootVariants = defineVariants(
  ['bg-semantic-bg-primary font-sans', 'w-full'],
  {
    variants: {
      device: {
        mobile: [
          'flex h-semantic-7xl items-center gap-semantic-xl overflow-clip',
          'px-semantic-xl shadow-elevation-1',
        ],
        desktop: [
          'flex flex-col items-center justify-center',
          'px-[112px] py-semantic-xl shadow-elevation-2',
        ],
      },
    },
    defaultVariants: { device: 'mobile' },
  },
);

/** Figma's `Container`. Mobile takes the free space; desktop spans the bar. */
export const topNavigationBarContainerVariants = defineVariants('flex items-center', {
  variants: {
    device: {
      mobile: 'min-w-semantic-none flex-1 gap-semantic-md',
      desktop: 'w-full justify-center gap-semantic-6xl',
    },
  },
  defaultVariants: { device: 'mobile' },
});

/** Figma's desktop `left section` — logo, middle slot and search, 32 apart. */
export const topNavigationBarLeftSectionVariants = defineVariants(
  'flex min-w-semantic-none flex-1 items-center gap-semantic-4xl',
);

/** Figma's desktop `right section` — the two action items and the account block. */
export const topNavigationBarRightSectionVariants = defineVariants(
  'flex shrink-0 items-center justify-end gap-semantic-4xl',
);

/* -------------------------------------------------------------------------- */
/* Middle slot — Figma's `_Middle Slot`, the one shared structure             */
/* -------------------------------------------------------------------------- */

/**
 * Heading over sub-heading, 2px apart.
 *
 * Desktop caps it at 360, which Figma pins on the frame; mobile lets it take whatever
 * the row leaves. `min-w-semantic-none` on both is what lets the sub-heading actually truncate —
 * a flex child defaults to `min-width: auto` and would otherwise refuse to shrink.
 */
export const topNavigationBarMiddleSlotVariants = defineVariants(
  'flex min-w-semantic-none flex-1 flex-col items-start gap-semantic-xxs',
  {
    variants: {
      device: {
        mobile: 'h-full justify-center',
        desktop: 'max-w-[360px]',
      },
    },
    defaultVariants: { device: 'mobile' },
  },
);

/** Figma's `Heading` row — glyph, text, and on desktop a second glyph. */
export const topNavigationBarHeadingVariants = defineVariants(
  'flex w-full items-center gap-semantic-xs',
);

/**
 * The heading text.
 *
 * Mobile is `Body-md-Semibold` 14/20 and desktop `Body-md-Semibold` 20/28 — both exact
 * token matches on size and line height, with the weight arriving separately because
 * Mozaic's typography tokens carry the two metrics only.
 */
export const topNavigationBarHeadingTextVariants = defineVariants(
  'shrink-0 font-semibold whitespace-nowrap text-semantic-text-primary',
  {
    variants: {
      device: {
        mobile: 'text-mobile-body-md',
        desktop: 'text-desktop-body-md',
      },
    },
    defaultVariants: { device: 'mobile' },
  },
);

/**
 * The sub-heading.
 *
 * **The two bars disagree on more than size.** Mobile is `Caption-md-Medium` 10/16 in
 * `text-secondary`; desktop is `Body-sm-Light` 16/24 in `text-primary`. Weight, colour
 * and scale all differ, and both are read from Figma rather than derived from the
 * other. Both truncate to one line, which is what Figma draws.
 */
export const topNavigationBarSubHeadingVariants = defineVariants('w-full truncate', {
  variants: {
    device: {
      mobile: 'text-mobile-caption-md font-medium text-semantic-text-secondary',
      desktop: 'text-desktop-body-sm font-light text-semantic-text-primary',
    },
  },
  defaultVariants: { device: 'mobile' },
});

/** The glyph beside the heading — 16 on mobile, 20 on desktop, both exact tokens. */
export const topNavigationBarHeadingIconVariants = defineVariants('shrink-0', {
  variants: {
    device: {
      mobile: 'size-semantic-xl',
      desktop: 'size-semantic-2xl',
    },
  },
  defaultVariants: { device: 'mobile' },
});

/* -------------------------------------------------------------------------- */
/* Mobile                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The left action and the right slots — Figma pins all four at 24, which is
 * `semantic-3xl` exactly.
 *
 * A `button` because Figma's `_[m]Action Items` is an action, and the caller supplies
 * both the glyph and the handler. `focusRing` is the library's shared treatment: Figma
 * publishes no focus state for either bar, and shipping an unfocusable control would
 * be worse than deviating.
 */
export const topNavigationBarIconActionVariants = defineVariants([
  'inline-flex size-semantic-3xl shrink-0 items-center justify-center',
  'text-semantic-fg-primary',
]);

/**
 * Figma's `Buttons/Button` — the MERGE action, hidden by default in the design.
 *
 * **Deliberately not Mozaic's Button.** Figma pins 44 × 20 with zero padding,
 * `radius-xs` and bare brand text on a shadow; Button's smallest size resolves to 36
 * tall on `rounded-sm`, and it publishes no text-only variant. Forcing it through
 * Button would change the geometry Figma measures.
 *
 * The shadow is `uui-shadows/shadow-xs`, the **second** member of that collection to
 * appear in the library after Tooltip's `shadow-lg` — see the token policy, where the
 * cause now has two consumers and a shadows foundation would repay it.
 */
export const topNavigationBarActionButtonVariants = defineVariants([
  'inline-flex h-[20px] w-[44px] shrink-0 items-center justify-center overflow-clip',
  'gap-semantic-sm rounded-xs p-semantic-none',
  'text-mobile-body-sm font-semibold whitespace-nowrap text-semantic-text-brand-secondary',
  '[filter:drop-shadow(0_1px_1px_#171b220d)]',
]);

/* -------------------------------------------------------------------------- */
/* Desktop                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Figma's `_MB Logos` — a `172 x 44` artwork centred in a `180 x 60` box.
 *
 * The outer box is what sets the bar's 60px content height, and therefore its 92px
 * total. Neither dimension is on any scale, so all four are documented exceptions.
 */
export const topNavigationBarLogoVariants = defineVariants('relative h-[60px] w-[180px] shrink-0');

/** The artwork inside that box, centred as Figma centres it. */
export const topNavigationBarLogoArtworkVariants = defineVariants(
  'absolute top-1/2 left-1/2 h-[44px] w-[172px] -translate-x-1/2 -translate-y-1/2',
);

/**
 * Figma's desktop `Search Bar`.
 *
 * **Structurally not Mozaic's SearchBar**, and deliberately not reusing it: this is
 * `bg-secondary-subtle` with a 12px radius and a 1px inside stroke, a caret plus one
 * placeholder, and a 28px glyph on the **right**. SearchBar is white on
 * `shadow-elevation-2` with the glyph on the left and an animated two-part
 * placeholder. They share a height and a glyph size and nothing else.
 *
 * The stroke is an `inset-ring` rather than a border, and the arithmetic proves it:
 * Figma's frame is 623 wide with `20 + 583 + 20`, leaving no room for a border box.
 * `gray-light-50` has no `border-*` semantic token, which is the same gap SearchBar's
 * own container stroke already documents.
 */
export const topNavigationBarSearchVariants = defineVariants([
  'flex min-w-semantic-none flex-1 flex-col items-start',
  'rounded-xl bg-semantic-bg-secondary-subtle px-semantic-2xl py-semantic-xl',
  'inset-ring inset-ring-gray-light-50',
]);

/** The field's one row — text on the left, glyph pushed to the right. */
export const topNavigationBarSearchRowVariants = defineVariants(
  'flex w-full items-center justify-between',
);

/** Caret and placeholder, 4 apart, both on `Body-md` 20/28. */
export const topNavigationBarSearchTextVariants = defineVariants(
  'flex min-w-semantic-none flex-1 items-center gap-semantic-xs text-desktop-body-md',
);

/** Figma draws a literal `|` at 4px wide in `text-primary`. */
export const topNavigationBarSearchCaretVariants = defineVariants(
  'w-semantic-xs shrink-0 text-semantic-text-primary',
);

/** The placeholder — `Body-md-Light`, truncating. */
export const topNavigationBarSearchPlaceholderVariants = defineVariants(
  'min-w-semantic-none flex-1 truncate font-light text-semantic-text-secondary',
);

/** The 28px glyph. Same size as SearchBar's 1920 glyph, hence the same exception. */
export const topNavigationBarSearchIconVariants = defineVariants('size-[28px] shrink-0');

/**
 * Figma's `_[d]Action Items` — wallet and cart.
 *
 * No pinned height: Figma writes 36 on the wallet row, but the 36px glyph already sets
 * it and the 20px badge is shorter, so the row measures 36 either way. Leaving it to
 * the content keeps one more value off the exception list.
 *
 * The cart's badge is absolutely placed and overflows the row, which is why this is a
 * positioning context.
 */
export const topNavigationBarActionItemVariants = defineVariants(
  'relative inline-flex shrink-0 items-center',
);

/** The 36px glyph box. Figma's own icons carry their insets inside the asset. */
export const topNavigationBarActionGlyphVariants = defineVariants(
  'size-[36px] shrink-0 overflow-clip',
);

/**
 * The two badges.
 *
 * **The white stroke is a ring, not a border, and the arithmetic settles it.** Figma's
 * wallet badge measures 57 × 20 with `8 + 41 + 8 = 57`, and the cart's 25 × 20 with
 * `4 + 17 + 4 = 25` — text plus padding exactly, with no room for a 1.5px border box.
 * A CSS `border` would push them to 60 × 23. A ring paints outside the box without
 * perturbing it, which is also what makes the badge read as lifted off the glyph it
 * overlaps.
 *
 * `fg-white` is the only semantic token carrying white for a mark like this; there is
 * no `border-*` or `ring-*` white. The 1.5px width has no token because `border-width`
 * has no Figma export yet.
 *
 * Placement differs per item: the wallet's badge sits beside its glyph and overlaps it
 * by one `semantic-xl`; the cart's is pinned over the glyph's top-right corner.
 */
export const topNavigationBarBadgeVariants = defineVariants(
  [
    'inline-flex flex-col items-center justify-center',
    'rounded-full bg-semantic-bg-brand-solid ring-[1.5px] ring-semantic-fg-white',
    'text-desktop-caption-md font-semibold whitespace-nowrap text-semantic-text-white',
  ],
  {
    variants: {
      placement: {
        beside: 'px-semantic-md',
        overlay: 'absolute -top-semantic-xs left-semantic-2xl px-semantic-xs text-center',
      },
    },
    defaultVariants: { placement: 'beside' },
  },
);

/** The wallet glyph tucks under its badge by one `semantic-xl`. */
export const topNavigationBarWalletGlyphVariants = defineVariants('-me-semantic-xl');

/** Figma's `Account` — avatar and two lines of text, 8 apart. */
export const topNavigationBarAccountVariants = defineVariants(
  'inline-flex shrink-0 items-center gap-semantic-md',
);

/** The name row — `Caption-md-Semibold` 14/20 with the chevron 4 after it. */
export const topNavigationBarAccountNameVariants = defineVariants(
  'flex items-center gap-semantic-xs text-desktop-caption-md font-semibold whitespace-nowrap text-semantic-text-primary',
);

/** The second line — `Caption-md-Light` 14/20 in `text-secondary`. */
export const topNavigationBarAccountDescriptionVariants = defineVariants(
  'text-desktop-caption-md font-light whitespace-nowrap text-semantic-text-secondary',
);

/** The chevron after the account name, pinned at 16. */
export const topNavigationBarAccountEndIconVariants = defineVariants('size-semantic-xl shrink-0');
