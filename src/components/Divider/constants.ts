/**
 * Hoisted out of the component module so it can export the component alone.
 *
 * A module that exports both a component and a value breaks Fast Refresh — the
 * `react-refresh/only-export-components` rule — which is why SearchBar's, Beneficiary's,
 * UploadModule's and Toast's constants live beside them too.
 */

/** Figma's `Orientation` axis on `Divider` (node `4725:3274`). */
export const DIVIDER_ORIENTATIONS = ['horizontal', 'vertical'] as const;

/** Figma's `Style` axis. Solid and dashed differ only by the dash pattern. */
export const DIVIDER_STYLES = ['solid', 'dashed'] as const;

/** Figma's `Variant` axis — the two greys, not a semantic intent. */
export const DIVIDER_VARIANTS = ['normal', 'lighter'] as const;

/**
 * Figma's dash pattern, as `stroke-dasharray="2 2"` — 2px of line, then 2px of gap.
 *
 * Kept as data because the gradients below are the only place it appears, and a reader
 * checking them against Figma should not have to count underscores to find it.
 */
export const DIVIDER_DASH_LENGTH = 2;
export const DIVIDER_DASH_GAP = 2;
