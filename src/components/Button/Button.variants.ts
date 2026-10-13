import { defineVariants, type VariantProps } from '@utils/variants';
import {
  actionLoadingAxis,
  actionLoadingCompounds,
  actionSurfaceBase,
  actionSurfaceCompounds,
  actionToneAxis,
  actionVariantAxis,
} from '../action-surface';

/**
 * Styling for Button, declared as data.
 *
 * Two orthogonal axes, mirroring the Figma token structure exactly:
 *
 * - **`variant`** is emphasis — `primary` (filled), `secondary` (outlined),
 *   `tertiary` (ghost). It decides structure: whether there is a fill, a visible
 *   border, or neither.
 * - **`tone`** is intent — `default`, `color` (brand), `error`. It decides which
 *   family of colour tokens the variant draws from.
 *
 * Both axes and every colour, focus and disabled rule come from
 * `../action-surface`, shared with IconButton so an outlined destructive icon
 * button is the same colour as an outlined destructive button. What stays here
 * is what makes this a Button rather than an IconButton: the label-shaped box,
 * the size ramp and full-width.
 *
 * No height is set. Height is padding + line-height + border, all of which are
 * tokens, so the button resizes correctly with the type ramp instead of pinning
 * itself to a pixel value that no token backs.
 */
export const buttonVariants = defineVariants(
  [...actionSurfaceBase, 'font-sans font-semibold whitespace-nowrap'],
  {
    variants: {
      variant: actionVariantAxis,
      tone: actionToneAxis,
      // Measured from Figma (Buttons/Button, node 3287:427074). `md` and `lg`
      // differ only in type size — both take `spacing-xl` padding and
      // `radius-md`. The type ramp is split by breakpoint, per the component's
      // own description: xs–md are the mobile sizes, lg–2xl the desktop ones,
      // which is why `md` binds a Mobile style and `lg` a Desktop one.
      size: {
        sm: 'gap-semantic-sm px-semantic-lg py-semantic-md rounded-sm text-mobile-body-md',
        md: 'gap-semantic-sm px-semantic-xl py-semantic-md rounded-md text-mobile-body-md',
        lg: 'gap-semantic-md px-semantic-xl py-semantic-md rounded-md text-desktop-body-sm',
      },
      fullWidth: { true: 'w-full' },
      loading: actionLoadingAxis,
    },

    compoundVariants: [...actionSurfaceCompounds, ...actionLoadingCompounds],

    defaultVariants: { variant: 'primary', tone: 'default', size: 'md' },
  },
);

/**
 * The icon slot — a style slot, per the shared slot architecture.
 *
 * A fixed box that its child fills, rather than a class applied to the icon
 * itself: the slot accepts any node, so the component cannot assume the child
 * carries sizing of its own. `shrink-0` keeps the icon at its size when the
 * label is long enough to compress the row.
 *
 * Sizes follow the MB icon rule — 16px alongside the two smaller labels, 20px
 * alongside the largest — expressed in semantic spacing tokens rather than
 * pixels.
 */
export const buttonIconVariants = defineVariants(
  'inline-flex shrink-0 items-center justify-center *:size-full',
  {
    variants: {
      size: {
        sm: 'size-semantic-xl',
        md: 'size-semantic-xl',
        lg: 'size-semantic-2xl',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

/**
 * The label wrapper, mirroring Figma's "Text padding" node.
 *
 * Figma composes the vertical rhythm from two paddings, not one: the button
 * carries `spacing-md` (8px) and the label block adds `spacing-xxs` (2px) at
 * `md` and `lg`, giving 8+2+20+2+8 = 40 and 8+2+24+2+8 = 44 exactly. `sm` has
 * no inner padding, so 8+20+8 = 36.
 *
 * Reproduced as a real wrapper rather than folded into the button's own padding
 * because 10px is not a spacing token — the composition *is* how the value is
 * expressed, and flattening it would reintroduce a hardcoded number.
 */
export const buttonLabelVariants = defineVariants('inline-flex items-center justify-center', {
  variants: {
    size: {
      sm: 'py-semantic-none',
      md: 'py-semantic-xxs',
      lg: 'py-semantic-xxs',
    },
  },
  defaultVariants: { size: 'md' },
});

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
