import { describe, expect, it } from 'vitest';
import { defineVariants, type VariantProps } from './variants';

const probeVariants = defineVariants('inline-flex px-semantic-md rounded-md', {
  variants: {
    variant: {
      primary: 'bg-semantic-bg-brand-solid',
      secondary: 'bg-semantic-bg-secondary',
    },
    size: {
      sm: 'px-semantic-sm',
      md: 'px-semantic-lg',
    },
    round: { true: 'rounded-full' },
  },
  compoundVariants: [{ variant: 'primary', size: 'md', class: 'font-semibold' }],
  defaultVariants: { variant: 'primary', size: 'md' },
});

describe('defineVariants', () => {
  it('applies the default variants', () => {
    const result = probeVariants();
    expect(result).toContain('bg-semantic-bg-brand-solid');
    expect(result).toContain('px-semantic-lg');
  });

  it('applies a selected variant', () => {
    expect(probeVariants({ variant: 'secondary' })).toContain('bg-semantic-bg-secondary');
  });

  it('applies compound variants', () => {
    expect(probeVariants({ variant: 'primary', size: 'md' })).toContain('font-semibold');
    expect(probeVariants({ variant: 'secondary', size: 'md' })).not.toContain('font-semibold');
  });

  it('resolves a base class against a variant that conflicts with it', () => {
    // The reason this wraps `cva` at all: `cx` concatenates, so the base padding
    // and the variant padding would both survive and the winner would depend on
    // Tailwind's emit order rather than on the variant.
    const result = probeVariants({ size: 'sm' });
    expect(result).toContain('px-semantic-sm');
    expect(result).not.toContain('px-semantic-md');
    expect(result).not.toContain('px-semantic-lg');
  });

  it('resolves a boolean variant against the base', () => {
    const result = probeVariants({ round: true });
    expect(result).toContain('rounded-full');
    expect(result).not.toContain('rounded-md');
  });

  it('lets className win over every variant class', () => {
    const result = probeVariants({ variant: 'primary', className: 'bg-semantic-bg-secondary' });
    expect(result).toContain('bg-semantic-bg-secondary');
    expect(result).not.toContain('bg-semantic-bg-brand-solid');
  });

  it('keeps non-conflicting classes', () => {
    expect(probeVariants()).toContain('inline-flex');
  });

  it('infers variant prop types', () => {
    // A compile-time assertion: if the wrapper lost `cva`'s inference, this stops
    // typechecking and `pnpm typecheck` fails.
    const props: VariantProps<typeof probeVariants> = { variant: 'secondary', size: 'sm' };
    expect(probeVariants(props)).toContain('bg-semantic-bg-secondary');
  });
});
