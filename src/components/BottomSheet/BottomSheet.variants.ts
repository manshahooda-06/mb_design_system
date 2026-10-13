import { defineVariants } from '@utils/variants';
import { focusRing } from '@utils/a11y';

/**
 * Styling for BottomSheet, declared as data.
 *
 * Measured from Figma `Bottom Sheet` (node `4751:5485`). The node publishes no variant
 * axis on the sheet itself — `header`, `leftIcon`, `showLeftIcon` and `showFooter` are
 * content and visibility. Its one enum, `type`, lives on the nested `_Footer`, and it is
 * the only variant table below: with a single published value it selects the two-action
 * layout, which is what `2 buttons` means.
 *
 * The arithmetic closes on Figma's own frames:
 *
 * - the card is `156 + 24 + 48 + 24 = 252` tall, bottom-aligned in a 780 canvas at y=528
 * - the drag handle block is `12 + 4 + 12 = 28`
 * - the header row is `20 + 8 + title` on the left and the close pinned right, 20 apart
 * - the content inset is 16 a side, so a 360 sheet gives the 328 Figma draws
 *
 * **Nothing here is behavioural.** Figma publishes no open state, no animation, no
 * backdrop dismissal, no drag-to-dismiss and no focus treatment, and this repository has
 * no overlay, portal or dialog architecture to inherit one from — `Modal` is referenced
 * in two comments as a thing that does not exist yet. So the sheet is the drawing:
 * mounting, positioning, focus and dismissal stay with the caller, the same division
 * Tooltip uses for visibility and placement.
 */

/* -------------------------------------------------------------------------- */
/* Overlay                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The scrim, and the sheet's positioning context.
 *
 * Fills whatever it is placed in rather than pinning Figma's 360 × 780, which is a phone
 * canvas: the caller decides whether that is a viewport-fixed wrapper, a device frame or
 * a story. That keeps `fixed`, `z-index` and portalling out of a component whose Figma
 * node specifies none of them — and this library has no z-index foundation to reach for
 * either, `z-index/index.ts` being an empty export.
 *
 * `bg-base-black/60` is the one colour here that is not a semantic token, and not for
 * want of looking: `bg-overlay` is the semantically right name carrying the wrong value
 * (`gray-light-900`, opaque), and no semantic token resolves to black at all — the three
 * that do are `social-icon-fg-*`, whose role is something else entirely. See the token
 * policy.
 */
export const bottomSheetVariants = defineVariants(
  'relative size-full overflow-clip bg-base-black/60',
);

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Figma's `Bottom Card`.
 *
 * Bottom-aligned and full-width. Figma writes `w-[360px]` centred inside a 360 canvas,
 * which is the same thing said twice — the card fills the scrim, so `w-full` reproduces
 * it at 360 and behaves at any other width.
 *
 * Only the top corners are rounded, at `radius-4xl`; the bottom two stay square because
 * the card sits against the edge of the screen.
 *
 * The shadow is Figma's `Drop shadow/Normal` effect style — one layer, `0 2px 8px
 * #0000000A` — and no elevation token carries it: all eight are two-layer, and the
 * nearest, `elevation-1`, pairs that offset with a 4px blur and adds a second layer. A
 * documented exception rather than a substitution.
 */
export const bottomSheetCardVariants = defineVariants([
  'absolute bottom-semantic-none left-semantic-none w-full',
  'flex flex-col items-center gap-semantic-3xl',
  'bg-semantic-bg-primary pt-semantic-none pb-semantic-3xl',
  'rounded-t-4xl overflow-clip',
  '[box-shadow:0px_2px_8px_0px_#0000000a]',
]);

/** Figma's `Top section` — the handle above the content, 4 apart. */
export const bottomSheetTopSectionVariants = defineVariants(
  'flex w-full flex-col items-start gap-semantic-xs',
);

/* -------------------------------------------------------------------------- */
/* Drag handle                                                                */
/* -------------------------------------------------------------------------- */

/** Figma's `Drag Handle` frame. 12 above and below the bar makes the block 28 tall. */
export const bottomSheetDragHandleVariants = defineVariants(
  'flex w-full flex-col items-center px-semantic-xl py-semantic-lg',
);

