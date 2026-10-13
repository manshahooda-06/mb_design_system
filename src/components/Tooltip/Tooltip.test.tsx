import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tooltip } from './Tooltip';
import { TOOLTIP_ARROW_POSITIONS, TOOLTIP_CONSTANTS } from './constants';
import type { TooltipArrowPosition } from './types';

const { ARROW } = TOOLTIP_CONSTANTS;

const LABEL = 'This is a tooltip';
const SUPPORTING = 'Tooltips are used to describe or identify an element.';

/** Every position Figma publishes that actually draws an arrow. */
const DRAWN_POSITIONS = TOOLTIP_ARROW_POSITIONS.filter(
  (a): a is Exclude<TooltipArrowPosition, 'none'> => a !== 'none',
);

/** The four that attach above or below, which add height rather than width. */
const VERTICAL_POSITIONS = ['bottom-center', 'bottom-left', 'bottom-right', 'top-center'] as const;
/** The two that attach on a side, which add width rather than height. */
const SIDE_POSITIONS = ['left', 'right'] as const;

function setup(props: Partial<Parameters<typeof Tooltip>[0]> = {}) {
  return render(<Tooltip label={LABEL} data-testid="tooltip" {...props} />);
}

const root = () => screen.getByTestId('tooltip');
const arrowOf = (container: HTMLElement) => container.querySelector('span[aria-hidden="true"]');
const svgOf = (container: HTMLElement) => container.querySelector('svg');
const labelOf = () => screen.getByText(LABEL);

