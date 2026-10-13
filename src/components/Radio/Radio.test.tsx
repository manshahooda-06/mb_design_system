import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Radio } from './Radio';
import type { RadioSize } from './radio-context';

const SIZES: RadioSize[] = ['sm', 'md'];

const input = () => screen.getByRole('radio');
/** The painted circle is the input's next sibling; the dot lives inside it. */
const circle = () => input().nextElementSibling as HTMLElement;
const dot = () => circle().firstElementChild as HTMLElement | null;

function setup(props: Partial<Parameters<typeof Radio>[0]> = {}) {
  const needsAriaLabel = props.label === undefined || props.label === null;
  return render(
    <Radio {...(needsAriaLabel ? { 'aria-label': 'Option' } : {})} name="opt" {...props} />,
  );
}

/** Every rendered painting combination: size × selected × disabled. */
const CELLS = SIZES.flatMap((size) =>
  [false, true].flatMap((checked) =>
    [false, true].map((disabled) => ({ size, checked, disabled })),
  ),
);

/** Renders one cell and hands back the control, circle and dot classes. */
function classesFor(props: Partial<Parameters<typeof Radio>[0]>) {
  const { container, unmount } = render(<Radio aria-label="A" name="opt" {...props} />);
  const inputEl = container.querySelector('input') as HTMLInputElement;
  const circleEl = inputEl.nextElementSibling as HTMLElement;
  const result = {
    control: (inputEl.parentElement as HTMLElement).className,
    circle: circleEl.className,
    dot: (circleEl.firstElementChild as HTMLElement | null)?.className ?? null,
  };
  unmount();
  return result;
}

