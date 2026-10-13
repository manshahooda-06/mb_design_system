import { defineVariants, type VariantProps } from '@utils/variants';

/**
 * Styling for Textarea, declared as data.
 *
 * Measured from Figma `input-textarea` (node 4044:25559). Despite the family
 * resemblance, almost none of Input's control styling carries over — the two
 * differ on radius, shadow property, height, alignment, padding shape and where
 * the help icon lives. Only the token *vocabulary* is shared, so this file
 * stands alone rather than importing Input's definitions.
 *
 * Notable divergences from Input, all measured:
 *   - `md` uses `radius-md` 8, not `radius-xl` 12
 *   - the shadow is a `box-shadow` in **every** state; Input switches property
 *   - the control is `items-start`, not `items-center` — it is multiline
 *   - the help icon leads the hint row at 16/20px instead of sitting inside the
 *     control at a fixed 16px
 *   - the root gap is `spacing-sm` 6, not `spacing-xs` 4
 */

/**
 * The outermost stack.
 *
 * `isolate` reproduces Figma's own stacking context: it layers the field group
 * over the hint (z-2 / z-1) so a focused 2px border cannot be overlapped by the
 * hint row below it.
 */
// `font-sans` is stated, not inherited: `embed.css` ships no preflight, so in a host app
// this text would render in whatever family that app uses. See docs/Components.md.
export const textareaRootVariants = defineVariants(
  'isolate flex w-full flex-col items-start gap-semantic-sm font-sans',
);

/** Label over control. Figma "Input with label", gap `spacing-sm` 6, z-2. */
export const textareaFieldGroupVariants = defineVariants(
  'relative z-2 flex w-full flex-col items-start gap-semantic-sm',
);

/**
 * Label beside the required marker.
 *
 * `items-center`, unlike Input's `items-start` — Figma centres them here.
 */
export const textareaLabelRowVariants = defineVariants('flex items-center gap-semantic-xxs');

/** The label. 14/20/500 at both sizes, from two Figma styles of equal value. */
export const textareaLabelVariants = defineVariants('font-medium text-semantic-text-primary', {
  variants: { size: { sm: 'text-mobile-body-md', md: 'text-desktop-caption-md' } },
  defaultVariants: { size: 'md' },
});

/** The required marker — `Marketing/Mobile/Caption-lg-Medium` 14/20/500 at both sizes. */
export const textareaRequiredVariants = defineVariants(
  'text-mobile-body-md font-medium text-semantic-text-error-secondary',
);

/**
 * The bordered control.
 *
 * Height is **fixed**, not min-height, hug or content-driven: Figma pins
 * `h-[120px]`/`h-[132px]`, sets the text child to `h-full` and clips the frame.
 * Neither value is bound to a variable, so both are recorded in
 * `DOCUMENTED_EXCEPTIONS`.
 *
 * The stroke is an `inset-ring` rather than a `border` for the same reason as
 * Button and Input: Figma strokes are inside-aligned, so the frame stays 120/132
 * whether the stroke is 1px or the focused 2px, while a CSS border would add to
 * the box.
 *
 * `overflow-clip` matches Figma's own clipping on this frame. The scrolling that
 * a real multiline control needs happens on the `<textarea>` inside it.
 */
export const textareaControlVariants = defineVariants(
  [
    'flex w-full items-start gap-semantic-md overflow-clip',
    'bg-semantic-bg-primary',
    'inset-ring inset-ring-semantic-border-primary',
    'shadow-elevation-1',
    'transition',
    // Focus is the border itself; Figma defines no focus ring for Textarea.
    'focus-within:inset-ring-2 focus-within:inset-ring-semantic-border-brand-alt',
  ],
  {
    variants: {
      size: {
        // px is hardcoded at 14px in Figma at *both* sizes; py is tokenised.
        sm: 'h-[120px] px-[14px] py-semantic-lg rounded-md',
        md: 'h-[132px] px-[14px] py-semantic-lg rounded-md',
      },
      invalid: {
        // Figma binds Colors/error/600. No semantic border token carries that
        // value; fg-error-primary is deliberately not substituted for it.
        true: 'inset-ring-error-600 focus-within:inset-ring-error-600',
      },
      disabled: { true: 'bg-semantic-bg-disabled-subtle' },
    },
    defaultVariants: { size: 'md' },
  },
);

/**
 * The `<textarea>` itself.
 *
 * Placeholder and value differ in size, weight and colour — and at `md` in line
 * height too, 20 against 24. A single element carries one font, so the
 * placeholder half goes through `::placeholder`, which accepts font properties.
 *
 * `resize-none` because Figma shows no resize handle. `h-full` because the
 * control's height is fixed and the text fills it, which is also what makes the
 * textarea itself the scroll container.
 */
export const textareaElementVariants = defineVariants(
  [
    'h-full min-w-px flex-1 bg-transparent font-normal text-semantic-text-primary',
    'resize-none outline-none',
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

/**
 * The hint row.
 *
 * Unlike Input, the help icon lives here rather than inside the control, and it
 * scales with size — 16px at sm, 20px at md. Figma's gap is a raw 4px; that is
 * exactly `spacing-xs`, so the token is used and no exception is needed.
 */
export const textareaHintRowVariants = defineVariants(
  'relative z-1 flex w-full items-center gap-semantic-xs',
);

/** The help icon box. 16px at sm, 20px at md — Figma scales this one. */
export const textareaHintIconVariants = defineVariants(
  'inline-flex shrink-0 items-center justify-center *:size-full',
  {
    variants: { size: { sm: 'size-semantic-xl', md: 'size-semantic-2xl' } },
    defaultVariants: { size: 'md' },
  },
);

/** The hint text. Turns error-coloured when the field is invalid. */
export const textareaHintVariants = defineVariants('font-normal', {
  variants: {
    size: { sm: 'text-mobile-body-sm', md: 'text-desktop-caption-md' },
    invalid: {
      true: 'text-semantic-text-error-primary',
      false: 'text-semantic-text-quaternary',
    },
  },
  defaultVariants: { size: 'md', invalid: false },
});

export type TextareaVariantProps = VariantProps<typeof textareaControlVariants>;
