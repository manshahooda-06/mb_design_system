import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';
import type { RadioSize } from './radio-context';

const SIZES: RadioSize[] = ['sm', 'md'];

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-desktop gap-semantic-3xl flex flex-col">{children}</div>
);
const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-3xl flex flex-wrap items-center">{children}</div>
);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary mb-semantic-sm">{children}</p>
);
/** RadioGroup imposes no layout, so every example brings its own. */
const Stack = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-lg flex flex-col">{children}</div>
);

const meta = {
  title: 'Components/Radio',
  component: Radio,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A radio. Measured from Figma `Checkbox` (node 1097:63652), `Type=Radio` only — all ' +
          '**32 published variants**: `Checked`(2) × `Size`(2) × `Text`(2) × `State`(4).\n\n' +
          'A **native `<input type="radio">`**, visually hidden with the painted circle beside ' +
          'it. Radios sharing a `name` get mutual exclusion, a single tab stop for the group and ' +
          'arrow-key selection with wrap-around, all from the browser — a `role="radio"` button ' +
          'would mean reimplementing every bit of that.\n\n' +
          'Usable standalone with an explicit `name`, or inside a **`RadioGroup`** which supplies ' +
          'the `name`, the shared value and `role="radiogroup"`. `RadioGroup` is a **semantic ' +
          'container only and imposes no layout** — Figma publishes no group, so a default gap ' +
          'would be an invented measurement. Every example below brings its own stack.\n\n' +
          "**Hover does nothing.** Figma's `State=Hover` is pixel-identical to `State=Default` in " +
          'all 8 cells. **Disabled keeps the dot**, greyed, and brings back the 1px stroke that ' +
          'the selected state drops. And **a selected radio cannot be unselected** by clicking it.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: SIZES },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    supportingText: { control: 'text' },
    classNames: { control: false },
    onCheckedChange: { control: false },
  },
  args: {
    label: 'Pro',
    supportingText: 'Everything in Free, plus more.',
    name: 'playground',
    value: 'pro',
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Figma's two box states, at both sizes. `Text=False`. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  args: { label: undefined, supportingText: undefined },
  render: (args) => (
    <Grid>
      {SIZES.map((size) => (
        <div key={size}>
          <Caption>
            {size} — {size === 'sm' ? '16px circle, 6px dot' : '20px circle, 8px dot'}; both fully
            rounded, unlike Checkbox whose radius moves with size
          </Caption>
          <Row>
            <Radio {...args} size={size} name={`s-${size}`} value="a" aria-label="unselected" />
            <Radio
              {...args}
              size={size}
              name={`s-${size}-b`}
              value="b"
              defaultChecked
              aria-label="selected"
            />
            <Radio
              {...args}
              size={size}
              name={`s-${size}-c`}
              value="c"
              disabled
              aria-label="disabled"
            />
            <Radio
              {...args}
              size={size}
              name={`s-${size}-d`}
              value="d"
              defaultChecked
              disabled
              aria-label="selected disabled"
            />
          </Row>
        </div>
      ))}
      <div>
        <Caption>
          Hover these — nothing changes. Figma draws no hover treatment in any of the 8 cells.
        </Caption>
        <Row>
          <Radio {...args} size="md" name="h-a" value="a" aria-label="a" />
          <Radio {...args} size="md" name="h-b" value="b" defaultChecked aria-label="b" />
        </Row>
      </div>
      <div>
        <Caption>
          Tab to these for the shared focus ring — a 2px gap in the page surface, then 2px of
          focus-ring blue
        </Caption>
        <Row>
          <Radio {...args} size="md" name="f-a" value="a" aria-label="c" />
          <Radio {...args} size="md" name="f-b" value="b" defaultChecked aria-label="d" />
        </Row>
      </div>
    </Grid>
  ),
};

/** Figma's `Text` axis. The circle is centred on the first line, not on the block. */
export const WithText: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      {SIZES.map((size) => (
        <div key={size}>
          <Caption>
            {size} — row gap {size === 'sm' ? 8 : 12}, label gap {size === 'sm' ? 0 : 2},{' '}
            {size === 'sm' ? '14/20 Mobile' : '16/24 Desktop'} type
          </Caption>
          <Stack>
            <Radio {...args} size={size} name={`t-${size}`} value="a" />
            <Radio
              {...args}
              size={size}
              name={`t-${size}-b`}
              value="b"
              defaultChecked
              supportingText={undefined}
              label="Label only"
            />
          </Stack>
        </div>
      ))}
      <div>
        <Caption>
          The 2px offset centres the circle on the <em>first line</em>, so it stays put whether
          there is one line or two
        </Caption>
        <Stack>
          <Radio
            {...args}
            size="md"
            name="o-a"
            value="a"
            defaultChecked
            supportingText={undefined}
          />
          <Radio {...args} size="md" name="o-b" value="b" defaultChecked />
        </Stack>
      </div>
    </Grid>
  ),
};

