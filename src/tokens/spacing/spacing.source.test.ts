/**
 * Fidelity guard: re-derives every spacing token straight from the Figma export
 * and fails if the generated CSS or TypeScript has drifted from it.
 *
 * If this fails after a re-export, the generator — not the generated files — is
 * what needs fixing.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { spacing, spacingSource } from './index';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

const ROOT_FONT_SIZE = 16;
const ONE_DOT_LEADER = '․';

const rem = (px: number) => `${Number((px / ROOT_FONT_SIZE).toFixed(6))}rem`;

type Leaf = { $value: number };
type Export = { Spacing: Record<string, Leaf> };

const raw = JSON.parse(read('../../../figma/exports/primitives/colors.json')) as Export;

/** `0․5 (2px)` -> `{ key: '0-5', px: 2, step: 0.5 }` */
function parse(figmaName: string) {
  const match = /^([\d․.]+)\s*\((\d[\d,]*)px\)$/.exec(figmaName);
  if (!match) throw new Error(`Unparseable spacing name: ${figmaName}`);
  const step = Number(match[1]!.replaceAll(ONE_DOT_LEADER, '.'));
  return { key: String(step).replace('.', '-'), px: Number(match[2]!.replaceAll(',', '')), step };
}

const figma = Object.entries(raw.Spacing).map(([name, leaf]) => ({
  ...parse(name),
  figmaName: name,
  value: leaf.$value,
}));

describe('spacing token fidelity', () => {
  it('covers every token in the export', () => {
    expect(Object.keys(spacing)).toHaveLength(figma.length);
    expect(Object.keys(spacing)).toHaveLength(32);
  });

  it('matches the Figma export exactly', () => {
    const expected = Object.fromEntries(figma.map((t) => [t.key, rem(t.value)]));
    expect(spacing).toEqual(expected);
  });

  it('keeps the CSS layer identical to the TypeScript layer', () => {
    const css = read('../../foundations/spacing/spacing.css');
    const vars = Object.fromEntries(
      [...css.matchAll(/--spacing-([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]!.trim()]),
    );
    expect(vars).toEqual(spacing);
  });

  it('preserves the original Figma name, pixel value and step', () => {
    const expected = Object.fromEntries(
      figma.map((t) => [t.key, { figmaName: t.figmaName, px: t.value, step: t.step }]),
    );
    expect(spacingSource).toEqual(expected);
  });

  it('agrees with the pixel value embedded in each Figma name', () => {
    for (const t of figma) {
      expect(t.px, t.figmaName).toBe(t.value);
    }
  });

  it('keeps Figma’s step x 4 = px relationship', () => {
    for (const t of figma) {
      expect(Math.round(t.step * 4), t.figmaName).toBe(t.value);
    }
  });

  it('round-trips every rem value back to the original pixels', () => {
    for (const [key, value] of Object.entries(spacing)) {
      const px = Number(value.replace('rem', '')) * ROOT_FONT_SIZE;
      expect(px, key).toBe(spacingSource[key as keyof typeof spacingSource].px);
    }
  });

  it('declares the theme block as static so no token is tree-shaken away', () => {
    expect(read('../../foundations/spacing/spacing.css')).toContain('@theme static {');
  });
});
