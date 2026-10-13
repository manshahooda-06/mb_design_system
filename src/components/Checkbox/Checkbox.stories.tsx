import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox, type CheckboxSize } from './Checkbox';

const SIZES: CheckboxSize[] = ['sm', 'md'];

/** Stand-in for Figma's `tick-02` — the icon foundation publishes no set yet. */
const Tick = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M2.5 6.2l2.4 2.4L9.5 3.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Stand-in for Figma's `remove-01`. */
const Dash = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M2.5 6h7" strokeLinecap="round" />
  </svg>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-desktop gap-semantic-3xl flex flex-col">{children}</div>
);
const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-3xl flex flex-wrap items-center">{children}</div>
);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary mb-semantic-sm">{children}</p>
);

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A checkbox. Measured from Figma `Checkbox` (node 1097:63652), which publishes **72 ' +
          'variants** across `Checked` × `Indeterminate` × `Size` × `Type` × `Text` × `State`.\n\n' +
          '**The 40 `Type=Checkbox` variants are implemented here** — 24 without a label ' +
          '(unchecked, checked and indeterminate × 2 sizes × 4 states) and 16 with one. The other ' +
          '32 are `Type=Radio`, a different control with a different interaction model, and are ' +
          'deliberately not reachable through this component.\n\n' +
          'A **native `<input type="checkbox">`**, visually hidden with the painted box beside ' +
          "it. Figma's own wrapper frame is named `Input`, `indeterminate` is a native DOM " +
          'property, and the one measured consumer (InputDropdown multi-select) is a form ' +
          'control — so this carries `name`, `value`, `required` and form association.\n\n' +
          "**Hover does nothing.** Figma's `State=Hover` is pixel-identical to `State=Default` " +
          'in all 18 cells. **Disabled keeps the glyph**, greyed, rather than hiding it. And ' +
          '**radius is not proportional** — 2 against a 16px box, 4 against a 20px box.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: SIZES },
    checked: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    supportingText: { control: 'text' },
    checkIcon: { control: false },
    indeterminateIcon: { control: false },
    classNames: { control: false },
    onCheckedChange: { control: false },
  },
  args: {
    label: 'Remember me',
    supportingText: 'Save my login details for next time.',
    checkIcon: <Tick />,
    indeterminateIcon: <Dash />,
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Figma's three box states, at both sizes. `Text=False`. */
export const BoxStates: Story = {
  parameters: { controls: { disable: true } },
  args: { label: undefined, supportingText: undefined },
  render: (args) => (
    <Grid>
      {SIZES.map((size) => (
        <div key={size}>
          <Caption>
            {size} —{' '}
            {size === 'sm' ? '16px box, radius 2, 12px glyph' : '20px box, radius 4, 14px glyph'}
          </Caption>
          <Row>
            <Checkbox {...args} size={size} aria-label="unchecked" />
            <Checkbox {...args} size={size} checked aria-label="checked" />
            <Checkbox {...args} size={size} indeterminate aria-label="indeterminate" />
          </Row>
        </div>
      ))}
    </Grid>
  ),
};

/**
 * Figma's `State` axis, reproduced as CSS.
 *
 * Hover is absent on purpose: `State=Hover` is pixel-identical to `State=Default`
 * in every one of the 18 cells. Tab through the last row for the focus ring.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  args: { label: undefined, supportingText: undefined },
  render: (args) => (
    <Grid>
      <div>
        <Caption>Default — unchecked, checked, indeterminate</Caption>
        <Row>
          <Checkbox {...args} size="md" aria-label="a" />
          <Checkbox {...args} size="md" checked aria-label="b" />
          <Checkbox {...args} size="md" indeterminate aria-label="c" />
        </Row>
      </div>
      <div>
        <Caption>
          Hover these — nothing changes. Figma draws no hover treatment in any cell, checked or
          unchecked.
        </Caption>
        <Row>
          <Checkbox {...args} size="md" aria-label="d" />
          <Checkbox {...args} size="md" checked aria-label="e" />
        </Row>
      </div>
      <div>
        <Caption>
          Disabled — the surface greys and the glyph greys with it, rather than disappearing
        </Caption>
        <Row>
          <Checkbox {...args} size="md" disabled aria-label="f" />
          <Checkbox {...args} size="md" checked disabled aria-label="g" />
          <Checkbox {...args} size="md" indeterminate disabled aria-label="h" />
        </Row>
      </div>
      <div>
        <Caption>
          Tab through these for the shared focus ring — a 2px gap in the page surface, then 2px of
          focus-ring blue
        </Caption>
        <Row>
          <Checkbox {...args} size="md" aria-label="i" />
          <Checkbox {...args} size="md" checked aria-label="j" />
        </Row>
      </div>
    </Grid>
  ),
};

/** Figma's `Text` axis. The box is centred on the first line, not on the block. */
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
          <div className="gap-semantic-lg flex flex-col">
            <Checkbox {...args} size={size} />
            <Checkbox {...args} size={size} checked supportingText={undefined} />
          </div>
        </div>
      ))}
      <div>
        <Caption>
          The 2px offset centres the box on the <em>first line</em>, so it stays put whether there
          is one line or two
        </Caption>
        <div className="gap-semantic-lg flex flex-col">
          <Checkbox {...args} size="md" checked supportingText={undefined} />
          <Checkbox {...args} size="md" checked />
        </div>
      </div>
    </Grid>
  ),
};

