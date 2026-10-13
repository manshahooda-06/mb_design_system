import { describe, expect, it } from 'vitest';
import { ariaAttr, composeIds, dataAttr, focusRing, focusRingError } from './a11y';

describe('focusRing', () => {
  it('replaces the outline it removes', () => {
    // `outline-none` without a replacement is the most common accessibility
    // regression in a component library, and the reason both halves live in one
    // string that cannot be split.
    expect(focusRing).toContain('outline-none');
    expect(focusRing).toContain('focus-visible:ring-2');
  });

  it('uses focus-visible rather than focus', () => {
    // A ring on every mouse click is the noise that drives teams to delete it.
    expect(focusRing).not.toMatch(/(^|\s)focus:/);
  });

  it.each([focusRing, focusRingError])('styles only semantic colours', (ring) => {
    for (const cls of ring.split(/\s+/).filter((c) => /ring(-offset)?-/.test(c))) {
      if (/ring(-offset)?-\d/.test(cls)) continue; // widths are bare values, not tokens
      expect(cls).toContain('semantic-');
    }
  });

  it('offers an error variant that differs only in colour', () => {
    expect(focusRingError).toContain('focus-ring-error');
    expect(focusRingError).not.toBe(focusRing);
  });
});

describe('ariaAttr', () => {
  it('returns true when set', () => {
    expect(ariaAttr(true)).toBe(true);
  });

  it.each([false, undefined])('omits the attribute for %s', (value) => {
    // React stringifies `false` into `aria-invalid="false"`, which is not the
    // same as omitting it; returning undefined drops the attribute entirely.
    expect(ariaAttr(value)).toBeUndefined();
  });
});

describe('dataAttr', () => {
  it('returns an empty string when set, so the attribute is present and bare', () => {
    expect(dataAttr(true)).toBe('');
  });

  it.each([false, undefined])('omits the attribute for %s', (value) => {
    expect(dataAttr(value)).toBeUndefined();
  });
});

describe('composeIds', () => {
  it('joins present ids with a space', () => {
    expect(composeIds('hint', 'error')).toBe('hint error');
  });

  it('drops absent ids', () => {
    // A stray `undefined` in the list points at an element that does not exist;
    // assistive technology skips it silently and nothing warns.
    expect(composeIds('hint', undefined, false, null, 'error')).toBe('hint error');
  });

  it('returns undefined when nothing is left, so the attribute is omitted', () => {
    expect(composeIds(undefined, false, null)).toBeUndefined();
    expect(composeIds()).toBeUndefined();
  });
});
