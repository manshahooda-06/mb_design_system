import type { ComponentPropsWithRef, ElementType, MouseEvent, ReactNode } from 'react';
import type { ActionTone, ActionVariant } from '../action-surface';
import type { AsChildProps, BaseComponentProps } from '@/types';
import { ariaAttr } from '@utils/a11y';
import { Slot } from '@utils/slot';
import { iconButtonIconVariants, iconButtonVariants } from './IconButton.variants';

export type IconButtonSize = 'sm' | 'md' | 'lg';

/**
 * The tones available to a given variant. Same rule as Button — see
 * `Button.tsx` for why this is a conditional on the variant rather than a union
 * of prop shapes.
 */
type ToneFor<V extends ActionVariant> = V extends 'primary'
  ? Exclude<ActionTone, 'color'>
  : ActionTone;

interface IconButtonOwnProps extends BaseComponentProps, AsChildProps {
  size?: IconButtonSize;
  loading?: boolean;
  disabled?: boolean;
  /**
   * The accessible name. **Required.**
   *
   * An icon-only control has no text, so without this it is announced as
   * "button" and nothing else. Requiring it in the type is the only way to stop
   * that shipping — a lint rule or a doc comment gets skipped.
   */
  'aria-label': string;
  /** Announced while `loading`, replacing nothing visible. */
  loadingLabel?: string;
}

/**
 * `V` defaults to the whole union, so the bare `IconButtonProps` is the
 * permissive form a wrapper wants; the component narrows it to `'secondary'`.
 */
export type IconButtonProps<V extends ActionVariant = ActionVariant> = IconButtonOwnProps & {
  variant?: V;
  tone?: ToneFor<V>;
} & Omit<
    ComponentPropsWithRef<'button'>,
    keyof IconButtonOwnProps | 'variant' | 'tone' | 'color' | 'children'
  > & { children: ReactNode };

/** A spinner built from a border, matching Button's. */
function Spinner({ size }: { size: IconButtonSize }) {
  return (
    <span aria-hidden className={iconButtonIconVariants({ size })}>
      <span className="animate-spin rounded-full border-2 border-current border-t-transparent" />
    </span>
  );
}

/**
 * A square action control whose content is an icon.
 *
 * Same emphasis and intent axes as Button, drawing on the same tokens, so the
 * two line up in a toolbar and a destructive icon button matches a destructive
 * button. Defaults to `secondary` rather than `primary`: MB's guidance is never
 * to put an icon-only control in a primary pill, and its `utility` button — a
 * gray outline — is precisely this component's default.
 *
 * ```tsx
 * <IconButton aria-label="Close"><CloseIcon /></IconButton>
 * <IconButton aria-label="Delete" tone="error"><TrashIcon /></IconButton>
 * <IconButton aria-label="Settings" asChild><a href="/settings"><CogIcon /></a></IconButton>
 * ```
 *
 * For a control with a visible label, use Button.
 */
export function IconButton<V extends ActionVariant = 'secondary'>({
  variant = 'secondary' as V,
  tone = 'default',
  size = 'md',
  loading = false,
  disabled = false,
  loadingLabel = 'Loading',
  asChild,
  className,
  children,
  onClick,
  type,
  ...rest
}: IconButtonProps<V>) {
  const Component = (asChild ? Slot : 'button') as ElementType;
  const inert = disabled || loading;

  // See Button: a widened variant can reach primary + color at runtime, where
  // the two render identically by definition. Collapsing keeps a compound
  // matching instead of leaving the control with no colour at all.
  const resolvedTone: ActionTone = variant === 'primary' && tone === 'color' ? 'default' : tone;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (inert) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event);
  };

  return (
    <Component
      type={asChild ? undefined : (type ?? 'button')}
      disabled={asChild ? undefined : disabled}
      aria-disabled={ariaAttr(inert)}
      aria-busy={ariaAttr(loading)}
      onClick={handleClick}
      className={iconButtonVariants({ variant, tone: resolvedTone, size, loading, className })}
      {...rest}
    >
      {asChild ? (
        children
      ) : loading ? (
        <>
          <Spinner size={size} />
          <span className="sr-only">{loadingLabel}</span>
        </>
      ) : (
        <span aria-hidden className={iconButtonIconVariants({ size })}>
          {children}
        </span>
      )}
    </Component>
  );
}
