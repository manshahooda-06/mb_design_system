import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Toast } from './Toast';
import { TOAST_STATES } from './constants';

const MESSAGE = 'Prescription uploaded';
const ACTION = 'Undo';

/**
 * Every measurement Figma publishes for `Toast` (node `2181:829`), as the class that
 * carries it. The suite reads from this table rather than repeating literals, so a value
 * can only be wrong here — where it sits beside the Figma number it came from.
 */
const FIGMA = {
  mobile: {
    width: 'w-[328px]' /* 328 */,
    radius: 'rounded-md' /* 8 */,
    paddingX: 'px-semantic-lg' /* 12 */,
    paddingY: 'py-semantic-md' /* 8 */,
    innerPadding: 'py-semantic-xxs' /* 2 */,
    icon: 'size-semantic-xl' /* 16 */,
    type: 'text-mobile-body-sm' /* 12/20 */,
    shadow: 'shadow-elevation-2',
  },
  desktop: {
    width: 'w-120' /* 480, the spacing-120 primitive */,
    radius: 'rounded-xl' /* 12 */,
    padding: 'p-semantic-xl' /* 16 */,
    icon: 'size-semantic-3xl' /* 24 */,
    type: 'text-desktop-body-sm' /* 16/24 */,
    shadow:
      '[box-shadow:0px_8px_44px_0px_#00000008,0px_6px_4px_0px_#00000005,0px_4px_18px_0px_#00000005,0px_0px_10px_0px_#00000005]',
  },
} as const;

/*
 * Stand-ins for the caller's glyphs. Figma's default is a plain stroked `circle` — its
 * icon library's placeholder for "an icon goes here" — so nothing ships and the suite
 * supplies these the way a consumer would.
 */
const LEFT = <svg data-testid="left" />;
const POST = <svg data-testid="post" />;

function setup(props: Partial<Parameters<typeof Toast>[0]> = {}) {
  return render(<Toast data-testid="toast" primaryText={MESSAGE} {...props} />);
}

/** A toast with every optional part present — the state most assertions need. */
function full(props: Partial<Parameters<typeof Toast>[0]> = {}) {
  return setup({ leftIcon: LEFT, postText: ACTION, postIcon: POST, ...props });
}

const root = () => screen.getByTestId('toast');
const iconSlots = (container: HTMLElement) => [...container.querySelectorAll('.inline-flex')];

