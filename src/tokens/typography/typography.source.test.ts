/**
 * Fidelity guard: re-derives every typography token straight from the Figma
 * export and fails if the generated CSS or TypeScript has drifted from it.
 *
 * If this fails after a re-export, the generator — not the generated files —
 * is what needs fixing.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { fontFamily, fontSize, fontWeight, textStyles } from './index';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

const ROOT_FONT_SIZE = 16;
const WEIGHT_SCALE: Record<string, number> = {
  Light: 300,
  Regular: 400,
  Medium: 500,
  Semibold: 600,
  Bold: 700,
  Extrabold: 800,
};

const rem = (px: number) => `${Number((px / ROOT_FONT_SIZE).toFixed(6))}rem`;
const kebab = (s: string) => s.replace(/\//g, '-').replace(/ /g, '-').toLowerCase();

type Leaf = { $value: string | number };
type Export = {
  Group: Record<
    string,
    Record<string, Record<string, Leaf> | Record<string, Record<string, Leaf>>>
  >;
  'Font Family': Record<string, Leaf>;
};

/** Flatten the export to `[path, value]` pairs. */
function flatten(node: unknown, path: string[] = []): [string[], string | number][] {
  if (node && typeof node === 'object') {
    if ('$value' in node) return [[path, (node as Leaf).$value]];
    return Object.entries(node).flatMap(([k, v]) => flatten(v, [...path, k]));
  }
  return [];
}

const raw = JSON.parse(read('../../../figma/exports/primitives/typography.json')) as Export;

/** Rebuild `(breakpoint, styleName) -> { property: value }` from the export. */
function figmaStyles() {
  const out: Record<string, Record<string, string | number>> = {};
  for (const [path, value] of flatten(raw.Group)) {
    const key = `${path[0]}|${path.slice(1, -1).join('/')}`;
    (out[key] ??= {})[path[path.length - 1]!] = value;
  }
  return out;
}

const REQUIRED = ['Size', 'Line Height', 'Weight'];
const all = figmaStyles();
const complete = Object.entries(all).filter(([, v]) => REQUIRED.every((p) => p in v));

describe('typography token fidelity', () => {
  it('covers every complete style in the export', () => {
    expect(Object.keys(textStyles)).toHaveLength(complete.length);
  });

  it('matches the Figma export exactly', () => {
    const expected: Record<string, unknown> = {};
    for (const [key, props] of complete) {
      const [breakpoint, name] = key.split('|') as [string, string];
      const base = name.startsWith('Banner/') ? `banner-${name.slice('Banner/'.length)}` : name;
      expected[kebab(`${breakpoint}-${base}`)] = {
        fontSize: rem(props['Size'] as number),
        lineHeight: rem(props['Line Height'] as number),
        fontWeight: WEIGHT_SCALE[props['Weight'] as string],
      };
    }
    expect(textStyles).toEqual(expected);
  });

  it('keeps the CSS layer identical to the TypeScript layer', () => {
    const css = read('../../foundations/typography/typography.css');
    const vars = Object.fromEntries(
      [...css.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]!.trim()]),
    );

    for (const [slot, { size, lineHeight }] of Object.entries(fontSize)) {
      expect(vars[`--text-${slot}`], slot).toBe(size);
      expect(vars[`--text-${slot}--line-height`], slot).toBe(lineHeight);
    }
    for (const [name, value] of Object.entries(fontWeight)) {
      expect(vars[`--font-weight-${name}`], name).toBe(String(value));
    }
    for (const [name, value] of Object.entries(fontFamily)) {
      expect(vars[`--font-${name}`], name).toBe(`'${value}'`);
    }
  });

  it('carries font families through verbatim', () => {
    const expected = Object.fromEntries(
      flatten(raw['Font Family']).map(([path, value]) => [
        kebab(path[path.length - 1]!.replace('Font Family', '').trim()),
        value,
      ]),
    );
    expect(fontFamily).toEqual(expected);
  });

  it('still excludes the four incomplete Caption-lg styles', () => {
    // If a corrected export fills these in, this fails — regenerate and drop the exclusion.
    const incomplete = Object.entries(all)
      .filter(([, v]) => !REQUIRED.every((p) => p in v))
      .map(([k]) => k);
    expect(incomplete.sort()).toEqual([
      'Mobile|Caption-lg-Light',
      'Mobile|Caption-lg-Medium',
      'Mobile|Caption-lg-Regular',
      'Mobile|Caption-lg-Semibold',
    ]);
  });

  it('omits letter-spacing and paragraph-spacing while they are uniformly zero', () => {
    const values = new Set(
      Object.values(all).flatMap((s) => [s['Letter Spacing'], s['Paragraph spacing']]),
    );
    values.delete(undefined as never);
    expect([...values]).toEqual([0]);
  });

  it('declares the theme block as static so no token is tree-shaken away', () => {
    expect(read('../../foundations/typography/typography.css')).toContain('@theme static {');
  });
});
