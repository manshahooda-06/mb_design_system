import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton';

/** Stand-in glyphs. The icon foundation has no published set yet. */
function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M4 6h12M8 6V4h4v2m-6 0 .7 9.1a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L14 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-lg flex flex-wrap items-center">{children}</div>
);
const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary">{children}</p>
);

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A square action control whose content is an icon. Same `variant` and `tone` axes as ' +
          'Button, drawing on the same tokens, so the two line up in a toolbar.\n\n' +
          '`aria-label` is **required by the type** — an icon-only control has no text, so ' +
          'without it screen readers announce only "button".\n\n' +
          "Defaults to `secondary`, which is MB's `utility` button.",
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'tertiary'] },
    tone: { control: 'inline-radio', options: ['default', 'color', 'error'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    asChild: { control: false },
    children: { control: false },
  },
  args: { 'aria-label': 'Close', children: <CloseIcon /> },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The eight pairs. `primary` + `color` is a type error, as on Button. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="gap-semantic-xl flex flex-col">
      <div>
        <Label>primary — filled</Label>
        <Row>
          <IconButton {...args} variant="primary" tone="default" />
          <IconButton {...args} variant="primary" tone="error" aria-label="Delete">
            <TrashIcon />
          </IconButton>
        </Row>
      </div>
      <div>
        <Label>secondary — outlined (MB &ldquo;utility&rdquo;)</Label>
        <Row>
          <IconButton {...args} variant="secondary" />
          <IconButton {...args} variant="secondary" tone="color" />
          <IconButton {...args} variant="secondary" tone="error" aria-label="Delete">
            <TrashIcon />
          </IconButton>
        </Row>
      </div>
      <div>
        <Label>tertiary — ghost</Label>
        <Row>
          <IconButton {...args} variant="tertiary" />
          <IconButton {...args} variant="tertiary" tone="color" />
          <IconButton {...args} variant="tertiary" tone="error" aria-label="Delete">
            <TrashIcon />
          </IconButton>
        </Row>
      </div>
    </div>
  ),
};

/** `md` and `lg` are the same height as a Button of the same size. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Row>
      <IconButton {...args} size="sm" />
      <IconButton {...args} size="md" />
      <IconButton {...args} size="lg" />
    </Row>
  ),
};

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="gap-semantic-xl flex flex-col">
      <div>
        <Label>default</Label>
        <Row>
          <IconButton {...args} variant="secondary" />
          <IconButton {...args} variant="tertiary" />
        </Row>
      </div>
      <div>
        <Label>disabled</Label>
        <Row>
          <IconButton {...args} variant="secondary" disabled />
          <IconButton {...args} variant="tertiary" disabled />
        </Row>
      </div>
      <div>
        <Label>loading</Label>
        <Row>
          <IconButton {...args} variant="secondary" loading />
          <IconButton {...args} variant="tertiary" loading />
        </Row>
      </div>
    </div>
  ),
};

export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };

/** Renders the caller's element with the control's styling. */
export const AsChild: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <IconButton {...args} asChild aria-label="Settings">
      <a href="#top">
        <CloseIcon />
      </a>
    </IconButton>
  ),
};

/**
 * ### Accessibility
 *
 * - **`aria-label` is required by the type.** There is no visible text, so
 *   without it the control is announced as "button" and nothing else. This is
 *   the one accessibility rule the component can enforce rather than document.
 * - The icon is wrapped in `aria-hidden`, so it never competes with that label.
 * - **Loading** sets `aria-busy` and `aria-disabled`, keeps focus, and appends an
 *   off-screen `loadingLabel`. Since there is no visible label to preserve, the
 *   spinner simply replaces the icon.
 * - **Touch targets.** MB requires ≥44px for medical UI. None of `sm` (34px),
 *   `md` (42px) or `lg` (46px) except `lg` clears it — use `lg` on mobile, or
 *   give the control a larger hit area in its container.
 */
export const Accessibility: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Row>
      <IconButton {...args} aria-label="Close dialog" />
      <IconButton {...args} aria-label="Delete booking" tone="error">
        <TrashIcon />
      </IconButton>
    </Row>
  ),
};
