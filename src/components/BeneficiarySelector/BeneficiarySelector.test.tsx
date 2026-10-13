import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RadioGroup } from '../Radio';
import { BeneficiarySelector } from './BeneficiarySelector';
import { BENEFICIARY_SELECTOR_DEVICES } from './constants';

const NAME = 'Aarav Sharma';

function setup(props: Partial<Parameters<typeof BeneficiarySelector>[0]> = {}) {
  return render(<BeneficiarySelector name={NAME} data-testid="card" {...props} />);
}

const card = () => screen.getByTestId('card');
const nameOf = () => screen.getByText(NAME);
const radio = () => screen.getByRole('radio');

describe('BeneficiarySelector', () => {
  describe('rendering', () => {
    it('implements exactly the two devices Figma publishes', () => {
      expect([...BENEFICIARY_SELECTOR_DEVICES]).toEqual(['mobile', 'desktop']);
    });

    it('renders its name', () => {
      setup();
      expect(nameOf()).toBeInTheDocument();
    });

    it('defaults to mobile, unselected', () => {
      setup();
      expect(card().className).toContain('rounded-md');
      expect(card().className).toContain('inset-ring-gray-light-50');
    });

    it('passes native props through to the root', () => {
      setup({ id: 'card-aarav' });
      expect(card().id).toBe('card-aarav');
    });

    it('forwards a ref to the root', () => {
      const ref = createRef<HTMLDivElement>();
      render(<BeneficiarySelector ref={ref} name={NAME} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('sets displayName', () => {
      expect((BeneficiarySelector as { displayName?: string }).displayName).toBe(
        'BeneficiarySelector',
      );
    });

    /*
     * Width is not pinned. Figma's 244 and 342 are canvas widths — the same call
     * already documented for InputDropdown's 320.
     */
    it('does not pin a width', () => {
      for (const device of BENEFICIARY_SELECTOR_DEVICES) {
        const { unmount } = setup({ device });
        expect(card().className, device).not.toMatch(/\bw-\[/);
        unmount();
      }
    });
  });

  describe('geometry — Figma’s `Device` axis', () => {
    it('applies Figma’s padding, gap and radius per device', () => {
      const { unmount } = setup();
      expect(card().className).toContain('px-semantic-xl'); /* 16 */
      expect(card().className).toContain('py-semantic-2xl'); /* 20 */
      expect(card().className).toContain('gap-semantic-lg'); /* 12 */
      expect(card().className).toContain('rounded-md'); /* 8 */
      unmount();
      setup({ device: 'desktop' });
      expect(card().className).toContain('px-semantic-3xl'); /* 24 */
      expect(card().className).toContain('py-semantic-4xl'); /* 32 */
      expect(card().className).toContain('gap-semantic-xl'); /* 16 */
      expect(card().className).toContain('rounded-2xl'); /* 16 */
    });

    it('spaces the name from the meta row by 4 on mobile and 8 on desktop', () => {
      // Read off the content wrapper itself — the column that holds name over meta.
      const contentOf = (c: HTMLElement) => c.querySelector('.flex-col');
      const { container, unmount } = setup({ relation: 'Self' });
      expect(contentOf(container)?.className).toContain('gap-semantic-xs');
      unmount();
      const { container: desktop } = setup({ device: 'desktop', relation: 'Self' });
      expect(contentOf(desktop)?.className).toContain('gap-semantic-md');
    });

    it('carries elevation-1 and an inset ring on both devices', () => {
      for (const device of BENEFICIARY_SELECTOR_DEVICES) {
        const { unmount } = setup({ device });
        expect(card().className, device).toContain('shadow-elevation-1');
        expect(card().className, device).toContain('inset-ring');
        expect(card().className, device).not.toMatch(/\bborder-/);
        unmount();
      }
    });
  });

  describe('typography', () => {
    it('applies 14/20 on mobile and 20/28 on desktop to the name', () => {
      const { unmount } = setup();
      expect(nameOf().className).toContain('text-mobile-body-md');
      unmount();
      setup({ device: 'desktop' });
      expect(nameOf().className).toContain('text-desktop-body-md');
    });

    it('applies 12/20 on mobile and 16/24 on desktop to the meta row', () => {
      const { unmount } = setup({ relation: 'Self' });
      expect(screen.getByText('Self').parentElement?.className).toContain('text-mobile-body-sm');
      unmount();
      setup({ device: 'desktop', relation: 'Self' });
      expect(screen.getByText('Self').parentElement?.className).toContain('text-desktop-body-sm');
    });

    it('truncates the name to one line', () => {
      setup({ name: 'A beneficiary name far too long to fit on a single card line' });
      const name = screen.getByText(/A beneficiary name/);
      expect(name.className).toContain('truncate');
      expect(name.className).toContain('w-full');
    });
  });

  /*
   * Figma's `State` axis moves the stroke, and the name's weight and colour. It does
   * **not** tint the surface — unlike BeneficiarySelectChip.
   */
  describe('state — Figma’s `State` axis', () => {
    it('keeps a white surface when selected', () => {
      setup({ selected: true });
      expect(card().className).toContain('bg-semantic-bg-primary');
      expect(card().className).not.toContain('bg-brand-25');
    });

    it('switches the stroke to brand when selected', () => {
      setup({ selected: true });
      expect(card().className).toContain('inset-ring-semantic-border-brand-alt');
    });

    it('moves the name from medium/secondary to semibold/primary', () => {
      const { unmount } = setup();
      expect(nameOf().className).toContain('font-medium');
      // Reproduced as measured: Figma inherits text-secondary here, where the chip's
      // equivalent name is text-primary.
      expect(nameOf().className).toContain('text-semantic-text-secondary');
      unmount();
      setup({ selected: true });
      expect(nameOf().className).toContain('font-semibold');
      expect(nameOf().className).toContain('text-semantic-text-primary');
    });

    it('leaves the meta row’s colour alone', () => {
      for (const selected of [false, true]) {
        const { unmount } = setup({ selected, relation: 'Self' });
        expect(screen.getByText('Self').parentElement?.className).toContain(
          'text-semantic-text-secondary',
        );
        unmount();
      }
    });
  });

  describe('meta row — Figma’s relation / age / gender', () => {
    it('renders all three with the separator', () => {
      setup({ relation: 'Self', age: '22', gender: 'F' });
      expect(screen.getByText('Self')).toBeInTheDocument();
      expect(screen.getByText('|')).toBeInTheDocument();
      expect(screen.getByText('22')).toBeInTheDocument();
      expect(screen.getByText('F')).toBeInTheDocument();
    });

    it('omits the row entirely when none of the three is given', () => {
      const { container } = setup();
      // Discriminated by the meta row's own type step: on mobile the content wrapper
      // shares the 4px gap, so `gap-semantic-xs` alone would match either element.
      expect(container.querySelector('.text-mobile-body-sm')).toBeNull();
      expect(screen.queryByText('|')).not.toBeInTheDocument();
    });

    it.each([
      ['relation only', { relation: 'Self' }, ['Self']],
      ['age only', { age: '22' }, ['22']],
      ['gender only', { gender: 'F' }, ['F']],
      ['age and gender', { age: '22', gender: 'F' }, ['22', 'F']],
    ])('renders %s', (_label, props, expected) => {
      setup(props);
      for (const text of expected) expect(screen.getByText(text)).toBeInTheDocument();
    });

    /*
     * **Figma quirk, reproduced rather than corrected.** Figma wraps the relation and
     * the separator in the same `relationShow` gate, so the separator follows the
     * relation instead of sitting between two present values. A relation with no age
     * and no gender therefore renders a trailing `Self |`.
     */
    it('ties the separator to the relation, trailing pipe included', () => {
      const { unmount } = setup({ relation: 'Self' });
      expect(screen.getByText('|')).toBeInTheDocument();
      unmount();
      // And no separator at all when the relation is absent, even with age and gender.
      setup({ age: '22', gender: 'F' });
      expect(screen.queryByText('|')).not.toBeInTheDocument();
    });

    it('hides the separator from assistive technology', () => {
      setup({ relation: 'Self', age: '22' });
      expect(screen.getByText('|')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('badge — Figma’s `badgeShow`', () => {
    it('renders nothing unless given content', () => {
      setup();
      expect(screen.queryByText('Sponsored')).not.toBeInTheDocument();
    });

    /*
     * Figma publishes `badgeShow` but no badge text — "Sponsored" is typed into the
     * component. Taking a node keeps product copy out of the library.
     */
    it('pins the badge into the top-right corner', () => {
      setup({ badge: 'Sponsored' });
      const badge = screen.getByText('Sponsored');
      expect(badge.className).toContain('absolute');
      expect(badge.className).toContain('top-semantic-none');
      expect(badge.className).toContain('right-semantic-none');
    });

    it('rounds the badge’s diagonal corners to the card’s radius', () => {
      const { unmount } = setup({ badge: 'Sponsored' });
      expect(screen.getByText('Sponsored').className).toContain('rounded-tr-md');
      expect(screen.getByText('Sponsored').className).toContain('rounded-bl-md');
      unmount();
      setup({ device: 'desktop', badge: 'Sponsored' });
      expect(screen.getByText('Sponsored').className).toContain('rounded-tr-2xl');
      expect(screen.getByText('Sponsored').className).toContain('rounded-bl-2xl');
    });

    it('applies the purple pair and Figma’s tiny type steps', () => {
      const { unmount } = setup({ badge: 'Sponsored' });
      const mobile = screen.getByText('Sponsored');
      expect(mobile.className).toContain('bg-semantic-bg-creative-purple');
      expect(mobile.className).toContain('text-semantic-text-purple-secondary');
      expect(mobile.className).toContain('text-mobile-caption-sm'); /* 8/12 */
      unmount();
      setup({ device: 'desktop', badge: 'Sponsored' });
      expect(screen.getByText('Sponsored').className).toContain(
        'text-desktop-caption-sm',
      ); /* 12/16 */
    });
  });

  /*
   * The control is Mozaic's Radio, reused unchanged. Figma draws 24 on desktop, but the
   * canonical Checkbox set publishes only sm and md, so md is used on both devices and
   * the 4px desktop difference is a recorded deviation.
   */
  describe('control — the reused Radio', () => {
    it('renders a radio, not a checkbox', () => {
      setup();
      expect(radio()).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('reflects the selected state', () => {
      const { unmount } = setup();
      expect(radio()).not.toBeChecked();
      unmount();
      setup({ selected: true });
      expect(radio()).toBeChecked();
    });

    it('uses md on both devices — the documented desktop deviation', () => {
      for (const device of BENEFICIARY_SELECTOR_DEVICES) {
        const { container, unmount } = setup({ device });
        // Radio's md circle is 20; Figma's desktop control is 24.
        expect(container.querySelector('.size-semantic-2xl'), device).not.toBeNull();
        unmount();
      }
    });

    it('is labelled by the name rather than by nesting', () => {
      setup();
      // Radio renders its own <label>, so labels cannot nest — the association is by id.
      expect(radio()).toHaveAccessibleName(NAME);
      expect(radio().getAttribute('aria-labelledby')).toBe(nameOf().id);
    });

    it('reports selection through onSelectedChange', async () => {
      const onSelectedChange = vi.fn();
      setup({ onSelectedChange });
      await userEvent.click(radio());
      expect(onSelectedChange).toHaveBeenCalledWith(true);
    });

    it('coordinates with siblings inside a RadioGroup', async () => {
      render(
        <RadioGroup name="beneficiary" aria-label="Beneficiary">
          <BeneficiarySelector value="a" name="Aarav" />
          <BeneficiarySelector value="b" name="Diya" />
        </RadioGroup>,
      );
      const [first, second] = screen.getAllByRole('radio');
      await userEvent.click(second!);
      expect(second!).toBeChecked();
      expect(first!).not.toBeChecked();
    });
  });

  describe('avatar', () => {
    it('renders it decoratively — the name carries the meaning', () => {
      const { container } = setup({ avatar: <svg data-testid="avatar" /> });
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });

    it('does not resize what it is given', () => {
      setup({ avatar: <span data-testid="avatar" className="size-semantic-5xl" /> });
      expect(screen.getByTestId('avatar').className).toBe('size-semantic-5xl');
    });

    /*
     * There is no built-in avatar and no default: whatever the caller passes is what
     * renders, and nothing in the component substitutes for it. Asserted because a
     * hardcoded avatar in a story once made it look otherwise.
     */
    it('renders the caller\u2019s node verbatim, with nothing substituted', () => {
      const { container } = setup({
        avatar: <img data-testid="avatar" src="/photo.png" alt="" />,
      });
      const slot = container.querySelector('[aria-hidden="true"]');
      expect(slot?.children).toHaveLength(1);
      expect(slot?.firstElementChild).toBe(screen.getByTestId('avatar'));
      expect(screen.getByTestId('avatar').tagName).toBe('IMG');
    });

    it('gives each instance its own avatar', () => {
      render(
        <>
          <BeneficiarySelector name="Ravi Sharma" avatar={<svg data-testid="avatar-father" />} />
          <BeneficiarySelector name="Meera Sharma" avatar={<svg data-testid="avatar-mother" />} />
        </>,
      );
      expect(screen.getByTestId('avatar-father')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-mother')).toBeInTheDocument();
    });
  });

  /*
   * Nothing derives the avatar from the relation or the relation from the avatar. Both are
   * plain pass-through props, and these assert that they stay independent — a mismatched
   * pair renders exactly as given.
   */
  describe('avatar and relation are independent', () => {
    it.each(['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Daughter-in-law'])(
      'renders the relation %s verbatim',
      (relation) => {
        setup({ relation });
        expect(screen.getByText(relation)).toBeInTheDocument();
      },
    );

    it('renders a custom avatar and a custom relation together', () => {
      setup({ relation: 'Father', avatar: <svg data-testid="avatar" /> });
      expect(screen.getByText('Father')).toBeInTheDocument();
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
    });

    it('keeps the relation when the avatar changes', () => {
      const { rerender } = render(
        <BeneficiarySelector name={NAME} relation="Father" avatar={<svg data-testid="first" />} />,
      );
      rerender(
        <BeneficiarySelector name={NAME} relation="Father" avatar={<svg data-testid="second" />} />,
      );
      expect(screen.getByTestId('second')).toBeInTheDocument();
      expect(screen.queryByTestId('first')).not.toBeInTheDocument();
      expect(screen.getByText('Father')).toBeInTheDocument();
    });

    it('keeps the avatar when the relation changes', () => {
      const { rerender } = render(
        <BeneficiarySelector name={NAME} relation="Father" avatar={<svg data-testid="avatar" />} />,
      );
      rerender(
        <BeneficiarySelector name={NAME} relation="Mother" avatar={<svg data-testid="avatar" />} />,
      );
      expect(screen.getByText('Mother')).toBeInTheDocument();
      expect(screen.queryByText('Father')).not.toBeInTheDocument();
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
    });

    it('lets a relation disagree with its avatar, since neither derives the other', () => {
      setup({ relation: 'Self', avatar: <svg data-testid="father-illustration" /> });
      expect(screen.getByText('Self')).toBeInTheDocument();
      expect(screen.getByTestId('father-illustration')).toBeInTheDocument();
    });

    it('gives each instance its own relation', () => {
      render(
        <>
          <BeneficiarySelector name="Ravi Sharma" relation="Father" />
          <BeneficiarySelector name="Meera Sharma" relation="Mother" />
        </>,
      );
      expect(screen.getByText('Father')).toBeInTheDocument();
      expect(screen.getByText('Mother')).toBeInTheDocument();
    });
  });

  describe('class overrides', () => {
    it('lets className win over a variant class', () => {
      setup({ className: 'rounded-full' });
      expect(card().className).toContain('rounded-full');
      expect(card().className).not.toContain('rounded-md');
    });

    it('targets each slot through classNames', () => {
      const { container } = setup({
        avatar: <svg />,
        relation: 'Self',
        badge: 'Sponsored',
        classNames: {
          root: 'slot-root',
          leftSection: 'slot-left',
          avatar: 'slot-avatar',
          content: 'slot-content',
          name: 'slot-name',
          meta: 'slot-meta',
          badge: 'slot-badge',
          control: 'slot-control',
        },
      });
      expect(card().className).toContain('slot-root');
      for (const cls of [
        'slot-left',
        'slot-avatar',
        'slot-content',
        'slot-meta',
        'slot-badge',
        'slot-control',
      ]) {
        expect(container.querySelector(`.${cls}`), cls).not.toBeNull();
      }
      expect(nameOf().className).toContain('slot-name');
    });
  });

  /*
   * Figma publishes no hover, pressed or disabled treatment across the 4. The focus
   * ring present here belongs to the nested Radio, which brings its own.
   */
  describe('no state axis beyond State', () => {
    it('binds no hover, pressed or disabled state of its own', () => {
      setup({ selected: true, relation: 'Self', badge: 'Sponsored' });
      const own = card().className;
      for (const state of ['hover:', 'active:', 'disabled:']) {
        expect(own, state).not.toContain(state);
      }
    });
  });
});
