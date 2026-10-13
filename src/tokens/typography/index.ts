/*
 * Typography tokens.
 *
 * GENERATED FROM FIGMA — DO NOT EDIT BY HAND.
 * Run `pnpm generate:typography-tokens` after re-exporting. Values match
 * src/foundations/typography/typography.css exactly.
 *
 * Sizes and line heights are the Figma px values divided by 16. Weight names
 * are mapped to their standard CSS numeric equivalents. See docs/Foundations.md.
 */

/** Font families, keyed by role. */
export const fontFamily = {
  body: 'Lexend Deca',
  display: 'Lexend Deca',
} as const;

/** Weight scale, mapped from the Figma weight names. */
export const fontWeight = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

/** Size and line-height pairs, keyed by `<breakpoint>-<category>-<scale>`. */
export const fontSize = {
  'mobile-caption-sm': { size: '0.5rem', lineHeight: '0.75rem' },
  'mobile-caption-md': { size: '0.625rem', lineHeight: '1rem' },
  'mobile-body-sm': { size: '0.75rem', lineHeight: '1.25rem' },
  'mobile-body-md': { size: '0.875rem', lineHeight: '1.25rem' },
  'mobile-body-lg': { size: '1rem', lineHeight: '1.5rem' },
  'mobile-heading-sm': { size: '1rem', lineHeight: '1.5rem' },
  'mobile-heading-md': { size: '1.25rem', lineHeight: '2rem' },
  'mobile-heading-lg': { size: '1.5rem', lineHeight: '2.25rem' },
  'mobile-display-xs': { size: '1.5rem', lineHeight: '2.25rem' },
  'mobile-display-sm': { size: '1.75rem', lineHeight: '2.5rem' },
  'mobile-display-md': { size: '2rem', lineHeight: '3rem' },
  'mobile-display-lg': { size: '2.5rem', lineHeight: '3.25rem' },
  'mobile-banner-headline-sm': { size: '0.75rem', lineHeight: '1rem' },
  'mobile-banner-headline-md': { size: '0.875rem', lineHeight: '1.125rem' },
  'mobile-banner-headline-lg': { size: '1rem', lineHeight: '1.25rem' },
  'mobile-banner-body-md': { size: '0.625rem', lineHeight: '1rem' },
  'mobile-banner-body-lg': { size: '0.75rem', lineHeight: '1.125rem' },
  'mobile-banner-label-md': { size: '0.625rem', lineHeight: '0.875rem' },
  'mobile-banner-label-lg': { size: '0.75rem', lineHeight: '1rem' },
  'mobile-banner-cta-md': { size: '0.625rem', lineHeight: '0.875rem' },
  'mobile-banner-cta-lg': { size: '0.75rem', lineHeight: '1rem' },
  'desktop-caption-sm': { size: '0.75rem', lineHeight: '1rem' },
  'desktop-caption-md': { size: '0.875rem', lineHeight: '1.25rem' },
  'desktop-body-sm': { size: '1rem', lineHeight: '1.5rem' },
  'desktop-body-md': { size: '1.25rem', lineHeight: '1.75rem' },
  'desktop-heading-sm': { size: '1.5rem', lineHeight: '2.25rem' },
  'desktop-heading-md': { size: '1.75rem', lineHeight: '2.5rem' },
  'desktop-heading-lg': { size: '2rem', lineHeight: '3rem' },
  'desktop-display-xs': { size: '2rem', lineHeight: '3rem' },
  'desktop-display-sm': { size: '2.5rem', lineHeight: '3.25rem' },
  'desktop-display-md': { size: '3rem', lineHeight: '3.75rem' },
  'desktop-display-lg': { size: '3.75rem', lineHeight: '4.5rem' },
  'desktop-banner-headline-sm': { size: '1.5rem', lineHeight: '2rem' },
  'desktop-banner-headline-md': { size: '1.75rem', lineHeight: '2.25rem' },
  'desktop-banner-headline-lg': { size: '2rem', lineHeight: '3rem' },
  'desktop-banner-body-md': { size: '1.25rem', lineHeight: '2rem' },
  'desktop-banner-body-lg': { size: '1.5rem', lineHeight: '2.25rem' },
  'desktop-banner-label-md': { size: '1.25rem', lineHeight: '1.5rem' },
  'desktop-banner-label-lg': { size: '1.5rem', lineHeight: '1.75rem' },
  'desktop-banner-cta-md': { size: '1.25rem', lineHeight: '1.5rem' },
  'desktop-banner-cta-lg': { size: '1.5rem', lineHeight: '1.75rem' },
} as const;

