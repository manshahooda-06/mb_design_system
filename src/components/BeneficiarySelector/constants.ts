/**
 * Hoisted out of the component module so it can export the component alone.
 *
 * A module that exports both a component and a value breaks Fast Refresh — the
 * `react-refresh/only-export-components` rule — which is why SearchBar's constants
 * live beside it too.
 */

/** Figma's `Device` axis on `Beneficiary Selector` (node `2180:33550`). */
export const BENEFICIARY_SELECTOR_DEVICES = ['mobile', 'desktop'] as const;

/**
 * The separator Figma draws after the relation in `Self | 22 F`.
 *
 * Figma wraps it in the same `relationShow` gate as the relation itself, so it
 * follows the relation rather than sitting between two present values.
 */
export const META_SEPARATOR = '|';
