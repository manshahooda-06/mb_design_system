import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { Modal } from './Modal';
import { MODAL_DEVICES, MODAL_TYPES } from './constants';

const HEADING = 'Placeholder content to be replaced';
const SUB_TEXT = 'Placeholder content to be replaced';
const TEXT = 'Placeholder content to be replaced';

/*
 * Glyphs for the two icon slots, story-only.
 *
 * Figma's `icon` defaults to the generic stroked `circle` its icon library uses for "an
 * icon goes here", and the close is `cancel-01`. Neither ships in the library — every
 * recognisable glyph here is the caller's — so the stories supply their own, drawn with
 * `currentColor`, exactly as SearchBar's, Toast's and BottomSheet's stories do.
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

/**
 * Stand-in artwork for the illustration slot, story-only.
 *
 * Figma draws an illustration above an `icon+text` heading but binds **no published
 * property** to that layer, so it can only be changed by editing the file. This library
 * ships no artwork of any kind, so the slot takes the caller's — here a plain tick.
 */
const SuccessArt = () => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <circle cx="60" cy="60" r="52" className="fill-semantic-utility-success-50" />
    <path
      d="M40 62l14 14 27-30"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-semantic-utility-success-500"
    />
  </svg>
);

const ICON_OPTIONS: Record<string, React.ReactNode> = {
  'circle (Figma’s default)': <CircleIcon />,
  None: undefined,
};

const CLOSE_ICON_OPTIONS: Record<string, React.ReactNode> = {
  'cancel-01': <CancelIcon />,
  None: undefined,
};

const ILLUSTRATION_OPTIONS: Record<string, React.ReactNode> = {
  'Success tick': <SuccessArt />,
  None: undefined,
};

/**
 * Figma's two `Button CTA`s, as the caller would actually pass them.
 *
 * `lg` on desktop and `md` on mobile — the sizes the rest of the library already uses for
 * those breakpoints. Figma's Mobile `custom` frame shows the desktop button dimensions,
 * which is an inconsistency in the file rather than a third size; see the deviation note
 * in the component description.
 */
const DesktopActions = () => (
  <>
    <Button size="lg" variant="secondary">
      Button CTA
    </Button>
    <Button size="lg">Button CTA</Button>
  </>
);

const MobileActions = () => (
  <>
    <Button size="md" variant="secondary">
      Button CTA
    </Button>
    <Button size="md">Button CTA</Button>
  </>
);

const FOOTER_OPTIONS: Record<string, React.ReactNode> = {
  'Two buttons (desktop `lg`)': <DesktopActions />,
  'Two buttons (mobile `md`)': <MobileActions />,
  'One button (desktop `lg`)': <Button size="lg">Button CTA</Button>,
  None: undefined,
};

/**
 * Figma's `_Content Block Placeholder`, reproduced for the stories only.
 *
 * It is marked "swap me with your custom content", so it is a hole in the design rather
 * than part of it and nothing like it ships. Shown here so `custom` reads against the
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
 * The frame the modal is placed in, since it fills its container rather than pinning a
 * size of its own.
 *
 * Figma's canvases are 1920 × 1080 and 360 × 780 — whole screens. The card is centred in
 * them, so a specimen at full size is mostly empty scrim; these stories use a frame just
 * large enough to hold the card with room around it. Nothing about what renders changes:
 * the scrim still fills, the card still centres. `FigmaCanvas` shows the true 360 × 780.
 */
const Frame = ({
  children,
  device = 'desktop',
  height,
}: {
  children: React.ReactNode;
  device?: 'desktop' | 'mobile';
  height?: number;
}) => (
  <div
    className="overflow-clip"
    style={{ width: device === 'mobile' ? 360 : 560, height: height ?? 520 }}
  >
    {children}
  </div>
);

