import { describe, expect, it } from 'vitest';
import { container, containerResolved, containerSource, containerVar } from './index';

const REM = /^\d+(\.\d+)?rem$/;
const VAR_REF = /^var\(--[a-z0-9-]+\)$/;

describe('semantic container tokens', () => {
  it('exposes the same three tokens across every map', () => {
    const keys = Object.keys(container);
    expect(keys).toHaveLength(3);
    expect(Object.keys(containerResolved)).toEqual(keys);
    expect(Object.keys(containerSource)).toEqual(keys);
  });

  it('keeps the CSS-facing map as var() references, never literals', () => {
    for (const [key, value] of Object.entries(container)) {
      expect(value, key).toMatch(VAR_REF);
    }
  });

  it('keeps the resolved map as concrete rem values', () => {
    for (const [key, value] of Object.entries(containerResolved)) {
      expect(value, key).toMatch(REM);
    }
  });

  it('references the primitive named in its own provenance', () => {
    for (const [key, source] of Object.entries(containerSource)) {
      expect(container[key as keyof typeof container]).toBe(`var(${source.primitiveVar})`);
    }
  });

  it('maps each token to the Tailwind namespace that gives it real utilities', () => {
    // Padding belongs in --spacing-* (p-*, px-*, gap-*). Max-width belongs in
    // --container-*, which is Tailwind's own max-w-* namespace. Emitting padding
    // under --container-* would produce a nonsense `max-w-padding-mobile`.
    expect(containerSource['padding-mobile'].cssVar).toBe('--spacing-container-padding-mobile');
    expect(containerSource['padding-desktop'].cssVar).toBe('--spacing-container-padding-desktop');
    expect(containerSource['max-width-desktop'].cssVar).toBe('--container-desktop');
  });

  it('never emits a semantic token into a namespace Tailwind would misread', () => {
    for (const [key, source] of Object.entries(containerSource)) {
      const isPadding = key.startsWith('padding-');
      expect(source.cssVar.startsWith('--spacing-'), key).toBe(isPadding);
    }
  });

  it('resolves containerVar to the emitted custom property', () => {
    for (const key of Object.keys(container) as (keyof typeof container)[]) {
      expect(containerVar(key)).toBe(containerSource[key].cssVar);
      expect(containerVar(key)).toMatch(/^--[a-z0-9-]+$/);
    }
  });

  it('documents the known breakpoint asymmetry', () => {
    // Figma defines padding for both breakpoints but a max-width only for
    // desktop — mobile containers are fluid. Asserted so that a future export
    // adding container-max-width-mobile is noticed rather than absorbed silently.
    expect(Object.keys(container).filter((k) => k.startsWith('padding-'))).toEqual([
      'padding-mobile',
      'padding-desktop',
    ]);
    expect(Object.keys(container).filter((k) => k.startsWith('max-width-'))).toEqual([
      'max-width-desktop',
    ]);
  });
});