/**
 * The bar itself — 40 × 4, fully round.
 *
 * Both dimensions land on the semantic scale exactly (`5xl` is 40, `xs` is 4), and the
 * colour is the same `utility-gray-100` Divider reaches for, since `gray-light-100` has
 * a border-role token but this is a fill.
 *
 * **Decorative.** It is drawn because Figma draws it; nothing here makes the sheet
 * draggable, because Figma publishes no such behaviour.
 */
export const bottomSheetHandleVariants = defineVariants(
  'h-semantic-xs w-semantic-5xl shrink-0 rounded-full bg-semantic-utility-gray-100',
);

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

/** Figma's `Content` — 16 a side, and 16 between the header block and the body. */
export const bottomSheetContentVariants = defineVariants(
  'flex w-full flex-col items-start gap-semantic-xl px-semantic-xl',
);

/** Figma's `Header` — the title row over the divider, 16 apart. */
export const bottomSheetHeaderVariants = defineVariants(
  'flex w-full flex-col items-start gap-semantic-xl',
);

/** The title row: the left cluster takes the space, the close stays pinned 20 away. */
export const bottomSheetHeaderRowVariants = defineVariants(
  'flex w-full items-center gap-semantic-2xl',
);

/**
 * The icon-and-title cluster.
 *
 * `min-w-semantic-none` is what lets the title truncate: a flex child defaults to
 * `min-width: auto` and would otherwise push the close button out of the sheet rather
 * than clipping its own text.
 */
export const bottomSheetHeaderLeadVariants = defineVariants(
  'flex min-w-semantic-none flex-1 items-center gap-semantic-md',
);

/** Figma's `leftIcon` box — 20, decorative, caller-supplied. */
export const bottomSheetLeftIconVariants = defineVariants(
  'inline-flex size-semantic-2xl shrink-0 items-center justify-center *:size-full',
);

/**
 * Figma's `header` text.
 *
 * `Mobile/Heading-sm-Semibold`, 16/24 at weight 600, and one line: Figma sets
 * `white-space: nowrap` with `text-overflow: ellipsis`, so a long title truncates rather
 * than growing the sheet.
 */
export const bottomSheetTitleVariants = defineVariants(
  'min-w-semantic-none flex-1 truncate text-mobile-heading-sm font-semibold text-semantic-text-primary',
);

/**
 * The close control's box — 20 square, matching Figma's `cancel-01`.
 *
 * A real `<button>`, because Figma's own export renders one — but only the element, not
 * any behaviour behind it: no handler is published and none is invented. It takes the
 * shared focus ring, which is the one treatment here Figma does not draw, because a
 * focusable control without a visible focus state is a defect and `focusRing` is where
 * every other control in this library gets one.
 */
export const bottomSheetCloseVariants = defineVariants([
  'inline-flex size-semantic-2xl shrink-0 cursor-pointer items-center justify-center',
  'text-semantic-fg-primary *:size-full',
  focusRing,
]);

/** The body — Figma's `_Content Block Placeholder` slot, filled by the caller. */
export const bottomSheetBodyVariants = defineVariants('w-full');

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Figma's `_Footer`.
 *
 * `*:flex-1` and `*:min-w-semantic-none` are what size the actions, and they are all the
 * layout either published type needs: Figma gives every footer button `flex: 1 0 0` with
 * `min-width: 1px`, so one action spans the full 328 and two share it equally. Putting it
 * on the row rather than on the buttons means the caller passes plain `Button`s and gets
 * Figma's layout without dressing them.
 *
 * **Both `type` values resolve to the same classes, and that is what Figma draws.** Its
 * `1 button` and `2 buttons` variants have byte-identical rows — same 16 inline padding,
 * 4 block padding, 8 gap and white surface — and differ only in how many buttons sit
 * inside. The axis is still declared here rather than dropped, because it is published
 * and because it is what a reader checks the row against.
 */
export const bottomSheetFooterVariants = defineVariants(
  [
    'flex w-full items-center gap-semantic-md',
    'bg-semantic-bg-primary px-semantic-xl py-semantic-xs',
    '*:min-w-semantic-none *:flex-1',
  ],
  {
    variants: {
      /* Figma's `type`, on the footer where it belongs. `2 buttons` and `1 button`. */
      type: { 'two-buttons': '', 'one-button': '' },
    },
    defaultVariants: { type: 'two-buttons' },
  },
);
