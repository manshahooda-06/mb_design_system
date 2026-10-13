import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox, type CheckboxSize } from './Checkbox';

const SIZES: CheckboxSize[] = ['sm', 'md'];

const Tick = () => <svg viewBox="0 0 12 12" data-testid="tick" />;
const Dash = () => <svg viewBox="0 0 12 12" data-testid="dash" />;

const input = () => screen.getByRole('checkbox');
/** The painted box is the input's next sibling; the glyph lives inside it. */
const box = () => input().nextElementSibling as HTMLElement;
const glyph = () => box().firstElementChild as HTMLElement | null;

/**
 * `aria-label` is supplied only when there is no `label`, because an `aria-label`
 * legitimately overrides a `<label>` association — passing both would test the
 * wrong thing.
 */
function setup(props: Partial<Parameters<typeof Checkbox>[0]> = {}) {
  const needsAriaLabel = props.label === undefined || props.label === null;
  return render(
    <Checkbox
      {...(needsAriaLabel ? { 'aria-label': 'Accept' } : {})}
      checkIcon={<Tick />}
      {...props}
    />,
  );
}

/** Every rendered painting combination: size × box-state × disabled. */
const CELLS = SIZES.flatMap((size) =>
  (['unchecked', 'checked', 'indeterminate'] as const).flatMap((state) =>
    [false, true].map((disabled) => ({
      size,
      disabled,
      checked: state === 'checked',
      indeterminate: state === 'indeterminate',
      state,
    })),
  ),
);

/** Renders one cell and hands back the control, box and glyph classes. */
function classesFor(props: Partial<Parameters<typeof Checkbox>[0]>) {
  const { container, unmount } = render(
    <Checkbox aria-label="A" checkIcon={<Tick />} indeterminateIcon={<Dash />} {...props} />,
  );
  const inputEl = container.querySelector('input') as HTMLInputElement;
  const boxEl = inputEl.nextElementSibling as HTMLElement;
  const result = {
    box: boxEl.className,
    glyph: (boxEl.firstElementChild as HTMLElement | null)?.className ?? null,
    control: (inputEl.parentElement as HTMLElement).className,
  };
  unmount();
  return result;
}

