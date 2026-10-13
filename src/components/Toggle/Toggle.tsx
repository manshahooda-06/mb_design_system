'use client';
import { forwardRef, useId, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import type { SlotClassNames } from '@/types';
import { cn } from '@utils/cn';
import {
  toggleLabelVariants,
  toggleRootVariants,
  toggleSupportingTextVariants,
  toggleTextVariants,
  toggleThumbVariants,
  toggleTrackVariants,
} from './Toggle.variants';

/** Figma's `Type` axis. `slim` has no track padding and carries 1px strokes. */
export type ToggleVariant = 'default' | 'slim';

/** Figma's `Size` axis. Tracks are 36×20 / 44×24 (`default`), 32×16 / 40×20 (`slim`). */
export type ToggleSize = 'sm' | 'md';

type ToggleSlot = 'root' | 'track' | 'thumb' | 'text' | 'label' | 'supportingText';

interface ToggleOwnProps {
  /** Figma's `Type`. */
  variant?: ToggleVariant;
  size?: ToggleSize;
  /** Figma's `Pressed`. Controlled. */
  checked?: boolean;
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Figma's `State=Disabled`. */
  disabled?: boolean;
  /** Figma's `Text=True`. Omit for the control on its own. */
  label?: ReactNode;
  /** The second line. Requires `label` — Figma draws no supporting text without one. */
  supportingText?: ReactNode;
  className?: string;
  classNames?: SlotClassNames<ToggleSlot>;
}

export type ToggleProps = ToggleOwnProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof ToggleOwnProps | 'children' | 'type' | 'onChange'>;

/**
 * A switch: an immediate on/off control.
 *
 * Measured from Figma `Toggle` (node 1102:4208) — all **64** variants:
 * `Type`(2) × `Pressed`(2) × `Size`(2) × `Text`(2) × `State`(4).
 *
 * Figma's `State` axis is not part of the API. Hover and focus belong to CSS, and
 * `Disabled` arrives as `disabled`, so 8 prop combinations × 4 CSS states reproduce
 * the published 64. `Type` is `variant` and `Pressed` is `checked`: a switch is
 * checked, not held down, and `aria-checked` is the attribute that carries it.
 *
 * **A `role="switch"` button, not an `<input type="checkbox">`.** There is no
 * evidence Toggle participates in native form submission — no `name`/`value`
 * semantics in any of the 64 variants, no form context in the file, and no
 * consumer in this repo — so the simpler element wins. A visually hidden input
 * would add form-submission semantics Figma does not imply plus a `peer` styling
 * indirection, for a capability nothing has asked for. `TagCheckbox` made the same
 * call for the same reason. Consumers needing form participation should render a
 * hidden input alongside and drive it from `onCheckedChange`.
 *
 * Two measured behaviours are worth knowing, because both look like bugs:
 *
 * - **Hover does nothing when off.** Figma's `State=Hover` is byte-identical to
 *   `State=Default` for every `Pressed=False` variant. Only the on state darkens.
 * - **Disabled ignores `checked` for colour.** A disabled toggle paints the off
 *   colours whichever way it is set; only the thumb's position still moves.
 *
 * ```tsx
 * <Toggle label="Remember me" supportingText="Save my login details for next time." />
 * <Toggle variant="slim" size="md" checked={on} onCheckedChange={setOn} />
 * ```
 */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  {
    variant = 'default',
    size = 'sm',
    checked,
    defaultChecked = false,
    onCheckedChange,
    disabled = false,
    label,
    supportingText,
    className,
    classNames,
    ...rest
  },
  ref,
) {
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked : uncontrolled;

  const reactId = useId();
  const labelId = `${reactId}-label`;
  const supportingId = `${reactId}-supporting`;

  const hasLabel = label !== undefined && label !== null;
  // Figma draws no supporting text without a label, and a lone second line has
  // nothing to support.
  const hasSupportingText = hasLabel && supportingText !== undefined && supportingText !== null;

  const geometry = { size, variant, checked: isOn, disabled };

  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      disabled={disabled}
      aria-labelledby={hasLabel ? labelId : undefined}
      aria-describedby={hasSupportingText ? supportingId : undefined}
      onClick={() => {
        const next = !isOn;
        if (!isControlled) setUncontrolled(next);
        onCheckedChange?.(next);
      }}
      className={cn(toggleTrackVariants(geometry), classNames?.track, !hasLabel && className)}
      {...rest}
      ref={ref}
    >
      <span className={cn(toggleThumbVariants(geometry), classNames?.thumb)} />
    </button>
  );

  // Without a label there is no row to lay out, so the control is the component.
  // Figma's `Text=False` root is a bare wrapper with no padding or gap.
  if (!hasLabel) return control;

  return (
    <div className={cn(toggleRootVariants({ size }), classNames?.root, className)}>
      {control}
      <span className={cn(toggleTextVariants({ size }), classNames?.text)}>
        <span id={labelId} className={cn(toggleLabelVariants({ size }), classNames?.label)}>
          {label}
        </span>
        {hasSupportingText && (
          <span
            id={supportingId}
            className={cn(toggleSupportingTextVariants({ size }), classNames?.supportingText)}
          >
            {supportingText}
          </span>
        )}
      </span>
    </div>
  );
});

Toggle.displayName = 'Toggle';
