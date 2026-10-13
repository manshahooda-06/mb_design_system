import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '@utils/cn';
import { tagCheckboxTickVariants, tagCheckboxVariants } from './TagCheckbox.variants';

/** Figma publishes `sm`, `md` and `lg`, matching Tag's own scale. */
export type TagCheckboxSize = 'sm' | 'md' | 'lg';

interface TagCheckboxOwnProps {
  size?: TagCheckboxSize;
  checked?: boolean;
  disabled?: boolean;
  /** The tick glyph. Figma uses `tick-02` at 10/12/14. */
  tick?: ReactNode;
  className?: string;
}

export type TagCheckboxProps = TagCheckboxOwnProps &
  Omit<ComponentPropsWithRef<'button'>, keyof TagCheckboxOwnProps | 'children' | 'type'>;

/**
 * The checkbox inside a Tag.
 *
 * **Internal to Tag — not exported from the package.** Measured from Figma
 * `_Tag checkbox` (node 3308:406033, 24 variants). It is `_`-prefixed in Figma and
 * tag-scoped: 14/16/18 against a 4px radius.
 *
 * The design system's `Checkbox` now exists, and this deliberately did **not** become
 * it. Six measured differences make substitution a visual regression rather than a
 * cleanup: sizes 14/16/18 against 16/20, a constant 4px radius against 2-then-4, a
 * brand inset ring when checked against no stroke at all, a hover that darkens to
 * brand/700 against no hover, `inset-ring` against a real border, and no
 * indeterminate state. Tag's padding tables are calibrated to 14/16/18, so swapping
 * in 16/20 would move every `sm` and `lg` tag. The divergence is pinned by tests in
 * `Checkbox.test.tsx` so it cannot be merged away on the strength of the two looking
 * alike.
 *
 * A `role="checkbox"` button rather than an `<input type="checkbox">`: it lives
 * inside Tag, which is itself often inside a button or a listbox option, and a
 * nested native input brings form-submission semantics Figma does not imply.
 *
 * Worth knowing: Tag's own 72 published variants only ever instantiate
 * `Checked=False, State=Default`, so every other state here is reachable through
 * our API and through no Figma Tag variant.
 */
export function TagCheckbox({
  size = 'sm',
  checked = false,
  disabled = false,
  tick,
  className,
  ...rest
}: TagCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      className={cn(tagCheckboxVariants({ size, checked, disabled }), className)}
      {...rest}
    >
      {checked && (
        <span className={tagCheckboxTickVariants({ size })} aria-hidden>
          {tick}
        </span>
      )}
    </button>
  );
}
