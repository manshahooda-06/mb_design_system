/*
 * Semantic spacing tokens.
 *
 * GENERATED FROM FIGMA — DO NOT EDIT BY HAND.
 * Run `pnpm generate:semantic-spacing-tokens` after re-exporting. Values
 * match src/semantic/spacing/spacing.css exactly.
 *
 * Exports are prefixed `semanticSpacing` to avoid colliding with the
 * primitive spacing foundation, which exports `spacing`.
 */

/**
 * Semantic spacing tokens, as emitted in CSS.
 *
 * Each value is a `var()` reference to the primitive spacing step it aliases,
 * so a change to that primitive propagates here automatically. Use these in
 * CSS contexts; for a concrete value use `semanticSpacingResolved`.
 */
export const semanticSpacing = {
  none: 'var(--spacing-0)',
  xxs: 'var(--spacing-0-5)',
  xs: 'var(--spacing-1)',
  sm: 'var(--spacing-1-5)',
  md: 'var(--spacing-2)',
  lg: 'var(--spacing-3)',
  xl: 'var(--spacing-4)',
  '2xl': 'var(--spacing-5)',
  '3xl': 'var(--spacing-6)',
  '4xl': 'var(--spacing-8)',
  '5xl': 'var(--spacing-10)',
  '6xl': 'var(--spacing-12)',
  '7xl': 'var(--spacing-16)',
  '8xl': 'var(--spacing-20)',
  '9xl': 'var(--spacing-24)',
  '10xl': 'var(--spacing-32)',
  '11xl': 'var(--spacing-40)',
} as const;

/** The literal value each alias resolves to, for code that needs a concrete value. */
export const semanticSpacingResolved = {
  none: '0rem',
  xxs: '0.125rem',
  xs: '0.25rem',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
  '3xl': '1.5rem',
  '4xl': '2rem',
  '5xl': '2.5rem',
  '6xl': '3rem',
  '7xl': '4rem',
  '8xl': '5rem',
  '9xl': '6rem',
  '10xl': '8rem',
  '11xl': '10rem',
} as const;

