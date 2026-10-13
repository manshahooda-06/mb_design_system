import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toggle, type ToggleSize, type ToggleVariant } from './Toggle';

const VARIANTS: ToggleVariant[] = ['default', 'slim'];
const SIZES: ToggleSize[] = ['sm', 'md'];

const track = () => screen.getByRole('switch');
/** The thumb is the track's only child and is deliberately unlabelled. */
const thumb = () => track().firstElementChild as HTMLElement;

function setup(props: Partial<Parameters<typeof Toggle>[0]> = {}) {
  return render(<Toggle {...props} />);
}

/** Every rendered geometry combination — Figma's 64 minus the four CSS states. */
const CELLS = VARIANTS.flatMap((variant) =>
  SIZES.flatMap((size) =>
    [false, true].flatMap((checked) =>
      [false, true].map((disabled) => ({ variant, size, checked, disabled })),
    ),
  ),
);

/** Renders one cell in isolation and hands back the track and thumb classes. */
function classesFor(props: Partial<Parameters<typeof Toggle>[0]>) {
  const { container, unmount } = render(<Toggle {...props} />);
  const root = container.firstElementChild as HTMLElement;
  const trackEl = (root.getAttribute('role') === 'switch' ? root : root.firstElementChild)!;
  const result = {
    track: trackEl.className,
    thumb: (trackEl.firstElementChild as HTMLElement).className,
    container,
  };
  unmount();
  return result;
}

