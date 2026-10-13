import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';
import { MODAL_DEVICES, MODAL_TYPES } from './constants';

const HEADING = 'Delete this report?';
const SUB_TEXT = 'You will not be able to recover it.';
const TEXT = 'This removes the report from every dashboard it appears on.';

/**
 * Every value Figma publishes for `Modal` (node `4792:13831`) and its nested `_Modal card`
 * (node `4792:13743`), as the class that carries it. The suite reads from this table
 * rather than repeating literals, so a value can only be wrong here — where it sits beside
 * the Figma number it came from.
 *
 * Each `[desktop, mobile]` pair is one row of Figma's `Device` axis; each `type` map is one
 * column of its `type` axis. Six variants, every cell filled.
 */
const FIGMA = {
  scrim: 'bg-base-black/60' /* rgba(0,0,0,0.6) */,
  card: {
    radius: 'rounded-2xl' /* 16, all four corners */,
    shadow: 'shadow-elevation-4' /* shadow/elevation-4, both layers */,
    ring: 'inset-ring-semantic-border-tertiary',
    surface: 'bg-semantic-bg-primary',
    width: { desktop: 'w-[400px]', mobile: 'w-[328px]' },
    padding: {
      desktop: ['px-semantic-3xl', 'py-semantic-4xl'] /* 24 / 32 */,
      mobile: ['px-semantic-xl', 'py-semantic-3xl'] /* 16 / 24 */,
    },
    gap: { desktop: 'gap-semantic-5xl' /* 40 */, mobile: 'gap-semantic-3xl' /* 24 */ },
  },
  /* `Top section` is the only measurement that moves on both axes at once. */
  topSectionGap: {
    desktop: {
      'icon-text': 'gap-semantic-3xl' /* 24 */,
      'text-only': 'gap-semantic-3xl' /* 24 */,
      custom: 'gap-semantic-4xl' /* 32 */,
    },
    mobile: {
      'icon-text': 'gap-semantic-xs' /* 4 */,
      'text-only': 'gap-semantic-xl' /* 16 */,
      custom: 'gap-semantic-xl' /* 16 */,
    },
  },
  headerGap: { desktop: 'gap-semantic-xl' /* 16 */, mobile: 'gap-semantic-lg' /* 12 */ },
  headerRowGap: { desktop: 'gap-semantic-3xl' /* 24 */, mobile: 'gap-semantic-xl' /* 16 */ },
  titleClusterGap: { desktop: 'gap-semantic-md' /* 8 */, mobile: 'gap-semantic-xs' /* 4 */ },
  /* Both header glyph boxes — the leading icon and the close — share one size. */
  glyph: { desktop: 'size-[28px]', mobile: 'size-semantic-3xl' /* 24 */ },
  illustration: { desktop: 'size-[120px]', mobile: 'size-semantic-8xl' /* 80 */ },
  contentGap: {
    desktop: { 'icon-text': 'gap-semantic-3xl' /* 24 */, 'text-only': 'gap-semantic-lg' /* 12 */ },
    mobile: { 'icon-text': 'gap-semantic-lg' /* 12 */, 'text-only': 'gap-semantic-lg' /* 12 */ },
  },
  textGroupGap: 'gap-semantic-md' /* 8, mobile `icon+text` only */,
  type: {
    heading: {
      'icon-text': { desktop: 'text-desktop-body-md' /* 20/28 */, mobile: 'text-mobile-body-md' },
      titled: { desktop: 'text-desktop-heading-sm' /* 24/36 */, mobile: 'text-mobile-heading-sm' },
    },
    subText: { desktop: 'text-desktop-body-sm' /* 16/24 */, mobile: 'text-mobile-body-sm' },
    text: { desktop: 'text-desktop-body-md' /* 20/28 */, mobile: 'text-mobile-body-md' },
  },
  footerGap: 'gap-semantic-xl' /* 16, both devices */,
} as const;

const ICON = <svg data-testid="icon" />;
const CLOSE = <svg data-testid="close-glyph" />;
const ART = <svg data-testid="art" />;
const FOOTER = (
  <>
    <button type="button">Cancel</button>
    <button type="button">Delete</button>
  </>
);

type Props = Partial<Parameters<typeof Modal>[0]>;

