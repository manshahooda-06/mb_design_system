/**
 * Hoisted out of the component module so it can export the component alone.
 *
 * A module that exports both a component and a value breaks Fast Refresh — the
 * `react-refresh/only-export-components` rule — which is why SearchBar's, Beneficiary's,
 * UploadModule's, Toast's and Divider's constants live beside them too.
 */

/**
 * Figma's `type` axis, published on the nested `_Footer` (node `4751:5477`) rather than
 * on the sheet itself.
 *
 * Both published variants, in the order the component set lists them, with the values
 * kebab-cased like every enum in this library: Figma writes `2 buttons` and `1 button`.
 *
 * The two differ only in how many actions the row holds — the row's own styling is
 * identical, and each button is `flex: 1 0 0`, so one spans the full width and two share
 * it equally. `two-buttons` is the default because that is the variant the Bottom Sheet
 * instantiates.
 */
export const BOTTOM_SHEET_TYPES = ['two-buttons', 'one-button'] as const;
