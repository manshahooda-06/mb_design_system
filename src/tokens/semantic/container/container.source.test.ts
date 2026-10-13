/**
 * Fidelity guard for the semantic container collection.
 *
 * Semantic tokens are only as trustworthy as their aliases, so this suite does
 * more than the primitive equivalents: it re-derives every token from the Figma
 * export AND resolves each alias against the real primitive export, asserting
 * that the chain semantic token -> primitive -> value holds end to end.
 *
 * If this fails after a re-export, the generator — not the generated files — is
 * what needs fixing.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { container, containerResolved, containerSource } from './index';
import { spacing } from '@tokens/spacing';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

const ROOT_FONT_SIZE = 16;
const PREFIX = 'container-';
const ONE_DOT_LEADER = '․';

const rem = (px: number) => `${Number((px / ROOT_FONT_SIZE).toFixed(6))}rem`;

const spacingKey = (figmaName: string) => {
  const match = /^([\d․.]+)\s*\((\d[\d,]*)px\)$/.exec(figmaName);
  if (!match) throw new Error(`Cannot derive a spacing key from ${figmaName}`);
  return match[1]!.replaceAll(ONE_DOT_LEADER, '.').replace('.', '-');
};

type AliasData = { targetVariableName: string; targetVariableSetName: string };
type Leaf = { $value: number; $extensions?: { 'com.figma.aliasData'?: AliasData } };

const semanticRaw = JSON.parse(read('../../../../figma/exports/semantic/container.json')) as Record<
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
      alias,
      collection,
      primitiveName,
    };
  });

describe('semantic container token fidelity', () => {
  it('covers every token in the export', () => {
    expect(figma).toHaveLength(3);
    expect(Object.keys(container)).toHaveLength(figma.length);
  });

  it('gives every semantic token an alias — none carries its own value', () => {
    for (const t of figma) {
      expect(t.alias, t.figmaName).toBeDefined();
      expect(t.alias!.targetVariableSetName, t.figmaName).toBe('_Primitives');
    }
  });

  it('resolves every alias to a primitive that actually exists', () => {
    for (const t of figma) {
      expect(t.collection, t.figmaName).toBe('Spacing');
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

  it('emits a var() reference to the primitive rather than a copied value', () => {
    const expected = Object.fromEntries(
      figma.map((t) => [t.key, `var(--spacing-${spacingKey(t.primitiveName!)})`]),
    );
    expect(container).toEqual(expected);
    // Nothing in the CSS-facing map may be a bare literal — that would break propagation.
    for (const value of Object.values(container)) {
      expect(value).toMatch(/^var\(--[a-z0-9-]+\)$/);
    }
  });

  it('reaches the same value the primitive layer already ships', () => {
    for (const t of figma) {
      const key = spacingKey(t.primitiveName!) as keyof typeof spacing;
      expect(spacing[key], t.figmaName).toBe(rem(t.px));
      expect(containerResolved[t.key as keyof typeof containerResolved]).toBe(spacing[key]);
    }
  });

  it('records accurate provenance for every token', () => {
    for (const t of figma) {
      const source = containerSource[t.key as keyof typeof containerSource];
      const key = spacingKey(t.primitiveName!);
      expect(source.figmaName).toBe(t.figmaName);
      expect(source.px).toBe(t.px);
      expect(source.aliasOf).toBe(t.alias!.targetVariableName);
      expect(source.primitiveToken).toBe(`spacing.${key}`);
      expect(source.primitiveVar).toBe(`--spacing-${key}`);
    }
  });

  it('keeps the CSS layer identical to the TypeScript layer', () => {
    const css = read('../../../semantic/container/container.css');
    const vars = Object.fromEntries(
      [...css.matchAll(/(--[a-z0-9-]+):\s*(var\([^)]+\));/g)].map((m) => [m[1], m[2]]),
    );
    for (const [key, source] of Object.entries(containerSource)) {
      expect(vars[source.cssVar], key).toBe(`var(${source.primitiveVar})`);
    }
    expect(Object.keys(vars)).toHaveLength(Object.keys(containerSource).length);
  });

  it('declares the theme block as static so no token is tree-shaken away', () => {
    expect(read('../../../semantic/container/container.css')).toContain('@theme static {');
  });
});
