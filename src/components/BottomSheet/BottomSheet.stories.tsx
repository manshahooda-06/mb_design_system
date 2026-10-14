import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { BottomSheet, type BottomSheetType } from './BottomSheet';
import { BOTTOM_SHEET_TYPES } from './constants';

const TITLE = 'Placeholder content to be replaced';

/*
 * Glyphs for the two icon slots, story-only.
 *
 * Figma's `leftIcon` defaults to the generic stroked `circle` its icon library uses for
 * "an icon goes here", and the close is `cancel-01`. Neither ships in the library — every
 * recognisable glyph here is the caller's — so the stories supply their own, drawn with
 * `currentColor`, exactly as SearchBar's and Toast's stories do.
 */
const CircleIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <circle cx="10" cy="10" r="6.67" stroke="currentColor" strokeLinejoin="round" />
  </svg>
);

const CancelIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M5.5 5.5l9 9m0-9-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const LEFT_ICON_OPTIONS: Record<string, React.ReactNode> = {
  'circle (Figma’s default)': <CircleIcon />,
  None: undefined,
};

const CLOSE_ICON_OPTIONS: Record<string, React.ReactNode> = {
  'cancel-01': <CancelIcon />,
  None: undefined,
};

/** Figma's two `Button CTA`s, as the caller would actually pass them. */
const TwoActions = () => (
  <>
    <Button variant="secondary">Cancel</Button>
    <Button>Confirm</Button>
  </>
);

/** Figma's `Type=1 button`: one brand action, spanning the row through `flex-1`. */
const OneAction = () => <Button>Confirm</Button>;

/**
 * Figma's `type` lives on the footer and names how many actions it holds, but the row
 * itself renders whatever `footer` content it is given — `type` carries no layout
 * difference of its own (see `BottomSheet.variants.ts`). So the interactive stories
 * derive the footer's buttons from `type` directly, rather than exposing a second,
 * independent control that could disagree with it: a real caller passes matching
 * buttons by hand, but a Storybook control that silently drifts out of sync with
 * `type` is just a confusing demo.
 */
const footerFor = (type: BottomSheetType) =>
  type === 'one-button' ? <OneAction /> : <TwoActions />;

/**
 * Figma's `_Content Block Placeholder`, reproduced for the stories only.
 *
 * It is marked "swap me with your custom content", so it is a hole in the design rather
 * than part of it and nothing like it ships. Shown here so the sheet reads against the
 * Figma frame.
 */
const ContentPlaceholder = () => (
  <div className="border-semantic-border-tertiary px-semantic-xl py-semantic-3xl flex w-full items-center justify-center rounded-xs border border-dashed">
    <p className="text-mobile-body-sm text-semantic-text-secondary text-center font-semibold">
      Place elements and patterns here
    </p>
  </div>
);

const CONTENT_OPTIONS: Record<string, React.ReactNode> = {
  'Figma’s placeholder block': <ContentPlaceholder />,
  None: undefined,
};

/**
 * The frame the sheet is placed in, since it fills its container rather than pinning a
 * size of its own.
 *
 * Figma's canvas is 360 x 780 — a phone screen — but the sheet is anchored to the bottom
 * of it, so at full height a specimen is mostly empty scrim with the subject below the
 * fold. These stories use a shorter frame by default, which changes nothing about what
 * renders: the scrim still dims, the sheet still sits against the bottom edge. `FigmaCanvas`
 * below shows the true 360 x 780 for comparison.
 */
const Phone = ({ children, height = 420 }: { children: React.ReactNode; height?: number }) => (
  <div className="w-[360px] overflow-clip" style={{ height }}>
    {children}
  </div>
);

