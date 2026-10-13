import { defineVariants } from '@utils/variants';
import { focusRing } from '@utils/a11y';

/**
 * Styling for Modal, declared as data.
 *
 * Measured from Figma `Modal` (node `4792:13831`) and the nested `_Modal card`
 * (node `4792:13743`) — **6 card variants**: `type`(3) × `Device`(2), inside a scrim that
 * publishes `Device` and nothing else.
 *
 * The placement arithmetic closes on Figma's own frames: desktop centres a 400-wide card
 * in 1920 × 1080 at (760, 314), and mobile a 328-wide card in 360 × 780 at (16, 240) —
 * both exactly halfway on each axis, which is why the card is centred rather than offset.
 *
 * **Nothing here is behavioural.** Figma publishes no open state, no animation, no
 * backdrop dismissal, no focus treatment and no z-index, and this library still has no
 * overlay, portal or dialog architecture. So the modal is the drawing: the parent decides
 * when it is mounted, and `onClose` only tells it the close button was pressed.
 *
 * **The three types are three layouts.** `icon-text` has no header title and no divider;
 * `text-only` and `custom` share a titled header with a divider under it, and differ only
 * in whether the body is a paragraph or the caller's.
 */

/* -------------------------------------------------------------------------- */
/* Scrim                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The scrim, and the card's positioning context.
 *
 * Fills whatever it is placed in rather than pinning Figma's 1920 × 1080 or 360 × 780,
 * which are screen canvases: the caller decides whether that is a viewport-fixed wrapper,
 * a device frame or a story. Identical to BottomSheet's scrim, down to the colour —
 * `bg-base-black/60` is the same documented exception, because `bg-overlay` carries the
 * right name and the wrong value.
 */
export const modalVariants = defineVariants('relative size-full overflow-clip bg-base-black/60');

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Figma's `_Modal card`, centred on both axes.
 *
 * The stroke is an `inset-ring` rather than a `border`, and here that is load-bearing:
 * Figma's frame heights (452, 312, 300, 204) are auto-layout heights that its
 * inside-aligned stroke does not contribute to, so a CSS border would add 2px to every
 * card. A ring paints inside and costs no layout.
 *
 * The shadow is Figma's `shadow/elevation-4` effect style, and this library's token of
 * that name carries it exactly — both layers, `#0000001F` at (0,24) blur 60 and
 * `#0000000F` at (0,8) blur 20. No exception, unlike Toast's `Web` or BottomSheet's
 * `Drop shadow/Normal`. (Figma's generated code disagrees with its own bound style here,
 * halving both blurs; the style wins.)
 *
 * **`custom` is not width-pinned.** Figma gives `icon+text` and `text only` a fixed 400
 * and 328, and sets **no width at all** on `custom` — its 250 and 234 frames are what its
 * own placeholder happens to hug to, not a specification. Reproduced rather than
 * regularised: the card takes the width its content asks for.
 *
 * `max-w-full` is the one addition, and it is a correctness fix rather than a style
 * choice. A hugging box is sized from its content's *minimum* width, and the header's
 * heading is `truncate` — `white-space: nowrap` — so its minimum is the whole untruncated
 * line. Left uncapped, a `custom` card with a long heading measures wider than the scrim
 * and hangs off both edges (measured: 380.63 in a 360 frame). The cap makes the heading
 * truncate at the container edge, which is what Figma's fixed-width variants do.
 */
export const modalCardVariants = defineVariants(
  [
    'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-full',
    'flex flex-col items-center justify-center',
    'bg-semantic-bg-primary inset-ring inset-ring-semantic-border-tertiary',
    'rounded-2xl shadow-elevation-4',
  ],
  {
    variants: {
      device: {
        desktop: 'px-semantic-3xl py-semantic-4xl gap-semantic-5xl' /* 24 / 32 / 40 */,
        mobile: 'px-semantic-xl py-semantic-3xl gap-semantic-3xl' /* 16 / 24 / 24 */,
      },
      type: { 'icon-text': '', 'text-only': '', custom: '' },
    },
    compoundVariants: [
      /* 400 and 328 are pinned; `custom` hugs, as Figma draws it. */
      { device: 'desktop', type: 'icon-text', class: 'w-[400px]' },
      { device: 'desktop', type: 'text-only', class: 'w-[400px]' },
      { device: 'mobile', type: 'icon-text', class: 'w-[328px]' },
      { device: 'mobile', type: 'text-only', class: 'w-[328px]' },
    ],
    defaultVariants: { device: 'desktop', type: 'icon-text' },
  },
);