describe('Checkbox', () => {
  describe('element and semantics', () => {
    it('is a native input, not a button', () => {
      setup();
      expect(input().tagName).toBe('INPUT');
      expect(input()).toHaveAttribute('type', 'checkbox');
    });

    it('participates in a form — the one thing a button role could not do', () => {
      const { container } = render(
        <form>
          <Checkbox aria-label="Accept" name="terms" value="yes" defaultChecked />
        </form>,
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect([...new FormData(form).entries()]).toEqual([['terms', 'yes']]);
    });

    it('submits nothing when unchecked, as a native checkbox does', () => {
      const { container } = render(
        <form>
          <Checkbox aria-label="Accept" name="terms" value="yes" />
        </form>,
      );
      const form = container.querySelector('form') as HTMLFormElement;
      expect([...new FormData(form).entries()]).toEqual([]);
    });

    it('supports required and name through native props', () => {
      setup({ name: 'terms', required: true });
      expect(input()).toBeRequired();
      expect(input()).toHaveAttribute('name', 'terms');
    });

    it('is the bare control when there is no label', () => {
      const { container } = setup();
      expect(container.firstElementChild?.tagName).toBe('LABEL');
      expect(container.firstElementChild).toBe(input().parentElement);
    });

    it('sits inside a row once a label is present', () => {
      const { container } = setup({ label: 'Remember me' });
      expect(container.firstElementChild?.tagName).toBe('DIV');
    });

    it('hides the box from assistive technology — the input carries the state', () => {
      setup();
      expect(box()).toHaveAttribute('aria-hidden', 'true');
      expect(box().tagName).toBe('SPAN');
    });
  });

  describe('labelling', () => {
    it('names the checkbox from the label, associated by id', () => {
      setup({ label: 'Remember me' });
      expect(screen.getByRole('checkbox', { name: 'Remember me' })).toBe(input());
    });

    it('toggles when the label text is clicked', async () => {
      const user = userEvent.setup();
      setup({ label: 'Remember me' });
      await user.click(screen.getByText('Remember me'));
      expect(input()).toBeChecked();
    });

    it('toggles when the box is clicked', async () => {
      const user = userEvent.setup();
      setup();
      await user.click(box());
      expect(input()).toBeChecked();
    });

    it('describes the checkbox with the supporting text', () => {
      setup({ label: 'Remember me', supportingText: 'Save my details.' });
      const id = input().getAttribute('aria-describedby');
      expect(id).toBeTruthy();
      expect(document.getElementById(id!)?.textContent).toBe('Save my details.');
    });

    it('keeps the supporting text out of the accessible name', () => {
      setup({ label: 'Remember me', supportingText: 'Save my details.' });
      expect(screen.getByRole('checkbox', { name: 'Remember me' })).toBe(input());
    });

    it('draws no supporting text without a label — Figma publishes no such variant', () => {
      setup({ supportingText: 'Orphaned' });
      expect(screen.queryByText('Orphaned')).not.toBeInTheDocument();
      expect(input()).not.toHaveAttribute('aria-describedby');
    });

    it('respects a caller-supplied id', () => {
      setup({ label: 'Remember me', id: 'terms' });
      expect(input().id).toBe('terms');
      expect(screen.getByText('Remember me')).toHaveAttribute('for', 'terms');
    });

    it('gives concurrent instances distinct ids', () => {
      render(
        <>
          <Checkbox label="First" supportingText="One" />
          <Checkbox label="Second" supportingText="Two" />
        </>,
      );
      const [a, b] = screen.getAllByRole('checkbox');
      expect(a?.id).not.toBe(b?.id);
      expect(a?.getAttribute('aria-describedby')).not.toBe(b?.getAttribute('aria-describedby'));
    });
  });

  describe('box geometry', () => {
    it.each(SIZES)('sizes the %s box from one semantic token', (size) => {
      expect(classesFor({ size }).box).toContain(
        size === 'sm' ? 'size-semantic-xl' : 'size-semantic-2xl',
      );
    });

    it('uses a radius that is not proportional to the box — 2 at sm, 4 at md', () => {
      expect(classesFor({ size: 'sm' }).box).toContain('rounded-xxs');
      expect(classesFor({ size: 'md' }).box).toContain('rounded-xs');
    });

    it('follows Figma border width exactly — 1px unless filled, and back for disabled', () => {
      // Figma drops the stroke entirely on checked and indeterminate. Both spellings
      // render the same (the glyph is flex-centred either way), but only this one
      // measures the way Figma declares it.
      for (const cell of CELLS) {
        const cls = classesFor(cell).box;
        const filled = cell.checked || cell.indeterminate;
        if (filled && !cell.disabled) {
          expect(cls, JSON.stringify(cell)).toContain('border-0');
        } else {
          expect(cls, JSON.stringify(cell)).toMatch(/(^|\s)border(\s|$)/);
          expect(cls, JSON.stringify(cell)).not.toContain('border-0');
        }
      }
    });

    it('never pins a size with an arbitrary value on the box', () => {
      for (const cell of CELLS) {
        expect(classesFor(cell).box, JSON.stringify(cell)).not.toMatch(/\bsize-\[/);
      }
    });

    it('offsets the control by 2px only when there is a label', () => {
      // Figma's `Input` frame is 16x18 / 20x22 with the box at y=2, which centres it
      // on the FIRST text line. With Text=False the root is exactly the box.
      expect(classesFor({ label: 'L' }).control).toContain('pt-semantic-xxs');
      expect(classesFor({}).control).not.toContain('pt-semantic-xxs');
    });
  });

  describe('glyph', () => {
    it('shows no glyph when unchecked', () => {
      setup();
      expect(glyph()).toBeNull();
    });

    it('shows the check glyph when checked', () => {
      setup({ checked: true });
      expect(screen.getByTestId('tick')).toBeInTheDocument();
    });

    it('shows the indeterminate glyph instead of the check glyph', () => {
      setup({ checked: true, indeterminate: true, indeterminateIcon: <Dash /> });
      expect(screen.getByTestId('dash')).toBeInTheDocument();
      expect(screen.queryByTestId('tick')).not.toBeInTheDocument();
    });

    it('shows the indeterminate glyph even when not checked', () => {
      setup({ indeterminate: true, indeterminateIcon: <Dash /> });
      expect(screen.getByTestId('dash')).toBeInTheDocument();
    });

    it.each(SIZES)('sizes the %s glyph as Figma does', (size) => {
      const cls = classesFor({ size, checked: true }).glyph;
      expect(cls).toContain(size === 'sm' ? 'size-semantic-lg' : 'size-[14px]');
    });

    it('reuses the existing size-[14px] exception rather than adding one', () => {
      // 12 is spacing-semantic-lg; 14 lands on no scale and is already documented
      // for Tag's glyph ramp.
      const cls = classesFor({ size: 'md', checked: true }).glyph ?? '';
      const arbitrary = cls.split(/\s+/).filter((c) => c.includes('['));
      expect(arbitrary).toEqual(['size-[14px]']);
    });

    it('stretches a caller glyph to fill the box', () => {
      expect(classesFor({ checked: true }).glyph).toContain('*:size-full');
    });

    it('still shows the glyph when disabled — Figma greys it rather than hiding it', () => {
      setup({ checked: true, disabled: true });
      expect(screen.getByTestId('tick')).toBeInTheDocument();
    });
  });

  describe('colour', () => {
    it('is white with a grey border when unchecked', () => {
      const cls = classesFor({}).box;
      expect(cls).toContain('bg-semantic-bg-primary');
      expect(cls).toContain('border-semantic-border-primary');
    });

    it('is brand-filled with no border when checked', () => {
      const cls = classesFor({ checked: true }).box;
      expect(cls).toContain('bg-semantic-bg-brand-solid');
      expect(cls).toContain('border-0');
    });

    it('paints indeterminate exactly like checked', () => {
      expect(classesFor({ indeterminate: true }).box).toBe(classesFor({ checked: true }).box);
    });

    it('colours the glyph white when filled, so the icon inherits it', () => {
      expect(classesFor({ checked: true }).box).toContain('text-semantic-fg-white');
    });

    it('greys the surface and the glyph when disabled, checked or not', () => {
      for (const checked of [false, true]) {
        const cls = classesFor({ checked, disabled: true }).box;
        expect(cls).toContain('bg-semantic-bg-disabled-subtle');
        expect(cls).toContain('border-semantic-border-primary');
        expect(cls).not.toContain('border-0');
        expect(cls).toContain('text-semantic-fg-disabled-subtle');
        expect(cls).not.toContain('bg-semantic-bg-brand-solid');
      }
    });

    it('declares no hover treatment at all — Figma draws none in any of the 18 cells', () => {
      for (const cell of CELLS) {
        expect(classesFor(cell).box, JSON.stringify(cell)).not.toContain('hover:');
      }
    });
  });

  describe('elevation', () => {
    it('casts no shadow — Figma binds no effect to any of the 72 variants', () => {
      for (const cell of CELLS) {
        expect(classesFor(cell).box, JSON.stringify(cell)).not.toContain('shadow');
      }
    });

    it('recreates no deprecated UUI shadow', () => {
      for (const cell of CELLS) {
        const cls = classesFor(cell).box;
        expect(cls).not.toMatch(/shadow-(xs|sm|semantic-shadow)/);
        expect(cls).not.toMatch(/shadow-\[/);
      }
    });
  });

  describe('focus', () => {
    it('carries the shared focus ring geometry, driven off the input', () => {
      const cls = classesFor({}).box;
      expect(cls).toContain('peer-focus-visible:ring-2');
      expect(cls).toContain('peer-focus-visible:ring-semantic-focus-ring');
      expect(cls).toContain('peer-focus-visible:ring-offset-2');
      expect(cls).toContain('peer-focus-visible:ring-offset-semantic-bg-primary');
    });

    it('marks the input as the peer, before the box in the DOM', () => {
      setup();
      expect(input().className).toContain('peer');
      // `peer-*` is a sibling combinator, so the box must follow the input.
      expect(input().nextElementSibling).toBe(box());
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

    it('toggles with Space', async () => {
      const user = userEvent.setup();
      setup();
      await user.tab();
      await user.keyboard(' ');
      expect(input()).toBeChecked();
    });
  });

  describe('behaviour', () => {
    it('toggles when uncontrolled, and repaints the box', async () => {
      const user = userEvent.setup();
      setup({ defaultChecked: false });
      expect(glyph()).toBeNull();
      await user.click(box());
      // The regression this guards: gating the glyph on a prop rather than on
      // tracked state leaves an uncontrolled checkbox painted empty after a click.
      expect(input()).toBeChecked();
      expect(screen.getByTestId('tick')).toBeInTheDocument();
      expect(box().className).toContain('bg-semantic-bg-brand-solid');
    });

    it('honours defaultChecked', () => {
      setup({ defaultChecked: true });
      expect(input()).toBeChecked();
      expect(screen.getByTestId('tick')).toBeInTheDocument();
    });

    it('does not move itself when controlled', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      setup({ checked: false, onCheckedChange });
      await user.click(box());
      expect(onCheckedChange).toHaveBeenCalledWith(true);
      expect(input()).not.toBeChecked();
    });

    it('reports the next value, not the current one', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      setup({ defaultChecked: true, onCheckedChange });
      await user.click(box());
      expect(onCheckedChange).toHaveBeenCalledWith(false);
    });

    it('still calls a caller onChange', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      setup({ onChange });
      await user.click(box());
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('does not toggle when disabled', async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      setup({ disabled: true, onCheckedChange });
      await user.click(box());
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

  describe('indeterminate', () => {
    it('sets the DOM property, which has no HTML attribute', () => {
      setup({ indeterminate: true, indeterminateIcon: <Dash /> });
      expect((input() as HTMLInputElement).indeterminate).toBe(true);
    });

    it('reports aria-checked="mixed"', () => {
      setup({ indeterminate: true });
      expect(input()).toHaveAttribute('aria-checked', 'mixed');
    });

    it('omits aria-checked entirely when not indeterminate', () => {
      // A native checkbox already reports checkedness; a redundant aria-checked
      // could disagree with it.
      setup({ checked: true });
      expect(input()).not.toHaveAttribute('aria-checked');
    });

    it('re-applies when the prop changes, not just on mount', () => {
      const { rerender } = setup({ indeterminate: true, indeterminateIcon: <Dash /> });
      expect((input() as HTMLInputElement).indeterminate).toBe(true);
      rerender(<Checkbox aria-label="Accept" indeterminate={false} checkIcon={<Tick />} />);
      expect((input() as HTMLInputElement).indeterminate).toBe(false);
    });
  });

  describe('layout', () => {
    it.each(SIZES)('sets the %s row gap from Figma', (size) => {
      setup({ size, label: 'Remember me' });
      const root = input().closest('div') as HTMLElement;
      expect(root.className).toContain(size === 'sm' ? 'gap-semantic-md' : 'gap-semantic-lg');
    });

    it.each(SIZES)('sets the %s label gap from Figma — 0 at sm, 2 at md', (size) => {
      setup({ size, label: 'Remember me', supportingText: 'Support.' });
      const text = screen.getByText('Remember me').parentElement as HTMLElement;
      expect(text.className).toContain(size === 'sm' ? 'gap-semantic-none' : 'gap-semantic-xxs');
    });

    it('aligns the row to the top and offsets the control instead of centring', () => {
      setup({ label: 'Remember me', supportingText: 'Two lines.' });
      const root = input().closest('div') as HTMLElement;
      expect(root.className).toContain('items-start');
      expect(root.className).not.toContain('items-center');
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
      expect((input().parentElement as HTMLElement).className).toContain('shrink-0');
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

    it('does not dim either text colour when disabled — Figma leaves both untouched', () => {
      setup({ label: 'Remember me', supportingText: 'Support.', disabled: true });
      expect(screen.getByText('Remember me').className).toContain('text-semantic-text-primary');
      expect(screen.getByText('Support.').className).toContain('text-semantic-text-secondary');
    });
  });

  describe('token discipline', () => {
    const classesOf = (props: Partial<Parameters<typeof Checkbox>[0]>) => {
      const { container, unmount } = render(
        <Checkbox
          aria-label="A"
          checkIcon={<Tick />}
          indeterminateIcon={<Dash />}
          label="L"
          supportingText="S"
          {...props}
        />,
      );
      const all = [...container.querySelectorAll<HTMLElement>('*')]
        .flatMap((el) => (typeof el.className === 'string' ? el.className.split(/\s+/) : []))
        .filter(Boolean);
      unmount();
      return all;
    };

    it('names only semantic tokens in every colour utility, across all 12 cells', () => {
      for (const cell of CELLS) {
        for (const cls of classesOf(cell)) {
          const m = cls.match(/^(?:[a-z-]+(?:\/[a-z]+)?:)*(bg|text|border|ring-offset)-(.+)$/);
          if (!m?.[2]) continue;
          const value = m[2];
          if (/^\d/.test(value) || value === 'transparent') continue;
          if (/^(mobile|desktop)-/.test(value)) continue;
          expect(value, `${cls} in ${JSON.stringify(cell)}`).toMatch(/^semantic-/);
        }
      }
    });

    it('uses exactly one arbitrary value — the already-documented 14px glyph', () => {
      const found = new Set<string>();
      for (const cell of CELLS) {
        for (const cls of classesOf(cell)) if (cls.includes('[')) found.add(cls);
      }
      expect([...found]).toEqual(['size-[14px]']);
    });
  });

  describe('class overrides', () => {
    it('merges className onto the control when there is no label', () => {
      setup({ className: 'uppercase' });
      expect((input().parentElement as HTMLElement).className).toContain('uppercase');
    });

    it('merges className onto the row once there is a label', () => {
      setup({ label: 'Remember me', className: 'uppercase' });
      expect((input().closest('div') as HTMLElement).className).toContain('uppercase');
    });

    it('reaches every slot through classNames', () => {
      setup({
        label: 'Remember me',
        supportingText: 'Support.',
        checked: true,
        classNames: {
          root: 'slot-root',
          control: 'slot-control',
          input: 'slot-input',
          box: 'slot-box',
          icon: 'slot-icon',
          text: 'slot-text',
          label: 'slot-label',
          supportingText: 'slot-supporting',
        },
      });
      expect((input().closest('div') as HTMLElement).className).toContain('slot-root');
      expect((input().parentElement as HTMLElement).className).toContain('slot-control');
      expect(input().className).toContain('slot-input');
      expect(box().className).toContain('slot-box');
      expect(glyph()?.className).toContain('slot-icon');
      expect((screen.getByText('Remember me').parentElement as HTMLElement).className).toContain(
        'slot-text',
      );
      expect(screen.getByText('Remember me').className).toContain('slot-label');
      expect(screen.getByText('Support.').className).toContain('slot-supporting');
    });
  });

  describe('Radio is deliberately out of reach', () => {
    it('exposes no type or variant prop — Figma Radio is a different control', () => {
      // The Figma set publishes 32 Type=Radio variants. A radio is single-select
      // within a named group with arrow-key navigation; routing it through this
      // component would give it checkbox semantics.
      const source = readFileSync(resolve(__dirname, 'Checkbox.tsx'), 'utf8');
      expect(source).not.toMatch(/\btype\?:/);
      expect(source).not.toMatch(/variant\?:/);
    });

    it('renders no rounded-full box, which is Radio only geometric tell', () => {
      for (const cell of CELLS) {
        expect(classesFor(cell).box, JSON.stringify(cell)).not.toContain('rounded-full');
      }
    });

    it('shares no module with Radio — the variants are deliberately duplicated', () => {
      // The mirror of the assertion in Radio.test.tsx, so a shared surface cannot be
      // introduced from either side. Both variants files carry a note explaining why:
      // the library extracts only on proven structural reuse, not on values that
      // happen to match today.
      const strip = (rel: string) =>
        readFileSync(resolve(__dirname, rel), 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\s*\/\/.*$/gm, '');
      expect(strip('Checkbox.variants.ts')).not.toMatch(/from '\.\.\/Radio/);
      expect(strip('Checkbox.tsx')).not.toMatch(/from '\.\.\/Radio/);
    });

    it('says in both variants files why they are not shared', () => {
      // A comment can be deleted, so this pins that the reasoning stays discoverable
      // from whichever file a contributor opens first.
      const here = readFileSync(resolve(__dirname, 'Checkbox.variants.ts'), 'utf8');
      const there = readFileSync(resolve(__dirname, '../Radio/Radio.variants.ts'), 'utf8');
      expect(here).toMatch(/Intentionally not shared with Radio/);
      expect(there).toMatch(/Intentionally not shared with Checkbox/);
    });
  });

  describe('TagCheckbox stays independent — measured, not assumed', () => {
    /**
     * The task was to fold `TagCheckbox` into this component *if* they are
     * structurally identical. They are not, and these are the differences that make
     * substitution a visual regression rather than a cleanup. Pinned as a test so a
     * future contributor does not merge them on the strength of them looking alike.
     */
    /**
     * Comments are stripped before matching. Both files *describe* the divergence in
     * prose, so raw text would match the very words the doc comments use to explain
     * that a treatment is absent — which is how an earlier version of these
     * assertions passed for the wrong reason.
     */
    const code = (rel: string) =>
      readFileSync(resolve(__dirname, rel), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');

    const tagSource = code('../Tag/TagCheckbox.variants.ts');
    const tagComponent = code('../Tag/TagCheckbox.tsx');
    const boxSource = code('Checkbox.variants.ts');
    const boxComponent = code('Checkbox.tsx');

    it('has a different size scale — 14/16/18 against 16/20', () => {
      // Tag's padding tables are calibrated to 14/16/18. Swapping in 16/20 would
      // move every `sm` and `lg` tag.
      expect(tagSource).toContain('size-[14px]');
      expect(tagSource).toContain('size-[18px]');
      expect(boxSource).not.toContain('size-[18px]');
      expect(boxSource).toContain('size-semantic-2xl'); // 20 — absent from TagCheckbox
    });

    it('has a constant radius, where Checkbox varies radius with size', () => {
      expect(tagSource).toContain('rounded-xs');
      expect(tagSource).not.toContain('rounded-xxs');
      expect(boxSource).toContain('rounded-xxs');
      expect(boxSource).toContain('rounded-xs');
    });

    it('keeps a brand stroke when checked, where Checkbox drops the stroke', () => {
      expect(tagSource).toContain('inset-ring-semantic-border-brand-alt');
      expect(boxSource).toContain('border-0');
      expect(boxSource).not.toContain('border-brand-alt');
    });

    it('darkens on hover, where Checkbox has no hover treatment at all', () => {
      expect(tagSource).toContain('hover:bg-semantic-bg-brand-solid-hover');
      expect(boxSource).not.toContain('hover:');
    });

    it('strokes with inset-ring, where Checkbox uses a real border', () => {
      // Matched on the quoted class form: both files *mention* inset-ring in prose,
      // but only TagCheckbox emits it.
      expect(tagSource).toMatch(/'inset-ring\b/);
      expect(boxSource).not.toMatch(/'inset-ring\b/);
      expect(boxSource).toMatch(/'border border-semantic-border-primary/);
    });

    it('has no indeterminate state, which Checkbox publishes 8 variants of', () => {
      expect(tagSource).not.toMatch(/indeterminate/i);
      expect(tagComponent).not.toMatch(/indeterminate/i);
      // Checkbox implements it as a prop, a DOM property and aria-checked="mixed".
      expect(boxComponent).toMatch(/indeterminate\?: boolean/);
      expect(boxComponent).toMatch(/\.indeterminate = indeterminate/);
      expect(boxComponent).toMatch(/aria-checked=\{indeterminate \? 'mixed'/);
    });

    it('is still private to Tag and still its only consumer', () => {
      const barrel = readFileSync(resolve(__dirname, '../Tag/index.ts'), 'utf8');
      expect(barrel).not.toMatch(/^export\b[^\n]*\bTagCheckbox\b/m);
    });
  });

  it('declares no class strings in the component file', () => {
    const source = readFileSync(resolve(__dirname, 'Checkbox.tsx'), 'utf8');
    expect(source).not.toMatch(/className=["'][a-z]/);
  });

  it('matches its rendered markup', () => {
    const { container } = render(
      <Checkbox
        size="md"
        checked
        checkIcon={<Tick />}
        label="Remember me"
        supportingText="Save my login details for next time."
        id="terms"
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
