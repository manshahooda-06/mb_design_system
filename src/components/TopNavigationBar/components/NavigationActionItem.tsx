import { cn } from '@utils/cn';
import { focusRing } from '@utils/a11y';
import {
  topNavigationBarActionGlyphVariants,
  topNavigationBarActionItemVariants,
  topNavigationBarBadgeVariants,
  topNavigationBarWalletGlyphVariants,
} from '../TopNavigationBar.variants';
import type { TopNavigationBarActionItem, TopNavigationBarSlot } from '../types';
import type { SlotClassNames } from '@/types';

export interface NavigationActionItemProps {
  item: TopNavigationBarActionItem;
  classNames?: SlotClassNames<TopNavigationBarSlot>;
}

/**
 * Figma's `_[d]Action Items`, private to TopNavigationBar.
 *
 * One component for both desktop actions, which is Figma's own arrangement — its
 * `actionType` axis (`Wallet` | `Cart`) selects artwork and badge placement, not a
 * different structure. The artwork itself is caller-supplied, because the icon
 * foundation publishes no set yet.
 *
 * **The badge is derived, not toggled.** Figma publishes `showWalletBadge` and
 * `showCartBadge` alongside `walletAmount` and `noOfItems`; deriving visibility from
 * whether there is a value makes "a badge with nothing in it" unrepresentable, the same
 * call Avatar makes for initials and Tooltip for supporting text.
 *
 * Worth knowing when supplying artwork: Figma's own cart asset is a 30px glyph inset
 * 3px inside its 36px box, while the wallet's fills its box unevenly. Those insets
 * belong to each asset rather than to this container, which is a plain 36px square.
 */
export function NavigationActionItem({ item, classNames }: NavigationActionItemProps) {
  const { type, icon, label, badge, onClick } = item;
  const hasBadge = badge != null && badge !== '';
  // Figma's `actionType` decides where the badge sits and how much it is padded.
  const placement = type === 'wallet' ? 'beside' : 'overlay';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        topNavigationBarActionItemVariants(),
        focusRing,
        'rounded-full',
        classNames?.actionItem,
      )}
    >
      <span
        className={cn(
          topNavigationBarActionGlyphVariants(),
          // The wallet tucks under its badge; the cart's badge floats clear of it.
          placement === 'beside' && hasBadge && topNavigationBarWalletGlyphVariants(),
        )}
        aria-hidden
      >
        {icon}
      </span>

      {hasBadge && (
        <span className={cn(topNavigationBarBadgeVariants({ placement }), classNames?.badge)}>
          {badge}
        </span>
      )}
    </button>
  );
}

NavigationActionItem.displayName = 'NavigationActionItem';