/** Every composite text style, keyed by `<breakpoint>-<category>-<scale>-<weight>`. */
export const textStyles = {
  'mobile-caption-sm-light': { fontSize: '0.5rem', lineHeight: '0.75rem', fontWeight: 300 },
  'mobile-caption-sm-regular': { fontSize: '0.5rem', lineHeight: '0.75rem', fontWeight: 400 },
  'mobile-caption-sm-medium': { fontSize: '0.5rem', lineHeight: '0.75rem', fontWeight: 500 },
  'mobile-caption-sm-semibold': { fontSize: '0.5rem', lineHeight: '0.75rem', fontWeight: 600 },
  'mobile-caption-md-light': { fontSize: '0.625rem', lineHeight: '1rem', fontWeight: 300 },
  'mobile-caption-md-regular': { fontSize: '0.625rem', lineHeight: '1rem', fontWeight: 400 },
  'mobile-caption-md-medium': { fontSize: '0.625rem', lineHeight: '1rem', fontWeight: 500 },
  'mobile-caption-md-semibold': { fontSize: '0.625rem', lineHeight: '1rem', fontWeight: 600 },
  'mobile-body-sm-light': { fontSize: '0.75rem', lineHeight: '1.25rem', fontWeight: 300 },
  'mobile-body-sm-regular': { fontSize: '0.75rem', lineHeight: '1.25rem', fontWeight: 400 },
  'mobile-body-sm-medium': { fontSize: '0.75rem', lineHeight: '1.25rem', fontWeight: 500 },
  'mobile-body-sm-semibold': { fontSize: '0.75rem', lineHeight: '1.25rem', fontWeight: 600 },
  'mobile-body-md-light': { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 300 },
  'mobile-body-md-regular': { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 400 },
  'mobile-body-md-medium': { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 500 },
  'mobile-body-md-semibold': { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 600 },
  'mobile-body-lg-light': { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 300 },
  'mobile-body-lg-regular': { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 400 },
  'mobile-body-lg-medium': { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 500 },
  'mobile-body-lg-semibold': { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 600 },
  'mobile-heading-sm-light': { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 300 },
  'mobile-heading-sm-regular': { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 400 },
  'mobile-heading-sm-medium': { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 500 },
  'mobile-heading-sm-semibold': { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 600 },
  'mobile-heading-md-light': { fontSize: '1.25rem', lineHeight: '2rem', fontWeight: 300 },
  'mobile-heading-md-regular': { fontSize: '1.25rem', lineHeight: '2rem', fontWeight: 400 },
  'mobile-heading-md-medium': { fontSize: '1.25rem', lineHeight: '2rem', fontWeight: 500 },
  'mobile-heading-md-semibold': { fontSize: '1.25rem', lineHeight: '2rem', fontWeight: 600 },
  'mobile-heading-lg-light': { fontSize: '1.5rem', lineHeight: '2.25rem', fontWeight: 300 },
  'mobile-heading-lg-regular': { fontSize: '1.5rem', lineHeight: '2.25rem', fontWeight: 400 },
  'mobile-heading-lg-medium': { fontSize: '1.5rem', lineHeight: '2.25rem', fontWeight: 500 },
  'mobile-heading-lg-semibold': { fontSize: '1.5rem', lineHeight: '2.25rem', fontWeight: 600 },
  'mobile-display-xs-regular': { fontSize: '1.5rem', lineHeight: '2.25rem', fontWeight: 400 },
  'mobile-display-xs-medium': { fontSize: '1.5rem', lineHeight: '2.25rem', fontWeight: 500 },
  'mobile-display-xs-semibold': { fontSize: '1.5rem', lineHeight: '2.25rem', fontWeight: 600 },
  'mobile-display-xs-bold': { fontSize: '1.5rem', lineHeight: '2.25rem', fontWeight: 700 },
  'mobile-display-xs-extrabold': { fontSize: '1.5rem', lineHeight: '2.25rem', fontWeight: 800 },
  'mobile-display-sm-regular': { fontSize: '1.75rem', lineHeight: '2.5rem', fontWeight: 400 },
  'mobile-display-sm-medium': { fontSize: '1.75rem', lineHeight: '2.5rem', fontWeight: 500 },
  'mobile-display-sm-semibold': { fontSize: '1.75rem', lineHeight: '2.5rem', fontWeight: 600 },
  'mobile-display-sm-bold': { fontSize: '1.75rem', lineHeight: '2.5rem', fontWeight: 700 },
  'mobile-display-sm-extrabold': { fontSize: '1.75rem', lineHeight: '2.5rem', fontWeight: 800 },
  'mobile-display-md-regular': { fontSize: '2rem', lineHeight: '3rem', fontWeight: 400 },
  'mobile-display-md-medium': { fontSize: '2rem', lineHeight: '3rem', fontWeight: 500 },
  'mobile-display-md-semibold': { fontSize: '2rem', lineHeight: '3rem', fontWeight: 600 },
  'mobile-display-md-bold': { fontSize: '2rem', lineHeight: '3rem', fontWeight: 700 },
  'mobile-display-md-extrabold': { fontSize: '2rem', lineHeight: '3rem', fontWeight: 800 },
  'mobile-display-lg-regular': { fontSize: '2.5rem', lineHeight: '3.25rem', fontWeight: 400 },
  'mobile-display-lg-medium': { fontSize: '2.5rem', lineHeight: '3.25rem', fontWeight: 500 },
  'mobile-display-lg-semibold': { fontSize: '2.5rem', lineHeight: '3.25rem', fontWeight: 600 },
  'mobile-display-lg-bold': { fontSize: '2.5rem', lineHeight: '3.25rem', fontWeight: 700 },
  'mobile-display-lg-extrabold': { fontSize: '2.5rem', lineHeight: '3.25rem', fontWeight: 800 },
  'mobile-banner-headline-sm-semibold': {
    fontSize: '0.75rem',
    lineHeight: '1rem',
    fontWeight: 600,
  },
  'mobile-banner-headline-md-semibold': {
    fontSize: '0.875rem',
    lineHeight: '1.125rem',
    fontWeight: 600,
  },
  'mobile-banner-headline-lg-semibold': {
    fontSize: '1rem',
    lineHeight: '1.25rem',
    fontWeight: 600,
  },
  'mobile-banner-body-md-regular': { fontSize: '0.625rem', lineHeight: '1rem', fontWeight: 400 },
  'mobile-banner-body-lg-regular': { fontSize: '0.75rem', lineHeight: '1.125rem', fontWeight: 400 },
  'mobile-banner-label-md-medium': {
    fontSize: '0.625rem',
    lineHeight: '0.875rem',
    fontWeight: 500,
  },
  'mobile-banner-label-lg-medium': { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 500 },
  'mobile-banner-cta-md-semibold': {
    fontSize: '0.625rem',
    lineHeight: '0.875rem',
    fontWeight: 600,
  },
  'mobile-banner-cta-lg-semibold': { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 600 },
  'desktop-caption-sm-light': { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 300 },
  'desktop-caption-sm-regular': { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 400 },
  'desktop-caption-sm-medium': { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 500 },
  'desktop-caption-sm-semibold': { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: 600 },
  'desktop-caption-md-light': { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 300 },
  'desktop-caption-md-regular': { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 400 },
  'desktop-caption-md-medium': { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 500 },
  'desktop-caption-md-semibold': { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: 600 },
  'desktop-body-sm-light': { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 300 },
  'desktop-body-sm-regular': { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 400 },
  'desktop-body-sm-medium': { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 500 },
  'desktop-body-sm-semibold': { fontSize: '1rem', lineHeight: '1.5rem', fontWeight: 600 },
  'desktop-body-md-light': { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 300 },
  'desktop-body-md-regular': { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 400 },
  'desktop-body-md-medium': { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 500 },
  'desktop-body-md-semibold': { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 600 },
  'desktop-heading-sm-light': { fontSize: '1.5rem', lineHeight: '2.25rem', fontWeight: 300 },
  'desktop-heading-sm-regular': { fontSize: '1.5rem', lineHeight: '2.25rem', fontWeight: 400 },
  'desktop-heading-sm-medium': { fontSize: '1.5rem', lineHeight: '2.25rem', fontWeight: 500 },
  'desktop-heading-sm-semibold': { fontSize: '1.5rem', lineHeight: '2.25rem', fontWeight: 600 },
  'desktop-heading-md-light': { fontSize: '1.75rem', lineHeight: '2.5rem', fontWeight: 300 },
  'desktop-heading-md-regular': { fontSize: '1.75rem', lineHeight: '2.5rem', fontWeight: 400 },
  'desktop-heading-md-medium': { fontSize: '1.75rem', lineHeight: '2.5rem', fontWeight: 500 },
  'desktop-heading-md-semibold': { fontSize: '1.75rem', lineHeight: '2.5rem', fontWeight: 600 },
  'desktop-heading-lg-light': { fontSize: '2rem', lineHeight: '3rem', fontWeight: 300 },
  'desktop-heading-lg-regular': { fontSize: '2rem', lineHeight: '3rem', fontWeight: 400 },
  'desktop-heading-lg-medium': { fontSize: '2rem', lineHeight: '3rem', fontWeight: 500 },
  'desktop-heading-lg-semibold': { fontSize: '2rem', lineHeight: '3rem', fontWeight: 600 },
  'desktop-display-xs-regular': { fontSize: '2rem', lineHeight: '3rem', fontWeight: 400 },
  'desktop-display-xs-medium': { fontSize: '2rem', lineHeight: '3rem', fontWeight: 500 },
  'desktop-display-xs-semibold': { fontSize: '2rem', lineHeight: '3rem', fontWeight: 600 },
  'desktop-display-xs-bold': { fontSize: '2rem', lineHeight: '3rem', fontWeight: 700 },
  'desktop-display-xs-extrabold': { fontSize: '2rem', lineHeight: '3rem', fontWeight: 800 },
  'desktop-display-sm-regular': { fontSize: '2.5rem', lineHeight: '3.25rem', fontWeight: 400 },
  'desktop-display-sm-medium': { fontSize: '2.5rem', lineHeight: '3.25rem', fontWeight: 500 },
  'desktop-display-sm-semibold': { fontSize: '2.5rem', lineHeight: '3.25rem', fontWeight: 600 },
  'desktop-display-sm-bold': { fontSize: '2.5rem', lineHeight: '3.25rem', fontWeight: 700 },
  'desktop-display-sm-extrabold': { fontSize: '2.5rem', lineHeight: '3.25rem', fontWeight: 800 },
  'desktop-display-md-regular': { fontSize: '3rem', lineHeight: '3.75rem', fontWeight: 400 },
  'desktop-display-md-medium': { fontSize: '3rem', lineHeight: '3.75rem', fontWeight: 500 },
  'desktop-display-md-semibold': { fontSize: '3rem', lineHeight: '3.75rem', fontWeight: 600 },
  'desktop-display-md-bold': { fontSize: '3rem', lineHeight: '3.75rem', fontWeight: 700 },
  'desktop-display-md-extrabold': { fontSize: '3rem', lineHeight: '3.75rem', fontWeight: 800 },
  'desktop-display-lg-regular': { fontSize: '3.75rem', lineHeight: '4.5rem', fontWeight: 400 },
  'desktop-display-lg-medium': { fontSize: '3.75rem', lineHeight: '4.5rem', fontWeight: 500 },
  'desktop-display-lg-semibold': { fontSize: '3.75rem', lineHeight: '4.5rem', fontWeight: 600 },
  'desktop-display-lg-bold': { fontSize: '3.75rem', lineHeight: '4.5rem', fontWeight: 700 },
  'desktop-display-lg-extrabold': { fontSize: '3.75rem', lineHeight: '4.5rem', fontWeight: 800 },
  'desktop-banner-headline-sm-semibold': {
    fontSize: '1.5rem',
    lineHeight: '2rem',
    fontWeight: 600,
  },
  'desktop-banner-headline-md-semibold': {
    fontSize: '1.75rem',
    lineHeight: '2.25rem',
    fontWeight: 600,
  },
  'desktop-banner-headline-lg-semibold': { fontSize: '2rem', lineHeight: '3rem', fontWeight: 600 },
  'desktop-banner-body-md-regular': { fontSize: '1.25rem', lineHeight: '2rem', fontWeight: 400 },
  'desktop-banner-body-lg-regular': { fontSize: '1.5rem', lineHeight: '2.25rem', fontWeight: 400 },
  'desktop-banner-label-md-medium': { fontSize: '1.25rem', lineHeight: '1.5rem', fontWeight: 500 },
  'desktop-banner-label-lg-medium': { fontSize: '1.5rem', lineHeight: '1.75rem', fontWeight: 500 },
  'desktop-banner-cta-md-semibold': { fontSize: '1.25rem', lineHeight: '1.5rem', fontWeight: 600 },
  'desktop-banner-cta-lg-semibold': { fontSize: '1.5rem', lineHeight: '1.75rem', fontWeight: 600 },
} as const;

/** A font family role, e.g. `body`. */
export type FontFamily = keyof typeof fontFamily;

/** A weight name, e.g. `semibold`. */
export type FontWeight = keyof typeof fontWeight;

/** A size slot, e.g. `mobile-body-md`. */
export type FontSizeToken = keyof typeof fontSize;

/** A composite text style, e.g. `mobile-body-md-regular`. */
export type TextStyleToken = keyof typeof textStyles;

/** The CSS custom property for a size slot, e.g. `--text-mobile-body-md`. */
export const textVar = (token: FontSizeToken) => `--text-${token}` as const;
