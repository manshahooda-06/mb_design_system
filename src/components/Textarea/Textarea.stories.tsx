import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';

/** Stand-in glyph — the icon foundation has no published set yet. */
const HelpIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <circle cx="8" cy="8" r="6" />
    <path d="M6.5 6a1.5 1.5 0 1 1 1.9 1.45c-.5.15-.9.6-.9 1.12V9" strokeLinecap="round" />
    <circle cx="8" cy="11.2" r=".6" fill="currentColor" stroke="none" />
  </svg>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-desktop gap-semantic-3xl flex flex-col">{children}</div>
);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary">{children}</p>
);

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A multiline text field, measured from Figma `input-textarea` (node 4044:25559).\n\n' +
          'The control height is **fixed** — 120px at `sm`, 132px at `md` — with the textarea ' +
          'filling it and scrolling internally. Figma shows no resize handle, so there is none.\n\n' +
          'Despite the family resemblance it shares little styling with Input: `md` uses ' +
          '`radius-md` not `radius-xl`, the content ' +
          'is top-aligned, and the help icon leads the hint row instead of sitting inside the ' +
          'control.\n\n' +
          '`Type=Tags` is unbuilt but no longer blocked — Tag now exists.',
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
    hintIcon: { control: false },
    classNames: { control: false },
  },
  args: {
    label: 'Description',
    placeholder: 'Enter a description...',
    hint: 'This is a hint text to help user.',
    required: true,
    hintIcon: <HelpIcon />,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Both sizes. They differ in control height, hint icon size and type ramp. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>sm — 120px control, 16px hint icon, 12/20 placeholder</Caption>
        <Textarea {...args} size="sm" />
      </div>
      <div>
        <Caption>md — 132px control, 20px hint icon, 14/20 placeholder</Caption>
        <Textarea {...args} size="md" />
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
        <Textarea {...args} />
      </div>
      <div>
        <Caption>Default — entered text is larger and darker than the placeholder</Caption>
        <Textarea
          {...args}
          defaultValue="A little about the company and the team that you’ll be working with."
        />
      </div>
      <div>
        <Caption>Disabled — surface greys, value goes tertiary</Caption>
        <Textarea
          {...args}
          disabled
          defaultValue="A little about the company and the team that you’ll be working with."
        />
      </div>
      <div>
        <Caption>Destructive — error stroke and error hint</Caption>
        <Textarea {...args} invalid hint="This is an error message." />
      </div>
    </Grid>
  ),
};

/** The control clips; the textarea inside it scrolls. No resize handle. */
export const Overflow: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <Textarea
        {...args}
        hint="The control height is fixed, so long content scrolls inside it."
        defaultValue={Array.from(
          { length: 12 },
          (_, i) => `Line ${i + 1} of a long description.`,
        ).join('\n')}
      />
    </Grid>
  ),
};

/**
 * ### Accessibility
 *
 * - Real `<label htmlFor>`; clicking it focuses the field. Id generated with
 *   `useId` when none is supplied.
 * - `hint` is wired through `aria-describedby`; `required` sets `aria-required`
 *   and renders `*` as `aria-hidden` so the marker never joins the accessible name.
 * - `invalid` sets `aria-invalid`; the error is carried by the hint text, not by
 *   colour alone.
 * - Focus is the 2px border — Figma defines no focus ring. The hint icon is
 *   `aria-hidden`, since it duplicates the hint text.
 * - `resize-none` matches Figma. If a consumer needs resizing, that is a
 *   deliberate override rather than a default.
 */
export const Accessibility: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <Textarea {...args} />
      <Textarea {...args} invalid hint="This is an error message." />
    </Grid>
  ),
};
