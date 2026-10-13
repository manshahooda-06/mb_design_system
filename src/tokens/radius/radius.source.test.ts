/**
 * Fidelity guard: re-derives every radius token straight from the Figma export
 * and fails if the generated CSS or TypeScript has drifted from it.
 *
 * If this fails after a re-export, the generator — not the generated files —
 * is what needs fixing.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { radius, radiusSource } from './index';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

const ROOT_FONT_SIZE = 16;
const PREFIX = 'radius-';

const rem = (px: number) => `${Number((px / ROOT_FONT_SIZE).toFixed(6))}rem`;

type Leaf = { $type: string; $value: number };
type Export = Record<string, Leaf | Record<string, unknown>>;

const raw = JSON.parse(read('../../../figma/exports/primitives/radius.json')) as Export;

const figma = Object.entries(raw)
  .filter(([key]) => !key.startsWith('$'))
  .map(([figmaName, node]) => {
    const leaf = node as Leaf;
    return { key: figmaName.slice(PREFIX.length), figmaName, px: leaf.$value, type: leaf.$type };
  });

describe('radius token fidelity', () => {
  it('covers every token in the export', () => {
    expect(figma).toHaveLength(11);
    expect(Object.keys(radius)).toHaveLength(figma.length);
  });

  it('matches the Figma export exactly, including radius-full', () => {
    const expected = Object.fromEntries(figma.map((t) => [t.key, rem(t.px)]));
    expect(radius).toEqual(expected);
  });

  it('does not special-case radius-full — it uses the same px/16 pipeline', () => {
    expect(radius.full).toBe('624.9375rem');
    expect(radiusSource.full.px).toBe(9999);
    // 9999 / 16, done the same way as every other token — not a hardcoded override.
    expect(radius.full).toBe(rem(radiusSource.full.px));
  });

  it('keeps the CSS layer identical to the TypeScript layer', () => {
    const css = read('../../foundations/radius/radius.css');
    const vars = Object.fromEntries(
      [...css.matchAll(/--radius-([a-z0-9]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]!.trim()]),
    );
    expect(vars).toEqual(radius);
  });

  it('preserves the original Figma name and pixel value for every token', () => {
    const expected = Object.fromEntries(
      figma.map((t) => [t.key, { figmaName: t.figmaName, px: t.px }]),
    );
    expect(radiusSource).toEqual(expected);
  });

  it('confirms every source token really is $type number', () => {
    // Guards the assumption the generator's validation relies on.
    expect(figma.every((t) => t.type === 'number')).toBe(true);
  });

  it('declares the theme block as static so no token is tree-shaken away', () => {
    expect(read('../../foundations/radius/radius.css')).toContain('@theme static {');
  });
});
