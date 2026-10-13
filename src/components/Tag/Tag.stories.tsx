import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag, type TagSize } from './Tag';

/** Stand-in for Figma's `cancel-01` — the icon foundation publishes no set yet. */
const CloseIcon = () => (
  <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M2 2l6 6M8 2l-6 6" strokeLinecap="round" />
  </svg>
);

/** Stand-in for Figma's `tick-02`. */
const TickIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M3 7.5l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Stand-in for the `AU` flag instance Figma swaps in through `flagSwap`. */
const Flag = () => (
  <svg viewBox="0 0 16 16" aria-hidden>
    <rect width="16" height="16" fill="#00247d" />
    <circle cx="11" cy="5" r="1.4" fill="#fff" />
    <circle cx="6" cy="11" r="1.1" fill="#fff" />
  </svg>
);

/** Stand-in for the `_Avatar` instance. */
const Avatar = () => (
  <svg viewBox="0 0 16 16" aria-hidden>
    <rect width="16" height="16" fill="#dbe0e6" />
    <circle cx="8" cy="6" r="3" fill="#8a99ad" />
    <path d="M2 16c0-3.3 2.7-6 6-6s6 2.7 6 6z" fill="#8a99ad" />
  </svg>
);

const SIZES: TagSize[] = ['sm', 'md', 'lg'];

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-lg flex flex-wrap items-center">{children}</div>
);
const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-desktop gap-semantic-3xl flex flex-col">{children}</div>
);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary mb-semantic-sm">{children}</p>
);

const meta = {
  title: 'Components/Tag',
  component: Tag,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A compact label, optionally removable, countable or selectable. Measured from Figma ' +
          '`Tag` (node 3307:417515) — **all 72 variants**: `Size`(3) × `Icon`(4) × `Action`(3) × ' +
          '`Checkbox`(2).\n\n' +
          '**Tag has no state axis.** Figma publishes no hover, focus, pressed, disabled, ' +
          'selected or error state, and no filled or tonal type — every one of the 72 is white ' +
          'with a 1px grey stroke. `disabled` and `selected` reach only the nested checkbox and ' +
          'the close button.\n\n' +
          'The size scale is **not monotonic**: heights are 26 / 24 / 28, so `md` is the ' +
          'shortest tag. Padding decomposes to two rules — the left inset tracks size × leading ' +
          'element, the right inset tracks size × action.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: SIZES },
    iconVariant: { control: 'inline-radio', options: [undefined, 'dot', 'flag', 'avatar'] },
    selectable: { control: 'boolean' },
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    count: { control: 'text' },
    icon: { control: false },
    closeIcon: { control: false },
    tickIcon: { control: false },
    classNames: { control: false },
    onRemove: { control: false },
  },
  args: { label: 'Label' },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Figma's three sizes. Note `md` is shorter than `sm` — 26 / 24 / 28. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      {SIZES.map((size) => (
        <div key={size}>
          <Caption>
            {size} — {size === 'sm' ? 26 : size === 'md' ? 24 : 28}px tall
          </Caption>
          <Row>
            <Tag {...args} size={size} />
            <Tag {...args} size={size} iconVariant="dot" />
            <Tag {...args} size={size} iconVariant="flag" icon={<Flag />} />
            <Tag {...args} size={size} iconVariant="avatar" icon={<Avatar />} />
          </Row>
        </div>
      ))}
    </Grid>
  ),
};

/** Figma's `Action` axis. `Count` and `X close` are mutually exclusive. */
export const Actions: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>Text only</Caption>
        <Row>
          {SIZES.map((size) => (
            <Tag key={size} {...args} size={size} />
          ))}
        </Row>
      </div>
      <div>
        <Caption>
          X close — a real button with the shared focus ring, which Figma does not draw
        </Caption>
        <Row>
          {SIZES.map((size) => (
            <Tag key={size} {...args} size={size} onRemove={() => {}} closeIcon={<CloseIcon />} />
          ))}
        </Row>
      </div>
      <div>
        <Caption>Count</Caption>
        <Row>
          {SIZES.map((size) => (
            <Tag key={size} {...args} size={size} count={5} />
          ))}
        </Row>
      </div>
    </Grid>
  ),
};

/**
 * Figma's `Checkbox` axis.
 *
 * All 36 `Checkbox=True` Tag variants draw an **unchecked, default** box. The
 * checked, hover, focused and disabled treatments come from `_Tag checkbox`
 * (24 variants), which Tag never instantiates — so everything but the first column
 * is reachable through this API and through no Figma Tag variant.
 */
export const Selectable: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>Unchecked — the only checkbox state any Tag variant draws</Caption>
        <Row>
          {SIZES.map((size) => (
            <Tag key={size} {...args} size={size} selectable />
          ))}
        </Row>
      </div>
      <div>
        <Caption>Checked — brand-600 fill, white tick. Hover moves to brand-700</Caption>
        <Row>
          {SIZES.map((size) => (
            <Tag key={size} {...args} size={size} selectable selected tickIcon={<TickIcon />} />
          ))}
        </Row>
      </div>
      <div>
        <Caption>Disabled — grey surface, resting stroke, tick greys out</Caption>
        <Row>
          {SIZES.map((size) => (
            <Tag
              key={size}
              {...args}
              size={size}
              selectable
              selected
              disabled
              tickIcon={<TickIcon />}
            />
          ))}
        </Row>
      </div>
    </Grid>
  ),
};

