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
import { useRadioGroup, type RadioSize } from './radio-context';
import {
  radioCircleVariants,
  radioControlVariants,
  radioDotVariants,
  radioInputVariants,
  radioLabelVariants,
  radioRootVariants,
  radioSupportingTextVariants,
  radioTextVariants,
} from './Radio.variants';

export type { RadioSize };

type RadioSlot =
  'root' | 'control' | 'input' | 'circle' | 'dot' | 'text' | 'label' | 'supportingText';

interface RadioOwnProps {
  /** Defaults to the group's `size`, then `sm`. */
  size?: RadioSize;
  /** This radio's identity within its group, and its submitted value. */
  value?: string;
  /** Figma's `Checked`. Controlled. Ignored inside a `RadioGroup`, which owns it. */
  checked?: boolean;
  /** Initial state when uncontrolled and outside a group. */
  defaultChecked?: boolean;
  /** Called with `true` when this radio becomes selected. Never called with `false`. */
  onCheckedChange?: (checked: boolean) => void;
  /** Figma's `Text=True`. Omit for the bare circle. */
  label?: ReactNode;
  /** The second line. Requires `label` — Figma draws no supporting text without one. */
  supportingText?: ReactNode;
  classNames?: SlotClassNames<RadioSlot>;
}

export type RadioProps = RadioOwnProps &
  Omit<ComponentPropsWithoutRef<'input'>, keyof RadioOwnProps | 'type' | 'children'>;

