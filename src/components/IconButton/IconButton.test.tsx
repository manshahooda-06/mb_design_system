import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';

const Icon = () => <svg data-testid="icon" />;

describe('IconButton', () => {
  describe('rendering', () => {
    it('renders its icon', () => {
      render(
        <IconButton aria-label="Close">
          <Icon />
        </IconButton>,
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('takes its accessible name from aria-label', () => {
      render(
        <IconButton aria-label="Close dialog">
          <Icon />
        </IconButton>,
      );
      expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
    });

    it('hides the icon from assistive technology', () => {
      // Otherwise the icon competes with the label for the accessible name.
      render(
        <IconButton aria-label="Close">
          <Icon />
        </IconButton>,
      );
      expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden');
    });

    it('requires aria-label at compile time', () => {
      // @ts-expect-error An icon-only control with no name is announced as
      // "button" and nothing else; this is the one a11y rule the type enforces.
      const invalid = <IconButton>{<Icon />}</IconButton>;
      expect(invalid).toBeTruthy();
    });

    it('defaults to type="button"', () => {
      render(
        <IconButton aria-label="Close">
          <Icon />
        </IconButton>,
      );
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('forwards a ref', () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <IconButton aria-label="Close" ref={ref}>
          <Icon />
        </IconButton>,
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('variants and tones', () => {
    it('defaults to secondary — MB’s utility button', () => {
      // MB guidance: never put an icon-only control in a primary pill.
      render(
        <IconButton aria-label="Close">
          <Icon />
        </IconButton>,
      );
      expect(screen.getByRole('button').className).toContain(
        'inset-ring-semantic-button-secondary-border',
      );
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
    ] as const)('renders %s + %s from the shared action surface', (variant, tone, expected) => {
      render(
        <IconButton aria-label="Close" variant={variant} tone={tone}>
          <Icon />
        </IconButton>,
      );
      expect(screen.getByRole('button').className).toContain(expected);
    });

    it('rejects primary + color at compile time', () => {
      // @ts-expect-error Figma defines no brand-toned primary.
      const invalid = <IconButton aria-label="x" variant="primary" tone="color" />;
      expect(invalid).toBeTruthy();
    });
  });

  describe('shape and sizes', () => {
    it('is square', () => {
      render(
        <IconButton aria-label="Close">
          <Icon />
        </IconButton>,
      );
      expect(screen.getByRole('button').className).toContain('aspect-square');
    });

    it.each([
      ['sm', 'p-semantic-md', 'size-semantic-xl'],
      ['md', 'p-semantic-lg', 'size-semantic-xl'],
      ['lg', 'p-semantic-lg', 'size-semantic-2xl'],
    ] as const)('%s uses its padding and icon tokens', (size, padding, iconBox) => {
      render(
        <IconButton aria-label="Close" size={size}>
          <Icon />
        </IconButton>,
      );
      expect(screen.getByRole('button').className).toContain(padding);
      expect(screen.getByTestId('icon').parentElement?.className).toContain(iconBox);
    });

    it('sets no explicit width or height', () => {
      render(
        <IconButton aria-label="Close" size="lg">
          <Icon />
        </IconButton>,
      );
      const { className } = screen.getByRole('button');
      expect(className).not.toMatch(/(^|\s)h-/);
      expect(className).not.toMatch(/(^|\s)w-/);
    });
  });

  describe('states', () => {
    it('marks itself busy and blocks activation while loading, staying focusable', async () => {
      const onClick = vi.fn();
      render(
        <IconButton aria-label="Close" loading onClick={onClick}>
          <Icon />
        </IconButton>,
      );
      const button = screen.getByRole('button');
      await userEvent.click(button);
      expect(onClick).not.toHaveBeenCalled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).not.toBeDisabled();
    });

    it('replaces the icon with a spinner while loading', () => {
      render(
        <IconButton aria-label="Close" loading>
          <Icon />
        </IconButton>,
      );
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
      expect(screen.getByRole('button').querySelector('.animate-spin')).not.toBeNull();
      expect(screen.getByText('Loading')).toHaveClass('sr-only');
    });

    it('keeps its accessible name while loading', () => {
      render(
        <IconButton aria-label="Close dialog" loading>
          <Icon />
        </IconButton>,
      );
      expect(screen.getByRole('button', { name: /Close dialog/ })).toBeInTheDocument();
    });

    it('disables natively and does not fire onClick', async () => {
      const onClick = vi.fn();
      render(
        <IconButton aria-label="Close" disabled onClick={onClick}>
          <Icon />
        </IconButton>,
      );
      expect(screen.getByRole('button')).toBeDisabled();
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('keyboard interaction', () => {
    it('is reachable by Tab and activates on Enter and Space', async () => {
      const onClick = vi.fn();
      render(
        <IconButton aria-label="Close" onClick={onClick}>
          <Icon />
        </IconButton>,
      );
      await userEvent.tab();
      expect(screen.getByRole('button')).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('shows a focus ring only for keyboard focus', () => {
      render(
        <IconButton aria-label="Close">
          <Icon />
        </IconButton>,
      );
      const { className } = screen.getByRole('button');
      expect(className).toContain('focus-visible:ring-2');
      expect(className).not.toMatch(/(^|\s)focus:ring/);
    });
  });

  describe('asChild', () => {
    it('renders the caller element with the styling and keeps the label', () => {
      render(
        <IconButton aria-label="Settings" asChild>
          <a href="/settings">
            <Icon />
          </a>
        </IconButton>,
      );
      const link = screen.getByRole('link', { name: 'Settings' });
      expect(link.tagName).toBe('A');
      expect(link.className).toContain('aspect-square');
    });
  });

  describe('className override', () => {
    it('wins over a variant class', () => {
      render(
        <IconButton aria-label="Close" className="p-semantic-4xl">
          <Icon />
        </IconButton>,
      );
      const { className } = screen.getByRole('button');
      expect(className).toContain('p-semantic-4xl');
      expect(className).not.toContain('p-semantic-lg');
    });
  });

  describe('markup', () => {
    it('matches the snapshot', () => {
      const { container } = render(
        <IconButton aria-label="Close" variant="tertiary" tone="error" size="lg">
          <Icon />
        </IconButton>,
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
