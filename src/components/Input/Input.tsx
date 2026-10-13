'use client';
import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import type { BaseComponentProps } from '@/types';
import { ariaAttr, composeIds } from '@utils/a11y';
import { cn } from '@utils/cn';
import {
  inputContentVariants,
  inputControlVariants,
  inputElementVariants,
  inputFieldGroupVariants,
  inputHelpIconVariants,
  inputHintVariants,
  inputLabelRowVariants,
  inputLabelVariants,
  inputLeadingIconVariants,
  inputLeadingTextVariants,
  inputRequiredVariants,
  inputRootVariants,
} from './Input.variants';

/** Figma publishes `sm` and `md` only. */
export type InputSize = 'sm' | 'md';

interface InputOwnProps extends Omit<BaseComponentProps, 'children'> {
  size?: InputSize;
  /** Figma's `Destructive` axis. */
  invalid?: boolean;
  label?: ReactNode;
  /** Renders the `*` marker and sets `aria-required`. */
  required?: boolean;
  /** The hint line under the control. Turns error-coloured when `invalid`. */
  hint?: ReactNode;
  /** Trailing 16px help affordance — Figma's `helpIcon` property. */
  helpIcon?: ReactNode;
  /** Leading 20px icon — Figma's `Type="Icon leading"`. */
  leadingIcon?: ReactNode;
  /** Leading static text such as `http://` — Figma's `Type="Leading text"`. */
  leadingText?: ReactNode;
  /** Trailing control butted against the field — Figma's `Type="Trailing button"`. */
  trailingSlot?: ReactNode;
  /** Escape hatch for the outer stack; `className` targets the control. */
  classNames?: { root?: string; label?: string; control?: string; hint?: string };
}

export type InputProps = InputOwnProps &
  Omit<ComponentPropsWithoutRef<'input'>, keyof InputOwnProps | 'children'>;

/**
 * A single-line text field.
 *
 * Figma models nine `Type` values; this implements the four that need no unbuilt
 * component — `Default`, `Icon leading`, `Leading text` and `Trailing button` —
 * and derives which one applies from the slots supplied rather than an enum, so a
 * caller never states the type *and* the content that defines it.
 *
 * `Placeholder`, `Filled` and `Focused` are runtime states, never props: the
 * placeholder and value styles differ in size, weight and colour, and
 * `::placeholder` carries that difference.
 *
 * ```tsx
 * <Input label="Email" required placeholder="olivia@untitledui.com" />
 * <Input label="Website" leadingText="http://" hint="Include the protocol" />
 * <Input label="Card" invalid hint="Enter a valid number" />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = 'md',
    invalid = false,
    disabled = false,
    label,
    required = false,
    hint,
    helpIcon,
    leadingIcon,
    leadingText,
    trailingSlot,
    className,
    classNames,
    id,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;

  return (
    <div className={cn(inputRootVariants(), classNames?.root)}>
      <div className={inputFieldGroupVariants()}>
        {label && (
          <div className={inputLabelRowVariants()}>
            <label
              htmlFor={inputId}
              className={cn(inputLabelVariants({ size }), classNames?.label)}
            >
              {label}
            </label>
            {required && (
              <span className={inputRequiredVariants()} aria-hidden>
                *
              </span>
            )}
          </div>
        )}

        <div
          className={cn(
            inputControlVariants({ size, invalid, disabled }),
            // Figma gives Trailing button no right padding — the control butts
            // against the field edge — and stacks the two on separate layers.
            trailingSlot && 'pr-semantic-none py-semantic-md isolate',
            classNames?.control,
            className,
          )}
        >
          <div
            className={cn(
              inputContentVariants(),
              // Figma's Leading text type widens its Content gap from 8 to 12.
              leadingText && 'gap-semantic-lg',
            )}
          >
            {leadingIcon && (
              <span className={inputLeadingIconVariants()} aria-hidden>
                {leadingIcon}
              </span>
            )}
            {leadingText && (
              <span className={inputLeadingTextVariants({ size })}>{leadingText}</span>
            )}
            <input
              id={inputId}
              disabled={disabled}
              aria-invalid={ariaAttr(invalid)}
              aria-required={ariaAttr(required)}
              aria-describedby={composeIds(hint ? hintId : undefined)}
              className={inputElementVariants({ size })}
              {...rest}
              ref={ref}
            />
          </div>

          {helpIcon && (
            <span className={inputHelpIconVariants()} aria-hidden>
              {helpIcon}
            </span>
          )}
          {trailingSlot}
        </div>
      </div>

      {hint && (
        <p id={hintId} className={cn(inputHintVariants({ size, invalid }), classNames?.hint)}>
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
