import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AVATAR_RELATIONSHIPS } from '@assets/avatar';
import { Avatar } from '../Avatar';
import { RadioGroup } from '../Radio';
import { BeneficiarySelector, type BeneficiarySelectorDevice } from './BeneficiarySelector';
import { BENEFICIARY_SELECTOR_DEVICES } from './constants';

const NAME = 'Aarav Sharma';
const LONG_NAME = 'Lakshmi Venkataraman Iyer';

/** Figma's frames are 244 and 342 wide; those are canvas widths, so the story sets them. */
const FIGMA_WIDTH: Record<BeneficiarySelectorDevice, string> = {
  mobile: 'w-[244px]',
  desktop: 'w-[342px]',
};

/**
 * Size follows the device. Unlike the chip, the background does not flip on selection.
 *
 * The name is a parameter rather than the module constant, so a list of different people
 * shows each one's own initials instead of repeating one set.
 */
const avatarFor = (device: BeneficiarySelectorDevice, name: string = NAME) => (
  <Avatar size={device === 'mobile' ? 'lg' : 'xl'} background="grey" name={name} />
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
 * All of them are `lg`, the size that pairs with `device="mobile"`. Switching the device
 * control does **not** resize them, and that is the contract rather than an oversight: the
 * card never restyles the avatar it is handed. `AvatarAndRelation` below pairs them
 * properly for both devices.
 *
 * **These are independent of the `relation` prop.** Nothing derives one from the other, so
 * a `father` illustration beside `relation="Self"` is possible — the control lets you prove
 * it either way.
 */
const AVATAR_OPTIONS: Record<string, React.ReactNode> = {
  'Initials (from name)': <Avatar size="lg" background="grey" name={NAME} />,
  ...Object.fromEntries(
    AVATAR_RELATIONSHIPS.map((relationship) => [
      relationship,
      <Avatar size="lg" background="grey" relationship={relationship} />,
    ]),
  ),
  None: undefined,
};

/** Common values for the `relation` control. It stays a free-text field. */
const RELATIONS = ['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Daughter-in-law'];

const Frame = ({
  device,
  children,
}: {
  device: BeneficiarySelectorDevice;
  children: React.ReactNode;
}) => <div className={FIGMA_WIDTH[device]}>{children}</div>;

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-4xl flex flex-col">{children}</div>
);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary mb-semantic-md">{children}</p>
);

const meta = {
  title: 'Components/BeneficiarySelector',
  component: BeneficiarySelector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A beneficiary shown as a selectable card. Measured from Figma ' +
          '`Beneficiary Selector` (node 2180:33550) — **all 4 variants**: `Device`(2) × ' +
          '`State`(2).\n\n' +
          '**The control is Mozaic’s Radio at `md` on both devices — a deliberate 4px ' +
          'deviation on desktop.** Figma draws 20 on mobile and 24 on desktop, but the 24 ' +
          'comes from a node outside the canonical Checkbox set, and that set publishes ' +
          '`Size` as `sm` and `md` only across all 78 of its variants. Adding an `lg` would ' +
          'invent a size in a shared component. Everything else about the control matches ' +
          'exactly.\n\n' +
          '**Selection does not tint the surface** — unlike BeneficiarySelectChip. It moves ' +
          'the stroke, and the name’s weight and colour.\n\n' +
          '**Figma quirk, reproduced rather than corrected:** the `|` separator sits inside ' +
          'the same gate as the relation, so a relation with no age and no gender renders a ' +
          'trailing `Self |`.\n\n' +
          '**Width is not pinned** — Figma’s 244 and 342 are canvas widths, so these ' +
          'stories constrain a container rather than the component baking them in.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    device: 'mobile',
    selected: false,
    name: NAME,
    relation: 'Self',
    age: '22',
    gender: 'F',
    avatar: 'Initials (from name)',
  },
  argTypes: {
    device: { control: 'inline-radio', options: BENEFICIARY_SELECTOR_DEVICES },
    selected: { control: 'boolean' },
    name: { control: 'text' },
    relation: {
      control: 'text',
      description:
        'Figma’s `relation` — the `Self` in `Self | 22 F`. Free text, and independent of ' +
        'the avatar. Common values: ' +
        RELATIONS.join(', ') +
        '. Clearing it also removes the separator, which is Figma’s own gating.',
    },
    age: { control: 'text' },
    gender: { control: 'text' },
    badge: { control: 'text' },
    avatar: {
      options: Object.keys(AVATAR_OPTIONS),
      mapping: AVATAR_OPTIONS,
      control: { type: 'select' },
      description:
        'Caller-supplied, and rendered exactly as given. All options are `lg`; the card ' +
        'does not resize what it is handed.',
    },
  },
} satisfies Meta<typeof BeneficiarySelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every prop is live here, `avatar` and `relation` included and independent of each other
 * — both are spread straight through, so the controls win rather than being overridden by
 * the story.
 */
