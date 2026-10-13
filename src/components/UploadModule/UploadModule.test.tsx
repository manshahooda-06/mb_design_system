import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UploadModule } from './UploadModule';
import { UPLOAD_MODULE_SIZES, UPLOAD_MODULE_STATES } from './constants';

const LABEL = 'Upload New Prescription';

/**
 * Every measurement Figma publishes for `Upload Module` (node `2180:67664`), as the class
 * that carries it. The suite reads from this table rather than repeating literals, so a
 * value can only be wrong here — where it sits beside the Figma number it came from.
 */
const FIGMA = {
  sm: {
    frame: 'size-[100px]' /* 100 */,
    radius: 'rounded-md' /* 8 */,
    padding: 'p-semantic-lg' /* 12 */,
    gap: 'gap-semantic-md' /* 8 */,
    icon: 'size-semantic-3xl' /* 24 */,
    type: 'text-mobile-caption-md' /* 10/16 */,
    circle: 'size-semantic-3xl' /* 24 */,
    glyph: 'size-semantic-xl' /* 16 */,
    shadow: '[box-shadow:0px_1px_2px_0px_#0000000a,0px_4px_5px_0px_#00000014]',
    deleteTop: '-top-[13px]',
    deleteRight: '-right-[11px]',
  },
  md: {
    frame: 'size-semantic-11xl' /* 160 */,
    radius: 'rounded-xl' /* 12 */,
    padding: 'p-semantic-xl' /* 16 */,
    gap: 'gap-semantic-lg' /* 12 */,
    icon: 'size-semantic-4xl' /* 32 */,
    type: 'text-desktop-caption-md' /* 14/20 */,
    circle: 'size-semantic-4xl' /* 32 */,
    glyph: 'size-[21.333px]' /* 21.333 */,
    shadow: '[box-shadow:0px_1.333px_2.667px_0px_#0000000a,0px_5.333px_6.667px_0px_#00000014]',
    deleteTop: '-top-[17px]',
    deleteRight: '-right-[17px]',
  },
  lg: {
    frame: 'size-[240px]' /* 240 */,
    radius: 'rounded-2xl' /* 16 */,
    padding: 'p-semantic-3xl' /* 24 */,
    gap: 'gap-semantic-lg' /* 12 */,
    icon: 'size-semantic-6xl' /* 48 */,
    type: 'text-desktop-body-md' /* 20/28 */,
    circle: 'size-semantic-6xl' /* 48 */,
    glyph: 'size-semantic-4xl' /* 32 */,
    shadow: '[box-shadow:0px_2px_4px_0px_#0000000a,0px_8px_10px_0px_#00000014]',
    deleteTop: '-top-[25px]',
    deleteRight: '-right-[25px]',
  },
} as const;

function setup(props: Partial<Parameters<typeof UploadModule>[0]> = {}) {
  return render(<UploadModule data-testid="upload" {...props} />);
}

/*
 * Stand-ins for the caller's content. Figma's `eye`, `delete-02` and preview photograph
 * are all the caller's to supply, so the suite supplies them the way a consumer would.
 */
const EYE = <svg data-testid="eye" />;
const TRASH = <svg data-testid="trash" />;
const PREVIEW = <img data-testid="preview" src="/scan.png" alt="Prescription" />;

/** A Display card with both glyphs present — the state most assertions need. */
function displaySetup(props: Partial<Parameters<typeof UploadModule>[0]> = {}) {
  return setup({ state: 'display', viewIcon: EYE, deleteIcon: TRASH, ...props });
}

const root = () => screen.getByTestId('upload');
const previewSlot = (container: HTMLElement) => container.querySelector('.overflow-clip');
const circles = (container: HTMLElement) => [...container.querySelectorAll('.rounded-full')];
// Identified by what pins it, and with no fallback: a helper that guessed "the first
// circle" would report the delete affordance as the view one.
const viewCircle = (container: HTMLElement) =>
  circles(container).find((el) => el.className.includes('top-1/2'));
