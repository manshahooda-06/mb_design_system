'use client';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import type { BaseComponentProps, SlotClassNames } from '@/types';
import { ariaAttr } from '@utils/a11y';
import { cn } from '@utils/cn';
import {
  otpInputCellRowVariants,
  otpInputCellVariants,
  otpInputFieldGroupVariants,
  otpInputHintIconVariants,
  otpInputHintRowVariants,
  otpInputHintVariants,
  otpInputLabelVariants,
  otpInputRootVariants,
} from './OtpInput.variants';

/** Figma publishes `Digits` 4, 5 and 6 only. */
export type OtpInputLength = 4 | 5 | 6;

type OtpInputSlot = 'root' | 'label' | 'cells' | 'cell' | 'hint';

interface OtpInputOwnProps extends Omit<BaseComponentProps, 'children'> {
  /** Figma's `Digits` axis. Defaults to 4, the file's default variant. */
  length?: OtpInputLength;
  /** Controlled value. Longer strings are clamped to `length`. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Fired once every cell is filled. Not a Figma state — there is no completed style. */
  onComplete?: (value: string) => void;
  /** Figma's `State=Error`. Applies to every cell, filled or not. */
  invalid?: boolean;
  /** Figma's `State=Disabled`. */
  disabled?: boolean;
  label?: ReactNode;
  /** The hint line beneath the cells, optionally preceded by an icon. */
  hint?: ReactNode;
  /** The 16px glyph leading the hint. Rendered only when `hint` is present. */
  hintIcon?: ReactNode;
  /** Each cell is submitted as `name`-index, which is also what autofill targets. */
  name?: string;
  /**
   * Focuses the first cell on mount.
   *
   * Off by default. A code field is usually the only thing on its screen, which is
   * the one case where moving focus on load helps rather than disorients — but
   * that is the consumer's call to make, not this component's.
   */
  autoFocus?: boolean;
  classNames?: SlotClassNames<OtpInputSlot>;
}

export type OtpInputProps = OtpInputOwnProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof OtpInputOwnProps | 'children' | 'onChange'>;

/**
 * A one-time-code field: one native `<input>` per digit.
 *
 * Measured from Figma `input-OTP` (node 4092:1958) — all 15 variants, three
 * lengths across five states.
 *
 * Figma's `Placeholder`, `Filled` and `Focused` are not field-level styles but
 * *compositions of per-cell state*, so they are runtime states here and never
 * props. A cell derives its appearance in this order:
 *
 * `disabled` → `invalid` → `focused` → `filled` → `placeholder`
 *
 * Only `Disabled` and `Error` reach the whole field, as `disabled` and `invalid`.
 *
 * One input per cell rather than one hidden input behind presentational boxes:
 * Figma paints the focus ring on exactly one cell, which is what `:focus` on a
 * real input gives for free — no caret to fake and no active index to track.
 *
 * ```tsx
 * <OtpInput label="Verification code" length={6} onComplete={verify} />
 * <OtpInput label="Verification code" invalid hint="That code is incorrect." />
 * ```
 */
