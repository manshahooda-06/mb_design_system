import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../Avatar';
import { TopNavigationBar } from './TopNavigationBar';
import { TOP_NAVIGATION_BAR_CONSTANTS, TOP_NAVIGATION_BAR_DEVICES } from './constants';

const { TEXT } = TOP_NAVIGATION_BAR_CONSTANTS;

/*
 * Stand-ins for Figma's icon instances. The icon foundation publishes no set yet, so
 * every glyph here is caller-supplied — which is exactly how a consumer will pass them.
 * The MediBuddy logo is the one exception and ships with the component.
 */
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M19 12H5m0 0 6-6m-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <circle cx="12" cy="12" r="9" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="12" cy="12" r="7.5" />
    <path d="m18 18 5 5" strokeLinecap="round" />
  </svg>
);
const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6Z" strokeLinejoin="round" />
    <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
  </svg>
);
const WalletIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <rect x="5" y="10" width="26" height="18" rx="3" />
    <path d="M5 15h26" />
    <circle cx="25" cy="21" r="1.75" fill="currentColor" stroke="none" />
  </svg>
);
const CartIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M6 7h3l3.5 15h13l3-10H11" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="14" cy="28" r="2" />
    <circle cx="25" cy="28" r="2" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="m4 6.5 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Figma pins the mobile bar at 360; the desktop bar is fluid. */
const Mobile = ({ children }: { children: React.ReactNode }) => (
  <div className="w-[360px] overflow-hidden">{children}</div>
);
const Stack = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-6xl flex flex-col">{children}</div>
);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary mb-semantic-md">{children}</p>
);

const DESKTOP_ACTIONS = [
  { type: 'wallet' as const, icon: <WalletIcon />, label: 'Wallet', badge: '87586' },
  { type: 'cart' as const, icon: <CartIcon />, label: 'Cart', badge: '88' },
];

const ACCOUNT = {
  name: TEXT.ACCOUNT_NAME,
  description: TEXT.ACCOUNT_DESCRIPTION,
  avatar: <Avatar size="md" background="grey" name="Olivia Rhye" />,
  endIcon: <ChevronDownIcon />,
};

const meta = {
  title: 'Components/TopNavigationBar',
  component: TopNavigationBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The application top navigation bar. Measured from Figma `Mobile Top Navigation ' +
          'Bar` (node 2180:49648, 360 × 64) and `Desktop Top Navigation Bar` ' +
          '(node 2180:49909, 1920 × 92).\n\n' +
          '**Two Figma components behind one `device` prop.** They are separate nodes with ' +
          'different published properties — mobile exposes five `*Show` booleans, desktop ' +
          'exposes none — and they share no children. `device` selects a layout rather than ' +
          'retuning one. Auto-switching was rejected because it needs a breakpoint neither ' +
          'Figma nor the consuming app defines.\n\n' +
          '**Presence replaces Figma’s `*Show` flags.** Passing the content is what shows ' +
          'it, so "shown but empty" cannot happen.\n\n' +
          '**Scope is the bar only.** The Figma frame also contains `_Breadcrumb` and ' +
          '`Desktop Header` as separate sibling components; those are not folded in here.\n\n' +
          '**No behaviour is invented.** Figma publishes no menu, sticky, scroll or search ' +
          'submission, so none exists — the component takes callbacks only where Figma draws ' +
          'a control. Icons are caller-supplied; the MediBuddy logo ships.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    device: 'mobile',
    heading: TEXT.HEADING_PLACEHOLDER,
    subHeading: TEXT.SUBHEADING_PLACEHOLDER,
  },
  argTypes: {
    device: { control: 'inline-radio', options: TOP_NAVIGATION_BAR_DEVICES },
    heading: { control: 'text' },
    subHeading: { control: 'text' },
  },
} satisfies Meta<typeof TopNavigationBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) =>
    args.device === 'mobile' ? (
      <Mobile>
        <TopNavigationBar {...args} leftIcon={<BackIcon />} leftIconLabel="Go back" />
      </Mobile>
    ) : (
      <TopNavigationBar
        {...args}
        headingStartIcon={<CircleIcon />}
        headingEndIcon={<CircleIcon />}
        searchPlaceholder={TEXT.SEARCH_PLACEHOLDER}
        searchIcon={<SearchIcon />}
        actionItems={DESKTOP_ACTIONS}
        account={ACCOUNT}
      />
    ),
};

