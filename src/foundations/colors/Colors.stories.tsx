import type { Meta, StoryObj } from '@storybook/react-vite';
import { colors, type ColorGroup } from '@tokens/colors';

/**
 * Documentation page for the primitive color foundation.
 *
 * Everything here is local to this file on purpose — a docs page is not a
 * reusable component and must not be exported from the package.
 */

/** Alpha tokens are emitted as `rgb(r g b / a)`; opaque ones as hex. */
const isTranslucent = (value: string) => value.startsWith('rgb(');

/** Checkerboard so translucent swatches read as translucent rather than blank. */
const CHECKERBOARD = {
  backgroundImage:
    'linear-gradient(45deg, #c9ced6 25%, transparent 25%), linear-gradient(-45deg, #c9ced6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #c9ced6 75%), linear-gradient(-45deg, transparent 75%, #c9ced6 75%)',
  backgroundSize: '12px 12px',
  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
  backgroundColor: '#ffffff',
} as const;

function Swatch({ name, value }: { name: string; value: string }) {
  const translucent = isTranslucent(value);
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-16 w-full rounded-md ring-1 ring-black/10"
        style={translucent ? CHECKERBOARD : undefined}
      >
        <div className="h-full w-full rounded-md" style={{ backgroundColor: value }} />
      </div>
      <div className="flex flex-col gap-0.5">
        <code className="text-[13px] leading-tight font-medium text-neutral-900">{name}</code>
        {/* Verbatim — never transformed, so the page always shows the real token value. */}
        <code className="text-[12px] leading-tight text-neutral-500">{value}</code>
        <code className="text-[11px] leading-tight text-neutral-400">--color-{name}</code>
      </div>
    </div>
  );
}

function Group({ group }: { group: ColorGroup }) {
  const steps = colors[group];
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3 border-b border-neutral-200 pb-2">
        <h2 className="text-lg font-semibold text-neutral-900">{group}</h2>
        <span className="text-sm text-neutral-500">
          {Object.keys(steps).length} {Object.keys(steps).length === 1 ? 'token' : 'tokens'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(steps).map(([step, value]) => (
          <Swatch key={step} name={`${group}-${step}`} value={value} />
        ))}
      </div>
    </section>
  );
}

function PalettePage() {
  const groups = Object.keys(colors) as ColorGroup[];
  const total = groups.reduce((n, g) => n + Object.keys(colors[g]).length, 0);

  return (
    <div className="flex flex-col gap-10 bg-white p-8 font-sans">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Primitive colors</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          The raw palette, generated verbatim from the Figma Design System — {total} tokens across{' '}
          {groups.length} groups. Primitives carry no meaning: <code>error-500</code> is a red, not
          &ldquo;the color of an error&rdquo;. Assigning meaning is the job of the semantic layer.
        </p>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          <strong className="font-semibold">
            Do not consume primitives directly in components.
          </strong>{' '}
          Components reference semantic tokens, which resolve to these. Swatches on a checkerboard
          are translucent.
        </p>
      </header>
      {groups.map((group) => (
        <Group key={group} group={group} />
      ))}
    </div>
  );
}

const meta = {
  title: 'Foundations/Primitive Colors',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Every primitive color token, grouped by family. Generated from the Figma export — see docs/Foundations.md.',
      },
    },
  },
  render: () => <PalettePage />,
} satisfies Meta;

export default meta;

export const Palette: StoryObj<typeof meta> = {};