/** All 12 rendered combinations — the published 40 minus the four CSS states. */
export const EveryVariant: Story = {
  parameters: { controls: { disable: true } },
  args: { label: undefined, supportingText: undefined },
  render: (args) => (
    <Grid>
      {SIZES.map((size) => (
        <div key={size}>
          <Caption>{size} — unchecked / checked / indeterminate, then the same disabled</Caption>
          <Row>
            <Checkbox {...args} size={size} aria-label="1" />
            <Checkbox {...args} size={size} checked aria-label="2" />
            <Checkbox {...args} size={size} indeterminate aria-label="3" />
            <Checkbox {...args} size={size} disabled aria-label="4" />
            <Checkbox {...args} size={size} checked disabled aria-label="5" />
            <Checkbox {...args} size={size} indeterminate disabled aria-label="6" />
          </Row>
        </div>
      ))}
    </Grid>
  ),
};

/** Indeterminate driving a parent/child group — the reason the state exists. */
export const Indeterminate: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const Demo = () => {
      const [picked, setPicked] = useState<string[]>(['Email']);
      const all = ['Email', 'SMS', 'Push'];
      const allOn = picked.length === all.length;
      const someOn = picked.length > 0 && !allOn;
      return (
        <Grid>
          <div>
            <Caption>
              The parent is indeterminate while the children disagree. Figma publishes indeterminate
              only without a label, so the labelled form here is ours.
            </Caption>
            <div className="gap-semantic-md flex flex-col">
              <Checkbox
                size="md"
                label="All notifications"
                checked={allOn}
                indeterminate={someOn}
                checkIcon={<Tick />}
                indeterminateIcon={<Dash />}
                onCheckedChange={(next) => setPicked(next ? all : [])}
              />
              <div className="pl-semantic-3xl gap-semantic-md flex flex-col">
                {all.map((name) => (
                  <Checkbox
                    key={name}
                    size="md"
                    label={name}
                    checked={picked.includes(name)}
                    checkIcon={<Tick />}
                    onCheckedChange={(next) =>
                      setPicked((v) => (next ? [...v, name] : v.filter((x) => x !== name)))
                    }
                  />
                ))}
              </div>
            </div>
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
          <Caption>`name` and `value` submit natively — no wiring needed</Caption>
          <Checkbox
            size="md"
            name="terms"
            value="accepted"
            label="I accept the terms"
            supportingText="Required to continue."
            required
            checkIcon={<Tick />}
          />
          <Checkbox
            size="md"
            name="marketing"
            value="yes"
            label="Send me product updates"
            checkIcon={<Tick />}
          />
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
 * - A native `<input type="checkbox">`, visually hidden with `sr-only` — still in the
 *   accessibility tree, still focusable, still form-associated. The painted box is
 *   `aria-hidden`, because the input already carries the state.
 * - `label` becomes the accessible name through `htmlFor`, so **clicking the text
 *   toggles** — native behaviour, not something re-implemented. `supportingText` is
 *   linked with `aria-describedby` and deliberately left outside the `<label>` so it
 *   does not join the name.
 * - `indeterminate` is applied as the DOM property (HTML has no such attribute) and
 *   reports `aria-checked="mixed"`. When not indeterminate, `aria-checked` is omitted
 *   entirely rather than duplicating what the native input already reports.
 * - `Space` toggles; `disabled` removes it from the tab sequence.
 * - **The label is not dimmed when disabled.** Figma leaves both text colours
 *   untouched — verified by sampling rendered pixels — so a disabled Checkbox reads
 *   as enabled text beside a disabled control. Reproduced as drawn and flagged.
 * - Passing `aria-label` alongside `label` overrides the visible label for assistive
 *   technology, which is native behaviour and almost never what you want.
 */
export const Accessibility: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="gap-semantic-lg flex max-w-md flex-col">
      <Checkbox {...args} size="md" />
      <Checkbox {...args} size="md" checked label="Checked" />
      <Checkbox {...args} size="md" indeterminate label="Mixed" />
      <Checkbox {...args} size="md" disabled label="Disabled" />
    </div>
  ),
};