const deleteCircle = (container: HTMLElement) =>
  circles(container).find((el) => /-top-\[/.test(el.className));

describe('UploadModule', () => {
  describe('rendering', () => {
    it('implements exactly the axes Figma publishes', () => {
      expect([...UPLOAD_MODULE_SIZES]).toEqual(['sm', 'md', 'lg']);
      expect([...UPLOAD_MODULE_STATES]).toEqual(['add', 'display']);
    });

    it('defaults to sm and add', () => {
      setup();
      expect(root().className).toContain(FIGMA.sm.frame);
      expect(root().className).toContain(FIGMA.sm.padding);
    });

    it('passes native props through to the root', () => {
      setup({ id: 'upload-prescription' });
      expect(root().id).toBe('upload-prescription');
    });

    it('forwards a ref to the root', () => {
      const ref = createRef<HTMLElement>();
      render(<UploadModule ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('sets displayName', () => {
      expect((UploadModule as { displayName?: string }).displayName).toBe('UploadModule');
    });

    /*
     * Six published variants, and the suite renders all six rather than sampling.
     */
    it.each(
      UPLOAD_MODULE_SIZES.flatMap((size) => UPLOAD_MODULE_STATES.map((state) => [size, state])),
    )('renders the %s / %s variant', (size, state) => {
      const { unmount } = setup({
        size: size as keyof typeof FIGMA,
        state: state as 'add' | 'display',
      });
      expect(root().className).toContain(FIGMA[size as keyof typeof FIGMA].frame);
      expect(root().className).toContain(FIGMA[size as keyof typeof FIGMA].radius);
      unmount();
    });
  });

  /* ------------------------------- geometry ------------------------------- */

  describe('geometry — Figma’s `Size` axis', () => {
    it.each(UPLOAD_MODULE_SIZES)('pins the %s frame and radius', (size) => {
      setup({ size });
      expect(root().className).toContain(FIGMA[size].frame);
      expect(root().className).toContain(FIGMA[size].radius);
    });

    it.each(UPLOAD_MODULE_SIZES)('applies the %s padding and gap in the Add state', (size) => {
      setup({ size });
      expect(root().className).toContain(FIGMA[size].padding);
      expect(root().className).toContain(FIGMA[size].gap);
    });

    /*
     * Figma gives the Display frame neither: the preview is positioned rather than laid
     * out, so padding would inset it and a gap would apply to nothing.
     */
    it.each(UPLOAD_MODULE_SIZES)('gives the %s Display state no padding or gap', (size) => {
      setup({ size, state: 'display' });
      expect(root().className).not.toMatch(/\bp-semantic-/);
      expect(root().className).not.toMatch(/\bgap-semantic-/);
    });

    it.each(UPLOAD_MODULE_SIZES)('sizes the %s Add glyph box', (size) => {
      const { container } = setup({ size, icon: <svg data-testid="icon" /> });
      expect(container.querySelector('[aria-hidden="true"]')?.className).toContain(
        FIGMA[size].icon,
      );
    });

    /*
     * The height is pinned by the frame, not summed from the content — sm's Add body is
     * 12 + 24 + 8 + 16 + 12 = 72 inside a pinned 100 — so the content is centred.
     */
    it('centres the Add body in whatever the frame gives it', () => {
      setup();
      expect(root().className).toContain('flex');
      expect(root().className).toContain('flex-col');
      expect(root().className).toContain('items-center');
      expect(root().className).toContain('justify-center');
    });
  });

  describe('stroke', () => {
    /*
     * Figma's stroke is inside-aligned and paints over the preview's outer edge. A
     * border would give the preview a 98x98 content box and inset the image by 1px on
     * every side; a ring costs no layout, so the preview fills the frame and the stroke
     * lands on top. gray-light-100 has a border-role token, so no colour exception.
     */
    it.each(UPLOAD_MODULE_SIZES)('draws the %s stroke as an inset ring', (size) => {
      setup({ size });
      expect(root().className).toContain('inset-ring');
      expect(root().className).toContain('inset-ring-semantic-border-tertiary');
      // Not a `border-*` utility. Matched per class rather than by substring, because
      // the ring's own colour token contains the word "border".
      const classes = root().className.split(/\s+/);
      expect(classes).not.toContain('border');
      expect(classes.filter((c) => c.startsWith('border-'))).toEqual([]);
    });

    it('keeps the stroke in both states', () => {
      for (const state of UPLOAD_MODULE_STATES) {
        const { unmount } = setup({ state });
        expect(root().className, state).toContain('inset-ring-semantic-border-tertiary');
        unmount();
      }
    });
  });

  describe('typography', () => {
    it.each(UPLOAD_MODULE_SIZES)('applies the %s type step at weight 500', (size) => {
      setup({ size, label: LABEL });
      const label = screen.getByText(LABEL);
      expect(label.className).toContain(FIGMA[size].type);
      expect(label.className).toContain('font-medium');
      expect(label.className).toContain('text-semantic-text-primary');
    });

    /* Figma wraps the label and clips it against the frame rather than truncating. */
    it('wraps and clips rather than truncating', () => {
      setup({ label: LABEL });
      const label = screen.getByText(LABEL);
      expect(label.className).toContain('break-words');
      expect(label.className).toContain('overflow-hidden');
      expect(label.className).toContain('text-center');
      expect(label.className).not.toContain('truncate');
    });
  });

  /* -------------------------------- Add ---------------------------------- */

  describe('state="add" — Figma’s `buttonName` and `icon`', () => {
    it('renders the label and the glyph it is given', () => {
      setup({ label: LABEL, icon: <svg data-testid="icon" /> });
      expect(screen.getByText(LABEL)).toBeInTheDocument();
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('ships no default label copy', () => {
      const { container } = setup();
      expect(container.textContent).toBe('');
    });

    it('renders no glyph slot unless given one', () => {
      const { container } = setup();
      expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('renders the glyph decoratively — the label carries the meaning', () => {
      const { container } = setup({ label: LABEL, icon: <svg data-testid="icon" /> });
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
      expect(screen.getByText(LABEL)).not.toHaveAttribute('aria-hidden');
    });

    it('renders the caller’s glyph verbatim, with nothing substituted', () => {
      const { container } = setup({ icon: <svg data-testid="icon" viewBox="0 0 24 24" /> });
      const slot = container.querySelector('[aria-hidden="true"]');
      expect(slot?.children).toHaveLength(1);
      expect(slot?.firstElementChild).toBe(screen.getByTestId('icon'));
    });
  });

  /* ------------------------------ Display -------------------------------- */

  describe('state="display" — preview', () => {
    it('renders the preview it is given, clipped to the card radius', () => {
      const { container } = setup({
        state: 'display',
        preview: <img data-testid="preview" src="/scan.png" alt="Prescription" />,
      });
      expect(screen.getByTestId('preview')).toBeInTheDocument();
      const slot = previewSlot(container);
      expect(slot?.className).toContain('absolute');
      expect(slot?.className).toContain('inset-semantic-none');
      expect(slot?.className).toContain('overflow-clip');
    });

    it.each(UPLOAD_MODULE_SIZES)('clips the %s preview to that size’s radius', (size) => {
      const { container } = setup({ size, state: 'display', preview: <img alt="" src="/s.png" /> });
      expect(previewSlot(container)?.className).toContain(FIGMA[size].radius);
    });

    it('covers the frame and does not intercept pointer events', () => {
      const { container } = setup({ state: 'display', preview: <img alt="" src="/s.png" /> });
      expect(previewSlot(container)?.className).toContain('*:object-cover');
      expect(previewSlot(container)?.className).toContain('*:size-full');
      expect(previewSlot(container)?.className).toContain('pointer-events-none');
    });

    it('renders no preview slot unless given one', () => {
      const { container } = setup({ state: 'display' });
      expect(previewSlot(container)).toBeNull();
    });

    it('leaves the preview visible to assistive technology — it is the content', () => {
      setup({ state: 'display', preview: <img data-testid="preview" src="/s.png" alt="Scan" /> });
      expect(screen.getByAltText('Scan')).toBeInTheDocument();
    });

    /*
     * The clip belongs to the preview, not the root: the delete affordance hangs across
     * the corner, so a clipped root would slice it off.
     */
    it('does not clip the root, so the delete affordance survives', () => {
      setup({ state: 'display' });
      expect(root().className).not.toContain('overflow-clip');
    });
  });

  /*
   * Figma's own booleans, kept exactly as published — `showViewIcons` plural against
   * `showDeleteIcon` singular. Each is gated with its glyph: the boolean decides whether
   * the affordance is wanted, the glyph whether there is anything to draw. Figma never
   * draws an empty circle, and no artwork ships here that could fill one.
   */
  describe('state="display" — Figma’s visibility booleans', () => {
    it('shows both affordances when both booleans and both glyphs are present', () => {
      const { container } = displaySetup();
      expect(circles(container)).toHaveLength(2);
      expect(screen.getByTestId('eye')).toBeInTheDocument();
      expect(screen.getByTestId('trash')).toBeInTheDocument();
    });

    it('defaults both booleans to true, as Figma does', () => {
      const { container } = setup({ state: 'display', viewIcon: EYE, deleteIcon: TRASH });
      expect(circles(container)).toHaveLength(2);
    });

    it('renders no view affordance when showViewIcons is false', () => {
      const { container } = displaySetup({ showViewIcons: false });
      expect(circles(container)).toHaveLength(1);
      expect(screen.queryByTestId('eye')).not.toBeInTheDocument();
      expect(deleteCircle(container)).toBeDefined();
    });

    it('renders no delete affordance when showDeleteIcon is false', () => {
      const { container } = displaySetup({ showDeleteIcon: false });
      expect(circles(container)).toHaveLength(1);
      expect(screen.queryByTestId('trash')).not.toBeInTheDocument();
      expect(deleteCircle(container)).toBeUndefined();
    });

    it('renders neither when both booleans are false', () => {
      const { container } = displaySetup({ showViewIcons: false, showDeleteIcon: false });
      expect(circles(container)).toHaveLength(0);
    });

    /* The bug this gate exists to prevent: a true boolean with nothing to put in it. */
    it('draws no empty circle when showViewIcons is true but no glyph is supplied', () => {
      const { container } = setup({ state: 'display', deleteIcon: TRASH });
      expect(circles(container)).toHaveLength(1);
      expect(viewCircle(container)).toBeUndefined();
    });

    it('draws no empty circle when showDeleteIcon is true but no glyph is supplied', () => {
      const { container } = setup({ state: 'display', viewIcon: EYE });
      expect(circles(container)).toHaveLength(1);
      expect(deleteCircle(container)).toBeUndefined();
    });

    it('draws no circles at all when neither glyph is supplied', () => {
      const { container } = setup({ state: 'display' });
      expect(circles(container)).toHaveLength(0);
    });

    it('keeps the two affordances independently controlled', () => {
      for (const [showViewIcons, showDeleteIcon, expected] of [
        [true, true, 2],
        [true, false, 1],
        [false, true, 1],
        [false, false, 0],
      ] as const) {
        const { container, unmount } = displaySetup({ showViewIcons, showDeleteIcon });
        expect(circles(container), `${showViewIcons}/${showDeleteIcon}`).toHaveLength(expected);
        unmount();
      }
    });

    it('does not let one glyph stand in for the other', () => {
      const { container } = setup({ state: 'display', viewIcon: EYE });
      expect(viewCircle(container)).toBeDefined();
      expect(deleteCircle(container)).toBeUndefined();
    });
  });

  describe('state="display" — affordance geometry', () => {
    it.each(UPLOAD_MODULE_SIZES)('sizes the %s circles and glyphs', (size) => {
      const { container } = displaySetup({ size });
      for (const circle of circles(container)) {
        expect(circle.className).toContain(FIGMA[size].circle);
      }
      expect(screen.getByTestId('eye').parentElement?.className).toContain(FIGMA[size].glyph);
      expect(screen.getByTestId('trash').parentElement?.className).toContain(FIGMA[size].glyph);
    });

    it.each(UPLOAD_MODULE_SIZES)('applies the %s action shadow exactly', (size) => {
      const { container } = displaySetup({ size });
      for (const circle of circles(container)) {
        expect(circle.className).toContain(FIGMA[size].shadow);
      }
    });

    it('centres the view affordance in the card', () => {
      const { container } = displaySetup();
      const view = viewCircle(container);
      expect(view?.className).toContain('top-1/2');
      expect(view?.className).toContain('left-1/2');
      expect(view?.className).toContain('-translate-x-1/2');
      expect(view?.className).toContain('-translate-y-1/2');
    });

    /*
     * Figma's own offsets, which do not agree with each other: sm puts the circle's
     * centre 1px inside the corner, md and lg 1px outside. Reproduced as drawn.
     */
    it.each(UPLOAD_MODULE_SIZES)('pins the %s delete affordance at Figma’s offsets', (size) => {
      const { container } = displaySetup({ size });
      const del = deleteCircle(container);
      expect(del?.className).toContain(FIGMA[size].deleteTop);
      expect(del?.className).toContain(FIGMA[size].deleteRight);
    });

    it('draws both affordances as white circles', () => {
      const { container } = displaySetup();
      for (const circle of circles(container)) {
        expect(circle.className).toContain('rounded-full');
        expect(circle.className).toContain('bg-semantic-bg-primary');
      }
    });

    it('colours the view glyph brand and the delete glyph error', () => {
      const { container } = displaySetup();
      expect(viewCircle(container)?.className).toContain('text-semantic-fg-brand-primary');
      expect(deleteCircle(container)?.className).toContain('text-semantic-fg-error-primary');
    });

    it('renders each caller-supplied glyph verbatim', () => {
      displaySetup();
      for (const id of ['eye', 'trash']) {
        const slot = screen.getByTestId(id).parentElement;
        expect(slot?.children).toHaveLength(1);
        expect(slot?.firstElementChild).toBe(screen.getByTestId(id));
        expect(screen.getByTestId(id).tagName).toBe('svg');
      }
    });
  });

  /*
   * No artwork ships with this component. Figma's `upload-04`, `eye` and `delete-02` are
   * icon-library components and its preview is a placeholder photograph, so all four are
   * the caller's to supply — the convention Checkbox's tick and SearchBar's magnifier
   * already follow.
   */
  describe('no invented artwork', () => {
    it('draws nothing of its own in either state', () => {
      for (const state of UPLOAD_MODULE_STATES) {
        const { container, unmount } = setup({ state });
        expect(container.querySelector('svg'), state).toBeNull();
        expect(container.querySelector('img'), state).toBeNull();
        expect(container.innerHTML, state).not.toContain('background-image');
        expect(container.innerHTML, state).not.toContain('url(');
        unmount();
      }
    });

    it('renders only what the caller supplied, and nothing beside it', () => {
      const { container } = displaySetup({ preview: PREVIEW });
      expect(container.querySelectorAll('svg')).toHaveLength(2);
      expect(container.querySelectorAll('img')).toHaveLength(1);
    });
  });

  /* ------------------------------ public API ----------------------------- */

  /*
   * The public prop surface, asserted from the source so it cannot grow unnoticed. Six
   * properties are Figma's; the rest exist only because React needs them — artwork the
   * library does not ship, handlers Figma does not publish, and names an icon-only
   * control cannot do without. A new prop fails this test until it is classified.
   */
  describe('public API', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src', 'components', 'UploadModule', 'UploadModule.tsx'),
      'utf8',
    );
    const ownProps = source.slice(
      source.indexOf('interface UploadModuleOwnProps'),
      source.indexOf('export type UploadModuleProps'),
    );
    const declared = [...ownProps.matchAll(/^ {2}([a-zA-Z]+)\?:/gm)].map((m) => m[1]);

    const FIGMA_PROPS = ['size', 'state', 'label', 'icon', 'showViewIcons', 'showDeleteIcon'];
    const ENGINEERING_PROPS = [
      'preview',
      'viewIcon',
      'onView',
      'viewLabel',
      'deleteIcon',
      'onDelete',
      'deleteLabel',
      'onUpload',
      'classNames',
    ];

    it('declares exactly the props that were agreed, and no others', () => {
      expect([...declared].sort()).toEqual([...FIGMA_PROPS, ...ENGINEERING_PROPS].sort());
    });

    it('names Figma’s six properties exactly as Figma publishes them', () => {
      // `label` is the one rename, from Figma's `buttonName`; the plural on
      // `showViewIcons` and the singular on `showDeleteIcon` are Figma's own.
      for (const prop of ['size', 'state', 'icon', 'showViewIcons', 'showDeleteIcon']) {
        expect(declared, prop).toContain(prop);
      }
      expect(declared).not.toContain('buttonName');
      expect(declared).not.toContain('showViewIcon');
    });

    it('marks every engineering-only prop as such in its own doc comment', () => {
      for (const prop of ENGINEERING_PROPS.filter((p) => p !== 'classNames')) {
        const at = ownProps.indexOf(`  ${prop}?:`);
        const doc = ownProps.slice(Math.max(0, at - 900), at);
        expect(doc, prop).toMatch(/\*\*(Implementation|Engineering|Accessibility)/);
      }
    });

    it('exposes one classNames slot per element it renders, and no more', () => {
      const slots = source
        .slice(source.indexOf('export type UploadModuleSlot'), source.indexOf('interface Upload'))
        .match(/'[a-zA-Z]+'/g)
        ?.map((s) => s.slice(1, -1));
      expect(slots).toEqual(['root', 'icon', 'label', 'preview', 'view', 'delete']);
    });
  });

  /* --------------------------- state isolation --------------------------- */

  describe('state isolation — the two prop sets are parallel, not shared', () => {
    it('ignores every Add prop in the Display state', () => {
      const onUpload = vi.fn();
      const { container } = displaySetup({
        label: LABEL,
        icon: <svg data-testid="icon" />,
        onUpload,
      });
      expect(screen.queryByText(LABEL)).not.toBeInTheDocument();
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
      // And the root never becomes a button in Display, where it would wrap two.
      expect(root().tagName).toBe('DIV');
      expect(container.querySelector('button')).toBeNull();
    });

    it('ignores every Display prop in the Add state', () => {
      const { container } = setup({
        label: LABEL,
        preview: PREVIEW,
        viewIcon: EYE,
        deleteIcon: TRASH,
        onView: vi.fn(),
        onDelete: vi.fn(),
        viewLabel: 'View',
        deleteLabel: 'Delete',
      });
      expect(screen.queryByTestId('preview')).not.toBeInTheDocument();
      expect(screen.queryByTestId('eye')).not.toBeInTheDocument();
      expect(screen.queryByTestId('trash')).not.toBeInTheDocument();
      expect(circles(container)).toHaveLength(0);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('keeps the visibility booleans inert in the Add state', () => {
      const { container } = setup({
        showViewIcons: true,
        showDeleteIcon: true,
        viewIcon: EYE,
        deleteIcon: TRASH,
      });
      expect(circles(container)).toHaveLength(0);
    });
  });

  /* --------------------------- accessibility ----------------------------- */

  /*
   * Figma publishes no interaction anywhere in the 6. Everything here is opt-in: a part
   * becomes a control only when the caller hands it something to do, which is the rule
   * TopNavigationBar's account block already follows.
   */
  describe('accessibility and interaction', () => {
    it('renders an inert div until given something to do', () => {
      setup({ label: LABEL });
      expect(root().tagName).toBe('DIV');
      expect(root()).not.toHaveAttribute('type');
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('becomes a button when onUpload is given, and fires it', async () => {
      const onUpload = vi.fn();
      setup({ label: LABEL, onUpload });
      const button = screen.getByRole('button', { name: LABEL });
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
      await userEvent.click(button);
      expect(onUpload).toHaveBeenCalledOnce();
    });

    it('carries a focus ring only when it is a control', () => {
      const { unmount } = setup({ label: LABEL });
      expect(root().className).not.toContain('focus-visible:');
      unmount();
      setup({ label: LABEL, onUpload: vi.fn() });
      expect(root().className).toContain('focus-visible:');
    });

    it('makes each affordance a button only when its handler is given', async () => {
      const onView = vi.fn();
      const onDelete = vi.fn();
      displaySetup({
        onView,
        onDelete,
        viewLabel: 'View prescription',
        deleteLabel: 'Delete prescription',
      });
      const view = screen.getByRole('button', { name: 'View prescription' });
      const del = screen.getByRole('button', { name: 'Delete prescription' });
      expect(view).toHaveAttribute('type', 'button');
      expect(del).toHaveAttribute('type', 'button');
      await userEvent.click(view);
      await userEvent.click(del);
      expect(onView).toHaveBeenCalledOnce();
      expect(onDelete).toHaveBeenCalledOnce();
    });

    it('hides an affordance from assistive technology when it does nothing', () => {
      const { container } = displaySetup();
      for (const circle of circles(container)) {
        expect(circle.tagName).toBe('SPAN');
        expect(circle).toHaveAttribute('aria-hidden', 'true');
      }
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('gives an interactive affordance a focus ring', () => {
      const { container } = displaySetup({ onView: vi.fn(), viewLabel: 'View' });
      expect(viewCircle(container)?.className).toContain('focus-visible:');
    });

    it('does not fire a handler for an affordance the boolean hid', async () => {
      const onDelete = vi.fn();
      displaySetup({ showDeleteIcon: false, onDelete, deleteLabel: 'Delete' });
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('leaves the Add glyph decorative and the label readable', () => {
      const { container } = setup({ label: LABEL, icon: <svg /> });
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
      expect(screen.getByText(LABEL)).not.toHaveAttribute('aria-hidden');
    });
  });

  /*
   * Figma publishes no hover, focus, pressed, active, selected, disabled, error, loading,
   * progress or drag treatment across the 6. Asserted so none can arrive later as an
   * invention — the one focus ring is opt-in and checked above.
   */
  describe('no state axis beyond State', () => {
    it('binds no interaction state Figma does not publish', () => {
      const { container } = displaySetup({ preview: PREVIEW });
      const classes = [...container.querySelectorAll('*')]
        .map((el) => el.getAttribute('class') ?? '')
        .concat(root().className)
        .join(' ');
      for (const state of ['hover:', 'active:', 'disabled:', 'aria-invalid:']) {
        expect(classes, state).not.toContain(state);
      }
    });

    it('renders no file input, progress or drop zone', () => {
      const { container } = setup({ label: LABEL, onUpload: vi.fn() });
      expect(container.querySelector('input')).toBeNull();
      expect(container.querySelector('progress')).toBeNull();
      expect(root()).not.toHaveAttribute('aria-dropeffect');
    });
  });

  describe('class overrides', () => {
    it('lets className win over a variant class', () => {
      setup({ className: 'rounded-full' });
      expect(root().className).toContain('rounded-full');
      expect(root().className).not.toContain('rounded-md');
    });

    it('targets each Add slot through classNames', () => {
      const { container } = setup({
        label: LABEL,
        icon: <svg />,
        classNames: { root: 'slot-root', icon: 'slot-icon', label: 'slot-label' },
      });
      expect(root().className).toContain('slot-root');
      expect(container.querySelector('.slot-icon')).not.toBeNull();
      expect(screen.getByText(LABEL).className).toContain('slot-label');
    });

    it('targets each Display slot through classNames', () => {
      const { container } = displaySetup({
        preview: PREVIEW,
        classNames: { preview: 'slot-preview', view: 'slot-view', delete: 'slot-delete' },
      });
      for (const slot of ['.slot-preview', '.slot-view', '.slot-delete']) {
        expect(container.querySelector(slot), slot).not.toBeNull();
      }
    });
  });
});