describe('Tooltip', () => {
  describe('rendering', () => {
    it('renders its label', () => {
      setup();
      expect(labelOf()).toBeInTheDocument();
    });

    it('renders as a div — Figma draws no interactive root', () => {
      setup();
      expect(root().tagName).toBe('DIV');
    });

    it('renders no supporting text unless given some', () => {
      setup();
      expect(screen.queryByText(SUPPORTING)).not.toBeInTheDocument();
    });

    it('renders no arrow by default', () => {
      const { container } = setup();
      expect(arrowOf(container)).toBeNull();
      expect(svgOf(container)).toBeNull();
    });

    it('passes native props through to the root', () => {
      setup({ id: 'save-tip' });
      expect(root().id).toBe('save-tip');
    });

    it('forwards a ref to the root', () => {
      const ref = createRef<HTMLDivElement>();
      render(<Tooltip ref={ref} label={LABEL} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('sets displayName', () => {
      expect((Tooltip as { displayName?: string }).displayName).toBe('Tooltip');
    });
  });

  /*
   * Figma publishes `Supporting text` as a boolean, but the boolean is derived here
   * from whether there is anything to show, so "true with no text" cannot happen.
   */
  describe('content — Figma’s `Supporting text` axis', () => {
    it('renders both texts when supporting text is given', () => {
      setup({ supportingText: SUPPORTING });
      expect(labelOf()).toBeInTheDocument();
      expect(screen.getByText(SUPPORTING)).toBeInTheDocument();
    });

    it('treats an empty string as supporting text — the caller asked for the slot', () => {
      const { container } = setup({ supportingText: '' });
      // 12 all round is the two-line box; 12/8 is the one-line box.
      expect(container.querySelector('.p-semantic-lg')).not.toBeNull();
    });

    it('ignores null and undefined supporting text', () => {
      for (const value of [null, undefined]) {
        const { container, unmount } = setup({ supportingText: value });
        expect(container.querySelector('.py-semantic-md')).not.toBeNull();
        unmount();
      }
    });

    /*
     * Padding is 12/8 alone and 12 all round with supporting text. Both are read
     * from Figma, and the published heights are what confirm them:
     * 8 + 20 + 8 = 36, and 12 + (20 + 2 + 48) + 12 = 94.
     */
    it('uses Figma’s 12/8 padding for a label on its own', () => {
      const { container } = setup();
      const content = container.querySelector('.rounded-md');
      expect(content?.className).toContain('px-semantic-lg');
      expect(content?.className).toContain('py-semantic-md');
    });

    it('uses Figma’s 12-all-round padding once supporting text joins it', () => {
      const { container } = setup({ supportingText: SUPPORTING });
      const content = container.querySelector('.rounded-md');
      expect(content?.className).toContain('p-semantic-lg');
      expect(content?.className).not.toContain('py-semantic-md');
    });

    /*
     * The label is centred and unwrapped alone, and a left-aligned wrapping block
     * once it has supporting text under it. Figma draws both; it is not styling.
     */
    it('centres and does not wrap a label on its own', () => {
      setup();
      expect(labelOf().className).toContain('text-center');
      expect(labelOf().className).toContain('whitespace-nowrap');
    });

    it('lets the label wrap once it has supporting text', () => {
      setup({ supportingText: SUPPORTING });
      expect(labelOf().className).not.toContain('whitespace-nowrap');
      expect(labelOf().className).not.toContain('text-center');
      expect(labelOf().className).toContain('w-full');
    });

    it('separates the two texts by Figma’s 2px gap', () => {
      const { container } = setup({ supportingText: SUPPORTING });
      expect(container.querySelector('.gap-semantic-xxs')).not.toBeNull();
    });

    it('applies the measured type steps to each text', () => {
      setup({ supportingText: SUPPORTING });
      // Body-sm-Medium 12/20 and Caption-md-Light 10/16 — both exact token matches.
      expect(labelOf().className).toContain('text-mobile-body-sm');
      expect(labelOf().className).toContain('font-medium');
      const supporting = screen.getByText(SUPPORTING);
      expect(supporting.className).toContain('text-mobile-caption-md');
      expect(supporting.className).toContain('font-light');
    });
  });

  describe('arrowPosition — Figma’s `Arrow` axis', () => {
    it('implements every position Figma publishes and no others', () => {
      expect([...TOOLTIP_ARROW_POSITIONS]).toEqual([
        'none',
        'bottom-center',
        'bottom-left',
        'bottom-right',
        'top-center',
        'left',
        'right',
      ]);
    });

    it.each(DRAWN_POSITIONS)('draws an arrow for %s', (arrowPosition) => {
      const { container } = setup({ arrowPosition });
      expect(arrowOf(container)).not.toBeNull();
      expect(svgOf(container)).not.toBeNull();
    });

    /*
     * Both axes land on exact spacing tokens: 16 is semantic-xl and 6 is semantic-sm,
     * so the arrow's box needs no off-scale value.
     */
    it.each(VERTICAL_POSITIONS)('gives %s a 16x6 footprint', (arrowPosition) => {
      const { container } = setup({ arrowPosition });
      const className = arrowOf(container)?.className ?? '';
      expect(className).toContain('w-semantic-xl');
      expect(className).toContain('h-semantic-sm');
    });

    it.each(SIDE_POSITIONS)('gives %s a 6x16 footprint', (arrowPosition) => {
      const { container } = setup({ arrowPosition });
      const className = arrowOf(container)?.className ?? '';
      expect(className).toContain('w-semantic-sm');
      expect(className).toContain('h-semantic-xl');
    });

    /*
     * Figma reaches the offset positions with a wider 28px arrow frame flush to the
     * edge; one semantic-lg of margin puts the arrow's near edge in the same place
     * and reaches it through a token.
     */
    it('insets bottom-left by one spacing-lg from the left', () => {
      const { container } = setup({ arrowPosition: 'bottom-left' });
      expect(arrowOf(container)?.className).toContain('ms-semantic-lg');
    });

    it('insets bottom-right by one spacing-lg from the right', () => {
      const { container } = setup({ arrowPosition: 'bottom-right' });
      expect(arrowOf(container)?.className).toContain('me-semantic-lg');
    });

    it('aligns each position the way Figma’s wrapper does', () => {
      const expected: Record<Exclude<TooltipArrowPosition, 'none'>, string> = {
        'bottom-center': 'items-center',
        'bottom-left': 'items-start',
        'bottom-right': 'items-end',
        'top-center': 'items-center',
        left: 'items-center',
        right: 'items-center',
      };
      for (const [arrowPosition, alignment] of Object.entries(expected)) {
        const { unmount } = setup({ arrowPosition: arrowPosition as TooltipArrowPosition });
        expect(root().className, arrowPosition).toContain(alignment);
        unmount();
      }
    });

    it('stacks the verticals in a column and the sides in a row', () => {
      for (const arrowPosition of VERTICAL_POSITIONS) {
        const { unmount } = setup({ arrowPosition });
        expect(root().className, arrowPosition).toContain('flex-col');
        unmount();
      }
      for (const arrowPosition of SIDE_POSITIONS) {
        const { unmount } = setup({ arrowPosition });
        expect(root().className, arrowPosition).toContain('flex-row');
        unmount();
      }
    });

    /*
     * Figma's exported path points down, so the bottom three are unrotated. Rotating a
     * down-pointing shape clockwise puts it on the left, which is why left is +90.
     */
    it('rotates the glyph only where Figma does', () => {
      const expected: Record<Exclude<TooltipArrowPosition, 'none'>, string | null> = {
        'bottom-center': null,
        'bottom-left': null,
        'bottom-right': null,
        'top-center': 'rotate-180',
        left: 'rotate-90',
        right: '-rotate-90',
      };
      for (const [arrowPosition, rotation] of Object.entries(expected)) {
        const { container, unmount } = setup({
          arrowPosition: arrowPosition as TooltipArrowPosition,
        });
        const className = svgOf(container)?.getAttribute('class') ?? '';
        if (rotation === null) {
          expect(className, arrowPosition).not.toContain('rotate');
        } else {
          // `-rotate-90` contains `rotate-90`, so compare exactly.
          expect(className.trim(), arrowPosition).toBe(rotation);
        }
        unmount();
      }
    });

    /*
     * The glyph crops to the protruding 6px through its viewBox rather than
     * oversizing and hiding the rest behind the bubble as Figma does. Same render,
     * and it keeps the box on tokens.
     */
    it('draws the exported path cropped to the part that shows', () => {
      const { container } = setup({ arrowPosition: 'bottom-center' });
      const svg = svgOf(container);
      expect(svg?.getAttribute('width')).toBe(String(ARROW.WIDTH));
      expect(svg?.getAttribute('height')).toBe(String(ARROW.PROTRUSION));
      expect(svg?.getAttribute('viewBox')).toBe(ARROW.VIEW_BOX);
      expect(svg?.querySelector('path')?.getAttribute('d')).toBe(ARROW.PATH);
    });

    it('keeps the cropped window consistent with the exported shape', () => {
      // The viewBox is `0 <overlap> 16 6`, and overlap is what Figma hides.
      expect(ARROW.SHAPE_HEIGHT - ARROW.PROTRUSION).toBeCloseTo(ARROW.OVERLAP, 5);
      expect(ARROW.VIEW_BOX).toBe(`0 ${ARROW.OVERLAP} ${ARROW.WIDTH} ${ARROW.PROTRUSION}`);
    });

    it('paints the arrow from the same token as the bubble', () => {
      const { container } = setup({ arrowPosition: 'bottom-center' });
      // currentColor on the glyph, driven by a text utility reading the surface token,
      // so the arrow cannot drift from the bubble it belongs to.
      expect(arrowOf(container)?.className).toContain('text-semantic-bg-primary-solid');
      expect(svgOf(container)?.querySelector('path')?.getAttribute('fill')).toBe('currentColor');
      expect(container.querySelector('.rounded-md')?.className).toContain(
        'bg-semantic-bg-primary-solid',
      );
    });

    /*
     * Document order, not just visual placement: Figma's exported `Top center` lists
     * the arrow before `Content` and `Bottom left` after it.
     */
    it('puts the arrow before the bubble for top-center and left', () => {
      for (const arrowPosition of ['top-center', 'left'] as const) {
        const { unmount } = setup({ arrowPosition });
        expect(root().firstElementChild?.getAttribute('aria-hidden'), arrowPosition).toBe('true');
        unmount();
      }
    });

    it('puts the arrow after the bubble for the bottom three and right', () => {
      for (const arrowPosition of [
        'bottom-center',
        'bottom-left',
        'bottom-right',
        'right',
      ] as const) {
        const { unmount } = setup({ arrowPosition });
        expect(root().lastElementChild?.getAttribute('aria-hidden'), arrowPosition).toBe('true');
        expect(root().firstElementChild?.getAttribute('aria-hidden'), arrowPosition).toBeNull();
        unmount();
      }
    });
  });

  describe('shadow', () => {
    /*
     * A filter rather than a box-shadow, on the wrapper rather than the bubble, so it
     * traces bubble-plus-arrow as one silhouette.
     */
    it('carries the shadow on the root, not the bubble', () => {
      const { container } = setup({ arrowPosition: 'bottom-center' });
      expect(root().className).toContain('[filter:drop-shadow(');
      expect(container.querySelector('.rounded-md')?.className).not.toContain('shadow');
    });

    it('emits all three of Figma’s layers', () => {
      setup();
      const { className } = root();
      for (const { offsetY, blur, color } of TOOLTIP_CONSTANTS.SHADOW.LAYERS) {
        expect(className).toContain(`drop-shadow(0_${offsetY}px_${blur}px_${color})`);
      }
    });
  });

  describe('accessibility', () => {
    it('is a tooltip to assistive technology', () => {
      setup();
      expect(root()).toHaveAttribute('role', 'tooltip');
    });

    /*
     * role="tooltip" names nothing on its own — a trigger has to point at it. The id
     * is the caller's because only the caller can put the same value on the trigger.
     */
    it('can be referenced by a trigger through aria-describedby', () => {
      render(
        <>
          <button aria-describedby="save-tip">Save</button>
          <Tooltip id="save-tip" label={LABEL} />
        </>,
      );
      const trigger = screen.getByRole('button', { name: 'Save' });
      expect(trigger).toHaveAccessibleDescription(LABEL);
    });

    it('hides the arrow from assistive technology', () => {
      const { container } = setup({ arrowPosition: 'bottom-center' });
      expect(arrowOf(container)).toHaveAttribute('aria-hidden', 'true');
    });

    it('exposes both texts as the description', () => {
      render(
        <>
          <button aria-describedby="tip">Save</button>
          <Tooltip id="tip" label={LABEL} supportingText={SUPPORTING} />
        </>,
      );
      const description = screen.getByRole('button').getAttribute('aria-describedby');
      expect(description).toBe('tip');
      expect(screen.getByText(SUPPORTING)).toBeInTheDocument();
    });

    it('lets a caller override the role', () => {
      setup({ role: 'status' });
      expect(root()).toHaveAttribute('role', 'status');
    });
  });

  describe('class overrides', () => {
    it('lets className win over a variant class on the root', () => {
      // twMerge must drop the variant's direction rather than emit both.
      setup({ className: 'flex-row' });
      const { className } = root();
      expect(className).toContain('flex-row');
      expect(className).not.toContain('flex-col');
    });

    it('targets each slot through classNames', () => {
      const { container } = setup({
        arrowPosition: 'bottom-center',
        supportingText: SUPPORTING,
        classNames: {
          root: 'slot-root',
          content: 'slot-content',
          group: 'slot-group',
          label: 'slot-label',
          supportingText: 'slot-supporting',
          arrow: 'slot-arrow',
        },
      });
      expect(root().className).toContain('slot-root');
      expect(container.querySelector('.slot-content')).not.toBeNull();
      expect(container.querySelector('.slot-group')).not.toBeNull();
      expect(labelOf().className).toContain('slot-label');
      expect(screen.getByText(SUPPORTING).className).toContain('slot-supporting');
      expect(arrowOf(container)?.className).toContain('slot-arrow');
    });
  });

  /*
   * Figma publishes exactly two properties, and neither is a state. Asserting the
   * absence keeps a hover or focus treatment from arriving later as an invention.
   */
  describe('no state axis', () => {
    it('binds no interaction state anywhere in the component', () => {
      const { container } = setup({ arrowPosition: 'bottom-center', supportingText: SUPPORTING });
      const classes = [...container.querySelectorAll('*')]
        .map((el) => el.getAttribute('class') ?? '')
        .join(' ');
      for (const state of ['hover:', 'focus:', 'focus-visible:', 'active:', 'disabled:']) {
        expect(classes, state).not.toContain(state);
      }
    });
  });
});
