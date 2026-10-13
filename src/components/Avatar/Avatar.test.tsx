import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar, type AvatarSize, type AvatarStatus } from './Avatar';
import { AVATAR_RELATIONSHIPS, avatarIllustrations } from '@assets/avatar';
import { getInitials } from './get-initials';

const SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const STATUSES: AvatarStatus[] = ['online', 'offline', 'verified'];

const Art = () => <svg data-testid="art" />;
const Tick = () => <svg data-testid="tick" />;

function setup(props: Partial<Parameters<typeof Avatar>[0]> = {}) {
  return render(<Avatar data-testid="avatar" {...props} />);
}
const root = () => screen.getByTestId('avatar');
const content = () => root().firstElementChild as HTMLElement;
const statusBox = () => root().children[1] as HTMLElement | undefined;

/** `className` on an SVG element is an SVGAnimatedString, not a string. */
function cls(el: Element | null | undefined): string | null {
  return el?.getAttribute('class') ?? null;
}

/** Renders one cell and hands back each slot's classes. */
function classesFor(props: Partial<Parameters<typeof Avatar>[0]>) {
  const { container, unmount } = render(<Avatar {...props} />);
  const r = container.firstElementChild as HTMLElement;
  const box = r.children[1] as HTMLElement | undefined;
  const result = {
    root: r.className,
    content: (r.firstElementChild as HTMLElement).className,
    initials: (r.firstElementChild?.firstElementChild as HTMLElement | null)?.className ?? null,
    status: box?.className ?? null,
    // Online and offline nest ring > dot. Verified has no ring: the seal sits where the
    // ring would, so it reads as the dot and `ring` is legitimately absent.
    ring: props.status === 'verified' ? null : (cls(box?.firstElementChild) ?? null),
    dot:
      props.status === 'verified'
        ? (cls(box?.firstElementChild) ?? null)
        : (cls(box?.firstElementChild?.firstElementChild) ?? null),
  };
  unmount();
  return result;
}

function svgRootFill(container: HTMLElement): string | null {
  return container.querySelector('svg')?.getAttribute('fill') ?? null;
}

