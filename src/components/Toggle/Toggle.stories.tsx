import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toggle, type ToggleSize, type ToggleVariant } from './Toggle';

const VARIANTS: ToggleVariant[] = ['default', 'slim'];
const SIZES: ToggleSize[] = ['sm', 'md'];

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
  title: 'Components/Toggle',
  component: Toggle,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A switch — an immediate on/off control. Measured from Figma `Toggle` ' +
          '(node 1102:4208) — **all 64 variants**: `Type`(2) × `Pressed`(2) × `Size`(2) × ' +
          '`Text`(2) × `State`(4).\n\n' +
          "Figma's `State` axis is not part of the API: hover and focus are CSS, and " +
          '`Disabled` arrives as `disabled`, so 8 prop combinations × 4 CSS states cover the ' +
          'published 64. `Type` is `variant` and `Pressed` is `checked`.\n\n' +
          '**Two measured behaviours look like bugs and are not.** Hover does nothing when ' +
          "off — Figma's `State=Hover` is byte-identical to `State=Default` for every " +
          '`Pressed=False` variant. And `disabled` ignores `checked` for colour: a disabled ' +
          'toggle paints the off colours whichever way it is set, and only the thumb position ' +
          'still moves.\n\n' +
          'The geometry is systematic rather than eight measured boxes: thumb travel always ' +
          "equals the thumb's own diameter, and the track's content box is always two thumbs " +
          'wide by one thumb tall — so `variant` is padding alone (2 or 0).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: VARIANTS },
    size: { control: 'inline-radio', options: SIZES },
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    supportingText: { control: 'text' },
    classNames: { control: false },
    onCheckedChange: { control: false },
  },
  args: { label: 'Remember me', supportingText: 'Save my login details for next time.' },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The control on its own — Figma's `Text=False`. */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  args: { label: undefined, supportingText: undefined },
  render: (args) => (
    <Grid>
      {VARIANTS.map((variant) => (
        <div key={variant}>
          <Caption>
            {variant} —{' '}
            {variant === 'default'
              ? 'inset thumb, 2px track padding, no strokes: 36×20 and 44×24'
              : 'flush full-height thumb, no padding, 1px strokes: 32×16 and 40×20'}
          </Caption>
          <Row>
            {SIZES.map((size) => (
              <Toggle key={`${size}-off`} {...args} variant={variant} size={size} />
            ))}
            {SIZES.map((size) => (
              <Toggle key={`${size}-on`} {...args} variant={variant} size={size} checked />
            ))}
          </Row>
        </div>
      ))}
    </Grid>
  ),
};

/**
 * Figma's `State` axis, reproduced as CSS.
 *
 * Hover and focus are not props — hover the second row and tab to the third to see
 * them. Only the on state has a hover treatment.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  args: { label: undefined, supportingText: undefined },
  render: (args) => (
    <Grid>
      {VARIANTS.map((variant) => (
        <div key={variant}>
          <Caption>{variant} — off, on, disabled off, disabled on</Caption>
          <Row>
            <Toggle {...args} variant={variant} size="md" />
            <Toggle {...args} variant={variant} size="md" checked />
            <Toggle {...args} variant={variant} size="md" disabled />
            <Toggle {...args} variant={variant} size="md" checked disabled />
          </Row>
        </div>
      ))}
      <div>
        <Caption>
          Hover any of these: only the on state darkens (brand/600 → brand/700). Unpressed hover is
          byte-identical to default in Figma.
        </Caption>
        <Row>
          <Toggle {...args} size="md" />
          <Toggle {...args} size="md" checked />
          <Toggle {...args} variant="slim" size="md" />
          <Toggle {...args} variant="slim" size="md" checked />
        </Row>
      </div>
      <div>
        <Caption>
          Tab through these for the shared focus ring — a 2px gap in the page surface, then 2px of
          focus-ring blue, drawn on the track and following the pill.
        </Caption>
        <Row>
          <Toggle {...args} size="md" />
          <Toggle {...args} size="md" checked />
        </Row>
      </div>
    </Grid>
  ),
};

/**
 * `disabled` collapses the `checked` axis for colour.
 *
 * Both disabled toggles below paint the same track, the same thumb and the same
 * strokes. Only the thumb position tells them apart — measured from Figma, where
 * every `Pressed=True, State=Disabled` variant is byte-identical to its
 * `Pressed=False` counterpart.
 */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      {VARIANTS.map((variant) => (
        <div key={variant}>
          <Caption>{variant} — identical but for the thumb position</Caption>
          <Row>
            <Toggle {...args} variant={variant} size="md" disabled />
            <Toggle {...args} variant={variant} size="md" checked disabled />
          </Row>
        </div>
      ))}
      <div>
        <Caption>
          The label and supporting text are deliberately not dimmed — Figma leaves both colours
          untouched across all four states. Recorded as a Figma inconsistency, reproduced as drawn.
        </Caption>
      </div>
    </Grid>
  ),
};

