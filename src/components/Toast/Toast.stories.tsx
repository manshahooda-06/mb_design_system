import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toast } from './Toast';
import { TOAST_STATES } from './constants';

const MESSAGE = 'Prescription uploaded';
const ACTION = 'Undo';

/*
 * Glyphs for the two instance swaps, story-only.
 *
 * Figma's default for both is a plain stroked `circle` — its icon library's placeholder
 * for "an icon goes here" rather than artwork that means anything — so nothing ships in
 * the library and these stories supply their own, the way a consumer would. They are
 * drawn with `currentColor` so the toast's white text reaches them. SearchBar's stories
 * define their magnifier the same way.
 */
const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" />
    <path
      d="M5.5 8.2 7.2 9.9l3.3-3.8"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M4.5 4.5l7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/** Figma's `circle`, reproduced exactly — the placeholder it ships as the default. */
const CircleIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <circle cx="8" cy="8" r="5.33" stroke="currentColor" strokeLinejoin="round" />
  </svg>
);

const LEFT_ICON_OPTIONS: Record<string, React.ReactNode> = {
  'Check (example)': <CheckIcon />,
  'circle (Figma’s placeholder)': <CircleIcon />,
  None: undefined,
};

const POST_ICON_OPTIONS: Record<string, React.ReactNode> = {
  'Close (example)': <CloseIcon />,
  'circle (Figma’s placeholder)': <CircleIcon />,
  None: undefined,
};

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-3xl flex flex-col items-start">{children}</div>
);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary mb-semantic-md">{children}</p>
);

