import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('drops falsy values', () => {
    const isHidden = false;
    expect(cn('flex', isHidden && 'hidden', undefined, 'gap-2')).toBe('flex gap-2');
  });

  describe('semantic token scales', () => {
    // Stock tailwind-merge validates a utility's *value* against the scale it
    // expects, and `semantic-lg` matches none of its built-ins — so it returned
    // both classes and the winner depended on Tailwind's emit order rather than
    // on the caller. These are the regression guard for that fix.
    it.each([
      ['px-semantic-lg', 'px-semantic-xl'],
      ['p-semantic-md', 'p-semantic-sm'],
      ['gap-semantic-xs', 'gap-semantic-md'],
      ['mt-semantic-sm', 'mt-semantic-lg'],
    ])('resolves %s against %s', (first, second) => {
      expect(cn(first, second)).toBe(second);
    });

    it('resolves semantic colours', () => {
      expect(cn('bg-semantic-bg-primary', 'bg-semantic-bg-secondary')).toBe(
        'bg-semantic-bg-secondary',
      );
    });

    it('resolves Container tokens, which carry no semantic qualifier', () => {
      expect(cn('max-w-desktop', 'max-w-semantic-md')).toBe('max-w-semantic-md');
      expect(cn('p-container-padding-mobile', 'p-container-padding-desktop')).toBe(
        'p-container-padding-desktop',
      );
    });

    it('keeps utilities that do not actually conflict', () => {
      expect(cn('px-semantic-lg', 'py-semantic-xs')).toBe('px-semantic-lg py-semantic-xs');
    });

    it('lets a semantic class override a primitive one', () => {
      // The migration path: a component moving off an exempt primitive must not
      // end up emitting both.
      expect(cn('rounded-md', 'rounded-semantic-button')).toBe('rounded-semantic-button');
    });
  });
});
