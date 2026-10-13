/**
 * Hoisted out of the component module so it can export the component alone.
 *
 * A module that exports both a component and a value breaks Fast Refresh — the
 * `react-refresh/only-export-components` rule — which is why SearchBar's constants
 * live beside it too.
 */

/** Figma's `Device` axis on `Beneficiary Select Chip` (node `2180:33533`). */
export const BENEFICIARY_SELECT_CHIP_DEVICES = ['mobile', 'desktop'] as const;
