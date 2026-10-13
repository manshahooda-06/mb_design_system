import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tag, type TagSize } from './Tag';

const tag = () => screen.getByTestId('tag');
const close = () => screen.getByRole('button', { name: 'Remove' });
const checkbox = () => screen.getByRole('checkbox');

const SIZES: TagSize[] = ['sm', 'md', 'lg'];

function setup(props: Partial<Parameters<typeof Tag>[0]> = {}) {
  return render(<Tag label="Label" data-testid="tag" {...props} />);
}

describe('Tag', () => {
  describe('rendering', () => {
    it('renders its label', () => {
      setup();
      expect(screen.getByText('Label')).toBeInTheDocument();
    });

    it('renders as a span, not a button — Figma draws no interactive root', () => {
      setup();
      expect(tag().tagName).toBe('SPAN');
    });

    it('renders nothing but the label by default', () => {
      setup();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('passes native props through to the root', () => {
      setup({ id: 'chip' });
      expect(tag().id).toBe('chip');
    });
  });

  describe('the root has no state treatment — Figma publishes none of the 72', () => {
    it('carries no hover, focus, active or disabled classes', () => {
      setup({ onRemove: () => {} });
      const { className } = tag();
      for (const state of ['hover:', 'focus:', 'focus-visible:', 'active:', 'disabled:']) {
        expect(className).not.toContain(state);
      }
    });

    it('carries no shadow — no effect is bound to any of the 72 variants', () => {
      setup();
      expect(tag().className).not.toContain('shadow');
    });

    it('is always the outlined white surface — there is no filled or tonal type', () => {
      setup();
      const { className } = tag();
      expect(className).toContain('bg-semantic-bg-primary');
      expect(className).toContain('inset-ring-semantic-border-primary');
    });

    it('uses an inside ring, not a border — the box is content-sized', () => {
      // A CSS border would add 2px to a hug height Figma measures at 26/24/28.
      setup();
      expect(tag().className).toContain('inset-ring');
      expect(tag().className).not.toMatch(/(^|\s)border(\s|$)/);
    });

    it('never pins a height — every height is py + 20 + py', () => {
      for (const size of SIZES) {
        const { unmount } = setup({ size });
        expect(tag().className).not.toMatch(/(^|\s)h-/);
        unmount();
      }
    });

    it('rounds to radius-sm 6 at every size', () => {
      for (const size of SIZES) {
        const { unmount } = setup({ size });
        expect(tag().className).toContain('rounded-sm');
        unmount();
      }
    });
  });

  describe('vertical padding — size only, and not monotonic', () => {
    it.each([
      ['sm', 'py-[3px]'],
      ['md', 'py-semantic-xxs'],
      ['lg', 'py-semantic-xs'],
    ] as const)('%s uses %s', (size, cls) => {
      setup({ size });
      expect(tag().className).toContain(cls);
    });

    it('gives md less vertical padding than sm — heights are 26/24/28', () => {
      // The size scale is genuinely non-monotonic in Figma; md is the shortest tag.
      const { unmount } = setup({ size: 'sm' });
      expect(tag().className).toContain('py-[3px]');
      unmount();
      setup({ size: 'md' });
      expect(tag().className).toContain('py-semantic-xxs');
    });
  });

  describe('left inset — size × leading element, never the action', () => {
    const PL: Record<TagSize, Record<string, string>> = {
      sm: {
        none: 'pl-semantic-md',
        dot: 'pl-semantic-sm',
        media: 'pl-semantic-xs',
        checkbox: 'pl-[5px]',
      },
      md: {
        none: 'pl-[9px]',
        dot: 'pl-[7px]',
        media: 'pl-[5px]',
        checkbox: 'pl-semantic-xs',
      },
      lg: {
        none: 'pl-[10px]',
        dot: 'pl-[9px]',
        media: 'pl-[7px]',
        checkbox: 'pl-[5px]',
      },
    };

    it.each(SIZES)('%s: no leading element', (size) => {
      setup({ size });
      expect(tag().className).toContain(PL[size].none);
    });

    it.each(SIZES)('%s: dot', (size) => {
      setup({ size, iconVariant: 'dot' });
      expect(tag().className).toContain(PL[size].dot);
    });

    it.each(SIZES)('%s: 16px media', (size) => {
      setup({ size, iconVariant: 'avatar', icon: <svg /> });
      expect(tag().className).toContain(PL[size].media);
    });

    it.each(SIZES)('%s: checkbox wins over any icon', (size) => {
      setup({ size, selectable: true, iconVariant: 'avatar', icon: <svg /> });
      expect(tag().className).toContain(PL[size].checkbox);
    });

    it('does not change with the action', () => {
      // pl is independent of Action in all 72 Figma variants.
      const { unmount } = setup({ size: 'lg' });
      const plain = tag().className;
      unmount();
      const withClose = setup({ size: 'lg', onRemove: () => {} });
      expect(tag().className).toContain('pl-[10px]');
      withClose.unmount();
      setup({ size: 'lg', count: 5 });
      expect(tag().className).toContain('pl-[10px]');
      expect(plain).toContain('pl-[10px]');
    });

    it('treats flag and avatar as the same inset — geometrically identical in Figma', () => {
      const { unmount } = setup({ size: 'md', iconVariant: 'flag', icon: <svg /> });
      expect(tag().className).toContain('pl-[5px]');
      unmount();
      setup({ size: 'md', iconVariant: 'avatar', icon: <svg /> });
      expect(tag().className).toContain('pl-[5px]');
    });
  });

  describe('right inset — size × action, never the leading element', () => {
    it.each([
      ['sm', 'pr-semantic-md'],
      ['md', 'pr-[9px]'],
      ['lg', 'pr-[10px]'],
    ] as const)('%s text-only uses %s', (size, cls) => {
      setup({ size });
      expect(tag().className).toContain(cls);
    });

    it.each(SIZES)('%s with a close button uses pr 4', (size) => {
      setup({ size, onRemove: () => {} });
      expect(tag().className).toContain('pr-semantic-xs');
    });

    it.each([
      ['sm', 'pr-semantic-xs'],
      ['md', 'pr-[3px]'],
      ['lg', 'pr-semantic-xs'],
    ] as const)('%s with a count uses %s', (size, cls) => {
      setup({ size, count: 5 });
      expect(tag().className).toContain(cls);
    });

    it('does not change with the leading element', () => {
      for (const iconVariant of ['dot', 'avatar'] as const) {
        const { unmount } = setup({ size: 'md', iconVariant, icon: <svg /> });
        expect(tag().className).toContain('pr-[9px]');
        unmount();
      }
    });
  });

  describe('gaps', () => {
    it.each([
      ['sm', 'gap-semantic-xs'],
      ['md', 'gap-[5px]'],
      ['lg', 'gap-semantic-sm'],
    ] as const)('%s content gap is %s', (size, cls) => {
      setup({ size, count: 5 });
      const content = screen.getByText('Label').parentElement as HTMLElement;
      expect(content.className).toContain(cls);
    });

    it('adds a 3px root gap only for the close button', () => {
      const { unmount } = setup({ onRemove: () => {} });
      expect(tag().className).toContain('gap-[3px]');
      unmount();
      setup({ count: 5 });
      expect(tag().className).not.toContain('gap-[3px]');
    });
  });

  describe('typography', () => {
    it.each([
      ['sm', 'text-mobile-body-sm'],
      ['md', 'text-mobile-body-md'],
      ['lg', 'text-mobile-body-md'],
    ] as const)('%s label ramp is %s', (size, cls) => {
      setup({ size });
      expect(screen.getByText('Label').className).toContain(cls);
    });

    it('is Medium in text-secondary at every size', () => {
      for (const size of SIZES) {
        const { unmount } = setup({ size });
        const label = screen.getByText('Label');
        expect(label.className).toContain('font-medium');
        expect(label.className).toContain('text-semantic-text-secondary');
        unmount();
      }
    });

    it('never truncates — Figma lets the tag grow instead', () => {
      setup();
      const label = screen.getByText('Label');
      expect(label.className).toContain('whitespace-nowrap');
      expect(label.className).not.toContain('truncate');
      expect(label.className).not.toContain('text-ellipsis');
    });
  });

  describe('leading icon', () => {
    it('renders nothing when no variant is given', () => {
      setup({ icon: <svg data-testid="glyph" /> });
      expect(screen.queryByTestId('glyph')).not.toBeInTheDocument();
    });

    it('draws a fixed 6px success dot with no swap slot', () => {
      setup({ iconVariant: 'dot', icon: <svg data-testid="glyph" /> });
      // Figma's dot has no instance-swap property, so a caller's node is ignored.
      expect(screen.queryByTestId('glyph')).not.toBeInTheDocument();
      const box = screen.getByText('Label').previousElementSibling as HTMLElement;
      expect(box.className).toContain('size-semantic-md');
      const dot = box.firstElementChild as HTMLElement;
      expect(dot.className).toContain('size-semantic-sm');
      // The box must not stretch its own child: `*:size-full` would round the 6px
      // dot up to the 8px box, which measurement caught.
      expect(box.className).not.toContain('*:size-full');
      expect(dot.className).toContain('rounded-full');
      expect(dot.className).toContain('bg-semantic-fg-success-secondary');
    });

    it('sizes flag and avatar at 16px and clips both', () => {
      for (const iconVariant of ['flag', 'avatar'] as const) {
        const { unmount } = setup({ iconVariant, icon: <svg data-testid="glyph" /> });
        const box = screen.getByTestId('glyph').parentElement as HTMLElement;
        expect(box.className).toContain('size-semantic-xl');
        expect(box.className).toContain('overflow-clip');
        unmount();
      }
    });

    it('rounds the avatar and not the flag', () => {
      const { unmount } = setup({ iconVariant: 'avatar', icon: <svg data-testid="glyph" /> });
      expect((screen.getByTestId('glyph').parentElement as HTMLElement).className).toContain(
        'rounded-full',
      );
      unmount();
      setup({ iconVariant: 'flag', icon: <svg data-testid="glyph" /> });
      expect((screen.getByTestId('glyph').parentElement as HTMLElement).className).not.toContain(
        'rounded-full',
      );
    });

    it('does not scale any icon with size — Figma holds 8 and 16', () => {
      for (const size of SIZES) {
        const { unmount } = setup({ size, iconVariant: 'avatar', icon: <svg data-testid="g" /> });
        expect((screen.getByTestId('g').parentElement as HTMLElement).className).toContain(
          'size-semantic-xl',
        );
        unmount();
      }
    });
  });

  describe('count', () => {
    it('renders the value in a tertiary pill with a 3px radius', () => {
      setup({ count: 5 });
      const pill = screen.getByText('5');
      expect(pill.className).toContain('bg-semantic-bg-tertiary');
      expect(pill.className).toContain('rounded-[3px]');
      expect(pill.className).toContain('text-semantic-text-secondary');
    });

    it.each([
      ['sm', 'px-semantic-xs', 'text-mobile-banner-body-lg'],
      ['md', 'px-[5px]', 'text-mobile-banner-body-lg'],
      ['lg', 'px-semantic-sm', 'text-mobile-body-md'],
    ] as const)('%s uses %s and %s', (size, px, ramp) => {
      setup({ size, count: 5 });
      const pill = screen.getByText('5');
      expect(pill.className).toContain(px);
      expect(pill.className).toContain(ramp);
    });

    it('does not pin its width, so a two-digit count fits', () => {
      // Figma pins the sm and md text boxes to one character (w-8 / w-9) and clips
      // the sm one; neither is reproduced.
      setup({ size: 'sm', count: 42 });
      const pill = screen.getByText('42');
      expect(pill.className).not.toMatch(/(^|\s)w-\[/);
      expect(pill.className).not.toMatch(/(^|\s)h-\[/);
    });

    it('renders no close button', () => {
      setup({ count: 5 });
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('yields to onRemove when both are given — Figma has one Action axis', () => {
      setup({ count: 5, onRemove: () => {} });
      expect(close()).toBeInTheDocument();
      expect(screen.queryByText('5')).not.toBeInTheDocument();
      // and the right inset follows the close, not the count
      expect(tag().className).toContain('pr-semantic-xs');
    });
  });

  describe('close', () => {
    it('is a real button with an accessible name', () => {
      setup({ onRemove: () => {} });
      expect(close().tagName).toBe('BUTTON');
      expect(close()).toHaveAttribute('type', 'button');
    });

    it('takes a custom accessible name', () => {
      setup({ onRemove: () => {}, removeLabel: 'Remove Design' });
      expect(screen.getByRole('button', { name: 'Remove Design' })).toBeInTheDocument();
    });

    it('wraps a 10px glyph in spacing-xxs padding — a flat 14px box at every size', () => {
      for (const size of SIZES) {
        const { unmount } = setup({ size, onRemove: () => {}, closeIcon: <svg data-testid="x" /> });
        expect(close().className).toContain('p-semantic-xxs');
        expect((screen.getByTestId('x').parentElement as HTMLElement).className).toContain(
          'size-[10px]',
        );
        unmount();
      }
    });

    it('reproduces the close the Tag set instantiates, not _Tag close X', () => {
      // _Tag close X has a 14/16/20 ramp, a 3px radius and a gray-50 hover. The Tag
      // set does not use it, so neither do we.
      setup({ onRemove: () => {} });
      expect(close().className).not.toContain('rounded-');
      expect(close().className).not.toContain('hover:');
    });

    it('carries the shared focus ring, which Figma does not draw', () => {
      setup({ onRemove: () => {} });
      const { className } = close();
      expect(className).toContain('focus-visible:ring-2');
      expect(className).toContain('focus-visible:ring-semantic-focus-ring');
    });

    it('hides the glyph from assistive technology', () => {
      setup({ onRemove: () => {}, closeIcon: <svg data-testid="x" /> });
      expect(screen.getByTestId('x').parentElement).toHaveAttribute('aria-hidden');
    });

    it('calls onRemove when clicked', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      setup({ onRemove });
      await user.click(close());
      expect(onRemove).toHaveBeenCalledOnce();
    });

    it('is reachable and activatable by keyboard', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      setup({ onRemove });
      await user.tab();
      expect(close()).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(onRemove).toHaveBeenCalledOnce();
    });

    it('is disabled when the tag is', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      setup({ onRemove, disabled: true });
      expect(close()).toBeDisabled();
      await user.click(close());
      expect(onRemove).not.toHaveBeenCalled();
    });

    it('sits outside Content, as Figma nests it', () => {
      setup({ onRemove: () => {} });
      const content = screen.getByText('Label').parentElement as HTMLElement;
      expect(content.contains(close())).toBe(false);
      expect(tag().contains(close())).toBe(true);
    });

    it('places the count inside Content, unlike the close', () => {
      setup({ count: 5 });
      const content = screen.getByText('Label').parentElement as HTMLElement;
      expect(content.contains(screen.getByText('5'))).toBe(true);
    });
  });

  describe('checkbox', () => {
    it('renders only when selectable', () => {
      const { unmount } = setup();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      unmount();
      setup({ selectable: true });
      expect(checkbox()).toBeInTheDocument();
    });

    it('reports its checked state', () => {
      const { unmount } = setup({ selectable: true });
      expect(checkbox()).toHaveAttribute('aria-checked', 'false');
      unmount();
      setup({ selectable: true, selected: true });
      expect(checkbox()).toHaveAttribute('aria-checked', 'true');
    });

    it.each([
      ['sm', 'size-[14px]'],
      ['md', 'size-semantic-xl'],
      ['lg', 'size-[18px]'],
    ] as const)('%s box is %s', (size, cls) => {
      setup({ size, selectable: true });
      expect(checkbox().className).toContain(cls);
    });

    it('is brand-filled when checked and grey when not', () => {
      const { unmount } = setup({ selectable: true });
      expect(checkbox().className).toContain('bg-semantic-bg-primary');
      unmount();
      setup({ selectable: true, selected: true });
      expect(checkbox().className).toContain('bg-semantic-bg-brand-solid');
    });

    it('hovers only when checked — unchecked hover is identical to default in Figma', () => {
      const { unmount } = setup({ selectable: true });
      expect(checkbox().className).not.toContain('hover:bg-semantic-bg-brand-solid-hover');
      unmount();
      setup({ selectable: true, selected: true });
      expect(checkbox().className).toContain('hover:bg-semantic-bg-brand-solid-hover');
    });

    it('greys out when disabled, checked or not', () => {
      for (const selected of [false, true]) {
        const { unmount } = setup({ selectable: true, selected, disabled: true });
        expect(checkbox().className).toContain('bg-semantic-bg-disabled-subtle');
        expect(checkbox()).toBeDisabled();
        unmount();
      }
    });

    it('shows the tick only when checked', () => {
      const { unmount } = setup({ selectable: true, tickIcon: <svg data-testid="tick" /> });
      expect(screen.queryByTestId('tick')).not.toBeInTheDocument();
      unmount();
      setup({ selectable: true, selected: true, tickIcon: <svg data-testid="tick" /> });
      expect(screen.getByTestId('tick')).toBeInTheDocument();
    });

    it.each([
      ['sm', 'size-[10px]'],
      ['md', 'size-semantic-lg'],
      ['lg', 'size-[14px]'],
    ] as const)('%s tick is %s', (size, cls) => {
      setup({ size, selectable: true, selected: true, tickIcon: <svg data-testid="tick" /> });
      expect((screen.getByTestId('tick').parentElement as HTMLElement).className).toContain(cls);
    });

    it('carries the shared focus ring', () => {
      setup({ selectable: true });
      expect(checkbox().className).toContain('focus-visible:ring-semantic-focus-ring');
    });

    it('toggles through onSelectedChange', async () => {
      const user = userEvent.setup();
      const onSelectedChange = vi.fn();
      setup({ selectable: true, onSelectedChange });
      await user.click(checkbox());
      expect(onSelectedChange).toHaveBeenCalledWith(true);
    });

    it('is not exported from the package — it is private to Tag', () => {
      // Matches an export statement rather than the bare name, so the barrel can
      // still explain in a comment why it is absent.
      const exportsTagCheckbox = /^export\b[^\n]*\bTagCheckbox\b/m;
      const barrel = readFileSync(resolve(process.cwd(), 'src/components/Tag/index.ts'), 'utf8');
      expect(barrel).not.toMatch(exportsTagCheckbox);
      const entry = readFileSync(resolve(process.cwd(), 'src/index.ts'), 'utf8');
      expect(entry).not.toMatch(exportsTagCheckbox);
    });
  });

  describe('class overrides', () => {
    it('merges className onto the root', () => {
      setup({ className: 'mt-semantic-xl' });
      expect(tag().className).toContain('mt-semantic-xl');
    });

    it('reaches every slot through classNames', () => {
      setup({
        count: 5,
        selectable: true,
        iconVariant: 'dot',
        classNames: { root: 'r', content: 'c', label: 'l', icon: 'i', count: 'n', checkbox: 'b' },
      });
      expect(tag().className).toContain('r');
      expect(screen.getByText('Label').className).toContain('l');
      expect((screen.getByText('Label').parentElement as HTMLElement).className).toContain('c');
      expect(screen.getByText('5').className).toContain('n');
      expect(checkbox().className).toContain('b');
    });
  });

  it('matches its rendered markup', () => {
    const { container } = render(
      <Tag
        label="Olivia"
        size="md"
        iconVariant="avatar"
        icon={<svg />}
        onRemove={() => {}}
        closeIcon={<svg />}
      />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
