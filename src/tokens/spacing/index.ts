/*
 * Spacing tokens.
 *
 * GENERATED FROM FIGMA — DO NOT EDIT BY HAND.
 * Run `pnpm generate:spacing-tokens` after re-exporting. Values match
 * src/foundations/spacing/spacing.css exactly.
 *
 * Values are the Figma px values divided by 16. Keys are Figma's step
 * numbers, with '-' for the fractional part. See docs/Foundations.md.
 */

/** The spacing scale, keyed by Figma step number. */
export const spacing = {
  '0': '0rem',
  '0-5': '0.125rem',
  '1': '0.25rem',
  '1-5': '0.375rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '8': '2rem',
  '10': '2.5rem',
  '12': '3rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  '32': '8rem',
  '40': '10rem',
  '48': '12rem',
  '56': '14rem',
  '64': '16rem',
  '80': '20rem',
  '96': '24rem',
  '120': '30rem',
  '140': '35rem',
  '160': '40rem',
  '180': '45rem',
  '192': '48rem',
  '256': '64rem',
  '320': '80rem',
  '360': '90rem',
  '400': '100rem',
  '480': '120rem',
} as const;

/** Original Figma name, pixel value and step for each token, for traceability. */
export const spacingSource = {
  '0': { figmaName: '0 (0px)', px: 0, step: 0 },
  '0-5': { figmaName: '0․5 (2px)', px: 2, step: 0.5 },
  '1': { figmaName: '1 (4px)', px: 4, step: 1 },
  '1-5': { figmaName: '1․5 (6px)', px: 6, step: 1.5 },
  '2': { figmaName: '2 (8px)', px: 8, step: 2 },
  '3': { figmaName: '3 (12px)', px: 12, step: 3 },
  '4': { figmaName: '4 (16px)', px: 16, step: 4 },
  '5': { figmaName: '5 (20px)', px: 20, step: 5 },
  '6': { figmaName: '6 (24px)', px: 24, step: 6 },
  '8': { figmaName: '8 (32px)', px: 32, step: 8 },
  '10': { figmaName: '10 (40px)', px: 40, step: 10 },
  '12': { figmaName: '12 (48px)', px: 48, step: 12 },
  '16': { figmaName: '16 (64px)', px: 64, step: 16 },
  '20': { figmaName: '20 (80px)', px: 80, step: 20 },
  '24': { figmaName: '24 (96px)', px: 96, step: 24 },
  '32': { figmaName: '32 (128px)', px: 128, step: 32 },
  '40': { figmaName: '40 (160px)', px: 160, step: 40 },
  '48': { figmaName: '48 (192px)', px: 192, step: 48 },
  '56': { figmaName: '56 (224px)', px: 224, step: 56 },
  '64': { figmaName: '64 (256px)', px: 256, step: 64 },
  '80': { figmaName: '80 (320px)', px: 320, step: 80 },
  '96': { figmaName: '96 (384px)', px: 384, step: 96 },
  '120': { figmaName: '120 (480px)', px: 480, step: 120 },
  '140': { figmaName: '140 (560px)', px: 560, step: 140 },
  '160': { figmaName: '160 (640px)', px: 640, step: 160 },
  '180': { figmaName: '180 (720px)', px: 720, step: 180 },
  '192': { figmaName: '192 (768px)', px: 768, step: 192 },
  '256': { figmaName: '256 (1,024px)', px: 1024, step: 256 },
  '320': { figmaName: '320 (1,280px)', px: 1280, step: 320 },
  '360': { figmaName: '360 (1,440px)', px: 1440, step: 360 },
  '400': { figmaName: '400 (1,600px)', px: 1600, step: 400 },
  '480': { figmaName: '480 (1,920px)', px: 1920, step: 480 },
} as const;

/**
 * Token keys in ascending scale order.
 *
 * Always iterate this rather than `Object.keys(spacing)`: JavaScript hoists
 * integer-like keys ('4') above string keys ('0-5'), so object enumeration
 * order does not match the scale.
 */
export const spacingScale = [
  '0',
  '0-5',
  '1',
  '1-5',
  '2',
  '3',
  '4',
  '5',
  '6',
  '8',
  '10',
  '12',
  '16',
  '20',
  '24',
  '32',
  '40',
  '48',
  '56',
  '64',
  '80',
  '96',
  '120',
  '140',
  '160',
  '180',
  '192',
  '256',
  '320',
  '360',
  '400',
  '480',
] as const;

/** A spacing token key, e.g. `4` or `0-5`. */
export type SpacingToken = keyof typeof spacing;

/** The CSS custom property for a spacing token, e.g. `--spacing-4`. */
export const spacingVar = (token: SpacingToken) => `--spacing-${token}` as const;
