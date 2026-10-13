import { defineVariants } from '@utils/variants';
import { focusRing } from '@utils/a11y';

/**
 * Styling for UploadModule, declared as data.
 *
 * Measured from Figma `Upload Module` (node `2180:67664`) — **6 published variants**:
 * `Size`(3) × `State`(2). All 6 are implemented.
 *
 * **The box is the shared part, and it is the whole shared part.** Size, radius and
 * stroke are identical across both states; everything inside differs. That is what makes
 * this one component with a `state` axis instead of two components — two would duplicate
 * a 3×3 table of box values, which is the opposite of the Beneficiary case, where the
 * chip and the selector shared no values at all.
 *
 * | | sm | md | lg |
 * | --- | --- | --- | --- |
 * | frame | 100 | 160 | 240 |
 * | radius | 8 | 12 | 16 |
 * | padding (Add) | 12 | 16 | 24 |
 * | gap (Add) | 8 | 12 | 12 |
 * | icon (Add) | 24 | 32 | 48 |
 * | type (Add) | 10/16 | 14/20 | 20/28 |
 * | circle (Display) | 24 | 32 | 48 |
 * | glyph (Display) | 16 | 21.333 | 32 |
 *
 * The height is pinned by the frame rather than by the content: sm's Add body is
 * `12 + 24 + 8 + 16 + 12 = 72` inside a pinned 100, so the content is centred in
 * whatever the frame gives it rather than summing to it.
 *
 * **No state axis beyond `State`.** Figma publishes no hover, focus, pressed, active,
 * selected, disabled, error, loading, progress or drag treatment for any of the 6, so
 * none appears here. The one focus ring is not a Figma state: it belongs to the
 * `<button>` this component renders only when the caller supplies a handler, and a
 * focusable control with no visible focus ring is an accessibility defect. It comes from
 * the shared `focusRing`, the same source Radio, Checkbox, Toggle and SearchBar use.
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
 * The stroke is an `inset-ring` rather than a `border`, and for the Display state that
 * is load-bearing rather than a preference. Figma's stroke is inside-aligned and paints
 * *over* the preview's outer edge; a `border` would give the preview a 98×98 content box
 * to sit in and inset the image by 1px on every side. A ring costs no layout, so the
 * preview fills the full frame and the stroke lands on top of it — which is what Figma
 * draws. `gray-light-100` has a border-role semantic token, so unlike SearchBar's and
 * Beneficiary's `gray/50` strokes this needs no colour exception.
 *
 * `relative` is for the Display state's absolutely-positioned children, and is harmless
 * in Add — Figma marks both frames the same way.
 *
 * **Deliberately not `overflow-clip`.** The clip belongs to the preview slot, not here:
 * the delete affordance is pinned across the card's top-right corner and hangs outside
 * the frame, so clipping the root would slice it off. Figma solves it the same way, with
 * the clip on a wrapper around the image and the affordances as its siblings.
 */
export const uploadModuleVariants = defineVariants(
  ['relative font-sans', 'inset-ring inset-ring-semantic-border-tertiary'],
  {
    variants: {
      size: {
        // 100 and 240 are off-scale; 160 is semantic-11xl exactly. See the token policy.
        sm: 'size-[100px] rounded-md',
        md: 'size-semantic-11xl rounded-xl',
        lg: 'size-[240px] rounded-2xl',
      },
      state: {
        add: 'flex flex-col items-center justify-center bg-semantic-bg-primary',
        // The preview supplies the surface, so no background is drawn under it.
        display: '',
      },
    },
    /*
     * Padding and gap belong to the Add body alone — Figma gives the Display frame
     * neither, because the preview is positioned rather than laid out.
     */
    compoundVariants: [
      { state: 'add', size: 'sm', class: 'gap-semantic-md p-semantic-lg' },
      { state: 'add', size: 'md', class: 'gap-semantic-lg p-semantic-xl' },
      { state: 'add', size: 'lg', class: 'gap-semantic-lg p-semantic-3xl' },
    ],
    defaultVariants: { size: 'sm', state: 'add' },
  },
);

/** Applied to the root only when `onUpload` makes it a `<button>`; see the note above. */
export const uploadModuleInteractiveVariants = defineVariants(['cursor-pointer', focusRing]);

/* -------------------------------------------------------------------------- */
/* Add                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Figma's `icon` — the upload glyph's box.
 *
 * Caller-supplied, following the convention every recognisable glyph in this library
 * already follows: Checkbox takes `checkIcon` and SearchBar takes `searchIcon` even
 * though Figma draws both. Colour reaches the glyph as `currentColor` and the box sizes
 * it through `*:size-full`, so a caller's icon needs no size or fill of its own.
 *
 * `fg-primary` rather than `text-primary`: both resolve to gray-light-900, which is the
 * `#252D38` Figma binds on the glyph's stroke, and the foreground role is the one a glyph
 * belongs to.
 */
export const uploadModuleIconVariants = defineVariants(
  'inline-flex shrink-0 items-center justify-center text-semantic-fg-primary *:size-full',
  {
    variants: {
      size: {
        sm: 'size-semantic-3xl' /* 24 */,
        md: 'size-semantic-4xl' /* 32 */,
        lg: 'size-semantic-6xl' /* 48 */,
      },
    },
    defaultVariants: { size: 'sm' },
  },
);