const meta = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A status bar that reports what just happened. Measured from Figma `Toast` ' +
          '(node 2181:829) — **both variants** on a single `State` axis valued ' +
          '`Mobile | Desktop`.\n\n' +
          '**This is the toast as drawn, not a toast system.** Figma publishes eight ' +
          'properties and not one is behavioural — no open state, no duration, no ' +
          'placement, no enter or exit treatment, no dismiss handler, no interaction of ' +
          'any kind. So none of that exists here. Positioning, queueing, timing and ' +
          'dismissal belong to whatever shows the toast, and a caller who needs the ' +
          'trailing action to *do* something passes a control as `postIcon` or wraps ' +
          '`postText` in one — the same division Tooltip uses for visibility and ' +
          'placement.\n\n' +
          '**The three visibility booleans are Figma’s own and are gated with their ' +
          'content.** `false` never renders its part; `true` renders it only once there ' +
          'is something to put there. The booleans stay authoritative, but they cannot ' +
          'conjure a part that has none — no icon artwork and no default copy ship here, ' +
          'so the alternative is a 16px hole in the layout.\n\n' +
          '**Width is pinned, height is not.** Figma pins 328 and 480, and the layout ' +
          'needs a definite width to mean anything: the message flexes and the trailing ' +
          'action stays intrinsic. The heights fall out of the padding exactly — ' +
          '`8 + (2 + 20 + 2) + 8 = 40` and `16 + 24 + 16 = 56`.\n\n' +
          '**Both glyphs are caller-supplied.** Figma’s default for each is a plain ' +
          'stroked `circle`, its icon library’s placeholder, so nothing is shipped — the ' +
          'convention Checkbox’s tick and SearchBar’s magnifier already follow.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    state: 'mobile',
    primaryText: MESSAGE,
    preIconShow: true,
    leftIcon: 'Check (example)',
    postTextShow: true,
    postText: ACTION,
    postIconShow: true,
    postIcon: 'Close (example)',
  },
  argTypes: {
    state: {
      control: 'inline-radio',
      options: TOAST_STATES,
      description: '**Figma property** `State`, valued `Mobile | Desktop`.',
    },
    primaryText: {
      control: 'text',
      description: '**Figma property** `Primary Text`. No default copy ships.',
    },
    preIconShow: {
      control: 'boolean',
      description:
        '**Figma property** `Pre Icon Show`. Gated with `leftIcon`: set the glyph to ' +
        'None and the icon disappears rather than holding open an empty box.',
    },
    leftIcon: {
      options: Object.keys(LEFT_ICON_OPTIONS),
      mapping: LEFT_ICON_OPTIONS,
      control: { type: 'select' },
      description:
        '**Figma property** `left icon` — an instance swap. Caller-supplied; sized by ' +
        'the slot and coloured by `currentColor`.',
    },
    postTextShow: {
      control: 'boolean',
      description: '**Figma property** `Post Text Show`. Gated with `postText`.',
    },
    postText: {
      control: 'text',
      description:
        '**Figma property** `Post Text`. Figma’s default is "Undo", which is product ' +
        'copy, so it does not ship.',
    },
    postIconShow: {
      control: 'boolean',
      description: '**Figma property** `Post Icon Show` — plural, as published.',
    },
    postIcon: {
      options: Object.keys(POST_ICON_OPTIONS),
      mapping: POST_ICON_OPTIONS,
      control: { type: 'select' },
      description:
        '**Figma property** `post icon` — the second instance swap. Not hidden from ' +
        'assistive technology, so a `<button>` passed here stays reachable.',
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every published property is live here. */
export const Playground: Story = {};

/** Both published variants, at Figma's own widths. */
export const EveryVariant: Story = {
  render: () => (
    <Stack>
      {TOAST_STATES.map((state) => (
        <div key={state}>
          <Caption>
            {state} — {state === 'mobile' ? '328 × 40' : '480 × 56'} in Figma
          </Caption>
          <Toast
            state={state}
            leftIcon={<CheckIcon />}
            primaryText={MESSAGE}
            postText={ACTION}
            postIcon={<CloseIcon />}
          />
        </div>
      ))}
    </Stack>
  ),
};

/** Mobile: 328 × 40, 8px radius, 12/8 padding, 16px glyphs, 12/20 text, `elevation-2`. */
export const Mobile: Story = {
  render: () => (
    <Toast
      leftIcon={<CheckIcon />}
      primaryText={MESSAGE}
      postText={ACTION}
      postIcon={<CloseIcon />}
    />
  ),
};

/**
 * Desktop: 480 × 56, 12px radius, 16 padding, 24px glyphs, 16/24 text, and Figma's
 * four-layer `Web` shadow — the one value here no elevation token can carry.
 */
export const Desktop: Story = {
  render: () => (
    <Toast
      state="desktop"
      leftIcon={<CheckIcon />}
      primaryText={MESSAGE}
      postText={ACTION}
      postIcon={<CloseIcon />}
    />
  ),
};

/**
 * Figma's three booleans, in all eight combinations. Each is independent, and the two
 * trailing parts can appear alone or together.
 */
export const Visibility: Story = {
  render: () => (
    <Stack>
      {[true, false].flatMap((preIconShow) =>
        [true, false].flatMap((postTextShow) =>
          [true, false].map((postIconShow) => {
            const label = `preIconShow=${preIconShow} · postTextShow=${postTextShow} · postIconShow=${postIconShow}`;
            return (
              <div key={label}>
                <Caption>{label}</Caption>
                <Toast
                  preIconShow={preIconShow}
                  postTextShow={postTextShow}
                  postIconShow={postIconShow}
                  leftIcon={<CheckIcon />}
                  primaryText={MESSAGE}
                  postText={ACTION}
                  postIcon={<CloseIcon />}
                />
              </div>
            );
          }),
        ),
      )}
    </Stack>
  ),
};

/**
 * The message flexes into whatever the trailing action leaves and wraps rather than
 * truncating — Figma sets `word-break: break-word` and no ellipsis, so long copy grows
 * the bar's height while the action stays on one line at the 8px gap.
 */
export const TextBehaviour: Story = {
  render: () => (
    <Stack>
      <div>
        <Caption>Short message</Caption>
        <Toast leftIcon={<CheckIcon />} primaryText="Saved" postText={ACTION} />
      </div>
      <div>
        <Caption>Long message — wraps, and the action holds its line</Caption>
        <Toast
          leftIcon={<CheckIcon />}
          primaryText="Your prescription was uploaded and is now waiting for the pharmacist to review it"
          postText={ACTION}
          postIcon={<CloseIcon />}
        />
      </div>
      <div>
        <Caption>Longer action label — intrinsic, so the message gives way instead</Caption>
        <Toast
          leftIcon={<CheckIcon />}
          primaryText="Your prescription was uploaded and is waiting for review"
          postText="Undo this upload"
        />
      </div>
      <div>
        <Caption>Message only</Caption>
        <Toast primaryText={MESSAGE} />
      </div>
    </Stack>
  ),
};

/**
 * Figma publishes no handler, so interaction is the caller's: pass a control as
 * `postIcon`, or wrap `postText` in one. That slot is deliberately not hidden from
 * assistive technology, so a button placed there stays reachable — and an icon-only
 * button needs its own accessible name.
 */
export const CallerSuppliedActions: Story = {
  render: () => (
    <Stack>
      {TOAST_STATES.map((state) => (
        <div key={state}>
          <Caption>{state} — the action and the dismiss are the caller's own controls</Caption>
          <Toast
            state={state}
            leftIcon={<CheckIcon />}
            primaryText={MESSAGE}
            postText={
              <button type="button" className="underline" onClick={() => alert('Undo')}>
                {ACTION}
              </button>
            }
            postIcon={
              <button type="button" aria-label="Dismiss" onClick={() => alert('Dismiss')}>
                <CloseIcon />
              </button>
            }
          />
        </div>
      ))}
    </Stack>
  ),
};

/**
 * The glyphs are whatever you hand over. Figma's own default is the plain `circle` shown
 * in the middle — its icon library's placeholder, which is why the library ships neither
 * it nor anything else.
 */
export const Icons: Story = {
  render: () => (
    <Stack>
      <div>
        <Caption>A meaningful pair</Caption>
        <Toast
          leftIcon={<CheckIcon />}
          primaryText={MESSAGE}
          postText={ACTION}
          postIcon={<CloseIcon />}
        />
      </div>
      <div>
        <Caption>Figma’s `circle` placeholder, reproduced</Caption>
        <Toast
          leftIcon={<CircleIcon />}
          primaryText="Placeholder Text"
          postText={ACTION}
          postIcon={<CircleIcon />}
        />
      </div>
      <div>
        <Caption>No glyphs at all — the booleans have nothing to show</Caption>
        <Toast primaryText={MESSAGE} postText={ACTION} />
      </div>
    </Stack>
  ),
};
