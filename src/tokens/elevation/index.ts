/*
 * Elevation tokens.
 *
 * GENERATED FROM FIGMA — DO NOT EDIT BY HAND.
 * Run `pnpm generate:elevation-tokens` after re-exporting. Values match
 * src/foundations/elevation/elevation.css exactly.
 *
 * Composite tokens: each value is a full CSS box-shadow list, in paint order.
 * See docs/Foundations.md.
 */

/** The elevation scale, keyed by Figma name with the `shadow-` prefix removed. */
export const elevation = {
  'elevation-1': '0px 1px 1px 0px #00000005, 0px 2px 4px 0px #0000000a',
  'elevation-2': '0px 1px 4px 0px #0000000a, 0px 4px 10px 0px #0000000d',
  'elevation-3': '0px 2px 20px 0px #0000000a, 0px 8px 32px 0px #00000014',
  'elevation-4': '0px 8px 20px 0px #0000000f, 0px 24px 60px 0px #0000001f',
  'elevation-1-up': '0px -1px 1px 0px #00000003, 0px -2px 4px 0px #00000008',
  'elevation-2-up': '0px -1px 4px 0px #00000008, 0px -4px 10px 0px #0000000a',
  'elevation-3-up': '0px -2px 20px 0px #00000008, 0px -8px 32px 0px #00000012',
  'elevation-4-up': '0px -8px 20px 0px #0000000d, 0px -24px 60px 0px #0000001a',
} as const;

/** Original Figma name and layer count for each token, for traceability. */
export const elevationSource = {
  'elevation-1': { figmaName: 'shadow-elevation-1', layers: 2 },
  'elevation-2': { figmaName: 'shadow-elevation-2', layers: 2 },
  'elevation-3': { figmaName: 'shadow-elevation-3', layers: 2 },
  'elevation-4': { figmaName: 'shadow-elevation-4', layers: 2 },
  'elevation-1-up': { figmaName: 'shadow-elevation-1-up', layers: 2 },
  'elevation-2-up': { figmaName: 'shadow-elevation-2-up', layers: 2 },
  'elevation-3-up': { figmaName: 'shadow-elevation-3-up', layers: 2 },
  'elevation-4-up': { figmaName: 'shadow-elevation-4-up', layers: 2 },
} as const;

/** An elevation token key, e.g. `elevation-1` or `elevation-4-up`. */
export type ElevationToken = keyof typeof elevation;

/** The CSS custom property for an elevation token, e.g. `--shadow-elevation-4`. */
export const elevationVar = (token: ElevationToken) => `--shadow-${token}` as const;