/**
 * The mobile bar as Figma publishes it: 64 tall, 16 padding, `elevation-1`, with the
 * back icon and two right slots visible and the MERGE button hidden.
 */
export const MobileDefault: Story = {
  name: 'Mobile',
  render: () => (
    <Mobile>
      <TopNavigationBar
        leftIcon={<BackIcon />}
        leftIconLabel="Go back"
        headingStartIcon={<CircleIcon />}
        heading={TEXT.HEADING_PLACEHOLDER}
        subHeading={TEXT.SUBHEADING_PLACEHOLDER}
        rightSlots={[<CircleIcon key="a" />, <CircleIcon key="b" />]}
      />
    </Mobile>
  ),
};

/**
 * Figma's five booleans, as presence. Every combination the design publishes, plus the
 * MERGE button it ships hidden.
 */
export const MobileSlots: Story = {
  render: () => (
    <Stack>
      <div>
        <Caption>Everything on — left icon, MERGE, and all three right slots.</Caption>
        <Mobile>
          <TopNavigationBar
            leftIcon={<BackIcon />}
            leftIconLabel="Go back"
            heading={TEXT.HEADING_PLACEHOLDER}
            subHeading={TEXT.SUBHEADING_PLACEHOLDER}
            action={{ label: TEXT.ACTION_LABEL }}
            rightSlots={[<CircleIcon key="a" />, <BellIcon key="b" />, <CircleIcon key="c" />]}
          />
        </Mobile>
      </div>
      <div>
        <Caption>No left icon — the heading takes the space.</Caption>
        <Mobile>
          <TopNavigationBar
            heading={TEXT.HEADING_PLACEHOLDER}
            subHeading={TEXT.SUBHEADING_PLACEHOLDER}
            rightSlots={[<CircleIcon key="a" />]}
          />
        </Mobile>
      </div>
      <div>
        <Caption>Heading only — no sub-heading, so the row centres on one line.</Caption>
        <Mobile>
          <TopNavigationBar
            leftIcon={<BackIcon />}
            leftIconLabel="Go back"
            heading={TEXT.HEADING_PLACEHOLDER}
          />
        </Mobile>
      </div>
      <div>
        <Caption>A long sub-heading truncates to one line, which is what Figma draws.</Caption>
        <Mobile>
          <TopNavigationBar
            leftIcon={<BackIcon />}
            leftIconLabel="Go back"
            heading="Order Medicines"
            subHeading="An intentionally long subtitle that has to be cut off somewhere rather than wrapping onto a second line"
            rightSlots={[<CircleIcon key="a" />, <CircleIcon key="b" />]}
          />
        </Mobile>
      </div>
    </Stack>
  ),
};

/**
 * The desktop bar as Figma publishes it: 92 tall from `16 + 60 + 16`, 112 horizontal
 * padding, `elevation-2`, with the shipped MediBuddy logo.
 */
export const DesktopDefault: Story = {
  name: 'Desktop',
  render: () => (
    <TopNavigationBar
      device="desktop"
      headingStartIcon={<CircleIcon />}
      heading="Heading"
      headingEndIcon={<CircleIcon />}
      subHeading={TEXT.SUBHEADING_PLACEHOLDER}
      searchPlaceholder={TEXT.SEARCH_PLACEHOLDER}
      searchIcon={<SearchIcon />}
      actionItems={DESKTOP_ACTIONS}
      account={ACCOUNT}
    />
  ),
};

/**
 * Figma's `actionType` axis. The wallet's badge is a wide pill beside its glyph,
 * overlapping it by 16; the cart's is a small pill pinned over the glyph's top-right
 * corner. Both are rung in white without changing their box — the measured boxes,
 * 57 × 20 and 25 × 20, are text plus padding exactly.
 */
