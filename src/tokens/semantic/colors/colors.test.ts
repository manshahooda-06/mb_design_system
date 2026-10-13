import { describe, expect, it } from 'vitest';
import {
  semanticColors,
  semanticColorsResolved,
  semanticColorsSource,
  semanticColorsVar,
} from './index';
import { colorTokens } from '@tokens/colors';

const VAR_REF = /^var\(--color-[a-z0-9-]+\)$/;
const HEX = /^#[0-9a-f]{6}$/;
const RGB_ALPHA = /^rgb\(\d{1,3} \d{1,3} \d{1,3} \/ (0|1|0?\.\d+)\)$/;

describe('semantic colour tokens', () => {
  it('exposes the same keys across every map', () => {
    const keys = Object.keys(semanticColors);
    expect(keys.length).toBeGreaterThan(0);
    expect(Object.keys(semanticColorsResolved.light)).toEqual(keys);
    expect(Object.keys(semanticColorsResolved.dark)).toEqual(keys);
    expect(Object.keys(semanticColorsSource)).toEqual(keys);
  });

  it('has light/dark parity for every token', () => {
    for (const key of Object.keys(semanticColors) as (keyof typeof semanticColors)[]) {
      expect(semanticColorsResolved.light[key], `${key} light`).toBeDefined();
      expect(semanticColorsResolved.dark[key], `${key} dark`).toBeDefined();
    }
  });

  it('emits only var() references, hex, or alpha-preserving rgb()', () => {
    for (const mode of ['light', 'dark'] as const) {
      for (const [key, value] of Object.entries(semanticColorsResolved[mode])) {
        expect(
          VAR_REF.test(value) || HEX.test(value) || RGB_ALPHA.test(value),
          `${key} ${mode} -> ${value}`,
        ).toBe(true);
      }
    }
  });

  it('keeps semanticColors identical to the light mode map', () => {
    expect(semanticColors).toEqual(semanticColorsResolved.light);
  });

  it('qualifies every variable as --color-semantic-*', () => {
    for (const key of Object.keys(semanticColors) as (keyof typeof semanticColors)[]) {
      expect(semanticColorsVar(key)).toBe(`--color-semantic-${key}`);
      expect(semanticColorsVar(key)).toBe(semanticColorsSource[key].cssVar);
    }
  });

  it('never emits a variable a primitive colour already owns', () => {
    const primitiveVars = new Set(Object.keys(colorTokens).map((k) => `--color-${k}`));
    for (const [key, source] of Object.entries(semanticColorsSource)) {
      expect(primitiveVars.has(source.cssVar), `${key} collides with a primitive`).toBe(false);
    }
  });

  it('resolves every primitive alias to a token the colours foundation exports', () => {
    for (const key of Object.keys(semanticColorsSource)) {
      for (const mode of ['light', 'dark'] as const) {
        const value = semanticColorsResolved[mode][key as keyof typeof semanticColors];
        const target = /^var\(--color-((?!semantic-)[a-z0-9-]+)\)$/.exec(value)?.[1];
        if (!target) continue;
        expect(colorTokens, `${key} ${mode} -> --color-${target}`).toHaveProperty(target);
      }
    }
  });

  it('records a resolution kind for both modes of every token', () => {
    const kinds = ['primitive-alias', 'semantic-alias', 'literal'];
    for (const [key, source] of Object.entries(semanticColorsSource)) {
      expect(kinds, `${key} light`).toContain(source.light.kind);
      expect(kinds, `${key} dark`).toContain(source.dark.kind);
      expect(source.figmaPath, key).toBeTruthy();
    }
  });

  it('carries an alias target for every non-literal resolution', () => {
    for (const [key, source] of Object.entries(semanticColorsSource)) {
      for (const mode of ['light', 'dark'] as const) {
        if (source[mode].kind === 'literal')
          expect(source[mode].aliasOf, `${key} ${mode}`).toBeNull();
        else expect(source[mode].aliasOf, `${key} ${mode}`).toBeTruthy();
      }
    }
  });

  it('contains no chain that resolves to itself', () => {
    for (const [key, source] of Object.entries(semanticColorsSource)) {
      for (const mode of ['light', 'dark'] as const) {
        expect(
          semanticColorsResolved[mode][key as keyof typeof semanticColors],
          `${key} ${mode} is self-referential`,
        ).not.toBe(`var(${source.cssVar})`);
      }
    }
  });
});
