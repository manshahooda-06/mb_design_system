import { cn } from '@utils/cn';
import {
  topNavigationBarHeadingIconVariants,
  topNavigationBarHeadingTextVariants,
  topNavigationBarHeadingVariants,
  topNavigationBarMiddleSlotVariants,
  topNavigationBarSubHeadingVariants,
} from '../TopNavigationBar.variants';
import type { TopNavigationBarDevice, TopNavigationBarSlot } from '../types';
import type { ReactNode } from 'react';
import type { SlotClassNames } from '@/types';

export interface NavigationMiddleSlotProps {
  device: TopNavigationBarDevice;
  heading?: ReactNode;
  subHeading?: ReactNode;
  headingStartIcon?: ReactNode;
  /** Desktop only — Figma draws no trailing glyph on the mobile bar. */
  headingEndIcon?: ReactNode;
  classNames?: SlotClassNames<TopNavigationBarSlot>;
}

/**
 * Figma's `_Middle Slot`, private to TopNavigationBar.
 *
 * The one structure both bars share, and the only reason this is one component rather
 * than two. Even so it agrees on very little: the glyph is 16 on mobile and 20 on
 * desktop, the heading 14/20 against 20/28, and the sub-heading differs in size,
 * weight *and* colour — `Caption-md-Medium` in `text-secondary` on mobile,
 * `Body-sm-Light` in `text-primary` on desktop. Each is read from its own node.
 *
 * Figma's own component is a set (`Type=Heading & Sub Text`) described as the master
 * with toggles to all its atoms. Those toggles arrive here as presence: pass a heading
 * or don't. Nothing renders if neither is given, which keeps the bar's flex layout from
 * reserving a gap for an empty column.
 *
 * The trailing glyph is desktop-only because that is where Figma draws it — the mobile
 * heading row has one leading `circle` and nothing after the text.
 */
export function NavigationMiddleSlot({
  device,
  heading,
  subHeading,
  headingStartIcon,
  headingEndIcon,
  classNames,
}: NavigationMiddleSlotProps) {
  const hasHeadingRow = heading != null || headingStartIcon != null || headingEndIcon != null;
  if (!hasHeadingRow && subHeading == null) return null;

  const iconClass = topNavigationBarHeadingIconVariants({ device });

  return (
    <div className={cn(topNavigationBarMiddleSlotVariants({ device }), classNames?.middleSlot)}>
      {hasHeadingRow && (
        <div className={cn(topNavigationBarHeadingVariants(), classNames?.heading)}>
          {headingStartIcon != null && (
            <span className={iconClass} aria-hidden>
              {headingStartIcon}
            </span>
          )}
          {heading != null && (
            <span
              className={cn(
                topNavigationBarHeadingTextVariants({ device }),
                classNames?.headingText,
              )}
            >
              {heading}
            </span>
          )}
          {device === 'desktop' && headingEndIcon != null && (
            <span className={iconClass} aria-hidden>
              {headingEndIcon}
            </span>
          )}
        </div>
      )}

      {subHeading != null && (
        <span
          className={cn(topNavigationBarSubHeadingVariants({ device }), classNames?.subHeading)}
        >
          {subHeading}
        </span>
      )}
    </div>
  );
}

NavigationMiddleSlot.displayName = 'NavigationMiddleSlot';
