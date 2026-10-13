import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { InputDropdown, type InputDropdownOption } from './InputDropdown';

/** Stand-in for Figma's `arrow-down-01` — the icon foundation publishes no set yet. */
const ChevronIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Stand-in for Figma's `cancel-01`, the Tag close glyph. */
const CloseIcon = () => (
  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round" />
  </svg>
);

/** Stand-in for Figma's `tick-02` inside a multi-select row's Checkbox. */
const CheckIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M3 7.5l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Stand-in for Figma's `tick-02`. */
const TickIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M4.5 10.5l3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PEOPLE: InputDropdownOption[] = [
  { value: 'phoenix', label: 'Phoenix Baker', supportingText: 'phoenix' },
  { value: 'olivia', label: 'Olivia Rhye', supportingText: 'olivia' },
  { value: 'lana', label: 'Lana Steiner', supportingText: 'lana' },
  { value: 'demi', label: 'Demi Wilkinson', supportingText: 'demi' },
  { value: 'natali', label: 'Natali Craig', supportingText: 'natali' },
];

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-desktop gap-semantic-3xl flex flex-col">{children}</div>
);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary mb-semantic-sm">{children}</p>
);

const meta = {
  title: 'Components/InputDropdown',
  component: InputDropdown,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A select field with a dropdown menu, measured from Figma `Input dropdown` ' +
          '(node 5265:8766).\n\n' +
          'This implements **`type=Default`** at both devices across all five states — ' +
          '**10 of 20 variants**. `type=multi select` is deferred: its field renders selected ' +
          'values as Tag instances and its menu rows embed a Checkbox, and neither component ' +
          'exists yet.\n\n' +
          '`device` is Figma’s own axis, not a size scale — desktop and mobile disagree on ' +
          'padding, field height, every gap and the whole type ramp.\n\n' +
          'Two behaviours reproduce Figma rather than improving on it: opening shows the ' +
          '**placeholder** in place of the selected value, and opening **hides the hint**. The ' +
          'menu is a sibling in the layout, as Figma draws it, so opening grows the component ' +
          'rather than floating over the page.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    device: { control: 'inline-radio', options: ['desktop', 'mobile'] },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    label: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    options: { control: false },
    chevron: { control: false },
    tick: { control: false },
    classNames: { control: false },
    value: { control: false },
    open: { control: false },
  },
  args: {
    label: 'Placeholder text',
    placeholder: 'Select Here',
    hint: 'This is a hint text to help user.',
    required: true,
    options: PEOPLE,
    chevron: <ChevronIcon />,
    tick: <TickIcon />,
  },
} satisfies Meta<typeof InputDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Figma's two devices. They share the radius and the shadow and almost nothing
 * else: the field is 56 against 44, padding 16 against 12, and each reads its own
 * type ramp.
 */
export const Devices: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>desktop — 56px field, p-16, 16/24 value, 14/20 hint</Caption>
        <InputDropdown {...args} device="desktop" defaultValue="olivia" />
      </div>
      <div>
        <Caption>mobile — 44px field, p-12, 14/20 value, 12/20 hint</Caption>
        <InputDropdown {...args} device="mobile" defaultValue="olivia" />
      </div>
    </Grid>
  ),
};

/**
 * Every state Figma publishes. There is **no hover state on the field and no error
 * state** — this is the only field component in the set without one.
 *
 * `Focused` and `Open` are measurably identical in the field: 2px `brand/600`, and
 * `elevation-1` byte-identical across all five.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>Placeholder — nothing selected</Caption>
        <InputDropdown {...args} />
      </div>
      <div>
        <Caption>Default — the selected value with its supporting text beside it</Caption>
        <InputDropdown {...args} defaultValue="olivia" />
      </div>
      <div>
        <Caption>Focused — click or tab in: 2px brand border, no ring</Caption>
        <InputDropdown {...args} defaultValue="olivia" />
      </div>
      <div>
        <Caption>Disabled — grey surface, text goes quaternary</Caption>
        <InputDropdown {...args} disabled />
      </div>
      <div>
        <Caption>
          Open — the placeholder replaces the value and the hint disappears, both as Figma draws it
        </Caption>
        <InputDropdown {...args} defaultOpen defaultValue="olivia" />
      </div>
    </Grid>
  ),
};

/**
 * The menu and its four item treatments. Desktop emphasises a highlighted row by
 * changing radius (6 → 12) and weight (400 → 500); mobile holds `radius-md` 8 and
 * Regular throughout. Both reproduce Figma.
 */
export const Menu: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>
          desktop — hover a row to see the highlighted treatment; “Olivia Rhye” is selected and
          “Lana Steiner” disabled
        </Caption>
        <InputDropdown
          {...args}
          defaultOpen
          defaultValue="olivia"
          options={PEOPLE.map((option) =>
            option.value === 'lana' ? { ...option, disabled: true } : option,
          )}
        />
      </div>
      <div>
        <Caption>mobile — 44px rows, radius-md 8 in every state, 16px tick</Caption>
        <InputDropdown
          {...args}
          device="mobile"
          defaultOpen
          defaultValue="olivia"
          options={PEOPLE.map((option) =>
            option.value === 'lana' ? { ...option, disabled: true } : option,
          )}
        />
      </div>
    </Grid>
  ),
};

