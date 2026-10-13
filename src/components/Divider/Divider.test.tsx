import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Divider } from './Divider';
import {
  DIVIDER_DASH_GAP,
  DIVIDER_DASH_LENGTH,
  DIVIDER_ORIENTATIONS,
  DIVIDER_STYLES,
  DIVIDER_VARIANTS,
} from './constants';

/**
 * Every value Figma publishes for `Divider` (node `4725:3274`), as the class that carries
 * it. The suite reads from this table rather than repeating literals, so a value can only
 * be wrong here — where it sits beside the Figma number it came from.
 */
const FIGMA = {
  axis: {
    horizontal: { thickness: 'h-px', length: 'w-full' },
    vertical: { thickness: 'w-px', length: 'h-full' },
  },
  colour: {
    normal: 'utility-gray-100' /* gray-light-mode/100, #DBE0E6 */,
    lighter: 'utility-gray-50' /* gray-light-mode/50, #EBEEF1 */,
  },
  /* stroke-dasharray="2 2" — 2px of line, 2px of gap. */
  dashDirection: { horizontal: 'to_right', vertical: 'to_bottom' },
} as const;

function setup(props: Partial<Parameters<typeof Divider>[0]> = {}) {
  return render(<Divider data-testid="divider" {...props} />);
}

const rule = () => screen.getByTestId('divider');

/** Every published combination, as Figma's component set enumerates them. */
const EVERY_VARIANT = DIVIDER_ORIENTATIONS.flatMap((orientation) =>
  DIVIDER_STYLES.flatMap((style) =>
    DIVIDER_VARIANTS.map((variant) => ({ orientation, style, variant })),
  ),
);

