import { cn } from '@utils/cn';
import { focusRing } from '@utils/a11y';
import {
  topNavigationBarAccountDescriptionVariants,
  topNavigationBarAccountEndIconVariants,
  topNavigationBarAccountNameVariants,
  topNavigationBarAccountVariants,
} from '../TopNavigationBar.variants';
import type { TopNavigationBarAccount, TopNavigationBarSlot } from '../types';
import type { SlotClassNames } from '@/types';

export interface NavigationAccountProps {
  account: TopNavigationBarAccount;
  classNames?: SlotClassNames<TopNavigationBarSlot>;
}

/**
 * Figma's `Account` block, private to TopNavigationBar.
 *
 * Avatar, then a name row with a chevron, then a description — 8 between the avatar and
 * the text, 4 between the name and the chevron.
 *
 * The avatar is caller-supplied and expected to be Mozaic's own: Figma nests
 * `Avatar_user` at 36 here, which is Avatar's `md`, on the grey background Avatar
 * already renders for `background="grey"`. Nothing about it is re-implemented.
 *
 * Rendered as a `button` only when the caller gives it something to do. Figma draws a
 * chevron, which implies a menu, but publishes no open state and no menu — so the
 * behaviour stays the caller's and this stays a control at most.
 */
export function NavigationAccount({ account, classNames }: NavigationAccountProps) {
  const { name, description, avatar, endIcon, onClick } = account;

  const body = (
    <>
      {avatar != null && (
        <span className={cn('shrink-0', classNames?.accountAvatar)}>{avatar}</span>
      )}
      <span className="flex flex-col items-start">
        <span className={cn(topNavigationBarAccountNameVariants(), classNames?.accountName)}>
          {name}
          {endIcon != null && (
            <span className={topNavigationBarAccountEndIconVariants()} aria-hidden>
              {endIcon}
            </span>
          )}
        </span>
        {description != null && (
          <span
            className={cn(
              topNavigationBarAccountDescriptionVariants(),
              classNames?.accountDescription,
            )}
          >
            {description}
          </span>
        )}
      </span>
    </>
  );

  if (onClick === undefined) {
    return <div className={cn(topNavigationBarAccountVariants(), classNames?.account)}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        topNavigationBarAccountVariants(),
        focusRing,
        'rounded-md text-start',
        classNames?.account,
      )}
    >
      {body}
    </button>
  );
}

NavigationAccount.displayName = 'NavigationAccount';
