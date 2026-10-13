import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  semanticColors,
  semanticColorsResolved,
  semanticColorsSource,
  type ColorMode,
  type SemanticColorToken,
} from '@tokens/semantic/colors';

/**
 * Documentation page for the semantic colour collection.
 *
 * Everything here is local to this file on purpose — a docs page is not a
 * reusable component and must not be exported from the package.
 */

const TOKENS = Object.keys(semanticColors) as SemanticColorToken[];

/** Group by the token's leading segment, mechanically — no hand-written list. */
function grouped() {
  const groups = new Map<string, SemanticColorToken[]>();
  for (const token of TOKENS) {
    const head = token.split('-')[0]!;
    groups.set(head, [...(groups.get(head) ?? []), token]);
  }
  return [...groups.entries()];
}

/** Checkerboard so translucent swatches read as translucent rather than blank. */
const CHECKERBOARD = {
  backgroundImage:
    'linear-gradient(45deg, #c9ced6 25%, transparent 25%), linear-gradient(-45deg, #c9ced6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #c9ced6 75%), linear-gradient(-45deg, transparent 75%, #c9ced6 75%)',
  backgroundSize: '10px 10px',
  backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0',
} as const;

const KIND_LABEL: Record<string, string> = {
  'primitive-alias': 'primitive',
  'semantic-alias': 'semantic',
  literal: 'literal',
};

function Swatch({ token, mode }: { token: SemanticColorToken; mode: ColorMode }) {
  const source = semanticColorsSource[token];
  const value = semanticColorsResolved[mode][token];
  const kind = source[mode].kind;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-14 w-full rounded-md ring-1 ring-black/10" style={CHECKERBOARD}>
        {/* The live variable, so the swatch reflects the real cascade. */}
        <div
          className="h-full w-full rounded-md"
          style={{ backgroundColor: `var(${source.cssVar})` }}
        />
      </div>
      <code className="text-[12px] leading-tight font-medium text-neutral-900">{token}</code>
      <code className="text-[10px] leading-tight text-neutral-400">{source.cssVar}</code>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`rounded px-1 text-[9px] font-semibold tracking-wide uppercase ${
            kind === 'literal'
              ? 'bg-amber-100 text-amber-900'
              : kind === 'semantic-alias'
                ? 'bg-violet-100 text-violet-900'
                : 'bg-blue-100 text-blue-900'
          }`}
        >
          {KIND_LABEL[kind]}
        </span>
        <code className="overflow-hidden text-[10px] leading-tight text-ellipsis whitespace-nowrap text-neutral-500">
          {value}
        </code>
      </div>
    </div>
  );
}

