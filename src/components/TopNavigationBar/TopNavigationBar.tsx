import { forwardRef, type ComponentPropsWithRef } from 'react';
import { cn } from '@utils/cn';
import { focusRing } from '@utils/a11y';
import { MbLogo } from './assets/mb-logo';
import { NavigationAccount } from './components/NavigationAccount';
import { NavigationActionItem } from './components/NavigationActionItem';
import { NavigationMiddleSlot } from './components/NavigationMiddleSlot';
import { TOP_NAVIGATION_BAR_CONSTANTS } from './constants';
import {
  topNavigationBarActionButtonVariants,
  topNavigationBarContainerVariants,
  topNavigationBarIconActionVariants,
  topNavigationBarLeftSectionVariants,
  topNavigationBarLogoArtworkVariants,
  topNavigationBarLogoVariants,
  topNavigationBarRightSectionVariants,
  topNavigationBarRootVariants,
  topNavigationBarSearchCaretVariants,
  topNavigationBarSearchIconVariants,
  topNavigationBarSearchPlaceholderVariants,
  topNavigationBarSearchRowVariants,
  topNavigationBarSearchTextVariants,
  topNavigationBarSearchVariants,
} from './TopNavigationBar.variants';
import type { TopNavigationBarOwnProps } from './types';

const { ARIA } = TOP_NAVIGATION_BAR_CONSTANTS;

export type TopNavigationBarProps = TopNavigationBarOwnProps &
  Omit<ComponentPropsWithRef<'header'>, keyof TopNavigationBarOwnProps | 'children'>;

export type {
  TopNavigationBarDevice,
  TopNavigationBarSlot,
  TopNavigationBarAccount,
  TopNavigationBarAction,
  TopNavigationBarActionItem,
} from './types';

/**
 * The application's top navigation bar.
 *
 * Figma `Mobile Top Navigation Bar` (node `2180:49648`, 360 × 64) and
 * `Desktop Top Navigation Bar` (node `2180:49909`, 1920 × 92).
 *
 * **Two Figma components behind one prop.** They are separate nodes with different
 * published properties — mobile exposes five `*Show` booleans, desktop exposes none —
 * and they share no children: mobile has a back icon, an optional action and three
 * generic slots; desktop has a logo, a search field, two action items and an account
 * block. `device` therefore selects a layout rather than retuning one. Auto-switching
 * was rejected because it needs a breakpoint neither Figma nor the consuming
 * application defines — `breakpoints.css` is still an empty foundation and the app's
 * scale stops at 1536 with no 1920 step.
 *
 * **Presence replaces Figma's `*Show` booleans.** Figma needs a flag per slot because
 * it cannot express "absent"; here, passing the content is what shows it, which makes
 * "shown but empty" unrepresentable. Same call as Avatar's initials and Tooltip's
 * supporting text.
 *
 * **Scope is the bar only.** The Figma frame this came from also contains `_Breadcrumb`
 * and `Desktop Header` as separate sibling components; folding them in would have fused
 * three Figma components and made the breadcrumb unusable elsewhere.
 *
 * Nothing here is stateful — no menus, no sticky or scroll behaviour, no search
 * submission, because Figma publishes none of it. The module therefore needs no
 * `'use client'` and renders on the server. Callbacks exist only where Figma draws a
 * control.
 *
 * Icons are caller-supplied, following the established pattern: the icon foundation
 * publishes no set yet. The one exception is the MediBuddy logo, which ships because it
 * is brand artwork the desktop bar cannot render without.
 *
 * @example
 * <TopNavigationBar
 *   heading="Order Medicines"
 *   subHeading="Delivered in 2 hours"
 *   leftIcon={<BackIcon />}
 *   leftIconLabel="Go back"
 *   rightSlots={[<SearchIcon key="s" />, <BellIcon key="b" />]}
 * />
 *
 * @example
 * <TopNavigationBar
 *   device="desktop"
 *   heading="Heading"
 *   subHeading="This is the subtitle"
 *   searchPlaceholder="Search"
 *   searchIcon={<SearchIcon />}
 *   actionItems={[
 *     { type: 'wallet', icon: <WalletIcon />, label: 'Wallet', badge: '87586' },
 *     { type: 'cart', icon: <CartIcon />, label: 'Cart', badge: '88' },
 *   ]}
 *   account={{
 *     name: 'MediBuddy Benefits',
 *     description: 'Corporate Sponsored Account',
 *     avatar: <Avatar size="md" background="grey" name="Olivia Rhye" />,
 *   }}
 * />
 */
