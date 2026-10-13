'use client';
import { forwardRef, useId, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import type { BaseComponentProps } from '@/types';
import { ariaAttr, composeIds } from '@utils/a11y';
import { cn } from '@utils/cn';
import {
  textareaControlVariants,
  textareaElementVariants,
  textareaFieldGroupVariants,
  textareaHintIconVariants,
  textareaHintRowVariants,
  textareaHintVariants,
  textareaLabelRowVariants,
  textareaLabelVariants,
  textareaRequiredVariants,
  textareaRootVariants,
} from './Textarea.variants';

/** Figma publishes `sm` and `md` only. */
export type TextareaSize = 'sm' | 'md';

interface TextareaOwnProps extends Omit<BaseComponentProps, 'children'> {
  size?: TextareaSize;
  /** Figma's `Destructive` axis. */
  invalid?: boolean;
  label?: ReactNode;
  /** Renders the `*` marker and sets `aria-required`. */
  required?: boolean;
  /**
   * The hint line beneath the control, preceded by a help icon.
   *
   * Figma has no separate `helpIcon` property here — the icon belongs to the hint
   * row and appears with it, which is the opposite of Input where the icon sits
   * inside the control and is toggled independently.
   */
  hint?: ReactNode;
  /** The 16/20px glyph leading the hint. Rendered only when `hint` is present. */
  hintIcon?: ReactNode;
  classNames?: { root?: string; label?: string; control?: string; hint?: string };
}

export type TextareaProps = TextareaOwnProps &
  Omit<ComponentPropsWithoutRef<'textarea'>, keyof TextareaOwnProps | 'children'>;

/**
 * A multiline text field.
 *
 * Figma models two types, `Default` and `Tags`; this implements `Default` at both
 * sizes across all four states and both destructive values — 14 of 28 variants.
 * `Tags` is unbuilt but no longer blocked: **Tag** now exists, and Textarea's Tag
 * embeds no Avatar, so it needs only a close glyph, which Tag takes as a prop.
 *
 * The control height is **fixed** (120px at sm, 132px at md), matching Figma,
 * with the textarea filling it and scrolling internally. Figma shows no resize
 * handle, so there is none.
 *
 * `Placeholder`, `Default` (filled) and `Focused` are runtime states, never props.
 * The placeholder is smaller, lighter and a different colour from entered text —
 * and at `md` a different line height too.
 *
 * ```tsx
 * <Textarea label="Description" required placeholder="Enter a description..." />
 * <Textarea label="Description" invalid hint="This is an error message." />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    size = 'md',
    invalid = false,
    disabled = false,
    label,
    required = false,
    hint,
    hintIcon,
    className,
    classNames,
    id,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const hintId = `${textareaId}-hint`;

  return (
    <div className={cn(textareaRootVariants(), classNames?.root)}>
      <div className={textareaFieldGroupVariants()}>
        {label && (
          <div className={textareaLabelRowVariants()}>
            <label
              htmlFor={textareaId}
              className={cn(textareaLabelVariants({ size }), classNames?.label)}
            >
              {label}
            </label>
            {required && (
              <span className={textareaRequiredVariants()} aria-hidden>
                *
              </span>
            )}
          </div>
        )}

        <div
          className={cn(
            textareaControlVariants({ size, invalid, disabled }),
            classNames?.control,
            className,
          )}
        >
          <textarea
            id={textareaId}
            disabled={disabled}
            aria-invalid={ariaAttr(invalid)}
            aria-required={ariaAttr(required)}
            aria-describedby={composeIds(hint ? hintId : undefined)}
            className={textareaElementVariants({ size })}
            {...rest}
            ref={ref}
          />
        </div>
      </div>

      {hint && (
        <div className={textareaHintRowVariants()}>
          {hintIcon && (
            <span className={textareaHintIconVariants({ size })} aria-hidden>
              {hintIcon}
            </span>
          )}
          <p id={hintId} className={cn(textareaHintVariants({ size, invalid }), classNames?.hint)}>
            {hint}
          </p>
        </div>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
