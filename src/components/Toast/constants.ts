/**
 * Hoisted out of the component module so it can export the component alone.
 *
 * A module that exports both a component and a value breaks Fast Refresh — the
 * `react-refresh/only-export-components` rule — which is why SearchBar's, Beneficiary's
 * and UploadModule's constants live beside them too.
 */

/**
 * Figma's `State` axis on `Toast` (node `2181:829`).
 *
 * Named `State` in Figma but valued `Mobile | Desktop`, so it is a device axis wearing
 * another name. The prop keeps Figma's name; the values are lowercased, as every enum
 * value in this library is.
 */
export const TOAST_STATES = ['mobile', 'desktop'] as const;
