import { defineVariants, type VariantProps } from '@utils/variants';

/**
 * Styling for Input, declared as data.
 *
 * Measured from Figma `input-textfield` (node 4044:8871, 126 variants). Unlike
 * Button, Input is a multi-node control, so its styling is split across one
 * variant definition per anatomical slot — the shared style-slot pattern.
 *
 * The two sizes are not a single scale. `md` binds spacing tokens and the Desktop
 * type ramp; `sm` binds the Mobile ramp and hardcodes its padding in Figma. Both
 * pin a fixed control height that the padding provably does not sum to. Those raw
 * values are reproduced verbatim, per the recorded decision to match Figma over
 * normalising to the scale, and are listed in `DOCUMENTED_EXCEPTIONS`.
 */

/** The outermost stack: field group over hint. Figma root, gap `spacing-xs` 4. */
// `font-sans` is stated, not inherited: `embed.css` ships no preflight, so in a host app
// this text would render in whatever family that app uses. See docs/Components.md.
export const inputRootVariants = defineVariants('flex w-full flex-col gap-semantic-xs font-sans');

/** Label over control. Figma "Input with label", gap `spacing-sm` 6. */
export const inputFieldGroupVariants = defineVariants('flex w-full flex-col gap-semantic-sm');

/** Label beside the required marker. Figma "Label wrapper", gap `spacing-xxs` 2. */
export const inputLabelRowVariants = defineVariants('flex items-start gap-semantic-xxs');

/**
 * The label.
 *
 * 14/20/500 at both sizes, but from different Figma styles —
 * `Mobile/Body-md-Medium` at sm, `Desktop/Caption-md-Medium` at md — whose values
 * are identical. Both resolve to the same repo tokens.
 */
export const inputLabelVariants = defineVariants('font-medium text-semantic-text-primary', {
  variants: {
    size: { sm: 'text-mobile-body-md', md: 'text-desktop-caption-md' },
  },
  defaultVariants: { size: 'md' },
});

/**
 * The required marker.
 *
 * Figma binds `Marketing/Mobile/Caption-lg-Medium` (14/20/500) at both sizes. That
 * style is absent from the typography export — see the Figma inconsistency list —
 * but its values are exactly `text-mobile-body-md` + `font-medium`, which the sm
 * label already uses, so no value is invented here.
 */
export const inputRequiredVariants = defineVariants(
  'text-mobile-body-md font-medium text-semantic-text-error-secondary',
);

/**
 * The bordered control.
 *
 * Height is fixed, not derived: Figma pins 44/56 on a fixed-height auto-layout
 * frame and the padding does not sum to it (10+20+10=40, 16+20+16=52).
 *
 * The 1px stroke is an `inset-ring`, not a `border`. Figma strokes are
 * inside-aligned — the frame stays 44/56 whether the stroke is 1px or the focused
 * 2px — and a CSS border would add to the box instead.
 *
 * The shadow is `shadow-elevation-1` in **every** state — the lowest level
 * Elevation publishes. The 2px border is the whole focus treatment, as it is for
 * Textarea and InputDropdown.
 */
export const inputControlVariants = defineVariants(
  [
    'flex w-full items-center',
    'bg-semantic-bg-primary',
    'inset-ring inset-ring-semantic-border-primary',
    'shadow-elevation-1',
    // Tailwind's default transition property list already covers box-shadow,
    // filter and colours. Figma specifies no transition — this is ours.
    'transition',
    // Focus is the border itself — Figma defines no focus ring for Input.
    'focus-within:inset-ring-2 focus-within:inset-ring-semantic-border-brand-alt',
    'focus-within:overflow-clip',
  ],
  {
    variants: {
      size: {
        // Raw values: Figma hardcodes sm padding and pins both heights.
        sm: 'h-[44px] px-[14px] py-[10px] gap-semantic-md rounded-md',
        md: 'h-[56px] px-semantic-lg py-semantic-xl gap-semantic-lg rounded-xl',
      },
      invalid: {
        // Figma binds Colors/error/600. No semantic border token carries that
        // value, and fg-error-primary is deliberately not substituted for it.
        true: 'inset-ring-error-600 focus-within:inset-ring-error-600',
      },
      disabled: { true: 'bg-semantic-bg-disabled-subtle' },
    },
    defaultVariants: { size: 'md' },
  },
);

/** The row inside the control. Figma "Content": fills, gap `spacing-md` 8. */
export const inputContentVariants = defineVariants([
  // Figma's Content is `flex: 1 0 0` with `min-width: 1px` — the min-width is
  // what lets the value truncate instead of forcing the row wider. `flex-1`
  // computes the same used width here, since both bases are 0.
  'flex min-w-px flex-1 items-center gap-semantic-md',
]);

/**
 * The `<input>` itself.
 *
 * Placeholder and value differ in size, weight *and* colour — 12/20/300 vs
 * 14/20/400 at sm, 14/20/300 vs 16/24/400 at md. A single element carries one
 * font, so the placeholder half is applied through `::placeholder`, which accepts
 * font properties.
 */
export const inputElementVariants = defineVariants(
  [
    'min-w-px flex-1 bg-transparent font-normal text-semantic-text-primary',
    'truncate outline-none',
    'placeholder:font-light placeholder:text-semantic-text-secondary',
    'disabled:cursor-not-allowed disabled:text-semantic-text-tertiary',
  ],
  {
    variants: {
      size: {
        sm: 'text-mobile-body-md placeholder:text-mobile-body-sm',
        md: 'text-desktop-body-sm placeholder:text-desktop-caption-md',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

/** Leading icon box. 20px at **both** sizes — Figma does not scale it. */
export const inputLeadingIconVariants = defineVariants(
  'inline-flex size-semantic-2xl shrink-0 items-center justify-center *:size-full',
);

/** Trailing help icon box. 16px at both sizes. */
export const inputHelpIconVariants = defineVariants(
  'inline-flex size-semantic-xl shrink-0 items-center justify-center *:size-full',
);

/**
 * Leading text, the only prefix Figma defines.
 *
 * 16/24/400 in `text-secondary` at md — one step larger than the placeholder
 * beside it. Figma gives this type's Content a 12px gap where Default uses 8.
 */
export const inputLeadingTextVariants = defineVariants(
  'shrink-0 font-normal text-semantic-text-secondary',
  {
    variants: { size: { sm: 'text-mobile-body-md', md: 'text-desktop-body-sm' } },
    defaultVariants: { size: 'md' },
  },
);

/** The hint line. Turns error-coloured when the field is invalid. */
export const inputHintVariants = defineVariants('w-full font-normal', {
  variants: {
    size: { sm: 'text-mobile-body-sm', md: 'text-desktop-caption-md' },
    invalid: {
      true: 'text-semantic-text-error-primary',
      false: 'text-semantic-text-quaternary',
    },
  },
  defaultVariants: { size: 'md', invalid: false },
});

export type InputVariantProps = VariantProps<typeof inputControlVariants>;