describe('Toggle', () => {
  describe('element and semantics', () => {
    it('is a switch, not a checkbox — and a button, not an input', () => {
      setup();
      expect(track().tagName).toBe('BUTTON');
      expect(track()).toHaveAttribute('role', 'switch');
      expect(track()).toHaveAttribute('type', 'button');
    });

    it('does not participate in form submission — nothing in Figma implies it does', () => {
      const { container } = setup({ label: 'Remember me' });
      expect(container.querySelector('input')).toBeNull();
    });

    it('reports its state through aria-checked', () => {
      const { rerender } = setup({ checked: false });
      expect(track()).toHaveAttribute('aria-checked', 'false');
      rerender(<Toggle checked />);
      expect(track()).toHaveAttribute('aria-checked', 'true');
    });

    it('is the component root when there is no label', () => {
      const { container } = setup();
      expect(container.firstElementChild).toBe(track());
    });

    it('sits inside a row once a label is present', () => {
      const { container } = setup({ label: 'Remember me' });
      expect(container.firstElementChild?.tagName).toBe('DIV');
      expect(track().parentElement).toBe(container.firstElementChild);
    });

    it('passes native props through to the control', () => {
      setup({ id: 'notify' });
      expect(track().id).toBe('notify');
    });

    it('hides the thumb from assistive technology by giving it no role or name', () => {
      setup();
      expect(thumb().tagName).toBe('SPAN');
      expect(thumb()).not.toHaveAttribute('role');
      expect(thumb().textContent).toBe('');
    });
  });

  describe('labelling', () => {
    it('names the switch from the label rather than duplicating it', () => {
      setup({ label: 'Remember me' });
      expect(screen.getByRole('switch', { name: 'Remember me' })).toBe(track());
    });

    it('describes the switch with the supporting text', () => {
      setup({ label: 'Remember me', supportingText: 'Save my login details.' });
      const describedBy = track().getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy!)?.textContent).toBe('Save my login details.');
    });

    it('draws no supporting text without a label — Figma publishes no such variant', () => {
      setup({ supportingText: 'Orphaned' });
      expect(screen.queryByText('Orphaned')).not.toBeInTheDocument();
      expect(track()).not.toHaveAttribute('aria-describedby');
    });

    it('omits aria-describedby when there is no supporting text', () => {
      setup({ label: 'Remember me' });
      expect(track()).not.toHaveAttribute('aria-describedby');
    });

    it('gives concurrent instances distinct ids', () => {
      render(
        <>
          <Toggle label="First" supportingText="One" />
          <Toggle label="Second" supportingText="Two" />
        </>,
      );
      const [a, b] = screen.getAllByRole('switch');
      expect(a?.getAttribute('aria-labelledby')).not.toBe(b?.getAttribute('aria-labelledby'));
      expect(a?.getAttribute('aria-describedby')).not.toBe(b?.getAttribute('aria-describedby'));
    });
  });

  describe('track geometry — content box is two thumbs wide by one thumb tall', () => {
    it('uses a content box so padding lands outside the measured rail', () => {
      // Without box-content the 2px padding would eat into the rail and the total
      // would be 32x16 instead of Figma's 36x20.
      setup();
      expect(track().className).toContain('box-content');
    });

    it.each(SIZES)('sizes the %s rail from semantic spacing, never a raw length', (size) => {
      const { track: cls } = classesFor({ size });
      const expected =
        size === 'sm' ? ['h-semantic-xl', 'w-semantic-4xl'] : ['h-semantic-2xl', 'w-semantic-5xl'];
      for (const c of expected) expect(cls).toContain(c);
    });

    it('pads default by spacing-xxs and slim by nothing', () => {
      expect(classesFor({ variant: 'default' }).track).toContain('p-semantic-xxs');
      expect(classesFor({ variant: 'slim' }).track).toContain('p-semantic-none');
    });

    it('never pins a width or height with an arbitrary value', () => {
      for (const cell of CELLS) {
        expect(classesFor(cell).track, JSON.stringify(cell)).not.toMatch(/\b[whp]-\[/);
      }
    });

    it('is a pill at every size', () => {
      for (const size of SIZES) expect(classesFor({ size }).track).toContain('rounded-full');
    });
  });

  describe('thumb geometry — travel equals diameter', () => {
    it.each(SIZES)('sizes the %s thumb from one semantic token', (size) => {
      expect(classesFor({ size }).thumb).toContain(
        size === 'sm' ? 'size-semantic-xl' : 'size-semantic-2xl',
      );
    });

    it('moves by 100% of its own width, which is exactly Figma travel', () => {
      // Figma travel is 16 at sm and 20 at md — the thumb diameter in both
      // variants — so a percentage translate needs no size axis at all.
      expect(classesFor({ checked: true }).thumb).toContain('translate-x-full');
    });

    it('rests at zero when off', () => {
      expect(classesFor({ checked: false }).thumb).toContain('translate-x-0');
    });

    it('still moves when disabled, even though the colours do not', () => {
      expect(classesFor({ checked: true, disabled: true }).thumb).toContain('translate-x-full');
    });

    it('never translates by an arbitrary length', () => {
      for (const cell of CELLS) {
        expect(classesFor(cell).thumb, JSON.stringify(cell)).not.toMatch(/translate-x-\[/);
      }
    });

    it('is a circle at every size', () => {
      expect(classesFor({}).thumb).toContain('rounded-full');
    });
  });

  describe('colour', () => {
    it('fills the track with brand when on and tertiary when off', () => {
      expect(classesFor({ checked: true }).track).toContain('bg-semantic-bg-brand-solid');
      expect(classesFor({ checked: false }).track).toContain('bg-semantic-bg-tertiary');
    });

    it('keeps the thumb on the primary surface when enabled', () => {
      expect(classesFor({}).thumb).toContain('bg-semantic-bg-primary');
    });

    it('reads different tokens for off and disabled even though both are gray/100 today', () => {
      // Value coincidence is not meaning. If Figma ever separates them this is
      // already correct, which is how action-surface.ts treats its hover tokens.
      expect(classesFor({ disabled: false }).track).toContain('bg-semantic-bg-tertiary');
      expect(classesFor({ disabled: true }).track).toContain('bg-semantic-bg-disabled');
    });
  });

  describe('hover is a no-op when off — measured, not assumed', () => {
    it('darkens the track on hover only when on', () => {
      expect(classesFor({ checked: true }).track).toContain(
        'hover:bg-semantic-bg-brand-solid-hover',
      );
    });

    it('declares no hover fill at all when off', () => {
      // Figma's State=Hover is byte-identical to State=Default for every
      // Pressed=False variant; the only difference in the file is a cursor hint.
      expect(classesFor({ checked: false }).track).not.toMatch(/hover:bg-semantic-bg-brand/);
    });

    it('does not hover to brand when disabled, on or off', () => {
      for (const checked of [false, true]) {
        const { track: cls } = classesFor({ checked, disabled: true });
        expect(cls).not.toMatch(/hover:bg-semantic-bg-brand/);
        expect(cls).toContain('hover:bg-semantic-bg-disabled');
      }
    });
  });

  describe('disabled collapses the checked axis — measured', () => {
    it.each(VARIANTS)('paints %s identically whether on or off', (variant) => {
      // Every Pressed=True/Disabled variant is byte-identical to its Pressed=False
      // counterpart in Figma. Only the thumb's position still follows checked.
      const strip = (cls: string) => cls.replace(/translate-x-\S+/g, '').trim();
      const off = classesFor({ variant, disabled: true, checked: false });
      const on = classesFor({ variant, disabled: true, checked: true });
      expect(strip(off.track)).toBe(strip(on.track));
      expect(strip(off.thumb)).toBe(strip(on.thumb));
      expect(off.thumb).not.toBe(on.thumb); // the transform still differs
    });

    it('greys the thumb through the token Figma names for it', () => {
      expect(classesFor({ disabled: true }).thumb).toContain(
        'bg-semantic-toggle-button-fg-disabled',
      );
    });

    it('disables the button element, so it is unreachable by pointer and keyboard', () => {
      setup({ disabled: true });
      expect(track()).toBeDisabled();
    });

    it('does not dim the label or supporting text — Figma leaves both untouched', () => {
      setup({ label: 'Remember me', supportingText: 'Save my login details.', disabled: true });
      expect(screen.getByText('Remember me').className).toContain('text-semantic-text-primary');
      expect(screen.getByText('Save my login details.').className).toContain(
        'text-semantic-text-secondary',
      );
    });
  });

  describe('slim strokes', () => {
    it('gives the default variant no stroke anywhere', () => {
      const { track: t, thumb: th } = classesFor({ variant: 'default' });
      expect(t).not.toContain('inset-ring');
      expect(th).not.toContain('inset-ring');
    });

    it('strokes the slim track when off and drops it when on', () => {
      expect(classesFor({ variant: 'slim', checked: false }).track).toContain(
        'inset-ring-semantic-border-secondary',
      );
      expect(classesFor({ variant: 'slim', checked: true }).track).toContain(
        'inset-ring-transparent',
      );
    });

    it('uses an inside ring, not a border — a border would break the content box', () => {
      // Under box-content a CSS border is laid out outside the content box just as
      // padding is, so 1px of border would make slim 34x18 instead of 32x16.
      const { track: cls } = classesFor({ variant: 'slim' });
      expect(cls).toContain('inset-ring');
      expect(cls).not.toMatch(/(^|\s)border(\s|$)/);
    });

    it('ramps the slim thumb stroke through the toggle-specific tokens', () => {
      expect(classesFor({ variant: 'slim', checked: false }).thumb).toContain(
        'inset-ring-semantic-toggle-border',
      );
      const on = classesFor({ variant: 'slim', checked: true }).thumb;
      expect(on).toContain('inset-ring-semantic-toggle-slim-border-pressed');
      expect(on).toContain(
        'group-hover/toggle:inset-ring-semantic-toggle-slim-border-pressed-hover',
      );
    });

    it('returns the slim thumb stroke to grey when disabled, on or off', () => {
      for (const checked of [false, true]) {
        const { thumb: cls } = classesFor({ variant: 'slim', checked, disabled: true });
        expect(cls).toContain('inset-ring-semantic-toggle-border');
        expect(cls).not.toContain('slim-border-pressed');
      }
    });

    it('scopes the thumb hover to the track, since the thumb is not what is hovered', () => {
      expect(classesFor({ variant: 'slim' }).track).toContain('group/toggle');
    });
  });

  describe('elevation', () => {
    it('puts elevation-1 on the thumb in every state', () => {
      for (const cell of CELLS) {
        expect(classesFor(cell).thumb, JSON.stringify(cell)).toContain('shadow-elevation-1');
      }
    });

    it('casts no shadow from the track — Figma binds no effect to it', () => {
      expect(classesFor({}).track).not.toContain('shadow-elevation');
    });

    it('reproduces no UUI shadow, in either variant', () => {
      // Figma still binds uui-shadows here (shadow-sm under default, shadow-xs
      // under slim). Elevation is the only shadow foundation, so that is a Figma
      // inconsistency rather than something for this component to reproduce.
      for (const variant of VARIANTS) {
        const { thumb: cls } = classesFor({ variant });
        expect(cls).not.toMatch(/shadow-(xs|sm|semantic-shadow)/);
        expect(cls).not.toMatch(/shadow-\[/);
      }
    });

    it('does not vary the shadow by variant, unlike Figma', () => {
      // Recorded rather than hidden: Figma draws default with shadow-sm and slim
      // with shadow-xs, 3.8x apart. elevation-1 is the library's only control
      // shadow, so the Type axis no longer differs by shadow.
      const shadowOf = (variant: ToggleVariant) =>
        classesFor({ variant }).thumb.match(/shadow-\S+/)?.[0];
      expect(shadowOf('default')).toBe(shadowOf('slim'));
    });
  });

  describe('focus', () => {
    it('carries the shared focus ring rather than a bespoke one', () => {
      const { className } = (setup(), track());
      expect(className).toContain('focus-visible:ring-2');
      expect(className).toContain('focus-visible:ring-semantic-focus-ring');
      expect(className).toContain('focus-visible:ring-offset-2');
      expect(className).toContain('focus-visible:ring-offset-semantic-bg-primary');
    });

    it('removes the native outline only alongside a replacement', () => {
      setup();
      expect(track().className).toContain('outline-none');
      expect(track().className).toContain('focus-visible:ring-2');
    });

    it('keeps the ring on the track, where Figma draws it', () => {
      expect(classesFor({}).thumb).not.toContain('ring-semantic-focus-ring');
    });
  });

  describe('behaviour', () => {
    it('toggles when uncontrolled', async () => {
      const user = userEvent.setup();
      setup({ defaultChecked: false });
      await user.click(track());
      expect(track()).toHaveAttribute('aria-checked', 'true');
      await user.click(track());
      expect(track()).toHaveAttribute('aria-checked', 'false');
    });

    it('honours defaultChecked', () => {
      setup({ defaultChecked: true });
      expect(track()).toHaveAttribute('aria-checked', 'true');
    });

    it('does not move itself when controlled', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      setup({ checked: false, onCheckedChange });
      await user.click(track());
      expect(onCheckedChange).toHaveBeenCalledWith(true);
      // The parent owns the value; without a rerender it must not have moved.
      expect(track()).toHaveAttribute('aria-checked', 'false');
    });

    it('reports the next value, not the current one', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      setup({ defaultChecked: true, onCheckedChange });
      await user.click(track());
      expect(onCheckedChange).toHaveBeenCalledWith(false);
    });

    it('is operable by keyboard', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      setup({ onCheckedChange });
      await user.tab();
      expect(track()).toHaveFocus();
      await user.keyboard(' ');
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('does not toggle when disabled', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      setup({ disabled: true, onCheckedChange });
      await user.click(track());
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(track()).toHaveAttribute('aria-checked', 'false');
    });

    it('is skipped by the tab sequence when disabled', async () => {
      const user = userEvent.setup();
      setup({ disabled: true });
      await user.tab();
      expect(track()).not.toHaveFocus();
    });
  });

  describe('layout', () => {
    it('aligns the control to the top of the text, not its centre', () => {
      // Figma pins the base at y=0 in a 50-tall md row; centring would drop it 13px.
      setup({ label: 'Remember me', supportingText: 'Two lines.' });
      const root = track().parentElement as HTMLElement;
      expect(root.className).toContain('items-start');
      expect(root.className).not.toContain('items-center');
    });

    it.each(SIZES)('sets the %s row gap from Figma', (size) => {
      setup({ size, label: 'Remember me' });
      const root = track().parentElement as HTMLElement;
      expect(root.className).toContain(size === 'sm' ? 'gap-semantic-md' : 'gap-semantic-lg');
    });

    it.each(SIZES)('sets the %s label gap from Figma — 0 at sm, 2 at md', (size) => {
      setup({ size, label: 'Remember me', supportingText: 'Support.' });
      const text = screen.getByText('Remember me').parentElement as HTMLElement;
      expect(text.className).toContain(size === 'sm' ? 'gap-semantic-none' : 'gap-semantic-xxs');
    });

    it('lets the text block flex and wrap rather than pinning 344px', () => {
      setup({ label: 'Remember me' });
      const text = screen.getByText('Remember me').parentElement as HTMLElement;
      expect(text.className).toContain('flex-1');
      expect(text.className).toContain('min-w-semantic-none');
      expect(screen.getByText('Remember me').className).toContain('break-words');
    });

    it('keeps the control from shrinking when the label is long', () => {
      setup({ label: 'A'.repeat(200) });
      expect(track().className).toContain('shrink-0');
    });

    it('fills its container rather than pinning the authored canvas width', () => {
      setup({ label: 'Remember me' });
      const root = track().parentElement as HTMLElement;
      expect(root.className).toContain('w-full');
      expect(root.className).not.toMatch(/w-\[344px\]/);
    });
  });

  describe('typography', () => {
    it.each(SIZES)('sets the %s type from one token per line', (size) => {
      setup({ size, label: 'Remember me', supportingText: 'Support.' });
      const expected = size === 'sm' ? 'text-mobile-body-md' : 'text-desktop-body-sm';
      expect(screen.getByText('Remember me').className).toContain(expected);
      expect(screen.getByText('Support.').className).toContain(expected);
    });

    it('crosses the type scales exactly as Figma does', () => {
      // sm binds Figma's Mobile ramp and md its Desktop ramp. The names look
      // mismatched and are correct — Group/Mobile/Body-md and Group/Desktop/Body-sm.
      setup({ size: 'sm', label: 'Small' });
      expect(screen.getByText('Small').className).toContain('mobile');
      setup({ size: 'md', label: 'Medium' });
      expect(screen.getByText('Medium').className).toContain('desktop');
    });

    it('weights the label at 500 and the supporting line at 400', () => {
      setup({ label: 'Remember me', supportingText: 'Support.' });
      expect(screen.getByText('Remember me').className).toContain('font-medium');
      expect(screen.getByText('Support.').className).toContain('font-regular');
    });

    it('sets no font family — the page surface owns it', () => {
      setup({ label: 'Remember me' });
      expect(screen.getByText('Remember me').className).not.toMatch(
        /(^|\s)font-(body|display|sans)(\s|$)/,
      );
    });
  });

  describe('token discipline', () => {
    /** Every class on every node of one rendered cell. */
    const classesOf = (props: Partial<Parameters<typeof Toggle>[0]>) => {
      const { container, unmount } = render(<Toggle {...props} label="L" supportingText="S" />);
      const all = [...container.querySelectorAll<HTMLElement>('*')]
        .flatMap((el) => el.className.split(/\s+/))
        .filter(Boolean);
      unmount();
      return all;
    };

    it('names only semantic tokens in every colour utility, across all 16 cells', () => {
      for (const cell of CELLS) {
        for (const cls of classesOf(cell)) {
          const m = cls.match(/^(?:[a-z-]+(?:\/[a-z]+)?:)*(bg|text|inset-ring|ring-offset)-(.+)$/);
          if (!m?.[2]) continue;
          const value = m[2];
          // Widths and offsets are numbers; type styles are their own namespace.
          if (/^\d/.test(value) || value === 'transparent') continue;
          if (/^(mobile|desktop)-/.test(value)) continue;
          expect(value, `${cls} in ${JSON.stringify(cell)}`).toMatch(/^semantic-/);
        }
      }
    });

    it('uses no arbitrary value anywhere in the 16 cells', () => {
      for (const cell of CELLS) {
        const found = classesOf(cell).filter((c) => c.includes('['));
        expect(found, JSON.stringify(cell)).toEqual([]);
      }
    });
  });

  describe('class overrides', () => {
    it('merges className onto the control when there is no label', () => {
      setup({ className: 'uppercase' });
      expect(track().className).toContain('uppercase');
    });

    it('merges className onto the row once there is a label', () => {
      setup({ label: 'Remember me', className: 'uppercase' });
      expect((track().parentElement as HTMLElement).className).toContain('uppercase');
      expect(track().className).not.toContain('uppercase');
    });

    it('reaches every slot through classNames', () => {
      setup({
        label: 'Remember me',
        supportingText: 'Support.',
        classNames: {
          root: 'slot-root',
          track: 'slot-track',
          thumb: 'slot-thumb',
          text: 'slot-text',
          label: 'slot-label',
          supportingText: 'slot-supporting',
        },
      });
      expect((track().parentElement as HTMLElement).className).toContain('slot-root');
      expect(track().className).toContain('slot-track');
      expect(thumb().className).toContain('slot-thumb');
      expect((screen.getByText('Remember me').parentElement as HTMLElement).className).toContain(
        'slot-text',
      );
      expect(screen.getByText('Remember me').className).toContain('slot-label');
      expect(screen.getByText('Support.').className).toContain('slot-supporting');
    });
  });

  it('declares no class strings in the component file', () => {
    const source = readFileSync(resolve(__dirname, 'Toggle.tsx'), 'utf8');
    expect(source).not.toMatch(/className=["'][a-z]/);
  });

  it('matches its rendered markup', () => {
    const { container } = render(
      <Toggle
        variant="slim"
        size="md"
        checked
        label="Remember me"
        supportingText="Save my login details for next time."
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
