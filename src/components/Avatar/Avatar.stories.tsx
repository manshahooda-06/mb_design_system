import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, type AvatarSize, type AvatarStatus } from './Avatar';
import { AVATAR_RELATIONSHIPS } from '@assets/avatar';

const SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const STATUSES: AvatarStatus[] = ['online', 'offline', 'verified'];
const BOX: Record<AvatarSize, number> = { xs: 24, sm: 32, md: 36, lg: 40, xl: 48 };
const BADGE: Record<AvatarSize, number> = { xs: 8, sm: 10, md: 12, lg: 14, xl: 16 };

/** Caller-supplied artwork, deliberately unlike the built-in thirteen. */
const CustomArtwork = () => (
  <svg viewBox="0 0 48 48" className="size-full" aria-hidden focusable="false">
    <rect width="48" height="48" fill="#0066DC" />
    <path
      d="M24 12l3.7 7.6 8.3 1.2-6 5.9 1.4 8.3-7.4-3.9-7.4 3.9 1.4-8.3-6-5.9 8.3-1.2z"
      fill="#fff"
    />
  </svg>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-desktop gap-semantic-3xl flex flex-col">{children}</div>
);
const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-3xl flex flex-wrap items-end">{children}</div>
);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary mb-semantic-sm">{children}</p>
);

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "A person's avatar. Measured from Figma `Avatar_user` (node 1816:9346) — **70 " +
          'variants**, `Relationship`(14) × `Size`(5).\n\n' +
          '**Relationship is not a prop.** The 14 relationships are illustration assets, not ' +
          'component state: every sampled variant is geometrically identical and only the ' +
          "artwork changes, so it arrives through `illustration`. Figma's `Initials (Name)` " +
          'is filed as a 15th relationship but is a content mode, derived here from `name`.\n\n' +
          'Content resolves **illustration → initials → background only**. There is no ' +
          '`src`: `Avatar_user` publishes no photo variant, and photo avatars are a separate ' +
          'Figma set with its own size scale.\n\n' +
          '**Two ramps, neither a ratio.** The box steps 24/32/36/40/48 and the badge steps ' +
          '8/10/12/14/16 — a linear +2 that only *looks* like box ÷ 3. That ratio holds at ' +
          'xs, md and xl by accident and breaks at sm and lg, so both are measured tables.\n\n' +
          'Figma binds no shadow, border or focus treatment anywhere in the 70, so Avatar is ' +
          'not interactive.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    relationship: { control: 'select', options: [undefined, ...AVATAR_RELATIONSHIPS] },
    size: { control: 'inline-radio', options: SIZES },
    background: { control: 'inline-radio', options: ['white', 'grey'] },
    status: { control: 'inline-radio', options: [undefined, ...STATUSES] },
    name: { control: 'text' },
    illustration: { control: false },
    classNames: { control: false },
  },
  args: { relationship: 'father', name: 'Olivia Rhye' },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The five sizes, with the badge ramp beside them. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>
          Box 24 / 32 / 36 / 40 / 48 — badge 8 / 10 / 12 / 14 / 16. The badge is a linear +2, not a
          fraction of the box.
        </Caption>
        <Row>
          {SIZES.map((size) => (
            <div key={size} className="gap-semantic-xs flex flex-col items-center">
              <Avatar {...args} size={size} status="online" />
              <span className="text-desktop-caption-sm text-semantic-text-tertiary">
                {size} · {BOX[size]}/{BADGE[size]}
              </span>
            </div>
          ))}
        </Row>
      </div>
    </Grid>
  ),
};

/** Every built-in relationship. Identical geometry throughout — only the artwork changes. */
export const Relationships: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>
          The thirteen illustrations Figma publishes, bundled with the component. Naming follows
          Figma&apos;s own variants — one drawing serves both self and spouse, and `other` and
          `no-gender` are separate relationships rather than a fallback.
        </Caption>
        <div className="gap-semantic-xl flex flex-wrap">
          {AVATAR_RELATIONSHIPS.map((relationship) => (
            <div key={relationship} className="gap-semantic-xs flex w-24 flex-col items-center">
              <Avatar {...args} relationship={relationship} size="xl" />
              <span className="text-desktop-caption-sm text-semantic-text-tertiary text-center">
                {relationship}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Caption>Each one across the size ramp — the artwork is resolution-independent</Caption>
        <div className="gap-semantic-lg flex flex-col">
          {AVATAR_RELATIONSHIPS.slice(0, 4).map((relationship) => (
            <Row key={relationship}>
              {SIZES.map((size) => (
                <Avatar key={size} {...args} relationship={relationship} size={size} />
              ))}
            </Row>
          ))}
        </div>
      </div>
    </Grid>
  ),
};

/** Content priority: relationship → illustration → initials → background. */
export const Content: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>Relationship — a built-in illustration, the primary API</Caption>
        <Row>
          {SIZES.map((size) => (
            <Avatar key={size} {...args} size={size} relationship="mother" />
          ))}
        </Row>
      </div>
      <div>
        <Caption>Illustration — custom artwork, for what the thirteen do not cover</Caption>
        <Row>
          {SIZES.map((size) => (
            <Avatar
              key={size}
              {...args}
              size={size}
              relationship={undefined}
              illustration={<CustomArtwork />}
            />
          ))}
        </Row>
      </div>
      <div>
        <Caption>
          Initials — derived from `name` when nothing is drawn above them. md and lg share 16/24,
          exactly as Figma does.
        </Caption>
        <Row>
          {SIZES.map((size) => (
            <Avatar key={size} {...args} size={size} relationship={undefined} />
          ))}
        </Row>
      </div>
      <div>
        <Caption>Background only — no relationship, no illustration, no name</Caption>
        <Row>
          {SIZES.map((size) => (
            <Avatar key={size} size={size} background="grey" />
          ))}
        </Row>
      </div>
      <div>
        <Caption>
          `relationship` wins when both are given — the built-in set is the primary API
        </Caption>
        <Row>
          <Avatar {...args} size="xl" relationship="sister" illustration={<CustomArtwork />} />
        </Row>
      </div>
    </Grid>
  ),
};