const meta = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A centred card over a dimmed screen. Measured from Figma `Modal` ' +
          '(node 4792:13831) and its nested `_Modal card` (node 4792:13743).\n\n' +
          '**This is the modal as drawn, not a modal system.** Figma specifies no open ' +
          'state, no animation, no backdrop dismissal, no focus treatment and no ' +
          'z-index — and this library has no overlay, portal or dialog architecture to ' +
          'inherit one from. So none of it is invented here: mounting, positioning, focus ' +
          'and dismissal belong to whatever shows the modal. **The parent owns ' +
          'visibility** — it renders the modal when it wants it and stops when it does ' +
          'not. `onClose` only reports that the close button was pressed; nothing in this ' +
          'component acts on it. That is also why the root carries **no `dialog` role** — ' +
          '`aria-modal` would promise focus containment this component does not ' +
          'implement.\n\n' +
          '**Six variants, all implemented.** `type` (3) × `Device` (2), published on the ' +
          'nested card. The three types are three layouts rather than three skins: ' +
          '`icon+text` has no header title and no divider and centres an illustration over ' +
          'its heading; `text only` has a titled header, a divider and one paragraph; ' +
          '`custom` keeps that header and hands the body to you.\n\n' +
          '**One component, because Figma marks the card private.** `_Modal card` carries ' +
          'the underscore Figma reserves for internal parts, so it is not exported ' +
          'separately.\n\n' +
          '**Canonical parts are reused, not redrawn**: `Divider` under the titled ' +
          'headers, and your own `Button`s in the footer, which the row sizes to Figma’s ' +
          'equal widths.\n\n' +
          '**The illustration is yours.** Figma draws one but binds no published property ' +
          'to that layer, so no artwork ships and the slot takes a node instead.\n\n' +
          '**Known Figma deviation.** The Mobile `custom` variant uses the standard ' +
          'Mobile Button `md` size for consistency with the other Modal variants, even ' +
          'though the current Figma reference shows the Desktop button dimensions.\n\n' +
          '**Size.** The modal fills its container rather than pinning Figma’s canvases, ' +
          'which are whole screens. The specimens below use a frame just large enough to ' +
          'hold the card — **Figma Canvas** shows the true 360 × 780.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    device: 'desktop',
    type: 'icon-text',
    heading: HEADING,
    showSubText: true,
    subText: SUB_TEXT,
    text: TEXT,
    showLeftIcon: true,
    icon: 'circle (Figma’s default)',
    illustration: 'Success tick',
    children: 'Figma’s placeholder block',
    footer: 'Two buttons (desktop `lg`)',
    closeIcon: 'cancel-01',
    closeLabel: 'Close',
  },
  argTypes: {
    device: {
      control: 'inline-radio',
      options: MODAL_DEVICES,
      description:
        '**Figma property** `Device`. A real axis: the two differ in width, padding, ' +
        'gaps, glyph sizes and every type step.',
    },
    type: {
      control: 'inline-radio',
      options: MODAL_TYPES,
      description:
        '**Figma property** `type`, published on the nested `_Modal card` — `icon+text`, ' +
        '`text only` and `custom`. Three layouts; the props each one ignores are simply ' +
        'not rendered.',
    },
    heading: {
      control: 'text',
      description:
        '**Figma property** `heading`. Centred under the illustration on `icon+text`; the ' +
        'header title on the other two, where it truncates to one line. No default copy ' +
        'ships.',
    },
    showSubText: {
      control: 'boolean',
      description:
        '**Figma property** `showSubText`. `icon+text` only, and gated with `subText`: ' +
        'clear the copy and the line disappears rather than holding open an empty row.',
    },
    subText: {
      control: 'text',
      description:
        '**Figma property** `subText`. The light secondary line under an ' + '`icon+text` heading.',
    },
    text: {
      control: 'text',
      description: '**Figma property** `text`. The body paragraph of `text only`.',
    },
    showLeftIcon: {
      control: 'boolean',
      description:
        '**Figma property** `showLeftIcon`. `text only` and `custom` only, and gated with ' +
        '`icon` in the same way.',
    },
    icon: {
      options: Object.keys(ICON_OPTIONS),
      mapping: ICON_OPTIONS,
      control: { type: 'select' },
      description: '**Figma property** `icon`. Caller-supplied; sized by the slot.',
    },
    illustration: {
      options: Object.keys(ILLUSTRATION_OPTIONS),
      mapping: ILLUSTRATION_OPTIONS,
      control: { type: 'select' },
      description:
        '**Engineering addition.** Figma draws artwork here but publishes no property for ' +
        'it, so it arrives from you — 120 square on desktop, 80 on mobile.',
    },
    children: {
      options: Object.keys(CONTENT_OPTIONS),
      mapping: CONTENT_OPTIONS,
      control: { type: 'select' },
      description:
        '**Composition.** Figma’s `_Content Block Placeholder` is marked "swap me", so ' +
        '`custom` renders whatever you put here and nothing otherwise.',
    },
    footer: {
      options: Object.keys(FOOTER_OPTIONS),
      mapping: FOOTER_OPTIONS,
      control: { type: 'select' },
      description:
        '**Composition.** Your own `Button`s — `lg` on desktop, `md` on mobile. The row ' +
        'sizes them equally, so one action spans it and two share it.',
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
    onClose: {
      description:
        '**Engineering addition.** Fires when the close button is pressed. **It notifies; ' +
        'it does not dismiss** — the modal holds no visibility state and never unmounts ' +
        'itself.',
    },
  },
  render: ({ device, ...args }) => (
    <Frame device={device}>
      <Modal device={device} {...args} />
    </Frame>
  ),
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every published property is live. */
export const Playground: Story = {};

/* ------------------------------ the six cells ----------------------------- */

/** Desktop `icon+text` — a 120 illustration over a centred heading and sub-text, no divider. */
export const DesktopIconText: Story = {
  args: { device: 'desktop', type: 'icon-text' },
};

/** Desktop `text only` — a titled header with a leading glyph, a divider, one paragraph. */
export const DesktopTextOnly: Story = {
  args: { device: 'desktop', type: 'text-only' },
};

/** Desktop `custom` — the same header, and the body is yours. The card hugs its content. */
export const DesktopCustom: Story = {
  args: { device: 'desktop', type: 'custom' },
};

/** Mobile `icon+text` — an 80 illustration, and the two lines grouped 8 apart. */
export const MobileIconText: Story = {
  args: { device: 'mobile', type: 'icon-text', footer: 'Two buttons (mobile `md`)' },
};

/** Mobile `text only` — the same layout a step smaller throughout. */
export const MobileTextOnly: Story = {
  args: { device: 'mobile', type: 'text-only', footer: 'Two buttons (mobile `md`)' },
};

/**
 * Mobile `custom`.
 *
 * **Known Figma deviation:** this uses the standard Mobile Button `md` size for
 * consistency with the other Modal variants, even though the current Figma reference
 * shows the Desktop button dimensions.
 */
export const MobileCustom: Story = {
  args: { device: 'mobile', type: 'custom', footer: 'Two buttons (mobile `md`)' },
};

/* ------------------------------- properties ------------------------------- */

/** Figma's `showLeftIcon` off: the title takes the full width up to the close. */
export const WithoutLeftIcon: Story = {
  args: { type: 'text-only', showLeftIcon: false },
};

/** Figma's `showSubText` off: the heading sits alone under the illustration. */
export const WithoutSubText: Story = {
  args: { type: 'icon-text', showSubText: false },
};

/** No illustration supplied: the content starts at the heading, with nothing held open. */
export const WithoutIllustration: Story = {
  args: { type: 'icon-text', illustration: 'None' },
};

/** No footer: the card ends after the content, keeping its own bottom padding. */
export const WithoutFooter: Story = {
  args: { type: 'text-only', footer: 'None' },
};

/** One action, spanning the row — `flex-1` on the row is what makes a single button fill it. */
export const OneAction: Story = {
  args: { type: 'text-only', footer: 'One button (desktop `lg`)' },
};

/**
 * The title is one line and truncates, which is what keeps the close button pinned rather
 * than pushed off the edge.
 */
export const LongHeading: Story = {
  args: {
    type: 'text-only',
    heading: 'Upload the prescription issued by your consulting physician for this order',
  },
};

/* ------------------------------ in practice ------------------------------- */

/**
 * The content block is a hole in the design, so real content goes straight in — here a
 * short form rather than Figma's dashed placeholder.
 */
export const CustomContent: Story = {
  render: () => (
    <Frame>
      <Modal
        type="custom"
        heading="Add a family member"
        icon={<CircleIcon />}
        closeIcon={<CancelIcon />}
        closeLabel="Close"
        footer={
          <>
            <Button size="lg" variant="secondary">
              Cancel
            </Button>
            <Button size="lg">Add</Button>
          </>
        }
      >
        <div className="gap-semantic-lg flex flex-col">
          <p className="text-desktop-body-sm text-semantic-text-secondary font-light">
            They will be able to book appointments under your plan.
          </p>
          <ContentPlaceholder />
        </div>
      </Modal>
    </Frame>
  ),
};

/**
 * What it looks like in use: the modal fills whatever it is placed in, so a real
 * application mounts it in a viewport-fixed wrapper and **unmounts it to dismiss**.
 * `onClose` is the signal to do that — it does not dismiss anything itself.
 */
export const InAViewportWrapper: Story = {
  render: () => (
    <div className="border-semantic-border-tertiary relative h-[520px] w-[560px] overflow-clip rounded-md border">
      <div className="p-semantic-xl gap-semantic-md flex flex-col">
        <p className="text-desktop-heading-sm text-semantic-text-primary font-semibold">
          Your reports
        </p>
        <p className="text-desktop-body-sm text-semantic-text-secondary font-light">
          The page behind the modal keeps rendering; the scrim dims it.
        </p>
      </div>
      <Modal
        type="text-only"
        heading="Delete this report?"
        text="This removes the report from every dashboard it appears on."
        icon={<CircleIcon />}
        closeIcon={<CancelIcon />}
        closeLabel="Close"
        footer={
          <>
            <Button size="lg" variant="secondary">
              Cancel
            </Button>
            <Button size="lg" tone="error">
              Delete
            </Button>
          </>
        }
      />
    </div>
  ),
};

/**
 * Figma's mobile canvas, 360 × 780, with the card centred in it.
 *
 * This is the frame the node is drawn in. The other stories use a shorter one so the card
 * is not marooned in empty scrim — nothing else about them differs.
 */
export const FigmaCanvas: Story = {
  args: { device: 'mobile', type: 'icon-text', footer: 'Two buttons (mobile `md`)' },
  render: ({ device, ...args }) => (
    <Frame device={device} height={780}>
      <Modal device={device} {...args} />
    </Frame>
  ),
};
