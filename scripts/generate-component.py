#!/usr/bin/env python3
"""Scaffolds a component onto the shared architecture.

    python3 scripts/generate-component.py Button --element button

Writes the five files every component has, then regenerates the barrel. Existing
files are never overwritten, so re-running after implementing a component is a
safe no-op — see `common.scaffold`.

The skeleton it emits is a working component, not a stub: it compiles, passes
lint, passes its own tests, and obeys the token rule from the first run. A
scaffold that starts red teaches people to ignore red.
"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))

from common import scaffold, validation  # noqa: E402

COMPONENTS = pathlib.Path(__file__).parent.parent / 'src' / 'components'

VARIANTS_TEMPLATE = """\
import { focusRing } from '@utils/a11y';
import { defineVariants, type VariantProps } from '@utils/variants';

/**
 * Styling for __NAME__, declared as data.
 *
 * Every class this component can apply is listed here, which is what makes the
 * styling reviewable without reading the render function and testable without
 * mounting anything.
 *
 * Tokens only: semantic where a semantic collection exists, primitive only for
 * typography and radius, which have none yet. `token-usage.test.ts` enforces this
 * and will fail the build on a primitive colour or spacing step.
 */
export const __CAMEL__Variants = defineVariants(
  [
    'inline-flex items-center justify-center gap-semantic-xs',
    'rounded-md font-medium',
    'transition-colors disabled:pointer-events-none disabled:opacity-50',
    focusRing,
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-semantic-bg-brand-solid text-semantic-text-primary-on-brand',
          'hover:bg-semantic-bg-brand-solid-hover',
        ],
        secondary: [
          'bg-semantic-bg-secondary text-semantic-text-secondary',
          'border border-semantic-border-primary hover:bg-semantic-bg-secondary-hover',
        ],
      },
      // The type ramp currently publishes two body sizes; add steps here as the
      // design adds them rather than reaching for an arbitrary value.
      size: {
        sm: 'px-semantic-md py-semantic-xxs text-desktop-body-sm',
        md: 'px-semantic-lg py-semantic-xs text-desktop-body-md',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type __NAME__VariantProps = VariantProps<typeof __CAMEL__Variants>;
"""

COMPONENT_TEMPLATE = """\
import type { ElementType } from 'react';
import type { AsChildProps, BaseComponentProps, ContentSlotProps } from '@/types';
import { Slot } from '@utils/slot';
import { __CAMEL__Variants, type __NAME__VariantProps } from './__NAME__.variants';

export interface __NAME__Props
  extends BaseComponentProps,
    AsChildProps,
    ContentSlotProps,
    __NAME__VariantProps,
    Omit<React.ComponentPropsWithRef<'__ELEMENT__'>, keyof __NAME__VariantProps> {}

/**
 * TODO: describe what __NAME__ is for and when to reach for something else.
 *
 * `asChild` hands the props and styling to the caller's own element instead of
 * rendering a `<__ELEMENT__>`. Content slots are not applied in that case — the
 * caller owns the content, and injecting into their element would fight whatever
 * they put there.
 */
export function __NAME__({
  asChild,
  className,
  variant,
  size,
  startSlot,
  endSlot,
  children,
  ...rest
}: __NAME__Props) {
  const Component = (asChild ? Slot : '__ELEMENT__') as ElementType;

  return (
    <Component className={__CAMEL__Variants({ variant, size, className })} {...rest}>
      {asChild ? (
        children
      ) : (
        <>
          {startSlot}
          {children}
          {endSlot}
        </>
      )}
    </Component>
  );
}
"""

TEST_TEMPLATE = """\
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { __NAME__ } from './__NAME__';

/**
 * The behaviour every component is expected to have. Add cases specific to
 * __NAME__ below; do not delete these — they are the shared contract, and a
 * component that breaks one of them breaks a consumer's expectation set by
 * every other component.
 */
describe('__NAME__', () => {
  it('renders its children', () => {
    render(<__NAME__>Content</__NAME__>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies its default variant', () => {
    render(<__NAME__ data-testid="root">Content</__NAME__>);
    expect(screen.getByTestId('root').className).toContain('bg-semantic-bg-brand-solid');
  });

  it('applies the requested variant', () => {
    render(
      <__NAME__ data-testid="root" variant="secondary">
        Content
      </__NAME__>,
    );
    expect(screen.getByTestId('root').className).toContain('bg-semantic-bg-secondary');
  });

  it('lets className win over a variant class', () => {
    // twMerge must drop the variant's padding rather than emit both, or which one
    // applies depends on Tailwind's output order instead of on the caller.
    render(
      <__NAME__ data-testid="root" className="px-semantic-xl">
        Content
      </__NAME__>,
    );
    const { className } = screen.getByTestId('root');
    expect(className).toContain('px-semantic-xl');
    expect(className).not.toContain('px-semantic-lg');
  });

  it('forwards a ref to the rendered element', () => {
    const ref = createRef<HTML__CAPELEMENT__Element>();
    render(<__NAME__ ref={ref}>Content</__NAME__>);
    expect(ref.current).toBeInstanceOf(HTML__CAPELEMENT__Element);
  });

  it('renders content slots around its children', () => {
    render(
      <__NAME__ startSlot={<span>start</span>} endSlot={<span>end</span>}>
        middle
      </__NAME__>,
    );
    expect(screen.getByText('start')).toBeInTheDocument();
    expect(screen.getByText('end')).toBeInTheDocument();
  });

  it('renders the caller\\'s element with asChild', () => {
    render(
      <__NAME__ asChild>
        <a href="/somewhere">Link</a>
      </__NAME__>,
    );
    const link = screen.getByRole('link', { name: 'Link' });
    expect(link.tagName).toBe('A');
    expect(link.className).toContain('bg-semantic-bg-brand-solid');
  });

  it('passes through arbitrary DOM props', () => {
    render(
      <__NAME__ data-testid="root" id="custom" aria-label="labelled">
        Content
      </__NAME__>,
    );
    expect(screen.getByTestId('root')).toHaveAttribute('id', 'custom');
    expect(screen.getByLabelText('labelled')).toBeInTheDocument();
  });
});
"""

STORIES_TEMPLATE = """\
import type { Meta, StoryObj } from '@storybook/react-vite';
import { __NAME__ } from './__NAME__';

const meta = {
  title: 'Components/__NAME__',
  component: __NAME__,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    asChild: { control: 'boolean' },
  },
  args: { children: '__NAME__' },
} satisfies Meta<typeof __NAME__>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Every variant, so a change to one is visible against the others. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex items-center gap-semantic-md">
      <__NAME__ {...args} variant="primary" />
      <__NAME__ {...args} variant="secondary" />
    </div>
  ),
};

