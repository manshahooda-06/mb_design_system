import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchBar } from './SearchBar';
import type { SearchBarDevice, SearchBarType } from './types';

const DEVICES: SearchBarDevice[] = ['mobile', 'desktop-1280', 'desktop-1920'];
const TYPES: SearchBarType[] = ['doctor', 'hospital', 'symptom', 'speciality'];

/**
 * The width Figma draws each device at, so a story reads as its published variant.
 *
 * The component itself is `w-full` — these are viewport canvas widths, not component
 * geometry, and the field fills whatever container it is given.
 */
const FIGMA_WIDTH: Record<SearchBarDevice, number> = {
  mobile: 328,
  'desktop-1280': 312,
  'desktop-1920': 620,
};

/**
 * Figma's `search-01`, exported from the icon library (node 4643:63505).
 *
 * The viewBox carries the icon component's own padding — Figma insets the glyph 16.35%
 * inside its box — so the artwork keeps Figma's proportions at 20, 24 and 28 alike.
 * `currentColor` lets the component's token colour through.
 */
const SearchIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <g transform="translate(2.76615 2.76615)">
      <path
        d="M10.9349 10.9349L13.963 13.963M12.6172 6.56094C12.6172 3.21616 9.90571 0.504687 6.56094 0.504687C3.21616 0.504687 0.504687 3.21616 0.504687 6.56094C0.504687 9.90571 3.21616 12.6172 6.56094 12.6172C9.90571 12.6172 12.6172 9.90571 12.6172 6.56094Z"
        stroke="currentColor"
        strokeWidth="1.00937"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

/** Figma's `cancel-01` (node 4649:25636), inset 16.67% inside its box. */
const CancelIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <g transform="translate(2.16665 2.16665)">
      <path
        d="M0.5 0.500003L11.1667 11.1667M11.1667 0.5L0.500014 11.1667"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

