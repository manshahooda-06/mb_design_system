import { focusRing } from '@utils/a11y';
import { defineVariants, type VariantProps } from '@utils/variants';

/**
 * Styling for Toggle, declared as data.
 *
 * Measured from Figma `Toggle` (node 1102:4208, 64 variants):
 * `Type`(2) × `Pressed`(2) × `Size`(2) × `Text`(2) × `State`(4) — the full cross
 * product, with no gaps.
 *
 * Figma's `State` axis is not a prop. Hover and focus are CSS, and `Disabled`
 * arrives as `disabled`, so 8 rendered prop combinations × 4 CSS states cover the
 * published 64. Figma's `Type` is `variant` here, and its `Pressed` is `checked`:
 * a switch is checked, not held down, and `aria-checked` is what carries it.
 *
 * **Two rules make the geometry systematic rather than eight measured boxes:**
 *
 * 1. Thumb travel always equals the thumb's own diameter — 16 at `sm`, 20 at `md`,
 *    in both variants. So the offset is `translate-x-full`, never a length.
 * 2. The track's *content* box is always two thumbs wide and one thumb tall. The
 *    variant axis is then padding alone: 2 for `default`, 0 for `slim`.
 *
 * Together those give Figma's four measured tracks — 36×20, 44×24, 32×16, 40×20 —
 * from two size tokens and one padding value, with no arbitrary lengths and no
 * documented exceptions.
 */

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The row: control, then label and supporting text.
 *
 * `items-start`, not `items-center` — measured. Figma pins the control to the top
 * of a two-line text block (base at y=0 in a 50-tall root), so a centred control
 * would drift down by 13px at `md` as soon as supporting text is present.
 *
 * The gap is the only thing the size axis changes here: 8 at `sm`, 12 at `md`.
 *
 * Width is `w-full` rather than Figma's authored 344. That number is the instance
 * width on the canvas, not an intrinsic measurement — the text block inside it is
 * `flex-1` — so the component is built to fill. Same call as InputDropdown's root.
 */
// `font-sans` is stated, not inherited: `embed.css` ships no preflight, so in a host app
// this text would render in whatever family that app uses. See docs/Components.md.
export const toggleRootVariants = defineVariants('flex w-full items-start font-sans', {
  variants: {
    size: {
      sm: 'gap-semantic-md' /* 8 */,
      md: 'gap-semantic-lg' /* 12 */,
    },
  },
  defaultVariants: { size: 'sm' },
});

/* -------------------------------------------------------------------------- */
/* Track                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The track — the button itself.
 *
 * `box-content` is load-bearing. The track's content box is two thumbs wide by one
 * thumb tall, and padding is added *outside* it, which is what turns Figma's four
 * track sizes into two size tokens plus a padding value:
 *
 * | variant | size | content | padding | total   | Figma |
 * | ------- | ---- | ------- | ------- | ------- | ----- |
 * | default | sm   | 32 × 16 | 2       | 36 × 20 | 36×20 |
 * | default | md   | 40 × 20 | 2       | 44 × 24 | 44×24 |
 * | slim    | sm   | 32 × 16 | 0       | 32 × 16 | 32×16 |
 * | slim    | md   | 40 × 20 | 0       | 40 × 20 | 40×20 |
 *
 * 36 and 44 appear on no spacing scale, so pinning the width directly would have
 * cost two documented exceptions. This costs none.
 *
 * The stroke is an `inset-ring`, not a `border`, and here that is required rather
 * than conventional: under `box-content` a CSS border is laid out outside the
 * content box just as padding is, so a 1px border would make Slim 34×18 instead of
 * 32×16. `inset-ring` is a box-shadow and contributes nothing to layout.
 *
 * The focus ring is the shared `focusRing` — `ring-2` over `ring-offset-2` in
 * `bg-primary`, which paints Figma's measured 2px gap and 2px of visible blue. It
 * composes with the inset ring rather than fighting it: Tailwind's box-shadow slot
 * order is `inset-shadow, inset-ring, ring-offset, ring, shadow`, so the Slim
 * stroke paints inside and the focus ring outside. The elevation shadow lives on
 * the thumb, a different element, so unlike OtpInput there is no composite to
 * hand-write and no slot-ordering exception.
 */