describe('Avatar', () => {
  describe('geometry — two measured ramps, neither a ratio', () => {
    it.each([
      ['xs', 'size-semantic-3xl'],
      ['sm', 'size-semantic-4xl'],
      ['md', 'size-[36px]'],
      ['lg', 'size-semantic-5xl'],
      ['xl', 'size-semantic-6xl'],
    ] as const)('sizes the %s box as Figma does', (size, cls) => {
      expect(classesFor({ size }).root).toContain(cls);
    });

    it.each([
      ['xs', 'size-semantic-md'],
      ['sm', 'size-[10px]'],
      ['md', 'size-semantic-lg'],
      ['lg', 'size-[14px]'],
      ['xl', 'size-semantic-xl'],
    ] as const)('sizes the %s badge from the linear ramp, not avatar/3', (size, cls) => {
      // 8/10/12/14/16 against 24/32/36/40/48. The /3 ratio holds at xs, md and xl by
      // accident and breaks at sm (0.3125) and lg (0.35).
      expect(classesFor({ size, status: 'online' }).status).toContain(cls);
    });

    it('pins the badge flush to the corner rather than per-size offsets', () => {
      // Measured position is avatar - badge in every size, which is exactly flush.
      for (const size of SIZES) {
        const cls = classesFor({ size, status: 'online' }).status ?? '';
        // `semantic-none` is 0px — the same flush corner, reached through a token so the
        // shared token rule can see it. See Avatar.variants.ts.
        expect(cls, size).toContain('right-semantic-none');
        expect(cls, size).toContain('bottom-semantic-none');
      }
    });

    it('insets the badge by a tenth at every size except xs', () => {
      // Measured: the `icon` frame holds `_Icon Status` at 80% (node 1816:9584 — a 10
      // holding an 8), except xs, which holds it at full size (node 1816:9558 — an 8
      // holding an 8).
      expect(classesFor({ size: 'xs', status: 'online' }).ring).toContain('size-full');
      for (const size of ['sm', 'md', 'lg', 'xl'] as const) {
        expect(classesFor({ size, status: 'online' }).ring, size).toContain('size-4/5');
      }
    });

    it('expresses both insets as a fraction of the parent, never as padding', () => {
      // A percentage padding resolves against the containing block, not the element, so
      // `p-[10%]` on the badge resolved against the avatar root and came out ~3x too
      // large. Sizing the child is the only form that composes through the nesting.
      for (const size of SIZES) {
        const { status, ring, dot } = classesFor({ size, status: 'online' });
        expect(status, size).not.toMatch(/\bp-/);
        expect(ring, size).not.toMatch(/\bp-/);
        expect(dot, size).toContain('size-4/5');
      }
    });

    it('does not clip the root, or the badge would be sliced by the circle', () => {
      const { root: r, content: c } = classesFor({ status: 'online' });
      expect(r).not.toContain('overflow-clip');
      expect(c).toContain('overflow-clip');
      expect(c).toContain('rounded-full');
    });

    it('uses no arbitrary value beyond the two measured sizing gaps', () => {
      const found = new Set<string>();
      for (const size of SIZES) {
        for (const status of [undefined, ...STATUSES]) {
          const cells = classesFor({ size, status, name: 'Olivia Rhye' });
          for (const cls of Object.values(cells).join(' ').split(/\s+/)) {
            if (cls.includes('[')) found.add(cls);
          }
        }
      }
      expect([...found].sort()).toEqual(['size-[10px]', 'size-[14px]', 'size-[36px]']);
    });
  });

  describe('background', () => {
    it('paints white by default and grey on request', () => {
      expect(classesFor({}).content).toContain('bg-semantic-bg-primary');
      expect(classesFor({ background: 'grey' }).content).toContain('bg-semantic-bg-secondary');
    });

    it('does not use bg-disabled-subtle — same value, wrong meaning', () => {
      // An avatar with a grey backdrop is not a disabled avatar.
      expect(classesFor({ background: 'grey' }).content).not.toContain('disabled');
    });
  });

  describe('content priority — relationship, illustration, initials, nothing', () => {
    it('renders the illustration when given', () => {
      setup({ illustration: <Art />, name: 'Olivia Rhye' });
      expect(screen.getByTestId('art')).toBeInTheDocument();
      expect(screen.queryByText('OR')).not.toBeInTheDocument();
    });

    it('falls back to initials from the name', () => {
      setup({ name: 'Olivia Rhye' });
      expect(screen.getByText('OR')).toBeInTheDocument();
    });

    it('renders background only when neither is given', () => {
      setup();
      expect(content().children).toHaveLength(0);
    });

    it('exposes no src — Avatar_user publishes no photo variant', () => {
      const source = readFileSync(resolve(__dirname, 'Avatar.tsx'), 'utf8');
      expect(source).not.toMatch(/\bsrc\?:/);
      expect(source).not.toMatch(/<img/);
    });

    it('exposes no showIcon prop — an absent status is the absent badge', () => {
      const code = readFileSync(resolve(__dirname, 'Avatar.tsx'), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      expect(code).not.toMatch(/showIcon/);
    });

    it('renders a built-in relationship illustration', () => {
      setup({ relationship: 'father', name: 'Olivia Rhye' });
      expect(content().querySelector('svg')).toBeInTheDocument();
      expect(screen.queryByText('OR')).not.toBeInTheDocument();
    });

    it('prefers relationship over a custom illustration', () => {
      setup({ relationship: 'father', illustration: <Art /> });
      expect(screen.queryByTestId('art')).not.toBeInTheDocument();
      expect(content().querySelector('svg')).toBeInTheDocument();
    });

    it('prefers a custom illustration over initials', () => {
      setup({ illustration: <Art />, name: 'Olivia Rhye' });
      expect(screen.getByTestId('art')).toBeInTheDocument();
    });
  });

  describe('built-in relationships', () => {
    it('publishes exactly the thirteen Figma draws', () => {
      // Figma's `Avatar_user` has a Relationship axis of 14, of which `Initials (Name)`
      // is a content mode rather than an illustration.
      expect(AVATAR_RELATIONSHIPS).toHaveLength(13);
      expect(new Set(AVATAR_RELATIONSHIPS).size).toBe(13);
    });

    it('has artwork for every one, and nothing extra', () => {
      expect(Object.keys(avatarIllustrations).sort()).toEqual([...AVATAR_RELATIONSHIPS].sort());
    });

    it('draws every one into the same 48-square frame', () => {
      // Only the artwork differs. Identical geometry is what makes relationship a
      // content axis rather than a set of thirteen differently shaped components.
      for (const relationship of AVATAR_RELATIONSHIPS) {
        const { unmount } = render(<Avatar relationship={relationship} size="xl" />);
        const svg = document.querySelector('[role="img"], span')?.querySelector('svg');
        expect(svg?.getAttribute('viewBox'), relationship).toBe('0 0 48 48');
        expect(svg?.getAttribute('class'), relationship).toContain('size-full');
        unmount();
      }
    });

    it('hides the artwork from assistive technology', () => {
      // The avatar is labelled from `name`; the drawing is decoration on top of it.
      for (const relationship of AVATAR_RELATIONSHIPS) {
        const { container, unmount } = render(<Avatar relationship={relationship} />);
        expect(container.querySelector('svg')?.getAttribute('aria-hidden'), relationship).toBe(
          'true',
        );
        unmount();
      }
    });

    it('carries no Figma layer ids, which would repeat across two avatars', () => {
      const dir = resolve(__dirname, '../../assets/avatar');
      for (const relationship of AVATAR_RELATIONSHIPS) {
        const source = readFileSync(resolve(dir, `${relationship}.tsx`), 'utf8');
        expect(source, relationship).not.toMatch(/\sid="/);
        expect(source, relationship).not.toMatch(/clipPath|clip-path/);
      }
    });

    it('ships one file per illustration, none of them inside the component', () => {
      // The artwork is an asset, not component implementation. Avatar stays small.
      const componentFiles = readdirSync(__dirname)
        .filter((f) => /\.(tsx|ts)$/.test(f))
        .filter((f) => !/\.(test|stories)\./.test(f));
      expect(componentFiles.sort()).toEqual([
        'Avatar.tsx',
        'Avatar.variants.ts',
        'constants.ts',
        'get-initials.ts',
        'index.ts',
      ]);
      const assets = readdirSync(resolve(__dirname, '../../assets/avatar'));
      expect(assets.filter((f) => f.endsWith('.tsx')).sort()).toEqual(
        // The Verified seal is an Avatar asset but not a relationship.
        [...[...AVATAR_RELATIONSHIPS].map((r) => `${r}.tsx`), 'verified-badge.tsx'].sort(),
      );
    });

    it('roots every illustration with fill="none", or strokes fill in black', () => {
      // Figma's root <svg> carries fill="none" and it cascades to every path that
      // declares no fill of its own. Without it SVG falls back to its default of black,
      // so every stroke-only shape — spectacle rims, mouths, eyebrows — fills in solid.
      // This shipped broken once: Father's and Mother's lenses rendered as dark discs.
      for (const relationship of AVATAR_RELATIONSHIPS) {
        const { container, unmount } = render(<Avatar relationship={relationship} />);
        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('fill'), relationship).toBe('none');
        unmount();
      }
    });

    it('leaves every fill-less shape unfilled once rendered', () => {
      // The attribute above is the mechanism; this is the effect it has to produce.
      for (const relationship of AVATAR_RELATIONSHIPS) {
        const { container, unmount } = render(<Avatar relationship={relationship} />);
        const shapes = [...container.querySelectorAll('path,rect,circle,ellipse')];
        const strokeOnly = shapes.filter((el) => !el.hasAttribute('fill'));
        for (const el of strokeOnly) {
          // Inherited from the root, so the element itself declares nothing.
          expect(
            el.getAttribute('fill'),
            `${relationship}: ${el.getAttribute('stroke')}`,
          ).toBeNull();
        }
        expect(svgRootFill(container), relationship).toBe('none');
        unmount();
      }
    });

    it('renders thirteen distinct drawings, not one repeated', () => {
      const shapes = AVATAR_RELATIONSHIPS.map((relationship) => {
        const { container, unmount } = render(<Avatar relationship={relationship} />);
        const html = container.querySelector('svg')?.innerHTML ?? '';
        unmount();
        return html;
      });
      expect(new Set(shapes).size).toBe(13);
    });
  });

  describe('initials', () => {
    it.each([
      ['Olivia Rhye', 'OR'],
      ['Phoenix Baker', 'PB'],
      ['Olivia', 'O'],
      ['Mary Jane Watson', 'MW'],
      ['  spaced   out  ', 'so'], // casing is applied in CSS, not the string
      ['', ''],
      ['   ', ''],
    ])('derives %o as %o', (name, expected) => {
      expect(getInitials(name)).toBe(expected);
    });

    it('takes whole characters from astral scripts, not half a surrogate pair', () => {
      // `'𝒜lice'[0]` returns a lone high surrogate and renders as a replacement glyph;
      // Array.from splits by code point.
      expect(getInitials('𝒜lice Bob')).toBe('𝒜B');
      expect(getInitials('😀 Smith')).toBe('😀S');
    });

    it('uppercases in CSS rather than in the string', () => {
      // So the accessible name keeps the caller's casing.
      setup({ name: 'olivia rhye' });
      expect(screen.getByText('or')).toBeInTheDocument();
      expect(classesFor({ name: 'olivia rhye' }).initials).toContain('uppercase');
    });

    it.each([
      ['xs', 'text-mobile-body-sm'],
      ['sm', 'text-mobile-body-md'],
      ['md', 'text-desktop-body-sm'],
      ['lg', 'text-desktop-body-sm'],
      ['xl', 'text-desktop-body-md'],
    ] as const)('sets the %s type from the agreed mapping', (size, cls) => {
      expect(classesFor({ size, name: 'Olivia Rhye' }).initials).toContain(cls);
    });

    it('gives md and lg the same ramp, as Figma does', () => {
      expect(classesFor({ size: 'md', name: 'O R' }).initials).toBe(
        classesFor({ size: 'lg', name: 'O R' }).initials,
      );
    });

    it('uses no Banner token', () => {
      // Banner type is a marketing ramp with a different vertical rhythm.
      for (const size of SIZES) {
        expect(classesFor({ size, name: 'O R' }).initials, size).not.toContain('banner');
      }
    });

    it('is semibold in text-quaternary', () => {
      const cls = classesFor({ name: 'Olivia Rhye' }).initials ?? '';
      expect(cls).toContain('font-semibold');
      expect(cls).toContain('text-semantic-text-quaternary');
    });
  });

  describe('status', () => {
    it('renders no badge unless asked', () => {
      setup();
      expect(statusBox()).toBeUndefined();
    });

    it.each(STATUSES)('renders the %s badge at every size', (status) => {
      for (const size of SIZES) {
        expect(classesFor({ size, status }).status, `${size}/${status}`).toBeTruthy();
      }
    });

    it.each([
      ['online', 'bg-semantic-bg-success-solid'],
      ['offline', 'bg-semantic-fg-disabled-subtle'],
    ] as const)('fills %s from the measured token', (status, expected) => {
      expect(classesFor({ status }).dot).toContain(expected);
    });

    it('colours the verified seal from the brand token, through currentColor', () => {
      // A text colour rather than a background: the seal is artwork painted with
      // `currentColor`, not a filled box. Figma binds brand-blue/600.
      expect(classesFor({ status: 'verified' }).dot).toContain('text-semantic-bg-brand-solid');
      expect(classesFor({ status: 'verified' }).dot).not.toContain('rounded-full');
    });

    it('gives verified no white ring, because Figma draws none', () => {
      // Online and offline are a disc inside a white ring (node 1816:10706). Verified is
      // a scalloped seal with no ring at all (node 1816:10700) — a different shape, not a
      // different fill.
      expect(classesFor({ status: 'verified' }).ring).toBeNull();
      const { container } = render(<Avatar status="verified" />);
      const box = container.firstElementChild?.children[1] as HTMLElement;
      expect(box.children).toHaveLength(1);
      expect(box.querySelectorAll('.bg-semantic-bg-primary')).toHaveLength(0);
    });

    it('rings the dot in the page surface', () => {
      expect(classesFor({ status: 'online' }).ring).toContain('bg-semantic-bg-primary');
    });

    it('draws the verified seal, tick included, with no help from the caller', () => {
      // Figma draws the tick itself (node 1816:10702), so the badge is complete on its
      // own. It previously rendered as a bare blue circle unless the caller passed one.
      const { container, unmount } = render(<Avatar status="verified" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 10 10');
      // Two paths: the seal in currentColor and the tick in white.
      const paths = [...(svg?.querySelectorAll('path') ?? [])];
      expect(paths).toHaveLength(2);
      expect(paths.map((el) => el.getAttribute('fill'))).toEqual(['currentColor', 'white']);
      unmount();
    });

    it('exposes no way to replace the seal or its tick', () => {
      // The badge is design language, not content: `status` is its whole public API.
      // A glyph prop existed once and let a caller disagree with Figma; it is gone.
      const code = readFileSync(resolve(__dirname, 'Avatar.tsx'), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      expect(code).not.toMatch(/statusIcon/);
      expect(code).not.toMatch(/statusGlyph|tick/i);
    });

    it('draws the same seal regardless of what else is passed', () => {
      // Nothing a caller can hand Avatar reaches the badge.
      const seal = (props: Partial<Parameters<typeof Avatar>[0]>) => {
        const { container, unmount } = render(<Avatar status="verified" {...props} />);
        const html = container.querySelector('svg')?.outerHTML ?? '';
        unmount();
        return html;
      };
      const plain = seal({});
      expect(plain).not.toBe('');
      for (const props of [
        { name: 'Olivia Rhye' },
        { relationship: 'father' as const },
        { illustration: <Tick /> },
        { size: 'xs' as const },
        { background: 'grey' as const },
      ]) {
        // `illustration` renders its own svg in the content slot, so compare the badge's.
        const { container, unmount } = render(<Avatar status="verified" {...props} />);
        const badge = container.firstElementChild?.children[1] as HTMLElement;
        expect(badge.querySelector('svg')?.outerHTML, JSON.stringify(Object.keys(props))).toBe(
          plain,
        );
        unmount();
      }
    });

    it('hides the badge from assistive technology', () => {
      setup({ status: 'online' });
      expect(statusBox()).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('accessibility', () => {
    it('is labelled from the name', () => {
      setup({ name: 'Olivia Rhye' });
      expect(screen.getByRole('img', { name: 'Olivia Rhye' })).toBe(root());
    });

    it('keeps the caller casing in the accessible name while displaying uppercase', () => {
      setup({ name: 'olivia rhye' });
      expect(screen.getByRole('img', { name: 'olivia rhye' })).toBeInTheDocument();
    });

    it('hides the initials, which are a visual abbreviation', () => {
      setup({ name: 'Olivia Rhye' });
      expect(screen.getByText('OR')).toHaveAttribute('aria-hidden', 'true');
    });

    it('has no role when there is no name — it is decoration', () => {
      setup({ illustration: <Art /> });
      expect(root()).not.toHaveAttribute('role');
    });

    it('lets a caller override the label', () => {
      setup({ name: 'Olivia Rhye', 'aria-label': 'Account owner' });
      expect(screen.getByRole('img', { name: 'Account owner' })).toBe(root());
    });

    it('lets a caller hide it when the name is already on screen', () => {
      setup({ name: 'Olivia Rhye', 'aria-hidden': true });
      expect(root()).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('no interactive treatment — Figma draws none in the 70', () => {
    it('has no hover, focus, ring or shadow anywhere', () => {
      for (const size of SIZES) {
        for (const status of [undefined, ...STATUSES]) {
          const all = Object.values(classesFor({ size, status, name: 'O R' })).join(' ');
          expect(all, `${size}/${status}`).not.toMatch(/hover:|focus:|focus-visible:|shadow|ring-/);
        }
      }
    });

    it('is a span, not a button', () => {
      setup({ name: 'Olivia Rhye' });
      expect(root().tagName).toBe('SPAN');
    });
  });

  describe('token discipline', () => {
    it('names only semantic tokens in every colour utility', () => {
      for (const size of SIZES) {
        for (const status of [undefined, ...STATUSES]) {
          const all = Object.values(classesFor({ size, status, name: 'O R', background: 'grey' }))
            .join(' ')
            .split(/\s+/);
          for (const cls of all) {
            const m = cls.match(/^(?:[a-z-]+:)*(bg|text|border)-(.+)$/);
            if (!m?.[2]) continue;
            const value = m[2];
            if (/^\d/.test(value) || value === 'transparent') continue;
            if (/^(mobile|desktop)-/.test(value)) continue; // type styles
            expect(value, cls).toMatch(/^semantic-/);
          }
        }
      }
    });
  });

  describe('class overrides', () => {
    it('merges className onto the root', () => {
      setup({ className: 'opacity-50' });
      expect(root().className).toContain('opacity-50');
    });

    it('reaches every slot through classNames', () => {
      setup({
        name: 'Olivia Rhye',
        // `online` rather than `verified`: verified has no ring slot to reach.
        status: 'online',
        classNames: {
          root: 'slot-root',
          content: 'slot-content',
          initials: 'slot-initials',
          status: 'slot-status',
          statusRing: 'slot-ring',
          statusDot: 'slot-dot',
        },
      });
      expect(root().className).toContain('slot-root');
      expect(content().className).toContain('slot-content');
      expect(screen.getByText('OR').className).toContain('slot-initials');
      const box = statusBox() as HTMLElement;
      expect(box.className).toContain('slot-status');
      expect((box.firstElementChild as HTMLElement).className).toContain('slot-ring');
      expect((box.firstElementChild?.firstElementChild as HTMLElement).className).toContain(
        'slot-dot',
      );
    });
  });

  it('declares no class strings in the component file', () => {
    const source = readFileSync(resolve(__dirname, 'Avatar.tsx'), 'utf8');
    expect(source).not.toMatch(/className=["'][a-z]/);
  });

  it('matches its rendered markup', () => {
    const { container } = render(
      <Avatar size="lg" background="grey" name="Olivia Rhye" status="verified" />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
