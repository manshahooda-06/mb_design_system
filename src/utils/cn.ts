import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Mozaic's semantic tokens are named, not numeric: `px-semantic-lg`, not `px-4`.
 *
 * tailwind-merge decides whether two classes conflict by validating the *value*
 * against the scale it expects, and `semantic-lg` matches none of its built-in
 * validators. Without this, `twMerge('px-semantic-lg', 'px-semantic-xl')` returns
 * **both** classes rather than the last one — so a caller's `className` would not
 * reliably override a variant's padding, and which one won would depend on the
 * order Tailwind happened to emit them in.
 *
 * Colours hid the problem: `bg-*` accepts any value, so semantic colours deduped
 * correctly while semantic spacing silently did not.
 */
const isSemanticToken = (value: string) => value.startsWith('semantic-');

/**
 * Container tokens predate the `-semantic-` qualifier and are named plainly —
 * `max-w-desktop`, `p-container-padding-mobile`. They are semantic tokens all the
 * same, and need the same treatment.
 */
const isContainerToken = (value: string) =>
  value === 'desktop' || value.startsWith('container-padding-');

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: [isSemanticToken, isContainerToken],
      color: [isSemanticToken],
      radius: [isSemanticToken],
      text: [isSemanticToken],
    },
  },
});

/**
 * Joins class names and resolves Tailwind conflicts, last one winning.
 *
 * Every component funnels its classes through this, which is what makes a
 * consumer's `className` able to override a variant without `!important`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