/**
 * Figma's `Top section` — the header block over the body.
 *
 * The gap is the one measurement that moves with both axes at once, which is why it is a
 * compound rather than a device row: mobile `icon-text` closes to 4 where the others sit
 * at 16, and desktop `custom` opens to 32 where the others sit at 24.
 */
export const modalTopSectionVariants = defineVariants('flex w-full flex-col items-start', {
  variants: {
    device: { desktop: '', mobile: '' },
    type: { 'icon-text': '', 'text-only': '', custom: '' },
  },
  compoundVariants: [
    { device: 'desktop', type: 'icon-text', class: 'gap-semantic-3xl' /* 24 */ },
    { device: 'desktop', type: 'text-only', class: 'gap-semantic-3xl' /* 24 */ },
    { device: 'desktop', type: 'custom', class: 'gap-semantic-4xl' /* 32 */ },
    { device: 'mobile', type: 'icon-text', class: 'gap-semantic-xs' /* 4 */ },
    { device: 'mobile', type: 'text-only', class: 'gap-semantic-xl' /* 16 */ },
    { device: 'mobile', type: 'custom', class: 'gap-semantic-xl' /* 16 */ },
  ],
  defaultVariants: { device: 'desktop', type: 'icon-text' },
});

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

/** Figma's `Header` — the title row over the divider. 16 on desktop, 12 on mobile. */
export const modalHeaderVariants = defineVariants('flex w-full flex-col items-start', {
  variants: {
    device: {
      desktop: 'gap-semantic-xl' /* 16 */,
      mobile: 'gap-semantic-lg' /* 12 */,
    },
  },
  defaultVariants: { device: 'desktop' },
});

/**
 * Figma's `Header+icon` row.
 *
 * `icon-text` has no title, so Figma pushes its lone close button to the end — the one
 * place the justification does any work. Figma writes it on some of the titled variants
 * too and not others (`text only` Desktop has it, `custom` Mobile does not), but there it
 * is a no-op: the `Title & icon` cluster is `flex-1` and has already taken the free space.
 * Carried only where it changes the picture.
 */
export const modalHeaderRowVariants = defineVariants('flex w-full items-center', {
  variants: {
    device: {
      desktop: 'gap-semantic-3xl' /* 24 */,
      mobile: 'gap-semantic-xl' /* 16 */,
    },
    type: { 'icon-text': 'justify-end', 'text-only': '', custom: '' },
  },
  defaultVariants: { device: 'desktop', type: 'icon-text' },
});

/** Figma's `Title & icon` cluster — the leading glyph beside the heading. */
export const modalTitleClusterVariants = defineVariants(
  'flex min-w-semantic-none flex-1 items-center justify-center',
  {
    variants: {
      device: {
        desktop: 'gap-semantic-md' /* 8 */,
        mobile: 'gap-semantic-xs' /* 4 */,
      },
    },
    defaultVariants: { device: 'desktop' },
  },
);

/**
 * Figma's `icon` box — the header's leading glyph.
 *
 * 28 on desktop is off every scale; 24 on mobile is `semantic-3xl` exactly. Caller
 * supplied, as every recognisable glyph in this library is: Figma's default here is the
 * generic stroked `circle` its icon library uses for "an icon goes here".
 */
export const modalHeaderIconVariants = defineVariants(
  'inline-flex shrink-0 items-center justify-center *:size-full',
  {
    variants: {
      device: {
        desktop: 'size-[28px]' /* off-scale; see the token policy */,
        mobile: 'size-semantic-3xl' /* 24 */,
      },
    },
    defaultVariants: { device: 'desktop' },
  },
);

/**
 * The close control's box, matching Figma's `cancel-01` — 28 on desktop, 24 on mobile.
 *
 * A real `<button>`, because Figma's own export renders one. It takes the shared focus
 * ring, the one treatment here Figma does not draw: a focusable control without a visible
 * focus state is a defect.
 */
export const modalCloseVariants = defineVariants(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center',
    'text-semantic-fg-primary *:size-full',
    focusRing,
  ],
  {
    variants: {
      device: {
        desktop: 'size-[28px]',
        mobile: 'size-semantic-3xl' /* 24 */,
      },
    },
    defaultVariants: { device: 'desktop' },
  },
);

/* -------------------------------------------------------------------------- */
/* Body                                                                       */
/* -------------------------------------------------------------------------- */

