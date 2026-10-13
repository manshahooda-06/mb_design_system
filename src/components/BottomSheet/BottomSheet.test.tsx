import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BottomSheet } from './BottomSheet';
import { BOTTOM_SHEET_TYPES } from './constants';

const TITLE = 'Remove from cart';

/**
 * Every value Figma publishes for `Bottom Sheet` (node `4751:5485`), as the class that
 * carries it. The suite reads from this table rather than repeating literals, so a value
 * can only be wrong here — where it sits beside the Figma number it came from.
 */
const FIGMA = {
  overlay: 'bg-base-black/60' /* rgba(0,0,0,0.6) */,
  card: {
    radius: 'rounded-t-4xl' /* 24, top corners only */,
    paddingBottom: 'pb-semantic-3xl' /* 24 */,
    gap: 'gap-semantic-3xl' /* 24 */,
    shadow: '[box-shadow:0px_2px_8px_0px_#0000000a]' /* Drop shadow/Normal */,
    surface: 'bg-semantic-bg-primary' /* white */,
  },
  topSectionGap: 'gap-semantic-xs' /* 4 */,
  dragHandle: { padding: 'px-semantic-xl py-semantic-lg' /* 16 / 12 */ },
  handle: { height: 'h-semantic-xs' /* 4 */, width: 'w-semantic-5xl' /* 40 */ },
  content: { padding: 'px-semantic-xl' /* 16 */, gap: 'gap-semantic-xl' /* 16 */ },
  headerRowGap: 'gap-semantic-2xl' /* 20 */,
  headerLeadGap: 'gap-semantic-md' /* 8 */,
  icon: 'size-semantic-2xl' /* 20, both the left icon and the close */,
  title: 'text-mobile-heading-sm' /* 16/24 semibold */,
  // Selected by its 4px block padding: the 8px gap is shared with the header cluster.
  footer: { row: 'py-semantic-xs' /* 4 */, gap: 'gap-semantic-md' /* 8 */ },
} as const;

const LEFT = <svg data-testid="left" />;
const CLOSE = <svg data-testid="close-glyph" />;
const FOOTER = (
  <>
    <button type="button">Cancel</button>
    <button type="button">Confirm</button>
  </>
);

function setup(props: Partial<Parameters<typeof BottomSheet>[0]> = {}) {
  return render(<BottomSheet data-testid="sheet" header={TITLE} {...props} />);
}

/** A sheet with every optional part present — the state most assertions need. */
function full(props: Partial<Parameters<typeof BottomSheet>[0]> = {}) {
  return setup({ leftIcon: LEFT, closeIcon: CLOSE, footer: FOOTER, ...props });
}

const overlay = () => screen.getByTestId('sheet');
const card = (c: HTMLElement) => c.querySelector('.rounded-t-4xl');
const closeButton = () => screen.getByRole('button', { name: /close/i });
const divider = () => screen.getByRole('separator');

