/*
 * Radius tokens.
 *
 * GENERATED FROM FIGMA — DO NOT EDIT BY HAND.
 * Run `pnpm generate:radius-tokens` after re-exporting. Values match
 * src/foundations/radius/radius.css exactly.
 *
 * Values are the Figma px values divided by 16. See docs/Foundations.md.
 */

/** The radius scale, keyed by Figma name with the `radius-` prefix removed. */
export const radius = {
  none: '0rem',
  xxs: '0.125rem',
  xs: '0.25rem',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.625rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.25rem',
  '4xl': '1.5rem',
  full: '624.9375rem',
} as const;

/** Original Figma name and pixel value for each token, for traceability. */
export const radiusSource = {
  none: { figmaName: 'radius-none', px: 0 },
  xxs: { figmaName: 'radius-xxs', px: 2 },
  xs: { figmaName: 'radius-xs', px: 4 },
  sm: { figmaName: 'radius-sm', px: 6 },
  md: { figmaName: 'radius-md', px: 8 },
  lg: { figmaName: 'radius-lg', px: 10 },
  xl: { figmaName: 'radius-xl', px: 12 },
  '2xl': { figmaName: 'radius-2xl', px: 16 },
  '3xl': { figmaName: 'radius-3xl', px: 20 },
  '4xl': { figmaName: 'radius-4xl', px: 24 },
  full: { figmaName: 'radius-full', px: 9999 },
} as const;

/** A radius token key, e.g. `md` or `full`. */
export type RadiusToken = keyof typeof radius;

/** The CSS custom property for a radius token, e.g. `--radius-md`. */
export const radiusVar = (token: RadiusToken) => `--radius-${token}` as const;
