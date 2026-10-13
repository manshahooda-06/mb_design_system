import { defineVariants } from '@utils/variants';

/**
 * Styling for BeneficiarySelector, declared as data.
 *
 * Measured from Figma `Beneficiary Selector` (node `2180:33550`) — **4 published
 * variants**: `Device`(2) × `State`(2). All 4 are implemented.
 *
 * The height arithmetic closes on both, and it is the text block rather than the avatar
 * that sets it — the opposite of BeneficiarySelectChip:
 *
 * - mobile: `20 + (20 + 4 + 20) + 20 = 84`, against a 40px avatar
 * - desktop: `32 + (28 + 8 + 24) + 32 = 124`, against a 48px avatar
 *
 * **No state axis beyond `State`.** Figma publishes no hover, focus, pressed or
 * disabled treatment for any of the 4. The only focus treatment belongs to the nested
 * Radio, which brings its own.
 *
 * **Width is not pinned.** Figma's frames are 244 and 342 wide, but those are canvas
 * widths — the same call already documented for InputDropdown's `w-[320px]`. A card in
 * a list takes the width its container gives it; the stories constrain a container to
 * Figma's numbers rather than baking them in.
 *
 * The stroke is an `inset-ring` rather than a border, and the arithmetic proves it:
 * `16 + 40 + 12 + 128 + 12 + 20 + 16 = 244` exactly, leaving no room for a border box.
 * `gray-light-50` has no `border-*` semantic token, the gap SearchBar already documents.
 */

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The card.
 *
 * `font-sans` because this is a text-bearing root: with no preflight in `embed.css` a
 * host application's family would otherwise be inherited straight through.
 *
 * `relative` and `overflow-clip` are both for the badge — it is positioned into the
 * top-right corner and its outer corner is rounded to match the card, so the clip keeps
 * it inside the radius.
 *
 * **Selected changes the stroke only.** Unlike the chip, the surface stays white; what
 * else moves is the name's weight and colour, which lives in its own variant below.
 */
export const beneficiarySelectorVariants = defineVariants(
  [
    'relative inline-flex items-center overflow-clip font-sans',
    'bg-semantic-bg-primary inset-ring shadow-elevation-1',
  ],
  {
    variants: {
      device: {
        mobile: 'gap-semantic-lg rounded-md px-semantic-xl py-semantic-2xl',
        desktop: 'gap-semantic-xl rounded-2xl px-semantic-3xl py-semantic-4xl',
      },
      selected: {
        false: 'inset-ring-gray-light-50',
        true: 'inset-ring-semantic-border-brand-alt' /* brand/600 */,
      },
    },
    defaultVariants: { device: 'mobile', selected: false },
  },
);

/** Figma's `Left Section` — avatar beside the text block, taking the free space. */
export const beneficiarySelectorLeftSectionVariants = defineVariants(
  'flex min-w-semantic-none flex-1 items-center',
  {
    variants: {
      device: {
        mobile: 'gap-semantic-lg' /* 12 */,
        desktop: 'gap-semantic-xl' /* 16 */,
      },
    },
    defaultVariants: { device: 'mobile' },
  },
);

/** The avatar's box. Sized by whatever the caller supplies; see the prop docs. */
export const beneficiarySelectorAvatarVariants = defineVariants(
  'inline-flex shrink-0 items-center',
);

/**
 * Figma's `Container` — the name over the meta row.
 *
 * The gap between them is one of the few values that is not proportional across the
 * device axis: 4 on mobile against 8 on desktop.
 */
export const beneficiarySelectorContentVariants = defineVariants(
  'flex min-w-semantic-none flex-1 flex-col items-start justify-center',
  {
    variants: {
      device: {
        mobile: 'gap-semantic-xs' /* 4 */,
        desktop: 'gap-semantic-md' /* 8 */,
      },
    },
    defaultVariants: { device: 'mobile' },
  },
);

/**
 * The beneficiary's name.
 *
 * **Selection moves weight and colour together**, which is this component's whole
 * selected treatment beyond the stroke: 500 in `text-secondary` unselected, 600 in
 * `text-primary` selected.
 *
 * Worth knowing, because it looks like an oversight and is reproduced as measured: the
 * unselected name is `text-secondary`, inherited from Figma's `Container`, where
 * BeneficiarySelectChip's equivalent is `text-primary`.
 */
export const beneficiarySelectorNameVariants = defineVariants('w-full truncate', {
  variants: {
    device: {
      mobile: 'text-mobile-body-md' /* 14/20 exact */,
      desktop: 'text-desktop-body-md' /* 20/28 exact */,
    },
    selected: {
      false: 'font-medium text-semantic-text-secondary',
      true: 'font-semibold text-semantic-text-primary',
    },
  },
  defaultVariants: { device: 'mobile', selected: false },
});

/**
 * Figma's `Self | Gender` row — relation, a separator, age and gender, 4 apart.
 *
 * Colour and weight do not move with selection; only the scale changes with device.
 */
export const beneficiarySelectorMetaVariants = defineVariants(
  'flex w-full items-center gap-semantic-xs font-regular text-semantic-text-secondary',
  {
    variants: {
      device: {
        mobile: 'text-mobile-body-sm' /* 12/20 exact */,
        desktop: 'text-desktop-body-sm' /* 16/24 exact */,
      },
    },
    defaultVariants: { device: 'mobile' },
  },
);

/** Each item in the meta row, including the separator. None of them shrinks. */
export const beneficiarySelectorMetaItemVariants = defineVariants('shrink-0');

/**
 * Figma's `Badge`.
 *
 * Pinned into the top-right corner with its outer corner rounded to the card's radius
 * and the inner one to match, which is why the two rounded corners are diagonal.
 *
 * Figma offsets it to `-1px` on both axes to sit over the 1px border. Because the
 * stroke here is an `inset-ring` — which paints inside the box and costs no layout —
 * there is no border box to cover, so the corner is `0` and the result is identical
 * without an off-scale offset.
 *
 * The horizontal padding is large for the text it holds (16 on mobile, 24 on desktop
 * against an 8px and 12px type step). That is what Figma draws.
 */
export const beneficiarySelectorBadgeVariants = defineVariants(
  [
    'absolute top-semantic-none right-semantic-none inline-flex items-start',
    'bg-semantic-bg-creative-purple font-regular text-semantic-text-purple-secondary',
  ],
  {
    variants: {
      device: {
        mobile: 'rounded-tr-md rounded-bl-md px-semantic-xl py-semantic-xxs text-mobile-caption-sm',
        desktop:
          'rounded-tr-2xl rounded-bl-2xl px-semantic-3xl py-semantic-xs text-desktop-caption-sm',
      },
    },
    defaultVariants: { device: 'mobile' },
  },
);

/** The selection control's box. Figma pins it at 20 on mobile; see the prop docs. */
export const beneficiarySelectorControlVariants = defineVariants('shrink-0');
