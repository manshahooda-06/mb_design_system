import { cn } from '@utils/cn';
import { TOOLTIP_CONSTANTS } from '../constants';
import { tooltipArrowGlyphVariants, tooltipArrowVariants } from '../Tooltip.variants';
import type { TooltipArrowPosition } from '../types';

const { ARROW } = TOOLTIP_CONSTANTS;

export interface TooltipArrowProps {
  /** Which of Figma's six arrow positions to draw. `none` renders nothing. */
  arrowPosition: TooltipArrowPosition;
  className?: string;
}

/**
 * Figma's `Tooltip` layer, private to Tooltip.
 *
 * One exported path serves all six positions. Figma ships three assets, but they
 * are the same shape: the 28-wide one is the 16-wide path translated +12px, and
 * the top variant is `rotate-180` of the bottom. Placement and rotation do the
 * rest, so there is a single source of geometry rather than three that can drift.
 *
 * The path is cropped by its `viewBox` to the 6px that protrudes. Figma instead
 * oversizes the asset and hides 2.51471px behind the bubble, which the two rounded
 * base corners live in; cropping renders identically, because that strip sits
 * behind an opaque surface either way, and it keeps the box on two exact spacing
 * tokens instead of needing an off-scale offset.
 *
 * Decorative: the tooltip's text is the content, and the arrow only says where it
 * points, so it is hidden from assistive technology.
 */
export function TooltipArrow({ arrowPosition, className }: TooltipArrowProps) {
  if (arrowPosition === 'none') return null;

  return (
    <span className={cn(tooltipArrowVariants({ arrowPosition }), className)} aria-hidden>
      <svg
        className={tooltipArrowGlyphVariants({ arrowPosition })}
        width={ARROW.WIDTH}
        height={ARROW.PROTRUSION}
        viewBox={ARROW.VIEW_BOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
      >
        <path d={ARROW.PATH} fill="currentColor" />
      </svg>
    </span>
  );
}

TooltipArrow.displayName = 'TooltipArrow';
