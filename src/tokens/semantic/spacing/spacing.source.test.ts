/**
 * Fidelity guard for the semantic spacing collection.
 *
 * Re-derives every token from the Figma export AND resolves each alias against
 * the real primitives export, asserting the chain
 * semantic token -> primitive -> value holds end to end.
 *
 * If this fails after a re-export, the generator — not the generated files — is
 * what needs fixing.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  semanticSpacing,
  semanticSpacingResolved,
  semanticSpacingScale,
  semanticSpacingSource,
} from './index';
import { spacing } from '@tokens/spacing';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

const ROOT_FONT_SIZE = 16;
const PREFIX = 'spacing-';
const ONE_DOT_LEADER = '․';

const rem = (px: number) => `${Number((px / ROOT_FONT_SIZE).toFixed(6))}rem`;

const primitiveKey = (figmaName: string) => {
  const match = /^([\d․.]+)\s*\((\d[\d,]*)px\)$/.exec(figmaName);
  if (!match) throw new Error(`Cannot derive a spacing key from ${figmaName}`);
  return match[1]!.replaceAll(ONE_DOT_LEADER, '.').replace('.', '-');
};

type AliasData = { targetVariableName: string; targetVariableSetName: string };
type Leaf = { $type: string; $value: number; $extensions?: { 'com.figma.aliasData'?: AliasData } };

const semanticRaw = JSON.parse(read('../../../../figma/exports/semantic/spacing.json')) as Record<
  string,
  Leaf
>;
const primitivesRaw = JSON.parse(read('../../../../figma/exports/primitives/colors.json')) as {
  Spacing: Record<string, { $value: number }>;
};

const figma = Object.entries(semanticRaw)
  .filter(([key]) => !key.startsWith('$'))
  .map(([figmaName, leaf]) => {
    const alias = leaf.$extensions?.['com.figma.aliasData'];
    const [collection, primitiveName] = (alias?.targetVariableName ?? '').split('/');
    return {
      key: figmaName.slice(PREFIX.length),
      figmaName,
      px: leaf.$value,
      type: leaf.$type,
      alias,
      collection,
      primitiveName,
    };
  });

describe('semantic spacing token fidelity', () => {
  it('covers every token in the export', () => {
    expect(figma).toHaveLength(17);
    expect(Object.keys(semanticSpacing)).toHaveLength(figma.length);
  });

  it('matches the Figma export exactly', () => {
    const expected = Object.fromEntries(
      figma.map((t) => [t.key, `var(--spacing-${primitiveKey(t.primitiveName!)})`]),
    );
    expect(semanticSpacing).toEqual(expected);
  });

  it('confirms every source token really is $type number', () => {
    expect(figma.every((t) => t.type === 'number')).toBe(true);
  });
});

describe('semantic spacing alias resolution', () => {
  it('gives every token an alias into _Primitives — none carries its own value', () => {
    for (const t of figma) {
      expect(t.alias, t.figmaName).toBeDefined();
      expect(t.alias!.targetVariableSetName, t.figmaName).toBe('_Primitives');
      expect(t.collection, t.figmaName).toBe('Spacing');
    }
  });

  it('resolves every alias to a primitive that actually exists', () => {
    for (const t of figma) {
      expect(
        primitivesRaw.Spacing[t.primitiveName!],
        `${t.figmaName} aliases ${t.primitiveName}`,
      ).toBeDefined();
    }
  });

  it('agrees with the primitive it aliases — no contradiction in the export', () => {
    for (const t of figma) {
      expect(primitivesRaw.Spacing[t.primitiveName!]!.$value, t.figmaName).toBe(t.px);
    }
  });

  it('never points two semantic tokens at the same primitive', () => {
    const targets = figma.map((t) => t.alias!.targetVariableName);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it('reaches the same value the primitive layer already ships', () => {
    for (const t of figma) {
      const key = primitiveKey(t.primitiveName!) as keyof typeof spacing;
      expect(spacing[key], t.figmaName).toBe(rem(t.px));
      expect(
        semanticSpacingResolved[t.key as keyof typeof semanticSpacingResolved],
        t.figmaName,
      ).toBe(spacing[key]);
    }
  });

  it('records accurate provenance, preserving the original Figma alias target', () => {
    for (const t of figma) {
      const source = semanticSpacingSource[t.key as keyof typeof semanticSpacingSource];
      const key = primitiveKey(t.primitiveName!);
      expect(source.figmaName).toBe(t.figmaName);
      expect(source.px).toBe(t.px);
      expect(source.aliasOf).toBe(t.alias!.targetVariableName);
      expect(source.primitiveToken).toBe(`spacing.${key}`);
      expect(source.primitiveVar).toBe(`--spacing-${key}`);
      expect(source.cssVar).toBe(`--spacing-semantic-${t.key}`);
    }
  });
});

describe('semantic spacing CSS variable references', () => {
  it('emits a var() reference to the primitive rather than a copied value', () => {
    for (const [key, value] of Object.entries(semanticSpacing)) {
      expect(value, key).toMatch(/^var\(--spacing-[0-9-]+\)$/);
    }
  });

  it('keeps the CSS layer identical to the TypeScript layer', () => {
    const css = read('../../../semantic/spacing/spacing.css');
    const vars = Object.fromEntries(
      [...css.matchAll(/(--spacing-semantic-[a-z0-9-]+):\s*(var\([^)]+\));/g)].map((m) => [
        m[1],
        m[2],
      ]),
    );
    for (const [key, source] of Object.entries(semanticSpacingSource)) {
      expect(vars[source.cssVar], key).toBe(`var(${source.primitiveVar})`);
    }
    expect(Object.keys(vars)).toHaveLength(Object.keys(semanticSpacingSource).length);
  });

  it('qualifies every variable so it cannot collide in the spacing namespace', () => {
    // The --spacing-semantic-* qualifier is what keeps these from shadowing
    // either a primitive step or a Tailwind container size.
    for (const [key, source] of Object.entries(semanticSpacingSource)) {
      expect(source.cssVar, key).toMatch(/^--spacing-semantic-[a-z0-9-]+$/);
    }
  });

  it('declares the theme block as static so no token is tree-shaken away', () => {
    expect(read('../../../semantic/spacing/spacing.css')).toContain('@theme static {');
  });
});

describe('semantic spacing scale ordering', () => {
  it('ascends monotonically in scale order', () => {
    const px = semanticSpacingScale.map((key) => semanticSpacingSource[key].px);
    expect(px).toEqual([...px].sort((a, b) => a - b));
  });

  it('covers every token exactly once', () => {
    expect([...semanticSpacingScale].sort()).toEqual(Object.keys(semanticSpacing).sort());
    expect(new Set(semanticSpacingScale).size).toBe(semanticSpacingScale.length);
  });

  it('follows the Figma export order', () => {
    expect([...semanticSpacingScale]).toEqual(figma.map((t) => t.key));
  });
});
