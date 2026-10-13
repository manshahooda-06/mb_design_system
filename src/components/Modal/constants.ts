/**
 * Hoisted out of the component module so it can export the component alone.
 *
 * A module that exports both a component and a value breaks Fast Refresh — the
 * `react-refresh/only-export-components` rule — which is why SearchBar's, Beneficiary's,
 * UploadModule's, Toast's, Divider's and BottomSheet's constants live beside them too.
 */

/**
 * Figma's `Device` axis, published on `Modal` (node `4792:13831`) and again on the nested
 * `_Modal card`.
 *
 * A real published axis, unlike BottomSheet's — the two devices differ in width, padding,
 * gaps, glyph sizes and every type step, not just in scale.
 */
export const MODAL_DEVICES = ['desktop', 'mobile'] as const;

/**
 * Figma's `type` axis, published on the nested `_Modal card` (node `4792:13743`).
 *
 * All three published values, kebab-cased like every enum in this library: Figma writes
 * `icon+text`, `text only` and `custom`. They are three different layouts rather than
 * three skins —
 *
 * - `icon-text` has no header title and no divider; its body is a centred illustration
 *   over a heading and an optional sub-text.
 * - `text-only` has a header title with an optional leading glyph, a divider beneath it,
 *   and one paragraph of body text.
 * - `custom` keeps that header and divider, and hands the body to the caller.
 */
export const MODAL_TYPES = ['icon-text', 'text-only', 'custom'] as const;
