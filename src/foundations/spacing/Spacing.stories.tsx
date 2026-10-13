import type { Meta, StoryObj } from '@storybook/react-vite';
import { spacing, spacingScale, spacingSource } from '@tokens/spacing';

/**
 * Documentation page for the spacing foundation.
 *
 * Everything here is local to this file on purpose — a docs page is not a
 * reusable component and must not be exported from the package.
 */

/** Bars wider than this are capped so the page stays readable. */
const MAX_BAR_PX = 640;

type Token = (typeof spacingScale)[number];

function Row({ token }: { token: Token }) {
  const { px, step, figmaName } = spacingSource[token];
  const capped = px > MAX_BAR_PX;

  return (
    <tr className="border-b border-neutral-100 last:border-b-0">
      <td className="py-3 pr-6 align-middle whitespace-nowrap">
        <code className="text-[13px] font-medium text-neutral-900">{token}</code>
      </td>
      <td className="py-3 pr-6 align-middle whitespace-nowrap">
        <code className="text-[12px] text-neutral-400">--spacing-{token}</code>
      </td>
      <td className="py-3 pr-6 text-right align-middle whitespace-nowrap">
        <code className="text-[13px] text-neutral-900">{spacing[token]}</code>
      </td>
      <td className="py-3 pr-6 text-right align-middle whitespace-nowrap">
        <span className="text-[12px] text-neutral-500">{px}px</span>
      </td>
      <td className="py-3 pr-8 text-right align-middle whitespace-nowrap">
        <span className="text-[12px] text-neutral-500">{step}</span>
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
        <code className="text-[11px] whitespace-nowrap text-neutral-400">{figmaName}</code>
      </td>
    </tr>
  );
}

function SpacingPage() {
  const largest = spacingSource[spacingScale[spacingScale.length - 1]!].px;

  return (
    <div className="flex flex-col gap-8 bg-white p-8 font-sans">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Spacing</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          A {spacingScale.length}-step scale generated verbatim from the Figma Design System, from{' '}
          <code>0</code> to <code>{largest}px</code>. Every step is a multiple of 4px — Figma names
          each token by its step number, where step × 4 = px. Values are converted to{' '}
          <code>rem</code> so spacing scales with the reader&rsquo;s browser font-size setting, the
          same as typography.
        </p>
        <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
          Bars are drawn at true pixel width up to {MAX_BAR_PX}px and capped beyond that, so the
          largest steps stay on screen. The original Figma name is shown for traceability.
        </p>
      </header>

      {/*
        A horizontally scrollable region must be keyboard-focusable, or keyboard
        users cannot pan it (axe: scrollable-region-focusable). tabIndex makes it
        reachable; role + label let screen readers announce what it contains.
      */}
      <div
        className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        tabIndex={0}
        role="region"
        aria-label="Spacing scale"
      >
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-neutral-900">
              {(
                [
                  ['Token', 'pr-6'],
                  ['CSS variable', 'pr-6'],
                  ['rem', 'pr-6 text-right'],
                  ['px', 'pr-6 text-right'],
                  ['Step', 'pr-8 text-right'],
                  ['Scale', ''],
                  ['Figma name', 'pl-6'],
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
            {spacingScale.map((token) => (
              <Row key={token} token={token} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const meta = {
  title: 'Foundations/Spacing',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The full spacing scale with visual bars. Generated from the Figma export — see docs/Foundations.md.',
      },
    },
  },
  render: () => <SpacingPage />,
} satisfies Meta;

export default meta;

export const Scale: StoryObj<typeof meta> = {};
