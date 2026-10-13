'use client';
import { useId, useMemo, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { RadioGroupContext, type RadioSize } from './radio-context';

interface RadioGroupOwnProps {
  /**
   * Groups the radios in the browser's eyes. **Generated when omitted**, which is
   * what keeps two groups on one page from interfering — the failure mode of a
   * duplicated `name` is radios that look correct and stop being mutually exclusive.
   */
  name?: string;
  /** The selected radio's `value`. Controlled. */
  value?: string;
  /** Initial selection when uncontrolled. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Applied to every radio in the group unless the radio sets its own. */
  size?: RadioSize;
  /** Applied to every radio in the group unless the radio sets its own. */
  disabled?: boolean;
  /**
   * Native group validation — one member must be selected.
   *
   * Passed through to the inputs and given **no visual treatment**: Figma publishes
   * no required or error state for Radio, so any indicator would be invented.
   */
  required?: boolean;
  /**
   * The group's accessible name, applied as `aria-label`.
   *
   * **Not rendered.** Figma publishes no group container, label or legend, so drawing
   * one would mean inventing typography and spacing the design system has not agreed.
   * Pass `aria-labelledby` instead to point at a heading you render yourself.
   */
  label?: string;
  children?: ReactNode;
}

export type RadioGroupProps = RadioGroupOwnProps &
  Omit<ComponentPropsWithRef<'div'>, keyof RadioGroupOwnProps>;

/**
 * A group of mutually exclusive radios.
 *
 * **A semantic container only — it imposes no layout.** Figma publishes no group at
 * all: no container, no label, no spacing, no orientation. Rendering a default gap
 * would be inventing a measurement, so the caller owns layout entirely and can use
 * whatever stack, flex or grid they already have.
 *
 * What it does provide is the part that is easy to get wrong:
 *
 * - **A shared `name`**, generated when omitted. Same-`name` radios are what the
 *   browser treats as one group, which is what gives mutual exclusion, a single tab
 *   stop for the whole group, and arrow-key selection with wrap-around — all native,
 *   none of it reimplemented here.
 * - **`role="radiogroup"`** plus an accessible name, so assistive technology
 *   announces the set rather than a run of unrelated controls.
 * - **Shared value**, controlled or uncontrolled, and shared `size`, `disabled` and
 *   `required` that each radio can still override.
 *
 * ```tsx
 * <RadioGroup label="Plan" value={plan} onValueChange={setPlan} size="md">
 *   <div className="flex flex-col gap-4">
 *     <Radio value="free" label="Free" />
 *     <Radio value="pro" label="Pro" supportingText="Everything in Free, plus…" />
 *   </div>
 * </RadioGroup>
 * ```
 */
export function RadioGroup({
  name,
  value,
  defaultValue,
  onValueChange,
  size,
  disabled,
  required,
  label,
  children,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...rest
}: RadioGroupProps) {
  const reactId = useId();
  const groupName = name ?? `${reactId}-radio-group`;

  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const isControlled = value !== undefined;
  const selected = isControlled ? value : uncontrolled;

  const context = useMemo(
    () => ({
      name: groupName,
      value: selected,
      onSelect: (next: string) => {
        if (!isControlled) setUncontrolled(next);
        onValueChange?.(next);
      },
      size,
      disabled,
      required,
    }),
    [groupName, selected, isControlled, onValueChange, size, disabled, required],
  );

  return (
    <RadioGroupContext.Provider value={context}>
      <div
        role="radiogroup"
        // An explicit `aria-label` wins; `label` is the shorthand. Neither is applied
        // when the caller points at their own heading with `aria-labelledby`, because
        // two names on one element is a defect rather than a fallback.
        aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : label)}
        aria-labelledby={ariaLabelledBy}
        {...rest}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}
