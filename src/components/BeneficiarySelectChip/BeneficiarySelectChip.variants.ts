import { defineVariants } from '@utils/variants';

/**
 * Styling for BeneficiarySelectChip, declared as data.
 *
 * Measured from Figma `Beneficiary Select Chip` (node `2180:33533`) — **4 published
 * variants**: `Device`(2) × `State`(2). All 4 are implemented.
 *
 * Two things the arithmetic settles, neither obvious from the screenshot:
 *
 * - **The avatar sets the height, not the text.** `8 + 24 + 8 = 40` on mobile and
 *   `12 + 32 + 12 = 56` on desktop, against text line heights of 20 and 24. Nothing
 *   here pins a height, because Figma does not either — it falls out of the padding
 *   and whatever avatar the caller supplies.
 * - **The width is a cap, not a size.** Figma writes `max-width`, so the chip hugs its
 *   content and truncates only once it reaches 132 or 200.
 *
 * **No state axis beyond `State`.** Figma publishes no hover, focus, pressed or
 * disabled treatment for any of the 4, so none appears here — not even a focus ring,
 * because the chip renders an inert element. A caller who makes it selectable supplies
 * the control, and with it the focus treatment.
 *
 * The stroke is an `inset-ring` rather than a border, and the arithmetic proves it:
 * Figma's mobile frame is 132 wide with `8 + 24 + 8 + text + 12`, leaving no room for a
 * border box. `gray-light-50` has no `border-*` semantic token, which is the gap
 * SearchBar's container stroke already documents.
 */

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The pill.
 *
 * `font-sans` because this is a text-bearing root: with no preflight in `embed.css` a
 * host application's family would otherwise be inherited straight through.
 *
 * Padding is asymmetric on both devices — Figma insets the avatar side less than the
 * text side (`8/12` and `12/16`), which is what keeps the optical inset even once the
 * round avatar is in place. Written logically (`ps`/`pe`) so the chip mirrors under
 * right-to-left, since nothing about the design depends on physical sides.
 *
 * The selected treatment is three simultaneous changes: surface, stroke and text. The
 * fourth — the avatar's own background flipping grey to white — belongs to Avatar's
 * `background` axis and is passed through rather than restyled here.
 */
export const beneficiarySelectChipVariants = defineVariants(
  [
    'inline-flex items-center gap-semantic-md rounded-full font-sans',
    'inset-ring shadow-elevation-1',
  ],
  {
    variants: {
      device: {
        mobile: 'max-w-[132px] ps-semantic-md pe-semantic-lg py-semantic-md',
        desktop: 'max-w-[200px] ps-semantic-lg pe-semantic-xl py-semantic-lg',
      },
      selected: {
        false: 'bg-semantic-bg-primary inset-ring-gray-light-50',
        // brand/25 has no semantic alias of any role — the gap InputDropdown's selected
        // menu row already documents, and the same class.
        true: 'bg-brand-25 inset-ring-semantic-border-brand-alt',
      },
    },
    defaultVariants: { device: 'mobile', selected: false },
  },
);

/**
 * The avatar's box. Sized by whatever the caller supplies; see the prop docs.
 *
 * `inline-flex` is load-bearing, not decoration: Avatar's root is an `inline-block`, so a
 * non-flex wrapper would generate a line box around it and inherit the root's 24px
 * `line-height` plus `vertical-align: middle`'s baseline shift — measured at 25.8 for a
 * 24 avatar, which pushed the whole chip to 41.8 against Figma's 40. A flex container
 * generates no line box, so the wrapper is exactly the avatar's height. Same shape Tag's
 * icon slots use.
 */
export const beneficiarySelectChipAvatarVariants = defineVariants(
  'inline-flex shrink-0 items-center',
);

/**
 * The beneficiary's name.
 *
 * Weight is 500 on both devices and in both states; only the scale and the colour
 * move. `min-w-semantic-none` is what lets `truncate` actually bite — a flex child
 * defaults to `min-width: auto` and would otherwise refuse to shrink below its text.
 */
export const beneficiarySelectChipNameVariants = defineVariants(
  'min-w-semantic-none flex-1 truncate font-medium',
  {
    variants: {
      device: {
        mobile: 'text-mobile-body-md' /* 14/20 exact */,
        desktop: 'text-desktop-body-sm' /* 16/24 exact */,
      },
      selected: {
        false: 'text-semantic-text-primary',
        true: 'text-semantic-text-brand-tertiary' /* brand/600 */,
      },
    },
    defaultVariants: { device: 'mobile', selected: false },
  },
);
