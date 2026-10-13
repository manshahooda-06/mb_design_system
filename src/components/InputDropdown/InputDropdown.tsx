'use client';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementType,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import type { BaseComponentProps, SlotClassNames } from '@/types';
import { ariaAttr, composeIds } from '@utils/a11y';
import { cn } from '@utils/cn';
import { Checkbox } from '../Checkbox';
import { Tag } from '../Tag';
import {
  inputDropdownChevronVariants,
  inputDropdownContentVariants,
  inputDropdownFieldGroupVariants,
  inputDropdownFieldVariants,
  inputDropdownHintVariants,
  inputDropdownLabelRowVariants,
  inputDropdownLabelVariants,
  inputDropdownMenuItemContentVariants,
  inputDropdownMenuItemLabelVariants,
  inputDropdownMenuItemSupportingVariants,
  inputDropdownMenuItemTextVariants,
  inputDropdownMenuItemTickVariants,
  inputDropdownMenuItemVariants,
  inputDropdownMenuVariants,
  inputDropdownRequiredVariants,
  inputDropdownRootVariants,
  inputDropdownSupportingVariants,
  inputDropdownTagsVariants,
  inputDropdownValueVariants,
} from './InputDropdown.variants';

/** Figma's `device` axis. Two independent sets of measurements, not a size scale. */
export type InputDropdownDevice = 'desktop' | 'mobile';

export interface InputDropdownOption {
  value: string;
  label: string;
  /** The secondary line shown beside the label, in the field and in the menu. */
  supportingText?: string;
  disabled?: boolean;
}

type InputDropdownSlot =
  | 'root'
  | 'label'
  | 'field'
  | 'value'
  | 'hint'
  | 'menu'
  | 'menuItem'
  | 'chevron'
  | 'tags'
  | 'tag'
  | 'checkbox';

/** Figma's `type` axis. */
export type InputDropdownType = 'default' | 'multiSelect';

interface InputDropdownOwnProps extends Omit<BaseComponentProps, 'children'> {
  device?: InputDropdownDevice;
  /** Figma's `type` axis. `multiSelect` swaps the value for Tags and the tick for a Checkbox. */
  type?: InputDropdownType;
  options: InputDropdownOption[];
  /**
   * Controlled selection, `type="default"` only.
   *
   * Parallel props rather than a discriminated union: a union on `value` cannot be
   * spread into, and `{...props}` is how wrappers, Storybook args and HOCs pass
   * things through. `type` decides which pair applies.
   */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** Controlled selection, `type="multiSelect"` only. */
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
  /** The Tag close glyph. Figma uses `cancel-01` at 10px. */
  tagCloseIcon?: ReactNode;
  /** The Checkbox glyph on a selected row. Figma uses `tick-02`. */
  checkIcon?: ReactNode;
  /** Controlled open state. Figma's `State=Open`. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Figma's `inputLabelText`. Shown when nothing is selected — and while open. */
  placeholder?: string;
  /** Figma's `heading` / `headingText`. */
  label?: ReactNode;
  /** Renders the `*` marker and sets `aria-required`. */
  required?: boolean;
  /** Figma's `hintText`. Hidden while open, matching Figma. */
  hint?: ReactNode;
  /** Figma's `State=Disabled`. */
  disabled?: boolean;
  /** The glyph in the trailing 16px box. Figma uses `arrow-down-01`. */
  chevron?: ReactNode;
  /** The glyph marking the selected option. Figma uses `tick-02`. */
  tick?: ReactNode;
  classNames?: SlotClassNames<InputDropdownSlot>;
}

export type InputDropdownProps = InputDropdownOwnProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof InputDropdownOwnProps | 'children'>;

/** How long a typeahead buffer stays alive between keystrokes. */
const TYPEAHEAD_RESET_MS = 500;

/**
 * A select field with a dropdown menu.
 *
 * Measured from Figma `Input dropdown` (node 5265:8766). This implements
 * **`type=Default`** at both devices across all five states — **10 of 20
 * variants**. `type=multi select` is still unbuilt but **no longer blocked**: its
 * field renders selected values as Tag instances and its menu rows embed a
 * Checkbox, and both components now exist.
 *
 * `device` is Figma's own axis, not a size scale. Desktop and mobile disagree on
 * padding, field height, every gap and the whole type ramp.
 *
 * `Placeholder`, `Default`, `Focused` and `Open` are runtime states and never
 * props; only `Disabled` is one. Two behaviours reproduce Figma rather than
 * improving on it: opening shows the **placeholder** in place of the selected
 * value, and opening **hides the hint**.
 *
 * The menu is a sibling in the layout, as Figma draws it, so opening grows the
 * component instead of floating over the page.
 *
 * ```tsx
 * <InputDropdown label="Team member" required options={people} hint="Pick one." />
 * ```
 */