export const DesktopActions: Story = {
  render: () => (
    <Stack>
      <div>
        <Caption>Both badges.</Caption>
        <TopNavigationBar
          device="desktop"
          heading="Heading"
          searchPlaceholder={TEXT.SEARCH_PLACEHOLDER}
          searchIcon={<SearchIcon />}
          actionItems={DESKTOP_ACTIONS}
          account={ACCOUNT}
        />
      </div>
      <div>
        <Caption>No badges — nothing to show, so nothing is drawn.</Caption>
        <TopNavigationBar
          device="desktop"
          heading="Heading"
          searchPlaceholder={TEXT.SEARCH_PLACEHOLDER}
          searchIcon={<SearchIcon />}
          actionItems={[
            { type: 'wallet', icon: <WalletIcon />, label: 'Wallet' },
            { type: 'cart', icon: <CartIcon />, label: 'Cart' },
          ]}
          account={ACCOUNT}
        />
      </div>
      <div>
        <Caption>Account without a description, and no chevron.</Caption>
        <TopNavigationBar
          device="desktop"
          heading="Heading"
          searchPlaceholder={TEXT.SEARCH_PLACEHOLDER}
          searchIcon={<SearchIcon />}
          actionItems={DESKTOP_ACTIONS}
          account={{
            name: TEXT.ACCOUNT_NAME,
            avatar: <Avatar size="md" background="grey" name="Olivia Rhye" />,
          }}
        />
      </div>
    </Stack>
  ),
};

/**
 * The one structure both bars share — and it still differs on nearly every value. The
 * glyph is 16 against 20, the heading 14/20 against 20/28, and the sub-heading changes
 * size, weight **and** colour: `text-secondary` on mobile, `text-primary` on desktop.
 */
export const MiddleSlot: Story = {
  render: () => (
    <Stack>
      <div>
        <Caption>Mobile — 14/20 semibold over 10/16 medium in text-secondary.</Caption>
        <Mobile>
          <TopNavigationBar
            headingStartIcon={<CircleIcon />}
            heading={TEXT.HEADING_PLACEHOLDER}
            subHeading={TEXT.SUBHEADING_PLACEHOLDER}
          />
        </Mobile>
      </div>
      <div>
        <Caption>Desktop — 20/28 semibold over 16/24 light in text-primary.</Caption>
        <TopNavigationBar
          device="desktop"
          logo={null}
          headingStartIcon={<CircleIcon />}
          heading="Heading"
          headingEndIcon={<CircleIcon />}
          subHeading={TEXT.SUBHEADING_PLACEHOLDER}
        />
      </div>
    </Stack>
  ),
};

/**
 * The logo slot. It ships by default because it is brand artwork the desktop bar cannot
 * render without; a caller can replace it, or drop the slot with `logo={null}`.
 */
export const Logo: Story = {
  render: () => (
    <Stack>
      <div>
        <Caption>Default — the shipped MediBuddy logo, 172 × 44 in a 180 × 60 box.</Caption>
        <TopNavigationBar device="desktop" heading="Heading" account={ACCOUNT} />
      </div>
      <div>
        <Caption>Slot dropped with logo={'{null}'}.</Caption>
        <TopNavigationBar device="desktop" logo={null} heading="Heading" account={ACCOUNT} />
      </div>
    </Stack>
  ),
};

/**
 * `role="banner"` on both bars, accessible names on every icon-only control, and
 * decorative glyphs hidden. The search field is deliberately **not** an input: Figma
 * draws a caret glyph and a placeholder, not a text field, so nothing here claims to be
 * one.
 */
export const Accessibility: Story = {
  render: () => (
    <Stack>
      <div>
        <Caption>
          The back action and both desktop actions are named buttons; the heading glyphs and the
          search glyph are hidden from assistive technology.
        </Caption>
        <Mobile>
          <TopNavigationBar
            leftIcon={<BackIcon />}
            leftIconLabel="Go back"
            headingStartIcon={<CircleIcon />}
            heading={TEXT.HEADING_PLACEHOLDER}
            subHeading={TEXT.SUBHEADING_PLACEHOLDER}
            action={{ label: TEXT.ACTION_LABEL }}
          />
        </Mobile>
      </div>
      <div>
        <Caption>
          The account becomes a button only when given a handler — Figma draws a chevron but
          publishes no menu.
        </Caption>
        <TopNavigationBar
          device="desktop"
          heading="Heading"
          searchPlaceholder={TEXT.SEARCH_PLACEHOLDER}
          searchIcon={<SearchIcon />}
          actionItems={DESKTOP_ACTIONS}
          account={{ ...ACCOUNT, onClick: () => {} }}
        />
      </div>
    </Stack>
  ),
};