export const toggleTrackVariants = defineVariants(
  [
    'group/toggle box-content inline-flex shrink-0 items-center rounded-full',
    'overflow-clip',
    'cursor-pointer disabled:cursor-not-allowed',
    // Tailwind's default transition list covers colours, box-shadow and transform.
    // Figma represents no transition at all — this is ours.
    'transition',
    focusRing,
  ],
  {
    variants: {
      size: {
        // Content box = one thumb tall, two thumbs wide.
        sm: 'h-semantic-xl w-semantic-4xl' /* 16 × 32 */,
        md: 'h-semantic-2xl w-semantic-5xl' /* 20 × 40 */,
      },
      variant: {
        default: 'p-semantic-xxs' /* 2 */,
        // Figma gives Slim a 1px inside stroke on the track. `inset-ring` alone is
        // the 1px width; the colour is set per state below.
        slim: 'p-semantic-none inset-ring' /* 0 */,
      },
      checked: {
        true: 'bg-semantic-bg-brand-solid',
        // Off and disabled are the same colour today — gray/100 — but they are
        // different meanings, so they read different tokens. If Figma ever
        // separates them this is already right, which is how `action-surface.ts`
        // treats the hover tokens that currently resolve to their resting value.
        false: 'bg-semantic-bg-tertiary',
      },
      disabled: { true: '', false: '' },
    },
    compoundVariants: [
      /* Hover moves the track only when it is on. Measured: with `Pressed=False`,
         Figma's `State=Hover` is byte-identical to `State=Default` in both
         variants — the only difference in the file is a cursor hint. So there is
         deliberately no `checked: false` hover rule here. */
      { checked: true, disabled: false, class: 'hover:bg-semantic-bg-brand-solid-hover' },

      /* Slim's track stroke. Present when off, absent when on — Figma drops the
         Border layer entirely on `Pressed=True`, letting the brand fill carry the
         edge. `inset-ring-transparent` rather than dropping the utility, so both
         states land in the same tailwind-merge group. */
      { variant: 'slim', checked: false, class: 'inset-ring-semantic-border-secondary' },
      { variant: 'slim', checked: true, class: 'inset-ring-transparent' },

      /* Disabled collapses the checked axis completely. Measured: every
         `Pressed=True, State=Disabled` variant is byte-identical to its
         `Pressed=False` counterpart in both variants — same gray/100 track, same
         gray/50 thumb, same Slim strokes. Only the thumb's *position* still
         follows `checked`. Declared last so it wins over the fills above. */
      { disabled: true, class: 'bg-semantic-bg-disabled hover:bg-semantic-bg-disabled' },
      { variant: 'slim', disabled: true, class: 'inset-ring-semantic-border-secondary' },
    ],
    defaultVariants: { size: 'sm', variant: 'default', checked: false, disabled: false },
  },
);

/* -------------------------------------------------------------------------- */
/* Thumb                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The knob.
 *
 * `translate-x-full` is exact, not approximate: Figma's travel is 16 at `sm` and
 * 20 at `md`, which is the thumb's own diameter in every one of the four
 * variant × size cells. A percentage translate therefore needs no size axis.
 *
 * `shadow-elevation-1` in every state. Figma binds the deprecated `uui-shadows`
 * scale here — `shadow-sm` under Default, `shadow-xs` under Slim — and Elevation
 * is the design system's only shadow foundation, so that is a Figma inconsistency
 * rather than something for this component to reproduce. The consequence is
 * recorded in the implementation report: the two variants no longer differ by
 * shadow the way the Figma file does.
 *
 * Slim's thumb carries a 1px stroke whose colour tracks state — grey when off,
 * brand when on. Figma publishes purpose-named semantic tokens for exactly this
 * (`toggle-border`, `toggle-slim-border-pressed`, `-pressed-hover`), which is the
 * strongest evidence in the file that Slim's stroke behaviour is intentional.
 * Default's thumb has no stroke in any of its 32 variants.
 */
