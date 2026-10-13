import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TopNavigationBar } from './TopNavigationBar';
import { TOP_NAVIGATION_BAR_CONSTANTS, TOP_NAVIGATION_BAR_DEVICES } from './constants';
import type { TopNavigationBarDevice } from './types';

const { TEXT } = TOP_NAVIGATION_BAR_CONSTANTS;

const Glyph = ({ name }: { name: string }) => <svg data-testid={`glyph-${name}`} />;

function setup(props: Partial<Parameters<typeof TopNavigationBar>[0]> = {}) {
  return render(<TopNavigationBar data-testid="nav" {...props} />);
}

const nav = () => screen.getByTestId('nav');

describe('TopNavigationBar', () => {
  describe('rendering', () => {
    it('implements exactly the two devices Figma publishes', () => {
      expect([...TOP_NAVIGATION_BAR_DEVICES]).toEqual(['mobile', 'desktop']);
    });

    it('renders as a header', () => {
      setup();
      expect(nav().tagName).toBe('HEADER');
    });

    it('is a banner landmark', () => {
      setup();
      expect(nav()).toHaveAttribute('role', 'banner');
      expect(screen.getByRole('banner')).toBe(nav());
    });

    it('defaults to mobile', () => {
      setup();
      // 64 is `semantic-7xl` exactly, which is why no arbitrary height appears.
      expect(nav().className).toContain('h-semantic-7xl');
    });

    it('passes native props through to the root', () => {
      setup({ id: 'app-header' });
      expect(nav().id).toBe('app-header');
    });

    it('forwards a ref to the header', () => {
      const ref = createRef<HTMLElement>();
      render(<TopNavigationBar ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLElement);
      expect(ref.current?.tagName).toBe('HEADER');
    });

    it('sets displayName', () => {
      expect((TopNavigationBar as { displayName?: string }).displayName).toBe('TopNavigationBar');
    });

    it('renders nothing but the shell when given no content', () => {
      const { container } = setup();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      // No middle slot either: Figma's flex row would otherwise reserve an empty column.
      expect(container.querySelector('.gap-semantic-xxs')).toBeNull();
    });
  });

  /*
   * Figma's `_Middle Slot` is the one structure both bars share, and it still differs
   * on every value between them.
   */
  describe('middle slot — shared, but not identical', () => {
    it.each(TOP_NAVIGATION_BAR_DEVICES)('renders heading and sub-heading on %s', (device) => {
      setup({ device, heading: TEXT.HEADING_PLACEHOLDER, subHeading: TEXT.SUBHEADING_PLACEHOLDER });
      expect(screen.getByText(TEXT.HEADING_PLACEHOLDER)).toBeInTheDocument();
      expect(screen.getByText(TEXT.SUBHEADING_PLACEHOLDER)).toBeInTheDocument();
    });

    it('applies the mobile type steps — 14/20 semibold over 10/16 medium', () => {
      setup({ heading: 'H', subHeading: 'S' });
      expect(screen.getByText('H').className).toContain('text-mobile-body-md');
      expect(screen.getByText('H').className).toContain('font-semibold');
      expect(screen.getByText('S').className).toContain('text-mobile-caption-md');
      expect(screen.getByText('S').className).toContain('font-medium');
    });

    it('applies the desktop type steps — 20/28 semibold over 16/24 light', () => {
      setup({ device: 'desktop', heading: 'H', subHeading: 'S' });
      expect(screen.getByText('H').className).toContain('text-desktop-body-md');
      expect(screen.getByText('H').className).toContain('font-semibold');
      expect(screen.getByText('S').className).toContain('text-desktop-body-sm');
      expect(screen.getByText('S').className).toContain('font-light');
    });

    /*
     * The sub-heading's colour differs between the bars, which is easy to assume is a
     * mistake and is not: Figma binds text-secondary on mobile and text-primary on
     * desktop.
     */
    it('colours the sub-heading per Figma — secondary on mobile, primary on desktop', () => {
      const { unmount } = setup({ subHeading: 'S' });
      expect(screen.getByText('S').className).toContain('text-semantic-text-secondary');
      unmount();
      setup({ device: 'desktop', subHeading: 'S' });
      expect(screen.getByText('S').className).toContain('text-semantic-text-primary');
    });

    it('sizes the heading glyph 16 on mobile and 20 on desktop', () => {
      const { container, unmount } = setup({ heading: 'H', headingStartIcon: <Glyph name="a" /> });
      expect(container.querySelector('.size-semantic-xl')).not.toBeNull();
      unmount();
      const { container: desktop } = setup({
        device: 'desktop',
        heading: 'H',
        headingStartIcon: <Glyph name="a" />,
      });
      expect(desktop.querySelector('.size-semantic-2xl')).not.toBeNull();
    });

    /* Figma draws a trailing glyph on the desktop heading row only. */
    it('draws the trailing heading glyph on desktop but not mobile', () => {
      const { unmount } = setup({ heading: 'H', headingEndIcon: <Glyph name="end" /> });
      expect(screen.queryByTestId('glyph-end')).not.toBeInTheDocument();
      unmount();
      setup({ device: 'desktop', heading: 'H', headingEndIcon: <Glyph name="end" /> });
      expect(screen.getByTestId('glyph-end')).toBeInTheDocument();
    });

    it('truncates the sub-heading to one line, as drawn', () => {
      setup({ subHeading: 'S' });
      expect(screen.getByText('S').className).toContain('truncate');
    });

    it('caps the middle slot at 360 on desktop only', () => {
      const { container, unmount } = setup({ device: 'desktop', heading: 'H' });
      expect(container.querySelector('.max-w-\\[360px\\]')).not.toBeNull();
      unmount();
      const { container: mobile } = setup({ heading: 'H' });
      expect(mobile.querySelector('.max-w-\\[360px\\]')).toBeNull();
    });
  });

  describe('mobile — Figma’s five *Show booleans, as presence', () => {
    it('renders the left icon only when given one', () => {
      const { unmount } = setup();
      expect(screen.queryByTestId('glyph-back')).not.toBeInTheDocument();
      unmount();
      setup({ leftIcon: <Glyph name="back" />, leftIconLabel: 'Go back' });
      expect(screen.getByTestId('glyph-back')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
    });

    it('sizes the left icon and right slots at 24', () => {
      const { container } = setup({
        leftIcon: <Glyph name="back" />,
        leftIconLabel: 'Back',
        rightSlots: [<Glyph key="a" name="a" />],
      });
      // 24 is `semantic-3xl`, so no arbitrary size is needed.
      expect(container.querySelectorAll('.size-semantic-3xl')).toHaveLength(2);
    });

    it('renders up to three right slots, in array order', () => {
      setup({
        rightSlots: [
          <Glyph key="1" name="1" />,
          <Glyph key="2" name="2" />,
          <Glyph key="3" name="3" />,
        ],
      });
      const order = screen.getAllByTestId(/^glyph-/).map((el) => el.getAttribute('data-testid'));
      expect(order).toEqual(['glyph-1', 'glyph-2', 'glyph-3']);
    });

    it('renders no right slots when the list is empty', () => {
      const { container } = setup({ rightSlots: [] });
      expect(container.querySelectorAll('.size-semantic-3xl')).toHaveLength(0);
    });

    /*
     * Figma hides this button by default, and it is not Mozaic's Button: 44 x 20 with
     * zero padding and bare brand text, where Button's smallest is 36 tall.
     */
    it('renders the action button only when given one, at Figma’s 44 x 20', () => {
      const { unmount } = setup();
      expect(screen.queryByRole('button', { name: TEXT.ACTION_LABEL })).not.toBeInTheDocument();
      unmount();
      setup({ action: { label: TEXT.ACTION_LABEL } });
      const button = screen.getByRole('button', { name: TEXT.ACTION_LABEL });
      expect(button.className).toContain('h-[20px]');
      expect(button.className).toContain('w-[44px]');
      expect(button.className).toContain('rounded-xs');
      expect(button.className).toContain('text-semantic-text-brand-secondary');
    });

    it('calls the action handler', async () => {
      const onClick = vi.fn();
      setup({ action: { label: TEXT.ACTION_LABEL, onClick } });
      await userEvent.click(screen.getByRole('button', { name: TEXT.ACTION_LABEL }));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('draws none of the desktop-only parts', () => {
      setup({
        searchPlaceholder: TEXT.SEARCH_PLACEHOLDER,
        account: { name: TEXT.ACCOUNT_NAME },
        actionItems: [{ type: 'cart', icon: <Glyph name="cart" />, label: 'Cart' }],
      });
      expect(screen.queryByText(TEXT.SEARCH_PLACEHOLDER)).not.toBeInTheDocument();
      expect(screen.queryByText(TEXT.ACCOUNT_NAME)).not.toBeInTheDocument();
      expect(screen.queryByTestId('glyph-cart')).not.toBeInTheDocument();
    });
  });

  describe('desktop', () => {
    const desktop = (props: Partial<Parameters<typeof TopNavigationBar>[0]> = {}) =>
      setup({ device: 'desktop', ...props });

    it('uses Figma’s 112 horizontal padding and elevation-2', () => {
      desktop();
      expect(nav().className).toContain('px-[112px]');
      expect(nav().className).toContain('shadow-elevation-2');
    });

    it('uses elevation-1 on mobile', () => {
      setup();
      expect(nav().className).toContain('shadow-elevation-1');
    });

    it('ships the MediBuddy logo by default, in Figma’s two boxes', () => {
      const { container } = desktop();
      expect(screen.getByRole('img', { name: 'MediBuddy' })).toBeInTheDocument();
      expect(container.querySelector('.h-\\[60px\\].w-\\[180px\\]')).not.toBeNull();
      expect(container.querySelector('.h-\\[44px\\].w-\\[172px\\]')).not.toBeNull();
    });

    it('lets a caller replace the logo', () => {
      desktop({ logo: <Glyph name="custom-logo" /> });
      expect(screen.getByTestId('glyph-custom-logo')).toBeInTheDocument();
      expect(screen.queryByRole('img', { name: 'MediBuddy' })).not.toBeInTheDocument();
    });

    it('drops the logo slot entirely for null', () => {
      const { container } = desktop({ logo: null });
      expect(screen.queryByRole('img', { name: 'MediBuddy' })).not.toBeInTheDocument();
      expect(container.querySelector('.w-\\[180px\\]')).toBeNull();
    });

    /*
     * Structurally not Mozaic's SearchBar — subtle fill, 12px radius, an inside stroke
     * and the glyph on the right, against SearchBar's white surface, elevation and
     * left-hand glyph.
     */
    it('renders the search field with Figma’s fill, radius and inside stroke', () => {
      const { container } = desktop({ searchPlaceholder: TEXT.SEARCH_PLACEHOLDER });
      const field = container.querySelector('.rounded-xl');
      expect(field?.className).toContain('bg-semantic-bg-secondary-subtle');
      expect(field?.className).toContain('inset-ring-gray-light-50');
      expect(field?.className).toContain('px-semantic-2xl');
      expect(field?.className).toContain('py-semantic-xl');
      expect(screen.getByText(TEXT.SEARCH_PLACEHOLDER)).toBeInTheDocument();
    });

    it('sizes the search glyph at 28 and puts it after the text', () => {
      const { container } = desktop({
        searchPlaceholder: 'p',
        searchIcon: <Glyph name="search" />,
      });
      const icon = container.querySelector('.size-\\[28px\\]');
      expect(icon).not.toBeNull();
      // The row is `justify-between`, so the glyph is last in document order.
      const row = container.querySelector('.justify-between');
      expect(row?.lastElementChild).toBe(icon);
    });

    it('omits the search field when neither placeholder nor glyph is given', () => {
      const { container } = desktop();
      expect(container.querySelector('.rounded-xl')).toBeNull();
    });

    it('renders both action items with accessible names', () => {
      desktop({
        actionItems: [
          { type: 'wallet', icon: <Glyph name="wallet" />, label: 'Wallet' },
          { type: 'cart', icon: <Glyph name="cart" />, label: 'Cart' },
        ],
      });
      expect(screen.getByRole('button', { name: 'Wallet' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cart' })).toBeInTheDocument();
    });

    /*
     * Figma's two badges differ in placement and padding, which its `actionType` axis
     * selects. The boxes prove the stroke cannot be a border: 8+41+8 = 57 and
     * 4+17+4 = 25, both exactly text plus padding.
     */
    it('places the wallet badge beside its glyph and the cart badge over it', () => {
      desktop({
        actionItems: [
          { type: 'wallet', icon: <Glyph name="w" />, label: 'Wallet', badge: '87586' },
          { type: 'cart', icon: <Glyph name="c" />, label: 'Cart', badge: '88' },
        ],
      });
      const wallet = screen.getByText('87586');
      const cart = screen.getByText('88');
      expect(wallet.className).toContain('px-semantic-md');
      expect(wallet.className).not.toContain('absolute');
      expect(cart.className).toContain('absolute');
      expect(cart.className).toContain('px-semantic-xs');
      expect(cart.className).toContain('left-semantic-2xl');
    });

    it('rings both badges without perturbing their box', () => {
      desktop({
        actionItems: [{ type: 'cart', icon: <Glyph name="c" />, label: 'Cart', badge: '8' }],
      });
      const badge = screen.getByText('8');
      // A ring paints outside the box; a border would have pushed 25x20 to 28x23.
      expect(badge.className).toContain('ring-[1.5px]');
      expect(badge.className).toContain('ring-semantic-fg-white');
      expect(badge.className).not.toMatch(/\bborder-/);
      expect(badge.className).toContain('bg-semantic-bg-brand-solid');
    });

    it('derives badge visibility from the value, so an empty badge cannot render', () => {
      const { unmount } = desktop({
        actionItems: [{ type: 'cart', icon: <Glyph name="c" />, label: 'Cart' }],
      });
      expect(screen.queryByText(/\d/)).not.toBeInTheDocument();
      unmount();
      desktop({
        actionItems: [{ type: 'cart', icon: <Glyph name="c" />, label: 'Cart', badge: '' }],
      });
      expect(screen.queryByText(/\d/)).not.toBeInTheDocument();
    });

    it('tucks the wallet glyph under its badge only when there is a badge', () => {
      const { container, unmount } = desktop({
        actionItems: [{ type: 'wallet', icon: <Glyph name="w" />, label: 'Wallet', badge: '1' }],
      });
      expect(container.querySelector('.-me-semantic-xl')).not.toBeNull();
      unmount();
      const { container: bare } = desktop({
        actionItems: [{ type: 'wallet', icon: <Glyph name="w" />, label: 'Wallet' }],
      });
      expect(bare.querySelector('.-me-semantic-xl')).toBeNull();
    });

    it('calls an action item’s handler', async () => {
      const onClick = vi.fn();
      desktop({
        actionItems: [{ type: 'cart', icon: <Glyph name="c" />, label: 'Cart', onClick }],
      });
      await userEvent.click(screen.getByRole('button', { name: 'Cart' }));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('renders the account block with both lines and the avatar', () => {
      desktop({
        account: {
          name: TEXT.ACCOUNT_NAME,
          description: TEXT.ACCOUNT_DESCRIPTION,
          avatar: <Glyph name="avatar" />,
          endIcon: <Glyph name="chevron" />,
        },
      });
      expect(screen.getByText(TEXT.ACCOUNT_NAME)).toBeInTheDocument();
      expect(screen.getByText(TEXT.ACCOUNT_DESCRIPTION)).toBeInTheDocument();
      expect(screen.getByTestId('glyph-avatar')).toBeInTheDocument();
      expect(screen.getByTestId('glyph-chevron')).toBeInTheDocument();
    });

    it('applies the account type steps — 14/20 semibold over 14/20 light', () => {
      desktop({
        account: { name: TEXT.ACCOUNT_NAME, description: TEXT.ACCOUNT_DESCRIPTION },
      });
      const name = screen.getByText(TEXT.ACCOUNT_NAME);
      expect(name.className).toContain('text-desktop-caption-md');
      expect(name.className).toContain('font-semibold');
      const description = screen.getByText(TEXT.ACCOUNT_DESCRIPTION);
      expect(description.className).toContain('font-light');
      expect(description.className).toContain('text-semantic-text-secondary');
    });

    /*
     * Figma draws a chevron, which implies a menu, but publishes no open state and no
     * menu — so the account is a control only when the caller gives it something to do.
     */
    it('is a control only when given a handler', async () => {
      const { unmount } = desktop({ account: { name: 'A' } });
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      unmount();
      const onClick = vi.fn();
      desktop({ account: { name: 'A', onClick } });
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('spaces the sections by Figma’s 48 and 32', () => {
      const { container } = desktop({ heading: 'H' });
      expect(container.querySelector('.gap-semantic-6xl')).not.toBeNull();
      expect(container.querySelector('.gap-semantic-4xl')).not.toBeNull();
    });
  });

  describe('accessibility', () => {
    it('names every icon-only control', () => {
      setup({
        leftIcon: <Glyph name="back" />,
        leftIconLabel: 'Go back',
      });
      expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
    });

    it('hides decorative glyphs from assistive technology', () => {
      const { container } = setup({ heading: 'H', headingStartIcon: <Glyph name="a" /> });
      const wrapper = container.querySelector('.size-semantic-xl');
      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });

    it('labels the shipped logo rather than leaving it decorative', () => {
      setup({ device: 'desktop' });
      // It is the product's name, not ornament, so it is announced.
      expect(screen.getByRole('img', { name: 'MediBuddy' })).toBeInTheDocument();
    });

    it('gives interactive parts the shared focus ring', () => {
      setup({ action: { label: TEXT.ACTION_LABEL } });
      // Figma publishes no focus state for either bar; shipping an unfocusable control
      // would be worse than this documented deviation.
      expect(screen.getByRole('button', { name: TEXT.ACTION_LABEL }).className).toContain(
        'focus-visible:ring-2',
      );
    });

    it('keeps the search field non-interactive — Figma draws no input', () => {
      setup({ device: 'desktop', searchPlaceholder: 'p' });
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('class overrides', () => {
    it('lets className win over a variant class on the root', () => {
      setup({ className: 'px-semantic-4xl' });
      const { className } = nav();
      expect(className).toContain('px-semantic-4xl');
      expect(className).not.toContain('px-semantic-xl');
    });

    it('targets each slot through classNames', () => {
      const { container } = setup({
        device: 'desktop',
        heading: 'H',
        subHeading: 'S',
        searchPlaceholder: 'p',
        searchIcon: <Glyph name="s" />,
        actionItems: [{ type: 'cart', icon: <Glyph name="c" />, label: 'Cart', badge: '1' }],
        account: { name: 'A', description: 'D', avatar: <Glyph name="av" /> },
        classNames: {
          root: 'slot-root',
          container: 'slot-container',
          middleSlot: 'slot-middle',
          headingText: 'slot-heading',
          subHeading: 'slot-sub',
          logo: 'slot-logo',
          search: 'slot-search',
          searchPlaceholder: 'slot-placeholder',
          searchIcon: 'slot-search-icon',
          rightSection: 'slot-right',
          actionItem: 'slot-action',
          badge: 'slot-badge',
          account: 'slot-account',
          accountName: 'slot-name',
          accountDescription: 'slot-description',
        },
      });
      for (const cls of [
        'slot-container',
        'slot-middle',
        'slot-heading',
        'slot-sub',
        'slot-logo',
        'slot-search',
        'slot-placeholder',
        'slot-search-icon',
        'slot-right',
        'slot-action',
        'slot-badge',
        'slot-account',
        'slot-name',
        'slot-description',
      ]) {
        expect(container.querySelector(`.${cls}`), cls).not.toBeNull();
      }
      expect(nav().className).toContain('slot-root');
    });
  });

  /*
   * Neither Figma node publishes a state axis. The focus ring is the one deliberate
   * addition, so hover and the rest are asserted absent to stop them arriving later.
   */
  describe('no state axis', () => {
    it.each(TOP_NAVIGATION_BAR_DEVICES)('binds no hover or pressed state on %s', (device) => {
      const { container } = setup({
        device: device as TopNavigationBarDevice,
        heading: 'H',
        subHeading: 'S',
        leftIcon: <Glyph name="b" />,
        leftIconLabel: 'Back',
        action: { label: 'GO' },
        searchPlaceholder: 'p',
        account: { name: 'A' },
        actionItems: [{ type: 'cart', icon: <Glyph name="c" />, label: 'Cart', badge: '1' }],
      });
      const classes = [...container.querySelectorAll('*')]
        .map((el) => el.getAttribute('class') ?? '')
        .join(' ');
      for (const state of ['hover:', 'active:', 'disabled:', 'aria-expanded']) {
        expect(classes, state).not.toContain(state);
      }
    });
  });
});
