import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './Tooltip';
import { TOOLTIP_ARROW_POSITIONS } from './constants';
import type { TooltipArrowPosition } from './types';

const LABEL = 'This is a tooltip';
const SUPPORTING =
  'Tooltips are used to describe or identify an element. In most scenarios, tooltips help the ' +
  'user understand meaning, function or alt-text.';

/** Arrow positions in Figma's own order, minus the plain bubble. */
const DRAWN_POSITIONS = TOOLTIP_ARROW_POSITIONS.filter((a) => a !== 'none') as Exclude<
  TooltipArrowPosition,
  'none'
>[];

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-desktop gap-semantic-6xl flex flex-col">{children}</div>
);
const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-6xl flex flex-wrap items-start">{children}</div>
);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary mb-semantic-lg">{children}</p>
);

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A tooltip bubble. Measured from Figma `Tooltip` (node 1052:489) — **all 14 ' +
          'variants**: `Supporting text`(2) × `Arrow`(7).\n\n' +
          '**Tooltip has no state axis.** Figma publishes exactly two properties and neither ' +
          'is a state — no hover, focus, open, delay, collision or motion appears anywhere in ' +
          'the 14, and no z-index. So this is the bubble, not the behaviour: visibility and ' +
          'placement belong to the caller, who knows which element the tooltip describes and ' +
          'where there is room for it. Nothing here is stateful, so it uses no hooks and ' +
          'renders on the server.\n\n' +
          '**The arrow matrix is asymmetric, as published.** Three bottom positions, one top, ' +
          'and two sides with no vertical qualifier. `top-left` and `top-right` do not exist ' +
          'in Figma and so do not exist here.\n\n' +
          '**Accessibility is a contract.** `role="tooltip"` names nothing by itself: give the ' +
          'tooltip an `id` and point the trigger at it with `aria-describedby`. See the ' +
          'Accessibility story.',
      },
    },
  },
  tags: ['autodocs'],
  args: { label: LABEL, arrowPosition: 'none' },
  argTypes: {
    arrowPosition: { control: 'select', options: TOOLTIP_ARROW_POSITIONS },
    label: { control: 'text' },
    supportingText: { control: 'text' },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Figma's `Arrow` axis. The bubble is identical in all seven — only where the arrow
 * attaches changes, and it adds exactly 6px to whichever axis it sits on.
 */
export const Arrows: Story = {
  render: () => (
    <Grid>
      <div>
        <Caption>
          Arrow position = none — 115 × 36 in Figma, and the baseline every other position adds to.
        </Caption>
        <Tooltip label={LABEL} arrowPosition="none" />
      </div>
      {DRAWN_POSITIONS.map((arrowPosition) => (
        <div key={arrowPosition}>
          <Caption>Arrow position = {arrowPosition}</Caption>
          <Tooltip label={LABEL} arrowPosition={arrowPosition} />
        </div>
      ))}
    </Grid>
  ),
};

/**
 * Figma's `Supporting text` axis. Supplying supporting text changes more than one
 * line: padding goes from 12/8 to 12 all round, and the label stops being centred
 * and starts wrapping. Both are measured, not stylistic.
 */
export const Content: Story = {
  render: () => (
    <Grid>
      <div>
        <Caption>Label alone — padding 12/8, centred, never wraps.</Caption>
        <Tooltip label={LABEL} arrowPosition="bottom-center" />
      </div>
      <div>
        <Caption>
          With supporting text — padding 12 all round, left-aligned, wraps, 2px apart.
        </Caption>
        <div className="max-w-[258px]">
          <Tooltip label={LABEL} supportingText={SUPPORTING} arrowPosition="bottom-center" />
        </div>
      </div>
    </Grid>
  ),
};

/**
 * All 14 published variants, laid out as Figma's component set: `Supporting text`
 * down, `Arrow` across.
 */
export const EveryVariant: Story = {
  render: () => (
    <Grid>
      <div>
        <Caption>Supporting text = False</Caption>
        <Row>
          {TOOLTIP_ARROW_POSITIONS.map((arrowPosition) => (
            <div key={arrowPosition}>
              <Caption>{arrowPosition}</Caption>
              <Tooltip label={LABEL} arrowPosition={arrowPosition} />
            </div>
          ))}
        </Row>
      </div>
      <div>
        <Caption>Supporting text = True</Caption>
        <Row>
          {TOOLTIP_ARROW_POSITIONS.map((arrowPosition) => (
            <div key={arrowPosition} className="w-[258px] shrink-0">
              <Caption>{arrowPosition}</Caption>
              <Tooltip label={LABEL} supportingText={SUPPORTING} arrowPosition={arrowPosition} />
            </div>
          ))}
        </Row>
      </div>
    </Grid>
  ),
};

/**
 * Width is not pinned. Figma's instances are 115 and 258 wide, but those are canvas
 * widths — `Content` is full-width inside them and the copy is sample text. The
 * bubble hugs its content; the caller caps it.
 */
export const Width: Story = {
  render: () => (
    <Grid>
      <div>
        <Caption>Hugging a short label.</Caption>
        <Tooltip label="Save" arrowPosition="bottom-center" />
      </div>
      <div>
        <Caption>Capped by the caller at Figma's 258px.</Caption>
        <div className="max-w-[258px]">
          <Tooltip label={LABEL} supportingText={SUPPORTING} arrowPosition="bottom-center" />
        </div>
      </div>
      <div>
        <Caption>Capped narrower — the supporting text reflows, the bubble follows.</Caption>
        <div className="max-w-[180px]">
          <Tooltip label={LABEL} supportingText={SUPPORTING} arrowPosition="bottom-center" />
        </div>
      </div>
    </Grid>
  ),
};

/**
 * `role="tooltip"` provides no accessible name on its own — it has to be referenced.
 * Give the tooltip an `id` and point the trigger at it with `aria-describedby`; the
 * id cannot be generated here, because only the caller can put the same value on the
 * trigger. The arrow is decorative and hidden from assistive technology.
 *
 * Both tooltips below are always visible, because visibility is the caller's: this
 * component renders the bubble and nothing more.
 */
export const Accessibility: Story = {
  render: () => (
    <Grid>
      <div>
        <Caption>
          The button's accessible description is the tooltip's text, via aria-describedby.
        </Caption>
        <div className="gap-semantic-lg flex flex-col items-start">
          <Tooltip id="save-tip" label="Saves your changes" arrowPosition="bottom-left" />
          <button
            type="button"
            aria-describedby="save-tip"
            className="text-mobile-body-sm text-semantic-text-primary inset-ring-semantic-border-primary px-semantic-lg py-semantic-md rounded-md font-sans inset-ring"
          >
            Save
          </button>
        </div>
      </div>
      <div>
        <Caption>Supporting text is part of the same description.</Caption>
        <div className="gap-semantic-lg flex max-w-[258px] flex-col items-start">
          <Tooltip
            id="field-tip"
            label={LABEL}
            supportingText={SUPPORTING}
            arrowPosition="bottom-left"
          />
          <button
            type="button"
            aria-describedby="field-tip"
            className="text-mobile-body-sm text-semantic-text-primary inset-ring-semantic-border-primary px-semantic-lg py-semantic-md rounded-md font-sans inset-ring"
          >
            What is this?
          </button>
        </div>
      </div>
    </Grid>
  ),
};
