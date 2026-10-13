import type { Meta, StoryObj } from '@storybook/react-vite';
import { radius, radiusSource } from '@tokens/radius';

/**
 * Documentation page for the radius foundation.
 *
 * Everything here is local to this file on purpose — a docs page is not a
 * reusable component and must not be exported from the package.
 */

/** `full` is 9999px — a pill/circle sentinel, not a literal scale step. Capped for display. */
const MAX_PREVIEW_PX = 96;

function Swatch({ token }: { token: keyof typeof radius }) {
  const { px, figmaName } = radiusSource[token];
  const previewPx = Math.min(px, MAX_PREVIEW_PX);
  const isSentinel = px > MAX_PREVIEW_PX;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-16 w-16 border-2 border-blue-500 bg-blue-50"
        style={{ borderRadius: `${previewPx}px` }}
      />
      <div className="flex flex-col gap-0.5">
        <code className="text-[13px] font-medium text-neutral-900">{token}</code>
        <code className="text-[12px] text-neutral-500">{radius[token]}</code>
        <code className="text-[11px] text-neutral-400">
          --radius-{token} · {px}px{isSentinel ? ' (capped for preview)' : ''}
        </code>
        <code className="text-[11px] text-neutral-400">{figmaName}</code>
      </div>
    </div>
  );
}

function RadiusPage() {
  const tokens = Object.keys(radius) as (keyof typeof radius)[];

  return (
    <div className="flex flex-col gap-8 bg-white p-8 font-sans">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Radius</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          An {tokens.length}-step scale generated verbatim from the Figma Design System, from{' '}
          <code>none</code> (0) to <code>full</code>. Values are converted to <code>rem</code>, the
          same as typography and spacing.
        </p>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          <code>full</code> is Figma&rsquo;s <code>9999px</code> pill/circle sentinel. It goes
          through the same px → rem conversion as every other step — <code>{radius.full}</code> —
          rather than being special-cased, but visually a corner radius this large simply rounds the
          shape completely, so the preview below is capped at {MAX_PREVIEW_PX}px.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
        {tokens.map((token) => (
          <Swatch key={token} token={token} />
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: 'Foundations/Radius',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Every radius token with a live preview. Generated from the Figma export — see docs/Foundations.md.',
      },
    },
  },
  render: () => <RadiusPage />,
} satisfies Meta;

export default meta;

export const Scale: StoryObj<typeof meta> = {};
