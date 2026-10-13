/*
 * Semantic container tokens.
 *
 * GENERATED FROM FIGMA — DO NOT EDIT BY HAND.
 * Run `pnpm generate:container-tokens` after re-exporting. Values match
 * src/semantic/container/container.css exactly.
 *
 * Each token aliases a spacing primitive. `container` holds the var()
 * reference as emitted in CSS; `containerResolved` holds the literal the
 * alias resolves to, for code that needs a concrete value.
 */

/**
 * Semantic container tokens, as emitted in CSS.
 *
 * Each value is a `var()` reference to the primitive it aliases, so a change
 * to that primitive propagates here automatically. Use these in CSS contexts;
 * for a concrete value, use `containerResolved`.
 */
export const container = {
  'padding-mobile': 'var(--spacing-4)',
  'padding-desktop': 'var(--spacing-8)',
  'max-width-desktop': 'var(--spacing-320)',
} as const;

/** The literal value each alias resolves to, for code that needs a concrete value. */
export const containerResolved = {
  'padding-mobile': '1rem',
  'padding-desktop': '2rem',
  'max-width-desktop': '80rem',
} as const;

/** Full provenance for each token: its Figma name, the primitive it aliases, and the CSS variable it is emitted as. */
export const containerSource = {
  'padding-mobile': {
    figmaName: 'container-padding-mobile',
    px: 16,
    aliasOf: 'Spacing/4 (16px)',
    primitiveToken: 'spacing.4',
    primitiveVar: '--spacing-4',
    cssVar: '--spacing-container-padding-mobile',
  },
  'padding-desktop': {
    figmaName: 'container-padding-desktop',
    px: 32,
    aliasOf: 'Spacing/8 (32px)',
    primitiveToken: 'spacing.8',
    primitiveVar: '--spacing-8',
    cssVar: '--spacing-container-padding-desktop',
  },
  'max-width-desktop': {
    figmaName: 'container-max-width-desktop',
    px: 1280,
    aliasOf: 'Spacing/320 (1,280px)',
    primitiveToken: 'spacing.320',
    primitiveVar: '--spacing-320',
    cssVar: '--container-desktop',
  },
} as const;

/** A semantic container token key, e.g. `padding-mobile`. */
export type ContainerToken = keyof typeof container;

/**
 * The CSS custom property a container token is emitted as.
 *
 * A lookup rather than a template, because tokens live in different Tailwind
 * namespaces depending on the property they represent.
 */
export const containerVar = (token: ContainerToken) => containerSource[token].cssVar;
