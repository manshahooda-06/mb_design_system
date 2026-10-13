import { forwardRef, type ComponentPropsWithRef } from 'react';
import { cn } from '@utils/cn';
import { dividerVariants } from './Divider.variants';
import { DIVIDER_ORIENTATIONS, DIVIDER_STYLES, DIVIDER_VARIANTS } from './constants';
import type { BaseComponentProps } from '@/types';

export type DividerOrientation = (typeof DIVIDER_ORIENTATIONS)[number];

export type DividerStyle = (typeof DIVIDER_STYLES)[number];

export type DividerVariant = (typeof DIVIDER_VARIANTS)[number];

interface DividerOwnProps extends Omit<BaseComponentProps, 'children'> {
  /**
   * Figma's `Orientation` axis.
   *
   * Sets which axis is 1px and which one fills: horizontal runs the width of its
   * container, vertical the height of its parent.
   */
  orientation?: DividerOrientation;

  /**
   * Figma's `Style` axis.
   *
   * **Shadows the native `style` attribute**, which this component therefore does not
   * accept — the name is Figma's, and a design system's rule has no business taking
   * inline CSS anyway. Use `className` for anything `style` would have carried.
   */
  style?: DividerStyle;

  /**
   * Figma's `Variant` axis — which of the two greys the line is drawn in.
   *
   * Not a semantic intent: Figma publishes `Normal` (`gray-light-100`) and `Lighter`
   * (`gray-light-50`) and nothing else, so there is no success, warning or error rule
   * here to reach for.
   */
  variant?: DividerVariant;
}

export type DividerProps = DividerOwnProps &
  Omit<ComponentPropsWithRef<'div'>, keyof DividerOwnProps | 'children'>;

/**
 * A 1px rule between things.
 *
 * Figma `Divider` — node `4725:3274`, **8 variants**: `Orientation`(2) × `Style`(2) ×
 * `Variant`(2). All 8 are implemented.
 *
 * **The whole component is one element and three axes.** There is no size, thickness,
 * colour, spacing, inset or length prop, because Figma publishes none: the line is
 * always 1px, always one of two greys, and always as long as whatever contains it.
 * Spacing around a divider belongs to the layout that places it, not to the rule itself.
 *
 * **Dashed is drawn with a gradient, not `border-dashed`.** Chrome's dashed border does
 * not match Figma's `2 2` pattern — measured side by side over 40px, Figma's gives 10
 * dashes and the border 8 — so the pattern is reproduced exactly with hard-stop
 * repeating gradients. No SVG asset is involved.
 *
 * **Presentational and non-interactive.** It carries `role="separator"`, which is the
 * meaning Figma draws, and nothing else: no focus, no handler, no state. Native props
 * spread last, so a purely decorative rule can be handed `aria-hidden` or
 * `role="presentation"` by its caller.
 *
 * Nothing here is stateful, so the module needs no `'use client'` and renders on the
 * server.
 *
 * @example
 * <Divider />
 *
 * @example
 * // Vertical rules fill their parent's height, so the parent has to have one.
 * <div className="flex h-10 items-stretch">
 *   <span>Before</span>
 *   <Divider orientation="vertical" style="dashed" variant="lighter" />
 *   <span>After</span>
 * </div>
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { orientation = 'horizontal', style = 'solid', variant = 'normal', className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role="separator"
      /*
       * `separator` is horizontal by default, so only the vertical case needs saying.
       * Stated as `undefined` rather than omitted so the attribute never appears as
       * `aria-orientation="horizontal"`, which would be noise.
       */
      aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
      className={cn(dividerVariants({ orientation, style, variant }), className)}
      {...rest}
    />
  );
});

Divider.displayName = 'Divider';