/**
 * Figma's `buttonName` — the label under the glyph.
 *
 * Weight is 500 at all three sizes; only the scale moves, and it crosses Figma's own
 * device namespaces to do it: `Mobile/Caption-md-Medium` at sm, then `Desktop/*` at md
 * and lg. Both tokens exist and match exactly, so the class is whichever one carries the
 * measured value — the axis is `Size`, not a device.
 *
 * Figma lets the text wrap and clips it against the frame; `break-words` reproduces its
 * `word-break: break-word`, and `overflow-hidden` the clip. Figma also sets
 * `text-overflow: ellipsis`, which has no effect on a wrapping block — it is inert CSS
 * rather than a visual, so it is not carried over.
 */
export const uploadModuleLabelVariants = defineVariants(
  'w-full overflow-hidden text-center font-medium break-words text-semantic-text-primary',
  {
    variants: {
      size: {
        sm: 'text-mobile-caption-md' /* 10/16 exact */,
        md: 'text-desktop-caption-md' /* 14/20 exact */,
        lg: 'text-desktop-body-md' /* 20/28 exact */,
      },
    },
    defaultVariants: { size: 'sm' },
  },
);

/* -------------------------------------------------------------------------- */
/* Display                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The preview's box.
 *
 * Figma fills the frame with an image and clips it to the card's radius. The clip lives
 * here rather than on the root so the delete affordance, which overhangs the corner,
 * survives — the same split Figma uses.
 *
 * `*:object-cover` is what Figma's own two exports agree on once their different source
 * aspect ratios are accounted for: lg exports as `object-cover`, while sm and md express
 * the same cover crop as a percentage offset inside a clipping wrapper.
 *
 * `pointer-events-none` is Figma's, and it also stops the image intercepting a drag or a
 * click meant for the affordances above it.
 */
export const uploadModulePreviewVariants = defineVariants(
  'pointer-events-none absolute inset-semantic-none overflow-clip *:size-full *:object-cover',
  {
    variants: {
      size: {
        sm: 'rounded-md',
        md: 'rounded-xl',
        lg: 'rounded-2xl',
      },
    },
    defaultVariants: { size: 'sm' },
  },
);

/**
 * The view and delete affordances.
 *
 * One white circle at three sizes, drawn twice. Figma scales a single 24px design by
 * 1.333 and 2, which is why the glyph is exactly two thirds of the circle at every size
 * and why the shadow has three values rather than one — see the token policy for both.
 *
 * The shadows are written as arbitrary `box-shadow` properties because no elevation
 * token carries them and none of Figma's effect styles is bound to them: the variable
 * export for this node lists colours, typography and radii only. The circles are solid
 * and fully round, so a `box-shadow` renders identically to the `drop-shadow` filter
 * Figma's exporter emits, and it is the property an element shadow belongs in.
 *
 * The view circle is centred in the card. The delete circle is pinned across the
 * top-right corner and its offsets are Figma's exact numbers, which do not agree with
 * each other: sm places its centre 1px inside the corner, md and lg 1px outside it.
 * Reproduced as drawn rather than reconciled.
 */
export const uploadModuleActionVariants = defineVariants(
  'absolute inline-flex items-center justify-center rounded-full bg-semantic-bg-primary',
  {
    variants: {
      size: {
        sm: 'size-semantic-3xl [box-shadow:0px_1px_2px_0px_#0000000a,0px_4px_5px_0px_#00000014]',
        md: 'size-semantic-4xl [box-shadow:0px_1.333px_2.667px_0px_#0000000a,0px_5.333px_6.667px_0px_#00000014]',
        lg: 'size-semantic-6xl [box-shadow:0px_2px_4px_0px_#0000000a,0px_8px_10px_0px_#00000014]',
      },
      action: {
        view: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-semantic-fg-brand-primary',
        delete: 'text-semantic-fg-error-primary',
      },
    },
    compoundVariants: [
      { action: 'delete', size: 'sm', class: '-top-[13px] -right-[11px]' },
      { action: 'delete', size: 'md', class: '-top-[17px] -right-[17px]' },
      { action: 'delete', size: 'lg', class: '-top-[25px] -right-[25px]' },
    ],
    defaultVariants: { size: 'sm', action: 'view' },
  },
);

/** Applied to an affordance only when its handler makes it a `<button>`. */
export const uploadModuleActionInteractiveVariants = defineVariants(['cursor-pointer', focusRing]);

/**
 * The glyph inside an affordance.
 *
 * Two thirds of the circle at every size, which at md is 21.333 — a scaling artifact
 * with no token behind it, carried over exactly rather than rounded. Colour arrives from
 * the affordance as `currentColor`: brand/600 on view, error/600 on delete, matching the
 * strokes Figma binds on the `eye` and `delete-02` glyphs.
 */
export const uploadModuleActionIconVariants = defineVariants(
  'inline-flex shrink-0 items-center justify-center *:size-full',
  {
    variants: {
      size: {
        sm: 'size-semantic-xl' /* 16 */,
        md: 'size-[21.333px]' /* Figma's scaled value; see the token policy. */,
        lg: 'size-semantic-4xl' /* 32 */,
      },
    },
    defaultVariants: { size: 'sm' },
  },
);