const Grid = ({ children }: { children: ReactNode }) => (
  <div className="gap-semantic-4xl flex flex-col">{children}</div>
);
const Caption = ({ children }: { children: ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary mb-semantic-sm">{children}</p>
);
const Frame = ({ device, children }: { device: SearchBarDevice; children: ReactNode }) => (
  <div style={{ width: FIGMA_WIDTH[device] }}>{children}</div>
);

const meta = {
  title: 'Components/SearchBar',
  component: SearchBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A search field with a two-part animated placeholder. Measured from Figma ' +
          '`Search Bar` (node 4353:2239) — **6 variants**, `Device`(3) × `State`(2) — and ' +
          'its private `_Search animating text` set (node 4353:6249), **12 variants** of ' +
          '`Device`(3) × `type`(4) plus a `showAnimatedText` boolean.\n\n' +
          '**The placeholder is two elements, never one string.** Figma draws a static ' +
          '"Search by" alongside a separately positioned stack of four quoted words, and ' +
          'the two are driven independently: `type` and `showAnimatedText` reach only the ' +
          'stack. That is why the placeholder is an overlay above the input rather than a ' +
          '`::placeholder` string — one string cannot carry two elements. The quotes are ' +
          'Figma’s own typographic quotes.\n\n' +
          '**`State` is derived, not a prop.** Figma publishes Default and Filled as an ' +
          'axis, but Filled is exactly "there is text": an empty value draws the ' +
          'placeholder, a non-empty one draws the value and the clear button. A prop ' +
          'would let a caller ask for Filled with nothing in the field.\n\n' +
          '**`device` is Figma’s own axis, not a size scale.** The three viewports ' +
          'disagree on padding, both icon ramps, the content gap and the type step; they ' +
          'share only the fill, the stroke, the radius and the shadow.\n\n' +
          '**Cycling `type` is the whole animation.** Every word stays mounted and the ' +
          'stack slides by one line pitch, wrapping instantly back to the first rather ' +
          'than scrolling backwards through all four — so the measured Figma offsets stay ' +
          'the single source of geometry. `animate={false}` pins the window to `type`, ' +
          'which reproduces the twelve published `_Search animating text` variants ' +
          'exactly.\n\n' +
          '**Only the word stack moves** — the placeholder row, the static "Search by" and ' +
          'the clipped window all carry no transform, so the motion is a vertical slide ' +
          'behind a one-line mask rather than a moving placeholder.\n\n' +
          '**The timing is an implementation default, not a Figma value.** The file ' +
          'publishes four static frames and specifies no duration, easing or dwell, and ' +
          '`src/foundations/motion` is an empty stub — so the 2000ms dwell ' +
          '(`intervalMs`) and 500ms slide are placeholders for a real motion ' +
          'specification. The easing is not stated at all: the repo convention is a bare ' +
          '`transition`, which resolves to Tailwind’s default timing function — the same ' +
          'curve `ease-in-out` names. Cycling stops on `animate={false}`, under ' +
          '`prefers-reduced-motion`, while the field is filled, and while the tab is ' +
          'hidden.\n\n' +
          '**Both glyphs are supplied by the caller** — `search-01` and `cancel-01` in ' +
          'Figma. The icon foundation is a deliberate stub, so no component in the ' +
          'library bundles a library glyph. These stories pass the Figma exports.\n\n' +
          'Only the two published states exist. There is no focused, hover, pressed, ' +
          'disabled, error or loading treatment, because Figma draws none — the input ' +
          'keeps the platform’s own focus indicator rather than a designed one.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    device: { control: 'inline-radio', options: DEVICES },
    type: { control: 'inline-radio', options: TYPES },
    showAnimatedText: { control: 'boolean' },
    animate: { control: 'boolean' },
    intervalMs: { control: { type: 'number', min: 250, step: 250 } },
    filledText: { control: 'text' },
    value: { control: false },
    classNames: { control: false },
    searchIcon: { control: false },
    clearIcon: { control: false },
  },
  args: {
    device: 'mobile',
    type: 'doctor',
    showAnimatedText: true,
    animate: true,
    intervalMs: 2000,
    filledText: '',
    searchIcon: <SearchIcon />,
    clearIcon: <CancelIcon />,
  },
  render: (args) => (
    <Frame device={args.device ?? 'mobile'}>
      <SearchBar {...args} />
    </Frame>
  ),
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every control the component publishes.
 *
 * Type into the field to cross from Default to Filled; empty it to cross back. `type`
 * and `showAnimatedText` only do anything while the field is empty, because Filled
 * replaces the placeholder entirely.
 */
export const Playground: Story = {};

/**
 * Figma's two published states, at all three devices.
 *
 * Default and Filled share the container exactly — same fill, stroke, radius, shadow and
 * padding. What changes is the text weight (Light 300 → Regular 400), its colour
 * (secondary → primary), the placeholder giving way to the value, and the clear button
 * appearing. The search glyph stays `brand/600` in both.
 */
export const States: Story = {
  // Pinned so the grid reads as Figma's published frames rather than six moving targets.
  args: { animate: false },
  render: (args) => (
    <Grid>
      {DEVICES.map((device) => (
        <div key={device}>
          <Caption>
            {device} — {FIGMA_WIDTH[device]}px
          </Caption>
          <div className="gap-semantic-lg flex flex-col">
            <Frame device={device}>
              <SearchBar {...args} device={device} filledText="" />
            </Frame>
            <Frame device={device}>
              <SearchBar {...args} device={device} filledText="Cardi" />
            </Frame>
          </div>
        </div>
      ))}
    </Grid>
  ),
};

/**
 * The `Device` axis side by side.
 *
 * 328×44, 312×48 and 620×60. Heights are not pinned — they are the padding plus one line
 * of the device's own type step, which is what Figma's hugging frame computes.
 */
export const Devices: Story = {
  args: { animate: false },
  render: (args) => (
    <Grid>
      {DEVICES.map((device) => (
        <div key={device}>
          <Caption>{device}</Caption>
          <Frame device={device}>
            <SearchBar {...args} device={device} />
          </Frame>
        </div>
      ))}
    </Grid>
  ),
};

/**
 * Figma's twelve published `_Search animating text` variants, pinned with `animate={false}`.
 *
 * All four words are mounted in every cell; `type` offsets the stack by one line pitch —
 * 24, 28 and 32 — and the one-line window clips the rest. The static "Search by" never
 * moves. This is the static frame set the animation cycles through.
 */
export const AnimatedTypes: Story = {
  args: { animate: false },
  render: (args) => (
    <Grid>
      {DEVICES.map((device) => (
        <div key={device}>
          <Caption>
            {device} — pitch {device === 'mobile' ? 24 : device === 'desktop-1280' ? 28 : 32}px
          </Caption>
          <div className="gap-semantic-lg flex flex-col">
            {TYPES.map((type) => (
              <Frame key={type} device={device}>
                <SearchBar {...args} device={device} type={type} />
              </Frame>
            ))}
          </div>
        </div>
      ))}
    </Grid>
  ),
};

/**
 * The animation itself, at three dwells, side by side with a pinned bar.
 *
 * Cycling `type` is the whole mechanism: every word stays mounted and the stack slides by
 * one pitch, wrapping instantly back to the first rather than scrolling backwards.
 *
 * **The timing is an implementation default, not a Figma value.** The 2000ms dwell and
 * 500ms slide are placeholders for a real motion specification; the easing comes from the
 * repo's bare-`transition` convention rather than being stated here. Cycling stops on
 * `animate={false}`, under `prefers-reduced-motion`, while the field is filled, and while
 * the tab is hidden.
 */
export const Animation: Story = {
  render: (args) => (
    <Grid>
      {[
        ['default — 2000ms dwell', { intervalMs: 2000 }],
        ['faster — 1000ms', { intervalMs: 1000 }],
        ['slower — 3500ms', { intervalMs: 3500 }],
        ['pinned — animate={false}', { animate: false }],
      ].map(([label, override]) => (
        <div key={label as string}>
          <Caption>{label as string}</Caption>
          <Frame device={args.device ?? 'mobile'}>
            <SearchBar {...args} {...(override as object)} />
          </Frame>
        </div>
      ))}
    </Grid>
  ),
};

/**
 * Figma's `showAnimatedText` boolean.
 *
 * It removes the animated stack and nothing else — the static "Search by" is independent
 * of it and stays.
 */
export const ShowAnimatedText: Story = {
  render: (args) => (
    <Grid>
      {[true, false].map((show) => (
        <div key={String(show)}>
          <Caption>showAnimatedText = {String(show)}</Caption>
          <Frame device={args.device ?? 'mobile'}>
            <SearchBar {...args} showAnimatedText={show} />
          </Frame>
        </div>
      ))}
    </Grid>
  ),
};

/**
 * The controlled API, which is how an application drives it.
 *
 * `onValueChange` reports every edit and the clear; `State` follows the value with
 * nothing to keep in sync.
 */
export const Controlled: Story = {
  render: (args) => {
    const Demo = () => {
      const [query, setQuery] = useState('');
      return (
        <div className="gap-semantic-lg flex flex-col">
          <Frame device={args.device ?? 'mobile'}>
            <SearchBar {...args} value={query} onValueChange={setQuery} />
          </Frame>
          <p className="text-desktop-caption-sm text-semantic-text-tertiary">
            value: {query === '' ? '(empty — Default)' : `${query} (Filled)`}
          </p>
        </div>
      );
    };
    return <Demo />;
  },
};