/**
 * A radio.
 *
 * Measured from Figma `Checkbox` (node 1097:63652), `Type=Radio` only — all **32
 * published variants**: `Checked`(2) × `Size`(2) × `Text`(2) × `State`(4).
 *
 * **A native `<input type="radio">`**, visually hidden with the painted circle beside
 * it. The keyboard argument is decisive: radios sharing a `name` get mutual
 * exclusion, a single tab stop for the group, and arrow-key selection with
 * wrap-around, all from the browser. A `<button role="radio">` would mean
 * hand-rolling a roving `tabIndex`, four arrow handlers and wrap logic to reproduce
 * behaviour that is free and better tested natively. Figma's own wrapper frame is
 * named `Input`, and `name`/`value`/`required` make it a real form field.
 *
 * Usable **standalone** with an explicit `name`, or inside a `RadioGroup` which
 * supplies the `name`, the shared value and `role="radiogroup"`. Figma publishes
 * single radios, so standalone is a first-class case.
 *
 * Three measured behaviours worth knowing:
 *
 * - **Hover does nothing.** Figma's `State=Hover` is pixel-identical to
 *   `State=Default` in all 8 cells, selected and unselected.
 * - **Disabled keeps the dot**, greyed, and brings back the 1px stroke that the
 *   selected state drops.
 * - **A selected radio cannot be unselected by clicking it.** Native `change` does
 *   not fire, so nothing here inverts state — selection is only ever set.
 *
 * ```tsx
 * <Radio name="plan" value="pro" label="Pro" supportingText="Everything in Free, plus…" />
 * ```
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    size,
    value,
    checked,
    defaultChecked = false,
    onCheckedChange,
    label,
    supportingText,
    disabled,
    required,
    name,
    className,
    classNames,
    onChange,
    id,
    ...rest
  },
  ref,
) {
  const group = useRadioGroup();
  const inner = useRef<HTMLInputElement>(null);

  // The radio's own prop wins, then the group's, then the default. Resolved here
  // rather than defaulted in the signature, or a group-level `size` could never reach
  // a radio that did not restate it.
  const resolvedSize = size ?? group?.size ?? 'sm';
  const resolvedDisabled = disabled ?? group?.disabled ?? false;
  const resolvedRequired = required ?? group?.required;
  const resolvedName = name ?? group?.name;

  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const inGroup = group !== null && value !== undefined;
  const isControlled = checked !== undefined;
  const isOn = inGroup ? group.value === value : isControlled ? checked : uncontrolled;

  /**
   * Who owns the input's checkedness.
   *
   * A group or an explicit `checked` makes it a controlled input. **An uncontrolled
   * standalone radio must not be**: React restores every same-`name` radio's DOM
   * checkedness from its props after a change, so a controlled input would undo the
   * browser's own mutual exclusion and the second radio in a pair would never select.
   * Leaving it uncontrolled hands grouping back to the browser, and the effect below
   * keeps React informed well enough to paint the dot.
   */
  const selection = inGroup || isControlled ? { checked: isOn } : { defaultChecked };

  const reactId = useId();
  const inputId = id ?? `${reactId}-input`;
  const supportingId = `${reactId}-supporting`;

  const hasLabel = label !== undefined && label !== null;
  // Figma draws no supporting text without a label, and a lone second line has
  // nothing to support.
  const hasSupportingText = hasLabel && supportingText !== undefined && supportingText !== null;

  /**
   * Keeps an uncontrolled standalone radio in step with its native group.
   *
   * The browser owns selection here (see `selection` above), so React would otherwise
   * never learn that this radio was *deselected*: native `change` fires only on the
   * radio that becomes selected. Without this the dot would stay painted on the
   * previous choice. Re-reading the DOM after any change within the same `name` keeps
   * the paint honest while leaving grouping entirely to the browser.
   *
   * Only needed outside a `RadioGroup`, which owns the value for all its members. The
   * listener is on the capture phase so it runs before React's own handler, by which
   * point the browser has already updated every radio's checkedness.
   */
  useEffect(() => {
    if (inGroup || isControlled) return;
    const el = inner.current;
    if (!el) return;
    const root = el.getRootNode() as Document | ShadowRoot;
    const sync = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      if (target?.type !== 'radio' || target.name !== el.name) return;
      setUncontrolled(el.checked);
    };
    root.addEventListener('change', sync, true);
    return () => root.removeEventListener('change', sync, true);
  }, [inGroup, isControlled, resolvedName]);

  /**
   * Native `change` on a radio fires only when it *becomes* selected, so this only
   * ever sets. Inverting here would let a click deselect, which no radio does.
   */
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (inGroup) group.onSelect(value);
    else if (!isControlled) setUncontrolled(true);
    onCheckedChange?.(true);
    onChange?.(event);
  };

  const control = (
    <label
      className={cn(
        radioControlVariants({ labelled: hasLabel }),
        classNames?.control,
        !hasLabel && className,
      )}
    >
      <input
        {...rest}
        type="radio"
        id={inputId}
        ref={composeRefs(inner, ref)}
        name={resolvedName}
        value={value}
        {...selection}
        disabled={resolvedDisabled}
        required={resolvedRequired}
        onChange={handleChange}
        aria-describedby={hasSupportingText ? supportingId : undefined}
        className={cn(radioInputVariants(), classNames?.input)}
      />
      <span
        className={cn(
          radioCircleVariants({ size: resolvedSize, selected: isOn, disabled: resolvedDisabled }),
          classNames?.circle,
        )}
        aria-hidden
      >
        {isOn && <span className={cn(radioDotVariants({ size: resolvedSize }), classNames?.dot)} />}
      </span>
    </label>
  );

  // Without a label there is no row to lay out. Figma's `Text=False` root is the bare
  // circle — no wrapper, no offset.
  if (!hasLabel) return control;

  return (
    <div className={cn(radioRootVariants({ size: resolvedSize }), classNames?.root, className)}>
      {control}
      <span className={cn(radioTextVariants({ size: resolvedSize }), classNames?.text)}>
        <label
          htmlFor={inputId}
          className={cn(radioLabelVariants({ size: resolvedSize }), classNames?.label)}
        >
          {label}
        </label>
        {hasSupportingText && (
          <span
            id={supportingId}
            className={cn(
              radioSupportingTextVariants({ size: resolvedSize }),
              classNames?.supportingText,
            )}
          >
            {supportingText}
          </span>
        )}
      </span>
    </div>
  );
});

Radio.displayName = 'Radio';
