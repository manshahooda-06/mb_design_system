import type { ReactNode } from 'react';
import type { BaseComponentProps, SlotClassNames } from '@/types';
import type { TOP_NAVIGATION_BAR_DEVICES } from './constants';

/**
 * Which of Figma's two bars to render.
 *
 * **These are two separate components in Figma**, not variants of one set: different
 * nodes, and different published properties — mobile exposes five booleans, desktop
 * exposes none. They also share no children. The prop exists because they are one
 * component to a consumer, and because auto-switching would need a breakpoint that
 * neither Figma nor the consuming app defines.
 */
export type TopNavigationBarDevice = (typeof TOP_NAVIGATION_BAR_DEVICES)[number];

/** Figma's layer names, mobile and desktop combined. */
export type TopNavigationBarSlot =
  | 'root'
  | 'container'
  | 'leftIcon'
  | 'middleSlot'
  | 'heading'
  | 'headingText'
  | 'subHeading'
  | 'actionButton'
  | 'rightSlot'
  | 'logo'
  | 'search'
  | 'searchPlaceholder'
  | 'searchIcon'
  | 'rightSection'
  | 'actionItem'
  | 'badge'
  | 'account'
  | 'accountAvatar'
  | 'accountName'
  | 'accountDescription';

/**
 * One of the two desktop action items — Figma's `_[d]Action Items`.
 *
 * Figma publishes `actionType` (`Wallet` | `Cart`), `walletAmount`, `noOfItems`,
 * `showWalletBadge` and `showCartBadge` on this nested component. The two badge
 * booleans are derived from whether there is a value to show, which is the same call
 * Avatar makes for `Initials (Name)` and Tooltip for `supportingText`: a boolean plus
 * a separate string can express "show a badge with nothing in it", and Figma cannot.
 *
 * The glyph is caller-supplied. Figma's wallet and cart are icon-foundation content,
 * and that foundation publishes no set yet.
 */
export interface TopNavigationBarActionItem {
  /**
   * Figma's `actionType`. Kept in Figma's own words because it selects real geometry,
   * not just artwork: the wallet's badge is a wide pill sitting beside the glyph and
   * overlapping it, while the cart's is a small pill pinned over the glyph's top-right
   * corner. Their paddings differ too — 8 against 4.
   */
  type: 'wallet' | 'cart';
  /** The 36px glyph. Required — an action item with no icon draws nothing. */
  icon: ReactNode;
  /** Announced name for the icon-only control. */
  label: string;
  /**
   * Figma's `walletAmount` / `noOfItems`. Presence draws the badge.
   *
   * A string rather than a number because Figma's values are display strings — an
   * amount may be formatted or abbreviated, and a count may read `99+`.
   */
  badge?: string;
  onClick?: () => void;
}

/** Figma's `Account` block on the desktop bar. */
export interface TopNavigationBarAccount {
  /** Figma's `MediBuddy Benefits` line. */
  name: ReactNode;
  /** Figma's `Corporate Sponsored Account` line. */
  description?: ReactNode;
  /**
   * The 36px avatar. Mozaic's Avatar is what Figma nests here (`Avatar_user` at 36),
   * so the intended value is `<Avatar size="md" background="grey" … />`.
   */
  avatar?: ReactNode;
  /** Figma's `arrow-down-01` chevron at 16. */
  endIcon?: ReactNode;
  onClick?: () => void;
}

/** Figma's mobile `Buttons/Button` — the MERGE action. */
export interface TopNavigationBarAction {
  label: ReactNode;
  onClick?: () => void;
}

export interface TopNavigationBarOwnProps extends Omit<BaseComponentProps, 'children'> {
  /** Which of Figma's two bars to render. */
  device?: TopNavigationBarDevice;

  /* ---------------------------------------------------------------------- */
  /* Shared — Figma's `_Middle Slot`, present on both bars                  */
  /* ---------------------------------------------------------------------- */

  /** Figma's `Heading`. */
  heading?: ReactNode;
  /** Figma's `Sub Heading`. Truncates to one line on both bars, as drawn. */
  subHeading?: ReactNode;
  /** The glyph before the heading — 16 on mobile, 20 on desktop. */
  headingStartIcon?: ReactNode;
  /** Desktop draws a second glyph after the heading at 20. Mobile draws none. */
  headingEndIcon?: ReactNode;

  /* ---------------------------------------------------------------------- */
  /* Mobile                                                                 */
  /* ---------------------------------------------------------------------- */

  /**
   * Figma's `Left Icon` at 24. Presence replaces Figma's `leftIconShow`.
   *
   * The nested `_[m]Action Items` publishes `actionType` (`Back` | `Placeholder`),
   * which selects artwork rather than behaviour, so the icon is caller-supplied and
   * that axis does not surface here.
   */
  leftIcon?: ReactNode;
  /** Announced name for `leftIcon`. Required whenever a left icon is given. */
  leftIconLabel?: string;
  /** Figma's `Buttons/Button`. Presence replaces `buttonShow`. */
  action?: TopNavigationBarAction;
  /**
   * Figma's `Right Slot 1/2/3` at 24 each. Presence replaces the three `*Show`
   * booleans, which exist only because Figma cannot express a list — the three slots
   * are positionally identical boxes. Rendered left to right in array order; note that
   * Figma numbers them from the right, so its `Right Slot 1` is the last entry here.
   */
  rightSlots?: ReactNode[];

  /* ---------------------------------------------------------------------- */
  /* Desktop                                                                */
  /* ---------------------------------------------------------------------- */

  /**
   * Figma's `_MB Logos`. Defaults to the shipped MediBuddy logo; pass a node to
   * replace it, or `null` to drop the slot entirely.
   */
  logo?: ReactNode | null;
  /** Figma's `Search Bar` placeholder. */
  searchPlaceholder?: ReactNode;
  /** Figma's 28px `Search` glyph, drawn at the right of the field. */
  searchIcon?: ReactNode;
  /**
   * Figma's two `_[d]Action Items` — wallet then cart, in that order.
   *
   * A list rather than named `wallet` / `cart` props: the two instances differ only in
   * artwork, badge padding and badge placement, and `actionType` is Figma's own way of
   * saying "the same component twice".
   */
  actionItems?: TopNavigationBarActionItem[];
  /** Figma's `Account` block. */
  account?: TopNavigationBarAccount;

  classNames?: SlotClassNames<TopNavigationBarSlot>;
}
