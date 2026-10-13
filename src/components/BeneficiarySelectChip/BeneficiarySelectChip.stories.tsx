import type { Meta, StoryObj } from '@storybook/react-vite';
import { AVATAR_RELATIONSHIPS } from '@assets/avatar';
import { Avatar } from '../Avatar';
import { BeneficiarySelectChip, type BeneficiarySelectChipDevice } from './BeneficiarySelectChip';
import { BENEFICIARY_SELECT_CHIP_DEVICES } from './constants';

const NAME = 'Aarav Sharma';
const LONG_NAME = 'Lakshmi Venkataraman Iyer';

/**
 * The avatar's two axes both follow the chip's props, so the stories pair them — and the
 * name is a parameter rather than the module constant, so a row of different people shows
 * each one's own initials.
 */
const avatarFor = (device: BeneficiarySelectChipDevice, selected: boolean, name: string = NAME) => (
  <Avatar
    size={device === 'mobile' ? 'xs' : 'sm'}
    background={selected ? 'white' : 'grey'}
    name={name}
  />
);

/**
 * The `avatar` control's choices, and every one of them is Mozaic's own Avatar.
 *
 * `avatar` is a `ReactNode`, which no Storybook control can type directly, so the options
 * are named and mapped to real nodes: Avatar's initials mode, then all thirteen
 * `relationship` illustrations Figma publishes inside `Avatar_user`, derived from
 * `AVATAR_RELATIONSHIPS` so the list cannot drift from the published set. Nothing here is
 * invented artwork — the same options Avatar's own stories offer.
 *
 * All of them are `xs`, the size that pairs with `device="mobile"`. Switching the device
 * control does **not** resize them, and that is the contract rather than an oversight:
 * the chip never restyles the avatar it is handed. `CustomAvatars` below shows the pairing
 * done properly for both devices.
 */
const AVATAR_OPTIONS: Record<string, React.ReactNode> = {
  'Initials (from name)': <Avatar size="xs" background="grey" name={NAME} />,
  ...Object.fromEntries(
    AVATAR_RELATIONSHIPS.map((relationship) => [
      relationship,
      <Avatar size="xs" background="grey" relationship={relationship} />,
    ]),
  ),
  None: undefined,
};

const Row = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-lg flex flex-wrap items-center">{children}</div>
);
const Stack = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-4xl flex flex-col">{children}</div>
);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary mb-semantic-md">{children}</p>
);

const meta = {
  title: 'Components/BeneficiarySelectChip',
  component: BeneficiarySelectChip,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A beneficiary shown as a selectable pill. Measured from Figma ' +
          '`Beneficiary Select Chip` (node 2180:33533) — **all 4 variants**: ' +
          '`Device`(2) × `State`(2).\n\n' +
          '**The avatar sets the height, not the text.** `8 + 24 + 8 = 40` on mobile and ' +
          '`12 + 32 + 12 = 56` on desktop, so nothing pins a height — it falls out of the ' +
          'padding and whichever avatar you supply. The avatar’s size *and* background ' +
          'both follow the chip’s props and are not applied for you.\n\n' +
          '**The width is a cap, not a size.** Figma writes `max-width`, so the chip hugs ' +
          'its content and truncates only at 132 or 200.\n\n' +
          '**The chip is inert.** Figma draws a chip rather than a control and publishes no ' +
          'hover, focus, pressed or disabled state, so selection is the caller’s — wrap ' +
          'it in your own button. `asChild` is not offered because the chip always renders ' +
          'two children and `Slot` merges onto exactly one.\n\n' +
          '**Deliberately independent of BeneficiarySelector**, which shares the idea and ' +
          'none of the values.',
      },
    },
  },
  tags: ['autodocs'],
  args: { device: 'mobile', selected: false, name: NAME, avatar: 'Initials (from name)' },
  argTypes: {
    device: { control: 'inline-radio', options: BENEFICIARY_SELECT_CHIP_DEVICES },
    selected: { control: 'boolean' },
    name: { control: 'text' },
    avatar: {
      options: Object.keys(AVATAR_OPTIONS),
      mapping: AVATAR_OPTIONS,
      control: { type: 'select' },
      description:
        'Caller-supplied, and rendered exactly as given. All options are `xs`; the chip ' +
        'does not resize what it is handed.',
    },
  },
} satisfies Meta<typeof BeneficiarySelectChip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every prop is live here, `avatar` included — it is spread straight through, so the
 * control wins rather than being overridden by the story.
 */
export const Playground: Story = {
  render: (args) => <BeneficiarySelectChip {...args} />,
};

