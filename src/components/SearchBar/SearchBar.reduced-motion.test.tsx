import { act } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `prefers-reduced-motion`, which needs a file of its own.
 *
 * framer-motion reads the query **once** into a module-level singleton the first time it is
 * imported, so stubbing `matchMedia` inside a test that already imported it changes
 * nothing. Here the stub is installed first and the component is imported dynamically
 * after `vi.resetModules()`, which is the only order that reaches that singleton.
 */
function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

async function importSearchBar() {
  vi.resetModules();
  const mod = await import('./SearchBar');
  return mod.SearchBar;
}

const activeTypeOf = (container: HTMLElement) =>
  container.querySelector('[data-active-type]')?.getAttribute('data-active-type') ?? null;

describe('SearchBar under prefers-reduced-motion', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('does not cycle', async () => {
    stubReducedMotion(true);
    const SearchBar = await importSearchBar();
    const { container } = render(<SearchBar />);
    await act(async () => vi.advanceTimersByTime(2000 * 5));
    expect(activeTypeOf(container)).toBe('doctor');
  });

  it('names the visible word, because it is standing still', async () => {
    // The opposite of the cycling case: a word that cannot move belongs in the name.
    stubReducedMotion(true);
    const SearchBar = await importSearchBar();
    render(<SearchBar type="speciality" />);
    expect(screen.getByRole('searchbox')).toHaveAccessibleName('Search by ‘Speciality’');
  });

  // The negative control for these two lives in `SearchBar.test.tsx`: its
  // "cycles through the four words, then wraps" case runs with no stub at all — the
  // no-preference path — and does advance. It cannot be repeated here, because
  // `vi.resetModules()` hands the dynamic import a second React instance that the `act`
  // imported at the top of this file cannot flush.
});
