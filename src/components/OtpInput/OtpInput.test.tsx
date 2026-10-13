import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OtpInput } from './OtpInput';

const cells = () => screen.getAllByRole('textbox') as HTMLInputElement[];
const cell = (index: number) => cells()[index] as HTMLInputElement;
const values = () => cells().map((el) => el.value);
const row = () => screen.getByRole('group');

describe('OtpInput', () => {
  describe('rendering', () => {
    it.each([4, 5, 6] as const)('renders one native input per cell at length %s', (length) => {
      render(<OtpInput length={length} />);
      expect(cells()).toHaveLength(length);
      for (const el of cells()) expect(el.tagName).toBe('INPUT');
    });

    it('defaults to 4 digits — the default variant in Figma', () => {
      render(<OtpInput />);
      expect(cells()).toHaveLength(4);
    });

    it('groups the cells so assistive technology announces one field', () => {
      render(<OtpInput label="Verification code" hint="Check your messages." />);
      const group = row();
      expect(group).toHaveAccessibleName('Verification code');
      expect(group).toHaveAccessibleDescription('Check your messages.');
    });

    it('points the label at the first cell, so clicking it starts entry there', async () => {
      const user = userEvent.setup();
      render(<OtpInput label="Verification code" />);
      await user.click(screen.getByText('Verification code'));
      expect(cell(0)).toHaveFocus();
    });

    it('generates an id when none is given, and honours one that is', () => {
      const { unmount } = render(<OtpInput label="Code" />);
      expect(cell(0).id).not.toBe('');
      unmount();
      render(<OtpInput label="Code" id="custom" />);
      expect(cell(0).id).toBe('custom-0');
    });

    it('labels every cell by position', () => {
      render(<OtpInput length={6} />);
      expect(screen.getByLabelText('Digit 1 of 6')).toBe(cell(0));
      expect(screen.getByLabelText('Digit 6 of 6')).toBe(cell(5));
    });

    it('omits the group name and description when there is no label or hint', () => {
      render(<OtpInput />);
      expect(row()).not.toHaveAttribute('aria-labelledby');
      expect(row()).not.toHaveAttribute('aria-describedby');
    });

    it('sets the one-time-code and numeric keypad hints on every cell', () => {
      render(<OtpInput length={6} />);
      for (const el of cells()) {
        expect(el).toHaveAttribute('autocomplete', 'one-time-code');
        expect(el).toHaveAttribute('inputmode', 'numeric');
      }
    });

    it('indexes each cell name so a form submits every digit', () => {
      render(<OtpInput length={4} name="otp" />);
      expect(cells().map((el) => el.getAttribute('name'))).toEqual([
        'otp-0',
        'otp-1',
        'otp-2',
        'otp-3',
      ]);
    });

    it('passes native props through to the root', () => {
      render(<OtpInput data-testid="otp" />);
      expect(screen.getByTestId('otp')).toBeInTheDocument();
    });
  });

  describe('geometry — measured from Figma', () => {
    it('sizes every cell 48 square from the semantic scale, not an arbitrary value', () => {
      render(<OtpInput length={6} />);
      for (const el of cells()) {
        expect(el.className).toContain('size-semantic-6xl');
        expect(el.className).not.toContain('48px');
      }
    });

    it('applies the measured cell padding and radius', () => {
      render(<OtpInput />);
      const { className } = cell(0);
      for (const cls of ['px-semantic-md', 'py-semantic-xxs', 'rounded-md']) {
        expect(className).toContain(cls);
      }
    });

    it('spaces the cells by spacing-md 8 and top-aligns them', () => {
      render(<OtpInput />);
      expect(row().className).toContain('gap-semantic-md');
      expect(row().className).toContain('items-start');
    });

    it('gaps the root by spacing-xs 4 and the field group by spacing-md 8', () => {
      render(<OtpInput label="Code" hint="Hint" />);
      const group = row();
      const fieldGroup = group.parentElement as HTMLElement;
      const rootEl = fieldGroup.parentElement as HTMLElement;
      expect(fieldGroup.className).toContain('gap-semantic-md');
      expect(rootEl.className).toContain('gap-semantic-xs');
    });

    it('hugs its content, unlike Input and Textarea which fill the width', () => {
      render(<OtpInput label="Code" />);
      const rootEl = (row().parentElement as HTMLElement).parentElement as HTMLElement;
      expect(rootEl.className).toContain('inline-flex');
      expect(rootEl.className).not.toContain('w-full');
    });
  });

  describe('the stroke is an inside ring, not a border', () => {
    it('never uses a CSS border, which would grow the 48px box', () => {
      render(<OtpInput length={6} defaultValue="000000" />);
      for (const el of cells()) {
        expect(el.className).toContain('inset-ring');
        expect(el.className).not.toMatch(/(^|\s)border(\s|$)/);
      }
    });

    it('thickens the ring to 2px on focus rather than changing the box', () => {
      render(<OtpInput />);
      expect(cell(0).className).toContain('focus:inset-ring-2');
    });
  });

  describe('per-cell state — the axis Figma actually varies', () => {
    it('gives an empty cell the resting stroke', () => {
      render(<OtpInput />);
      expect(cell(0).className).toContain('inset-ring-semantic-border-primary');
    });

    it('gives a filled cell the brand stroke, and it survives blur', () => {
      render(<OtpInput defaultValue="12" />);
      expect(cell(0).className).toContain('inset-ring-semantic-border-brand-alt');
      expect(cell(1).className).toContain('inset-ring-semantic-border-brand-alt');
      expect(cell(0)).not.toHaveFocus();
    });

    it('leaves cells past the value at the resting stroke', () => {
      render(<OtpInput length={4} defaultValue="12" />);
      expect(cell(2).className).toContain('inset-ring-semantic-border-primary');
      // The brand stroke may only appear behind `focus:` here — an unprefixed one
      // would mean an empty cell is painted as filled.
      expect(cell(2).className).not.toMatch(/(^|\s)inset-ring-semantic-border-brand-alt(\s|$)/);
    });

    it('reproduces the Focused composition Figma draws: filled, focused, then empty', async () => {
      const user = userEvent.setup();
      render(<OtpInput length={6} defaultValue="0000" />);
      await user.click(cell(4));
      // Cells 0–3 filled, cell 4 focused and empty, cell 5 empty.
      for (const index of [0, 1, 2, 3]) {
        expect(cell(index).className).toContain('inset-ring-semantic-border-brand-alt');
      }
      expect(cell(4)).toHaveFocus();
      expect(cell(5).className).toContain('inset-ring-semantic-border-primary');
    });

    it('renders no placeholder character — Figma hides the digit when empty', () => {
      render(<OtpInput />);
      for (const el of cells()) {
        expect(el.value).toBe('');
        expect(el).not.toHaveAttribute('placeholder');
      }
    });
  });

  describe('the digit', () => {
    it('uses the 20/32 heading ramp, centred, at regular weight', () => {
      render(<OtpInput />);
      const { className } = cell(0);
      for (const cls of ['text-mobile-heading-md', 'text-center', 'font-normal']) {
        expect(className).toContain(cls);
      }
    });

    it('is text-primary when entered and text-quaternary when disabled', () => {
      const { unmount } = render(<OtpInput defaultValue="1" />);
      expect(cell(0).className).toContain('text-semantic-text-primary');
      unmount();
      render(<OtpInput disabled defaultValue="1" />);
      expect(cell(0).className).toContain('text-semantic-text-quaternary');
    });

    it('goes quaternary when disabled, not the tertiary Input and Textarea use', () => {
      render(<OtpInput disabled defaultValue="1" />);
      expect(cell(0).className).not.toContain('text-semantic-text-tertiary');
    });
  });

  describe('shadow and focus ring', () => {
    it('carries a box-shadow in every state, like Textarea and unlike Input', () => {
      render(<OtpInput />);
      const { className } = cell(0);
      expect(className).toContain('shadow-elevation-1');
    });

    it('composes the focused shadow in Figma layer order, elevation in front', () => {
      render(<OtpInput />);
      const { className } = cell(0);
      // Tailwind's ring utilities would place the elevation layers *behind* the
      // opaque white offset ring, hiding them. The explicit list keeps Figma's paint
      // order while still reading the token rather than restating a geometry.
      expect(className).toContain(
        'focus:shadow-[var(--shadow-elevation-1),' +
          '0_0_0_2px_var(--color-semantic-bg-primary),' +
          '0_0_0_4px_var(--color-semantic-focus-ring)]',
      );
      expect(className).not.toMatch(/(^|\s)ring-2/);
    });

    it('sets no shadow colour utility, which would repaint every layer of that list', () => {
      // `shadow-<color>` sets --tw-shadow-color, and Tailwind substitutes it into
      // each layer of an arbitrary shadow, collapsing the rings into one colour.
      render(<OtpInput />);
      // Anything starting `shadow-` that is neither an elevation token nor the
      // arbitrary list would be a colour utility.
      expect(cell(0).className).not.toMatch(/(?:^|\s)shadow-(?!elevation-|\[)/);
    });

    it('removes the UA outline, since the ring replaces it', () => {
      render(<OtpInput />);
      expect(cell(0).className).toContain('outline-none');
    });
  });

  describe('invalid', () => {
    it('applies the error stroke to every cell, filled or not', () => {
      render(<OtpInput length={6} invalid defaultValue="00" />);
      for (const el of cells()) expect(el.className).toContain('inset-ring-error-600');
    });

    it('keeps the error colour at the focused 2px width', () => {
      render(<OtpInput invalid />);
      expect(cell(0).className).toContain('focus:inset-ring-error-600');
    });

    it('beats the filled stroke, so a filled invalid cell is not brand-coloured', () => {
      render(<OtpInput invalid defaultValue="1" />);
      expect(cell(0).className).toContain('inset-ring-error-600');
      expect(cell(0).className).not.toContain('inset-ring-semantic-border-brand-alt');
    });

    it('sets aria-invalid on every cell', () => {
      render(<OtpInput length={6} invalid />);
      for (const el of cells()) expect(el).toHaveAttribute('aria-invalid', 'true');
    });

    it('omits aria-invalid when valid rather than setting it false', () => {
      render(<OtpInput />);
      expect(cell(0)).not.toHaveAttribute('aria-invalid');
    });

    it('recolours the hint row, which is what the icon inherits', () => {
      render(<OtpInput invalid hint="Wrong code." />);
      const hintRow = screen.getByText('Wrong code.').parentElement as HTMLElement;
      expect(hintRow.className).toContain('text-semantic-text-error-primary');
    });
  });

  describe('disabled', () => {
    it('greys the surface and keeps the resting stroke', () => {
      render(<OtpInput disabled defaultValue="0000" />);
      const { className } = cell(0);
      expect(className).toContain('bg-semantic-bg-disabled-subtle');
      expect(className).toContain('inset-ring-semantic-border-primary');
    });

    it('beats invalid, matching the state precedence measured from Figma', () => {
      render(<OtpInput disabled invalid defaultValue="1" />);
      expect(cell(0).className).toContain('bg-semantic-bg-disabled-subtle');
    });

    it('disables every cell and drops the pointer cursor from the row', () => {
      render(<OtpInput length={6} disabled />);
      for (const el of cells()) expect(el).toBeDisabled();
      expect(row().className).not.toContain('cursor-pointer');
    });

    it('offers the pointer cursor when enabled', () => {
      render(<OtpInput />);
      expect(row().className).toContain('cursor-pointer');
    });

    it('does not dim the label — Figma keeps it text-primary', () => {
      render(<OtpInput disabled label="Code" />);
      expect(screen.getByText('Code').className).toContain('text-semantic-text-primary');
    });

    it('takes no input', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<OtpInput disabled onValueChange={onValueChange} />);
      await user.type(cell(0), '1');
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('label and hint', () => {
    it('renders neither when not asked to', () => {
      render(<OtpInput />);
      expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
      expect(document.querySelector('label')).toBeNull();
    });

    it('uses the 14/20/500 label ramp', () => {
      render(<OtpInput label="Code" />);
      const { className } = screen.getByText('Code');
      expect(className).toContain('text-mobile-body-md');
      expect(className).toContain('font-medium');
    });

    it('uses the 12/20/400 hint ramp and quaternary colour when valid', () => {
      render(<OtpInput hint="Hint text." />);
      const hint = screen.getByText('Hint text.');
      expect(hint.className).toContain('text-mobile-body-sm');
      expect((hint.parentElement as HTMLElement).className).toContain(
        'text-semantic-text-quaternary',
      );
    });

    it('sizes the hint icon at 16px and hides it from assistive technology', () => {
      render(<OtpInput hint="Hint text." hintIcon={<svg data-testid="glyph" />} />);
      const box = screen.getByTestId('glyph').parentElement as HTMLElement;
      expect(box.className).toContain('size-semantic-xl');
      expect(box).toHaveAttribute('aria-hidden');
    });

    it('drops the hint icon when there is no hint to lead', () => {
      render(<OtpInput hintIcon={<svg data-testid="glyph" />} />);
      expect(screen.queryByTestId('glyph')).not.toBeInTheDocument();
    });

    it('centres the hint row and gaps it by spacing-xs 4', () => {
      render(<OtpInput hint="Hint text." />);
      const hintRow = screen.getByText('Hint text.').parentElement as HTMLElement;
      expect(hintRow.className).toContain('items-center');
      expect(hintRow.className).toContain('gap-semantic-xs');
    });
  });

  describe('behaviour', () => {
    it('advances a cell as each character is typed', async () => {
      const user = userEvent.setup();
      render(<OtpInput length={4} />);
      await user.click(cell(0));
      await user.keyboard('12');
      expect(cell(0)).toHaveValue('1');
      expect(cell(1)).toHaveValue('2');
      expect(cell(2)).toHaveFocus();
    });

    it('stops advancing at the last cell', async () => {
      const user = userEvent.setup();
      render(<OtpInput length={4} />);
      await user.click(cell(0));
      await user.keyboard('1234');
      expect(cell(3)).toHaveFocus();
      expect(values()).toEqual(['1', '2', '3', '4']);
    });

    it('never grows past the field: typing on in the last cell replaces it', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<OtpInput length={4} onValueChange={onValueChange} />);
      await user.click(cell(0));
      await user.keyboard('12345');
      // Focus clamps to the last cell and its contents are selected, so the fifth
      // character overwrites the fourth rather than being dropped — ordinary text
      // input semantics, and it lets the final digit be corrected without
      // Backspace. The value is still exactly `length` characters.
      expect(onValueChange).toHaveBeenLastCalledWith('1235');
    });

    it('clears the current cell on Backspace when it has a value', async () => {
      const user = userEvent.setup();
      render(<OtpInput defaultValue="12" />);
      await user.click(cell(1));
      await user.keyboard('{Backspace}');
      expect(cell(1)).toHaveValue('');
      expect(cell(1)).toHaveFocus();
    });

    it('clears the previous cell and steps back when the current one is empty', async () => {
      const user = userEvent.setup();
      render(<OtpInput defaultValue="12" />);
      await user.click(cell(2));
      await user.keyboard('{Backspace}');
      expect(cell(1)).toHaveValue('');
      expect(cell(1)).toHaveFocus();
      expect(cell(0)).toHaveValue('1');
    });

    it('does nothing on Backspace in an empty first cell', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<OtpInput onValueChange={onValueChange} />);
      await user.click(cell(0));
      await user.keyboard('{Backspace}');
      expect(onValueChange).not.toHaveBeenCalled();
      expect(cell(0)).toHaveFocus();
    });

    it('navigates with the arrow keys without leaving the group', async () => {
      const user = userEvent.setup();
      render(<OtpInput length={4} />);
      await user.click(cell(2));
      await user.keyboard('{ArrowLeft}');
      expect(cell(1)).toHaveFocus();
      await user.keyboard('{ArrowRight}{ArrowRight}');
      expect(cell(3)).toHaveFocus();
      await user.keyboard('{ArrowRight}');
      expect(cell(3)).toHaveFocus();
    });

    it('jumps to the first and last cell with Home and End', async () => {
      const user = userEvent.setup();
      render(<OtpInput length={6} />);
      await user.click(cell(2));
      await user.keyboard('{Home}');
      expect(cell(0)).toHaveFocus();
      await user.keyboard('{End}');
      expect(cell(5)).toHaveFocus();
    });

    it('distributes a paste across the cells from where it lands', async () => {
      const user = userEvent.setup();
      render(<OtpInput length={6} />);
      await user.click(cell(0));
      await user.paste('123456');
      expect(values()).toEqual(['1', '2', '3', '4', '5', '6']);
      expect(cell(5)).toHaveFocus();
    });

    it('pastes from a middle cell without disturbing what is before it', async () => {
      const user = userEvent.setup();
      render(<OtpInput length={6} defaultValue="12" />);
      await user.click(cell(2));
      await user.paste('34');
      expect(values()).toEqual(['1', '2', '3', '4', '', '']);
    });

    it('truncates a paste longer than the field', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<OtpInput length={4} onValueChange={onValueChange} />);
      await user.click(cell(0));
      await user.paste('123456789');
      expect(onValueChange).toHaveBeenCalledWith('1234');
    });

    it('distributes an autofill that arrives in one cell', async () => {
      const user = userEvent.setup();
      render(<OtpInput length={6} />);
      // What an SMS autofill looks like: the whole code lands on one input.
      await user.click(cell(0));
      await user.paste('987654');
      expect(values()).toEqual(['9', '8', '7', '6', '5', '4']);
    });

    it('selects the cell contents on focus, so typing replaces', async () => {
      const user = userEvent.setup();
      render(<OtpInput defaultValue="12" />);
      await user.click(cell(0));
      await user.keyboard('9');
      expect(cell(0)).toHaveValue('9');
      expect(cell(1)).toHaveValue('2');
    });

    it('fires onComplete once the last cell is filled', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      render(<OtpInput length={4} onComplete={onComplete} />);
      await user.click(cell(0));
      await user.keyboard('123');
      expect(onComplete).not.toHaveBeenCalled();
      await user.keyboard('4');
      expect(onComplete).toHaveBeenCalledExactlyOnceWith('1234');
    });

    it('does not fire onComplete while a gap remains', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      render(<OtpInput length={4} onComplete={onComplete} />);
      await user.click(cell(1));
      await user.paste('234');
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('reports every change', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<OtpInput onValueChange={onValueChange} />);
      await user.click(cell(0));
      await user.keyboard('12');
      expect(onValueChange).toHaveBeenNthCalledWith(1, '1');
      expect(onValueChange).toHaveBeenNthCalledWith(2, '12');
    });
  });

  describe('controlled and uncontrolled', () => {
    it('renders an uncontrolled default value', () => {
      render(<OtpInput defaultValue="1234" />);
      expect(values()).toEqual(['1', '2', '3', '4']);
    });

    it('holds a controlled value against typing until the owner updates it', async () => {
      const user = userEvent.setup();
      render(<OtpInput value="12" onValueChange={() => {}} />);
      await user.click(cell(2));
      await user.keyboard('3');
      expect(cell(2)).toHaveValue('');
    });

    it('clamps a value longer than the field', () => {
      render(<OtpInput length={4} value="123456" onValueChange={() => {}} />);
      expect(values()).toEqual(['1', '2', '3', '4']);
    });
  });

  describe('class overrides', () => {
    it('merges className onto the cell row', () => {
      render(<OtpInput className="mt-semantic-xl" />);
      expect(row().className).toContain('mt-semantic-xl');
    });

    it('reaches each slot through classNames', () => {
      render(
        <OtpInput
          label="Code"
          hint="Hint"
          classNames={{ root: 'r', label: 'l', cells: 'c', cell: 'x', hint: 'h' }}
        />,
      );
      expect(screen.getByText('Code').className).toContain('l');
      expect(screen.getByText('Hint').className).toContain('h');
      expect(row().className).toContain('c');
      expect(cell(0).className).toContain('x');
    });
  });

  it('matches its rendered markup', () => {
    const { container } = render(
      <OtpInput label="Verification code" hint="This is a hint text to help user." length={4} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
