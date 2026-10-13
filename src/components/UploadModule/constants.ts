/**
 * Hoisted out of the component module so it can export the component alone.
 *
 * A module that exports both a component and a value breaks Fast Refresh — the
 * `react-refresh/only-export-components` rule — which is why SearchBar's and
 * Beneficiary's constants live beside them too.
 */

/** Figma's `Size` axis on `Upload Module` (node `2180:67664`). */
export const UPLOAD_MODULE_SIZES = ['sm', 'md', 'lg'] as const;

/**
 * Figma's `State` axis.
 *
 * Two structurally different bodies behind one box: `add` draws an icon over a
 * label, `display` draws a preview with two action affordances. The box itself —
 * size, radius and stroke — is identical across both, which is why this is one
 * component with a state axis rather than two components.
 */
export const UPLOAD_MODULE_STATES = ['add', 'display'] as const;
