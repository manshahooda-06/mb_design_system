import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './Divider';
import { DIVIDER_ORIENTATIONS, DIVIDER_STYLES, DIVIDER_VARIANTS } from './constants';

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div className="gap-semantic-3xl flex flex-col">{children}</div>
);
const Caption = ({ children }: { children: React.ReactNode }) => (
  <p className="text-desktop-caption-sm text-semantic-text-tertiary mb-semantic-md">{children}</p>
);

/** Figma's own sample length, so the matrix reads against the file. */
const SAMPLE = 'w-[328px]';

const meta = {
  title: 'Components/Divider',
  component: Divider,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A 1px rule between things. Measured from Figma `Divider` (node 4725:3274) — ' +
          '**all 8 variants**: `Orientation`(2) × `Style`(2) × `Variant`(2).\n\n' +
          '**One element and three axes.** There is no size, thickness, colour, spacing, ' +
          'inset or length prop, because Figma publishes none — the line is always 1px, ' +
          'always one of two greys, and always as long as whatever contains it. Spacing ' +
          'around a divider belongs to the layout that places it.\n\n' +
          '**Figma’s 328px is a sample frame, not a constraint.** It appears on the ' +
          '*long* axis in both orientations — 328 wide when horizontal, 328 tall when ' +
          'vertical — which is a canvas size rather than a specification. So a horizontal ' +
          'rule fills its container’s width and a vertical one its parent’s height. The ' +
          'stories below constrain a container rather than the component baking it in.\n\n' +
          '**Dashed is a gradient, not `border-dashed`.** Figma publishes ' +
          '`stroke-dasharray="2 2"`, and CSS leaves dashed-border geometry to the ' +
          'browser: rendered against each other over the same 40px, Figma’s pattern gives ' +
          '10 dashes and a 1px dashed border gives 8. Hard-stop repeating gradients ' +
          'reproduce 2/2 exactly, with no SVG asset.\n\n' +
          '**Presentational.** It carries `role="separator"` and nothing else. Pass ' +
          '`aria-hidden` or `role="presentation"` for a purely decorative rule.\n\n' +
          '**These rules are meant to be faint, and they are.** `normal` sits at 1.33:1 ' +
          'against white and `lighter` at 1.16:1 — which is what a divider should be, and ' +
          'also why a 1px line of it is hard to see on screen at true size. That is the ' +
          'design, not a rendering fault. **Pattern Detail** magnifies all four ' +
          'style/variant pairs so the two greys and the 2/2 dash rhythm can actually be ' +
          'reviewed against Figma.',
      },
    },
  },
  tags: ['autodocs'],
  args: { orientation: 'horizontal', style: 'solid', variant: 'normal' },
  argTypes: {
    orientation: {
      control: 'inline-radio',
      options: DIVIDER_ORIENTATIONS,
      description: '**Figma property** `Orientation`.',
    },
    style: {
      control: 'inline-radio',
      options: DIVIDER_STYLES,
      description: '**Figma property** `Style`. Dashed is Figma’s exact 2px/2px pattern.',
    },
    variant: {
      control: 'inline-radio',
      options: DIVIDER_VARIANTS,
      description:
        '**Figma property** `Variant` — `normal` is gray-light-100, `lighter` is ' +
        'gray-light-50. Not a semantic intent.',
    },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every published property is live. A vertical rule needs a parent with a height, which
 * is what the container here provides.
 */
export const Playground: Story = {
  render: (args) => (
    <div className={`flex h-[120px] items-stretch ${SAMPLE}`}>
      <Divider {...args} />
    </div>
  ),
};

/** All eight published combinations, laid out as Figma's component set. */
export const EveryVariant: Story = {
  render: () => (
    <Stack>
      <div>
        <Caption>Horizontal — 328 wide in Figma, filling its container here</Caption>
        <div className={`gap-semantic-3xl flex flex-col ${SAMPLE}`}>
          {DIVIDER_STYLES.map((style) =>
            DIVIDER_VARIANTS.map((variant) => (
              <div key={`${style}-${variant}`}>
                <Caption>
                  {style} · {variant}
                </Caption>
                <Divider orientation="horizontal" style={style} variant={variant} />
              </div>
            )),
          )}
        </div>
      </div>

      <div>
        <Caption>Vertical — 328 tall in Figma, filling a 160px container here</Caption>
        <div className="gap-semantic-6xl flex h-[160px] items-stretch">
          {DIVIDER_STYLES.map((style) =>
            DIVIDER_VARIANTS.map((variant) => (
              <div key={`${style}-${variant}`} className="gap-semantic-md flex items-stretch">
                <Divider orientation="vertical" style={style} variant={variant} />
                <span className="text-desktop-caption-sm text-semantic-text-tertiary self-end">
                  {style} · {variant}
                </span>
              </div>
            )),
          )}
        </div>
      </div>
    </Stack>
  ),
};

/** The four horizontal combinations on their own. */
export const Horizontal: Story = {
  render: () => (
    <div className={`gap-semantic-3xl flex flex-col ${SAMPLE}`}>
      {DIVIDER_STYLES.map((style) =>
        DIVIDER_VARIANTS.map((variant) => (
          <div key={`${style}-${variant}`}>
            <Caption>
              {style} · {variant}
            </Caption>
            <Divider style={style} variant={variant} />
          </div>
        )),
      )}
    </div>
  ),
};

/**
 * The four vertical combinations. A vertical rule fills its parent's height, so the
 * parent needs one — here a 160px flex row with `items-stretch`.
 */
export const Vertical: Story = {
  render: () => (
    <div className="gap-semantic-6xl flex h-[160px] items-stretch">
      {DIVIDER_STYLES.map((style) =>
        DIVIDER_VARIANTS.map((variant) => (
          <div key={`${style}-${variant}`} className="gap-semantic-md flex items-stretch">
            <Divider orientation="vertical" style={style} variant={variant} />
            <span className="text-desktop-caption-sm text-semantic-text-tertiary self-end">
              {style} · {variant}
            </span>
          </div>
        )),
      )}
    </div>
  ),
};

/**
 * The two greys side by side at Figma's sample length, which is the only way to read the
 * difference between `normal` (gray-light-100) and `lighter` (gray-light-50).
 */
export const Variants: Story = {
  render: () => (
    <div className={`gap-semantic-2xl flex flex-col ${SAMPLE}`}>
      <div>
        <Caption>normal — gray-light-100, #DBE0E6</Caption>
        <Divider variant="normal" />
      </div>
      <div>
        <Caption>lighter — gray-light-50, #EBEEF1</Caption>
        <Divider variant="lighter" />
      </div>
    </div>
  ),
};

/**
 * What a divider is actually for. The rule takes the width its container gives it, and
 * the spacing around it belongs to the layout rather than to the component.
 */
export const InContext: Story = {
  render: () => (
    <Stack>
      <div>
        <Caption>Separating rows in a list</Caption>
        <div className="border-semantic-border-tertiary p-semantic-xl w-[360px] rounded-md border">
          {['Consultation', 'Medicines', 'Lab tests'].map((row, index, all) => (
            <div key={row}>
              <p className="py-semantic-md text-desktop-caption-md text-semantic-text-primary">
                {row}
              </p>
              {index < all.length - 1 && <Divider variant="lighter" />}
            </div>
          ))}
        </div>
      </div>

      <div>
        <Caption>Separating items in a row</Caption>
        <div className="gap-semantic-lg h-semantic-5xl flex items-center">
          {['Today', 'This week', 'This month'].map((label, index, all) => (
            <div key={label} className="gap-semantic-lg flex items-center">
              <span className="text-desktop-caption-md text-semantic-text-primary">{label}</span>
              {index < all.length - 1 && (
                <Divider orientation="vertical" className="h-semantic-3xl" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <Caption>A dashed rule marking an optional section</Caption>
        <div className={SAMPLE}>
          <Divider style="dashed" variant="normal" />
        </div>
      </div>
    </Stack>
  ),
};

/**
 * The same eight rules, magnified — because a 1px line at 1.16:1 against white cannot be
 * checked by eye at true size.
 *
 * Each row shows the rule as it really renders, then the same rule scaled 8×. Only the
 * scale changes: the colour, the 1px thickness and the 2px/2px dash rhythm are the
 * component's own, so the magnified band is 8px tall and each dash 16px long.
 */
export const PatternDetail: Story = {
  render: () => (
    <Stack>
      {DIVIDER_STYLES.map((style) =>
        DIVIDER_VARIANTS.map((variant) => (
          <div key={`${style}-${variant}`}>
            <Caption>
              {style} · {variant} — true size, then 8×
            </Caption>
            <div className="w-[160px]">
              <Divider style={style} variant={variant} />
            </div>
            <div className="mt-semantic-lg h-[8px] w-[160px] overflow-hidden">
              <div className="w-[20px] origin-top-left scale-[8]">
                <Divider style={style} variant={variant} />
              </div>
            </div>
          </div>
        )),
      )}

      <div>
        <Caption>vertical, dashed · normal — true size beside 8×</Caption>
        <div className="gap-semantic-4xl flex h-[120px] items-stretch">
          <Divider orientation="vertical" style="dashed" variant="normal" />
          <div className="h-[120px] w-[8px] overflow-hidden">
            <div className="h-[15px] origin-top-left scale-[8]">
              <Divider orientation="vertical" style="dashed" variant="normal" />
            </div>
          </div>
        </div>
      </div>
    </Stack>
  ),
};