/** Full provenance for each token: its Figma name, the primitive it aliases, and the CSS variable it is emitted as. */
export const semanticSpacingSource = {
  none: {
    figmaName: 'spacing-none',
    px: 0,
    aliasOf: 'Spacing/0 (0px)',
    primitiveToken: 'spacing.0',
    primitiveVar: '--spacing-0',
    cssVar: '--spacing-semantic-none',
  },
  xxs: {
    figmaName: 'spacing-xxs',
    px: 2,
    aliasOf: 'Spacing/0․5 (2px)',
    primitiveToken: 'spacing.0-5',
    primitiveVar: '--spacing-0-5',
    cssVar: '--spacing-semantic-xxs',
  },
  xs: {
    figmaName: 'spacing-xs',
    px: 4,
    aliasOf: 'Spacing/1 (4px)',
    primitiveToken: 'spacing.1',
    primitiveVar: '--spacing-1',
    cssVar: '--spacing-semantic-xs',
  },
  sm: {
    figmaName: 'spacing-sm',
    px: 6,
    aliasOf: 'Spacing/1․5 (6px)',
    primitiveToken: 'spacing.1-5',
    primitiveVar: '--spacing-1-5',
    cssVar: '--spacing-semantic-sm',
  },
  md: {
    figmaName: 'spacing-md',
    px: 8,
    aliasOf: 'Spacing/2 (8px)',
    primitiveToken: 'spacing.2',
    primitiveVar: '--spacing-2',
    cssVar: '--spacing-semantic-md',
  },
  lg: {
    figmaName: 'spacing-lg',
    px: 12,
    aliasOf: 'Spacing/3 (12px)',
    primitiveToken: 'spacing.3',
    primitiveVar: '--spacing-3',
    cssVar: '--spacing-semantic-lg',
  },
  xl: {
    figmaName: 'spacing-xl',
    px: 16,
    aliasOf: 'Spacing/4 (16px)',
    primitiveToken: 'spacing.4',
    primitiveVar: '--spacing-4',
    cssVar: '--spacing-semantic-xl',
  },
  '2xl': {
    figmaName: 'spacing-2xl',
    px: 20,
    aliasOf: 'Spacing/5 (20px)',
    primitiveToken: 'spacing.5',
    primitiveVar: '--spacing-5',
    cssVar: '--spacing-semantic-2xl',
  },
  '3xl': {
    figmaName: 'spacing-3xl',
    px: 24,
    aliasOf: 'Spacing/6 (24px)',
    primitiveToken: 'spacing.6',
    primitiveVar: '--spacing-6',
    cssVar: '--spacing-semantic-3xl',
  },
  '4xl': {
    figmaName: 'spacing-4xl',
    px: 32,
    aliasOf: 'Spacing/8 (32px)',
    primitiveToken: 'spacing.8',
    primitiveVar: '--spacing-8',
    cssVar: '--spacing-semantic-4xl',
  },
  '5xl': {
    figmaName: 'spacing-5xl',
    px: 40,
    aliasOf: 'Spacing/10 (40px)',
    primitiveToken: 'spacing.10',
    primitiveVar: '--spacing-10',
    cssVar: '--spacing-semantic-5xl',
  },
  '6xl': {
    figmaName: 'spacing-6xl',
    px: 48,
    aliasOf: 'Spacing/12 (48px)',
    primitiveToken: 'spacing.12',
    primitiveVar: '--spacing-12',
    cssVar: '--spacing-semantic-6xl',
  },
  '7xl': {
    figmaName: 'spacing-7xl',
    px: 64,
    aliasOf: 'Spacing/16 (64px)',
    primitiveToken: 'spacing.16',
    primitiveVar: '--spacing-16',
    cssVar: '--spacing-semantic-7xl',
  },
  '8xl': {
    figmaName: 'spacing-8xl',
    px: 80,
    aliasOf: 'Spacing/20 (80px)',
    primitiveToken: 'spacing.20',
    primitiveVar: '--spacing-20',
    cssVar: '--spacing-semantic-8xl',
  },
  '9xl': {
    figmaName: 'spacing-9xl',
    px: 96,
    aliasOf: 'Spacing/24 (96px)',
    primitiveToken: 'spacing.24',
    primitiveVar: '--spacing-24',
    cssVar: '--spacing-semantic-9xl',
  },
  '10xl': {
    figmaName: 'spacing-10xl',
    px: 128,
    aliasOf: 'Spacing/32 (128px)',
    primitiveToken: 'spacing.32',
    primitiveVar: '--spacing-32',
    cssVar: '--spacing-semantic-10xl',
  },
  '11xl': {
    figmaName: 'spacing-11xl',
    px: 160,
    aliasOf: 'Spacing/40 (160px)',
    primitiveToken: 'spacing.40',
    primitiveVar: '--spacing-40',
    cssVar: '--spacing-semantic-11xl',
  },
} as const;

/**
 * Token keys in ascending scale order.
 *
 * Iterate this rather than `Object.keys(semanticSpacing)`: JavaScript hoists
 * integer-like keys above string keys, and while no key here is a canonical
 * integer today, relying on object order for a scale is a hazard worth
 * avoiding outright.
 */
export const semanticSpacingScale = [
  'none',
  'xxs',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
  '9xl',
  '10xl',
  '11xl',
] as const;

/** A semantic spacing token key, e.g. `md` or `2xl`. */
export type SemanticSpacingToken = keyof typeof semanticSpacing;

/** The CSS custom property a semantic spacing token is emitted as, e.g. `--spacing-md`. */
export const semanticSpacingVar = (token: SemanticSpacingToken) =>
  semanticSpacingSource[token].cssVar;
