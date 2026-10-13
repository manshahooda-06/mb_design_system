import type { Meta, StoryObj } from '@storybook/react-vite';
import { container, containerResolved, containerSource } from '@tokens/semantic/container';

/**
 * Documentation page for the semantic container token collection.
 *
 * Everything here is local to this file on purpose — a docs page is not a
 * reusable component and must not be exported from the package.
 */

type Token = keyof typeof container;

/** The alias chain, which is the whole point of a semantic token. */
function Chain({ token }: { token: Token }) {
  const source = containerSource[token];
  return (
    <div className="flex flex-wrap items-center gap-2 text-[12px]">
      <code className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-900">{token}</code>
      <span className="text-neutral-400">aliases</span>
      <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-700">
        {source.primitiveToken}
      </code>
      <span className="text-neutral-400">resolves to</span>
      <code className="text-neutral-900">{containerResolved[token]}</code>
      <span className="text-neutral-400">({source.px}px)</span>
    </div>
  );
}

function Row({ token }: { token: Token }) {
  const source = containerSource[token];
  return (
    <div className="flex flex-col gap-2 border-b border-neutral-100 py-5 last:border-b-0">
      <Chain token={token} />
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-[11px] text-neutral-400">CSS variable</dt>
          <dd className="text-[11px] text-neutral-600">
            <code>{source.cssVar}</code>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-[11px] text-neutral-400">Emitted value</dt>
          <dd className="text-[11px] text-neutral-600">
            <code>{container[token]}</code>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-[11px] text-neutral-400">Figma name</dt>
          <dd className="text-[11px] text-neutral-600">
            <code>{source.figmaName}</code>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-[11px] text-neutral-400">Figma alias</dt>
          <dd className="text-[11px] text-neutral-600">
            <code>{source.aliasOf}</code>
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** Padding rendered at true size, so the mobile/desktop difference is visible. */
function PaddingPreview() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {(['padding-mobile', 'padding-desktop'] as const).map((token) => (
        <div key={token} className="flex flex-col gap-2">
          <code className="text-[12px] font-medium text-neutral-900">{token}</code>
          <div
            className="border-2 border-dashed border-blue-400 bg-blue-50"
            style={{ padding: containerResolved[token] }}
          >
            <div className="bg-white px-3 py-2 text-[12px] text-neutral-600 ring-1 ring-neutral-200">
              content
            </div>
          </div>
          <span className="text-[11px] text-neutral-400">
            {containerResolved[token]} · {containerSource[token].px}px
          </span>
        </div>
      ))}
    </div>
  );
}

function ContainerPage() {
  const tokens = Object.keys(container) as Token[];

  return (
    <div className="flex flex-col gap-10 bg-white p-8 font-sans">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-neutral-900">Container</h1>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-blue-900 uppercase">
            semantic
          </span>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          The first <strong className="font-semibold">semantic</strong> token collection. Unlike a
          primitive foundation, no token here owns a value — each one <em>aliases</em> a spacing
          primitive, and is emitted as a <code>var()</code> reference so a change to that primitive
          propagates automatically instead of drifting.
        </p>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          Tokens are emitted into the Tailwind namespace that gives them real utilities rather than
          a single <code>--container-</code> prefix: padding into <code>--spacing-*</code>, which
          yields <code>p-*</code> and <code>px-*</code>; max-width into <code>--container-*</code>,
          which is Tailwind&rsquo;s own <code>max-w-*</code> namespace.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="border-b border-neutral-200 pb-2 text-lg font-semibold text-neutral-900">
          Padding, at true size
        </h2>
        <PaddingPreview />
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="border-b-2 border-neutral-900 pb-2 text-lg font-semibold text-neutral-900">
          Tokens and their alias chains
        </h2>
        {tokens.map((token) => (
          <Row key={token} token={token} />
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="border-b border-neutral-200 pb-2 text-lg font-semibold text-neutral-900">
          A note on coverage
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          Figma defines padding for both breakpoints but a max-width only for desktop — mobile
          containers are fluid full-width. That asymmetry is preserved as exported; no token was
          invented to fill the gap.
        </p>
      </section>
    </div>
  );
}

const meta = {
  title: 'Semantic/Container',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The semantic container tokens and the primitives they alias. Generated from the Figma export — see docs/Semantic-Tokens.md.',
      },
    },
  },
  render: () => <ContainerPage />,
} satisfies Meta;

export default meta;

export const Tokens: StoryObj<typeof meta> = {};
