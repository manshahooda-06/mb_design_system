import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  semanticSpacing,
  semanticSpacingResolved,
  semanticSpacingScale,
  semanticSpacingSource,
} from '@tokens/semantic/spacing';
import { radius } from '@tokens/radius';

/**
 * Documentation page for the semantic spacing collection.
 *
 * Everything here is local to this file on purpose — a docs page is not a
 * reusable component and must not be exported from the package.
 */

type Token = (typeof semanticSpacingScale)[number];

/** Bars wider than this are capped so the page stays readable. */
const MAX_BAR_PX = 320;

function Row({ token }: { token: Token }) {
  const { px, aliasOf, primitiveToken, cssVar } = semanticSpacingSource[token];
  const capped = px > MAX_BAR_PX;

  return (
    <tr className="border-b border-neutral-100 last:border-b-0">
      <td className="py-3 pr-6 align-middle whitespace-nowrap">
        <code className="text-[13px] font-medium text-neutral-900">{token}</code>
      </td>
      <td className="py-3 pr-6 align-middle whitespace-nowrap">
        <code className="text-[12px] text-neutral-400">{cssVar}</code>
      </td>
      <td className="py-3 pr-6 align-middle whitespace-nowrap">
        <code className="text-[12px] text-blue-800">{semanticSpacing[token]}</code>
      </td>
      <td className="py-3 pr-6 align-middle whitespace-nowrap">
        <code className="text-[12px] text-neutral-500">{primitiveToken}</code>
      </td>
      <td className="py-3 pr-6 text-right align-middle whitespace-nowrap">
        <code className="text-[13px] text-neutral-900">{semanticSpacingResolved[token]}</code>
      </td>
      <td className="py-3 pr-8 text-right align-middle whitespace-nowrap">
        <span className="text-[12px] text-neutral-500">{px}px</span>
      </td>
      <td className="w-full py-3 align-middle">
        <div className="flex items-center gap-2">
          <div
            className="h-4 shrink-0 rounded-sm bg-blue-500"
            style={{ width: `${Math.min(px, MAX_BAR_PX)}px` }}
          />
          {capped && <span className="text-[11px] whitespace-nowrap text-neutral-400">capped</span>}
          {px === 0 && <span className="text-[11px] text-neutral-400">zero</span>}
        </div>
      </td>
      <td className="py-3 pl-6 align-middle">
        <code className="text-[11px] whitespace-nowrap text-neutral-400">{aliasOf}</code>
      </td>
    </tr>
  );
}

