import { forwardRef, type ComponentPropsWithRef } from 'react';
import { cn } from '@utils/cn';
import { TooltipArrow } from './components/TooltipArrow';
import { TOOLTIP_CONSTANTS } from './constants';
import {
  tooltipContentVariants,
  tooltipGroupVariants,
  tooltipLabelVariants,
  tooltipRootVariants,
  tooltipSupportingTextVariants,
} from './Tooltip.variants';
import type { TooltipOwnProps, TooltipArrowPosition } from './types';

const { ARIA } = TOOLTIP_CONSTANTS;

export type TooltipProps = TooltipOwnProps &
  Omit<ComponentPropsWithRef<'div'>, keyof TooltipOwnProps | 'children'>;

export type { TooltipArrowPosition, TooltipSlot } from './types';

/**
 * Where the arrow sits in document order.
 *
 * The arrow leads for the two positions that attach on the side the reading order
 * starts from, and follows for the rest. This is Figma's own child ordering — the
 * exported `Top center` lists the arrow before `Content`, and `Bottom left` after.
 */
const ARROW_LEADS: ReadonlySet<TooltipArrowPosition> = new Set(['top-center', 'left']);

/**
 * A tooltip bubble.
 *
 * Figma `Tooltip` — node `1052:489`, **14 variants**: `Supporting text`(2) ×
 * `Arrow`(7). All 14 are implemented.
 *
 * **This is the bubble, not the behaviour.** Figma publishes two properties and
 * neither is a state: there is no hover, focus, open, delay, collision or motion
 * anywhere in the component set, and no z-index. So Tooltip renders what Figma
 * draws and leaves visibility and placement to the caller, who already knows which
 * element the tooltip belongs to and where there is room for it. Inventing a
 * trigger would mean inventing an interaction the design does not specify, and
 * choosing a positioning strategy on the design system's behalf.
 *
 * Because nothing here is stateful there are no hooks, so the module carries no
 * `'use client'` directive and the component renders on the server.
 *
 * **Accessibility is a contract with the caller.** `role="tooltip"` names no
 * element by itself: it needs a trigger pointing at it with `aria-describedby`,
 * which needs an `id`. Tooltip therefore takes `id` like any DOM prop and does not
 * invent one — an `id` generated here could not be guessed by the trigger.
 *
 * @example
 * // The consumer owns visibility and placement.
 * <button aria-describedby="save-tip">Save</button>
 * {open && <Tooltip id="save-tip" arrowPosition="top-center" label="Saves your changes" />}
 *
 * @example
 * <Tooltip
 *   label="This is a tooltip"
 *   supportingText="Tooltips are used to describe or identify an element."
 *   arrowPosition="bottom-left"
 * />
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  { arrowPosition = 'none', label, supportingText, className, classNames, ...rest },
  ref,
) {
  // Figma's `Supporting text` boolean, derived so it cannot contradict the content.
  const hasSupportingText = supportingText != null && supportingText !== false;

  const labelNode = (
    <span className={cn(tooltipLabelVariants({ hasSupportingText }), classNames?.label)}>
      {label}
    </span>
  );

  const arrowNode = <TooltipArrow arrowPosition={arrowPosition} className={classNames?.arrow} />;

  return (
    <div
      ref={ref}
      role={ARIA.ROLE}
      className={cn(tooltipRootVariants({ arrowPosition }), className, classNames?.root)}
      {...rest}
    >
      {ARROW_LEADS.has(arrowPosition) && arrowNode}

      <div className={cn(tooltipContentVariants({ hasSupportingText }), classNames?.content)}>
        {hasSupportingText ? (
          <div className={cn(tooltipGroupVariants(), classNames?.group)}>
            {labelNode}
            <span className={cn(tooltipSupportingTextVariants(), classNames?.supportingText)}>
              {supportingText}
            </span>
          </div>
        ) : (
          labelNode
        )}
      </div>

      {!ARROW_LEADS.has(arrowPosition) && arrowNode}
    </div>
  );
});

Tooltip.displayName = 'Tooltip';
