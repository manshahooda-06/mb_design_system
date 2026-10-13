import { createRef, type FormEvent } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

/**
 * The shared component contract plus Button's own behaviour. The contract cases
 * are the ones every component is expected to satisfy — see
 * docs/Component-Architecture.md §10 — and must not be deleted.
 */
describe('Button', () => {
  describe('rendering', () => {
    it('renders its children', () => {
      render(<Button>Continue</Button>);
      expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    });

    it('defaults to type="button" so it does not submit a surrounding form', () => {
      const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <Button>Continue</Button>
        </form>,
      );
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('allows the type to be overridden for a real submit button', () => {
      render(<Button type="submit">Save</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('forwards a ref to the rendered element', () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Continue</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('passes through arbitrary DOM props', () => {
      render(
        <Button id="cta" data-analytics="checkout">
          Continue
        </Button>,
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'cta');
      expect(button).toHaveAttribute('data-analytics', 'checkout');
    });
  });

  describe('variants and tones', () => {
    it('applies the default variant and tone', () => {
      render(<Button>Continue</Button>);
      expect(screen.getByRole('button').className).toContain('bg-semantic-button-primary-bg');
    });

    it.each([
      ['primary', 'default', 'bg-semantic-button-primary-bg'],
      ['primary', 'error', 'bg-semantic-button-primary-error-bg'],
      ['secondary', 'default', 'inset-ring-semantic-button-secondary-border'],
      ['secondary', 'color', 'inset-ring-semantic-button-secondary-color-border'],
      ['secondary', 'error', 'inset-ring-semantic-button-secondary-error-border'],
      ['tertiary', 'default', 'text-semantic-button-tertiary-fg'],
      ['tertiary', 'color', 'text-semantic-button-tertiary-color-fg'],
      ['tertiary', 'error', 'text-semantic-button-tertiary-error-fg'],
    ] as const)('renders %s + %s from its own token family', (variant, tone, expected) => {
      // A widened variant and tone together are accepted, which is what makes
      // wrappers and Storybook args work. The invalid literal pair is still a
      // compile error — see the `@ts-expect-error` case below.
      render(
        <Button variant={variant} tone={tone}>
          Continue
        </Button>,
      );
      expect(screen.getByRole('button').className).toContain(expected);
    });

    it('rejects primary + color at compile time', () => {
      // @ts-expect-error Figma defines no brand-toned primary; if this pair ever
      // becomes assignable, the unused-directive error fails the typecheck.
      const invalid = <Button variant="primary" tone="color" />;
      expect(invalid).toBeTruthy();
    });

    it('collapses primary + color to default when a widened variant reaches it', () => {
      // Unreachable with literal props, but a wrapper passing widened values can
      // get here. The two are identical by definition, so collapsing is correct
      // — and without it no compound would match and the button would be bare.
      const variant = 'primary' as 'primary' | 'secondary';
      const tone = 'color' as const;
      render(
        <Button variant={variant} tone={tone}>
          Continue
        </Button>,
      );
      expect(screen.getByRole('button').className).toContain('bg-semantic-button-primary-bg');
    });

    it('gives a ghost button no resting background', () => {
      // Figma emits `tertiary-*-bg-hover` with no resting `bg` token.
      render(<Button variant="tertiary">Skip</Button>);
      const classes = screen.getByRole('button').className.split(' ');
      expect(classes.some((c) => /^bg-semantic-button-tertiary/.test(c))).toBe(false);
      expect(classes).toContain('hover:bg-semantic-button-tertiary-bg-hover');
    });

    it('draws the outline as an inside stroke, not a border', () => {
      // Figma strokes are inside-aligned: Secondary (1px stroke) and Primary
      // (none) are both exactly 155x40. A CSS `border` lays out *outside* the
      // content box and would add 2px, so the stroke is an inset ring, which
      // paints inside the border box and contributes nothing to layout.
      render(
        <Button variant="secondary" data-testid="root">
          A
        </Button>,
      );
      const { className } = screen.getByRole('button');
      expect(className).toContain('inset-ring-semantic-button-secondary-border');
      expect(className).not.toMatch(/(^|\s)border(\s|$)/);
      expect(className).not.toContain('border-transparent');
    });

    it('carries the elevation-1 shadow on every variant', () => {
      // Effect(DROP_SHADOW, #171b220d, offset (0,1), radius 2, spread 0) —
      // elevation-1 is the lowest level the Elevation foundation publishes.
      for (const variant of ['primary', 'secondary', 'tertiary'] as const) {
        const { unmount } = render(<Button variant={variant}>A</Button>);
        const { className } = screen.getByRole('button');
        expect(className).toContain('shadow-elevation-1');
        unmount();
      }
    });

    it('clips overflow, as the Figma frame does', () => {
      render(<Button>A</Button>);
      expect(screen.getByRole('button').className).toContain('overflow-clip');
    });

    it.each(['primary', 'secondary', 'tertiary'] as const)(
      'takes the error focus ring from the tone at %s emphasis',
      (variant) => {
        render(
          <Button variant={variant} tone="error">
            Delete
          </Button>,
        );
        expect(screen.getByRole('button').className).toContain('ring-semantic-focus-ring-error');
      },
    );
  });

  describe('sizes', () => {
    it.each([
      // Measured from Figma: md and lg differ only in type size.
      ['sm', 'px-semantic-lg', 'text-mobile-body-md', 'rounded-sm'],
      ['md', 'px-semantic-xl', 'text-mobile-body-md', 'rounded-md'],
      ['lg', 'px-semantic-xl', 'text-desktop-body-sm', 'rounded-md'],
    ] as const)('%s uses its padding, type and radius tokens', (size, padding, text, radius) => {
      render(<Button size={size}>Continue</Button>);
      const { className } = screen.getByRole('button');
      expect(className).toContain(padding);
      expect(className).toContain(text);
      expect(className).toContain(radius);
    });

    it.each([
      ['sm', 'gap-semantic-sm'],
      ['md', 'gap-semantic-sm'],
      ['lg', 'gap-semantic-md'],
    ] as const)('%s uses the Figma icon gap', (size, gap) => {
      // Measured from Figma: spacing-sm (6px) at sm and md, spacing-md (8px) at lg.
      render(<Button size={size}>Continue</Button>);
      expect(screen.getByRole('button').className).toContain(gap);
    });

    it('sets no explicit height, so height derives from padding and line-height', () => {
      // Pinning a height would decouple the button from the type ramp and
      // require a pixel value no token backs.
      render(<Button size="lg">Continue</Button>);
      expect(screen.getByRole('button').className).not.toMatch(/(^|\s)h-/);
    });
  });

  describe('full width', () => {
    it('is inline by default', () => {
      render(<Button>Continue</Button>);
      expect(screen.getByRole('button').className).not.toContain('w-full');
    });

    it('stretches when fullWidth is set', () => {
      render(<Button fullWidth>Continue</Button>);
      expect(screen.getByRole('button').className).toContain('w-full');
    });
  });

  describe('icons', () => {
    it('renders a leading slot without adding to the accessible name', () => {
      render(<Button startSlot={<svg data-testid="icon" />}>Continue</Button>);
      expect(screen.getByRole('button', { name: 'Continue' })).toContainElement(
        screen.getByTestId('icon'),
      );
    });

    it('renders a trailing slot after the label', () => {
      render(<Button endSlot={<svg data-testid="icon" />}>Continue</Button>);
      const wrapper = screen.getByTestId('icon').parentElement;
      expect(wrapper?.previousSibling?.textContent).toBe('Continue');
    });

    it('hides decorative slots from assistive technology', () => {
      // The label carries the meaning; announcing the icon as well is noise.
      render(<Button startSlot={<svg data-testid="icon" />}>Continue</Button>);
      expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden');
    });

    it.each([
      ['sm', 'size-semantic-xl'],
      ['md', 'size-semantic-xl'],
      ['lg', 'size-semantic-2xl'],
    ] as const)('scales the icon box with the %s button', (size, expected) => {
      render(
        <Button size={size} startSlot={<svg data-testid="icon" />}>
          Continue
        </Button>,
      );
      expect(screen.getByTestId('icon').parentElement?.className).toContain(expected);
    });
  });

  describe('loading', () => {
    it('keeps its own fill rather than greying out', () => {
      // Figma (node 4450:2079) renders a loading primary at brand/700 — the
      // hover shade — with a white label. Loading is not a disabled control.
      render(<Button loading>Continue</Button>);
      expect(screen.getByRole('button').className).toContain(
        'aria-disabled:bg-semantic-button-primary-bg-hover',
      );
    });

    it('marks itself busy', () => {
      render(<Button loading>Continue</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('announces a loading label without changing the visible text', () => {
      render(<Button loading>Continue</Button>);
      expect(screen.getByRole('button', { name: /Continue/ })).toBeInTheDocument();
      expect(screen.getByText('Loading')).toHaveClass('sr-only');
    });

    it('accepts a custom loading label', () => {
      render(
        <Button loading loadingLabel="Submitting payment">
          Pay
        </Button>,
      );
      expect(screen.getByText('Submitting payment')).toBeInTheDocument();
    });

    it('replaces the leading slot with the spinner', () => {
      render(
        <Button loading startSlot={<svg data-testid="icon" />}>
          Continue
        </Button>,
      );
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
      expect(screen.getByRole('button').querySelector('.animate-spin')).not.toBeNull();
    });

    it('keeps the trailing slot', () => {
      render(
        <Button loading endSlot={<svg data-testid="icon" />}>
          Continue
        </Button>,
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('blocks activation while staying focusable', async () => {
      // Not the native `disabled` attribute: that would drop the button out of
      // the tab order mid-interaction and throw focus back to the document.
      const onClick = vi.fn();
      render(
        <Button loading onClick={onClick}>
          Continue
        </Button>,
      );
      const button = screen.getByRole('button');

      await userEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();

      button.focus();
      expect(button).toHaveFocus();
      expect(button).not.toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('disabled', () => {
    it('sets the native attribute and the ARIA one', () => {
      render(<Button disabled>Continue</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('does not fire onClick', async () => {
      const onClick = vi.fn();
      render(
        <Button disabled onClick={onClick}>
          Continue
        </Button>,
      );
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('omits every state attribute when enabled', () => {
      render(<Button>Continue</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveAttribute('aria-disabled');
      expect(button).not.toHaveAttribute('aria-busy');
    });

    it('greys the surface for filled and outlined, only the label for ghost', () => {
      const { rerender } = render(<Button disabled>Continue</Button>);
      expect(screen.getByRole('button').className).toContain('disabled:bg-semantic-bg-disabled');

      rerender(
        <Button variant="tertiary" disabled>
          Continue
        </Button>,
      );
      const { className } = screen.getByRole('button');
      expect(className).not.toContain('disabled:bg-semantic-bg-disabled');
      expect(className).toContain('disabled:text-semantic-fg-disabled');
    });
  });

  describe('keyboard interaction', () => {
    it('is reachable by Tab', async () => {
      render(<Button>Continue</Button>);
      await userEvent.tab();
      expect(screen.getByRole('button')).toHaveFocus();
    });

    it('activates on Enter and Space', async () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Continue</Button>);
      screen.getByRole('button').focus();

      await userEvent.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalledTimes(1);

      await userEvent.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('is skipped by Tab when disabled', async () => {
      render(
        <>
          <Button disabled>First</Button>
          <Button>Second</Button>
        </>,
      );
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus();
    });

    it('shows a focus ring only for keyboard focus', () => {
      render(<Button>Continue</Button>);
      const { className } = screen.getByRole('button');
      expect(className).toContain('focus-visible:ring-2');
      expect(className).toContain('outline-none');
      expect(className).not.toMatch(/(^|\s)focus:ring/);
    });
  });

  describe('asChild', () => {
    it('renders the caller element with the button styling', () => {
      render(
        <Button asChild>
          <a href="/settings">Settings</a>
        </Button>,
      );
      const link = screen.getByRole('link', { name: 'Settings' });
      expect(link.tagName).toBe('A');
      expect(link.className).toContain('bg-semantic-button-primary-bg');
    });

    it('does not put a disabled or type attribute on a non-button element', () => {
      // Neither is valid on an anchor; `aria-disabled` carries the state instead.
      render(
        <Button asChild disabled>
          <a href="/settings">Settings</a>
        </Button>,
      );
      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('disabled');
      expect(link).not.toHaveAttribute('type');
      expect(link).toHaveAttribute('aria-disabled', 'true');
    });

    it('still refuses activation when disabled', async () => {
      const onClick = vi.fn();
      render(
        <Button asChild disabled onClick={onClick}>
          <a href="/settings">Settings</a>
        </Button>,
      );
      await userEvent.click(screen.getByRole('link'));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('lets the caller own the content', () => {
      render(
        <Button asChild startSlot={<svg data-testid="icon" />}>
          <a href="/settings">Settings</a>
        </Button>,
      );
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });
  });

  describe('className override', () => {
    it('wins over a variant class', () => {
      render(<Button className="px-semantic-4xl">Continue</Button>);
      const { className } = screen.getByRole('button');
      expect(className).toContain('px-semantic-4xl');
      expect(className).not.toContain('px-semantic-xl');
    });

    it('keeps the pointer cursor', () => {
      render(<Button>Continue</Button>);
      expect(screen.getByRole('button').className).toContain('cursor-pointer');
    });

    it('keeps classes that do not conflict', () => {
      // `uppercase` shares no tailwind-merge group with anything in the base, so it
      // survives alongside the variant classes rather than replacing one.
      render(<Button className="uppercase">Continue</Button>);
      const { className } = screen.getByRole('button');
      expect(className).toContain('uppercase');
      expect(className).toContain('bg-semantic-button-primary-bg');
    });
  });

  describe('markup', () => {
    it('matches the snapshot for a fully configured button', () => {
      const { container } = render(
        <Button
          variant="secondary"
          tone="color"
          size="lg"
          fullWidth
          startSlot={<svg data-testid="icon" />}
        >
          Continue
        </Button>,
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