/** Figma's `Content` — 24 on a desktop `icon+text`, 12 everywhere else. */
export const modalContentVariants = defineVariants('flex w-full flex-col items-center', {
  variants: {
    device: { desktop: '', mobile: '' },
    type: { 'icon-text': '', 'text-only': '', custom: '' },
  },
  compoundVariants: [
    { device: 'desktop', type: 'icon-text', class: 'gap-semantic-3xl' /* 24 */ },
    { device: 'desktop', type: 'text-only', class: 'gap-semantic-lg' /* 12 */ },
    { device: 'mobile', type: 'icon-text', class: 'gap-semantic-lg' /* 12 */ },
    { device: 'mobile', type: 'text-only', class: 'gap-semantic-lg' /* 12 */ },
  ],
  defaultVariants: { device: 'desktop', type: 'icon-text' },
});

/**
 * Figma's `Icon` — the illustration above an `icon+text` heading.
 *
 * **Caller-supplied**, and it has to be: Figma binds no published property to this layer,
 * so the artwork there is fixed in the file and swappable only by editing it. 120 on
 * desktop is off every scale; 80 on mobile is `semantic-8xl` exactly.
 */
export const modalIllustrationVariants = defineVariants(
  'inline-flex shrink-0 items-center justify-center *:size-full',
  {
    variants: {
      device: {
        desktop: 'size-[120px]' /* off-scale; see the token policy */,
        mobile: 'size-semantic-8xl' /* 80 */,
      },
    },
    defaultVariants: { device: 'desktop' },
  },
);

/**
 * Mobile `icon+text` wraps its heading and sub-text in a `text` group, 8 apart, where
 * desktop lets the `Content` gap space them. One extra element on one variant, because
 * that is what Figma draws.
 */
export const modalTextGroupVariants = defineVariants(
  'flex w-full flex-col items-start gap-semantic-md text-center' /* 8 */,
);

/**
 * Figma's `heading`.
 *
 * Two different type steps for two different jobs: `icon+text` centres a
 * `body-md-semibold` under its illustration, while `text only` and `custom` set a
 * `heading-sm-semibold` in the header that truncates to one line so the close button
 * stays pinned.
 */
export const modalHeadingVariants = defineVariants('font-semibold text-semantic-text-primary', {
  variants: {
    device: { desktop: '', mobile: '' },
    type: { 'icon-text': 'w-full text-center', 'text-only': '', custom: '' },
  },
  compoundVariants: [
    { device: 'desktop', type: 'icon-text', class: 'text-desktop-body-md' /* 20/28 */ },
    { device: 'mobile', type: 'icon-text', class: 'text-mobile-body-md' /* 14/20 */ },
    {
      device: 'desktop',
      type: 'text-only',
      class: 'min-w-semantic-none flex-1 truncate text-desktop-heading-sm' /* 24/36 */,
    },
    {
      device: 'desktop',
      type: 'custom',
      class: 'min-w-semantic-none flex-1 truncate text-desktop-heading-sm' /* 24/36 */,
    },
    {
      device: 'mobile',
      type: 'text-only',
      class: 'min-w-semantic-none flex-1 truncate text-mobile-heading-sm' /* 16/24 */,
    },
    {
      device: 'mobile',
      type: 'custom',
      class: 'min-w-semantic-none flex-1 truncate text-mobile-heading-sm' /* 16/24 */,
    },
  ],
  defaultVariants: { device: 'desktop', type: 'icon-text' },
});

/** Figma's `subText` on `icon+text` — light, secondary, centred. */
export const modalSubTextVariants = defineVariants(
  'w-full text-center font-light text-semantic-text-secondary',
  {
    variants: {
      device: {
        desktop: 'text-desktop-body-sm' /* 16/24 */,
        mobile: 'text-mobile-body-sm' /* 12/20 */,
      },
    },
    defaultVariants: { device: 'desktop' },
  },
);

/** Figma's `text` on `text only` — regular weight, primary, and not centred. */
export const modalTextVariants = defineVariants('w-full font-normal text-semantic-text-primary', {
  variants: {
    device: {
      desktop: 'text-desktop-body-md' /* 20/28 */,
      mobile: 'text-mobile-body-md' /* 14/20 */,
    },
  },
  defaultVariants: { device: 'desktop' },
});

/** The `custom` body — Figma's `_Content Block Placeholder` slot, filled by the caller. */
export const modalBodyVariants = defineVariants('w-full');

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Figma's `_Footer`.
 *
 * 16 between the actions on both devices, and `*:flex-1` to share the width, which is how
 * Figma sizes every footer button — `flex: 1 0 0` with `min-width: 1px`. Putting it on the
 * row means the caller passes plain `Button`s and gets Figma's layout undressed.
 */
export const modalFooterVariants = defineVariants([
  'flex w-full items-start gap-semantic-xl',
  'bg-semantic-bg-primary',
  '*:min-w-semantic-none *:flex-1',
]);