describe('Toast', () => {
  describe('rendering', () => {
    it('implements exactly the states Figma publishes', () => {
      expect([...TOAST_STATES]).toEqual(['mobile', 'desktop']);
    });

    it('defaults to mobile', () => {
      setup();
      expect(root().className).toContain(FIGMA.mobile.width);
      expect(root().className).toContain(FIGMA.mobile.radius);
    });

    it('renders its primary text', () => {
      setup();
      expect(screen.getByText(MESSAGE)).toBeInTheDocument();
    });

    it('passes native props through to the root', () => {
      setup({ id: 'upload-toast' });
      expect(root().id).toBe('upload-toast');
    });

    it('forwards a ref to the root', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Toast ref={ref} primaryText={MESSAGE} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('sets displayName', () => {
      expect((Toast as { displayName?: string }).displayName).toBe('Toast');
    });

    it.each(TOAST_STATES)('renders the %s variant', (state) => {
      full({ state });
      expect(root().className).toContain(FIGMA[state].width);
      expect(root().className).toContain(FIGMA[state].radius);
      expect(screen.getByText(MESSAGE)).toBeInTheDocument();
      expect(screen.getByText(ACTION)).toBeInTheDocument();
    });
  });

  /* ------------------------------- geometry ------------------------------- */

  describe('geometry — Figma’s `State` axis', () => {
    it('pins the mobile bar at 328 with an 8px radius and 12/8 padding', () => {
      setup({ state: 'mobile' });
      expect(root().className).toContain(FIGMA.mobile.width);
      expect(root().className).toContain(FIGMA.mobile.radius);
      expect(root().className).toContain(FIGMA.mobile.paddingX);
      expect(root().className).toContain(FIGMA.mobile.paddingY);
    });

    it('pins the desktop bar at 480 with a 12px radius and 16 padding', () => {
      setup({ state: 'desktop' });
      expect(root().className).toContain(FIGMA.desktop.width);
      expect(root().className).toContain(FIGMA.desktop.radius);
      expect(root().className).toContain(FIGMA.desktop.padding);
    });

    /*
     * The height is not declared anywhere, and Figma's frames are why: 8 + (2 + 20 + 2)
     * + 8 = 40 and 16 + 24 + 16 = 56, so both fall out of the padding and one line of
     * text exactly.
     */
    it.each(TOAST_STATES)('declares no height for %s — the padding sets it', (state) => {
      setup({ state });
      expect(root().className).not.toMatch(/\bh-/);
      expect(root().className).not.toMatch(/\bmin-h-/);
    });

    it('applies the 2px inner padding on mobile only', () => {
      const { container, unmount } = full({ state: 'mobile' });
      const content = container.querySelector('.flex-1');
      expect(content?.className).toContain(FIGMA.mobile.innerPadding);
      unmount();
      const desktop = full({ state: 'desktop' });
      expect(desktop.container.querySelector('.flex-1')?.className).not.toContain(
        FIGMA.mobile.innerPadding,
      );
    });

    it.each(TOAST_STATES)('keeps the 8px gap on %s', (state) => {
      const { container } = full({ state });
      const groups = [...container.querySelectorAll('.gap-semantic-md')];
      expect(groups).toHaveLength(2);
    });

    it.each(TOAST_STATES)('sizes both %s icon boxes identically', (state) => {
      const { container } = full({ state });
      const slots = iconSlots(container);
      expect(slots).toHaveLength(2);
      for (const slot of slots) {
        expect(slot.className).toContain(FIGMA[state].icon);
      }
    });

    /*
     * The leading group takes the free space and may shrink below its text; the trailing
     * group keeps its natural width. That is what makes the primary text the part that
     * gives way rather than the action being pushed out of the bar.
     */
    it('flexes the leading group and leaves the trailing group intrinsic', () => {
      const { container } = full();
      const content = container.querySelector('.flex-1');
      expect(content?.className).toContain('min-w-semantic-none');
      const post = [...container.querySelectorAll('div')].find((d) =>
        d.className.includes('shrink-0'),
      );
      expect(post?.className).toContain('shrink-0');
      expect(post?.className).not.toContain('flex-1');
    });
  });

  describe('surface', () => {
    it.each(TOAST_STATES)('fills %s with Figma’s gray/900', (state) => {
      setup({ state });
      expect(root().className).toContain('bg-semantic-bg-primary-solid');
    });

    /*
     * Mobile binds the effect style `shadow/elevation-2`, and this library's token of
     * that name carries those exact two layers — so it needs no exception. Desktop binds
     * `Web`, four layers where every elevation token has two.
     */
    it('uses the elevation-2 token on mobile', () => {
      setup({ state: 'mobile' });
      expect(root().className).toContain(FIGMA.mobile.shadow);
    });

    it('reproduces Figma’s four-layer Web shadow on desktop', () => {
      setup({ state: 'desktop' });
      expect(root().className).toContain(FIGMA.desktop.shadow);
    });

    /*
     * Figma draws a 1px stroke bound to the same #252D38 as the fill, so it is invisible,
     * and the height arithmetic proves it cannot be a border box. Asserted so it cannot
     * arrive later as a visible line.
     */
    it('draws no border', () => {
      setup();
      const classes = root().className.split(/\s+/);
      expect(classes).not.toContain('border');
      expect(classes.filter((c) => c.startsWith('border-'))).toEqual([]);
      expect(classes.filter((c) => c.startsWith('inset-ring'))).toEqual([]);
    });
  });

  describe('typography', () => {
    it.each(TOAST_STATES)('applies the %s type step at weight 500 in white', (state) => {
      full({ state });
      for (const text of [screen.getByText(MESSAGE), screen.getByText(ACTION)]) {
        expect(text.className).toContain(FIGMA[state].type);
        expect(text.className).toContain('font-medium');
        expect(text.className).toContain('text-semantic-text-white');
      }
    });

    /* Figma sets `word-break: break-word` on the message and `nowrap` on the action. */
    it('wraps the primary text and keeps the post text on one line', () => {
      full();
      expect(screen.getByText(MESSAGE).className).toContain('break-words');
      expect(screen.getByText(MESSAGE).className).not.toContain('truncate');
      expect(screen.getByText(ACTION).className).toContain('whitespace-nowrap');
    });
  });

  /* ------------------------ published visibility ------------------------- */

  /*
   * Figma's three booleans, kept under Figma's own names — `Post Icon Show` plural among
   * them. Each is gated with its content: `false` never renders its part, and `true`
   * renders it only once there is something to put there. The boolean stays
   * authoritative, but it cannot conjure a part out of nothing, because no icon artwork
   * and no default copy ship here.
   */
  describe('Figma’s visibility booleans', () => {
    it('defaults all three to true, as Figma does', () => {
      const { container } = full();
      expect(screen.getByTestId('left')).toBeInTheDocument();
      expect(screen.getByText(ACTION)).toBeInTheDocument();
      expect(screen.getByTestId('post')).toBeInTheDocument();
      expect(iconSlots(container)).toHaveLength(2);
    });

    it('renders no left icon when preIconShow is false', () => {
      full({ preIconShow: false });
      expect(screen.queryByTestId('left')).not.toBeInTheDocument();
      // And the rest is untouched.
      expect(screen.getByText(MESSAGE)).toBeInTheDocument();
      expect(screen.getByText(ACTION)).toBeInTheDocument();
      expect(screen.getByTestId('post')).toBeInTheDocument();
    });

    it('renders no post text when postTextShow is false', () => {
      full({ postTextShow: false });
      expect(screen.queryByText(ACTION)).not.toBeInTheDocument();
      expect(screen.getByTestId('left')).toBeInTheDocument();
      expect(screen.getByTestId('post')).toBeInTheDocument();
    });

    it('renders no post icon when postIconShow is false', () => {
      full({ postIconShow: false });
      expect(screen.queryByTestId('post')).not.toBeInTheDocument();
      expect(screen.getByTestId('left')).toBeInTheDocument();
      expect(screen.getByText(ACTION)).toBeInTheDocument();
    });

    it('keeps the three booleans independent across all eight combinations', () => {
      for (const preIconShow of [true, false]) {
        for (const postTextShow of [true, false]) {
          for (const postIconShow of [true, false]) {
            const { unmount } = full({ preIconShow, postTextShow, postIconShow });
            const label = `${preIconShow}/${postTextShow}/${postIconShow}`;
            expect(screen.queryByTestId('left') !== null, label).toBe(preIconShow);
            expect(screen.queryByText(ACTION) !== null, label).toBe(postTextShow);
            expect(screen.queryByTestId('post') !== null, label).toBe(postIconShow);
            unmount();
          }
        }
      }
    });

    it('renders the post text alone when only it is shown', () => {
      full({ postIconShow: false, preIconShow: false });
      expect(screen.getByText(ACTION)).toBeInTheDocument();
      expect(screen.queryByTestId('post')).not.toBeInTheDocument();
      expect(screen.queryByTestId('left')).not.toBeInTheDocument();
    });

    it('renders the post icon alone when only it is shown', () => {
      const { container } = full({ postTextShow: false, preIconShow: false });
      expect(screen.getByTestId('post')).toBeInTheDocument();
      expect(screen.queryByText(ACTION)).not.toBeInTheDocument();
      expect(iconSlots(container)).toHaveLength(1);
    });

    /* Nothing to put in a part means no part — not a hole in the layout. */
    it('renders no left icon slot when the boolean is true but no glyph is given', () => {
      const { container } = setup({ postText: ACTION, postIcon: POST });
      expect(iconSlots(container)).toHaveLength(1);
      expect(screen.queryByTestId('left')).not.toBeInTheDocument();
    });

    it('renders no post text node when the boolean is true but no copy is given', () => {
      setup({ leftIcon: LEFT, postIcon: POST });
      expect(screen.getByTestId('post')).toBeInTheDocument();
      expect(screen.getByTestId('left')).toBeInTheDocument();
    });

    /* With neither trailing part present, the group itself goes rather than holding a gap. */
    it('omits the trailing group entirely when it would be empty', () => {
      setup({ leftIcon: LEFT });
      // Only the leading group remains, so no empty flex item holds open a gap.
      expect(root().children).toHaveLength(1);
    });
  });

  /* --------------------------- caller content ---------------------------- */

  describe('caller-supplied content', () => {
    it('renders both glyphs verbatim, with nothing substituted', () => {
      const { container } = full();
      for (const id of ['left', 'post']) {
        const slot = screen.getByTestId(id).parentElement;
        expect(slot?.children).toHaveLength(1);
        expect(slot?.firstElementChild).toBe(screen.getByTestId(id));
      }
      expect(container.querySelectorAll('svg')).toHaveLength(2);
    });

    it('does not resize or restyle the glyph it is given', () => {
      full({ leftIcon: <svg data-testid="left" className="size-semantic-6xl" /> });
      // `className` on an SVGElement is an SVGAnimatedString, not a string.
      expect(screen.getByTestId('left').getAttribute('class')).toBe('size-semantic-6xl');
    });

    it('takes nodes, not just strings, for both texts', () => {
      setup({
        primaryText: <strong data-testid="message">Uploaded</strong>,
        postText: <em data-testid="action">Undo</em>,
      });
      expect(screen.getByTestId('message').tagName).toBe('STRONG');
      expect(screen.getByTestId('action').tagName).toBe('EM');
    });

    it('ships no default copy for either text', () => {
      const { container } = render(<Toast data-testid="toast" />);
      expect(container.textContent).toBe('');
      expect(screen.queryByText('Placeholder Text')).not.toBeInTheDocument();
      expect(screen.queryByText('Undo')).not.toBeInTheDocument();
    });

    /*
     * Figma's `circle` default is its icon library's placeholder, not artwork, and this
     * library ships no icons at all — so nothing is drawn that the caller did not pass.
     */
    it('draws no artwork of its own', () => {
      const { container } = setup();
      expect(container.querySelector('svg')).toBeNull();
      expect(container.querySelector('img')).toBeNull();
      expect(container.innerHTML).not.toContain('url(');
    });
  });

  /* --------------------------- accessibility ----------------------------- */

  describe('accessibility', () => {
    /*
     * A toast nobody is told about is not doing its job. `status` is the non-interactive
     * role for advisory information — a polite live region — and it is an accessibility
     * addition rather than something Figma publishes.
     */
    it('announces itself as a status region', () => {
      setup();
      expect(root()).toHaveAttribute('role', 'status');
      expect(screen.getByRole('status')).toHaveTextContent(MESSAGE);
    });

    it('lets a caller escalate the role for something urgent', () => {
      setup({ role: 'alert' });
      expect(root()).toHaveAttribute('role', 'alert');
    });

    it('hides the decorative leading glyph from assistive technology', () => {
      const { container } = full();
      expect(screen.getByTestId('left').parentElement).toHaveAttribute('aria-hidden', 'true');
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    });

    /*
     * The trailing slot is where a dismiss or undo control goes, so it is deliberately
     * not hidden — `aria-hidden` on the wrapper would bury the caller's button.
     */
    it('leaves the trailing glyph reachable, so a control passed there works', async () => {
      const onDismiss = vi.fn();
      full({
        postIcon: (
          <button type="button" aria-label="Dismiss" onClick={onDismiss}>
            <svg data-testid="post" />
          </button>
        ),
      });
      const button = screen.getByRole('button', { name: 'Dismiss' });
      expect(button.parentElement).not.toHaveAttribute('aria-hidden');
      await userEvent.click(button);
      expect(onDismiss).toHaveBeenCalledOnce();
    });

    it('keeps both texts readable', () => {
      full();
      expect(screen.getByRole('status')).toHaveTextContent(MESSAGE);
      expect(screen.getByRole('status')).toHaveTextContent(ACTION);
    });

    /*
     * Figma publishes no interaction across either variant, so none is invented: the
     * component claims no button role, binds no handler and carries no state treatment.
     */
    it('invents no interactive semantics of its own', () => {
      const { container } = full();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(root()).not.toHaveAttribute('tabindex');
      expect(root()).not.toHaveAttribute('aria-live');
      const classes = [...container.querySelectorAll('*')]
        .map((el) => el.getAttribute('class') ?? '')
        .concat(root().className)
        .join(' ');
      for (const state of ['hover:', 'focus:', 'focus-visible:', 'active:', 'disabled:']) {
        expect(classes, state).not.toContain(state);
      }
    });

    it('renders no dismiss control, timer or animation of its own', () => {
      const { container } = full();
      expect(container.querySelector('button')).toBeNull();
      expect(root().className).not.toMatch(/\banimate-/);
      expect(root().className).not.toMatch(/\btransition/);
    });
  });

  /* ------------------------------ public API ----------------------------- */

  /*
   * The public prop surface, asserted from the source so it cannot grow unnoticed. Eight
   * properties are Figma's; the rest exist only because React needs them. A new prop
   * fails this test until it is classified.
   */
  describe('public API', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src', 'components', 'Toast', 'Toast.tsx'),
      'utf8',
    );
    const ownProps = source.slice(
      source.indexOf('interface ToastOwnProps'),
      source.indexOf('export type ToastProps'),
    );
    const declared = [...ownProps.matchAll(/^ {2}([a-zA-Z]+)\?:/gm)].map((m) => m[1]);

    const FIGMA_PROPS = [
      'state',
      'primaryText',
      'preIconShow',
      'leftIcon',
      'postTextShow',
      'postText',
      'postIconShow',
      'postIcon',
    ];
    const ENGINEERING_PROPS = ['classNames'];

    it('declares exactly the props that were agreed, and no others', () => {
      expect([...declared].sort()).toEqual([...FIGMA_PROPS, ...ENGINEERING_PROPS].sort());
    });

    it('names Figma’s properties exactly as Figma publishes them', () => {
      // `Post Icon Show` is plural and `Pre Icon Show` singular in Figma; both are kept.
      for (const prop of FIGMA_PROPS) expect(declared, prop).toContain(prop);
      expect(declared).not.toContain('postIconsShow');
      expect(declared).not.toContain('preIconsShow');
    });

    /*
     * The speculative toast-system API this component deliberately does not have. Figma
     * publishes none of it, so none of it is here.
     */
    it('exposes no toast-management props', () => {
      for (const absent of [
        'open',
        'duration',
        'autoDismiss',
        'position',
        'portal',
        'onClose',
        'onDismiss',
        'onUndo',
        'onAction',
        'variant',
        'intent',
        'size',
        'icon',
        'title',
        'description',
      ]) {
        expect(declared, absent).not.toContain(absent);
      }
    });

    it('exposes one classNames slot per element it renders, and no more', () => {
      const slots = source
        .slice(source.indexOf('export type ToastSlot'), source.indexOf('interface ToastOwnProps'))
        .match(/'[a-zA-Z]+'/g)
        ?.map((s) => s.slice(1, -1));
      expect(slots).toEqual([
        'root',
        'content',
        'leftIcon',
        'primaryText',
        'post',
        'postText',
        'postIcon',
      ]);
    });
  });

  describe('class overrides', () => {
    it('lets className win over a variant class', () => {
      setup({ className: 'rounded-full' });
      expect(root().className).toContain('rounded-full');
      expect(root().className).not.toContain('rounded-md');
    });

    it('targets every slot through classNames', () => {
      const { container } = full({
        classNames: {
          root: 'slot-root',
          content: 'slot-content',
          leftIcon: 'slot-left',
          primaryText: 'slot-message',
          post: 'slot-post',
          postText: 'slot-action',
          postIcon: 'slot-post-icon',
        },
      });
      expect(root().className).toContain('slot-root');
      for (const slot of [
        '.slot-content',
        '.slot-left',
        '.slot-message',
        '.slot-post',
        '.slot-action',
        '.slot-post-icon',
      ]) {
        expect(container.querySelector(slot), slot).not.toBeNull();
      }
    });
  });
});
