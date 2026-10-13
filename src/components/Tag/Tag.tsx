import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import type { BaseComponentProps, SlotClassNames } from '@/types';
import { cn } from '@utils/cn';
import { TagCheckbox } from './TagCheckbox';
import {
  tagCloseIconVariants,
  tagCloseVariants,
  tagContentVariants,
  tagCountVariants,
  tagDotVariants,
  tagIconVariants,
  tagLabelVariants,
  tagRootVariants,
} from './Tag.variants';

/** Figma's `Size` axis. Heights are 26 / 24 / 28 — `md` is the shortest. */
export type TagSize = 'sm' | 'md' | 'lg';

/**
 * Figma's `Icon` axis, minus `False`.
 *
 * `Country` and `Avatar` are geometrically identical (both 16px at every size) and
 * differ only in radius, so they are one prop with two shapes rather than two sizes.
 */
export type TagIconVariant = 'dot' | 'flag' | 'avatar';

type TagSlot = 'root' | 'content' | 'label' | 'icon' | 'count' | 'close' | 'checkbox';

interface TagOwnProps extends Omit<BaseComponentProps, 'children'> {
  size?: TagSize;
  label: ReactNode;
  /**
   * The leading glyph. Figma's `Icon` axis.
   *
   * For `dot` this is ignored — Figma draws a fixed 6px `success/500` circle with no
   * swap slot, so there is nothing for a caller to supply.
   */
  icon?: ReactNode;
  /** Which leading shape to draw. Required whenever a dot is wanted. */
  iconVariant?: TagIconVariant;
  /**
   * Figma's `Action=Count`.
   *
   * `count` and `onRemove` are one axis in Figma, so passing both is meaningless.
   * `onRemove` wins if both are given — a precedence rule rather than a type-level
   * union, because a union on these two makes the component impossible to spread
   * props into, and `{...props}` is how wrappers and Storybook pass args.
   */
  count?: ReactNode;
  /** Figma's `Action=X close`. Takes precedence over `count`. */
  onRemove?: () => void;
  /** The close glyph. Figma uses `cancel-01` at 10px. */
  closeIcon?: ReactNode;
  /** Accessible name for the close button. */
  removeLabel?: string;
  /** Figma's `Checkbox` axis — renders the leading checkbox. */
  selectable?: boolean;
  /** Only reaches the checkbox: Tag itself publishes no selected state. */
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  /** Only reaches the checkbox and the close button. Tag publishes no disabled state. */
  disabled?: boolean;
  /** The checkbox tick glyph. Figma uses `tick-02`. */
  tickIcon?: ReactNode;
  classNames?: SlotClassNames<TagSlot>;
}

export type TagProps = TagOwnProps &
  Omit<ComponentPropsWithoutRef<'span'>, keyof TagOwnProps | 'children'>;

/**
 * A compact label, optionally removable, countable or selectable.
 *
 * Measured from Figma `Tag` (node 3307:417515) — all **72** variants:
 * `Size`(3) × `Icon`(4) × `Action`(3) × `Checkbox`(2).
 *
 * **Tag has no state axis.** Figma publishes no hover, focus, pressed, disabled,
 * selected or error state, and no filled or tonal type — every one of the 72 is
 * white with a 1px grey stroke. `disabled` and `selected` here reach only the
 * nested checkbox and the close button.
 *
 * Padding is the component's substance. Figma's 72 variants carry 23 distinct
 * `pl`/`pr` pairs which decompose cleanly: `pl` tracks size × leading element, `pr`
 * tracks size × action. See `Tag.variants.ts`.
 *
 * ```tsx
 * <Tag label="Design" onRemove={remove} closeIcon={<X />} />
 * <Tag label="Olivia" size="md" iconVariant="avatar" icon={<img src={…} />} />
 * <Tag label="Filters" count={5} />
 * ```
 */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
  {
    size = 'sm',
    label,
    icon,
    iconVariant,
    count,
    onRemove,
    closeIcon,
    removeLabel = 'Remove',
    selectable = false,
    selected = false,
    onSelectedChange,
    disabled = false,
    tickIcon,
    className,
    classNames,
    ...rest
  },
  ref,
) {
  const hasIcon = iconVariant !== undefined;
  const hasClose = onRemove !== undefined;
  // One Figma axis, so only one renders. Close wins.
  const hasCount = !hasClose && count !== undefined && count !== null;

  // `pl` compensates for whatever sits furthest left, so the checkbox wins over the
  // icon, which wins over nothing.
  const lead = selectable
    ? 'checkbox'
    : hasIcon
      ? iconVariant === 'dot'
        ? 'dot'
        : 'media'
      : 'none';
  const action = hasClose ? 'close' : hasCount ? 'count' : 'text';

  return (
    <span
      className={cn(tagRootVariants({ size, lead, action }), classNames?.root, className)}
      {...rest}
      ref={ref}
    >
      <span className={cn(tagContentVariants({ size }), classNames?.content)}>
        {selectable && (
          <TagCheckbox
            size={size}
            checked={selected}
            disabled={disabled}
            tick={tickIcon}
            aria-label={typeof label === 'string' ? label : undefined}
            onClick={() => onSelectedChange?.(!selected)}
            className={classNames?.checkbox}
          />
        )}

        {hasIcon && (
          <span className={cn(tagIconVariants({ variant: iconVariant }), classNames?.icon)}>
            {/* Figma's dot has no swap slot — it is a fixed 6px success circle. */}
            {iconVariant === 'dot' ? <span className={tagDotVariants()} /> : icon}
          </span>
        )}

        <span className={cn(tagLabelVariants({ size }), classNames?.label)}>{label}</span>

        {hasCount && (
          <span className={cn(tagCountVariants({ size }), classNames?.count)}>{count}</span>
        )}
      </span>

      {hasClose && (
        <button
          type="button"
          aria-label={removeLabel}
          disabled={disabled}
          onClick={onRemove}
          className={cn(tagCloseVariants(), classNames?.close)}
        >
          <span className={tagCloseIconVariants()} aria-hidden>
            {closeIcon}
          </span>
        </button>
      )}
    </span>
  );
});

Tag.displayName = 'Tag';