const meta = {
  title: 'Components/BottomSheet',
  component: BottomSheet,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A panel that rises from the bottom of the screen over a dimmed background. ' +
          'Measured from Figma `Bottom Sheet` (node 4751:5485).\n\n' +
          '**This is the sheet as drawn, not a sheet system.** Figma specifies no open ' +
          'state, no animation, no backdrop dismissal, no drag-to-dismiss, no scroll ' +
          'locking and no focus treatment — and this library has no overlay, portal or ' +
          'dialog architecture to inherit one from. So none of it is invented here: ' +
          'mounting, positioning, focus and dismissal belong to whatever shows the sheet, ' +
          'the same division Tooltip uses for visibility and placement. That is also why ' +
          'the root carries **no `dialog` role** — `aria-modal` would promise focus ' +
          'containment this component does not implement, and why the close is drawn as ' +
          'a button with no handler behind it.\n\n' +
          '**The sheet publishes no variant axis.** `header`, `leftIcon`, `showLeftIcon` ' +
          'and `showFooter` are content and visibility. Its one enum, `type`, sits on the ' +
          'nested `_Footer` with two values — `2 buttons` and `1 button`. Figma draws ' +
          'both rows identically; every footer button is `flex: 1 0 0`, so one action ' +
          'spans the full width and two share it equally.\n\n' +
          '**Canonical parts are reused, not redrawn**: `Divider` under the header, and ' +
          'the caller’s own `Button`s in the footer, which the row sizes to Figma’s equal ' +
          'widths.\n\n' +
          '**The content block is a hole, not a part.** Figma marks it "swap me with your ' +
          'custom content", so nothing renders there unless you fill it — the dashed ' +
          'placeholder below is reproduced in the stories only.\n\n' +
          '**Size.** The sheet fills its container rather than pinning Figma’s 360 × 780, ' +
          'which is a phone canvas. Because the sheet is anchored to the bottom of that ' +
          'canvas, the specimens below use a shorter frame so the subject is visible ' +
          'without scrolling past 500px of empty scrim — **Figma Canvas** shows the true ' +
          '360 × 780.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    header: TITLE,
    showLeftIcon: true,
    leftIcon: 'circle (Figma’s default)',
    showFooter: true,
    type: 'two-buttons',
    closeIcon: 'cancel-01',
    closeLabel: 'Close',
    children: 'Figma’s placeholder block',
  },
  argTypes: {
    header: { control: 'text', description: '**Figma property** `header`. No default copy ships.' },
    showLeftIcon: {
      control: 'boolean',
      description:
        '**Figma property** `showLeftIcon`. Gated with `leftIcon`: set the glyph to None ' +
        'and the icon disappears rather than holding open a 20px box.',
    },
    leftIcon: {
      options: Object.keys(LEFT_ICON_OPTIONS),
      mapping: LEFT_ICON_OPTIONS,
      control: { type: 'select' },
      description: '**Figma property** `leftIcon`. Caller-supplied; sized by the slot.',
    },
    showFooter: {
      control: 'boolean',
      description: '**Figma property** `showFooter`. Gated with `footer` in the same way.',
    },
    type: {
      control: 'inline-radio',
      options: BOTTOM_SHEET_TYPES,
      description:
        '**Figma property** `type`, published on the nested `_Footer` — `2 buttons` and ' +
        '`1 button`. Both draw the same row; the row itself renders whatever `footer` ' +
        'content it is given, which is why these stories derive it from `type` directly ' +
        'rather than exposing a second control that could fall out of sync with it. A ' +
        'real caller passes the matching `Button`s by hand.',
    },
    children: {
      options: Object.keys(CONTENT_OPTIONS),
      mapping: CONTENT_OPTIONS,
      control: { type: 'select' },
      description:
        '**Composition.** Figma’s `_Content Block Placeholder` is marked "swap me", so ' +
        'the sheet renders whatever you put here and nothing otherwise.',
    },
    footer: {
      control: false,
      description:
        '**Composition.** The caller’s `Button`s; the row sizes them equally. Not an ' +
        'interactive control here — these stories derive it from `type` so the two ' +
        'cannot disagree; see `type` above.',
    },
    closeIcon: {
      options: Object.keys(CLOSE_ICON_OPTIONS),
      mapping: CLOSE_ICON_OPTIONS,
      control: { type: 'select' },
      description: '**Engineering-only.** Figma draws `cancel-01`; no artwork ships.',
    },
    closeLabel: {
      control: 'text',
      description: '**Engineering-only, accessibility.** Names the icon-only close button.',
    },
  },
  render: (args) => (
    <Phone>
      <BottomSheet {...args} footer={footerFor(args.type ?? 'two-buttons')} />
    </Phone>
  ),
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every published property is live, in Figma's own 360 × 780 frame. */
export const Playground: Story = {};

/** The sheet exactly as Figma draws it — every part present. */
export const Default: Story = {};

