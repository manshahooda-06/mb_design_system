/**
 * The shared slot architecture: rendering into the caller's element.
 *
 * Components that accept `asChild` hand their props and styling to the single
 * child the caller supplied, instead of rendering an element of their own. This
 * is how a Button becomes a router link, or a Modal trigger becomes whatever the
 * caller already had, without the component knowing anything about routing.
 *
 * The alternative is wrapping, and wrapping is quietly wrong: an extra `<span>`
 * around a flex or grid child changes the layout, an extra `<button>` around an
 * `<a>` nests two interactive elements (invalid HTML, and screen readers announce
 * only one), and the outer element takes the focus ring while the inner takes the
 * click.
 */
import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from './cn';
import { composeRefs } from './compose-refs';

/** Props accepted by a slotted element: anything, plus the child to merge onto. */
type AnyProps = Record<string, unknown>;

export interface SlotProps extends AnyProps {
  children?: ReactNode;
}

/**
 * Merges slot props onto child props.
 *
 * The precedence rules differ per prop kind because the right answer differs:
 *
 * - **Event handlers** compose — both run, slot first. Overriding would mean a
 *   caller's `onClick` silently cancels the component's own behaviour, or the
 *   reverse. Both are surprising; running both is not.
 * - **`className`** merges through `cn`, child last, so the caller wins conflicts.
 * - **`style`** merges shallowly, child last, for the same reason.
 * - **`ref`** composes, per `composeRefs`.
 * - **Everything else** takes the child's value when the child sets one. The
 *   caller is more specific than the component.
 */
function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps };

  for (const [key, childValue] of Object.entries(childProps)) {
    const slotValue = slotProps[key];
    const isEventHandler = /^on[A-Z]/.test(key);

    if (isEventHandler && typeof slotValue === 'function' && typeof childValue === 'function') {
      merged[key] = (...args: unknown[]) => {
        (slotValue as (...a: unknown[]) => void)(...args);
        (childValue as (...a: unknown[]) => void)(...args);
      };
    } else if (key === 'className') {
      merged[key] = cn(slotValue as string, childValue as string);
    } else if (key === 'style') {
      merged[key] = { ...(slotValue as object), ...(childValue as object) };
    } else if (key === 'ref') {
      merged[key] = composeRefs(slotValue as Ref<unknown>, childValue as Ref<unknown>);
    } else {
      merged[key] = childValue;
    }
  }

  return merged;
}

/**
 * Renders `children` with the slot's props merged onto it.
 *
 * Throws when given anything other than exactly one element. `asChild` with two
 * children has no correct interpretation — the component's props can only land on
 * one of them — and silently picking the first would produce a component that
 * looks styled in the DOM inspector but ignores half its own props. Text children
 * fail for the same reason: a string cannot receive `onClick`.
 */
export function Slot({ children, ...slotProps }: SlotProps) {
  const child = Children.only(children) as ReactElement<AnyProps>;

  if (!isValidElement(child)) {
    throw new Error(
      'Slot expects a single React element child. `asChild` merges props onto that ' +
        'element, which a text or fragment child cannot receive.',
    );
  }

  return cloneElement(child, mergeProps(slotProps, child.props));
}
