import { describe, expect, it } from 'vitest';
import { colorTokens, colors, colorVar } from './index';

const CSS_VAR = /^--color-[a-z0-9-]+$/;
const HEX = /^#[0-9a-f]{6}$/;
const RGB_ALPHA = /^rgb\(\d{1,3} \d{1,3} \d{1,3} \/ (0|1|0?\.\d+)\)$/;

describe('primitive color tokens', () => {
  it('exposes every token from the Figma export', () => {
    expect(Object.keys(colorTokens)).toHaveLength(136);
    expect(Object.keys(colors)).toHaveLength(12);
  });

  it('emits only hex or alpha-preserving rgb() values', () => {
    for (const [name, value] of Object.entries(colorTokens)) {
      expect(HEX.test(value) || RGB_ALPHA.test(value), `${name} -> ${value}`).toBe(true);
    }
  });

  it('keeps the nested and flat maps in sync', () => {
    const flattened = Object.entries(colors).flatMap(([group, steps]) =>
      Object.entries(steps).map(([step, value]) => [`${group}-${step}`, value]),
    );
    expect(Object.fromEntries(flattened)).toEqual(colorTokens);
  });

  it('gives every ramp the same twelve steps', () => {
    const ramp = Object.keys(colors.brand);
    expect(ramp).toEqual(['25', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']); // prettier-ignore
    for (const [group, steps] of Object.entries(colors)) {
      if (group === 'base') continue;
      expect(Object.keys(steps), group).toEqual(ramp);
    }
  });

  it('derives valid CSS custom property names', () => {
    for (const name of Object.keys(colorTokens) as (keyof typeof colorTokens)[]) {
      expect(colorVar(name)).toMatch(CSS_VAR);
    }
  });
});
