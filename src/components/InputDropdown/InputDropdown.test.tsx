import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InputDropdown, type InputDropdownOption } from './InputDropdown';

const OPTIONS: InputDropdownOption[] = [
  { value: 'phoenix', label: 'Phoenix Baker', supportingText: 'phoenix' },
  { value: 'olivia', label: 'Olivia Rhye', supportingText: 'olivia' },
  { value: 'lana', label: 'Lana Steiner', supportingText: 'lana' },
];

const trigger = () => screen.getByRole('combobox');
const menu = () => screen.getByRole('listbox');
const items = () => screen.getAllByRole('option');
const field = () => trigger();
const root = () => trigger().parentElement?.parentElement as HTMLElement;

function setup(props: Partial<Parameters<typeof InputDropdown>[0]> = {}) {
  return render(
    <InputDropdown
      options={OPTIONS}
      label="Placeholder text"
      hint="This is a hint text to help user."
      chevron={<svg data-testid="chevron" />}
      tick={<svg data-testid="tick" />}
      {...props}
    />,
  );
}

describe('InputDropdown', () => {
  describe('rendering', () => {
    it('renders a combobox that is closed by default', () => {
      setup();
      expect(trigger()).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('shows the placeholder when nothing is selected', () => {
      setup({ placeholder: 'Select Here' });
      expect(screen.getByText('Select Here')).toBeInTheDocument();
    });

    it('shows the selected value and its supporting text once chosen', () => {
      setup({ defaultValue: 'olivia' });
      expect(screen.getByText('Olivia Rhye')).toBeInTheDocument();
      expect(screen.getByText('olivia')).toBeInTheDocument();
    });

    it('associates the label and the hint with the trigger', () => {
      setup();
      expect(trigger()).toHaveAccessibleName('Placeholder text');
      expect(trigger()).toHaveAccessibleDescription('This is a hint text to help user.');
    });

    it('generates an id when none is given, and honours one that is', () => {
      const { unmount } = setup();
      expect(trigger().id).not.toBe('');
      unmount();
      setup({ id: 'custom' });
      expect(trigger().id).toBe('custom');
    });

    it('renders neither label nor hint when not asked to', () => {
      setup({ label: undefined, hint: undefined });
      expect(trigger()).not.toHaveAttribute('aria-labelledby');
      expect(trigger()).not.toHaveAttribute('aria-describedby');
    });

    it('renders the required marker and hides it from assistive technology', () => {
      setup({ required: true });
      const marker = screen.getByText('*');
      expect(marker).toHaveAttribute('aria-hidden');
      expect(trigger()).toHaveAttribute('aria-required', 'true');
    });

    it('hides the chevron from assistive technology', () => {
      setup();
      expect(screen.getByTestId('chevron').parentElement).toHaveAttribute('aria-hidden');
    });

    it('passes native props through to the root', () => {
      setup({ 'data-testid': 'dd' } as Record<string, unknown>);
      expect(screen.getByTestId('dd')).toBeInTheDocument();
    });
  });

  describe('geometry — measured from Figma', () => {
    it('fills its container rather than reproducing the raw 320px canvas width', () => {
      setup();
      expect(root().className).toContain('w-full');
      expect(root().className).not.toContain('320');
    });

    it.each([
      ['desktop', 'px-semantic-xl', 'py-semantic-xl', 'gap-semantic-md'],
      ['mobile', 'px-semantic-lg', 'py-semantic-lg', 'gap-semantic-md'],
    ] as const)('%s applies its measured field padding', (device, px, py, gap) => {
      // Split from the `p-` shorthand because multi-select's vertical padding tracks
      // whether the field holds text or a Tag row; the horizontal stays per device.
      setup({ device });
      expect(field().className).toContain(px);
      expect(field().className).toContain(py);
      expect(field().className).toContain(gap);
    });

    it('never pins a field height — Figma hugs at every variant', () => {
      setup();
      expect(field().className).not.toMatch(/(^|\s)h-/);
      expect(field().className).not.toContain('56px');
      expect(field().className).not.toContain('44px');
    });

    it('uses radius-md at both devices, not the radius-xl Input uses at md', () => {
      const { unmount } = setup({ device: 'desktop' });
      expect(field().className).toContain('rounded-md');
      expect(field().className).not.toContain('rounded-xl');
      unmount();
      setup({ device: 'mobile' });
      expect(field().className).toContain('rounded-md');
    });

    it.each([
      ['desktop', 'gap-semantic-md'],
      ['mobile', 'gap-semantic-xs'],
    ] as const)('%s gaps the field content by its measured value', (device, gap) => {
      setup({ device, defaultValue: 'olivia' });
      const content = screen.getByText('Olivia Rhye').parentElement as HTMLElement;
      expect(content.className).toContain(gap);
    });

    it.each([
      ['desktop', false, 'gap-semantic-md'],
      ['desktop', true, 'gap-semantic-lg'],
      ['mobile', false, 'gap-semantic-xs'],
      ['mobile', true, 'gap-semantic-md'],
    ] as const)('%s root gap with open=%s is %s', (device, open, gap) => {
      setup({ device, defaultOpen: open });
      expect(root().className).toContain(gap);
    });

    it('sizes the chevron 16px at both devices — Figma does not scale it', () => {
      for (const device of ['desktop', 'mobile'] as const) {
        const { unmount } = setup({ device });
        expect(screen.getByTestId('chevron').parentElement?.className).toContain(
          'size-semantic-xl',
        );
        unmount();
      }
    });

    it('gaps the label row by spacing-xxs 2 and the field group by spacing-sm 6', () => {
      setup();
      const labelRow = screen.getByText('Placeholder text').parentElement as HTMLElement;
      const fieldGroup = labelRow.parentElement as HTMLElement;
      expect(labelRow.className).toContain('gap-semantic-xxs');
      expect(fieldGroup.className).toContain('gap-semantic-sm');
    });
  });

  describe('the stroke is an inside ring, not a border', () => {
    it('never uses a CSS border on the field, which would grow the box', () => {
      setup();
      expect(field().className).toContain('inset-ring');
      expect(field().className).not.toMatch(/(^|\s)border(\s|$)/);
    });

    it('thickens to 2px on focus and when open, in brand-alt', () => {
      const { unmount } = setup();
      expect(field().className).toContain('focus:inset-ring-2');
      expect(field().className).toContain('focus:inset-ring-semantic-border-brand-alt');
      unmount();
      setup({ defaultOpen: true });
      expect(field().className).toContain('inset-ring-2');
      expect(field().className).toContain('inset-ring-semantic-border-brand-alt');
    });

    it('uses an inside ring on the menu too — Figma leaves no room for a border box', () => {
      setup({ defaultOpen: true });
      expect(menu().className).toContain('inset-ring-semantic-border-secondary');
      expect(menu().className).not.toMatch(/(^|\s)border(\s|$)/);
    });
  });

  describe('shadow', () => {
    it('carries the elevation-1 shadow on the field in every state', () => {
      setup();
      expect(field().className).toContain('shadow-elevation-1');
    });

    it('gives the menu the two-layer elevation-4 shadow from the foundation', () => {
      setup({ defaultOpen: true });
      expect(menu().className).toContain('shadow-elevation-4');
      // No arbitrary value: the Elevation foundation publishes this exact effect.
      expect(menu().className).not.toContain('shadow-[');
    });

    it('sets no shadow colour utility on the menu, which would repaint both layers', () => {
      // `shadow-<color>` sets --tw-shadow-color, which Tailwind substitutes into
      // every layer of an arbitrary shadow.
      setup({ defaultOpen: true });
      expect(menu().className).not.toContain('shadow-semantic');
    });
  });

  describe('states', () => {
    it('there is no hover state on the field and no error state', () => {
      setup();
      expect(field().className).not.toContain('hover:');
      expect(field().className).not.toContain('error');
    });

    it('Focused and Open paint the same 2px brand stroke', () => {
      setup({ defaultOpen: true });
      // The open branch restates exactly what the focus branch applies.
      expect(field().className).toContain('inset-ring-2');
    });

    it('greys the surface when disabled and keeps the resting stroke', () => {
      setup({ disabled: true });
      expect(field().className).toContain('bg-semantic-bg-disabled-subtle');
      expect(field().className).toContain('inset-ring-semantic-border-primary');
      expect(field()).toBeDisabled();
    });

    it('takes the disabled text colour Figma binds — quaternary, not text-disabled', () => {
      setup({ disabled: true });
      expect(screen.getByText('Select Here').className).toContain('text-semantic-text-quaternary');
    });

    it('does not dim the label when disabled', () => {
      setup({ disabled: true });
      expect(screen.getByText('Placeholder text').className).toContain(
        'text-semantic-text-primary',
      );
    });

    it('cannot be opened while disabled', async () => {
      const user = userEvent.setup();
      setup({ disabled: true });
      await user.click(field());
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('typography', () => {
    it.each([
      ['desktop', 'text-desktop-caption-md'],
      ['mobile', 'text-mobile-body-md'],
    ] as const)('%s label uses its own 14/20/500 ramp', (device, ramp) => {
      setup({ device });
      const label = screen.getByText('Placeholder text');
      expect(label.className).toContain(ramp);
      expect(label.className).toContain('font-medium');
    });

    it.each([
      ['desktop', 'text-desktop-body-sm'],
      ['mobile', 'text-mobile-body-md'],
    ] as const)('%s value is Medium on its own ramp', (device, ramp) => {
      setup({ device, defaultValue: 'olivia' });
      const value = screen.getByText('Olivia Rhye');
      expect(value.className).toContain(ramp);
      expect(value.className).toContain('font-medium');
      expect(value.className).toContain('text-semantic-text-primary');
    });

    it('renders the placeholder Regular in text-placeholder, and it truncates', () => {
      setup();
      const placeholder = screen.getByText('Select Here');
      expect(placeholder.className).toContain('font-normal');
      expect(placeholder.className).toContain('text-semantic-text-placeholder');
      expect(placeholder.className).toContain('truncate');
    });

    it('lets the value hug rather than truncate, matching Figma', () => {
      setup({ defaultValue: 'olivia' });
      expect(screen.getByText('Olivia Rhye').className).toContain('shrink-0');
      expect(screen.getByText('Olivia Rhye').className).not.toContain('truncate');
    });

    it.each([
      ['desktop', 'text-desktop-caption-md'],
      ['mobile', 'text-mobile-body-sm'],
    ] as const)('%s hint uses its own ramp in text-secondary', (device, ramp) => {
      setup({ device });
      const hint = screen.getByText('This is a hint text to help user.');
      expect(hint.className).toContain(ramp);
      expect(hint.className).toContain('text-semantic-text-secondary');
    });

    it('uses text-secondary for the hint, not the text-quaternary Input uses', () => {
      setup();
      expect(screen.getByText('This is a hint text to help user.').className).not.toContain(
        'text-semantic-text-quaternary',
      );
    });
  });

  describe('the menu', () => {
    it('renders one option per entry, in order', () => {
      setup({ defaultOpen: true });
      expect(items()).toHaveLength(3);
      expect(items()[0]).toHaveTextContent('Phoenix Baker');
    });

    it('is a sibling of the field, as Figma places it — not a portal', () => {
      setup({ defaultOpen: true });
      expect(root().contains(menu())).toBe(true);
    });

    it.each([
      ['desktop', 'max-h-80', 'gap-semantic-sm'],
      ['mobile', 'max-h-64', 'gap-semantic-md'],
    ] as const)('%s caps its height and gaps its rows as measured', (device, maxH, gap) => {
      setup({ device, defaultOpen: true });
      expect(menu().className).toContain(maxH);
      expect(menu().className).toContain(gap);
    });

    it('scrolls at both devices rather than clipping as desktop Figma does', () => {
      for (const device of ['desktop', 'mobile'] as const) {
        const { unmount } = setup({ device, defaultOpen: true });
        expect(menu().className).toContain('overflow-y-auto');
        unmount();
      }
    });

    it('pads by spacing-md 8 and rounds to radius-md 8', () => {
      setup({ defaultOpen: true });
      expect(menu().className).toContain('p-semantic-md');
      expect(menu().className).toContain('rounded-md');
    });

    it('hides the hint while open, and shows the placeholder over the value', () => {
      setup({ defaultOpen: true, defaultValue: 'olivia' });
      expect(screen.queryByText('This is a hint text to help user.')).not.toBeInTheDocument();
      expect(screen.getByText('Select Here')).toBeInTheDocument();
      // "Olivia Rhye" is still in the menu, but not in the field.
      expect(field()).not.toHaveTextContent('Olivia Rhye');
    });
  });

  describe('menu item states', () => {
    it.each([
      ['desktop', 'p-semantic-xl', 'rounded-sm'],
      ['mobile', 'p-semantic-lg', 'rounded-md'],
    ] as const)(
      '%s resting row uses its measured padding and radius',
      (device, padding, radius) => {
        setup({ device, defaultOpen: true });
        expect(items()[0]?.className).toContain(padding);
        expect(items()[0]?.className).toContain(radius);
      },
    );

    it('marks the selected row with brand-25 and a tick', () => {
      setup({ defaultOpen: true, defaultValue: 'olivia' });
      const selected = items()[1] as HTMLElement;
      expect(selected.className).toContain('bg-brand-25');
      expect(selected).toHaveAttribute('aria-selected', 'true');
      expect(selected.querySelector('[data-testid="tick"]')).not.toBeNull();
    });

    it('gives the tick 20px at desktop and 16px at mobile', () => {
      const { unmount } = setup({ defaultOpen: true, defaultValue: 'olivia' });
      expect(screen.getByTestId('tick').parentElement?.className).toContain('size-semantic-2xl');
      unmount();
      setup({ device: 'mobile', defaultOpen: true, defaultValue: 'olivia' });
      expect(screen.getByTestId('tick').parentElement?.className).toContain('size-semantic-xl');
    });

    it('shows no tick on unselected rows', () => {
      setup({ defaultOpen: true, defaultValue: 'olivia' });
      expect(items()[0]?.querySelector('[data-testid="tick"]')).toBeNull();
    });

    it('highlights a hovered row with bg-active', async () => {
      const user = userEvent.setup();
      setup({ defaultOpen: true });
      await user.hover(items()[0] as HTMLElement);
      expect(items()[0]?.className).toContain('bg-semantic-bg-active');
    });

    it('changes desktop radius and weight on the highlighted row, reproducing Figma', async () => {
      const user = userEvent.setup();
      setup({ defaultOpen: true });
      await user.hover(items()[0] as HTMLElement);
      expect(items()[0]?.className).toContain('rounded-xl');
      expect(screen.getByText('Phoenix Baker').className).toContain('font-medium');
    });

    it('holds mobile radius and weight constant on the highlighted row', async () => {
      const user = userEvent.setup();
      setup({ device: 'mobile', defaultOpen: true });
      await user.hover(items()[0] as HTMLElement);
      expect(items()[0]?.className).toContain('rounded-md');
      expect(screen.getByText('Phoenix Baker').className).toContain('font-normal');
    });

    it('greys a disabled row and takes its text quaternary', () => {
      setup({
        defaultOpen: true,
        options: OPTIONS.map((o) => (o.value === 'lana' ? { ...o, disabled: true } : o)),
      });
      const disabledItem = items()[2] as HTMLElement;
      expect(disabledItem.className).toContain('bg-semantic-bg-disabled-subtle');
      expect(disabledItem).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByText('Lana Steiner').className).toContain('text-semantic-text-quaternary');
    });

    it('uses the 12/18 ramp for mobile supporting text', () => {
      setup({ device: 'mobile', defaultOpen: true });
      expect(screen.getAllByText('phoenix')[0]?.className).toContain('text-mobile-banner-body-lg');
    });

    it.each([
      ['desktop', 'gap-semantic-md'],
      ['mobile', 'gap-semantic-xs'],
    ] as const)('%s gaps a row label from its supporting text as measured', (device, gap) => {
      setup({ device, defaultOpen: true });
      const textRow = screen.getByText('Phoenix Baker').parentElement as HTMLElement;
      expect(textRow.className).toContain(gap);
    });

    it('fills the row content rather than reproducing the raw 292px width', () => {
      setup({ defaultOpen: true });
      const content = (screen.getByText('Phoenix Baker').parentElement as HTMLElement)
        .parentElement as HTMLElement;
      expect(content.className).toContain('flex-1');
      expect(content.className).not.toContain('292');
    });

    it('implements no checkbox, tag or multi-select row', () => {
      setup({ defaultOpen: true });
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      expect(menu().className).not.toContain('multi');
    });
  });

  describe('open and close', () => {
    it('opens on click and closes on a second click', async () => {
      const user = userEvent.setup();
      setup();
      await user.click(field());
      expect(menu()).toBeInTheDocument();
      await user.click(field());
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes on a click outside', async () => {
      const user = userEvent.setup();
      setup();
      await user.click(field());
      await user.click(document.body);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('stays open on a click inside the menu that is not an option', async () => {
      const user = userEvent.setup();
      setup({ defaultOpen: true });
      await user.click(menu());
      expect(menu()).toBeInTheDocument();
    });

    it('reports open changes and honours a controlled open prop', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      setup({ open: false, onOpenChange });
      await user.click(field());
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('keyboard', () => {
    it('opens on ArrowDown and highlights the first option', async () => {
      const user = userEvent.setup();
      setup();
      field().focus();
      await user.keyboard('{ArrowDown}');
      expect(menu()).toBeInTheDocument();
      expect(field()).toHaveAttribute('aria-activedescendant', items()[0]?.id);
    });

    it('opens on ArrowUp and highlights the last option', async () => {
      const user = userEvent.setup();
      setup();
      field().focus();
      await user.keyboard('{ArrowUp}');
      expect(field()).toHaveAttribute('aria-activedescendant', items()[2]?.id);
    });

    it('opens on Enter and on Space', async () => {
      const user = userEvent.setup();
      const { unmount } = setup();
      field().focus();
      await user.keyboard('{Enter}');
      expect(menu()).toBeInTheDocument();
      unmount();
      setup();
      field().focus();
      await user.keyboard(' ');
      expect(menu()).toBeInTheDocument();
    });

    it('moves down and up without leaving the list', async () => {
      const user = userEvent.setup();
      setup({ defaultOpen: true });
      field().focus();
      await user.keyboard('{ArrowDown}');
      expect(field()).toHaveAttribute('aria-activedescendant', items()[0]?.id);
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
      expect(field()).toHaveAttribute('aria-activedescendant', items()[2]?.id);
      await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
      expect(field()).toHaveAttribute('aria-activedescendant', items()[0]?.id);
    });

    it('jumps with Home and End', async () => {
      const user = userEvent.setup();
      setup({ defaultOpen: true });
      field().focus();
      await user.keyboard('{End}');
      expect(field()).toHaveAttribute('aria-activedescendant', items()[2]?.id);
      await user.keyboard('{Home}');
      expect(field()).toHaveAttribute('aria-activedescendant', items()[0]?.id);
    });

    it('selects with Enter and closes', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ onValueChange });
      field().focus();
      await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
      expect(onValueChange).toHaveBeenCalledWith('olivia');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes on Escape and returns focus to the trigger', async () => {
      const user = userEvent.setup();
      setup({ defaultOpen: true });
      field().focus();
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(field()).toHaveFocus();
    });

    it('closes on Tab without swallowing the focus move', async () => {
      const user = userEvent.setup();
      setup({ defaultOpen: true });
      field().focus();
      await user.keyboard('{Tab}');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('skips disabled options when navigating', async () => {
      const user = userEvent.setup();
      setup({
        defaultOpen: true,
        options: OPTIONS.map((o) => (o.value === 'olivia' ? { ...o, disabled: true } : o)),
      });
      field().focus();
      await user.keyboard('{ArrowDown}{ArrowDown}');
      expect(field()).toHaveAttribute('aria-activedescendant', items()[2]?.id);
    });

    it('will not select a disabled option', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({
        defaultOpen: true,
        onValueChange,
        options: OPTIONS.map((o) => (o.value === 'lana' ? { ...o, disabled: true } : o)),
      });
      await user.click(items()[2] as HTMLElement);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('jumps to a matching option as you type', async () => {
      const user = userEvent.setup();
      setup({ defaultOpen: true });
      field().focus();
      await user.keyboard('lan');
      expect(field()).toHaveAttribute('aria-activedescendant', items()[2]?.id);
    });

    it('opens on a typeahead keystroke when closed', async () => {
      const user = userEvent.setup();
      setup();
      field().focus();
      await user.keyboard('o');
      expect(menu()).toBeInTheDocument();
      expect(field()).toHaveAttribute('aria-activedescendant', items()[1]?.id);
    });
  });

  describe('selection', () => {
    it('selects on click and reports the value', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ onValueChange });
      await user.click(field());
      await user.click(items()[1] as HTMLElement);
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('olivia');
      expect(field()).toHaveTextContent('Olivia Rhye');
    });

    it('renders an uncontrolled default selection', () => {
      setup({ defaultValue: 'lana' });
      expect(field()).toHaveTextContent('Lana Steiner');
    });

    it('holds a controlled value until the owner updates it', async () => {
      const user = userEvent.setup();
      setup({ value: 'olivia', onValueChange: () => {} });
      await user.click(field());
      await user.click(items()[0] as HTMLElement);
      expect(field()).toHaveTextContent('Olivia Rhye');
    });

    it('marks only the selected option as selected', () => {
      setup({ defaultOpen: true, defaultValue: 'olivia' });
      expect(items().map((el) => el.getAttribute('aria-selected'))).toEqual([
        'false',
        'true',
        'false',
      ]);
    });
  });

  describe('class overrides', () => {
    it('merges className onto the field', () => {
      setup({ className: 'mt-semantic-xl' });
      expect(field().className).toContain('mt-semantic-xl');
    });

    it('reaches each slot through classNames', () => {
      setup({
        defaultOpen: true,
        defaultValue: 'olivia',
        classNames: { root: 'r', label: 'l', field: 'f', value: 'v', menu: 'm', menuItem: 'i' },
      });
      expect(root().className).toContain('r');
      expect(screen.getByText('Placeholder text').className).toContain('l');
      expect(field().className).toContain('f');
      expect(screen.getByText('Select Here').className).toContain('v');
      expect(menu().className).toContain('m');
      expect(items()[0]?.className).toContain('i');
    });
  });

  it('matches its rendered markup', () => {
    const { container } = setup({ defaultValue: 'olivia' });
    expect(container.firstChild).toMatchSnapshot();
  });

  /* ------------------------------------------------------------------ */
  /* type="multiSelect" — Figma's other 10 variants                     */
  /* ------------------------------------------------------------------ */

  describe('multi select', () => {
    const multi = (props: Partial<Parameters<typeof InputDropdown>[0]> = {}) =>
      setup({ type: 'multiSelect', tagCloseIcon: <svg data-testid="x" />, ...props });
    // Scoped to the field: the same labels appear on the menu rows when open.
    const tags = () => within(field()).queryAllByText(/Baker|Rhye|Steiner/);
    const tagRow = () => document.querySelector('.tags-row') as HTMLElement;
    const removeButtons = () => screen.queryAllByRole('button', { name: /^Remove / });

    describe('element', () => {
      it('is not a <button>, so the Tag close buttons are valid HTML', () => {
        // A button inside a button is invalid and browsers recover by breaking the
        // nesting, which would stop the close working. role=combobox on a div is the
        // ARIA pattern for this control anyway.
        multi({ defaultValues: ['olivia'] });
        expect(trigger().tagName).toBe('DIV');
        expect(trigger()).toHaveAttribute('role', 'combobox');
        expect(trigger()).toHaveAttribute('tabindex', '0');
      });

      it('keeps the Default type a real <button>', () => {
        setup();
        expect(trigger().tagName).toBe('BUTTON');
      });

      it('announces the listbox as multi-selectable', async () => {
        const user = userEvent.setup();
        multi();
        await user.click(trigger());
        expect(menu()).toHaveAttribute('aria-multiselectable', 'true');
      });

      it('leaves the Default listbox single-select', async () => {
        const user = userEvent.setup();
        setup();
        await user.click(trigger());
        expect(menu()).not.toHaveAttribute('aria-multiselectable');
      });
    });

    describe('Tags in the field', () => {
      it('renders one Tag per selected value', () => {
        multi({ defaultValues: ['olivia', 'lana'] });
        expect(tags().map((t) => t.textContent)).toEqual(['Olivia Rhye', 'Lana Steiner']);
      });

      it('shows the placeholder only when nothing is selected', () => {
        multi({ placeholder: 'Select Here' });
        expect(screen.getByText('Select Here')).toBeInTheDocument();
        expect(tags()).toHaveLength(0);
      });

      it('keeps the Tags visible while open — Figma swaps them for the placeholder', async () => {
        const user = userEvent.setup();
        multi({ defaultValues: ['olivia'], placeholder: 'Select Here' });
        await user.click(trigger());
        expect(tags()).toHaveLength(1);
        expect(screen.queryByText('Select Here')).not.toBeInTheDocument();
      });

      it('keeps the Tags visible when disabled — same Figma inconsistency', () => {
        multi({ defaultValues: ['olivia'], disabled: true, placeholder: 'Select Here' });
        expect(tags()).toHaveLength(1);
        expect(screen.queryByText('Select Here')).not.toBeInTheDocument();
      });

      it.each([
        ['desktop', 'gap-semantic-lg'],
        ['mobile', 'gap-semantic-md'],
      ] as const)('sets the %s Tag row gap from Figma', (device, gap) => {
        multi({ device, defaultValues: ['olivia'], classNames: { tags: 'tags-row' } });
        expect(tagRow().className).toContain(gap);
      });

      it('lets the Tag row keep its width so the field clips, as Figma draws it', () => {
        multi({ defaultValues: ['olivia'], classNames: { tags: 'tags-row' } });
        expect(tagRow().className).toContain('shrink-0');
        expect(field().className).toContain('overflow-clip');
      });
    });

    describe('field padding tracks what the field holds', () => {
      it.each([
        ['desktop', 'py-[14px]', 'px-semantic-xl'],
        ['mobile', 'py-[10px]', 'px-semantic-lg'],
      ] as const)('%s with Tags uses the measured padding', (device, py, px) => {
        multi({ device, defaultValues: ['olivia'] });
        expect(field().className).toContain(py);
        expect(field().className).toContain(px);
      });

      it.each([
        ['desktop', 'py-semantic-xl'],
        ['mobile', 'py-semantic-lg'],
      ] as const)('%s with the placeholder falls back to the text padding', (device, py) => {
        multi({ device });
        expect(field().className).toContain(py);
      });
    });

    describe('Checkbox in the menu', () => {
      it('renders a Checkbox per row instead of a tick', async () => {
        const user = userEvent.setup();
        multi();
        await user.click(trigger());
        expect(screen.getAllByRole('checkbox', { hidden: true })).toHaveLength(OPTIONS.length);
        expect(screen.queryByTestId('tick')).not.toBeInTheDocument();
      });

      it('keeps the tick for the Default type', async () => {
        const user = userEvent.setup();
        setup({ defaultValue: 'olivia' });
        await user.click(trigger());
        expect(screen.getByTestId('tick')).toBeInTheDocument();
        expect(screen.queryAllByRole('checkbox', { hidden: true })).toHaveLength(0);
      });

      it.each([
        ['desktop', 'size-semantic-2xl'],
        ['mobile', 'size-semantic-xl'],
      ] as const)('sizes the %s Checkbox as Figma instances it', async (device, size) => {
        const user = userEvent.setup();
        multi({ device });
        await user.click(trigger());
        const box = screen.getAllByRole('checkbox', { hidden: true })[0]
          ?.nextElementSibling as HTMLElement;
        expect(box.className).toContain(size);
      });

      it.each([
        ['desktop', 'gap-semantic-lg'],
        ['mobile', 'gap-semantic-md'],
      ] as const)('sets the %s row gap between Checkbox and text', async (device, gap) => {
        const user = userEvent.setup();
        multi({ device });
        await user.click(trigger());
        const content = screen.getAllByRole('checkbox', { hidden: true })[0]?.closest('label')
          ?.parentElement as HTMLElement;
        expect(content.className).toContain(gap);
      });

      it('is not a second tab stop or a second thing to activate', async () => {
        const user = userEvent.setup();
        multi();
        await user.click(trigger());
        for (const box of screen.getAllByRole('checkbox', { hidden: true })) {
          expect(box).toHaveAttribute('tabindex', '-1');
          expect(box).toHaveAttribute('aria-hidden', 'true');
        }
      });
    });

    describe('row selection — one source of truth', () => {
      it('checks the box and marks the row for the same value', async () => {
        const user = userEvent.setup();
        multi({ defaultValues: ['olivia'] });
        await user.click(trigger());
        const rows = items();
        const boxes = screen.getAllByRole('checkbox', { hidden: true }) as HTMLInputElement[];
        // Figma publishes row highlight and checkbox state independently; we do not.
        expect(rows[1]).toHaveAttribute('aria-selected', 'true');
        expect(boxes[1]).toBeChecked();
        expect(rows[0]).toHaveAttribute('aria-selected', 'false');
        expect(boxes[0]).not.toBeChecked();
      });

      it('toggles a value on and off', async () => {
        const user = userEvent.setup();
        const onValuesChange = vi.fn();
        multi({ onValuesChange });
        await user.click(trigger());
        await user.click(items()[0]!);
        expect(onValuesChange).toHaveBeenLastCalledWith(['phoenix']);
        await user.click(items()[0]!);
        expect(onValuesChange).toHaveBeenLastCalledWith([]);
      });

      it('accumulates rather than replacing', async () => {
        const user = userEvent.setup();
        const onValuesChange = vi.fn();
        multi({ onValuesChange });
        await user.click(trigger());
        await user.click(items()[0]!);
        await user.click(items()[2]!);
        expect(onValuesChange).toHaveBeenLastCalledWith(['phoenix', 'lana']);
      });

      it('stays open on pick — ours, since Figma draws no close', async () => {
        const user = userEvent.setup();
        multi();
        await user.click(trigger());
        await user.click(items()[0]!);
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      it('does not move itself when controlled', async () => {
        const user = userEvent.setup();
        const onValuesChange = vi.fn();
        multi({ values: [], onValuesChange });
        await user.click(trigger());
        await user.click(items()[0]!);
        expect(onValuesChange).toHaveBeenCalledWith(['phoenix']);
        expect(tags()).toHaveLength(0);
      });

      it('ignores a disabled row', async () => {
        const user = userEvent.setup();
        const onValuesChange = vi.fn();
        multi({
          options: [...OPTIONS, { value: 'x', label: 'Nope', disabled: true }],
          onValuesChange,
        });
        await user.click(trigger());
        await user.click(items()[3]!);
        expect(onValuesChange).not.toHaveBeenCalled();
      });
    });

    describe('Tag removal', () => {
      it('removes the value and the Tag', async () => {
        const user = userEvent.setup();
        multi({ defaultValues: ['olivia', 'lana'] });
        await user.click(screen.getByRole('button', { name: 'Remove Olivia Rhye' }));
        expect(tags().map((t) => t.textContent)).toEqual(['Lana Steiner']);
      });

      it('reports the remaining values', async () => {
        const user = userEvent.setup();
        const onValuesChange = vi.fn();
        multi({ defaultValues: ['olivia', 'lana'], onValuesChange });
        await user.click(screen.getByRole('button', { name: 'Remove Lana Steiner' }));
        expect(onValuesChange).toHaveBeenCalledWith(['olivia']);
      });

      it('unchecks the matching row — the same source of truth', async () => {
        const user = userEvent.setup();
        multi({ defaultValues: ['olivia'] });
        await user.click(trigger());
        expect(
          (screen.getAllByRole('checkbox', { hidden: true })[1] as HTMLInputElement).checked,
        ).toBe(true);
        await user.click(screen.getByRole('button', { name: 'Remove Olivia Rhye' }));
        expect(
          (screen.getAllByRole('checkbox', { hidden: true })[1] as HTMLInputElement).checked,
        ).toBe(false);
      });

      it('disables removal when the field is disabled', () => {
        multi({ defaultValues: ['olivia'], disabled: true });
        expect(removeButtons()[0]).toBeDisabled();
      });
    });

    describe('the two APIs stay apart', () => {
      it('ignores value/onValueChange in multi select', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        const onValuesChange = vi.fn();
        multi({ onValueChange, onValuesChange });
        await user.click(trigger());
        await user.click(items()[0]!);
        expect(onValueChange).not.toHaveBeenCalled();
        expect(onValuesChange).toHaveBeenCalledWith(['phoenix']);
      });

      it('ignores values/onValuesChange in the Default type', async () => {
        const user = userEvent.setup();
        const onValueChange = vi.fn();
        const onValuesChange = vi.fn();
        setup({ onValueChange, onValuesChange, defaultValues: ['olivia'] });
        await user.click(trigger());
        await user.click(items()[0]!);
        expect(onValuesChange).not.toHaveBeenCalled();
        expect(onValueChange).toHaveBeenCalledWith('phoenix');
      });

      it('spreads cleanly, which a discriminated union would not', () => {
        // The reason for parallel props: `{...props}` is how wrappers, Storybook args
        // and HOCs pass things through.
        const props: Partial<Parameters<typeof InputDropdown>[0]> = {
          type: 'multiSelect',
          defaultValues: ['olivia'],
        };
        expect(() => multi({ ...props })).not.toThrow();
      });
    });

    it('matches its rendered markup', () => {
      const { container } = multi({ defaultValues: ['olivia', 'lana'] });
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
