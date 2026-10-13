import { describe, expect, it } from 'vitest';
import {
  semanticSpacing,
  semanticSpacingResolved,
  semanticSpacingScale,
  semanticSpacingSource,
  semanticSpacingVar,
} from './index';
import { radius } from '@tokens/radius';
import { spacing } from '@tokens/spacing';

const REM = /^\d+(\.\d+)?rem$/;
const VAR_REF = /^var\(--spacing-[0-9-]+\)$/;

describe('semantic spacing tokens', () => {
  it('exposes the same 17 tokens across every map', () => {
    const keys = Object.keys(semanticSpacing);
    expect(keys).toHaveLength(17);
    expect(Object.keys(semanticSpacingResolved)).toEqual(keys);
    expect(Object.keys(semanticSpacingSource)).toEqual(keys);
    expect(semanticSpacingScale).toHaveLength(17);
  });

  it('keeps the CSS-facing map as var() references, never literals', () => {
    for (const [key, value] of Object.entries(semanticSpacing)) {
      expect(value, key).toMatch(VAR_REF);
    }
  });

  it('keeps the resolved map as concrete rem values', () => {
    for (const [key, value] of Object.entries(semanticSpacingResolved)) {
      expect(value, key).toMatch(REM);
    }
  });

  it('references the primitive named in its own provenance', () => {
    for (const [key, source] of Object.entries(semanticSpacingSource)) {
      expect(semanticSpacing[key as keyof typeof semanticSpacing]).toBe(
        `var(${source.primitiveVar})`,
      );
    }
  });

  it('resolves every alias to a primitive the spacing foundation actually exports', () => {
    for (const [key, source] of Object.entries(semanticSpacingSource)) {
      const primitiveKey = source.primitiveToken.replace('spacing.', '') as keyof typeof spacing;
      expect(spacing[primitiveKey], key).toBeDefined();
      expect(semanticSpacingResolved[key as keyof typeof semanticSpacingResolved]).toBe(
        spacing[primitiveKey],
      );
    }
  });

  it('has no duplicate values and no duplicate alias targets', () => {
    const resolved = Object.values(semanticSpacingResolved);
    expect(new Set(resolved).size).toBe(resolved.length);
    const targets = Object.values(semanticSpacingSource).map((s) => s.aliasOf);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it('starts at zero and ascends', () => {
    expect(semanticSpacingResolved.none).toBe('0rem');
    expect(semanticSpacingSource.none.px).toBe(0);
    const px = semanticSpacingScale.map((k) => semanticSpacingSource[k].px);
    expect(px).toEqual([...px].sort((a, b) => a - b));
  });

  it('emits every token as a qualified --spacing-semantic-* variable', () => {
    for (const key of Object.keys(semanticSpacing) as (keyof typeof semanticSpacing)[]) {
      expect(semanticSpacingVar(key)).toBe(`--spacing-semantic-${key}`);
      expect(semanticSpacingVar(key)).toBe(semanticSpacingSource[key].cssVar);
    }
  });

  it('never emits a variable that a primitive spacing step already owns', () => {
    const primitiveVars = new Set(Object.keys(spacing).map((k) => `--spacing-${k}`));
    for (const [key, source] of Object.entries(semanticSpacingSource)) {
      expect(primitiveVars.has(source.cssVar), `${key} collides with a primitive`).toBe(false);
    }
  });

  it('is an independent scale from radius, despite shared key names', () => {
    // Documented deliberately: `lg`, `xl`, `2xl`, `3xl` and `4xl` exist in both
    // families with DIFFERENT values. They live in separate CSS namespaces
    // (--spacing-* vs --radius-*), so nothing breaks — but gap-lg and rounded-lg
    // are genuinely different sizes, and this asserts that is intentional.
    const shared = Object.keys(semanticSpacing).filter((k) => k in radius);
    expect(shared.length).toBeGreaterThan(0);

    const differing = shared.filter(
      (k) =>
        semanticSpacingResolved[k as keyof typeof semanticSpacingResolved] !==
        radius[k as keyof typeof radius],
    );
    expect(differing.sort()).toEqual(['2xl', '3xl', '4xl', 'lg', 'xl']);
  });
});