export function InputDropdown({
  device = 'desktop',
  type = 'default',
  options,
  value,
  defaultValue = null,
  onValueChange,
  values,
  defaultValues,
  onValuesChange,
  tagCloseIcon,
  checkIcon,
  open,
  defaultOpen = false,
  onOpenChange,
  placeholder = 'Select Here',
  label,
  required = false,
  hint,
  disabled = false,
  chevron,
  tick,
  className,
  classNames,
  id,
  ...rest
}: InputDropdownProps) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const labelId = `${baseId}-label`;
  const hintId = `${baseId}-hint`;
  const menuId = `${baseId}-menu`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const isMulti = type === 'multiSelect';

  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [uncontrolledValues, setUncontrolledValues] = useState<string[]>(defaultValues ?? []);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const selected = value !== undefined ? value : uncontrolledValue;
  const isOpen = (open !== undefined ? open : uncontrolledOpen) && !disabled;

  /**
   * The one source of truth for what is selected, whichever API the caller used.
   *
   * `default` normalises to a list of nought or one; `multiSelect` to a list of n.
   * Tag rendering, Checkbox state, row highlighting and Tag removal all read this,
   * so the two public shapes cannot disagree about what is selected.
   */
  const selectedValues = useMemo<string[]>(() => {
    if (isMulti) return values !== undefined ? values : uncontrolledValues;
    return selected === null || selected === undefined ? [] : [selected];
  }, [isMulti, selected, uncontrolledValues, values]);

  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.value === selected),
    [options, selected],
  );
  const selectedOption = selectedIndex === -1 ? undefined : options[selectedIndex];
  const selectedOptions = useMemo(
    () => selectedValues.flatMap((v) => options.filter((o) => o.value === v)),
    [options, selectedValues],
  );

  /** The highlighted row: pointer hover and keyboard navigation share one state. */
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const typeahead = useRef({ buffer: '', at: 0 });

  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange, open],
  );

  const firstEnabled = useCallback(
    (from: number, step: number) => {
      for (let i = from; i >= 0 && i < options.length; i += step) {
        if (options[i]?.disabled !== true) return i;
      }
      return -1;
    },
    [options],
  );

  const openMenu = useCallback(
    (highlight: number) => {
      setOpen(true);
      setActiveIndex(highlight);
    },
    [setOpen],
  );

  const closeMenu = useCallback(
    (returnFocus = true) => {
      setOpen(false);
      setActiveIndex(-1);
      if (returnFocus) triggerRef.current?.focus();
    },
    [setOpen],
  );

  const commitValues = useCallback(
    (next: string[]) => {
      if (values === undefined) setUncontrolledValues(next);
      onValuesChange?.(next);
    },
    [onValuesChange, values],
  );

  const select = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option || option.disabled === true) return;
      if (isMulti) {
        // Toggle, and leave the menu open. Figma draws no close-on-pick and a
        // multi-select that shut after every choice could not be used for its
        // purpose; recorded as ours rather than measured.
        commitValues(
          selectedValues.includes(option.value)
            ? selectedValues.filter((v) => v !== option.value)
            : [...selectedValues, option.value],
        );
        return;
      }
      if (value === undefined) setUncontrolledValue(option.value);
      onValueChange?.(option.value);
      closeMenu();
    },
    [closeMenu, commitValues, isMulti, onValueChange, options, selectedValues, value],
  );

  /** Removing a Tag is the same commit as deselecting its row. */
  const removeValue = useCallback(
    (v: string) => commitValues(selectedValues.filter((x) => x !== v)),
    [commitValues, selectedValues],
  );

  // Dismiss on a click outside the whole component, which is the only way to close
  // without either selecting or pressing Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [closeMenu, isOpen]);

  // Keep the highlighted row in view. Figma's menu caps its height, so the row can
  // sit outside the scroll port.
  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    // Optional call: `scrollIntoView` is absent in jsdom and in some embedded
    // engines, and a missing scroll is not worth throwing over.
    itemRefs.current[activeIndex]?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  /** Jumps to the next option whose label starts with the accumulated keystrokes. */
  const runTypeahead = useCallback(
    (key: string, now: number) => {
      const state = typeahead.current;
      state.buffer = now - state.at > TYPEAHEAD_RESET_MS ? key : state.buffer + key;
      state.at = now;
      const query = state.buffer.toLowerCase();
      const from = activeIndex >= 0 ? activeIndex : 0;
      // Search from just after the current row so repeated keys cycle.
      const order = [
        ...options.slice(from + 1).map((option, i) => [option, from + 1 + i] as const),
        ...options.slice(0, from + 1).map((option, i) => [option, i] as const),
      ];
      const hit = order.find(
        ([option]) => option.disabled !== true && option.label.toLowerCase().startsWith(query),
      );
      if (hit) setActiveIndex(hit[1]);
    },
    [activeIndex, options],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) openMenu(firstEnabled(selectedIndex >= 0 ? selectedIndex : 0, 1));
        else
          setActiveIndex(
            firstEnabled(activeIndex + 1, 1) === -1
              ? activeIndex
              : firstEnabled(activeIndex + 1, 1),
          );
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen)
          openMenu(firstEnabled(selectedIndex >= 0 ? selectedIndex : options.length - 1, -1));
        else {
          const previous = firstEnabled(activeIndex - 1, -1);
          if (previous !== -1) setActiveIndex(previous);
        }
        return;
      case 'Home':
        if (!isOpen) return;
        event.preventDefault();
        setActiveIndex(firstEnabled(0, 1));
        return;
      case 'End':
        if (!isOpen) return;
        event.preventDefault();
        setActiveIndex(firstEnabled(options.length - 1, -1));
        return;
      case 'Enter':
        event.preventDefault();
        if (!isOpen) openMenu(firstEnabled(selectedIndex >= 0 ? selectedIndex : 0, 1));
        else if (activeIndex >= 0) select(activeIndex);
        return;
      case ' ':
        // Space opens, but must not hijack typeahead once a buffer is running.
        if (isOpen && typeahead.current.buffer !== '') break;
        event.preventDefault();
        if (!isOpen) openMenu(firstEnabled(selectedIndex >= 0 ? selectedIndex : 0, 1));
        else if (activeIndex >= 0) select(activeIndex);
        return;
      case 'Escape':
        if (!isOpen) return;
        event.preventDefault();
        closeMenu();
        return;
      case 'Tab':
        // Let focus leave, but do not leave an open menu behind it.
        if (isOpen) closeMenu(false);
        return;
      default:
        break;
    }

    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      if (!isOpen) setOpen(true);
      runTypeahead(event.key, event.timeStamp);
    }
  };

  /**
   * Multi-select keeps its Tags in every state, including Open and Disabled.
   *
   * Figma replaces them with the placeholder in Open and Disabled, which is recorded
   * as an inconsistency: the selected values are the field's primary content and
   * hiding them when the menu opens would lose the user's work on screen.
   */
  const showTags = isMulti && selectedOptions.length > 0;
  const showPlaceholder = isMulti ? !showTags : selectedOption === undefined || isOpen;
  const fieldText =
    showPlaceholder || selectedOption === undefined ? placeholder : selectedOption.label;

  /**
   * The trigger element, which the type decides.
   *
   * `default` stays a `<button>`. **Multi-select cannot be**: its Tags carry their own
   * close `<button>`, and a button inside a button is invalid HTML that browsers
   * recover from by breaking the nesting — the close would stop working. A
   * `role="combobox"` div with `tabIndex` is the ARIA pattern for this control anyway,
   * and keyboard behaviour is unchanged because it already runs through `onKeyDown`.
   */
  const Trigger = (isMulti ? 'div' : 'button') as ElementType;
  const triggerProps = isMulti
    ? { tabIndex: disabled ? -1 : 0, 'aria-disabled': ariaAttr(disabled) }
    : { type: 'button' as const, disabled };

  return (
    <div
      ref={rootRef}
      className={cn(inputDropdownRootVariants({ device, open: isOpen }), classNames?.root)}
      {...rest}
    >
      <div className={inputDropdownFieldGroupVariants()}>
        {label !== undefined && (
          <div className={inputDropdownLabelRowVariants()}>
            <span
              id={labelId}
              className={cn(inputDropdownLabelVariants({ device }), classNames?.label)}
            >
              {label}
            </span>
            {required && (
              <span className={inputDropdownRequiredVariants()} aria-hidden>
                *
              </span>
            )}
          </div>
        )}

        <Trigger
          ref={triggerRef}
          id={baseId}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? menuId : undefined}
          aria-activedescendant={isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-labelledby={label === undefined ? undefined : labelId}
          aria-describedby={composeIds(hint !== undefined ? hintId : undefined)}
          aria-required={ariaAttr(required)}
          onClick={(event: ReactMouseEvent) => {
            if (disabled) return;
            // In multi-select the trigger is a div that contains each Tag's close
            // button. A click on one of those must remove the Tag without also
            // toggling the menu, so it stops here rather than opening.
            if (isMulti && (event.target as HTMLElement).closest('button')) return;
            if (isOpen) closeMenu(false);
            else openMenu(selectedIndex);
          }}
          onKeyDown={handleKeyDown}
          {...triggerProps}
          className={cn(
            inputDropdownFieldVariants({
              device,
              content: showTags ? 'tags' : 'text',
              open: isOpen,
              disabled,
            }),
            classNames?.field,
            className,
          )}
        >
          {showTags ? (
            <span className={cn(inputDropdownTagsVariants({ device }), classNames?.tags)}>
              {selectedOptions.map((option) => (
                <Tag
                  key={option.value}
                  size={device === 'desktop' ? 'lg' : 'md'}
                  label={option.label}
                  disabled={disabled}
                  onRemove={() => removeValue(option.value)}
                  closeIcon={tagCloseIcon}
                  removeLabel={`Remove ${option.label}`}
                  className={classNames?.tag}
                />
              ))}
            </span>
          ) : (
            <span className={inputDropdownContentVariants({ device })}>
              <span
                className={cn(
                  inputDropdownValueVariants({ device, placeholder: showPlaceholder, disabled }),
                  classNames?.value,
                )}
              >
                {fieldText}
              </span>
              {!showPlaceholder && selectedOption?.supportingText !== undefined && (
                <span className={inputDropdownSupportingVariants({ device })}>
                  {selectedOption.supportingText}
                </span>
              )}
            </span>
          )}
          <span className={cn(inputDropdownChevronVariants(), classNames?.chevron)} aria-hidden>
            {chevron}
          </span>
        </Trigger>
      </div>

      {/* Figma drops the hint in the Open state. */}
      {hint !== undefined && !isOpen && (
        <p id={hintId} className={cn(inputDropdownHintVariants({ device }), classNames?.hint)}>
          {hint}
        </p>
      )}

      {isOpen && (
        <div
          id={menuId}
          role="listbox"
          aria-multiselectable={isMulti ? true : undefined}
          aria-labelledby={label === undefined ? undefined : labelId}
          className={cn(inputDropdownMenuVariants({ device }), classNames?.menu)}
        >
          {options.map((option, index) => {
            const isSelected = selectedValues.includes(option.value);
            const isActive = index === activeIndex;
            const isDisabled = option.disabled === true;
            // Desktop emphasises hover, selection and disablement alike; mobile
            // emphasises everything but hover.
            const emphasised =
              device === 'desktop'
                ? isActive || isSelected || isDisabled
                : isSelected || isDisabled;
            return (
              <button
                key={option.value}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                aria-disabled={ariaAttr(isDisabled)}
                tabIndex={-1}
                onMouseEnter={() => !isDisabled && setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(-1)}
                onClick={() => select(index)}
                onKeyDown={handleKeyDown}
                className={cn(
                  inputDropdownMenuItemVariants({
                    device,
                    active: isActive,
                    selected: isSelected,
                    disabled: isDisabled,
                  }),
                  classNames?.menuItem,
                )}
              >
                <span className={inputDropdownMenuItemContentVariants({ device, type })}>
                  {isMulti && (
                    <Checkbox
                      size={device === 'desktop' ? 'md' : 'sm'}
                      checked={isSelected}
                      disabled={isDisabled}
                      checkIcon={checkIcon}
                      // The row is the control: it owns the click and the ARIA. The
                      // Checkbox is the picture of the row's state, so it must not be
                      // a second tab stop or a second thing to activate.
                      tabIndex={-1}
                      aria-hidden
                      readOnly
                      classNames={{ control: classNames?.checkbox }}
                    />
                  )}
                  <span className={inputDropdownMenuItemTextVariants({ device })}>
                    <span
                      className={inputDropdownMenuItemLabelVariants({
                        device,
                        emphasised,
                        disabled: isDisabled,
                      })}
                    >
                      {option.label}
                    </span>
                    {option.supportingText !== undefined && (
                      <span
                        className={inputDropdownMenuItemSupportingVariants({
                          device,
                          disabled: isDisabled,
                        })}
                      >
                        {option.supportingText}
                      </span>
                    )}
                  </span>
                </span>
                {!isMulti && isSelected && (
                  <span className={inputDropdownMenuItemTickVariants({ device })} aria-hidden>
                    {tick}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
