import type { Meta, StoryObj } from '@storybook/react-vite';
import { elevation, elevationSource } from '@tokens/elevation';

/**
 * Documentation page for the elevation foundation.
 *
 * Everything here is local to this file on purpose — a docs page is not a
 * reusable component and must not be exported from the package.
 */

/**
 * Class names written out in full rather than built from the token key.
 *
 * Tailwind emits a utility only for a class it can literally see in the source, so
 * `shadow-${token}` would render every swatch flat. Keeping the map here also means
 * this page fails to compile if a token is renamed, rather than silently losing a
 * swatch.
 */
const SHADOW_CLASS: Record<keyof typeof elevation, string> = {
  'elevation-1': 'shadow-elevation-1',
  'elevation-2': 'shadow-elevation-2',
  'elevation-3': 'shadow-elevation-3',
  'elevation-4': 'shadow-elevation-4',
  'elevation-1-up': 'shadow-elevation-1-up',
  'elevation-2-up': 'shadow-elevation-2-up',
  'elevation-3-up': 'shadow-elevation-3-up',
  'elevation-4-up': 'shadow-elevation-4-up',
};

const DOWN = ['elevation-1', 'elevation-2', 'elevation-3', 'elevation-4'] as const;
const UP = ['elevation-1-up', 'elevation-2-up', 'elevation-3-up', 'elevation-4-up'] as const;

function Swatch({ token }: { token: keyof typeof elevation }) {
  const { figmaName, layers } = elevationSource[token];

  return (
    <div className="flex flex-col gap-3">
      {/* Generous padding: level 4 reaches 84px, so a tight cell would clip it. */}
      <div className="flex h-32 items-center justify-center">
        <div className={`h-20 w-full rounded-xl bg-white ${SHADOW_CLASS[token]}`} />
      </div>
      <div className="flex flex-col gap-0.5">
        <code className="text-[13px] font-medium text-neutral-900">{token}</code>
        <code className="text-[11px] text-neutral-400">
          --shadow-{token} · {layers} layers
        </code>
        <code className="text-[11px] break-all text-neutral-400">{elevation[token]}</code>
        <code className="text-[11px] text-neutral-400">{figmaName}</code>
      </div>
    </div>
  );
}

function ElevationPage() {
  const tokens = Object.keys(elevation);

  return (
    <div className="flex flex-col gap-10 bg-neutral-50 p-8 font-sans">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Elevation</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          {tokens.length} tokens — four levels, each in a downward and an upward direction —
          transcribed verbatim from the Figma Design System. Every one is a{' '}
          <strong>two-layer</strong> drop shadow with no horizontal offset and no spread.
        </p>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          This is the <strong>only</strong> shadow foundation in Mozaic. <code>elevation-1</code> is
          the lowest level available and is what every resting control uses; the dropdown menu uses{' '}
          <code>elevation-4</code>. Values stay in pixels — a shadow that rescaled with the root
          font size would change how high the surface looks.
        </p>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          Do not put a <code>shadow-&lt;color&gt;</code> utility beside an elevation token: it sets{' '}
          <code>--tw-shadow-color</code>, which Tailwind substitutes into every layer, collapsing a
          two-tone shadow into one colour.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-900">Downward</h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {DOWN.map((token) => (
            <Swatch key={token} token={token} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-900">Upward</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          For surfaces that cast upward, such as a bottom sheet or a docked bar. Each level is
          fainter than its downward twin. No component uses one today — no Figma component in the
          set casts an upward shadow.
        </p>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          {UP.map((token) => (
            <Swatch key={token} token={token} />
          ))}
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: 'Foundations/Elevation',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Every elevation token with a live preview. The only shadow foundation in Mozaic — ' +
          'see docs/Foundations.md.',
      },
    },
  },
  render: () => <ElevationPage />,
} satisfies Meta;

export default meta;

export const Scale: StoryObj<typeof meta> = {};