export const Playground: Story = {
  render: (args) => (
    <Frame device={args.device ?? 'mobile'}>
      <BeneficiarySelector {...args} />
    </Frame>
  ),
};

/** All four published variants, at Figma's own widths. */
export const EveryVariant: Story = {
  render: () => (
    <Stack>
      {BENEFICIARY_SELECTOR_DEVICES.map((device) => (
        <div key={device}>
          <Caption>
            {device} — {device === 'mobile' ? '244 × 84' : '342 × 124'} in Figma
          </Caption>
          <div className="gap-semantic-xl flex flex-wrap items-start">
            {[false, true].map((selected) => (
              <Frame key={String(selected)} device={device}>
                <BeneficiarySelector
                  device={device}
                  selected={selected}
                  name={NAME}
                  relation="Self"
                  age="22"
                  gender="F"
                  badge="Sponsored"
                  avatar={avatarFor(device)}
                />
              </Frame>
            ))}
          </div>
        </div>
      ))}
    </Stack>
  ),
};

/** Each piece of optional metadata, and the row disappearing when all three are absent. */
export const Metadata: Story = {
  render: () => (
    <Stack>
      {[
        { label: 'All three — Self | 22 F', props: { relation: 'Self', age: '22', gender: 'F' } },
        { label: 'No relation — the separator goes with it', props: { age: '22', gender: 'F' } },
        { label: 'Age only', props: { age: '22' } },
        { label: 'Gender only', props: { gender: 'F' } },
        {
          label: 'Relation only — Figma leaves a trailing separator, reproduced as drawn',
          props: { relation: 'Self' },
        },
        { label: 'None — the row is omitted entirely', props: {} },
      ].map(({ label, props }) => (
        <div key={label}>
          <Caption>{label}</Caption>
          <Frame device="mobile">
            <BeneficiarySelector name={NAME} avatar={avatarFor('mobile')} {...props} />
          </Frame>
        </div>
      ))}
    </Stack>
  ),
};

/**
 * `avatar` and `relation` are independent props, and each card carries its own.
 *
 * The first row varies both together, the way a real list would. The last two cards vary
 * them *against* each other — a `father` illustration labelled `Self`, and initials
 * labelled `Father` — because nothing derives one from the other, and it is worth being
 * able to see that.
 *
 * The illustrations are `relationship` drawings from Avatar, which Figma publishes inside
 * `Avatar_user`; the size pairing (`lg` on mobile, `xl` on desktop) is the caller's, since
 * the card does not resize what it is handed.
 */
