import { describe, expect, it } from 'vitest';
import { radius, radiusSource, radiusVar } from './index';

const REM = /^\d+(\.\d+)?rem$/;

describe('radius tokens', () => {
  it('exposes the full 11-step scale', () => {
    expect(Object.keys(radius)).toHaveLength(11);
    expect(Object.keys(radiusSource)).toHaveLength(11);
  });

  it('emits every value in rem', () => {
    for (const [key, value] of Object.entries(radius)) {
      expect(value, key).toMatch(REM);
    }
  });

  it('has no duplicate values', () => {
    const values = Object.values(radius);
    expect(new Set(values).size).toBe(values.length);
  });

  it('starts at zero and ascends up to (but excluding) full', () => {
    expect(radius.none).toBe('0rem');
    const withoutFull = Object.entries(radiusSource)
      .filter(([key]) => key !== 'full')
      .map(([, t]) => t.px);
    expect(withoutFull).toEqual([...withoutFull].sort((a, b) => a - b));
  });

  it('keeps full as the outsized sentinel, not part of the linear scale', () => {
    const withoutFull = Object.entries(radiusSource)
      .filter(([key]) => key !== 'full')
      .map(([, t]) => t.px);
    expect(radiusSource.full.px).toBeGreaterThan(Math.max(...withoutFull) * 10);
  });

  it('preserves object key order matching the Figma scale (no JS key-hoisting hazard)', () => {
    // Unlike spacing's '0-5' / '1-5', none of these keys are canonical integer
    // strings ('2xl' has trailing letters), so JS does not hoist them and
    // Object.keys() order is safe to rely on directly here.
    expect(Object.keys(radius)).toEqual([
      'none',
      'xxs',
      'xs',
      'sm',
      'md',
      'lg',
      'xl',
      '2xl',
      '3xl',
      '4xl',
      'full',
    ]);
  });

  it('derives valid CSS custom property names', () => {
    for (const key of Object.keys(radius) as (keyof typeof radius)[]) {
      expect(radiusVar(key)).toMatch(/^--radius-[a-z0-9]+$/);
    }
  });
});