describe('Radio', () => {
  describe('element and semantics', () => {
    it('is a native radio input, not a button', () => {
      setup();
      expect(input().tagName).toBe('INPUT');
      expect(input()).toHaveAttribute('type', 'radio');
    });

    it('participates in a form', () => {
      const { container } = render(
        <form>
          <Radio aria-label="Pro" name="plan" value="pro" defaultChecked />
        </form>,
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect([...new FormData(form).entries()]).toEqual([['plan', 'pro']]);
    });

    it('submits nothing when unselected', () => {
      const { container } = render(
        <form>
          <Radio aria-label="Pro" name="plan" value="pro" />
        </form>,
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect([...new FormData(form).entries()]).toEqual([]);
    });

    it('passes native required straight through, with no visual treatment', () => {
      // Figma publishes no required or error state for Radio, so any indicator here
      // would be invented.
      setup({ required: true });
      expect(input()).toBeRequired();
      expect(circle().className).not.toMatch(/error|required|destructive/);
    });

    it('is the bare control when there is no label', () => {
      const { container } = setup();
      expect(container.firstElementChild?.tagName).toBe('LABEL');
      expect(container.firstElementChild).toBe(input().parentElement);
    });

    it('sits inside a row once a label is present', () => {
      const { container } = setup({ label: 'Pro' });
      expect(container.firstElementChild?.tagName).toBe('DIV');
    });

    it('hides the circle from assistive technology — the input carries the state', () => {
      setup();
      expect(circle()).toHaveAttribute('aria-hidden', 'true');
      expect(circle().tagName).toBe('SPAN');
    });

    it('carries no aria-checked — the native input already reports selection', () => {
      setup({ defaultChecked: true });
      expect(input()).not.toHaveAttribute('aria-checked');
      expect(input()).toBeChecked();
    });
  });

  describe('labelling', () => {
    it('names the radio from the label, associated by id', () => {
      setup({ label: 'Pro' });
      expect(screen.getByRole('radio', { name: 'Pro' })).toBe(input());
    });

    it('selects when the label text is clicked', async () => {
      const user = userEvent.setup();
      setup({ label: 'Pro' });
      await user.click(screen.getByText('Pro'));
      expect(input()).toBeChecked();
    });

    it('selects when the circle is clicked', async () => {
      const user = userEvent.setup();
      setup();
      await user.click(circle());
      expect(input()).toBeChecked();
    });

    it('describes the radio with the supporting text', () => {
      setup({ label: 'Pro', supportingText: 'Everything in Free, plus more.' });
      const id = input().getAttribute('aria-describedby');
      expect(id).toBeTruthy();
      expect(document.getElementById(id!)?.textContent).toBe('Everything in Free, plus more.');
    });

    it('keeps the supporting text out of the accessible name', () => {
      setup({ label: 'Pro', supportingText: 'Extra detail.' });
      expect(screen.getByRole('radio', { name: 'Pro' })).toBe(input());
    });

    it('draws no supporting text without a label — Figma publishes no such variant', () => {
      setup({ supportingText: 'Orphaned' });
      expect(screen.queryByText('Orphaned')).not.toBeInTheDocument();
      expect(input()).not.toHaveAttribute('aria-describedby');
    });

    it('respects a caller-supplied id', () => {
      setup({ label: 'Pro', id: 'plan-pro' });
      expect(input().id).toBe('plan-pro');
      expect(screen.getByText('Pro')).toHaveAttribute('for', 'plan-pro');
    });

    it('gives concurrent instances distinct ids', () => {
      render(
        <>
          <Radio name="p" value="a" label="First" supportingText="One" />
          <Radio name="p" value="b" label="Second" supportingText="Two" />
        </>,
      );
      const [a, b] = screen.getAllByRole('radio');
      expect(a?.id).not.toBe(b?.id);
      expect(a?.getAttribute('aria-describedby')).not.toBe(b?.getAttribute('aria-describedby'));
    });
  });

  describe('circle geometry', () => {
    it.each(SIZES)('sizes the %s circle from one semantic token', (size) => {
      expect(classesFor({ size }).circle).toContain(
        size === 'sm' ? 'size-semantic-xl' : 'size-semantic-2xl',
      );
    });

    it('is a full circle at every size — the radius does not move with size', () => {
      // Unlike Checkbox, which is 2 at sm and 4 at md.
      for (const cell of CELLS) {
        const cls = classesFor(cell).circle;
        expect(cls, JSON.stringify(cell)).toContain('rounded-full');
        expect(cls).not.toContain('rounded-xxs');
        expect(cls).not.toContain('rounded-xs');
      }
    });

    it('follows Figma border width — 1px unless selected, and back for disabled', () => {
      for (const cell of CELLS) {
        const cls = classesFor({ ...cell, defaultChecked: cell.checked }).circle;
        if (cell.checked && !cell.disabled) {
          expect(cls, JSON.stringify(cell)).toContain('border-0');
        } else {
          expect(cls, JSON.stringify(cell)).toMatch(/(^|\s)border(\s|$)/);
          expect(cls, JSON.stringify(cell)).not.toContain('border-0');
        }
      }
    });

    it('offsets the control by 2px only when there is a label', () => {
      // Figma's `Input` frame is 16x18 / 20x22 with the circle at y=2, which centres
      // it on the FIRST text line. With Text=False the root is exactly the circle.
      expect(classesFor({ label: 'L' }).control).toContain('pt-semantic-xxs');
      expect(classesFor({}).control).not.toContain('pt-semantic-xxs');
    });

    it('never pins a size with an arbitrary value', () => {
      for (const cell of CELLS) {
        expect(classesFor(cell).circle, JSON.stringify(cell)).not.toMatch(/\bsize-\[/);
      }
    });
  });

  describe('dot', () => {
    it('draws no dot when unselected', () => {
      setup();
      expect(dot()).toBeNull();
    });

    it('draws a dot when selected', () => {
      setup({ defaultChecked: true });
      expect(dot()).not.toBeNull();
    });

    it.each(SIZES)('sizes the %s dot from one semantic token', (size) => {
      // 6 and 8 are both on the semantic spacing scale, which is why Radio needs no
      // documented exception where Checkbox needed one for its 14px glyph.
      expect(classesFor({ size, defaultChecked: true }).dot).toContain(
        size === 'sm' ? 'size-semantic-sm' : 'size-semantic-md',
      );
    });

    it('takes its colour from the circle through bg-current', () => {
      // One mechanism covers both measured dot colours: white on brand when selected,
      // fg-disabled-subtle when disabled.
      expect(classesFor({ defaultChecked: true }).dot).toContain('bg-current');
    });

    it('is a circle', () => {
      expect(classesFor({ defaultChecked: true }).dot).toContain('rounded-full');
    });

    it('still shows the dot when disabled — Figma greys it rather than hiding it', () => {
      setup({ defaultChecked: true, disabled: true });
      expect(dot()).not.toBeNull();
    });
  });

  describe('colour', () => {
    it('is white with a grey border when unselected', () => {
      const cls = classesFor({}).circle;
      expect(cls).toContain('bg-semantic-bg-primary');
      expect(cls).toContain('border-semantic-border-primary');
    });

    it('is brand-filled with no border when selected', () => {
      const cls = classesFor({ defaultChecked: true }).circle;
      expect(cls).toContain('bg-semantic-bg-brand-solid');
      expect(cls).toContain('border-0');
    });

    it('colours the dot white when selected, so bg-current resolves to white', () => {
      expect(classesFor({ defaultChecked: true }).circle).toContain('text-semantic-fg-white');
    });

    it('greys the surface and the dot when disabled, selected or not', () => {
      for (const checked of [false, true]) {
        const cls = classesFor({ defaultChecked: checked, disabled: true }).circle;
        expect(cls).toContain('bg-semantic-bg-disabled-subtle');
        expect(cls).toContain('border-semantic-border-primary');
        expect(cls).toContain('text-semantic-fg-disabled-subtle');
        expect(cls).not.toContain('bg-semantic-bg-brand-solid');
      }
    });

    it('declares no hover treatment at all — Figma draws none in any of the 8 cells', () => {
      for (const cell of CELLS) {
        expect(classesFor(cell).circle, JSON.stringify(cell)).not.toContain('hover:');
      }
    });
  });

  describe('elevation', () => {
    it('casts no shadow — Figma binds no effect to any of the 32 variants', () => {
      for (const cell of CELLS) {
        expect(classesFor(cell).circle, JSON.stringify(cell)).not.toContain('shadow');
      }
    });
  });

  describe('focus', () => {
    it('carries the shared focus ring geometry, driven off the input', () => {
      const cls = classesFor({}).circle;
      expect(cls).toContain('peer-focus-visible:ring-2');
      expect(cls).toContain('peer-focus-visible:ring-semantic-focus-ring');
      expect(cls).toContain('peer-focus-visible:ring-offset-2');
      expect(cls).toContain('peer-focus-visible:ring-offset-semantic-bg-primary');
    });

    it('marks the input as the peer, before the circle in the DOM', () => {
      setup();
      expect(input().className).toContain('peer');
      expect(input().nextElementSibling).toBe(circle());
    });

    it('hides the input visually without removing it from the accessibility tree', () => {
      setup();
      expect(input().className).toContain('sr-only');
      expect(input()).toBeInTheDocument();
    });

    it('is reachable by keyboard', async () => {
      const user = userEvent.setup();
      setup();
      await user.tab();
      expect(input()).toHaveFocus();
    });
  });

  describe('behaviour', () => {
    it('selects when uncontrolled, and repaints the circle', async () => {
      const user = userEvent.setup();
      setup({ defaultChecked: false });
      expect(dot()).toBeNull();
      await user.click(circle());
      expect(input()).toBeChecked();
      expect(dot()).not.toBeNull();
      expect(circle().className).toContain('bg-semantic-bg-brand-solid');
    });

    it('cannot be unselected by clicking it again', async () => {
      // The behaviour that separates a radio from a checkbox. Native `change` does not
      // fire, so nothing inverts.
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      setup({ defaultChecked: true, onCheckedChange });
      await user.click(circle());
      expect(input()).toBeChecked();
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it('reports selection with true, never with false', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      setup({ onCheckedChange });
      await user.click(circle());
      expect(onCheckedChange).toHaveBeenCalledTimes(1);
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it('honours defaultChecked', () => {
      setup({ defaultChecked: true });
      expect(input()).toBeChecked();
    });

    it('does not move itself when controlled', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      setup({ checked: false, onCheckedChange });
      await user.click(circle());
      expect(onCheckedChange).toHaveBeenCalledWith(true);
      expect(input()).not.toBeChecked();
    });

    it('still calls a caller onChange', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      setup({ onChange });
      await user.click(circle());
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('does not select when disabled', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      setup({ disabled: true, onCheckedChange });
      await user.click(circle());
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(input()).not.toBeChecked();
    });

    it('is skipped by the tab sequence when disabled', async () => {
      const user = userEvent.setup();
      setup({ disabled: true });
      await user.tab();
      expect(input()).not.toHaveFocus();
    });
  });

  describe('standalone grouping', () => {
    it('uses the name it is given', () => {
      setup({ name: 'plan' });
      expect(input()).toHaveAttribute('name', 'plan');
    });

    it('submits the value it is given', () => {
      setup({ name: 'plan', value: 'pro' });
      expect(input()).toHaveAttribute('value', 'pro');
    });

    it('is mutually exclusive with a sibling sharing its name', async () => {
      const user = userEvent.setup();
      render(
        <>
          <Radio name="plan" value="free" label="Free" />
          <Radio name="plan" value="pro" label="Pro" />
        </>,
      );
      const [free, pro] = screen.getAllByRole('radio');
      await user.click(screen.getByText('Free'));
      expect(free).toBeChecked();
      await user.click(screen.getByText('Pro'));
      expect(pro).toBeChecked();
      expect(free).not.toBeChecked();
    });
  });

  describe('layout', () => {
    it.each(SIZES)('sets the %s row gap from Figma', (size) => {
      setup({ size, label: 'Pro' });
      const root = input().closest('div') as HTMLElement;
      expect(root.className).toContain(size === 'sm' ? 'gap-semantic-md' : 'gap-semantic-lg');
    });

    it.each(SIZES)('sets the %s label gap from Figma — 0 at sm, 2 at md', (size) => {
      setup({ size, label: 'Pro', supportingText: 'Detail.' });
      const text = screen.getByText('Pro').parentElement as HTMLElement;
      expect(text.className).toContain(size === 'sm' ? 'gap-semantic-none' : 'gap-semantic-xxs');
    });

    it('aligns the row to the top and offsets the control instead of centring', () => {
      setup({ label: 'Pro', supportingText: 'Two lines.' });
      const root = input().closest('div') as HTMLElement;
      expect(root.className).toContain('items-start');
      expect(root.className).not.toContain('items-center');
    });

    it('lets the text block flex and wrap rather than pinning 344px', () => {
      setup({ label: 'Pro' });
      const text = screen.getByText('Pro').parentElement as HTMLElement;
      expect(text.className).toContain('flex-1');
      expect(text.className).toContain('min-w-semantic-none');
      expect(screen.getByText('Pro').className).toContain('break-words');
    });

    it('keeps the control from shrinking when the label is long', () => {
      setup({ label: 'A'.repeat(200) });
      expect((input().parentElement as HTMLElement).className).toContain('shrink-0');
    });
  });

  describe('typography', () => {
    it.each(SIZES)('sets the %s type from one token per line', (size) => {
      setup({ size, label: 'Pro', supportingText: 'Detail.' });
      const expected = size === 'sm' ? 'text-mobile-body-md' : 'text-desktop-body-sm';
      expect(screen.getByText('Pro').className).toContain(expected);
      expect(screen.getByText('Detail.').className).toContain(expected);
    });

    it('crosses the type scales exactly as Figma does', () => {
      setup({ size: 'sm', label: 'Small' });
      expect(screen.getByText('Small').className).toContain('mobile');
      setup({ size: 'md', label: 'Medium' });
      expect(screen.getByText('Medium').className).toContain('desktop');
    });

    it('weights the label at 500 and the supporting line at 400', () => {
      setup({ label: 'Pro', supportingText: 'Detail.' });
      expect(screen.getByText('Pro').className).toContain('font-medium');
      expect(screen.getByText('Detail.').className).toContain('font-regular');
    });

    it('does not dim either text colour when disabled — Figma leaves both untouched', () => {
      setup({ label: 'Pro', supportingText: 'Detail.', disabled: true });
      expect(screen.getByText('Pro').className).toContain('text-semantic-text-primary');
      expect(screen.getByText('Detail.').className).toContain('text-semantic-text-secondary');
    });
  });

  describe('token discipline', () => {
    const classesOf = (props: Partial<Parameters<typeof Radio>[0]>) => {
      const { container, unmount } = render(
        <Radio aria-label="A" name="o" label="L" supportingText="S" {...props} />,
      );
      const all = [...container.querySelectorAll<HTMLElement>('*')]
        .flatMap((el) => (typeof el.className === 'string' ? el.className.split(/\s+/) : []))
        .filter(Boolean);
      unmount();
      return all;
    };

    it('names only semantic tokens in every colour utility, across all 8 cells', () => {
      for (const cell of CELLS) {
        for (const cls of classesOf({ ...cell, defaultChecked: cell.checked })) {
          const m = cls.match(/^(?:[a-z-]+(?:\/[a-z]+)?:)*(bg|text|border|ring-offset)-(.+)$/);
          if (!m?.[2]) continue;
          const value = m[2];
          if (/^\d/.test(value) || value === 'transparent' || value === 'current') continue;
          if (/^(mobile|desktop)-/.test(value)) continue;
          expect(value, `${cls} in ${JSON.stringify(cell)}`).toMatch(/^semantic-/);
        }
      }
    });

    it('uses no arbitrary value at all — Radio needs no documented exception', () => {
      for (const cell of CELLS) {
        const found = classesOf({ ...cell, defaultChecked: cell.checked }).filter((c) =>
          c.includes('['),
        );
        expect(found, JSON.stringify(cell)).toEqual([]);
      }
    });
  });

  describe('class overrides', () => {
    it('merges className onto the control when there is no label', () => {
      setup({ className: 'uppercase' });
      expect((input().parentElement as HTMLElement).className).toContain('uppercase');
    });

    it('merges className onto the row once there is a label', () => {
      setup({ label: 'Pro', className: 'uppercase' });
      expect((input().closest('div') as HTMLElement).className).toContain('uppercase');
    });

    it('reaches every slot through classNames', () => {
      setup({
        label: 'Pro',
        supportingText: 'Detail.',
        defaultChecked: true,
        classNames: {
          root: 'slot-root',
          control: 'slot-control',
          input: 'slot-input',
          circle: 'slot-circle',
          dot: 'slot-dot',
          text: 'slot-text',
          label: 'slot-label',
          supportingText: 'slot-supporting',
        },
      });
      expect((input().closest('div') as HTMLElement).className).toContain('slot-root');
      expect((input().parentElement as HTMLElement).className).toContain('slot-control');
      expect(input().className).toContain('slot-input');
      expect(circle().className).toContain('slot-circle');
      expect(dot()?.className).toContain('slot-dot');
      expect((screen.getByText('Pro').parentElement as HTMLElement).className).toContain(
        'slot-text',
      );
      expect(screen.getByText('Pro').className).toContain('slot-label');
      expect(screen.getByText('Detail.').className).toContain('slot-supporting');
    });
  });

  describe('kept separate from Checkbox — measured, not assumed', () => {
    /** Comments stripped, so prose describing a difference cannot satisfy the check. */
    const code = (rel: string) =>
      readFileSync(resolve(__dirname, rel), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');

    const radioSource = code('Radio.variants.ts');
    const boxSource = code('../Checkbox/Checkbox.variants.ts');

    it('is always fully rounded, where Checkbox varies radius with size', () => {
      expect(radioSource).toContain('rounded-full');
      expect(radioSource).not.toContain('rounded-xxs');
      expect(boxSource).toContain('rounded-xxs');
      expect(boxSource).toContain('rounded-xs');
    });

    it('draws its own dot, where Checkbox takes a caller glyph', () => {
      expect(radioSource).toContain('bg-current');
      expect(code('Radio.tsx')).not.toMatch(/checkIcon|indeterminateIcon/);
      expect(code('../Checkbox/Checkbox.tsx')).toMatch(/checkIcon/);
    });

    it('has no indeterminate state, which Checkbox publishes 8 variants of', () => {
      expect(radioSource).not.toMatch(/indeterminate/i);
      expect(code('Radio.tsx')).not.toMatch(/indeterminate/i);
    });

    it('needs no documented exception, where Checkbox needs one for its 14px glyph', () => {
      // `-[` is an arbitrary value; a bare `[` is just an array literal.
      expect(radioSource).not.toMatch(/-\[/);
      expect(boxSource).toContain('size-[14px]');
    });

    it('shares no module with Checkbox — the variants are deliberately duplicated', () => {
      // The library extracts only on proven structural reuse across components, not
      // because values happen to match today.
      expect(code('Radio.variants.ts')).not.toMatch(/from '\.\.\/Checkbox/);
      expect(code('Radio.tsx')).not.toMatch(/from '\.\.\/Checkbox/);
    });
  });

  it('declares no class strings in the component file', () => {
    const source = readFileSync(resolve(__dirname, 'Radio.tsx'), 'utf8');
    expect(source).not.toMatch(/className=["'][a-z]/);
  });

  it('matches its rendered markup', () => {
    const { container } = render(
      <Radio
        size="md"
        name="plan"
        value="pro"
        defaultChecked
        label="Pro"
        supportingText="Everything in Free, plus more."
        id="plan-pro"
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