/** The menu caps its height and scrolls. Desktop caps at 320px, mobile at 256px. */
export const Scrolling: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <InputDropdown
        {...args}
        defaultOpen
        options={Array.from({ length: 12 }, (_, i) => ({
          value: `option-${i}`,
          label: `Option ${i + 1}`,
        }))}
      />
    </Grid>
  ),
};

/**
 * ### Accessibility
 *
 * None of this is drawn in Figma — the file has no focus-within-menu representation
 * at all — so the whole pattern is an implementation decision.
 *
 * - The trigger is a `role="combobox"` with `aria-expanded`, `aria-haspopup`,
 *   `aria-controls` and `aria-activedescendant`; the menu is a `role="listbox"` of
 *   `role="option"` rows carrying `aria-selected`.
 * - Focus stays on the trigger while the menu is open and the active row is
 *   reported through `aria-activedescendant`, so the reading order never jumps.
 * - `ArrowDown`/`ArrowUp` open and move, `Home`/`End` jump, `Enter` and `Space`
 *   select, `Escape` closes and returns focus, `Tab` closes and moves on.
 * - Typing runs a typeahead over the option labels; the buffer resets after 500ms.
 * - Disabled options are skipped by every keyboard path and cannot be hovered.
 * - The label is wired with `aria-labelledby` and the hint with `aria-describedby`.
 *   `required` sets `aria-required` and renders `*` as `aria-hidden`.
 * - The chevron and tick are `aria-hidden`: both duplicate information already
 *   carried by `aria-expanded` and `aria-selected`.
 */
export const Accessibility: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <InputDropdown {...args} defaultValue="olivia" />
      <InputDropdown
        {...args}
        options={PEOPLE.map((option) =>
          option.value === 'lana' ? { ...option, disabled: true } : option,
        )}
      />
    </Grid>
  ),
};

/* -------------------------------------------------------------------------- */
/* type="multiSelect" — Figma's other 10 variants                             */
/* -------------------------------------------------------------------------- */

const multiArgs = {
  type: 'multiSelect',
  chevron: <ChevronIcon />,
  tagCloseIcon: <CloseIcon />,
  checkIcon: <CheckIcon />,
} as const;

/**
 * Multi select at both devices.
 *
 * The field holds a Tag per selection — `lg` on desktop, `md` on mobile — and each
 * menu row leads with a Checkbox (`md` / `sm`) instead of a trailing tick.
 */
export const MultiSelect: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>desktop — Tag `lg`, field 56 tall, Tag row gap 12</Caption>
        <InputDropdown
          {...args}
          {...multiArgs}
          device="desktop"
          defaultValues={['olivia', 'lana']}
        />
      </div>
      <div>
        <Caption>mobile — Tag `md`, field 44 tall, Tag row gap 8</Caption>
        <InputDropdown
          {...args}
          {...multiArgs}
          device="mobile"
          defaultValues={['olivia', 'lana']}
        />
      </div>
      <div>
        <Caption>Nothing selected — the placeholder shows, and the field keeps its height</Caption>
        <InputDropdown {...args} {...multiArgs} />
      </div>
    </Grid>
  ),
};

/**
 * The Tags stay in every state.
 *
 * Figma replaces them with the placeholder in Open and Disabled; that is recorded as
 * an inconsistency. The selected values are the field's primary content, and hiding
 * them when the menu opens would take the user's work off screen. Keeping them also
 * makes the field height uniform — 56 desktop, 44 mobile — which the published file
 * is not.
 */
export const MultiSelectStates: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>Default</Caption>
        <InputDropdown {...args} {...multiArgs} defaultValues={['olivia']} />
      </div>
      <div>
        <Caption>Open — Tags stay, and the menu shows what is ticked</Caption>
        <InputDropdown {...args} {...multiArgs} defaultValues={['olivia']} defaultOpen />
      </div>
      <div>
        <Caption>Disabled — Tags stay, and their close buttons go with the field</Caption>
        <InputDropdown {...args} {...multiArgs} defaultValues={['olivia', 'lana']} disabled />
      </div>
    </Grid>
  ),
};

/** Removing a Tag and ticking a row are the same commit against one list. */
export const MultiSelectInteractive: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => {
    const Demo = () => {
      const [picked, setPicked] = useState<string[]>(['olivia']);
      return (
        <Grid>
          <div>
            <Caption>
              Tick rows, or remove a Tag — both drive one `selectedValues`, so the row and the Tag
              can never disagree. The menu stays open on pick.
            </Caption>
            <InputDropdown
              {...args}
              {...multiArgs}
              values={picked}
              onValuesChange={setPicked}
              defaultOpen
            />
          </div>
          <p className="text-desktop-caption-sm text-semantic-text-tertiary">
            selected: {picked.length > 0 ? picked.join(', ') : '(none)'}
          </p>
        </Grid>
      );
    };
    return <Demo />;
  },
};