describe('Divider', () => {
  describe('rendering', () => {
    it('implements exactly the axes Figma publishes', () => {
      expect([...DIVIDER_ORIENTATIONS]).toEqual(['horizontal', 'vertical']);
      expect([...DIVIDER_STYLES]).toEqual(['solid', 'dashed']);
      expect([...DIVIDER_VARIANTS]).toEqual(['normal', 'lighter']);
    });

    it('publishes exactly eight combinations', () => {
      expect(EVERY_VARIANT).toHaveLength(8);
    });

    it('defaults to horizontal, solid, normal', () => {
      setup();
      expect(rule().className).toContain(FIGMA.axis.horizontal.thickness);
      expect(rule().className).toContain(FIGMA.axis.horizontal.length);
      expect(rule().className).toContain(`bg-semantic-${FIGMA.colour.normal}`);
    });

    it('passes native props through to the root', () => {
      setup({ id: 'menu-rule' });
      expect(rule().id).toBe('menu-rule');
    });

    it('forwards a ref to the root', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Divider ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('sets displayName', () => {
      expect((Divider as { displayName?: string }).displayName).toBe('Divider');
    });

    it('renders a single element with no children', () => {
      setup();
      expect(rule().children).toHaveLength(0);
      expect(rule().textContent).toBe('');
    });

    it.each(EVERY_VARIANT)('renders the $orientation / $style / $variant variant', (combo) => {
      setup(combo);
      expect(rule()).toBeInTheDocument();
      expect(rule().className).toContain(FIGMA.axis[combo.orientation].thickness);
      expect(rule().className).toContain(FIGMA.axis[combo.orientation].length);
    });
  });

  /* -------------------------------- axis --------------------------------- */

  /*
   * Figma's frames are 328 x 0.0000287 and 0.0000143 x 328: the cross axis is zero and
   * every visible pixel is the stroke. So one axis is 1px and the other fills.
   */
  describe('orientation — Figma’s axis', () => {
    it('makes a horizontal rule 1px tall and full width', () => {
      setup({ orientation: 'horizontal' });
      expect(rule().className).toContain('h-px');
      expect(rule().className).toContain('w-full');
      expect(rule().className).not.toContain('w-px');
      expect(rule().className).not.toContain('h-full');
    });

    it('makes a vertical rule 1px wide and full height', () => {
      setup({ orientation: 'vertical' });
      expect(rule().className).toContain('w-px');
      expect(rule().className).toContain('h-full');
      expect(rule().className).not.toContain('h-px');
      expect(rule().className).not.toContain('w-full');
    });

    /*
     * The 1px comes from the box being 1px, never from a border. A border on a box that
     * already has thickness would draw both and the rule would render 2px.
     */
    it.each(EVERY_VARIANT)('draws $orientation / $style / $variant with no border at all', (c) => {
      setup(c);
      const classes = rule().className.split(/\s+/);
      expect(classes).not.toContain('border');
      expect(classes.filter((x) => x.startsWith('border-'))).toEqual([]);
      expect(classes.filter((x) => x.startsWith('inset-ring'))).toEqual([]);
      expect(classes.filter((x) => x.startsWith('ring'))).toEqual([]);
      expect(classes.filter((x) => x.startsWith('outline'))).toEqual([]);
    });

    it.each(EVERY_VARIANT)('gives $orientation / $style / $variant exactly one 1px axis', (c) => {
      setup(c);
      const classes = rule().className.split(/\s+/);
      const thickness = classes.filter((x) => x === 'h-px' || x === 'w-px');
      expect(thickness).toHaveLength(1);
      expect(thickness[0]).toBe(FIGMA.axis[c.orientation].thickness);
    });

    /* 328 is Figma's sample frame length, not a constraint — nothing pins a length. */
    it.each(EVERY_VARIANT)('pins no length on $orientation / $style / $variant', (c) => {
      setup(c);
      expect(rule().className).not.toContain('328');
      expect(rule().className).not.toMatch(/\b[wh]-\[/);
    });

    it('does not collapse in a flex container', () => {
      setup();
      expect(rule().className).toContain('shrink-0');
    });
  });

  /* ------------------------------- colour -------------------------------- */

  describe('variant — Figma’s two greys', () => {
    it.each(DIVIDER_ORIENTATIONS)('fills a solid %s normal rule with gray-light-100', (o) => {
      setup({ orientation: o, style: 'solid', variant: 'normal' });
      expect(rule().className).toContain(`bg-semantic-${FIGMA.colour.normal}`);
    });

    it.each(DIVIDER_ORIENTATIONS)('fills a solid %s lighter rule with gray-light-50', (o) => {
      setup({ orientation: o, style: 'solid', variant: 'lighter' });
      expect(rule().className).toContain(`bg-semantic-${FIGMA.colour.lighter}`);
    });

    it('never applies both greys at once', () => {
      for (const c of EVERY_VARIANT) {
        const { unmount } = setup(c);
        const cls = rule().className;
        const label = `${c.orientation}/${c.style}/${c.variant}`;
        const other = c.variant === 'normal' ? FIGMA.colour.lighter : FIGMA.colour.normal;
        expect(cls, label).toContain(FIGMA.colour[c.variant]);
        expect(cls, label).not.toContain(other);
        unmount();
      }
    });

    /*
     * Both greys come from `utility-*` rather than the border family, because only one of
     * them has a border-role token: nothing in that family carries gray-light-50.
     */
    it.each(EVERY_VARIANT)('reaches $variant through a semantic token, not a primitive', (c) => {
      setup(c);
      expect(rule().className).toContain('semantic-utility-gray-');
      expect(rule().className).not.toContain('gray-light-');
    });
  });

  /* -------------------------------- style -------------------------------- */

  describe('style — solid', () => {
    it.each(DIVIDER_ORIENTATIONS)('draws %s solid as a flat fill, with no pattern', (o) => {
      for (const variant of DIVIDER_VARIANTS) {
        const { unmount } = setup({ orientation: o, style: 'solid', variant });
        expect(rule().className).toContain('bg-semantic-utility-gray-');
        expect(rule().className).not.toContain('repeating-linear-gradient');
        unmount();
      }
    });
  });

  /*
   * Figma publishes `stroke-dasharray="2 2"`. CSS leaves dashed-border geometry to the
   * browser and Chrome's does not match it — 8 dashes against Figma's 10 over the same
   * 40px — so the pattern is a hard-stop gradient instead, which reproduces 2/2 exactly.
   */
  describe('style — dashed', () => {
    it('carries Figma’s pattern as data', () => {
      expect(DIVIDER_DASH_LENGTH).toBe(2);
      expect(DIVIDER_DASH_GAP).toBe(2);
    });

    it.each(DIVIDER_ORIENTATIONS)('draws %s dashed as a repeating gradient', (o) => {
      for (const variant of DIVIDER_VARIANTS) {
        const { unmount } = setup({ orientation: o, style: 'dashed', variant });
        expect(rule().className).toContain('repeating-linear-gradient');
        unmount();
      }
    });

    it.each(DIVIDER_ORIENTATIONS)('uses exactly 2px of line and 2px of gap on %s', (o) => {
      for (const variant of DIVIDER_VARIANTS) {
        const { unmount } = setup({ orientation: o, style: 'dashed', variant });
        const dash = `${DIVIDER_DASH_LENGTH}px`;
        const period = `${DIVIDER_DASH_LENGTH + DIVIDER_DASH_GAP}px`;
        // Hard stops: the colour runs 0 -> 2px, then transparent 2px -> 4px.
        expect(rule().className).toContain(`_0_${dash},transparent_${dash}_${period}`);
        unmount();
      }
    });

    it('runs the pattern along the long axis of each orientation', () => {
      for (const orientation of DIVIDER_ORIENTATIONS) {
        const { unmount } = setup({ orientation, style: 'dashed' });
        expect(rule().className, orientation).toContain(FIGMA.dashDirection[orientation]);
        unmount();
      }
    });

    it('never uses a dashed border, which would not match Figma', () => {
      for (const orientation of DIVIDER_ORIENTATIONS) {
        const { unmount } = setup({ orientation, style: 'dashed' });
        expect(rule().className).not.toContain('border-dashed');
        expect(rule().className).not.toContain('dashed ');
        unmount();
      }
    });

    it.each(DIVIDER_VARIANTS)('colours the %s dash with its own semantic token', (variant) => {
      setup({ style: 'dashed', variant });
      expect(rule().className).toContain(`var(--color-semantic-${FIGMA.colour[variant]})`);
    });

    it('draws no image asset', () => {
      const { container } = setup({ style: 'dashed' });
      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('svg')).toBeNull();
      expect(rule().className).not.toContain('url(');
    });
  });

  /* --------------------------- accessibility ----------------------------- */

  describe('accessibility', () => {
    it.each(EVERY_VARIANT)('exposes $orientation / $style / $variant as a separator', (c) => {
      setup(c);
      expect(rule()).toHaveAttribute('role', 'separator');
    });

    it('marks a vertical rule’s orientation', () => {
      setup({ orientation: 'vertical' });
      expect(rule()).toHaveAttribute('aria-orientation', 'vertical');
    });

    /* `separator` is horizontal by default, so saying so would only be noise. */
    it('leaves a horizontal rule’s orientation implicit', () => {
      setup({ orientation: 'horizontal' });
      expect(rule()).not.toHaveAttribute('aria-orientation');
    });

    it('lets a caller make a decorative rule presentational', () => {
      setup({ role: 'presentation' });
      expect(rule()).toHaveAttribute('role', 'presentation');
    });

    it('lets a caller hide a decorative rule entirely', () => {
      setup({ 'aria-hidden': true });
      expect(rule()).toHaveAttribute('aria-hidden', 'true');
    });

    it('is not interactive and holds no state', () => {
      setup();
      expect(rule()).not.toHaveAttribute('tabindex');
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      for (const state of ['hover:', 'focus:', 'focus-visible:', 'active:', 'disabled:']) {
        expect(rule().className, state).not.toContain(state);
      }
    });
  });

  /* ------------------------------ public API ----------------------------- */

  /*
   * The public prop surface, asserted from the source so it cannot grow unnoticed. Three
   * properties are Figma's and there are no engineering additions at all — a rule needs
   * none. A new prop fails this test until it is justified.
   */
  describe('public API', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src', 'components', 'Divider', 'Divider.tsx'),
      'utf8',
    );
    const ownProps = source.slice(
      source.indexOf('interface DividerOwnProps'),
      source.indexOf('export type DividerProps'),
    );
    const declared = [...ownProps.matchAll(/^ {2}([a-zA-Z]+)\?:/gm)].map((m) => m[1]);

    it('declares exactly Figma’s three axes, and nothing else', () => {
      expect([...declared].sort()).toEqual(['orientation', 'style', 'variant']);
    });

    /* The speculative surface a divider tends to grow. None of it is published. */
    it('exposes no invented properties', () => {
      for (const absent of [
        'color',
        'colour',
        'thickness',
        'size',
        'length',
        'spacing',
        'inset',
        'alignment',
        'align',
        'device',
        'state',
        'label',
        'children',
        'classNames',
        'asChild',
      ]) {
        expect(declared, absent).not.toContain(absent);
      }
    });

    /* One element means no slots, so `className` alone is the whole override surface. */
    it('needs no per-slot overrides', () => {
      expect(source).not.toContain('SlotClassNames');
    });
  });

  describe('class overrides', () => {
    it('lets className win over a variant class', () => {
      setup({ className: 'h-0.5' });
      expect(rule().className).toContain('h-0.5');
      expect(rule().className).not.toContain('h-px');
    });

    it('lets a caller pin a length without touching the component', () => {
      setup({ className: 'w-[328px]' });
      expect(rule().className).toContain('w-[328px]');
    });
  });
});