export function OtpInput({
  length = 4,
  value,
  defaultValue = '',
  onValueChange,
  onComplete,
  invalid = false,
  disabled = false,
  label,
  hint,
  hintIcon,
  name,
  autoFocus,
  className,
  classNames,
  id,
  ...rest
}: OtpInputProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const labelId = `${baseId}-label`;
  const hintId = `${baseId}-hint`;

  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const isControlled = value !== undefined;
  const code = (isControlled ? value : uncontrolled).slice(0, length);

  const cells = useRef<(HTMLInputElement | null)[]>([]);

  const focusCell = useCallback(
    (index: number) => {
      const target = cells.current[Math.max(0, Math.min(index, length - 1))];
      target?.focus();
      target?.select();
    },
    [length],
  );

  // Applied as an effect rather than through the `autoFocus` attribute, which
  // `jsx-a11y/no-autofocus` forbids on any element. Focusing here is equivalent,
  // and it lets the request be ignored while the field is disabled, where the
  // attribute would silently do nothing anyway.
  useEffect(() => {
    if (autoFocus === true && !disabled) cells.current[0]?.focus();
    // Mount only: re-running on a later `autoFocus` flip would steal focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = useCallback(
    (next: string) => {
      const clamped = next.slice(0, length);
      if (clamped === code) return;
      if (!isControlled) setUncontrolled(clamped);
      onValueChange?.(clamped);
      if (clamped.length === length && !clamped.includes(' ')) onComplete?.(clamped);
    },
    [code, isControlled, length, onComplete, onValueChange],
  );

  /**
   * Writes `text` across the cells from `start`, then parks focus after it.
   *
   * The single path for typing, pasting and autofill. Typing arrives as one
   * character and advances one cell; a paste or an SMS autofill arrives as many
   * and fills as far as it reaches.
   *
   * Gaps before `start` are held open with spaces so a value can never silently
   * shift left of the cell it was entered into, and cells after what was written
   * keep what they had — typing into the middle of a code replaces one digit
   * rather than truncating everything past it.
   */
  const distribute = useCallback(
    (start: number, text: string) => {
      if (text.length === 0) return;
      const head = code.slice(0, start).padEnd(start, ' ');
      const written = text.slice(0, length - start);
      const tail = code.slice(start + written.length);
      commit((head + written + tail).slice(0, length).trimEnd());
      focusCell(start + written.length);
    },
    [code, commit, focusCell, length],
  );

  /** Blanks one cell, keeping the cells after it where they are. */
  const clearCell = useCallback(
    (index: number) => commit((code.slice(0, index) + ' ' + code.slice(index + 1)).trimEnd()),
    [code, commit],
  );

  const handleChange = (index: number, raw: string) => {
    // A controlled input is reset by React on every render, so `raw` holds only
    // what just arrived — one character when typed, the whole code when pasted or
    // autofilled — never the accumulated cell contents.
    if (raw === '') clearCell(index);
    else distribute(index, raw);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Backspace': {
        event.preventDefault();
        const filled = code[index] !== undefined && code[index] !== ' ';
        if (filled) clearCell(index);
        else if (index > 0) {
          clearCell(index - 1);
          focusCell(index - 1);
        }
        return;
      }
      case 'Delete':
        event.preventDefault();
        clearCell(index);
        return;
      case 'ArrowLeft':
        event.preventDefault();
        focusCell(index - 1);
        return;
      case 'ArrowRight':
        event.preventDefault();
        focusCell(index + 1);
        return;
      case 'Home':
        event.preventDefault();
        focusCell(0);
        return;
      case 'End':
        event.preventDefault();
        focusCell(length - 1);
        return;
      default:
        return;
    }
  };

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    // Handled here rather than left to `onChange`, so distribution does not depend
    // on how a given browser truncates a paste into a single-character field.
    event.preventDefault();
    distribute(index, event.clipboardData.getData('text').trim());
  };

  return (
    <div className={cn(otpInputRootVariants(), classNames?.root)} {...rest}>
      <div className={otpInputFieldGroupVariants()}>
        {label && (
          <label
            id={labelId}
            htmlFor={`${baseId}-0`}
            className={cn(otpInputLabelVariants(), classNames?.label)}
          >
            {label}
          </label>
        )}

        <div
          role="group"
          aria-labelledby={label ? labelId : undefined}
          aria-describedby={hint ? hintId : undefined}
          className={cn(otpInputCellRowVariants({ disabled }), classNames?.cells, className)}
        >
          {Array.from({ length }, (_, index) => {
            const char = (code[index] ?? '').trim();
            return (
              <input
                key={index}
                ref={(node) => {
                  cells.current[index] = node;
                }}
                id={`${baseId}-${index}`}
                name={name ? `${name}-${index}` : undefined}
                value={char}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                disabled={disabled}
                aria-invalid={ariaAttr(invalid)}
                aria-label={`Digit ${index + 1} of ${length}`}
                onChange={(event) => handleChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={(event) => handlePaste(index, event)}
                onFocus={(event) => event.currentTarget.select()}
                className={cn(
                  otpInputCellVariants({ filled: char !== '', invalid, disabled }),
                  classNames?.cell,
                )}
              />
            );
          })}
        </div>
      </div>

      {hint && (
        <div className={otpInputHintRowVariants({ invalid })}>
          {hintIcon && (
            <span className={otpInputHintIconVariants()} aria-hidden>
              {hintIcon}
            </span>
          )}
          <p id={hintId} className={cn(otpInputHintVariants(), classNames?.hint)}>
            {hint}
          </p>
        </div>
      )}
    </div>
  );
}