/** All four published variants, laid out as Figma's component set. */
export const EveryVariant: Story = {
  render: () => (
    <Stack>
      {BENEFICIARY_SELECT_CHIP_DEVICES.map((device) => (
        <div key={device}>
          <Caption>
            {device} — {device === 'mobile' ? '132 × 40' : '200 × 56'} in Figma
          </Caption>
          <Row>
            {[false, true].map((selected) => (
              <BeneficiarySelectChip
                key={String(selected)}
                device={device}
                selected={selected}
                name={NAME}
                avatar={avatarFor(device, selected)}
              />
            ))}
          </Row>
        </div>
      ))}
    </Stack>
  ),
};

/**
 * Selection changes three things at once — surface, stroke and name colour — and flips
 * the avatar's own background from grey to white.
 */
export const Selected: Story = {
  render: () => (
    <Stack>
      <div>
        <Caption>Unselected — white surface, grey stroke, primary text, grey avatar.</Caption>
        <BeneficiarySelectChip name={NAME} avatar={avatarFor('mobile', false)} />
      </div>
      <div>
        <Caption>Selected — brand/25 surface, brand stroke, brand text, white avatar.</Caption>
        <BeneficiarySelectChip name={NAME} selected avatar={avatarFor('mobile', true)} />
      </div>
    </Stack>
  ),
};

/** The name truncates once the chip reaches its cap. */
export const Truncation: Story = {
  render: () => (
    <Stack>
      {BENEFICIARY_SELECT_CHIP_DEVICES.map((device) => (
        <div key={device}>
          <Caption>
            {device} — capped at {device === 'mobile' ? 132 : 200}.
          </Caption>
          <Row>
            <BeneficiarySelectChip
              device={device}
              name="Diya"
              avatar={avatarFor(device, false, 'Diya')}
            />
            <BeneficiarySelectChip
              device={device}
              name={LONG_NAME}
              avatar={avatarFor(device, false, LONG_NAME)}
            />
          </Row>
        </div>
      ))}
    </Stack>
  ),
};

/** Without an avatar the chip still holds its shape; the height then follows the text. */
export const WithoutAvatar: Story = {
  render: () => (
    <Row>
      <BeneficiarySelectChip name={NAME} />
      <BeneficiarySelectChip name={NAME} selected />
    </Row>
  ),
};

/**
 * The avatar is whatever you hand it, and every one of these is Mozaic's own Avatar.
 * Nothing is a built-in default: the first takes its initials from Avatar's `name` mode,
 * the next three are `relationship` drawings Figma publishes inside `Avatar_user`, and the
 * last is given no avatar at all.
 *
 * Each row also shows the size pairing the chip does **not** apply for you — `xs` beside
 * `device="mobile"`, `sm` beside `device="desktop"`.
 */
export const CustomAvatars: Story = {
  render: () => (
    <Stack>
      {BENEFICIARY_SELECT_CHIP_DEVICES.map((device) => {
        const size = device === 'mobile' ? 'xs' : 'sm';
        return (
          <div key={device}>
            <Caption>
              {device} — avatar at {size}.
            </Caption>
            <Row>
              <BeneficiarySelectChip
                device={device}
                name="Aarav Sharma"
                avatar={avatarFor(device, false, 'Aarav Sharma')}
              />
              <BeneficiarySelectChip
                device={device}
                name="Ravi Sharma"
                avatar={<Avatar size={size} background="grey" relationship="father" />}
              />
              <BeneficiarySelectChip
                device={device}
                name="Meera Sharma"
                avatar={<Avatar size={size} background="grey" relationship="mother" />}
              />
              <BeneficiarySelectChip
                device={device}
                name="Kabir Sharma"
                avatar={<Avatar size={size} background="grey" relationship="son" />}
              />
              <BeneficiarySelectChip device={device} name="No avatar" />
            </Row>
          </div>
        );
      })}
    </Stack>
  ),
};

/**
 * Selection is the caller's. Wrapping in a button keeps the role, the handler and
 * `aria-pressed` where they can be got right, and in a flex row the button simply
 * becomes the flex item.
 */
export const Selectable: Story = {
  render: () => (
    <Row>
      {['Aarav Sharma', 'Diya Nair', 'Kabir Rao'].map((person, index) => (
        <button key={person} type="button" aria-pressed={index === 1} className="rounded-full">
          <BeneficiarySelectChip
            name={person}
            selected={index === 1}
            avatar={avatarFor('mobile', index === 1, person)}
          />
        </button>
      ))}
    </Row>
  ),
};