/** The five names that mean different things in spacing vs radius. */
function ScaleClash() {
  const shared = semanticSpacingScale.filter((k) => k in radius);
  const differing = shared.filter(
    (k) => semanticSpacingResolved[k] !== radius[k as keyof typeof radius],
  );

  return (
    <section className="flex flex-col gap-3">
      <h2 className="border-b border-neutral-200 pb-2 text-lg font-semibold text-neutral-900">
        Independent of the radius scale
      </h2>
      <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
        Semantic spacing and radius are <strong className="font-semibold">separate scales</strong>{' '}
        that happen to share t-shirt names. {shared.length} names appear in both, and{' '}
        {differing.length} of them hold <em>different</em> values. Nothing breaks — they live in
        different CSS namespaces — but <code>gap-semantic-lg</code> and <code>rounded-lg</code> are
        not the same size.
      </p>
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label="Spacing versus radius"
      >
        <table className="border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-neutral-900">
              {['Name', 'gap-semantic-*', 'rounded-*', 'Match'].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="pr-8 pb-2 text-[11px] font-semibold tracking-wide whitespace-nowrap text-neutral-500 uppercase"
                >
                  {/* Every header needs an accessible name (axe: empty-table-header). */}
                  <span className={h === 'Match' ? 'sr-only' : undefined}>{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shared.map((key) => {
              const same = semanticSpacingResolved[key] === radius[key as keyof typeof radius];
              return (
                <tr key={key} className="border-b border-neutral-100 last:border-b-0">
                  <td className="py-2 pr-8 whitespace-nowrap">
                    <code className="text-[13px] font-medium text-neutral-900">{key}</code>
                  </td>
                  <td className="py-2 pr-8 whitespace-nowrap">
                    <code className="text-[12px] text-neutral-700">
                      {semanticSpacingSource[key].px}px
                    </code>
                  </td>
                  <td className="py-2 pr-8 whitespace-nowrap">
                    <code className="text-[12px] text-neutral-700">
                      {radius[key as keyof typeof radius]}
                    </code>
                  </td>
                  <td className="py-2 pr-8 whitespace-nowrap">
                    <span
                      className={`text-[11px] ${same ? 'text-neutral-400' : 'font-medium text-amber-700'}`}
                    >
                      {same ? 'same' : 'different'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SemanticSpacingPage() {
  const largest = semanticSpacingSource[semanticSpacingScale[semanticSpacingScale.length - 1]!].px;

  return (
    <div className="flex flex-col gap-10 bg-white p-8 font-sans">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-neutral-900">Spacing</h1>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-blue-900 uppercase">
            semantic
          </span>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          A {semanticSpacingScale.length}-step t-shirt scale over the primitive spacing foundation,
          from <code>none</code> to <code>11xl</code> ({largest}px). No token here owns a value —
          each <em>aliases</em> a primitive step and is emitted as a <code>var()</code> reference,
          so a change to the primitive propagates automatically.
        </p>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          Variables are qualified <code>--spacing-semantic-*</code>. The qualifier is what keeps
          them from shadowing Tailwind values in the same namespace — a bare{' '}
          <code>--spacing-md</code> would silently redefine <code>max-w-md</code>, <code>w-md</code>
          , <code>min-w-md</code> and <code>basis-md</code>, which read <code>--container-*</code>{' '}
          by default. They still live in the spacing namespace, so they yield ordinary utilities:{' '}
          <code>gap-semantic-md</code>, <code>p-semantic-xl</code>, <code>mt-semantic-xs</code>.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="border-b-2 border-neutral-900 pb-2 text-lg font-semibold text-neutral-900">
          Tokens and their alias chains
        </h2>
        <div
          className="overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label="Semantic spacing scale"
        >
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-neutral-900">
                {(
                  [
                    ['Token', 'pr-6'],
                    ['CSS variable', 'pr-6'],
                    ['Emitted value', 'pr-6'],
                    ['Aliases', 'pr-6'],
                    ['Resolves to', 'pr-6 text-right'],
                    ['px', 'pr-8 text-right'],
                    ['Scale', ''],
                    ['Figma alias target', 'pl-6'],
                  ] as const
                ).map(([heading, align]) => (
                  <th
                    key={heading}
                    scope="col"
                    className={`pb-2 text-[11px] font-semibold tracking-wide whitespace-nowrap text-neutral-500 uppercase ${align}`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {semanticSpacingScale.map((token) => (
                <Row key={token} token={token} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ScaleClash />

      <section className="flex flex-col gap-2">
        <h2 className="border-b border-neutral-200 pb-2 text-lg font-semibold text-neutral-900">
          A note on coverage
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          The semantic scale stops at {largest}px, while the primitive spacing foundation continues
          to 1920px. Those larger steps are layout dimensions rather than gaps — every token here
          carries Figma&rsquo;s <code>GAP</code> scope — so the unreferenced primitives are
          intentional, not a gap in coverage. Nothing was invented to fill them.
        </p>
      </section>
    </div>
  );
}

const meta = {
  title: 'Semantic/Spacing',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The semantic spacing scale and the primitives it aliases. Generated from the Figma export — see docs/Semantic-Tokens.md.',
      },
    },
  },
  render: () => <SemanticSpacingPage />,
} satisfies Meta;

export default meta;

export const Scale: StoryObj<typeof meta> = {};
