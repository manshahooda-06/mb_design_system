import type { ComponentPropsWithRef, ElementType, MouseEvent, ReactNode } from 'react';
import type { AsChildProps, BaseComponentProps, ContentSlotProps } from '@/types';
import { ariaAttr } from '@utils/a11y';
import { Slot } from '@utils/slot';
import { buttonIconVariants, buttonLabelVariants, buttonVariants } from './Button.variants';

/** The emphasis axis: filled, outlined, ghost. */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

/** The intent axis: neutral, brand, destructive. Figma's own word for brand is `color`. */
export type ButtonTone = 'default' | 'color' | 'error';

/** Narrowed from the shared `Size` scale to the steps Button actually implements. */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * The tones available to a given variant.
 *
 * Figma defines eight of the nine pairs. `primary` + `color` is absent because
 * `button-primary-bg` already resolves to `brand-600`, so a brand-toned primary
 * would be indistinguishable from a default one.
 *
 * Written as a conditional on the variant rather than as a union of two prop
 * shapes. Both forbid the invalid literal pair, but the union also rejected
 * every *widened* variant — which is what a wrapper component, a Storybook
 * `args` object or any dynamic prop produces:
 *
 * ```tsx
 * declare const props: { variant: ButtonVariant; tone: ButtonTone };
 * <Button {...props} />   // union: error. conditional: fine.
 * ```
 *
 * With the conditional, `V` widens to the full `ButtonVariant` union, which does
 * not extend `'primary'`, so every tone is allowed — correct, because such a
 * caller may legitimately be rendering a secondary button. A literal
 * `variant="primary"` still narrows `V` and still rejects `'color'`.
 */
type ToneFor<V extends ButtonVariant> = V extends 'primary'
  ? Exclude<ButtonTone, 'color'>
  : ButtonTone;

interface ButtonOwnProps extends BaseComponentProps, AsChildProps, ContentSlotProps {
  size?: ButtonSize;
  /** Stretches to the width of the container. */
  fullWidth?: boolean;
  /**
   * Shows a spinner in place of the leading slot and blocks activation.
   *
   * Distinct from `disabled`: a loading button stays focusable, so focus is not
   * thrown back to the document when a keyboard user activates it.
   */
  loading?: boolean;
  disabled?: boolean;
  /** Announced while `loading`, for assistive technology. Rendered off-screen. */
  loadingLabel?: string;
}

/**
 * `V` defaults to the whole `ButtonVariant` union, so the bare `ButtonProps` is
 * the permissive form a wrapper component wants. The `Button` function itself
 * defaults `V` to `'primary'`, so omitting `variant` still narrows the tone.
 */
export type ButtonProps<V extends ButtonVariant = ButtonVariant> = ButtonOwnProps & {
  variant?: V;
  tone?: ToneFor<V>;
} & Omit<ComponentPropsWithRef<'button'>, keyof ButtonOwnProps | 'variant' | 'tone' | 'color'>;

/** Positioned wrapper so any node in a slot is sized and aligned identically. */
function IconSlot({ size, children }: { size: ButtonSize; children: ReactNode }) {
  return (
    <span aria-hidden className={buttonIconVariants({ size })}>
      {children}
    </span>
  );
}

/**
 * A spinner built from a border rather than an asset.
 *
 * The icon set has no published spinner and there is no `border-width`
 * foundation yet, so this uses `border-2` — a bare Tailwind value that reads no
 * token, not an arbitrary value. `border-current` inherits the label colour, so
 * it is correct on every variant and tone without a token of its own.
 */
function Spinner({ size }: { size: ButtonSize }) {
  return (
    <span aria-hidden className={buttonIconVariants({ size })}>
      <span className="animate-spin rounded-full border-2 border-current border-t-transparent" />
    </span>
  );
}

/**
 * The primary action control.
 *
 * Two orthogonal axes taken from Figma: `variant` for emphasis and `tone` for
 * intent. A destructive action is `tone="error"` at whichever emphasis suits the
 * context, rather than a separate variant — which is why filled and outlined
 * destructive buttons both fall out of the matrix without special cases.
 *
 * ```tsx
 * <Button variant="primary" size="lg" startSlot={<CheckIcon />}>Confirm</Button>
 * <Button variant="secondary" tone="error">Cancel booking</Button>
 * <Button asChild><a href="/settings">Settings</a></Button>
 * ```
 *
 * Icon-only buttons are deliberately not supported. Figma publishes no
 * `button-utility-*` tokens, and an icon with no label needs an accessible name
 * the component cannot supply for the caller.
 */
export function Button<V extends ButtonVariant = 'primary'>({
  variant = 'primary' as V,
  tone = 'default',
  size = 'md',
  fullWidth,
  loading = false,
  disabled = false,
  loadingLabel = 'Loading',
  asChild,
  className,
  startSlot,
  endSlot,
  children,
  onClick,
  type,
  ...rest
}: ButtonProps<V>) {
  const Component = (asChild ? Slot : 'button') as ElementType;
  const inert = disabled || loading;

  /**
   * A caller whose `variant` is widened can reach `primary` + `color` at
   * runtime, where the type system cannot see it. Collapsing it to `default` is
   * not a fudge: the pair is absent from Figma precisely *because* the two would
   * render identically, `button-primary-bg` already being `brand-600`. Without
   * this, no compound variant would match and the button would render with no
   * colour at all.
   */
  const resolvedTone: ButtonTone = variant === 'primary' && tone === 'color' ? 'default' : tone;

  /**
   * A loading button carries no native `disabled`, and under `asChild` neither
   * does a disabled one, since the rendered element may be an anchor. Both cases
   * still have to refuse activation, so the guard lives here rather than relying
   * on the attribute.
   */
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
      // Buttons inside a form submit it unless told otherwise, which is a
      // surprise the consumer should not have to remember. Only applies when we
      // render the element ourselves.
      type={asChild ? undefined : (type ?? 'button')}
      disabled={asChild ? undefined : disabled}
      aria-disabled={ariaAttr(inert)}
      aria-busy={ariaAttr(loading)}
      onClick={handleClick}
      className={buttonVariants({
        variant,
        tone: resolvedTone,
        size,
        fullWidth,
        loading,
        className,
      })}
      {...rest}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading ? (
            <Spinner size={size} />
          ) : (
            startSlot && <IconSlot size={size}>{startSlot}</IconSlot>
          )}
          <span className={buttonLabelVariants({ size })}>{children}</span>
          {loading && <span className="sr-only">{loadingLabel}</span>}
          {endSlot && <IconSlot size={size}>{endSlot}</IconSlot>}
        </>
      )}
    </Component>
  );
}