/**
 * The left inset shrinks as the leading element grows, so the optical gap stays
 * even. It never depends on the action; the right inset never depends on the icon.
 */
export const Padding: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      {SIZES.map((size) => (
        <div key={size}>
          <Caption>
            {size} — left inset{' '}
            {size === 'sm' ? '8 / 6 / 4 / 5' : size === 'md' ? '9 / 7 / 5 / 4' : '10 / 9 / 7 / 5'}{' '}
            for none / dot / media / checkbox
          </Caption>
          <Row>
            <Tag {...args} size={size} label="none" />
            <Tag {...args} size={size} label="dot" iconVariant="dot" />
            <Tag {...args} size={size} label="media" iconVariant="avatar" icon={<Avatar />} />
            <Tag {...args} size={size} label="checkbox" selectable />
          </Row>
        </div>
      ))}
    </Grid>
  ),
};

/** The three combinations other components actually instance. */
export const AsConsumedElsewhere: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>Input `Tags` — md / avatar / X close</Caption>
        <Row>
          <Tag
            {...args}
            label="Olivia"
            size="md"
            iconVariant="avatar"
            icon={<Avatar />}
            onRemove={() => {}}
            closeIcon={<CloseIcon />}
          />
          <Tag
            {...args}
            label="Phoenix"
            size="md"
            iconVariant="avatar"
            icon={<Avatar />}
            onRemove={() => {}}
            closeIcon={<CloseIcon />}
          />
        </Row>
      </div>
      <div>
        <Caption>Textarea `Tags` — md / no icon / X close</Caption>
        <Row>
          <Tag {...args} label="Design" size="md" onRemove={() => {}} closeIcon={<CloseIcon />} />
          <Tag {...args} label="Software" size="md" onRemove={() => {}} closeIcon={<CloseIcon />} />
        </Row>
      </div>
      <div>
        <Caption>InputDropdown multi-select — lg / no icon / X close</Caption>
        <Row>
          <Tag {...args} label="Olivia" size="lg" onRemove={() => {}} closeIcon={<CloseIcon />} />
          <Tag {...args} label="Phoenix" size="lg" onRemove={() => {}} closeIcon={<CloseIcon />} />
        </Row>
      </div>
    </Grid>
  ),
};

/** A removable, selectable set — the behaviour Figma does not draw. */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const Demo = () => {
      const [tags, setTags] = useState(['Design', 'Software', 'Research']);
      const [picked, setPicked] = useState<string[]>(['Software']);
      return (
        <Grid>
          <div>
            <Caption>Removable — Tab to a close button, then Enter</Caption>
            <Row>
              {tags.map((t) => (
                <Tag
                  key={t}
                  label={t}
                  size="md"
                  onRemove={() => setTags((v) => v.filter((x) => x !== t))}
                  closeIcon={<CloseIcon />}
                />
              ))}
              {tags.length === 0 && <Caption>All removed.</Caption>}
            </Row>
          </div>
          <div>
            <Caption>Selectable — click a checkbox</Caption>
            <Row>
              {['Design', 'Software', 'Research'].map((t) => (
                <Tag
                  key={t}
                  label={t}
                  size="md"
                  selectable
                  selected={picked.includes(t)}
                  tickIcon={<TickIcon />}
                  onSelectedChange={(next) =>
                    setPicked((v) => (next ? [...v, t] : v.filter((x) => x !== t)))
                  }
                />
              ))}
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
 * Figma draws no interactive state anywhere in the 72, so everything here is an
 * implementation decision — stated rather than implied.
 *
 * - The root is a `<span>`. Tag is a label, not a control; Figma gives it no focus,
 *   hover or pressed treatment.
 * - The close is a real `<button type="button">` with an `aria-label` (`removeLabel`)
 *   and the library's shared focus ring. Figma's close is a plain frame with a
 *   **14×14** hit area, which is well under any touch-target guidance — reproduced
 *   as drawn, so give it room in dense layouts.
 * - The checkbox is a `role="checkbox"` button with `aria-checked`, not a native
 *   `<input>`: Tag often sits inside a button or a listbox option, where a nested
 *   input would add form semantics Figma does not imply.
 * - Both glyphs are `aria-hidden`; the close carries its name on the button.
 * - The dot is decorative and has no accessible name — it is a fixed `success/500`
 *   circle with no colour axis, so it cannot carry meaning on its own. Pair it with
 *   text if the status matters.
 * - `disabled` disables the checkbox and the close button. It does not grey the tag:
 *   Figma publishes no disabled Tag.
 */
export const Accessibility: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <Row>
        <Tag {...args} label="Removable" onRemove={() => {}} closeIcon={<CloseIcon />} />
        <Tag {...args} label="Selectable" selectable tickIcon={<TickIcon />} />
        <Tag {...args} label="Disabled" selectable disabled onRemove={undefined} />
      </Row>
    </Grid>
  ),
};