function setup(props: Props = {}) {
  return render(<Modal data-testid="modal" {...props} />);
}

/** A modal with every optional part present — the state most assertions need. */
function full(props: Props = {}) {
  return setup({
    heading: HEADING,
    subText: SUB_TEXT,
    text: TEXT,
    icon: ICON,
    illustration: ART,
    closeIcon: CLOSE,
    closeLabel: 'Close',
    footer: FOOTER,
    ...props,
  });
}

const root = () => screen.getByTestId('modal');
const card = (c: HTMLElement) => c.querySelector<HTMLElement>(`.${FIGMA.card.radius}`);
const closeButton = () => screen.getByRole('button', { name: /close/i });
/** Arbitrary values carry brackets, which need no escaping inside an attribute selector. */
const byClass = (c: HTMLElement, cls: string) => c.querySelectorAll(`[class~="${cls}"]`);

/** The six cells of Figma's `type` × `Device` table, as a table-driven case list. */
const VARIANTS = MODAL_DEVICES.flatMap((device) =>
  MODAL_TYPES.map((type) => ({ device, type, label: `${device}/${type}` })),
);

describe('Modal', () => {
  describe('rendering', () => {
    it('renders a scrim wrapping a centred card', () => {
      const { container } = setup();
      expect(root().className).toContain(FIGMA.scrim);
      expect(root().className).toContain('size-full');
      expect(card(container)).not.toBeNull();
    });

    it('renders its heading', () => {
      setup({ heading: HEADING });
      expect(screen.getByText(HEADING)).toBeInTheDocument();
    });

    it('ships no default copy of any kind', () => {
      const { container } = setup();
      expect(container.textContent).toBe('');
      for (const placeholder of [
        'Heading',
        'Sub text',
        'Button CTA',
        'Place elements and patterns here',
      ]) {
        expect(screen.queryByText(placeholder), placeholder).not.toBeInTheDocument();
      }
    });

    it('passes native props through to the root', () => {
      setup({ id: 'delete-report' });
      expect(root().id).toBe('delete-report');
    });

    it('forwards a ref to the root', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Modal ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('sets displayName', () => {
      expect((Modal as { displayName?: string }).displayName).toBe('Modal');
    });
  });

  /* ------------------------------- the table ------------------------------ */

  /*
   * Figma's `_Modal card` publishes `type`(3) × `Device`(2). All six are implemented, and
   * every one is asserted here rather than a representative sample — a missing cell is
   * exactly the defect this table exists to catch.
   */
  describe('Figma’s 6 variants', () => {
    it('publishes exactly the axes Figma does', () => {
      expect([...MODAL_DEVICES]).toEqual(['desktop', 'mobile']);
      expect([...MODAL_TYPES]).toEqual(['icon-text', 'text-only', 'custom']);
      expect(VARIANTS).toHaveLength(6);
    });

    it('defaults to desktop `icon+text`', () => {
      const { container } = full();
      const cls = card(container)?.className ?? '';
      expect(cls).toContain(FIGMA.card.width.desktop);
      expect(cls).toContain(FIGMA.card.gap.desktop);
      // `icon+text` has no header title, so nothing sits beside the close.
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });

    it.each(VARIANTS)('renders $label', ({ device, type }) => {
      const { container } = full({ device, type, children: <p data-testid="body">Body</p> });
      expect(card(container)).not.toBeNull();
      expect(closeButton()).toBeInTheDocument();
      expect(screen.getByText(HEADING)).toBeInTheDocument();
    });

    it.each(VARIANTS)('applies $label’s card padding and gap', ({ device, type }) => {
      const { container } = full({ device, type });
      const cls = card(container)?.className ?? '';
      for (const pad of FIGMA.card.padding[device]) expect(cls, pad).toContain(pad);
      expect(cls).toContain(FIGMA.card.gap[device]);
    });

    it.each(VARIANTS)('applies $label’s Top section gap', ({ device, type }) => {
      const { container } = full({ device, type });
      expect(byClass(container, FIGMA.topSectionGap[device][type]).length).toBeGreaterThan(0);
    });

    it.each(VARIANTS)('gives $label the same surface, radius, ring and shadow', (v) => {
      const { container } = full(v);
      const cls = card(container)?.className ?? '';
      expect(cls).toContain(FIGMA.card.surface);
      expect(cls).toContain(FIGMA.card.radius);
      expect(cls).toContain(FIGMA.card.shadow);
      // An inset ring, not a border: Figma's stroke is inside-aligned and adds no height.
      expect(cls).toContain(FIGMA.card.ring);
      expect(cls.split(/\s+/).filter((c) => c.startsWith('border'))).toEqual([]);
    });
  });

  /* ------------------------------- geometry ------------------------------- */

  describe('geometry — measured from Figma', () => {
    it('centres the card on both axes', () => {
      const { container } = setup();
      const cls = card(container)?.className ?? '';
      expect(cls).toContain('absolute');
      expect(cls).toContain('top-1/2');
      expect(cls).toContain('left-1/2');
      expect(cls).toContain('-translate-x-1/2');
      expect(cls).toContain('-translate-y-1/2');
    });

    it.each(['icon-text', 'text-only'] as const)('pins %s to Figma’s widths', (type) => {
      const desktop = full({ device: 'desktop', type });
      expect(card(desktop.container)?.className).toContain(FIGMA.card.width.desktop);
      desktop.unmount();

      const { container } = full({ device: 'mobile', type });
      expect(card(container)?.className).toContain(FIGMA.card.width.mobile);
    });

    /*
     * Figma draws `custom` hugging its content — 250 on desktop and 234 on mobile rather
     * than 400 and 328 — because the body is a placeholder whose real width is the
     * caller's. Reproduced rather than regularised: the card takes the width it is given.
     */
    /*
     * A hugging box is sized from its content's minimum width, and the heading is
     * `truncate` — `white-space: nowrap` — so its minimum is the whole untruncated line.
     * Uncapped, a `custom` card with a long heading measured 380.63 in a 360 frame and
     * hung off both edges. The cap makes the heading truncate at the container instead.
     */
    it('caps every card at its container, so a hug can never overflow', () => {
      for (const { device, type, label } of VARIANTS) {
        const { container, unmount } = full({ device, type });
        expect(card(container)?.className, label).toContain('max-w-full');
        unmount();
      }
    });

    it('leaves `custom` unpinned, as Figma draws it', () => {
      for (const device of MODAL_DEVICES) {
        const { container, unmount } = full({ device, type: 'custom' });
        const cls = card(container)?.className ?? '';
        expect(cls, device).not.toContain(FIGMA.card.width.desktop);
        expect(cls, device).not.toContain(FIGMA.card.width.mobile);
        unmount();
      }
    });

    it.each(MODAL_DEVICES)('spaces %s’s header and header row', (device) => {
      const { container } = full({ device, type: 'text-only' });
      expect(byClass(container, FIGMA.headerGap[device]).length).toBeGreaterThan(0);
      expect(byClass(container, FIGMA.headerRowGap[device]).length).toBeGreaterThan(0);
      expect(byClass(container, FIGMA.titleClusterGap[device]).length).toBeGreaterThan(0);
    });

    it.each(MODAL_DEVICES)('sizes both of %s’s header glyph boxes alike', (device) => {
      const { container } = full({ device, type: 'text-only' });
      // The leading icon and the close — one size, two boxes.
      expect(byClass(container, FIGMA.glyph[device])).toHaveLength(2);
    });

    it.each(MODAL_DEVICES)('sizes %s’s illustration', (device) => {
      const { container } = full({ device, type: 'icon-text' });
      expect(byClass(container, FIGMA.illustration[device])).toHaveLength(1);
    });

    it.each(['icon-text', 'text-only'] as const)('spaces %s’s content', (type) => {
      for (const device of MODAL_DEVICES) {
        const { container, unmount } = full({ device, type });
        expect(byClass(container, FIGMA.contentGap[device][type]).length, device).toBeGreaterThan(
          0,
        );
        unmount();
      }
    });

    /* Mobile `icon+text` groups its two lines 8 apart; desktop lets the Content gap do it. */
    it('groups mobile `icon+text`’s heading and sub-text, and only there', () => {
      const mobile = full({ device: 'mobile', type: 'icon-text' });
      expect(byClass(mobile.container, FIGMA.textGroupGap)).toHaveLength(1);
      mobile.unmount();

      const { container } = full({ device: 'desktop', type: 'icon-text' });
      expect(byClass(container, FIGMA.textGroupGap)).toHaveLength(0);
    });

    it('spaces the footer 16 apart on both devices', () => {
      for (const device of MODAL_DEVICES) {
        const { container, unmount } = full({ device });
        const footer = container.querySelector(`[class~="${FIGMA.footerGap}"][class~="*:flex-1"]`);
        expect(footer, device).not.toBeNull();
        unmount();
      }
    });
  });

  /* ------------------------------ typography ------------------------------ */

  describe('typography — measured from Figma', () => {
    it.each(MODAL_DEVICES)('sets %s’s `icon+text` heading and sub-text', (device) => {
      full({ device, type: 'icon-text' });
      expect(screen.getByText(HEADING).className).toContain(
        FIGMA.type.heading['icon-text'][device],
      );
      expect(screen.getByText(HEADING).className).toContain('font-semibold');
      expect(screen.getByText(SUB_TEXT).className).toContain(FIGMA.type.subText[device]);
      expect(screen.getByText(SUB_TEXT).className).toContain('font-light');
      expect(screen.getByText(SUB_TEXT).className).toContain('text-semantic-text-secondary');
    });

    it.each(MODAL_DEVICES)('sets %s’s titled heading a step larger', (device) => {
      full({ device, type: 'text-only' });
      const heading = screen.getByText(HEADING);
      expect(heading.className).toContain(FIGMA.type.heading.titled[device]);
      expect(heading.className).toContain('text-semantic-text-primary');
    });

    it.each(MODAL_DEVICES)('sets %s’s body text', (device) => {
      full({ device, type: 'text-only' });
      const body = screen.getByText(TEXT);
      expect(body.className).toContain(FIGMA.type.text[device]);
      expect(body.className).toContain('font-normal');
      expect(body.className).toContain('text-semantic-text-primary');
    });

    /* A long title must not push the close button off the card. */
    it('truncates a titled heading to one line', () => {
      full({ type: 'custom' });
      const heading = screen.getByText(HEADING);
      expect(heading.className).toContain('truncate');
      expect(heading.className).toContain('min-w-semantic-none');
      expect(heading.className).toContain('flex-1');
    });

    /* Centred under the illustration instead, where there is no close to make room for. */
    it('does not truncate an `icon+text` heading', () => {
      full({ type: 'icon-text' });
      const heading = screen.getByText(HEADING);
      expect(heading.className).not.toContain('truncate');
      expect(heading.className).toContain('text-center');
    });
  });

  /* ------------------------ the three layouts ----------------------------- */

  /*
   * The types are three layouts rather than three skins, so each renders a different set
   * of parts. These assert the differences directly — what is present and what is not.
   */
  describe('Figma’s `type` is three layouts', () => {
    it('gives `icon+text` an illustration, no header title and no divider', () => {
      const { container } = full({ type: 'icon-text' });
      expect(screen.getByTestId('art')).toBeInTheDocument();
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
      expect(screen.queryByRole('separator')).not.toBeInTheDocument();
      // The lone close is pushed to the end of its row.
      expect(byClass(container, 'justify-end').length).toBeGreaterThan(0);
    });

    it('gives `text only` a titled header, a divider and a paragraph', () => {
      full({ type: 'text-only' });
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByRole('separator')).toBeInTheDocument();
      expect(screen.getByText(TEXT)).toBeInTheDocument();
      expect(screen.queryByTestId('art')).not.toBeInTheDocument();
    });

    it('gives `custom` the same header and hands the body to the caller', () => {
      full({ type: 'custom', children: <p data-testid="body">Anything at all</p> });
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByRole('separator')).toBeInTheDocument();
      expect(screen.getByTestId('body')).toBeInTheDocument();
      // `text` and the illustration belong to the other two types.
      expect(screen.queryByText(TEXT)).not.toBeInTheDocument();
      expect(screen.queryByTestId('art')).not.toBeInTheDocument();
    });

    /*
     * Parallel props, not a discriminated union: `type` decides which apply and the rest
     * are ignored. Passing all of them at once is legal and renders exactly one layout.
     */
    it.each(MODAL_TYPES)('ignores the props that do not belong to %s', (type) => {
      full({ type, children: <p data-testid="body">Body</p> });
      expect(screen.queryByTestId('art') !== null).toBe(type === 'icon-text');
      expect(screen.queryByText(TEXT) !== null).toBe(type === 'text-only');
      expect(screen.queryByTestId('body') !== null).toBe(type === 'custom');
    });

    it('renders no body at all when `custom` has no children', () => {
      const { container } = full({ type: 'custom', children: undefined });
      expect(screen.getByText(HEADING)).toBeInTheDocument();
      expect(container.querySelector('.border-dashed')).toBeNull();
    });
  });

  /* ----------------------- published visibility --------------------------- */

  /*
   * Figma's two booleans, kept under Figma's own names and each gated with its content:
   * `false` never renders its part, and `true` renders it only once there is something to
   * put there. No icon artwork ships, so the alternative is an empty box beside the title.
   */
  describe('Figma’s visibility booleans', () => {
    it('defaults both to true', () => {
      // Each boolean belongs to a different layout: the icon to the titled headers, the
      // sub-text to `icon+text`.
      const titled = full({ type: 'text-only' });
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      titled.unmount();

      full({ type: 'icon-text' });
      expect(screen.getByText(SUB_TEXT)).toBeInTheDocument();
    });

    it('renders no leading icon when showLeftIcon is false', () => {
      full({ type: 'text-only', showLeftIcon: false });
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
      expect(screen.getByText(HEADING)).toBeInTheDocument();
    });

    it('renders no leading icon when the boolean is true but no glyph is given', () => {
      const { container } = full({ type: 'text-only', icon: undefined });
      // Only the close box is left.
      expect(byClass(container, FIGMA.glyph.desktop)).toHaveLength(1);
    });

    it('renders no sub-text when showSubText is false', () => {
      full({ type: 'icon-text', showSubText: false });
      expect(screen.queryByText(SUB_TEXT)).not.toBeInTheDocument();
      expect(screen.getByText(HEADING)).toBeInTheDocument();
    });

    it('renders no sub-text when the boolean is true but no copy is given', () => {
      const { container } = full({ type: 'icon-text', subText: undefined });
      expect(container.textContent).not.toContain(SUB_TEXT);
    });

    it('keeps the two booleans independent', () => {
      for (const showLeftIcon of [true, false]) {
        for (const showSubText of [true, false]) {
          const { unmount } = full({ type: 'icon-text', showLeftIcon, showSubText });
          expect(screen.queryByText(SUB_TEXT) !== null, `${showSubText}`).toBe(showSubText);
          unmount();
        }
      }
    });
  });

  /* ------------------------------ composition ----------------------------- */

  describe('composition', () => {
    it('renders no illustration until the caller supplies one', () => {
      const { container } = full({ type: 'icon-text', illustration: undefined });
      expect(byClass(container, FIGMA.illustration.desktop)).toHaveLength(0);
    });

    it('renders the caller’s footer actions verbatim', () => {
      full();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    /* Figma gives each footer button `flex: 1 0 0`, so the row stretches its children. */
    it('sizes footer actions to equal widths', () => {
      const { container } = full();
      const footer = container.querySelector(`[class~="${FIGMA.footerGap}"][class~="*:flex-1"]`);
      expect(footer?.className).toContain('*:min-w-semantic-none');
      expect(footer?.children).toHaveLength(2);
    });

    it('renders no footer strip when there are no actions', () => {
      const { container } = full({ footer: undefined });
      expect(
        container.querySelector(`[class~="${FIGMA.footerGap}"][class~="*:flex-1"]`),
      ).toBeNull();
    });
  });

  /* -------------------------------- reuse --------------------------------- */

  /*
   * Figma nests the canonical Divider under the titled headers, so this renders that
   * component rather than drawing another 1px line.
   */
  describe('reuses the canonical Divider', () => {
    it.each(['text-only', 'custom'] as const)('renders a real Divider on %s', (type) => {
      full({ type });
      const rule = screen.getByRole('separator');
      // Divider omits `aria-orientation` when horizontal — that is the implicit default.
      expect(rule).not.toHaveAttribute('aria-orientation');
      expect(rule.className).toContain('h-px');
      expect(rule.className).toContain('w-full');
      expect(screen.getAllByRole('separator')).toHaveLength(1);
    });

    it('renders none on `icon+text`, which Figma draws without one', () => {
      full({ type: 'icon-text' });
      expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    });
  });

  /* --------------------------- the close control -------------------------- */

  describe('close control', () => {
    it('is a real button, on every variant', () => {
      for (const { device, type, label } of VARIANTS) {
        const { unmount } = full({ device, type });
        const close = closeButton();
        expect(close.tagName, label).toBe('BUTTON');
        expect(close, label).toHaveAttribute('type', 'button');
        unmount();
      }
    });

    it('renders the caller’s glyph verbatim', () => {
      full();
      expect(screen.getByTestId('close-glyph')).toBeInTheDocument();
      expect(closeButton().children).toHaveLength(1);
    });

    it('takes its accessible name from closeLabel', () => {
      full({ closeLabel: 'Close the delete dialog' });
      expect(screen.getByRole('button', { name: 'Close the delete dialog' })).toBeInTheDocument();
    });

    it('carries the shared focus ring, because it is focusable', () => {
      full();
      expect(closeButton().className).toContain('focus-visible:');
    });

    it('renders even without a handler, and clicking it then does nothing', async () => {
      const { container } = full({ onClose: undefined });
      const before = container.innerHTML;
      await userEvent.click(closeButton());
      expect(container.innerHTML).toBe(before);
    });
  });

  /* ------------------------------ visibility ------------------------------ */

  /*
   * The agreed division: the modal draws, the parent owns visibility. `onClose` reports
   * the press and nothing else — this component holds no state and never unmounts itself,
   * so a parent that ignores the call keeps seeing the modal, which is the correct
   * behaviour rather than a bug.
   */
  describe('`onClose` notifies; it does not dismiss', () => {
    it('calls onClose when the close button is pressed', async () => {
      const onClose = vi.fn();
      full({ onClose });
      await userEvent.click(closeButton());
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('stays mounted after onClose fires — the parent decides', async () => {
      const onClose = vi.fn();
      full({ onClose });
      await userEvent.click(closeButton());
      expect(root()).toBeInTheDocument();
      expect(closeButton()).toBeInTheDocument();
      expect(screen.getByText(HEADING)).toBeInTheDocument();
    });

    it('does not fire on a scrim click — backdrop dismissal is not implemented', async () => {
      const onClose = vi.fn();
      full({ onClose });
      await userEvent.click(root());
      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not fire on Escape — key dismissal is not implemented', async () => {
      const onClose = vi.fn();
      full({ onClose });
      closeButton().focus();
      await userEvent.keyboard('{Escape}');
      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not fire on a card click', async () => {
      const onClose = vi.fn();
      const { container } = full({ onClose });
      await userEvent.click(card(container) as HTMLElement);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  /* ------------------------------ semantics ------------------------------- */

  /*
   * The scrim is decoration, and the modal implements no focus containment — so it claims
   * no dialog semantics it cannot honour. A caller building real modal behaviour adds
   * `role="dialog"` and `aria-modal` along with the focus trap that makes them true.
   */
  describe('semantics', () => {
    it('claims no dialog role it cannot honour', () => {
      full();
      expect(root()).not.toHaveAttribute('role');
      expect(root()).not.toHaveAttribute('aria-modal');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('lets a caller supply dialog semantics themselves', () => {
      setup({ role: 'dialog', 'aria-modal': true, 'aria-label': 'Delete report' });
      expect(screen.getByRole('dialog', { name: 'Delete report' })).toBeInTheDocument();
    });

    it('hides the decorative glyphs from assistive technology', () => {
      full({ type: 'text-only' });
      expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('hides the illustration from assistive technology', () => {
      full({ type: 'icon-text' });
      expect(screen.getByTestId('art').parentElement).toHaveAttribute('aria-hidden', 'true');
    });

    /* No portal, no z-index, no animation, no focus management — none is published. */
    it('invents no behaviour Figma does not publish', () => {
      const { container } = full({ children: <p>Body</p> });
      const classes = [...container.querySelectorAll('*')]
        .map((el) => el.getAttribute('class') ?? '')
        .join(' ');
      for (const absent of ['animate-', 'transition', 'duration-', 'fixed', 'z-', 'overflow-y-']) {
        expect(classes, absent).not.toContain(absent);
      }
      expect(root()).not.toHaveAttribute('tabindex');
      // Rendered in place: no portal, so the root is a child of the render container.
      expect(container.firstElementChild).toBe(root());
      expect(document.body.children).toHaveLength(1);
    });
  });

  /* ------------------------------ public API ------------------------------ */

  /*
   * The public prop surface, asserted from the source so it cannot grow unnoticed. Eight
   * properties are Figma's; the rest exist only because the architecture needs them —
   * artwork the library does not ship, composition holes Figma marks as holes, a name an
   * icon-only control cannot do without, and the one notification the parent needs to own
   * visibility. A new prop fails this test until classified.
   */
  describe('public API', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src', 'components', 'Modal', 'Modal.tsx'),
      'utf8',
    );
    const ownProps = source.slice(
      source.indexOf('interface ModalOwnProps'),
      source.indexOf('export type ModalProps'),
    );
    const declared = [...ownProps.matchAll(/^ {2}([a-zA-Z]+)\??:/gm)].map((m) => m[1]);

    const FIGMA_PROPS = [
      'device',
      'type',
      'heading',
      'showSubText',
      'subText',
      'text',
      'showLeftIcon',
      'icon',
    ];
    const ENGINEERING_PROPS = [
      'illustration',
      'children',
      'footer',
      'closeIcon',
      'onClose',
      'closeLabel',
      'classNames',
    ];

    it('declares exactly the props that were agreed, and no others', () => {
      expect([...declared].sort()).toEqual([...FIGMA_PROPS, ...ENGINEERING_PROPS].sort());
    });

    it('names Figma’s properties exactly as Figma publishes them', () => {
      for (const prop of FIGMA_PROPS) expect(declared, prop).toContain(prop);
    });

    /*
     * The modal-management API this component deliberately does not have. Every entry was
     * ruled out explicitly: visibility is the parent's, and the rest are architecture this
     * library has not built and Figma has not published.
     */
    it('exposes no visibility, focus or layering props', () => {
      for (const absent of [
        'open',
        'defaultOpen',
        'isOpen',
        'onOpenChange',
        'onDismiss',
        'dismissable',
        'closeOnEscape',
        'closeOnBackdropClick',
        'backdrop',
        'overlay',
        'portal',
        'container',
        'zIndex',
        'trapFocus',
        'initialFocus',
        'restoreFocus',
        'autoFocus',
        'scrollLock',
        'animation',
        'duration',
        'size',
        'width',
        'height',
        'variant',
        'intent',
        'title',
        'description',
        'position',
        'placement',
      ]) {
        expect(declared, absent).not.toContain(absent);
      }
    });
  });

  describe('class overrides', () => {
    it('lets className win over a variant class', () => {
      setup({ className: 'bg-semantic-bg-primary' });
      expect(root().className).toContain('bg-semantic-bg-primary');
      expect(root().className).not.toContain(FIGMA.scrim);
    });

    it('targets every slot through classNames', () => {
      const { container } = full({
        type: 'text-only',
        classNames: {
          root: 'slot-root',
          card: 'slot-card',
          header: 'slot-header',
          icon: 'slot-icon',
          heading: 'slot-heading',
          close: 'slot-close',
          subText: 'slot-sub',
          text: 'slot-text',
          content: 'slot-content',
          footer: 'slot-footer',
        },
      });
      expect(root().className).toContain('slot-root');
      for (const slot of [
        '.slot-card',
        '.slot-header',
        '.slot-icon',
        '.slot-heading',
        '.slot-close',
        '.slot-text',
        '.slot-content',
        '.slot-footer',
      ]) {
        expect(container.querySelector(slot), slot).not.toBeNull();
      }
    });

    it('targets the `icon+text` slots the other types do not have', () => {
      const { container } = full({
        type: 'icon-text',
        classNames: { illustration: 'slot-art', subText: 'slot-sub' },
      });
      expect(container.querySelector('.slot-art')).not.toBeNull();
      expect(container.querySelector('.slot-sub')).not.toBeNull();
    });
  });
});
