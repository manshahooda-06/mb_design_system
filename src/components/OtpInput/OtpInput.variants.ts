import { defineVariants, type VariantProps } from '@utils/variants';

/**
 * Styling for OtpInput, declared as data.
 *
 * Measured from Figma `input-OTP` (node 4092:1958, 15 variants) and the nested
 * cell set `_Mega input field base` (node 4092:1947, 5 states).
 *
 * The shape of this file follows from one finding: three of Figma's five States
 * are not field-level styles at all. `Placeholder`, `Filled` and `Focused` are
 * *compositions of per-cell state* — Focused paints cells `0…n-3` as Filled, cell
 * `n-2` as Focused and leaves cell `n-1` empty, at every length. Only `Disabled`
 * and `Error` are field-level. So the cell carries the state axis and the field
 * carries two booleans, and the OTP-level "State" is never a prop.
 *
 * There is no size axis and no required marker: Figma publishes neither.
 */

/**
 * The outermost stack: field group over hint. Figma root, gap `spacing-xs` 4.
 *
 * `inline-flex`, not the `flex w-full` Input and Textarea use — Figma's root hugs
 * its content, and its measured width (216/272/328) is the cell row's width.
 */
// `font-sans` is stated, not inherited: `embed.css` ships no preflight, so in a host app
// this text would render in whatever family that app uses. See docs/Components.md.
export const otpInputRootVariants = defineVariants(
  'inline-flex flex-col items-start gap-semantic-xs font-sans',
);

/** Label over cell row. Figma "Input with label", gap `spacing-md` 8. */
export const otpInputFieldGroupVariants = defineVariants(
  'flex w-full flex-col items-start gap-semantic-md',
);

/**
 * The label.
 *
 * `Mobile/Body-md-Medium` 14/20/500 in `text-primary`. Not dimmed when the field
 * is disabled or invalid — Figma leaves it at `text-primary` in every state.
 */
export const otpInputLabelVariants = defineVariants(
  'text-mobile-body-md font-medium text-semantic-text-primary',
);

/**
 * The row of cells. Figma "Input": hugs, gap `spacing-md` 8, `items-start`.
 *
 * `cursor-pointer` is on this frame in Placeholder, Filled and Focused and absent
 * in both Disabled and Error. Disabled is correct; Error is an authoring omission
 * — the field is still interactive — so the cursor follows `disabled` only. This
 * is the one place the implementation deliberately departs from the file.
 */
export const otpInputCellRowVariants = defineVariants('flex items-start gap-semantic-md', {
  variants: { disabled: { false: 'cursor-pointer' } },
  defaultVariants: { disabled: false },
});

/**
 * A single cell — the `<input>` itself, not a wrapper around one.
 *
 * Figma's cell is a 48×48 frame holding one centred text node, which an input
 * renders in a single element. Collapsing them is what makes `:focus` the state
 * rather than something derived: the element that has focus is the element that
 * paints the focused appearance.
 *
 * 48px comes from `spacing-semantic-6xl`, which resolves to exactly 48px, so no
 * arbitrary size is needed here — unlike Input's and Textarea's heights, none of
 * which land on the scale.
 *
 * The stroke is an `inset-ring`. Figma strokes are inside-aligned, so the cell
 * stays 48×48 at 1px *and* at the focused 2px; a CSS border would grow the box
 * and break the 8px rhythm between cells.
 *
 * The resting shadow is `shadow-elevation-1`, the lowest level Elevation publishes.
 *
 * The focused shadow has to be written out, but it reads the same token rather than
 * restating a geometry: `var(--shadow-elevation-1)` expands to both of its layers in
 * front of the two rings. Two reasons it cannot be composed from utilities instead.
 *
 * Tailwind's box-shadow slot order is
 * `inset-shadow, inset-ring, ring-offset, ring, shadow`, which puts the elevation
 * layers *behind* both rings where Figma paints them in front. The white offset
 * ring is opaque, so that ordering hides them entirely.
 *
 * And a `shadow-<color>` utility cannot sit beside an arbitrary list: it sets
 * `--tw-shadow-color`, which Tailwind substitutes into *every* layer. That once
 * repainted the white gap and the blue ring in shadow grey — a focus ring that was
 * measurably present and visually absent.
 *
 * Colour is assigned by role, not by state: `filled` and focus own the brand
 * stroke, `invalid` overrides the colour at either width, and `disabled` owns the
 * surface. Precedence falls out of declaration order — `invalid` and `disabled`
 * come last, so `cn` keeps them.
 */
