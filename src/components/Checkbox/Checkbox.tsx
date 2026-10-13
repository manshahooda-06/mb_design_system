'use client';
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import type { SlotClassNames } from '@/types';
import { cn } from '@utils/cn';
import { composeRefs } from '@utils/compose-refs';
import {
  checkboxBoxVariants,
  checkboxControlVariants,
  checkboxIconVariants,
  checkboxInputVariants,
  checkboxLabelVariants,
  checkboxRootVariants,
  checkboxSupportingTextVariants,
  checkboxTextVariants,
} from './Checkbox.variants';

/** Figma's `Size` axis. Boxes are 16 and 20, at radius 2 and 4. */
export type CheckboxSize = 'sm' | 'md';

type CheckboxSlot =
  'root' | 'control' | 'input' | 'box' | 'icon' | 'text' | 'label' | 'supportingText';

interface CheckboxOwnProps {
  size?: CheckboxSize;
  /** Figma's `Checked`. Controlled. */
  checked?: boolean;
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /**
   * Figma's `Indeterminate` axis.
   *
   * Applied through the DOM property, because HTML has no `indeterminate`
   * attribute. Takes precedence over `checked` for what is drawn, and reports
   * `aria-checked="mixed"`.
   */
  indeterminate?: boolean;
  /** Figma's `Text=True`. Omit for the bare box. */
  label?: ReactNode;
  /** The second line. Requires `label` — Figma draws no supporting text without one. */
  supportingText?: ReactNode;
  /** The checked glyph. Figma uses `tick-02` at 12 / 14. */
  checkIcon?: ReactNode;
  /** The indeterminate glyph. Figma uses `remove-01` at 12 / 14. */
  indeterminateIcon?: ReactNode;
  classNames?: SlotClassNames<CheckboxSlot>;
}

export type CheckboxProps = CheckboxOwnProps &
  Omit<ComponentPropsWithoutRef<'input'>, keyof CheckboxOwnProps | 'type' | 'children'>;

/**
 * A checkbox.
 *
 * Measured from Figma `Checkbox` (node 1097:63652). That set publishes 72 variants,
 * of which the **40 `Type=Checkbox`** ones are implemented here — 24 without a label
 * (unchecked, checked and indeterminate × 2 sizes × 4 states) and 16 with one.
 *
 * The other 32 are `Type=Radio`, and they are deliberately **not** reachable through
 * this component. A radio is single-select within a named group, needs `role="radio"`
 * inside a `radiogroup`, and moves selection with the arrow keys; sharing an
 * implementation would give it checkbox semantics. See docs/Components.md.
 *
 * **A native `<input type="checkbox">`**, visually hidden with the painted box beside
 * it. Figma's own wrapper frame is named `Input`; `indeterminate` is a native DOM
 * property with a matching `:indeterminate` pseudo-class; and the one measured
 * consumer — InputDropdown's multi-select menu item — is a form control. So this
 * carries `name`, `value`, `required`, form association and native keyboard
 * behaviour, none of which a `<button role="checkbox">` would.
 *
 * Two measured behaviours worth knowing:
 *
 * - **Hover does nothing.** Figma's `State=Hover` is pixel-identical to
 *   `State=Default` in all 18 cells, checked and unchecked alike.
 * - **Disabled keeps the glyph.** The surface greys and the glyph greys with it,
 *   rather than disappearing.
 *
 * ```tsx
 * <Checkbox label="Remember me" supportingText="Save my login details." checkIcon={<Tick />} />
 * <Checkbox size="md" indeterminate indeterminateIcon={<Dash />} aria-label="Select all" />
 * ```
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    size = 'sm',
    checked,
    defaultChecked = false,
    onCheckedChange,
    indeterminate = false,
    label,
    supportingText,
    checkIcon,
    indeterminateIcon,
    disabled = false,
    className,
    classNames,
    onChange,
    id,
    ...rest
  },
  ref,
) {
  const inner = useRef<HTMLInputElement>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked : uncontrolled;

  const reactId = useId();
  const inputId = id ?? `${reactId}-input`;
  const supportingId = `${reactId}-supporting`;

  const hasLabel = label !== undefined && label !== null;
  // Figma draws no supporting text without a label, and a lone second line has
  // nothing to support.
  const hasSupportingText = hasLabel && supportingText !== undefined && supportingText !== null;

  // `indeterminate` exists only as a DOM property, so it cannot be rendered as a
  // prop. In an effect rather than a ref callback so it re-applies when the value
  // changes, not only on mount.
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.checked;
    if (!isControlled) setUncontrolled(next);
    onCheckedChange?.(next);
    onChange?.(event);
  };

  const control = (
    <label
      className={cn(
        checkboxControlVariants({ labelled: hasLabel }),
        classNames?.control,
        !hasLabel && className,
      )}
    >
      <input
        {...rest}
        type="checkbox"
        id={inputId}
        ref={composeRefs(inner, ref)}
        checked={isOn}
        disabled={disabled}
        onChange={handleChange}
        aria-checked={indeterminate ? 'mixed' : undefined}
        aria-describedby={hasSupportingText ? supportingId : undefined}
        className={cn(checkboxInputVariants(), classNames?.input)}
      />
      <span
        className={cn(
          // Checked and indeterminate paint the same box; only the glyph differs.
          checkboxBoxVariants({ size, filled: indeterminate || isOn, disabled }),
          classNames?.box,
        )}
        aria-hidden
      >
        {(indeterminate || isOn) && (
          <span className={cn(checkboxIconVariants({ size }), classNames?.icon)}>
            {indeterminate ? indeterminateIcon : checkIcon}
          </span>
        )}
      </span>
    </label>
  );

  // Without a label there is no row to lay out. Figma's `Text=False` root is the
  // bare box — no wrapper, no offset.
  if (!hasLabel) return control;

  return (
    <div className={cn(checkboxRootVariants({ size }), classNames?.root, className)}>
      {control}
      <span className={cn(checkboxTextVariants({ size }), classNames?.text)}>
        <label htmlFor={inputId} className={cn(checkboxLabelVariants({ size }), classNames?.label)}>
          {label}
        </label>
        {hasSupportingText && (
          <span
            id={supportingId}
            className={cn(checkboxSupportingTextVariants({ size }), classNames?.supportingText)}
          >
            {supportingText}
          </span>
        )}
      </span>
    </div>
  );
});

Checkbox.displayName = 'Checkbox';
