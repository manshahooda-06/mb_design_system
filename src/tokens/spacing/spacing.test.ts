import { describe, expect, it } from 'vitest';
import { spacing, spacingScale, spacingSource, spacingVar } from './index';

const REM = /^\d+(\.\d+)?rem$/;

describe('spacing tokens', () => {
  it('exposes the full 32-step scale', () => {
    expect(Object.keys(spacing)).toHaveLength(32);
    expect(Object.keys(spacingSource)).toHaveLength(32);
  });

  it('emits every value in rem', () => {
    for (const [key, value] of Object.entries(spacing)) {
      expect(value, key).toMatch(REM);
    }
  });

  it('uses keys that are valid unescaped CSS identifiers', () => {
    for (const key of Object.keys(spacing)) {
      // A literal '.' would need escaping in a custom property name.
      expect(key, key).toMatch(/^[0-9]+(-[0-9]+)?$/);
    }
  });

  it('ascends monotonically in scale order', () => {
    const px = spacingScale.map((key) => spacingSource[key].px);
    expect(px).toEqual([...px].sort((a, b) => a - b));
  });

  it('exposes an ordered scale covering every token exactly once', () => {
    expect([...spacingScale].sort()).toEqual(Object.keys(spacing).sort());
    expect(new Set(spacingScale).size).toBe(spacingScale.length);
  });

  it('documents why the ordered array is needed', () => {
    // Object key order is NOT the scale order: integer-like keys are hoisted.
    // This asserts the hazard is real, so the array is never "simplified" away.
    const enumerated = Object.keys(spacing);
    expect(enumerated).not.toEqual([...spacingScale]);
    expect(enumerated.at(-1)).toBe('1-5');
    expect(spacingScale.at(-1)).toBe('480');
  });

  it('has no duplicate values', () => {
    const values = Object.values(spacing);
    expect(new Set(values).size).toBe(values.length);
  });

  it('starts at zero', () => {
    expect(spacing['0']).toBe('0rem');
    expect(spacingSource['0'].px).toBe(0);
  });

  it('derives valid CSS custom property names', () => {
    for (const key of Object.keys(spacing) as (keyof typeof spacing)[]) {
      expect(spacingVar(key)).toMatch(/^--spacing-[0-9-]+$/);
    }
  });
});
