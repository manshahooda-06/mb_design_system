/**
 * Shared prop contracts every Mozaic component builds on.
 *
 * These exist so Button, Badge, Avatar, Input and Modal agree on the *shape* of
 * their props without agreeing on their content. A consumer who has learned how
 * `className`, `asChild` and slots behave on one component has learned it for all
 * of them.
 *
 * Deliberately absent: anything a single component would use. This file is the
 * intersection of every component, not the union.
 *
 * React 19 note — `ref` is an ordinary prop on function components, so nothing
 * here wraps `forwardRef`. `ComponentPropsWithRef` already carries the correct
 * ref type for whichever element a component renders.
 */
import type { ComponentPropsWithRef, ElementType, ReactNode } from 'react';

/**
 * The floor every component prop type sits on.
 *
 * `className` is always accepted and always merged last, so a consumer can
 * override any variant decision without `!important` or a wrapper element.
 */
export interface BaseComponentProps {
  /** Merged after all variant classes, so consumer intent wins. */
  className?: string;
  children?: ReactNode;
}

/* -------------------------------------------------------------------------- */
/* Polymorphism                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Renders the component as a different element or component.
 *
 * Use for cases where the semantics change but the styling does not — a Button
 * that navigates should be an `<a>`, not a `<button>` with an onClick that calls
 * `router.push`, because only the former is focusable, right-clickable and
 * announced as a link.
 */
export interface AsProp<T extends ElementType> {
  as?: T;
}

/**
 * Props for a polymorphic component: its own props, plus every prop valid on
 * whichever element `as` resolves to.
 *
 * `Omit` gives the component's own props precedence — if a component declares
 * `size`, that wins over the native `size` attribute of `<input>`, which would
 * otherwise mean something entirely different.
 *
 * @example
 * type ButtonProps<T extends ElementType = 'button'> =
 *   PolymorphicProps<T, { variant?: 'primary' | 'secondary' }>;
 */
export type PolymorphicProps<T extends ElementType, Own = object> = AsProp<T> &
  Own &
  Omit<ComponentPropsWithRef<T>, keyof Own | 'as'>;

/* -------------------------------------------------------------------------- */
/* Slots                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Renders into the caller's child element instead of the component's own.
 *
 * The alternative — wrapping — breaks layout in flex and grid containers and
 * produces a second focusable node. See `Slot` in `@utils/slot`.
 */
export interface AsChildProps {
  /** Merge props onto the single child element rather than rendering an element. */
  asChild?: boolean;
}

/**
 * Content slots: caller-supplied nodes rendered at fixed positions.
 *
 * Named by position rather than by content (`startSlot`, not `leftIcon`) because
 * position is what the component controls. It cannot enforce that the node is an
 * icon, and `left` is wrong under right-to-left text.
 */
export interface ContentSlotProps {
  /** Rendered before `children`, in the inline-start position. */
  startSlot?: ReactNode;
  /** Rendered after `children`, in the inline-end position. */
  endSlot?: ReactNode;
}

/**
 * Per-slot class overrides for a component with more than one styled element.
 *
 * A single `className` can only reach the root. Components that style internal
 * parts accept `classNames={{ root: …, label: … }}`, keyed by the same slot names
 * their variant definition uses, so the styling surface and the override surface
 * cannot drift apart.
 *
 * @example
 * type BadgeSlot = 'root' | 'label' | 'dot';
 * interface BadgeProps { classNames?: SlotClassNames<BadgeSlot> }
 */
export type SlotClassNames<Slot extends string> = Partial<Record<Slot, string>>;

/* -------------------------------------------------------------------------- */
/* Shared vocabulary                                                          */
/* -------------------------------------------------------------------------- */

/**
 * The size scale every sized component uses.
 *
 * Shared so `size="md"` means the same relative step on a Button as on an Input,
 * which is what makes them line up when placed side by side. A component maps
 * these to tokens itself — the scale is shared, the values are not.
 *
 * Not every component supports every step; each narrows this union to what it
 * actually implements rather than accepting a size it renders identically.
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * The intent scale for components that communicate status.
 *
 * Maps onto the `utility-*` semantic colour families, which is why the names
 * match those families rather than describing colours.
 */
export type Intent = 'brand' | 'neutral' | 'success' | 'warning' | 'error';