/** All 8 rendered combinations — the published 32 minus the four CSS states. */
export const EveryVariant: Story = {
  parameters: { controls: { disable: true } },
  args: { label: undefined, supportingText: undefined },
  render: (args) => (
    <Grid>
      {SIZES.map((size) => (
        <div key={size}>
          <Caption>{size} — unselected / selected, then the same disabled</Caption>
          <Row>
            <Radio {...args} size={size} name={`e-${size}-1`} value="v" aria-label="1" />
            <Radio
              {...args}
              size={size}
              name={`e-${size}-2`}
              value="v"
              defaultChecked
              aria-label="2"
            />
            <Radio {...args} size={size} name={`e-${size}-3`} value="v" disabled aria-label="3" />
            <Radio
              {...args}
              size={size}
              name={`e-${size}-4`}
              value="v"
              defaultChecked
              disabled
              aria-label="4"
            />
          </Row>
        </div>
      ))}
    </Grid>
  ),
};

/**
 * `RadioGroup` supplies the `name`, the shared value and `role="radiogroup"`.
 *
 * **Arrow keys work here and are entirely native** — tab into the group, then press
 * Up/Down or Left/Right to move selection, wrapping at both ends. Nothing in this
 * component implements that.
 */
export const Group: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const Demo = () => {
      const [plan, setPlan] = useState('pro');
      return (
        <Grid>
          <div>
            <Caption>
              Controlled. Tab in, then use the arrow keys — native group navigation, no JS.
            </Caption>
            <RadioGroup label="Plan" value={plan} onValueChange={setPlan} size="md">
              <Stack>
                <Radio value="free" label="Free" supportingText="For trying things out." />
                <Radio value="pro" label="Pro" supportingText="Everything in Free, plus more." />
                <Radio value="team" label="Team" supportingText="Pro, for everyone." />
              </Stack>
            </RadioGroup>
            <p className="text-desktop-caption-sm text-semantic-text-tertiary mt-semantic-lg">
              selected: {plan}
            </p>
          </div>
          <div>
            <Caption>
              Uncontrolled with `defaultValue`, and a generated `name` — two groups on one page
              cannot interfere
            </Caption>
            <RadioGroup label="Billing" defaultValue="yearly">
              <Stack>
                <Radio value="monthly" label="Monthly" />
                <Radio value="yearly" label="Yearly" supportingText="Two months free." />
              </Stack>
            </RadioGroup>
          </div>
          <div>
            <Caption>A disabled group — one member opts back in with `disabled={false}`</Caption>
            <RadioGroup label="Region" defaultValue="eu" disabled>
              <Stack>
                <Radio value="eu" label="EU" />
                <Radio value="us" label="US" />
                <Radio value="in" label="India" disabled={false} />
              </Stack>
            </RadioGroup>
          </div>
        </Grid>
      );
    };
    return <Demo />;
  },
};

/** It is a real form field — this is what the native element buys. */
export const InAForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const Demo = () => {
      const [submitted, setSubmitted] = useState<string | null>(null);
      return (
        <form
          className="gap-semantic-lg flex max-w-md flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            setSubmitted([...data.entries()].map(([k, v]) => `${k}=${v}`).join(', ') || '(none)');
          }}
        >
          <Caption>`name` and `value` submit natively; `required` validates the group</Caption>
          <RadioGroup label="Plan" name="plan" required size="md">
            <Stack>
              <Radio value="free" label="Free" />
              <Radio value="pro" label="Pro" />
            </Stack>
          </RadioGroup>
          <button
            type="submit"
            className="bg-semantic-bg-brand-solid text-semantic-text-primary-on-brand px-semantic-lg py-semantic-xs self-start rounded-md"
          >
            Submit
          </button>
          {submitted !== null && (
            <p className="text-desktop-caption-sm text-semantic-text-tertiary">
              submitted: {submitted}
            </p>
          )}
        </form>
      );
    };
    return <Demo />;
  },
};

/**
 * ### Accessibility
 *
 * - A native `<input type="radio">`, visually hidden with `sr-only` — still in the
 *   accessibility tree, still focusable, still form-associated. The painted circle is
 *   `aria-hidden`, because the input already carries the state.
 * - **No `aria-checked`.** A native radio already reports its own selection; adding
 *   the attribute would risk it disagreeing with the DOM.
 * - `label` becomes the accessible name through `htmlFor`, so **clicking the text
 *   selects** — native, not reimplemented. `supportingText` is linked with
 *   `aria-describedby` and left outside the `<label>` so it does not join the name.
 * - **Keyboard is entirely native**: one tab stop per group, entering at the selected
 *   radio (or the first when none is selected), then arrow keys move selection with
 *   wrap-around. `disabled` removes a radio from the sequence, and a fully disabled
 *   group is skipped.
 * - `RadioGroup` adds `role="radiogroup"` and an accessible name so the set is
 *   announced as a group. The name comes from `label` (applied as `aria-label`, **not
 *   rendered**) or from your own heading via `aria-labelledby`.
 * - **The label is not dimmed when disabled.** Figma leaves both text colours
 *   untouched — verified by sampling rendered pixels — so a disabled Radio reads as
 *   enabled text beside a disabled control. Reproduced as drawn and flagged.
 * - `required` is passed through with **no visual treatment**: Figma publishes no
 *   required or error state for Radio, so any indicator would be invented.
 */
export const Accessibility: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <RadioGroup label="Notification frequency" defaultValue="daily" size="md">
      <Stack>
        <Radio value="all" label="Everything" supportingText="Every event, as it happens." />
        <Radio value="daily" label="Daily digest" supportingText="One summary each morning." />
        <Radio value="none" label="Nothing" />
        <Radio value="legacy" label="Disabled option" disabled />
      </Stack>
    </RadioGroup>
  ),
};