/** Figma's `Text` axis. The control is top-aligned, not centred. */
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
            <Toggle {...args} size={size} />
            <Toggle {...args} size={size} checked supportingText={undefined} />
          </div>
        </div>
      ))}
      <div>
        <Caption>
          A long label wraps and the control holds its size — the text block is `flex-1
          min-w-semantic-none`, not Figma&apos;s authored 344px.
        </Caption>
        <div className="max-w-mobile">
          <Toggle
            {...args}
            size="md"
            checked
            label="Send me product updates, security notices and occasional research invitations"
          />
        </div>
      </div>
    </Grid>
  ),
};

/** All 16 rendered combinations — the published 64 minus the four CSS states. */
export const EveryVariant: Story = {
  parameters: { controls: { disable: true } },
  args: { label: undefined, supportingText: undefined },
  render: (args) => (
    <Grid>
      {VARIANTS.map((variant) =>
        SIZES.map((size) => (
          <div key={`${variant}-${size}`}>
            <Caption>
              {variant} / {size} — off, on, disabled off, disabled on
            </Caption>
            <Row>
              <Toggle {...args} variant={variant} size={size} />
              <Toggle {...args} variant={variant} size={size} checked />
              <Toggle {...args} variant={variant} size={size} disabled />
              <Toggle {...args} variant={variant} size={size} checked disabled />
            </Row>
          </div>
        )),
      )}
    </Grid>
  ),
};

/** Controlled and uncontrolled. */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const Demo = () => {
      const [marketing, setMarketing] = useState(false);
      const [security, setSecurity] = useState(true);
      return (
        <Grid>
          <div>
            <Caption>Controlled — the parent owns the value</Caption>
            <div className="gap-semantic-lg flex max-w-md flex-col">
              <Toggle
                size="md"
                label="Product updates"
                supportingText="News about features and releases."
                checked={marketing}
                onCheckedChange={setMarketing}
              />
              <Toggle
                size="md"
                variant="slim"
                label="Security alerts"
                supportingText="Always recommended."
                checked={security}
                onCheckedChange={setSecurity}
              />
            </div>
            <p className="text-desktop-caption-sm text-semantic-text-tertiary mt-semantic-lg">
              updates {String(marketing)} · security {String(security)}
            </p>
          </div>
          <div>
            <Caption>Uncontrolled — `defaultChecked`, no state in the consumer</Caption>
            <Row>
              <Toggle size="md" defaultChecked />
              <Toggle size="md" variant="slim" defaultChecked />
            </Row>
          </div>
        </Grid>
      );
    };
    return <Demo />;
  },
};

/**
 * ### Accessibility
 *
 * - A `role="switch"` button with `aria-checked`, **not** an `<input type="checkbox">`.
 *   Nothing in Figma implies form submission — no `name`/`value` semantics in any of
 *   the 64 variants and no form context — so the simpler element wins. Consumers who
 *   need form participation should render a hidden input and drive it from
 *   `onCheckedChange`.
 * - `label` becomes the switch's accessible name via `aria-labelledby`, and
 *   `supportingText` its description via `aria-describedby`. Neither is duplicated
 *   into the control.
 * - The thumb is an unlabelled `<span>` with no role — it is decoration, and the
 *   state is already on the button.
 * - `Space` and `Enter` both toggle, because it is a real button. `disabled` removes
 *   it from the tab sequence.
 * - The focus ring is the library's shared indicator, on `focus-visible` so a mouse
 *   click does not draw it.
 * - **The label is not dimmed when disabled.** Figma leaves both text colours
 *   untouched, so a disabled Toggle reads as enabled text beside a disabled control.
 *   Reproduced as drawn and flagged rather than silently corrected.
 * - The control is **not** wrapped in a `<label>`, so clicking the text does not
 *   toggle. Figma expresses no interaction on the text block, and inventing one
 *   would put the supporting text inside the accessible name.
 */
export const Accessibility: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <div className="gap-semantic-lg flex max-w-md flex-col">
      <Toggle {...args} size="md" />
      <Toggle {...args} size="md" checked label="Enabled and on" />
      <Toggle {...args} size="md" disabled label="Disabled" />
    </div>
  ),
};
