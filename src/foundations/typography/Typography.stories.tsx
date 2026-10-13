import type { Meta, StoryObj } from '@storybook/react-vite';
import { fontFamily, fontSize, fontWeight, textStyles } from '@tokens/typography';

/**
 * Documentation page for the typography foundation.
 *
 * Everything here is local to this file on purpose — a docs page is not a
 * reusable component and must not be exported from the package.
 */

const SPECIMEN = 'The quick brown fox jumps over the lazy dog';

type Style = (typeof textStyles)[keyof typeof textStyles];

/** `mobile-banner-cta-lg-semibold` -> breakpoint `mobile`, category `banner-cta`, rest. */
function parse(token: string) {
  const [breakpoint, ...rest] = token.split('-');
  const weight = rest[rest.length - 1]!;
  const scale = rest[rest.length - 2]!;
  const category = rest.slice(0, -2).join('-');
  return { breakpoint: breakpoint!, category, scale, weight };
}

function Row({ token, style }: { token: string; style: Style }) {
  const { scale, weight } = parse(token);
  return (
    <div className="flex flex-col gap-2 border-b border-neutral-100 py-5 last:border-b-0">
      <p
        className="overflow-hidden text-ellipsis whitespace-nowrap text-neutral-900"
        style={{
          fontFamily: `var(--font-body)`,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          fontWeight: style.fontWeight,
        }}
      >
        {SPECIMEN}
      </p>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <code className="text-[13px] font-medium text-neutral-900">{token}</code>
        <span className="text-[12px] text-neutral-500">
          {scale} · {weight} {style.fontWeight}
        </span>
        <span className="text-[12px] text-neutral-500">
          {style.fontSize} / {style.lineHeight}
        </span>
        <code className="text-[11px] text-neutral-400">
          --text-{token.replace(new RegExp(`-${weight}$`), '')}
        </code>
      </div>
    </div>
  );
}

function Breakpoint({ breakpoint }: { breakpoint: string }) {
  const entries = Object.entries(textStyles).filter(([t]) => parse(t).breakpoint === breakpoint);

  const categories: string[] = [];
  for (const [token] of entries) {
    const { category } = parse(token);
    if (!categories.includes(category)) categories.push(category);
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="flex items-baseline gap-3 border-b-2 border-neutral-900 pb-2">
        <h2 className="text-xl font-semibold text-neutral-900">{breakpoint}</h2>
        <span className="text-sm text-neutral-500">{entries.length} styles</span>
      </div>
      {categories.map((category) => (
        <div key={category} className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
            {category}
          </h3>
          {entries
            .filter(([t]) => parse(t).category === category)
            .map(([token, style]) => (
              <Row key={token} token={token} style={style} />
            ))}
        </div>
      ))}
    </section>
  );
}

function ScaleTable() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="border-b border-neutral-200 pb-2 text-lg font-semibold text-neutral-900">
        Families and weights
      </h2>
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
            Font family
          </h3>
          {Object.entries(fontFamily).map(([name, value]) => (
            <div key={name} className="flex items-baseline justify-between gap-4">
              <code className="text-[13px] text-neutral-900">--font-{name}</code>
              <span className="text-[13px] text-neutral-500">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
            Font weight
          </h3>
          {Object.entries(fontWeight).map(([name, value]) => (
            <div key={name} className="flex items-baseline justify-between gap-4">
              <code className="text-[13px] text-neutral-900">--font-weight-{name}</code>
              <span
                className="text-[13px] text-neutral-500"
                style={{ fontWeight: value, fontFamily: 'var(--font-body)' }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TypographyPage() {
  const breakpoints: string[] = [];
  for (const token of Object.keys(textStyles)) {
    const { breakpoint } = parse(token);
    if (!breakpoints.includes(breakpoint)) breakpoints.push(breakpoint);
  }

  return (
    <div className="flex flex-col gap-12 bg-white p-8 font-sans">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Typography</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          {Object.keys(textStyles).length} composite text styles across {breakpoints.length}{' '}
          breakpoints, built from {Object.keys(fontSize).length} size and line-height slots and{' '}
          {Object.keys(fontWeight).length} weights. Generated verbatim from the Figma Design System
          — sizes are the Figma px values converted to <code>rem</code>, and weight names are mapped
          to their standard CSS numerics.
        </p>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          Mobile and desktop are genuinely distinct ramps, not one scaled from the other. Specimens
          render in <code>var(--font-body)</code> — Lexend Deca, self-hosted with the package and
          bound to the inherited default in <code>src/index.css</code>, so every component picks it
          up without declaring a family of its own.
        </p>
      </header>
      <ScaleTable />
      {breakpoints.map((breakpoint) => (
        <Breakpoint key={breakpoint} breakpoint={breakpoint} />
      ))}
    </div>
  );
}

const meta = {
  title: 'Foundations/Typography',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Every typography token, grouped by breakpoint and category. Generated from the Figma export — see docs/Foundations.md.',
      },
    },
  },
  render: () => <TypographyPage />,
} satisfies Meta;

export default meta;

export const Scale: StoryObj<typeof meta> = {};