export const AvatarAndRelation: Story = {
  render: () => {
    const people = [
      { name: 'Aarav Sharma', relation: 'Self', age: '22', gender: 'M', relationship: undefined },
      { name: 'Ravi Sharma', relation: 'Father', age: '54', gender: 'M', relationship: 'father' },
      { name: 'Meera Sharma', relation: 'Mother', age: '51', gender: 'F', relationship: 'mother' },
      {
        name: 'Diya Sharma',
        relation: 'Spouse',
        age: '31',
        gender: 'F',
        relationship: 'self-spouse-female',
      },
      { name: 'Kabir Sharma', relation: 'Son', age: '7', gender: 'M', relationship: 'son' },
    ] as const;

    return (
      <Stack>
        {BENEFICIARY_SELECTOR_DEVICES.map((device) => {
          const size = device === 'mobile' ? 'lg' : 'xl';
          return (
            <div key={device}>
              <Caption>{device} — a different avatar and relation on every card.</Caption>
              <div className="gap-semantic-xl flex flex-wrap items-start">
                {people.map((person) => (
                  <Frame key={person.name} device={device}>
                    <BeneficiarySelector
                      device={device}
                      name={person.name}
                      relation={person.relation}
                      age={person.age}
                      gender={person.gender}
                      avatar={
                        person.relationship ? (
                          <Avatar
                            size={size}
                            background="grey"
                            relationship={person.relationship}
                          />
                        ) : (
                          avatarFor(device, person.name)
                        )
                      }
                    />
                  </Frame>
                ))}
              </div>
            </div>
          );
        })}

        <div>
          <Caption>
            Independent, deliberately mismatched — nothing derives the avatar from the relation.
          </Caption>
          <div className="gap-semantic-xl flex flex-wrap items-start">
            <Frame device="mobile">
              <BeneficiarySelector
                name="Aarav Sharma"
                relation="Self"
                age="22"
                gender="M"
                avatar={<Avatar size="lg" background="grey" relationship="father" />}
              />
            </Frame>
            <Frame device="mobile">
              <BeneficiarySelector
                name="Ravi Sharma"
                relation="Father"
                age="54"
                gender="M"
                avatar={avatarFor('mobile', 'Ravi Sharma')}
              />
            </Frame>
          </div>
        </div>
      </Stack>
    );
  },
};

/**
 * Figma publishes `badgeShow` but not the badge text — "Sponsored" is typed into the
 * component. Taking a node keeps product copy out of the design system.
 */
export const Badge: Story = {
  render: () => (
    <Stack>
      {BENEFICIARY_SELECTOR_DEVICES.map((device) => (
        <div key={device}>
          <Caption>{device} — badge on, then off.</Caption>
          <div className="gap-semantic-xl flex flex-wrap items-start">
            {['Sponsored', undefined].map((badge, index) => (
              <Frame key={index} device={device}>
                <BeneficiarySelector
                  device={device}
                  name={NAME}
                  relation="Self"
                  age="22"
                  gender="F"
                  badge={badge}
                  avatar={avatarFor(device)}
                />
              </Frame>
            ))}
          </div>
        </div>
      ))}
    </Stack>
  ),
};

/** A long name truncates to one line; the metadata row is unaffected. */
export const Truncation: Story = {
  render: () => (
    <Stack>
      {BENEFICIARY_SELECTOR_DEVICES.map((device) => (
        <div key={device}>
          <Caption>{device}</Caption>
          <Frame device={device}>
            <BeneficiarySelector
              device={device}
              name={LONG_NAME}
              relation="Daughter-in-law"
              age="34"
              gender="F"
              badge="Sponsored"
              avatar={avatarFor(device, LONG_NAME)}
            />
          </Frame>
        </div>
      ))}
    </Stack>
  ),
};

/**
 * A list inside a RadioGroup. `value` is passed straight through to the nested Radio, so
 * the cards become mutually exclusive with no extra wiring, and the Radio is labelled by
 * each beneficiary's name.
 */
export const InAGroup: Story = {
  render: () => {
    const people = [
      { id: 'aarav', name: 'Aarav Sharma', relation: 'Self', age: '22', gender: 'M' },
      {
        id: 'diya',
        name: 'Diya Nair',
        relation: 'Spouse',
        age: '31',
        gender: 'F',
        sponsored: true,
      },
      { id: 'kabir', name: 'Kabir Rao', relation: 'Son', age: '7', gender: 'M' },
    ];
    const Demo = () => {
      const [picked, setPicked] = useState('diya');
      return (
        <RadioGroup
          name="beneficiary"
          value={picked}
          onValueChange={setPicked}
          aria-label="Beneficiary"
        >
          <div className="gap-semantic-lg flex w-[244px] flex-col">
            {people.map((person) => (
              <BeneficiarySelector
                key={person.id}
                value={person.id}
                selected={picked === person.id}
                name={person.name}
                relation={person.relation}
                age={person.age}
                gender={person.gender}
                badge={person.sponsored ? 'Sponsored' : undefined}
                avatar={<Avatar size="lg" background="grey" name={person.name} />}
              />
            ))}
          </div>
        </RadioGroup>
      );
    };
    return <Demo />;
  },
};
