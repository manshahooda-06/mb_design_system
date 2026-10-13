import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input';

const control = () => screen.getByRole('textbox').closest('div')?.parentElement as HTMLElement;

describe('Input', () => {
  describe('rendering', () => {
    it('renders a textbox', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('associates the label with the input', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBe(screen.getByRole('textbox'));
    });

    it('generates an id when none is given, and honours one that is', () => {
      const { unmount } = render(<Input label="Email" />);
      expect(screen.getByRole('textbox').id).not.toBe('');
      unmount();
      render(<Input label="Email" id="custom" />);
      expect(screen.getByRole('textbox').id).toBe('custom');
    });

    it('forwards a ref to the input, not the wrapper', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('passes native props through to the input', () => {
      render(<Input placeholder="olivia@untitledui.com" maxLength={40} type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'olivia@untitledui.com');
      expect(input).toHaveAttribute('maxlength', '40');
      expect(input).toHaveAttribute('type', 'email');
    });
  });

  describe('sizes — Figma pins a fixed control height', () => {
    it.each([
      ['sm', 'h-[44px]', 'px-[14px]', 'py-[10px]', 'rounded-md'],
      ['md', 'h-[56px]', 'px-semantic-lg', 'py-semantic-xl', 'rounded-xl'],
    ] as const)('%s uses its measured geometry', (size, h, px, py, radius) => {
      render(<Input size={size} />);
      const { className } = control();
      for (const cls of [h, px, py, radius]) expect(className).toContain(cls);
    });

    it.each([
      ['sm', 'text-mobile-body-md', 'placeholder:text-mobile-body-sm'],
      ['md', 'text-desktop-body-sm', 'placeholder:text-desktop-caption-md'],
    ] as const)('%s styles placeholder and value differently', (size, value, placeholder) => {
      // Figma: placeholder is one step smaller and lighter than the value.
      render(<Input size={size} />);
      const { className } = screen.getByRole('textbox');
      expect(className).toContain(value);
      expect(className).toContain(placeholder);
      expect(className).toContain('placeholder:font-light');
      expect(className).toContain('font-normal');
    });
  });

  describe('stroke and shadow', () => {
    it('draws the border as an inside stroke, never a CSS border', () => {
      // Figma strokes are inside-aligned and the frame stays 44/56 at 1px or 2px.
      render(<Input />);
      const { className } = control();
      expect(className).toContain('inset-ring-semantic-border-primary');
      expect(className).not.toMatch(/(^|\s)border(\s|$)/);
    });

    it('thickens the stroke to 2px on focus, with no separate ring', () => {
      render(<Input />);
      const { className } = control();
      expect(className).toContain('focus-within:inset-ring-2');
      expect(className).toContain('focus-within:inset-ring-semantic-border-brand-alt');
      expect(className).not.toContain('focus-visible:ring-2');
    });

    it('carries the elevation-1 shadow in every state', () => {
      // One shadow throughout; the 2px border is the whole focus treatment.
      render(<Input />);
      const { className } = control();
      expect(className).toContain('shadow-elevation-1');
    });
  });

  describe('invalid — Figma Destructive', () => {
    it('uses the error-600 stroke and marks the input invalid', () => {
      render(<Input invalid />);
      expect(control().className).toContain('inset-ring-error-600');
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('keeps the error stroke while focused', () => {
      render(<Input invalid />);
      expect(control().className).toContain('focus-within:inset-ring-error-600');
    });

    it('turns the hint error-coloured', () => {
      render(<Input invalid hint="Enter a valid number" />);
      expect(screen.getByText('Enter a valid number').className).toContain(
        'text-semantic-text-error-primary',
      );
    });

    it('leaves the hint quaternary when valid', () => {
      render(<Input hint="This is a hint text to help user." />);
      expect(screen.getByText('This is a hint text to help user.').className).toContain(
        'text-semantic-text-quaternary',
      );
    });

    it('omits aria-invalid when valid', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('disabled', () => {
    it('greys the surface and the value, and blocks typing', async () => {
      render(<Input disabled defaultValue="" />);
      expect(control().className).toContain('bg-semantic-bg-disabled-subtle');
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      await userEvent.type(input, 'abc');
      expect(input).toHaveValue('');
    });

    it('styles the disabled value with text-tertiary', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox').className).toContain(
        'disabled:text-semantic-text-tertiary',
      );
    });
  });

  describe('required', () => {
    it('renders the marker and sets aria-required, without polluting the name', () => {
      render(<Input label="Email" required />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
      // The `*` is decorative; `aria-required` carries the meaning.
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByText('*')).toHaveAttribute('aria-hidden');
    });

    it('colours the marker with error-secondary, per Figma error/700', () => {
      render(<Input label="Email" required />);
      expect(screen.getByText('*').className).toContain('text-semantic-text-error-secondary');
    });
  });

  describe('hint', () => {
    it('is announced through aria-describedby', () => {
      render(<Input label="Email" hint="We never share it" />);
      const input = screen.getByRole('textbox');
      const hint = screen.getByText('We never share it');
      expect(input.getAttribute('aria-describedby')).toBe(hint.id);
    });

    it('omits aria-describedby when there is no hint', () => {
      render(<Input label="Email" />);
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('slots — the four Figma types', () => {
    it('Default renders no affordances', () => {
      render(<Input />);
      expect(control().querySelectorAll('span')).toHaveLength(0);
    });

    it('Icon leading renders a 20px box that does not scale with size', () => {
      // Figma keeps the leading icon at 20px for both sm and md.
      for (const size of ['sm', 'md'] as const) {
        const { unmount } = render(<Input size={size} leadingIcon={<svg data-testid="i" />} />);
        expect(screen.getByTestId('i').parentElement?.className).toContain('size-semantic-2xl');
        unmount();
      }
    });

    it('Leading text renders the prefix and widens the content gap', () => {
      render(<Input leadingText="http://" />);
      expect(screen.getByText('http://').className).toContain('text-semantic-text-secondary');
      // Figma's Leading text type uses a 12px Content gap where Default uses 8.
      const content = screen.getByRole('textbox').parentElement as HTMLElement;
      expect(content.className).toContain('gap-semantic-lg');
    });

    it('Trailing button removes the right padding and isolates the stack', () => {
      render(<Input trailingSlot={<button type="button">Copy</button>} />);
      const { className } = control();
      expect(className).toContain('isolate');
      expect(className).toContain('pr-semantic-none');
      expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
    });

    it('help icon renders a 16px box, hidden from assistive technology', () => {
      render(<Input helpIcon={<svg data-testid="help" />} />);
      const box = screen.getByTestId('help').parentElement as HTMLElement;
      expect(box.className).toContain('size-semantic-xl');
      expect(box).toHaveAttribute('aria-hidden');
    });
  });

  describe('behaviour', () => {
    it('accepts typing and reports the value', async () => {
      const onChange = vi.fn();
      render(<Input onChange={onChange} />);
      await userEvent.type(screen.getByRole('textbox'), 'olivia');
      expect(screen.getByRole('textbox')).toHaveValue('olivia');
      expect(onChange).toHaveBeenCalled();
    });

    it('is reachable by Tab and focuses the input', async () => {
      render(<Input label="Email" />);
      await userEvent.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('focuses the input when the label is clicked', async () => {
      render(<Input label="Email" />);
      await userEvent.click(screen.getByText('Email'));
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('truncates rather than overflowing', () => {
      render(<Input />);
      expect(screen.getByRole('textbox').className).toContain('truncate');
    });
  });

  describe('className override', () => {
    it('targets the control and wins over a variant class', () => {
      render(<Input className="rounded-none" />);
      const { className } = control();
      expect(className).toContain('rounded-none');
      expect(className).not.toContain('rounded-xl');
    });

    it('exposes per-slot overrides', () => {
      render(<Input label="Email" hint="Hint" classNames={{ root: 'max-w-desktop' }} />);
      expect(screen.getByRole('textbox').closest('.max-w-desktop')).not.toBeNull();
    });
  });

  describe('markup', () => {
    it('matches the snapshot for a fully configured field', () => {
      const { container } = render(
        <Input
          size="md"
          label="Email"
          required
          hint="This is a hint text to help user."
          placeholder="olivia@untitledui.com"
          leadingIcon={<svg />}
          helpIcon={<svg />}
        />,
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
