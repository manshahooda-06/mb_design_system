import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { Input } from './Input';

/** Stand-in glyphs — the icon foundation has no published set yet. */
const MailIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <rect x="2" y="4" width="16" height="12" rx="2" />
    <path d="m2 6 8 5 8-5" strokeLinecap="round" />
  </svg>
);
const HelpIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <circle cx="8" cy="8" r="6" />
    <path d="M6.5 6a1.5 1.5 0 1 1 1.9 1.45c-.5.15-.9.6-.9 1.12V9" strokeLinecap="round" />
    <circle cx="8" cy="11.2" r=".6" fill="currentColor" stroke="none" />
  </svg>
);
const CopyIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 3.5H4A1.5 1.5 0 0 0 2.5 5v6.5" strokeLinecap="round" />
  </svg>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-desktop gap-semantic-3xl flex flex-col">{children}</div>
);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary">{children}</p>
);

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A single-line text field, measured from Figma `input-textfield` (node 4044:8871).\n\n' +
          'The `Type` axis is **derived from the slots supplied** rather than an enum — pass ' +
          '`leadingIcon`, `leadingText` or `trailingSlot` and the matching Figma type applies.\n\n' +
          '`Placeholder`, `Filled` and `Focused` are runtime states, never props. The placeholder ' +
          'is deliberately one step smaller and lighter than the value, as Figma specifies.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    leadingIcon: { control: false },
    leadingText: { control: false },
    trailingSlot: { control: false },
    helpIcon: { control: false },
    classNames: { control: false },
  },
  args: {
    label: 'Email',
    placeholder: 'olivia@untitledui.com',
    hint: 'This is a hint text to help user.',
    required: true,
    helpIcon: <HelpIcon />,
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The four types implemented in this pass. Five more are deferred. */
export const Types: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>Default</Caption>
        <Input {...args} />
      </div>
      <div>
        <Caption>Icon leading — 20px, does not scale with size</Caption>
        <Input {...args} leadingIcon={<MailIcon />} />
      </div>
      <div>
        <Caption>Leading text — prefix one step larger than the placeholder</Caption>
        <Input {...args} label="Website" leadingText="http://" placeholder="www.untitledui.com" />
      </div>
      <div>
        <Caption>Trailing button — no right padding, control butts the edge</Caption>
        <Input
          {...args}
          label="Share link"
          helpIcon={undefined}
          placeholder="www.untitledui.com"
          trailingSlot={
            <Button variant="secondary" startSlot={<CopyIcon />} className="h-full rounded-l-none">
              Copy
            </Button>
          }
        />
      </div>
    </Grid>
  ),
};

/** `sm` and `md` differ in height, padding, radius and type ramp — not state logic. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>sm — 44px, 14/10 padding, radius-md</Caption>
        <Input {...args} size="sm" />
      </div>
      <div>
        <Caption>md — 56px, 12/16 padding, radius-xl</Caption>
        <Input {...args} size="md" />
      </div>
    </Grid>
  ),
};

/** Every state Figma defines. There is no hover state. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>Placeholder</Caption>
        <Input {...args} />
      </div>
      <div>
        <Caption>Filled — value is larger and darker than the placeholder</Caption>
        <Input {...args} defaultValue="olivia@untitledui.com" />
      </div>
      <div>
        <Caption>Disabled — surface greys, value goes tertiary</Caption>
        <Input {...args} disabled defaultValue="olivia@untitledui.com" />
      </div>
      <div>
        <Caption>Destructive — error stroke and error hint</Caption>
        <Input {...args} invalid hint="Enter a valid email address." />
      </div>
    </Grid>
  ),
};

/**
 * ### Accessibility
 *
 * - The label is a real `<label htmlFor>`; clicking it focuses the field. An id is
 *   generated with `useId` when none is supplied.
 * - `hint` is wired through `aria-describedby`, so it is announced with the field.
 * - `required` sets `aria-required` and renders the `*` as `aria-hidden`, so the
 *   marker never leaks into the accessible name.
 * - `invalid` sets `aria-invalid`; the error is conveyed by the hint text, not by
 *   colour alone.
 * - Focus is the 2px border — Figma defines no focus ring for Input. Icons are
 *   `aria-hidden`, since they duplicate the label.
 */
export const Accessibility: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <Input {...args} />
      <Input {...args} invalid hint="Enter a valid email address." />
    </Grid>
  ),
};