/** Every size at one variant, to check the scale reads as a progression. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-semantic-md">
      <__NAME__ {...args} size="sm" />
      <__NAME__ {...args} size="md" />
    </div>
  ),
};

/** Content slots, which every component positions the same way. */
export const WithSlots: Story = {
  args: {
    startSlot: <span aria-hidden>←</span>,
    endSlot: <span aria-hidden>→</span>,
  },
};

/** `asChild` renders the caller's element with this component's styling. */
export const AsChild: Story = {
  render: (args) => (
    <__NAME__ {...args} asChild>
      <a href="#top">Rendered as a link</a>
    </__NAME__>
  ),
};
"""

INDEX_TEMPLATE = """\
export { __NAME__ } from './__NAME__';
export type { __NAME__Props } from './__NAME__';
"""

BARREL_BANNER = """\
/*
 * Generated by scripts/generate-component.py — do not edit.
 *
 * Lists exactly the component directories that exist, so a component cannot be
 * implemented and then left unexported.
 */
"""


def barrel(names):
    """The components barrel, derived from the directories on disk."""
    if not names:
        return BARREL_BANNER + '\nexport {};\n'
    exports = '\n'.join(f"export * from './{name}';" for name in names)
    return BARREL_BANNER + '\n' + exports + '\n'


def component_names():
    """Every component directory, sorted, ignoring loose files."""
    return sorted(
        entry.name
        for entry in COMPONENTS.iterdir()
        if entry.is_dir() and (entry / f'{entry.name}.tsx').exists()
    )


def main(argv):
    if not argv or argv[0].startswith('-'):
        validation.fail('usage: generate-component.py <Name> [--element <tag>]')

    name = scaffold.pascal(argv[0])
    validation.require(name, f'{argv[0]!r} does not produce a usable component name')

    element = 'div'
    if '--element' in argv:
        index = argv.index('--element')
        validation.require(index + 1 < len(argv), '--element needs a tag name')
        element = argv[index + 1]

    values = {
        'name': name,
        'camel': scaffold.camel(name),
        'kebab': scaffold.kebab(name),
        'element': element,
        # `HTMLButtonElement`, `HTMLDivElement`, `HTMLAnchorElement`.
        'capelement': {'a': 'Anchor', 'p': 'Paragraph'}.get(element, element.capitalize()),
    }

    directory = COMPONENTS / name
    files = {
        f'{name}.tsx': COMPONENT_TEMPLATE,
        f'{name}.variants.ts': VARIANTS_TEMPLATE,
        f'{name}.test.tsx': TEST_TEMPLATE,
        f'{name}.stories.tsx': STORIES_TEMPLATE,
        'index.ts': INDEX_TEMPLATE,
    }

    print(f'{name} (<{element}>)')
    results = [
        (
            (directory / filename).relative_to(COMPONENTS.parent.parent),
            scaffold.write_once(directory / filename, scaffold.render(template, **values)),
        )
        for filename, template in files.items()
    ]

    barrel_path = COMPONENTS / 'index.ts'
    results.append(
        (
            barrel_path.relative_to(COMPONENTS.parent.parent),
            scaffold.rewrite(barrel_path, barrel(component_names())),
        )
    )

    scaffold.report(results)


if __name__ == '__main__':
    main(sys.argv[1:])
