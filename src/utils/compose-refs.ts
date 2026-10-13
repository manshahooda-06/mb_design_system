import type { Ref, RefCallback } from 'react';

/**
 * Points every supplied ref at the same node.
 *
 * Needed because `asChild` produces two claims on one element — the component's
 * own ref and whatever ref the caller already put on their child. Dropping either
 * silently breaks focus management or the caller's measurement code.
 *
 * Returns a `RefCallback` rather than a `Ref`: a `Ref` is a union that includes
 * `RefObject`, so callers could not invoke the result directly.
 *
 * Lives apart from `Slot` because a module that exports both a component and a
 * helper defeats React Fast Refresh.
 */
export function composeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as { current: T | null }).current = node;
    }
  };
}
