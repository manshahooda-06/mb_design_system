import { describe, expect, it } from 'vitest';
import { fontFamily, fontSize, fontWeight, textStyles, textVar } from './index';

const REM = /^\d+(\.\d+)?rem$/;

describe('typography tokens', () => {
  it('exposes the expected token counts', () => {
    expect(Object.keys(fontFamily)).toHaveLength(2);
    expect(Object.keys(fontWeight)).toHaveLength(6);
    expect(Object.keys(fontSize)).toHaveLength(41);
    expect(Object.keys(textStyles)).toHaveLength(118);
  });

  it('emits every size and line height in rem', () => {
    for (const [slot, { size, lineHeight }] of Object.entries(fontSize)) {
      expect(size, slot).toMatch(REM);
      expect(lineHeight, slot).toMatch(REM);
    }
  });

  it('uses only the approved CSS weight numerics', () => {
    expect(Object.values(fontWeight).sort((a, b) => a - b)).toEqual([300, 400, 500, 600, 700, 800]);
  });

  it('keeps every text style consistent with its size slot', () => {
    for (const [token, style] of Object.entries(textStyles)) {
      const slot = token.replace(/-(light|regular|medium|semibold|bold|extrabold)$/, '');
      const ramp = fontSize[slot as keyof typeof fontSize];
      expect(ramp, `${token} -> ${slot}`).toBeDefined();
      expect(style.fontSize, token).toBe(ramp.size);
      expect(style.lineHeight, token).toBe(ramp.lineHeight);
      expect(Object.values(fontWeight), token).toContain(style.fontWeight);
    }
  });

  it('scopes every token to a known breakpoint', () => {
    for (const slot of Object.keys(fontSize)) {
      expect(slot.startsWith('mobile-') || slot.startsWith('desktop-'), slot).toBe(true);
    }
  });

  it('derives valid CSS custom property names', () => {
    for (const slot of Object.keys(fontSize) as (keyof typeof fontSize)[]) {
      expect(textVar(slot)).toMatch(/^--text-[a-z0-9-]+$/);
    }
  });
});
