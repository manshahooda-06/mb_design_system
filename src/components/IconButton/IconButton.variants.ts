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
 * Styling for IconButton, declared as data.
 *
 * The colour, focus and disabled rules come from `../action-surface`, shared
 * with Button — an outlined destructive icon button is the same colour as an
 * outlined destructive button, because it is the same surface in a square box.
 *
 * MB's `utility` button is exactly this: `variant="secondary"` with
 * `tone="default"`, which is why Figma publishes no `button-utility-*` family
 * for it to draw on.
 *
 * `aspect-square` rather than a width: the height already falls out of padding
 * plus icon plus border, and matching the width to it keeps the box square at
 * every size without a second set of values to keep in step.
 */
export const iconButtonVariants = defineVariants([...actionSurfaceBase, 'aspect-square'], {
  variants: {
    variant: actionVariantAxis,
    tone: actionToneAxis,
    size: {
      sm: 'p-semantic-md rounded-sm',
      md: 'p-semantic-lg rounded-md',
      lg: 'p-semantic-lg rounded-lg',
    },
    loading: actionLoadingAxis,
  },

  compoundVariants: [...actionSurfaceCompounds, ...actionLoadingCompounds],

  defaultVariants: { variant: 'secondary', tone: 'default', size: 'md' },
});

/**
 * The icon box.
 *
 * Sized in semantic spacing tokens, following the MB icon rule: 16px at the two
 * smaller sizes, 20px at the largest — the same boxes Button uses, so an icon
 * reads at the same weight whether or not it sits beside a label.
 */
export const iconButtonIconVariants = defineVariants(
  'inline-flex shrink-0 items-center justify-center *:size-full',
  {
    variants: {
      size: { sm: 'size-semantic-xl', md: 'size-semantic-xl', lg: 'size-semantic-2xl' },
    },
    defaultVariants: { size: 'md' },
  },
);

export type IconButtonVariantProps = VariantProps<typeof iconButtonVariants>;