describe('BottomSheet', () => {
  describe('rendering', () => {
    it('renders the overlay, the card, the handle, the header and the divider', () => {
      const { container } = setup();
      expect(overlay().className).toContain(FIGMA.overlay);
      expect(card(container)).not.toBeNull();
      expect(container.querySelector(`.${FIGMA.handle.width}`)).not.toBeNull();
      expect(screen.getByText(TITLE)).toBeInTheDocument();
      expect(divider()).toBeInTheDocument();
    });

    it('renders its header', () => {
      setup();
      expect(screen.getByText(TITLE)).toBeInTheDocument();
    });

    it('ships no default header copy', () => {
      const { container } = render(<BottomSheet data-testid="sheet" />);
      expect(container.textContent).toBe('');
      expect(screen.queryByText('Placeholder content to be replaced')).not.toBeInTheDocument();
    });

    it('passes native props through to the root', () => {
      setup({ id: 'cart-sheet' });
      expect(overlay().id).toBe('cart-sheet');
    });

    it('forwards a ref to the root', () => {
      const ref = createRef<HTMLDivElement>();
      render(<BottomSheet ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('sets displayName', () => {
      expect((BottomSheet as { displayName?: string }).displayName).toBe('BottomSheet');
    });
  });

  /* ------------------------------- geometry ------------------------------- */

  describe('geometry — measured from Figma', () => {
    it('bottom-aligns a full-width card with only its top corners rounded', () => {
      const { container } = setup();
      const cls = card(container)?.className ?? '';
      expect(cls).toContain('absolute');
      expect(cls).toContain('bottom-semantic-none');
      expect(cls).toContain('w-full');
      expect(cls).toContain(FIGMA.card.radius);
      // The bottom corners stay square — the card sits against the edge of the screen.
      expect(cls).not.toMatch(/\brounded-b/);
    });

    it('applies the card’s 24 bottom padding, 24 gap, white surface and shadow', () => {
      const { container } = setup();
      const cls = card(container)?.className ?? '';
      expect(cls).toContain(FIGMA.card.paddingBottom);
      expect(cls).toContain(FIGMA.card.gap);
      expect(cls).toContain(FIGMA.card.surface);
      expect(cls).toContain(FIGMA.card.shadow);
      expect(cls).toContain('pt-semantic-none');
    });

    it('sizes the drag handle 40 x 4, fully round', () => {
      const { container } = setup();
      const handle = container.querySelector(`.${FIGMA.handle.width}`);
      expect(handle?.className).toContain(FIGMA.handle.height);
      expect(handle?.className).toContain('rounded-full');
      expect(handle?.className).toContain('bg-semantic-utility-gray-100');
    });

    it('hides the drag handle from assistive technology — it is decorative', () => {
      const { container } = setup();
      expect(container.querySelector(`.${FIGMA.handle.width}`)).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    });

    it('insets the content 16 a side with a 16 stack gap', () => {
      const { container } = setup();
      const content = container.querySelector('.px-semantic-xl.gap-semantic-xl');
      expect(content?.className).toContain(FIGMA.content.padding.split(' ')[0]);
      expect(content?.className).toContain(FIGMA.content.gap);
    });

    it('spaces the header row 20 from the close and 8 between icon and title', () => {
      const { container } = full();
      expect(container.querySelector(`.${FIGMA.headerRowGap}`)).not.toBeNull();
      expect(container.querySelector(`.${FIGMA.headerLeadGap}`)).not.toBeNull();
    });

    it('sizes both header glyph boxes at 20', () => {
      const { container } = full();
      const boxes = [...container.querySelectorAll(`.${FIGMA.icon}`)];
      expect(boxes).toHaveLength(2);
    });

    it('lets the title truncate rather than push the close out', () => {
      full();
      const title = screen.getByText(TITLE);
      expect(title.className).toContain('truncate');
      expect(title.className).toContain('min-w-semantic-none');
      expect(title.className).toContain('flex-1');
    });

    it('applies Figma’s 16/24 semibold title in primary text', () => {
      setup();
      const title = screen.getByText(TITLE);
      expect(title.className).toContain(FIGMA.title);
      expect(title.className).toContain('font-semibold');
      expect(title.className).toContain('text-semantic-text-primary');
    });
  });

  /* -------------------------------- reuse --------------------------------- */

  /*
   * Figma nests the canonical Divider instance under the header, so this renders that
   * component rather than drawing another 1px line.
   */
  describe('reuses the canonical Divider', () => {
    it('renders a real Divider, not a hand-rolled rule', () => {
      setup();
      const rule = divider();
      expect(rule).toHaveAttribute('role', 'separator');
      // Divider's own horizontal solid/normal classes.
      expect(rule.className).toContain('h-px');
      expect(rule.className).toContain('w-full');
      expect(rule.className).toContain('bg-semantic-utility-gray-100');
    });

    it('renders exactly one divider', () => {
      full();
      expect(screen.getAllByRole('separator')).toHaveLength(1);
    });

    it('keeps the divider under the header even with no content', () => {
      setup();
      expect(divider()).toBeInTheDocument();
    });
  });

  /* ----------------------- published visibility --------------------------- */

  /*
   * Figma's two booleans, kept under Figma's own names and each gated with its content:
   * `false` never renders its part, and `true` renders it only once there is something
   * to put there. No icon artwork and no footer actions ship, so the alternative is a
   * 20px hole beside the title or an empty strip under the content.
   */
  describe('Figma’s visibility booleans', () => {
    it('defaults both to true', () => {
      full();
      expect(screen.getByTestId('left')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('renders no left icon when showLeftIcon is false', () => {
      full({ showLeftIcon: false });
      expect(screen.queryByTestId('left')).not.toBeInTheDocument();
      expect(screen.getByText(TITLE)).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('renders no left icon when the boolean is true but no glyph is given', () => {
      const { container } = setup({ closeIcon: CLOSE, footer: FOOTER });
      expect(container.querySelectorAll(`.${FIGMA.icon}`)).toHaveLength(1);
    });

    it('renders no footer when showFooter is false', () => {
      const { container } = full({ showFooter: false });
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
      expect(container.querySelector(`.${FIGMA.footer.row}`)).toBeNull();
      expect(screen.getByTestId('left')).toBeInTheDocument();
    });

    it('renders no footer when the boolean is true but no actions are given', () => {
      const { container } = setup({ leftIcon: LEFT, closeIcon: CLOSE });
      expect(container.querySelector('.py-semantic-xs')).toBeNull();
    });

    it('keeps the two booleans independent', () => {
      for (const showLeftIcon of [true, false]) {
        for (const showFooter of [true, false]) {
          const { unmount } = full({ showLeftIcon, showFooter });
          const label = `${showLeftIcon}/${showFooter}`;
          expect(screen.queryByTestId('left') !== null, label).toBe(showLeftIcon);
          expect(screen.queryByText('Confirm') !== null, label).toBe(showFooter);
          unmount();
        }
      }
    });
  });

  /* ------------------------------ composition ----------------------------- */

  describe('content composition', () => {
    it('renders the caller’s children as the sheet body', () => {
      setup({ children: <p data-testid="body">This item will be removed.</p> });
      expect(screen.getByTestId('body')).toBeInTheDocument();
    });

    /*
     * Figma's `_Content Block Placeholder` is marked "swap me with your custom content",
     * so it is a hole in the design rather than a part of it. None of its dashed frame or
     * its copy ships.
     */
    it('ships no placeholder block or copy when there are no children', () => {
      const { container } = setup();
      expect(screen.queryByText('Place elements and patterns here')).not.toBeInTheDocument();
      expect(container.querySelector('.border-dashed')).toBeNull();
      expect(container.querySelector('.rounded-xs')).toBeNull();
    });

    it('renders the caller’s footer actions verbatim', () => {
      full();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    /* Figma gives each footer button `flex: 1 0 0`, so the row stretches its children. */
    it('sizes footer actions to equal widths', () => {
      const { container } = full();
      const row = container.querySelector(`.${FIGMA.footer.row}`);
      expect(row?.className).toContain('*:flex-1');
      expect(row?.className).toContain('*:min-w-semantic-none');
      expect(row?.className).toContain('px-semantic-xl');
      expect(row?.className).toContain(FIGMA.footer.gap);
    });

    it('ships no default CTA labels', () => {
      const { container } = setup({ footer: FOOTER });
      expect(container.textContent).not.toContain('Button CTA');
    });
  });

  /* ------------------------------- the type ------------------------------- */

  describe('Figma’s `type`', () => {
    it('publishes exactly the two options Figma does', () => {
      expect([...BOTTOM_SHEET_TYPES]).toEqual(['two-buttons', 'one-button']);
    });

    it('defaults to the variant the sheet instantiates', () => {
      const { container } = full();
      const row = container.querySelector(`.${FIGMA.footer.row}`);
      expect(row).not.toBeNull();
    });

    /*
     * Figma's `1 button` and `2 buttons` rows are byte-identical — same padding, gap and
     * surface — and differ only in how many buttons sit inside, so both values resolve to
     * the same classes here. Asserted so a future divergence is a deliberate change.
     */
    it.each([...BOTTOM_SHEET_TYPES])('renders the same row for %s', (type) => {
      const { container } = full({ type });
      const row = container.querySelector(`.${FIGMA.footer.row}`);
      expect(row?.className).toContain('px-semantic-xl');
      expect(row?.className).toContain(FIGMA.footer.gap);
      expect(row?.className).toContain('bg-semantic-bg-primary');
      expect(row?.className).toContain('*:flex-1');
    });

    it('sizes a single action to the full row, and two to half each', () => {
      const one = setup({
        type: 'one-button',
        footer: <button type="button">Only</button>,
      });
      expect(screen.getByRole('button', { name: 'Only' })).toBeInTheDocument();
      one.unmount();

      const { container } = full({ type: 'two-buttons' });
      const row = container.querySelector(`.${FIGMA.footer.row}`);
      // One `flex-1` rule covers both, which is exactly why Figma's rows are identical.
      expect(row?.className).toContain('*:flex-1');
      expect(row?.children).toHaveLength(2);
    });
  });

  /* --------------------------- accessibility ------------------------------ */

  describe('close control', () => {
    it('is a real button, not decoration', () => {
      full({ closeLabel: 'Close' });
      const close = closeButton();
      expect(close.tagName).toBe('BUTTON');
      expect(close).toHaveAttribute('type', 'button');
    });

    it('renders the caller’s glyph verbatim', () => {
      full({ closeLabel: 'Close' });
      expect(screen.getByTestId('close-glyph')).toBeInTheDocument();
      expect(closeButton().children).toHaveLength(1);
    });

    it('takes its accessible name from closeLabel', () => {
      full({ closeLabel: 'Close the cart sheet' });
      expect(screen.getByRole('button', { name: 'Close the cart sheet' })).toBeInTheDocument();
    });

    /*
     * Figma draws the close as a button and publishes no behaviour behind it, so the
     * element is reproduced and nothing more. Clicking it does nothing here, and wiring
     * dismissal is the consuming application's — the same division that keeps mounting,
     * focus and positioning out of this component.
     */
    it('binds no handler of its own, and does nothing when clicked', async () => {
      const { container } = full({ closeLabel: 'Close' });
      const before = container.innerHTML;
      await userEvent.click(closeButton());
      expect(container.innerHTML).toBe(before);
      expect(closeButton()).toBeInTheDocument();
    });

    it('carries the shared focus ring, because it is focusable', () => {
      full({ closeLabel: 'Close' });
      expect(closeButton().className).toContain('focus-visible:');
    });

    /* Figma always draws the close, so it is always rendered — handler or not. */
    it('renders even without a handler', () => {
      full({ closeLabel: 'Close' });
      expect(closeButton()).toBeInTheDocument();
    });
  });

  /*
   * The scrim is decoration, and the sheet implements no focus containment — so it
   * claims no dialog semantics it cannot honour. A caller building real modal behaviour
   * adds `role="dialog"` and `aria-modal` along with the focus trap that makes them true.
   */
  describe('semantics', () => {
    it('claims no dialog role it cannot honour', () => {
      full({ closeLabel: 'Close' });
      expect(overlay()).not.toHaveAttribute('role');
      expect(overlay()).not.toHaveAttribute('aria-modal');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('lets a caller supply dialog semantics themselves', () => {
      setup({ role: 'dialog', 'aria-modal': true, 'aria-label': 'Remove item' });
      expect(screen.getByRole('dialog', { name: 'Remove item' })).toBeInTheDocument();
    });

    it('hides the decorative left glyph from assistive technology', () => {
      full();
      expect(screen.getByTestId('left').parentElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('invents no behaviour Figma does not publish', () => {
      const { container } = full({ closeLabel: 'Close' });
      const classes = [...container.querySelectorAll('*')]
        .map((el) => el.getAttribute('class') ?? '')
        .join(' ');
      for (const absent of ['animate-', 'transition', 'duration-', 'fixed', 'z-']) {
        expect(classes, absent).not.toContain(absent);
      }
      expect(overlay()).not.toHaveAttribute('tabindex');
    });
  });

  /* ------------------------------ public API ------------------------------ */

  /*
   * The public prop surface, asserted from the source so it cannot grow unnoticed. Five
   * properties are Figma's; the rest exist only because the architecture needs them —
   * artwork the library does not ship, composition holes Figma marks as holes, and a name
   * an icon-only control cannot do without. A new prop fails this test until classified.
   */
  describe('public API', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src', 'components', 'BottomSheet', 'BottomSheet.tsx'),
      'utf8',
    );
    const ownProps = source.slice(
      source.indexOf('interface BottomSheetOwnProps'),
      source.indexOf('export type BottomSheetProps'),
    );
    const declared = [...ownProps.matchAll(/^ {2}([a-zA-Z]+)\??:/gm)].map((m) => m[1]);

    const FIGMA_PROPS = ['header', 'showLeftIcon', 'leftIcon', 'showFooter', 'type'];
    const ENGINEERING_PROPS = ['children', 'footer', 'closeIcon', 'closeLabel', 'classNames'];

    it('declares exactly the props that were agreed, and no others', () => {
      expect([...declared].sort()).toEqual([...FIGMA_PROPS, ...ENGINEERING_PROPS].sort());
    });

    it('names Figma’s properties exactly as Figma publishes them', () => {
      for (const prop of FIGMA_PROPS) expect(declared, prop).toContain(prop);
    });

    /* The speculative sheet API this component deliberately does not have. */
    it('exposes no sheet-management or layout props', () => {
      for (const absent of [
        'open',
        'onOpen',
        'onClose',
        'onDismiss',
        'dismissable',
        'backdrop',
        'animation',
        'duration',
        'snapPoints',
        'draggable',
        'fullScreen',
        'position',
        'placement',
        'size',
        'height',
        'width',
        'variant',
        'intent',
        'title',
        'description',
        'mobile',
        'desktop',
        'device',
        'portal',
      ]) {
        expect(declared, absent).not.toContain(absent);
      }
    });
  });

  describe('class overrides', () => {
    it('lets className win over a variant class', () => {
      setup({ className: 'bg-semantic-bg-primary' });
      expect(overlay().className).toContain('bg-semantic-bg-primary');
      expect(overlay().className).not.toContain(FIGMA.overlay);
    });

    it('targets every slot through classNames', () => {
      const { container } = full({
        closeLabel: 'Close',
        classNames: {
          root: 'slot-root',
          card: 'slot-card',
          dragHandle: 'slot-drag',
          handle: 'slot-handle',
          header: 'slot-header',
          leftIcon: 'slot-left',
          title: 'slot-title',
          close: 'slot-close',
          content: 'slot-content',
          footer: 'slot-footer',
        },
      });
      expect(overlay().className).toContain('slot-root');
      for (const slot of [
        '.slot-card',
        '.slot-drag',
        '.slot-handle',
        '.slot-header',
        '.slot-left',
        '.slot-title',
        '.slot-close',
        '.slot-content',
        '.slot-footer',
      ]) {
        expect(container.querySelector(slot), slot).not.toBeNull();
      }
    });
  });
});