export const toggleThumbVariants = defineVariants(
  [
    'pointer-events-none block shrink-0 rounded-full',
    'bg-semantic-bg-primary',
    'shadow-elevation-1',
    'transition',
  ],
  {
    variants: {
      size: {
        sm: 'size-semantic-xl' /* 16 */,
        md: 'size-semantic-2xl' /* 20 */,
      },
      variant: { default: '', slim: 'inset-ring' },
      checked: {
        // Travel == diameter, so this is the whole of the position logic.
        true: 'translate-x-full',
        false: 'translate-x-0',
      },
      disabled: { true: '', false: '' },
    },
    compoundVariants: [
      /* Slim's thumb stroke follows the same on/off/hover ramp as the track fill,
         through the tokens Figma names for it. The hover rule keys off the track's
         `group/toggle`, because the thumb is not the element being hovered. */
      { variant: 'slim', checked: false, class: 'inset-ring-semantic-toggle-border' },
      {
        variant: 'slim',
        checked: true,
        disabled: false,
        class: [
          'inset-ring-semantic-toggle-slim-border-pressed',
          'group-hover/toggle:inset-ring-semantic-toggle-slim-border-pressed-hover',
        ],
      },

      /* Disabled greys the thumb — the one thing that survives the collapse of the
         checked axis. `toggle-button-fg-disabled` is Figma's own name for it. */
      { disabled: true, class: 'bg-semantic-toggle-button-fg-disabled' },
      { variant: 'slim', disabled: true, class: 'inset-ring-semantic-toggle-border' },
    ],
    defaultVariants: { size: 'sm', variant: 'default', checked: false, disabled: false },
  },
);

/* -------------------------------------------------------------------------- */
/* Text                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Figma's "Text and supporting text" frame.
 *
 * `min-w-semantic-none` does the job of Tailwind's idiomatic `min-w-0`: it defeats
 * the flex-item minimum that would otherwise stop a long label wrapping. The `0`
 * spelling is a spacing primitive and the token rule forbids it, and the semantic
 * scale publishes a `none` step, so the token is both compliant and exact.
 *
 * The label/supporting gap is 0 at `sm` and 2 at `md` — measured, and one of the few
 * places the size axis is not proportional.
 */
export const toggleTextVariants = defineVariants(
  'flex min-w-semantic-none flex-1 flex-col items-start',
  {
    variants: {
      size: {
        sm: 'gap-semantic-none' /* 0 */,
        md: 'gap-semantic-xxs' /* 2 */,
      },
    },
    defaultVariants: { size: 'sm' },
  },
);

/**
 * The label. 14/20 at `sm`, 16/24 at `md`, weight 500 in both.
 *
 * Figma's size axis crosses type scales — `sm` binds the Mobile ramp and `md` the
 * Desktop one — so these token names look mismatched and are correct. Figma's
 * variable groups are `Group/Mobile/Body-md` and `Group/Desktop/Body-sm`, which are
 * exactly these two tokens.
 *
 * `break-words` reproduces Figma's `word-break: break-word` on the text node.
 */
export const toggleLabelVariants = defineVariants(
  'font-medium break-words text-semantic-text-primary',
  {
    variants: {
      size: {
        sm: 'text-mobile-body-md' /* 14/20 */,
        md: 'text-desktop-body-sm' /* 16/24 */,
      },
    },
    defaultVariants: { size: 'sm' },
  },
);

/**
 * The supporting line. Same metrics as the label at weight 400.
 *
 * Deliberately *not* dimmed when disabled: Figma leaves both text colours untouched
 * across all four states, verified by sampling rendered pixels rather than by
 * reading bindings. Recorded as a Figma inconsistency in the report — a disabled
 * Toggle reads as enabled text beside a disabled control — but reproduced as drawn.
 */
export const toggleSupportingTextVariants = defineVariants(
  'font-regular break-words text-semantic-text-secondary',
  {
    variants: {
      size: {
        sm: 'text-mobile-body-md' /* 14/20 */,
        md: 'text-desktop-body-sm' /* 16/24 */,
      },
    },
    defaultVariants: { size: 'sm' },
  },
);

export type ToggleVariantProps = VariantProps<typeof toggleTrackVariants>;
