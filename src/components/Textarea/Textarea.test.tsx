import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Textarea } from './Textarea';

const control = () => screen.getByRole('textbox').parentElement as HTMLElement;

describe('Textarea', () => {
  describe('rendering', () => {
    it('renders a multiline textbox', () => {
      render(<Textarea />);
      expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
    });

    it('associates the label with the control', () => {
      render(<Textarea label="Description" />);
      expect(screen.getByLabelText('Description')).toBe(screen.getByRole('textbox'));
    });

    it('generates an id when none is given, and honours one that is', () => {
      const { unmount } = render(<Textarea label="Description" />);
      expect(screen.getByRole('textbox').id).not.toBe('');
      unmount();
      render(<Textarea label="Description" id="custom" />);
      expect(screen.getByRole('textbox').id).toBe('custom');
    });

    it('forwards a ref to the textarea, not the wrapper', () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });

    it('passes native props through', () => {
      render(<Textarea placeholder="Enter a description..." rows={5} maxLength={200} />);
      const el = screen.getByRole('textbox');
      expect(el).toHaveAttribute('placeholder', 'Enter a description...');
      expect(el).toHaveAttribute('rows', '5');
      expect(el).toHaveAttribute('maxlength', '200');
    });
  });

  describe('sizes — Figma pins a fixed control height', () => {
    it.each([
      ['sm', 'h-[120px]', 'px-[14px]', 'py-semantic-lg', 'rounded-md'],
      ['md', 'h-[132px]', 'px-[14px]', 'py-semantic-lg', 'rounded-md'],
    ] as const)('%s uses its measured geometry', (size, h, px, py, radius) => {
      render(<Textarea size={size} />);
      const { className } = control();
      for (const cls of [h, px, py, radius]) expect(className).toContain(cls);
    });

    it('uses radius-md at md, not radius-xl as Input does', () => {
      render(<Textarea size="md" />);
      const { className } = control();
      expect(className).toContain('rounded-md');
      expect(className).not.toContain('rounded-xl');
    });

    it.each([
      ['sm', 'text-mobile-body-md', 'placeholder:text-mobile-body-sm'],
      ['md', 'text-desktop-body-sm', 'placeholder:text-desktop-caption-md'],
    ] as const)('%s styles placeholder and value differently', (size, value, placeholder) => {
      render(<Textarea size={size} />);
      const { className } = screen.getByRole('textbox');
      expect(className).toContain(value);
      expect(className).toContain(placeholder);
      expect(className).toContain('placeholder:font-light');
      expect(className).toContain('font-normal');
    });
  });

  describe('multiline behaviour', () => {
    it('has no resize handle, since Figma shows none', () => {
      render(<Textarea />);
      expect(screen.getByRole('textbox').className).toContain('resize-none');
    });

    it('fills the fixed-height control so it scrolls internally', () => {
      render(<Textarea />);
      expect(screen.getByRole('textbox').className).toContain('h-full');
    });

    it('clips the control, matching the Figma frame', () => {
      render(<Textarea />);
      expect(control().className).toContain('overflow-clip');
    });

    it('aligns content to the top, not centred', () => {
      // Figma uses items-start here; a multiline field fills from the top.
      render(<Textarea />);
      expect(control().className).toContain('items-start');
    });

    it('accepts newlines', async () => {
      render(<Textarea />);
      const el = screen.getByRole('textbox');
      await userEvent.type(el, 'one{Enter}two');
      expect(el).toHaveValue('one\ntwo');
    });
  });

  describe('stroke and shadow', () => {
    it('draws the border as an inside stroke, never a CSS border', () => {
      render(<Textarea />);
      const { className } = control();
      expect(className).toContain('inset-ring-semantic-border-primary');
      expect(className).not.toMatch(/(^|\s)border(\s|$)/);
    });

    it('thickens the stroke to 2px on focus, with no separate ring', () => {
      render(<Textarea />);
      const { className } = control();
      expect(className).toContain('focus-within:inset-ring-2');
      expect(className).toContain('focus-within:inset-ring-semantic-border-brand-alt');
      expect(className).not.toContain('focus-visible:ring-2');
    });

    it('uses the elevation-1 shadow in every state', () => {
      // elevation-1 is the lowest level the Elevation foundation publishes.
      render(<Textarea />);
      const { className } = control();
      expect(className).toContain('shadow-elevation-1');
    });
  });

  describe('invalid — Figma Destructive', () => {
    it('uses the error-600 stroke and marks the control invalid', () => {
      render(<Textarea invalid />);
      expect(control().className).toContain('inset-ring-error-600');
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('keeps the error stroke while focused', () => {
      render(<Textarea invalid />);
      expect(control().className).toContain('focus-within:inset-ring-error-600');
    });

    it('turns the hint error-coloured', () => {
      render(<Textarea invalid hint="This is an error message." />);
      expect(screen.getByText('This is an error message.').className).toContain(
        'text-semantic-text-error-primary',
      );
    });

    it('leaves the hint quaternary when valid', () => {
      render(<Textarea hint="This is a hint text to help user." />);
      expect(screen.getByText('This is a hint text to help user.').className).toContain(
        'text-semantic-text-quaternary',
      );
    });
  });

  describe('disabled', () => {
    it('greys the surface and value, and blocks typing', async () => {
      render(<Textarea disabled />);
      expect(control().className).toContain('bg-semantic-bg-disabled-subtle');
      const el = screen.getByRole('textbox');
      expect(el).toBeDisabled();
      await userEvent.type(el, 'abc');
      expect(el).toHaveValue('');
    });

    it('styles the disabled value with text-tertiary', () => {
      render(<Textarea disabled />);
      expect(screen.getByRole('textbox').className).toContain(
        'disabled:text-semantic-text-tertiary',
      );
    });
  });

  describe('label, required and hint', () => {
    it('centres the label row, unlike Input which aligns to the start', () => {
      render(<Textarea label="Description" required />);
      const row = screen.getByText('Description').parentElement as HTMLElement;
      expect(row.className).toContain('items-center');
    });

    it('renders the marker, sets aria-required, and keeps it out of the name', () => {
      render(<Textarea label="Description" required />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByText('*')).toHaveAttribute('aria-hidden');
    });

    it('announces the hint through aria-describedby', () => {
      render(<Textarea label="Description" hint="Keep it short" />);
      expect(screen.getByRole('textbox').getAttribute('aria-describedby')).toBe(
        screen.getByText('Keep it short').id,
      );
    });

    it('omits aria-describedby when there is no hint', () => {
      render(<Textarea label="Description" />);
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
    });

    it.each([
      ['sm', 'size-semantic-xl'],
      ['md', 'size-semantic-2xl'],
    ] as const)('scales the hint icon at %s — Figma does scale this one', (size, expected) => {
      render(<Textarea size={size} hint="Hint" hintIcon={<svg data-testid="i" />} />);
      expect(screen.getByTestId('i').parentElement?.className).toContain(expected);
    });

    it('places the hint icon in the hint row, not inside the control', () => {
      // The opposite of Input, where the help icon sits inside the control.
      render(<Textarea hint="Hint" hintIcon={<svg data-testid="i" />} />);
      expect(control().contains(screen.getByTestId('i'))).toBe(false);
    });

    it('renders no hint icon when there is no hint', () => {
      render(<Textarea hintIcon={<svg data-testid="i" />} />);
      expect(screen.queryByTestId('i')).not.toBeInTheDocument();
    });
  });

  describe('behaviour', () => {
    it('reports changes', async () => {
      const onChange = vi.fn();
      render(<Textarea onChange={onChange} />);
      await userEvent.type(screen.getByRole('textbox'), 'hello');
      expect(screen.getByRole('textbox')).toHaveValue('hello');
      expect(onChange).toHaveBeenCalled();
    });

    it('is reachable by Tab', async () => {
      render(<Textarea label="Description" />);
      await userEvent.tab();
      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('focuses the control when the label is clicked', async () => {
      render(<Textarea label="Description" />);
      await userEvent.click(screen.getByText('Description'));
      expect(screen.getByRole('textbox')).toHaveFocus();
    });
  });

  describe('className override', () => {
    it('targets the control and wins over a variant class', () => {
      render(<Textarea className="rounded-none" />);
      const { className } = control();
      expect(className).toContain('rounded-none');
      expect(className).not.toContain('rounded-md');
    });
  });

  describe('markup', () => {
    it('matches the snapshot for a fully configured field', () => {
      const { container } = render(
        <Textarea
          size="md"
          label="Description"
          required
          hint="This is a hint text to help user."
          hintIcon={<svg />}
          placeholder="Enter a description..."
        />,
      );
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
