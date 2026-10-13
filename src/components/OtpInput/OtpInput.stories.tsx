import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { OtpInput } from './OtpInput';

/**
 * Figma's hint glyph is a bare outlined circle with no mark inside — reproduced
 * as drawn rather than upgraded to a help or warning icon, since the icon
 * foundation publishes no set yet.
 */
const CircleIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <circle cx="8" cy="8" r="6.25" />
  </svg>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-desktop gap-semantic-3xl flex flex-col">{children}</div>
);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary mb-semantic-sm">{children}</p>
);

const meta = {
  title: 'Components/OtpInput',
  component: OtpInput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A one-time-code field, measured from Figma `input-OTP` (node 4092:1958) — all 15 ' +
          'variants, three lengths across five states.\n\n' +
          "Figma's `Placeholder`, `Filled` and `Focused` are not field-level styles but " +
          '**compositions of per-cell state**: `Focused` paints cells `0…n-3` as filled, cell ' +
          '`n-2` as focused, and leaves the last cell empty, at every length. So they are ' +
          'runtime states here and never props. Only `Disabled` and `Error` reach the whole ' +
          'field.\n\n' +
          'Built from one native `<input>` per cell, which is what makes `:focus` the state ' +
          'rather than something derived — no caret to fake, no active index to track.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    length: { control: 'inline-radio', options: [4, 5, 6] },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    hint: { control: 'text' },
    hintIcon: { control: false },
    classNames: { control: false },
    value: { control: false },
    onValueChange: { control: false },
    onComplete: { control: false },
  },
  args: {
    label: 'Label',
    hint: 'This is a hint text to help user.',
    hintIcon: <CircleIcon />,
  },
} satisfies Meta<typeof OtpInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Figma's three lengths. Cells stay 48×48 with an 8px gap, so the field widens by 56px a digit. */
export const Lengths: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      {([4, 5, 6] as const).map((length) => (
        <div key={length}>
          <Caption>
            {length} digits — {length * 48 + (length - 1) * 8}px wide
          </Caption>
          <OtpInput {...args} length={length} />
        </div>
      ))}
    </Grid>
  ),
};

/**
 * Every state Figma defines. There is no hover state and no success state.
 *
 * `Focused` is reproduced by clicking or tabbing into a cell — the ring belongs to
 * whichever cell has focus, so it cannot be shown statically.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>Placeholder — every cell empty, grey stroke</Caption>
        <OtpInput {...args} />
      </div>
      <div>
        <Caption>Filled — brand stroke, and it survives blur</Caption>
        <OtpInput {...args} defaultValue="0000" />
      </div>
      <div>
        <Caption>
          Focused — click a cell: 2px brand stroke plus the ring. Filled cells keep their stroke.
        </Caption>
        <OtpInput {...args} defaultValue="00" />
      </div>
      <div>
        <Caption>Disabled — grey surface, digits go quaternary</Caption>
        <OtpInput {...args} disabled defaultValue="0000" />
      </div>
      <div>
        <Caption>Error — error stroke on every cell, and the hint recolours with its icon</Caption>
        <OtpInput {...args} invalid defaultValue="0000" hint="That code is incorrect." />
      </div>
    </Grid>
  ),
};

/**
 * Behaviour Figma does not draw, which is most of it: typing advances, Backspace
 * steps back, arrows navigate, and a paste fills from the cell you paste into.
 */
export const Behaviour: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const Demo = () => {
      const [code, setCode] = useState('');
      const [completed, setCompleted] = useState<string | null>(null);
      return (
        <Grid>
          <div>
            <Caption>
              Controlled. Try typing, Backspace, ← →, and pasting “123456” into any cell.
            </Caption>
            <OtpInput
              {...args}
              length={6}
              value={code}
              onValueChange={(next) => {
                setCode(next);
                setCompleted(null);
              }}
              onComplete={setCompleted}
            />
          </div>
          <p className="text-desktop-body-sm text-semantic-text-secondary">
            value: <code>{code === '' ? '(empty)' : code}</code>
            {completed !== null && ` — onComplete fired with ${completed}`}
          </p>
        </Grid>
      );
    };
    return <Demo />;
  },
};

/** Without a label or hint the field is the cell row alone. Both slots are optional in Figma. */
export const Minimal: Story = {
  parameters: { controls: { disable: true } },
  args: { label: undefined, hint: undefined, hintIcon: undefined },
};

/**
 * ### Accessibility
 *
 * - The cell row is a `role="group"` named by the label and described by the hint,
 *   so assistive technology announces one field rather than four unrelated boxes.
 * - The `<label>` points at the first cell, so clicking it starts entry there. Its
 *   id comes from `useId` when none is supplied.
 * - Each cell carries `aria-label="Digit N of M"`, so its position is announced
 *   inside the group's name — positional context that a shared label cannot give.
 * - `invalid` sets `aria-invalid` on every cell; the reason is carried by the hint
 *   text, not by colour alone.
 * - Focus order is DOM order, and arrow keys move within the group without
 *   leaving it. `Home`/`End` jump to the first and last cell.
 * - `autoComplete="one-time-code"` and `inputMode="numeric"` bring up the numeric
 *   keypad and offer the SMS code on iOS and Android.
 */
export const Accessibility: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <OtpInput {...args} length={6} />
      <OtpInput {...args} length={6} invalid defaultValue="000000" hint="That code is incorrect." />
    </Grid>
  ),
};