/** A few tokens that show each alias mechanism, chosen from the data. */
function AliasExamples({ mode }: { mode: ColorMode }) {
  const pick = (kind: string) =>
    TOKENS.filter((t) => semanticColorsSource[t][mode].kind === kind).slice(0, 3);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="border-b border-neutral-200 pb-2 text-lg font-semibold">Alias mechanisms</h2>
      <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
        Figma expresses aliases two ways and both are preserved as <code>var()</code> references, so
        a change to a primitive propagates instead of drifting. Literals appear only where Figma
        itself exported a literal.
      </p>
      <div
        className="overflow-x-auto"
        tabIndex={0}
        role="region"
        aria-label={`Alias mechanism examples, ${mode} mode`}
      >
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-neutral-900">
              {['Kind', 'Token', 'Emitted value', 'Figma alias target'].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="pr-6 pb-2 text-[11px] font-semibold tracking-wide whitespace-nowrap text-neutral-500 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(['primitive-alias', 'semantic-alias', 'literal'] as const).flatMap((kind) =>
              pick(kind).map((token) => (
                <tr key={`${kind}-${token}`} className="border-b border-neutral-100">
                  <td className="py-2 pr-6 whitespace-nowrap">
                    <code className="text-[11px] text-neutral-500">{KIND_LABEL[kind]}</code>
                  </td>
                  <td className="py-2 pr-6 whitespace-nowrap">
                    <code className="text-[12px] font-medium text-neutral-900">{token}</code>
                  </td>
                  <td className="py-2 pr-6 whitespace-nowrap">
                    <code className="text-[11px] text-blue-800">
                      {semanticColorsResolved[mode][token]}
                    </code>
                  </td>
                  <td className="py-2 pr-6 whitespace-nowrap">
                    <code className="text-[11px] text-neutral-400">
                      {semanticColorsSource[token][mode].aliasOf ?? '—'}
                    </code>
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Usage() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="border-b border-neutral-200 pb-2 text-lg font-semibold">Usage</h2>
      <div className="flex flex-wrap gap-3">
        <div className="bg-semantic-bg-primary ring-semantic-border-primary flex flex-col gap-1 rounded-lg p-4 ring-1">
          <span className="text-semantic-text-primary text-sm font-medium">Tailwind utilities</span>
          <code className="text-semantic-text-tertiary text-[11px]">
            bg-semantic-bg-primary · text-semantic-text-primary
          </code>
        </div>
        <div
          className="flex flex-col gap-1 rounded-lg p-4"
          style={{
            background: 'var(--color-semantic-bg-secondary)',
            outline: '1px solid var(--color-semantic-border-secondary)',
          }}
        >
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-semantic-text-primary)' }}
          >
            Raw CSS variables
          </span>
          <code className="text-[11px]" style={{ color: 'var(--color-semantic-text-tertiary)' }}>
            var(--color-semantic-bg-secondary)
          </code>
        </div>
      </div>
    </section>
  );
}

function SemanticColorsPage() {
  const [mode, setMode] = useState<ColorMode>('light');
  const groups = grouped();

  return (
    // `.dark` is what the semantic colour overrides and Tailwind's dark: variant
    // both key off, so toggling this class switches the whole subtree.
    <div className={mode === 'dark' ? 'dark' : undefined}>
      <div className="bg-semantic-bg-primary flex flex-col gap-10 p-8 font-sans">
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-semantic-text-primary text-2xl font-semibold">Colors</h1>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-blue-900 uppercase">
              semantic
            </span>
            <div className="ml-auto flex items-center gap-1 rounded-lg bg-neutral-200/60 p-1">
              {(['light', 'dark'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`rounded px-3 py-1 text-[12px] font-medium capitalize ${
                    mode === m ? 'shadow-elevation-1 bg-white text-neutral-900' : 'text-neutral-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <p className="text-semantic-text-secondary max-w-3xl text-sm leading-relaxed">
            {TOKENS.length} semantic colour tokens, generated from the Figma light and dark exports.
            Every token has a value in both modes: light is declared in <code>@theme</code>, and
            dark re-declares the same custom properties under <code>.dark</code>. Toggle above — the
            swatches read the live variables, so they reflect the real cascade rather than a copy.
          </p>
          <p className="text-semantic-text-tertiary max-w-3xl text-sm leading-relaxed">
            Semantic colours use <code>--color-semantic-*</code> while primitives keep{' '}
            <code>--color-*</code>, so the two layers can never collide and a semantic token is
            always distinguishable from the raw palette it points at.
          </p>
        </header>

        <Usage />
        <AliasExamples mode={mode} />

        {groups.map(([group, tokens]) => (
          <section key={group} className="flex flex-col gap-4">
            <div className="flex items-baseline gap-3 border-b border-neutral-200 pb-2">
              <h2 className="text-semantic-text-primary text-lg font-semibold">{group}</h2>
              <span className="text-semantic-text-tertiary text-sm">{tokens.length} tokens</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
              {tokens.map((token) => (
                <Swatch key={token} token={token} mode={mode} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

const meta = {
  title: 'Semantic/Colors',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Every semantic colour token in both modes, with its alias chain. Generated from the Figma exports — see docs/Semantic-Tokens.md.',
      },
    },
  },
  render: () => <SemanticColorsPage />,
} satisfies Meta;

export default meta;

export const Tokens: StoryObj<typeof meta> = {};