export const otpInputCellVariants = defineVariants(
  [
    'size-semantic-6xl shrink-0 overflow-clip rounded-md px-semantic-md py-semantic-xxs',
    'text-mobile-heading-md text-center font-normal text-semantic-text-primary',
    'bg-semantic-bg-primary',
    'inset-ring inset-ring-semantic-border-primary',
    'shadow-elevation-1',
    'transition',
    // Figma draws the 2px stroke and the ring as one Focused state, so both sit
    // on `focus` rather than the stroke on `focus` and the ring on
    // `focus-visible`. A cell is focused because it was clicked or typed into;
    // suppressing the ring for pointer users would render something Figma does
    // not contain.
    'outline-none',
    'focus:inset-ring-2 focus:inset-ring-semantic-border-brand-alt',
    'focus:shadow-[var(--shadow-elevation-1),0_0_0_2px_var(--color-semantic-bg-primary),0_0_0_4px_var(--color-semantic-focus-ring)]',
  ],
  {
    variants: {
      /** Has a value. Figma's `Filled`: a brand stroke that survives blur. */
      filled: { true: 'inset-ring-semantic-border-brand-alt' },
      invalid: {
        // Figma binds Colors/error/600. No semantic border token carries that
        // value; fg-error-primary is deliberately not substituted for it.
        true: 'inset-ring-error-600 focus:inset-ring-error-600',
      },
      disabled: {
        // Figma's Disabled cell shows digits *and* the resting grey stroke, so the
        // stroke is restated here to win over `filled` and `invalid` — declared
        // last, which is how disabled takes the top of the precedence order. Only
        // the surface and the digit change, and the digit goes `text-quaternary`,
        // not the `text-tertiary` Input and Textarea use: their Figma binds a
        // different token.
        true: [
          'cursor-not-allowed bg-semantic-bg-disabled-subtle text-semantic-text-quaternary',
          'inset-ring-semantic-border-primary',
        ],
      },
    },
    defaultVariants: { filled: false, invalid: false, disabled: false },
  },
);

/**
 * The hint row. Figma "Hint Text": hugs, gap raw `4px`, `items-center`.
 *
 * The raw 4px is exactly `spacing-xs`, so the token is used and no exception is
 * needed — the same call made for Textarea's hint gap.
 *
 * Colour lives here rather than on the text because Figma binds the *icon fill*
 * and the hint text to the same variable, so one declaration covers both.
 */
export const otpInputHintRowVariants = defineVariants('flex items-center gap-semantic-xs', {
  variants: {
    invalid: {
      true: 'text-semantic-text-error-primary',
      false: 'text-semantic-text-quaternary',
    },
  },
  defaultVariants: { invalid: false },
});

/**
 * The hint icon box. 16px at every length — Figma does not scale it.
 *
 * Matches Input's help icon exactly; Textarea's is the one that scales.
 */
export const otpInputHintIconVariants = defineVariants(
  'inline-flex size-semantic-xl shrink-0 items-center justify-center *:size-full',
);

/** The hint text. `Mobile/Body-sm-Regular` 12/20/400; colour inherited from the row. */
export const otpInputHintVariants = defineVariants('text-mobile-body-sm font-normal');

export type OtpInputVariantProps = VariantProps<typeof otpInputCellVariants>;