/** Figma's `_Background` axis. */
export const Background: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <div>
        <Caption>white — `bg-primary`</Caption>
        <Row>
          {SIZES.map((size) => (
            <Avatar key={size} {...args} size={size} background="white" />
          ))}
        </Row>
      </div>
      <div>
        <Caption>
          grey — `bg-secondary`. Deliberately not `bg-disabled-subtle`: same value, wrong meaning.
        </Caption>
        <Row>
          {SIZES.map((size) => (
            <Avatar key={size} {...args} size={size} background="grey" />
          ))}
        </Row>
      </div>
    </Grid>
  ),
};

/**
 * Figma's `_Icon Status`.
 *
 * Online and Offline are geometrically identical and differ only in fill: a coloured disc
 * inside a white ring. **Verified is a different shape, not a different fill** — a
 * scalloped seal with a tick cut into it and no white ring at all. Figma draws the tick
 * itself, so the badge needs nothing from the caller.
 */
export const Status: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      {STATUSES.map((status) => (
        <div key={status}>
          <Caption>
            {status}
            {status === 'verified' ? ' — its own shape, seal and tick, no white ring' : ''}
          </Caption>
          <Row>
            {SIZES.map((size) => (
              <Avatar key={size} {...args} size={size} status={status} />
            ))}
          </Row>
        </div>
      ))}
      <div>
        <Caption>No status — the badge is simply absent, matching `showIcon=false`</Caption>
        <Row>
          {SIZES.map((size) => (
            <Avatar key={size} {...args} size={size} />
          ))}
        </Row>
      </div>
    </Grid>
  ),
};

/** Every rendered combination: 5 sizes × 4 status states × 2 backgrounds. */
export const EveryVariant: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      {(['white', 'grey'] as const).map((background) => (
        <div key={background}>
          <Caption>{background} background — none / online / offline / verified</Caption>
          <div className="gap-semantic-lg flex flex-col">
            {SIZES.map((size) => (
              <Row key={size}>
                {[undefined, ...STATUSES].map((status) => (
                  <Avatar
                    key={String(status)}
                    {...args}
                    size={size}
                    background={background}
                    status={status}
                  />
                ))}
              </Row>
            ))}
          </div>
        </div>
      ))}
    </Grid>
  ),
};

/**
 * ### Accessibility
 *
 * - The root is a `<span>`. Figma draws no hover, focus or pressed state in any of the
 *   70, so Avatar is **not interactive** — wrap it in a button or link if it needs to be.
 * - Giving a `name` labels it: `role="img"` with `aria-label`, so an avatar standing
 *   alone for a person is announced. Pass `aria-hidden` when it sits beside that same
 *   name and would otherwise be read twice.
 * - The initials are `aria-hidden` — they are a visual abbreviation, and the full name
 *   is already the accessible name. Casing is applied in CSS, so the announced name
 *   keeps whatever the caller passed.
 * - Without a `name` the avatar has no role at all: an illustration with no identity is
 *   decoration.
 * - The status badge is `aria-hidden`. Figma attaches no text to it, so if the state
 *   matters to a user it must also appear in content rather than in colour alone.
 */
export const Accessibility: Story = {
  parameters: { controls: { disable: true } },
  render: (args) => (
    <Grid>
      <Row>
        <Avatar {...args} size="lg" status="online" />
        <Avatar {...args} size="lg" name={undefined} />
        <Avatar {...args} size="lg" aria-label="Account owner" />
      </Row>
      <Caption>
        Labelled from the name · decoration with no name · an explicit label overriding it
      </Caption>
    </Grid>
  ),
};
