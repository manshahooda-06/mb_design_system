import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

/**
 * Documentation and visual review for Button.
 *
 * The matrix stories render whole sets side by side rather than one state per
 * story: emphasis and tone are judged against each other, and a change to one
 * cell is only visible next to the others.
 */

/** Stand-in glyphs. The icon foundation has no published set yet. */
function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 10h12m0 0-4.5-4.5M16 10l-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="m4.5 10.5 3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-lg flex flex-wrap items-center">{children}</div>
);

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-xl flex flex-col">{children}</div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary">{children}</p>
);

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Two orthogonal axes taken from Figma: `variant` for emphasis (filled, outlined, ' +
          'ghost) and `tone` for intent (default, color, error). A destructive action is ' +
          '`tone="error"` at whichever emphasis suits the context, not a separate variant.\n\n' +
          '`primary` + `tone="color"` is a **type error**: Figma defines no such pair, because ' +
          '`button-primary-bg` already resolves to `brand-600`.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'tertiary'],
      description: 'Emphasis: filled, outlined, ghost.',
    },
    tone: {
      control: 'inline-radio',
      options: ['default', 'color', 'error'],
      description: 'Intent. `color` is unavailable on `primary`.',
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    fullWidth: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    loadingLabel: { control: 'text' },
    asChild: { control: false },
    startSlot: { control: false },
    endSlot: { control: false },
  },
  args: { children: 'Continue' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every prop is wired to a control. Start here. */
export const Playground: Story = {};

/**
 * The eight pairs Figma defines. The empty cell is `primary` + `color`, which
 * the type system forbids.
 */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Stack>
      <div>
        <Label>primary — filled</Label>
        <Row>
          <Button {...args} />
          <Button {...args} tone="error">
            Delete
          </Button>
        </Row>
      </div>
      <div>
        <Label>secondary — outlined</Label>
        <Row>
          <Button {...args} variant="secondary" tone="default" />
          <Button {...args} variant="secondary" tone="color" />
          <Button {...args} variant="secondary" tone="error">
            Cancel booking
          </Button>
        </Row>
      </div>
      <div>
        <Label>tertiary — ghost</Label>
        <Row>
          <Button {...args} variant="tertiary" tone="default" />
          <Button {...args} variant="tertiary" tone="color" />
          <Button {...args} variant="tertiary" tone="error">
            Remove
          </Button>
        </Row>
      </div>
    </Stack>
  ),
};

/**
 * Sizes are built from spacing, type and radius tokens only. No height is set —
 * it falls out of padding plus line-height plus border, so the button tracks the
 * type ramp instead of a hardcoded pixel value.
 */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Row>
      <Button {...args} size="sm" />
      <Button {...args} size="md" />
      <Button {...args} size="lg" />
    </Row>
  ),
};

/** Resting, disabled and loading, across all three emphases. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Stack>
      <div>
        <Label>default</Label>
        <Row>
          <Button {...args} />
          <Button {...args} variant="secondary" />
          <Button {...args} variant="tertiary" />
        </Row>
      </div>
      <div>
        <Label>disabled</Label>
        <Row>
          <Button {...args} disabled />
          <Button {...args} variant="secondary" disabled />
          <Button {...args} variant="tertiary" disabled />
        </Row>
      </div>
      <div>
        <Label>loading</Label>
        <Row>
          <Button {...args} loading />
          <Button {...args} variant="secondary" loading />
          <Button {...args} variant="tertiary" loading />
        </Row>
      </div>
    </Stack>
  ),
};

/**
 * Leading for context, trailing for forward motion. The icon box scales with the
 * button; the icon itself fills it.
 *
 * MB guidance: never use a leading and a trailing icon on the same button.
 */
export const Icons: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Row>
      <Button {...args} startSlot={<CheckIcon />}>
        Confirm
      </Button>
      <Button {...args} endSlot={<ArrowRightIcon />}>
        Continue
      </Button>
      <Button {...args} variant="secondary" startSlot={<CheckIcon />}>
        Confirm
      </Button>
      <Button {...args} size="sm" endSlot={<ArrowRightIcon />}>
        Continue
      </Button>
    </Row>
  ),
};

/**
 * The spinner takes the leading position and inherits the label colour, so it is
 * correct on every variant without a token of its own.
 *
 * A loading button stays focusable and sets `aria-busy` with `aria-disabled`,
 * rather than the native `disabled` attribute — which would drop it out of the
 * tab order mid-interaction and throw focus back to the document.
 */
export const Loading: Story = {
  args: { loading: true },
  render: (args) => (
    <Row>
      <Button {...args} />
      <Button {...args} variant="secondary" />
      <Button {...args} size="lg" loadingLabel="Submitting payment">
        Pay now
      </Button>
    </Row>
  ),
};

/**
 * Disabled uses the native attribute on a real `<button>`, so it leaves the tab
 * order. Under `asChild` the rendered element may be an anchor, which has no
 * `disabled`, so only `aria-disabled` is set and activation is blocked in JS.
 */
export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <Row>
      <Button {...args} />
      <Button {...args} variant="secondary" />
      <Button {...args} variant="secondary" tone="error" />
      <Button {...args} variant="tertiary" />
    </Row>
  ),
};

/** Stretches to the container, for mobile CTAs and form footers. */
export const FullWidth: Story = {
  args: { fullWidth: true },
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="max-w-desktop">
      <Stack>
        <Button {...args} />
        <Button {...args} variant="secondary" />
      </Stack>
    </div>
  ),
};

/** Renders the caller's element with the button's styling. */
export const AsChild: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Row>
      <Button {...args} asChild>
        <a href="#top">Rendered as a link</a>
      </Button>
    </Row>
  ),
};

/**
 * ### Accessibility
 *
 * - **Role and keyboard.** Renders a native `<button>`, so Enter and Space
 *   activate it and it is in the tab order with no extra handlers. Under
 *   `asChild` the caller's element supplies the semantics — use an `<a href>`
 *   for navigation so it is announced as a link and works with middle-click.
 * - **Focus.** `focus-visible` only, so a ring appears for keyboard users but
 *   not on mouse click. The ring colour follows `tone`, so a destructive action
 *   keeps its error colour when focused.
 * - **Disabled.** Native `disabled` on a real button: removed from the tab
 *   order, not announced as actionable. MB guidance is to explain *why*
 *   something is disabled — pair it with a tooltip or helper text rather than
 *   leaving the user guessing.
 * - **Loading.** `aria-busy="true"` plus `aria-disabled="true"`, and the button
 *   stays focusable. An off-screen label ("Loading" by default, override with
 *   `loadingLabel`) is appended so a screen reader announces the state change;
 *   the visible label is unchanged, so sighted users do not lose their place.
 * - **Icons.** Slots are wrapped in `aria-hidden`, so a decorative icon never
 *   doubles the accessible name. An icon-only button is not supported — it would
 *   need a name the component cannot supply for the caller.
 * - **Touch target.** MB requires 44px minimum for medical UI. `lg` clears it;
 *   `sm` and `md` do not, so use `lg` for primary mobile actions.
 */
export const Accessibility: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack>
      <div>
        <Label>Tab to reach, then Enter or Space to activate</Label>
        <Row>
          <Button>First</Button>
          <Button variant="secondary">Second</Button>
          <Button disabled>Skipped when disabled</Button>
        </Row>
      </div>
      <div>
        <Label>Focus ring follows the tone</Label>
        <Row>
          <Button>Default ring</Button>
          <Button tone="error">Error ring</Button>
        </Row>
      </div>
    </Stack>
  ),
};
