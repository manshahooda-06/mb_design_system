import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BeneficiarySelectChip } from './BeneficiarySelectChip';
import { BENEFICIARY_SELECT_CHIP_DEVICES } from './constants';

const NAME = 'Aarav Sharma';

function setup(props: Partial<Parameters<typeof BeneficiarySelectChip>[0]> = {}) {
  return render(<BeneficiarySelectChip name={NAME} data-testid="chip" {...props} />);
}

const chip = () => screen.getByTestId('chip');
const nameOf = () => screen.getByText(NAME);

describe('BeneficiarySelectChip', () => {
  describe('rendering', () => {
    it('implements exactly the two devices Figma publishes', () => {
      expect([...BENEFICIARY_SELECT_CHIP_DEVICES]).toEqual(['mobile', 'desktop']);
    });

    it('renders its name', () => {
      setup();
      expect(nameOf()).toBeInTheDocument();
    });

    it('defaults to mobile, unselected', () => {
      setup();
      expect(chip().className).toContain('max-w-[132px]');
      expect(chip().className).toContain('bg-semantic-bg-primary');
    });

    /*
     * Figma draws a chip, not a control, and publishes no interaction — so the root is
     * inert and claims no role. Selection is the caller's; see below.
     */
    it('renders an inert element, not a control', () => {
      setup();
      expect(chip().tagName).toBe('SPAN');
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(chip()).not.toHaveAttribute('aria-pressed');
    });

    it('passes native props through to the root', () => {
      setup({ id: 'chip-aarav' });
      expect(chip().id).toBe('chip-aarav');
    });

    it('forwards a ref to the root', () => {
      const ref = createRef<HTMLSpanElement>();
      render(<BeneficiarySelectChip ref={ref} name={NAME} />);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });

    it('sets displayName', () => {
      expect((BeneficiarySelectChip as { displayName?: string }).displayName).toBe(
        'BeneficiarySelectChip',
      );
    });

    it('renders no avatar slot unless given one', () => {
      const { container } = setup();
      expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('renders the avatar decoratively — the name carries the meaning', () => {
      const { container } = setup({ avatar: <svg data-testid="avatar" /> });
      expect(screen.getByTestId('avatar')).toBeInTheDocument();
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });
  });

  /*
   * The chip hugs its content up to a cap rather than being a fixed size, and the
   * padding is asymmetric — Figma insets the avatar side less than the text side.
   */
  describe('geometry — Figma’s `Device` axis', () => {
    it('caps mobile at 132 and desktop at 200', () => {
      const { unmount } = setup();
      expect(chip().className).toContain('max-w-[132px]');
      unmount();
      setup({ device: 'desktop' });
      expect(chip().className).toContain('max-w-[200px]');
    });

    it('applies Figma’s asymmetric padding per device', () => {
      const { unmount } = setup();
      // 8 / 12 on mobile.
      expect(chip().className).toContain('ps-semantic-md');
      expect(chip().className).toContain('pe-semantic-lg');
      expect(chip().className).toContain('py-semantic-md');
      unmount();
      setup({ device: 'desktop' });
      // 12 / 16 on desktop.
      expect(chip().className).toContain('ps-semantic-lg');
      expect(chip().className).toContain('pe-semantic-xl');
      expect(chip().className).toContain('py-semantic-lg');
    });

    it('keeps the same 8px gap and full radius on both devices', () => {
      for (const device of BENEFICIARY_SELECT_CHIP_DEVICES) {
        const { unmount } = setup({ device });
        expect(chip().className, device).toContain('gap-semantic-md');
        expect(chip().className, device).toContain('rounded-full');
        unmount();
      }
    });

    it('carries elevation-1 on both devices', () => {
      for (const device of BENEFICIARY_SELECT_CHIP_DEVICES) {
        const { unmount } = setup({ device });
        expect(chip().className, device).toContain('shadow-elevation-1');
        unmount();
      }
    });

    /*
     * An inset ring rather than a border: Figma's 132 frame is 8 + 24 + 8 + text + 12,
     * which leaves no room for a border box.
     */
    it('draws the stroke as an inset ring', () => {
      setup();
      expect(chip().className).toContain('inset-ring');
      expect(chip().className).not.toMatch(/\bborder-/);
    });
  });

  describe('typography', () => {
    it('applies 14/20 on mobile and 16/24 on desktop, weight 500 in both', () => {
      const { unmount } = setup();
      expect(nameOf().className).toContain('text-mobile-body-md');
      expect(nameOf().className).toContain('font-medium');
      unmount();
      setup({ device: 'desktop' });
      expect(nameOf().className).toContain('text-desktop-body-sm');
      expect(nameOf().className).toContain('font-medium');
    });

    it('truncates the name to one line', () => {
      setup({ name: 'A beneficiary name far too long for the chip to show in full' });
      const name = screen.getByText(/A beneficiary name/);
      expect(name.className).toContain('truncate');
      // `min-width: auto` on a flex child would otherwise stop it shrinking.
      expect(name.className).toContain('min-w-semantic-none');
    });
  });

  /*
   * Figma's `State` axis changes three things at once on the chip — surface, stroke and
   * text — where the selector changes only the stroke and the name's weight.
   */
  describe('state — Figma’s `State` axis', () => {
    it('tints the surface and stroke when selected', () => {
      setup({ selected: true });
      // brand/25 has no semantic alias of any role; same class InputDropdown documents.
      expect(chip().className).toContain('bg-brand-25');
      expect(chip().className).toContain('inset-ring-semantic-border-brand-alt');
    });

    it('keeps a white surface and grey stroke when unselected', () => {
      setup();
      expect(chip().className).toContain('bg-semantic-bg-primary');
      expect(chip().className).toContain('inset-ring-gray-light-50');
      expect(chip().className).not.toContain('bg-brand-25');
    });

    it('recolours the name with selection', () => {
      const { unmount } = setup();
      expect(nameOf().className).toContain('text-semantic-text-primary');
      unmount();
      setup({ selected: true });
      expect(nameOf().className).toContain('text-semantic-text-brand-tertiary');
    });

    it('applies the state on both devices', () => {
      for (const device of BENEFICIARY_SELECT_CHIP_DEVICES) {
        const { unmount } = setup({ device, selected: true });
        expect(chip().className, device).toContain('bg-brand-25');
        unmount();
      }
    });
  });

  /*
   * The avatar's background is Avatar's own axis, flipped by this chip's state. The
   * chip does not restyle what it is handed, so this documents the pairing rather than
   * enforcing it.
   */
  describe('avatar pairing', () => {
    /*
     * There is no built-in avatar and no default: whatever the caller passes is what
     * renders, and nothing in the component substitutes for it. Asserted because a
     * hardcoded avatar in a story once made it look otherwise.
     */
    it('renders the caller\u2019s node verbatim, with nothing substituted', () => {
      const { container } = setup({ avatar: <img data-testid="avatar" src="/photo.png" alt="" /> });
      const slot = container.querySelector('[aria-hidden="true"]');
      expect(slot?.children).toHaveLength(1);
      expect(slot?.firstElementChild).toBe(screen.getByTestId('avatar'));
      expect(screen.getByTestId('avatar').tagName).toBe('IMG');
    });

    it('gives each instance its own avatar', () => {
      render(
        <>
          <BeneficiarySelectChip name="Ravi Sharma" avatar={<svg data-testid="avatar-father" />} />
          <BeneficiarySelectChip name="Meera Sharma" avatar={<svg data-testid="avatar-mother" />} />
        </>,
      );
      expect(screen.getByTestId('avatar-father')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-mother')).toBeInTheDocument();
    });

    it('does not resize or restyle the avatar it is given', () => {
      const { container } = setup({
        selected: true,
        avatar: <span data-testid="avatar" className="size-semantic-3xl" />,
      });
      expect(screen.getByTestId('avatar').className).toBe('size-semantic-3xl');
      expect(container.querySelector('[aria-hidden="true"]')?.className).toContain('shrink-0');
    });
  });

  /*
   * The chip is inert by design. `asChild` is not offered because the chip always
   * renders an avatar and a name, and Slot merges props onto exactly one element —
   * so a caller who needs selection supplies their own control around it.
   */
  describe('selection is the caller\u2019s', () => {
    it('works inside a caller-supplied button, styling intact', async () => {
      const onClick = vi.fn();
      render(
        <button type="button" aria-pressed onClick={onClick}>
          <BeneficiarySelectChip name={NAME} selected data-testid="chip" />
        </button>,
      );
      const button = screen.getByRole('button', { name: NAME });
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(chip().className).toContain('rounded-full');
      expect(chip().className).toContain('bg-brand-25');
      await userEvent.click(button);
      expect(onClick).toHaveBeenCalledOnce();
    });
  });

  describe('class overrides', () => {
    it('lets className win over a variant class', () => {
      setup({ className: 'rounded-md' });
      expect(chip().className).toContain('rounded-md');
      expect(chip().className).not.toContain('rounded-full');
    });

    it('targets each slot through classNames', () => {
      const { container } = setup({
        avatar: <svg />,
        classNames: { root: 'slot-root', avatar: 'slot-avatar', name: 'slot-name' },
      });
      expect(chip().className).toContain('slot-root');
      expect(container.querySelector('.slot-avatar')).not.toBeNull();
      expect(nameOf().className).toContain('slot-name');
    });
  });

  /*
   * Figma publishes no hover, focus, pressed or disabled treatment across the 4.
   * Asserted so one cannot arrive later as an invention.
   */
  describe('no state axis beyond State', () => {
    it('binds no interaction state', () => {
      const { container } = setup({ selected: true, avatar: <svg /> });
      const classes = [...container.querySelectorAll('*')]
        .map((el) => el.getAttribute('class') ?? '')
        .concat(chip().className)
        .join(' ');
      for (const state of ['hover:', 'focus:', 'focus-visible:', 'active:', 'disabled:']) {
        expect(classes, state).not.toContain(state);
      }
    });
  });
});