export const TopNavigationBar = forwardRef<HTMLElement, TopNavigationBarProps>(
  function TopNavigationBar(
    {
      device = 'mobile',
      heading,
      subHeading,
      headingStartIcon,
      headingEndIcon,
      leftIcon,
      leftIconLabel,
      action,
      rightSlots,
      logo,
      searchPlaceholder,
      searchIcon,
      actionItems,
      account,
      className,
      classNames,
      ...rest
    },
    ref,
  ) {
    const middleSlot = (
      <NavigationMiddleSlot
        device={device}
        heading={heading}
        subHeading={subHeading}
        headingStartIcon={headingStartIcon}
        headingEndIcon={headingEndIcon}
        classNames={classNames}
      />
    );

    return (
      <header
        ref={ref}
        role={ARIA.ROLE}
        className={cn(topNavigationBarRootVariants({ device }), className, classNames?.root)}
        {...rest}
      >
        {device === 'mobile' ? (
          <>
            <div
              className={cn(topNavigationBarContainerVariants({ device }), classNames?.container)}
            >
              {leftIcon != null && (
                <button
                  type="button"
                  aria-label={leftIconLabel}
                  className={cn(
                    topNavigationBarIconActionVariants(),
                    focusRing,
                    'rounded-sm',
                    classNames?.leftIcon,
                  )}
                >
                  {leftIcon}
                </button>
              )}
              {middleSlot}
            </div>

            {action != null && (
              <button
                type="button"
                onClick={action.onClick}
                className={cn(
                  topNavigationBarActionButtonVariants(),
                  focusRing,
                  classNames?.actionButton,
                )}
              >
                {action.label}
              </button>
            )}

            {rightSlots?.map((slot, index) => (
              <span
                // Slots are positionally identical boxes with no identity of their own,
                // so the index is the only stable key available.
                key={index}
                className={cn(topNavigationBarIconActionVariants(), classNames?.rightSlot)}
              >
                {slot}
              </span>
            ))}
          </>
        ) : (
          <div className={cn(topNavigationBarContainerVariants({ device }), classNames?.container)}>
            <div className={topNavigationBarLeftSectionVariants()}>
              {logo !== null && (
                <div className={cn(topNavigationBarLogoVariants(), classNames?.logo)}>
                  <div className={topNavigationBarLogoArtworkVariants()}>{logo ?? <MbLogo />}</div>
                </div>
              )}

              {middleSlot}

              {(searchPlaceholder != null || searchIcon != null) && (
                <div className={cn(topNavigationBarSearchVariants(), classNames?.search)}>
                  <div className={topNavigationBarSearchRowVariants()}>
                    <span className={topNavigationBarSearchTextVariants()}>
                      {/* Figma draws a literal caret glyph rather than a real input. */}
                      <span className={topNavigationBarSearchCaretVariants()} aria-hidden>
                        |
                      </span>
                      {searchPlaceholder != null && (
                        <span
                          className={cn(
                            topNavigationBarSearchPlaceholderVariants(),
                            classNames?.searchPlaceholder,
                          )}
                        >
                          {searchPlaceholder}
                        </span>
                      )}
                    </span>
                    {searchIcon != null && (
                      <span
                        className={cn(topNavigationBarSearchIconVariants(), classNames?.searchIcon)}
                        aria-hidden
                      >
                        {searchIcon}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={cn(topNavigationBarRightSectionVariants(), classNames?.rightSection)}>
              {actionItems?.map((item) => (
                <NavigationActionItem key={item.type} item={item} classNames={classNames} />
              ))}
              {account != null && <NavigationAccount account={account} classNames={classNames} />}
            </div>
          </div>
        )}
      </header>
    );
  },
);

TopNavigationBar.displayName = 'TopNavigationBar';
