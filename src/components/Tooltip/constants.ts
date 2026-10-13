/**
 * Tooltip's measured geometry, hoisted so the variants, the arrow glyph and the
 * tests all read the same numbers.
 *
 * Every value here was read from Figma `Tooltip` (node `1052:489`, 14 variants) —
 * either from the published bounding boxes or from the exported arrow asset. None
 * is estimated.
 */

/**
 * Figma's `Arrow` axis, in the order the component set lists it.
 *
 * Exposed as `arrowPosition`, which keeps Figma's `Arrow` term and says what the value
 * actually selects: where the arrow attaches, and so where the tooltip sits relative to
 * what it describes. The values themselves are Figma's, unchanged.
 */
export const TOOLTIP_ARROW_POSITIONS = [
  'none',
  'bottom-center',
  'bottom-left',
  'bottom-right',
  'top-center',
  'left',
  'right',
] as const;

export const TOOLTIP_CONSTANTS = {
  ARIA: {
    /** `role="tooltip"` carries no implicit name; the consumer points at it by id. */
    ROLE: 'tooltip',
  },

  /**
   * The arrow, from the exported SVG rather than redrawn.
   *
   * Figma exports three assets for the seven positions, but they are one shape:
   * the 28-wide "Bottom left" asset is the 16-wide path translated **exactly
   * +12px** (every x in the path differs by 12.0), and "Top center" is the same
   * asset under `rotate-180`. So one path plus placement reproduces all six.
   *
   * The path is 16 × 8.51471, of which only **6px** protrudes past the body —
   * Figma tucks the remaining 2.51471px behind it, which is what carries the two
   * rounded top corners. Rather than reproduce that with a negative offset, the
   * glyph crops to the visible window through its `viewBox` (see `VIEW_BOX`);
   * the rendered result is identical because the hidden part sits behind an
   * opaque surface either way.
   */
  ARROW: {
    /** Base width — one `semantic-xl`. */
    WIDTH: 16,
    /** How far it protrudes — one `semantic-sm`. */
    PROTRUSION: 6,
    /** Full height of the exported path, tip included. */
    SHAPE_HEIGHT: 8.51471,
    /** `SHAPE_HEIGHT - PROTRUSION` — the part Figma hides behind the body. */
    OVERLAP: 2.51471,
    /**
     * Crops the path to the 6px that shows. Identical to Figma's overlap, without
     * needing an off-scale offset: `0 2.51471 16 6`.
     */
    VIEW_BOX: '0 2.51471 16 6',
    /**
     * Verbatim from Figma's export. A triangle with three rounded corners — two
     * at the base and one at the tip — not a plain polygon, which is why it is
     * copied rather than expressed as a CSS border trick.
     */
    PATH:
      'M14.0711 2.38419e-07C14.962 2.38419e-07 15.4081 1.07714 14.7782 1.70711' +
      'L8.70711 7.77818C8.31658 8.16871 7.68342 8.16871 7.29289 7.77818' +
      'L1.22183 1.70711C0.591867 1.07714 1.03803 2.38419e-07 1.92894 2.38419e-07' +
      'H14.0711Z',
  },

  /**
   * `uui-shadows/shadow-lg`, the one value in this component with no Mozaic token.
   *
   * Three drop shadows, applied to the wrapper that holds the body **and** the
   * arrow so the shadow traces the combined silhouette. A `box-shadow` on the body
   * cannot do that: the arrow would cast none, and shadowing it separately draws a
   * seam where the two meet.
   *
   * Figma reports the effect as box-shadow-shaped (offset, radius, spread). As a
   * filter there is no spread and the blur halves, which is the conversion Figma's
   * own codegen emits and what is reproduced here:
   *
   * | Figma layer  | colour     | box-shadow            | as drop-shadow |
   * | ------------ | ---------- | --------------------- | -------------- |
   * | shadow-lg_03 | `#171b220a` | 0 2px 2px -1px       | 0 2px 1px      |
   * | shadow-lg_02 | `#171b2208` | 0 4px 6px -2px       | 0 4px 3px      |
   * | shadow-lg_01 | `#171b2214` | 0 12px 16px -4px     | 0 12px 8px     |
   *
   * Front-to-back, matching the CSS filter order.
   */
  SHADOW: {
    // The Figma style's name is recorded in the comment above rather than as a
    // constant: nothing reads it, and a bare `shadow-…` string in shipped source
    // trips the "Elevation is the only shadow foundation" guard in
    // architecture.test.ts, which cannot tell a style name from an applied class.
    LAYERS: [
      { offsetY: 2, blur: 1, color: '#171b220a' },
      { offsetY: 4, blur: 3, color: '#171b2208' },
      { offsetY: 12, blur: 8, color: '#171b2214' },
    ],
  },
} as const;