/** Figma's `showLeftIcon` on: the glyph sits 8 before the title, 20 square. */
export const WithLeftIcon: Story = {
  args: { showLeftIcon: true, leftIcon: 'circle (Figma’s default)' },
};

/** Figma's `showLeftIcon` off: the title takes the full width up to the close. */
export const WithoutLeftIcon: Story = {
  args: { showLeftIcon: false },
};

/** Figma's `showFooter` on: two equal-width actions, 16 a side and 4 above and below. */
export const WithFooter: Story = {
  args: { showFooter: true, type: 'two-buttons' },
};

/**
 * Figma's `Type=1 button`: a single action, spanning the row. The row is the same one the
 * two-action footer uses — `flex-1` is what makes one button fill it.
 */
export const OneButtonFooter: Story = {
  args: { type: 'one-button' },
};

/** Figma's `showFooter` off: the card ends after the content, keeping its 24 bottom padding. */
export const WithoutFooter: Story = {
  args: { showFooter: false },
};

/**
 * The content block is a hole in the design, so real content goes straight in — here a
 * short confirmation rather than Figma's dashed placeholder.
 */
export const CustomContent: Story = {
  render: () => (
    <Phone>
      <BottomSheet
        header="Remove from cart"
        leftIcon={<CircleIcon />}
        closeIcon={<CancelIcon />}
        closeLabel="Close"
        footer={
          <>
            <Button variant="secondary">Keep it</Button>
            <Button>Remove</Button>
          </>
        }
      >
        <p className="text-mobile-body-md text-semantic-text-secondary">
          Paracetamol 500mg will be removed from your cart. You can add it again at any time.
        </p>
      </BottomSheet>
    </Phone>
  ),
};

/**
 * The footer takes whatever actions it is given and sizes them equally — Figma puts
 * `flex: 1 0 0` on each button, so the row does it rather than the buttons.
 */
export const CustomActions: Story = {
  render: () => (
    <Phone>
      <BottomSheet
        header="Report an issue"
        leftIcon={<CircleIcon />}
        closeIcon={<CancelIcon />}
        closeLabel="Close"
        footer={
          <>
            <Button variant="secondary" tone="error">
              Cancel
            </Button>
            <Button tone="error">Report</Button>
          </>
        }
      >
        <ContentPlaceholder />
      </BottomSheet>
    </Phone>
  ),
};

/**
 * The title is one line and truncates, which is what keeps the close button pinned rather
 * than pushed off the edge — Figma sets `white-space: nowrap` with an ellipsis.
 */
export const LongHeader: Story = {
  args: {
    header: 'Upload the prescription issued by your consulting physician for this order',
  },
};

/**
 * What it looks like in use: the sheet fills whatever it is placed in, so a real
 * application mounts it in a viewport-fixed wrapper and unmounts it to dismiss. Neither
 * the positioning nor the dismissal is the component's, because Figma publishes neither.
 */
export const InAViewportWrapper: Story = {
  render: () => (
    <div className="border-semantic-border-tertiary relative h-[560px] w-[360px] overflow-clip rounded-md border">
      <div className="p-semantic-xl gap-semantic-md flex flex-col">
        <p className="text-mobile-heading-sm text-semantic-text-primary font-semibold">Your cart</p>
        <p className="text-mobile-body-md text-semantic-text-secondary">
          The page behind the sheet keeps rendering; the scrim dims it.
        </p>
      </div>
      <BottomSheet
        header="Remove from cart"
        leftIcon={<CircleIcon />}
        closeIcon={<CancelIcon />}
        closeLabel="Close"
        footer={
          <>
            <Button variant="secondary">Keep it</Button>
            <Button>Remove</Button>
          </>
        }
      >
        <p className="text-mobile-body-md text-semantic-text-secondary">
          Paracetamol 500mg will be removed from your cart.
        </p>
      </BottomSheet>
    </div>
  ),
};

/**
 * Figma's exact canvas, 360 × 780, with the sheet anchored to the bottom of it.
 *
 * This is the frame the node is drawn in. The other stories use a shorter one so the
 * sheet is not marooned below 500px of scrim — nothing else about them differs.
 */
export const FigmaCanvas: Story = {
  render: (args) => (
    <Phone height={780}>
      <BottomSheet {...args} />
    </Phone>
  ),
};
