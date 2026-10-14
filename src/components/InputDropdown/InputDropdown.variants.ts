import { defineVariants, type VariantProps } from '@utils/variants';

/**
 * Styling for InputDropdown, declared as data.
 *
 * Measured from Figma `Input dropdown` (node 5265:8766, 20 variants) and its
 * nested item set `_dropdown menu item` (node 5265:9000, 16 variants). This file
 * implements all 20 dropdown variants: `type=Default` and `type=multiSelect`,
 * each across both devices. `multiSelect` renders a Tag for each selected value
 * and a Checkbox on each menu row — Figma instances `Checkbox` at `Size=md,
 * Text=False` (nodes 5265:8961–8965) and `Tag` at `lg`.
 *
 * The axis here is `device`, not a size scale. Desktop and mobile are two separate
 * sets of measurements — padding 16 against 12, a 56 field against 44, the Desktop
 * type ramp against the Mobile one, and different gaps at almost every level. They
 * share the radius and the shadow and nothing else.
 *
 * `Placeholder`, `Default`, `Focused` and `Open` are runtime states, never props;
 * only `Disabled` is a prop. The field height is **hug** in every variant — no
 * Figma variant pins one, and each measured height is exactly padding + content
 * (16+24+16=56 desktop, 12+20+12=44 mobile).
 */

/* -------------------------------------------------------------------------- */
/* Field                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The outermost stack: field group, hint, menu.
 *
 * Figma's root is a fixed `w-[320px]`, which is a canvas width rather than
 * component behaviour, so this fills instead — the recorded decision, matching the
 * one taken for Input's Trailing Button.
 *
 * The gap changes when the menu opens, and by device: desktop 8 → 12, mobile
 * 4 → 8. All four are tokens.
 */
// `font-sans` is stated, not inherited: `embed.css` ships no preflight, so in a host app
// this text would render in whatever family that app uses. See docs/Components.md.
export const inputDropdownRootVariants = defineVariants(
  'flex w-full flex-col items-start font-sans',
  {
    variants: {
      device: { desktop: '', mobile: '' },
      open: { true: '', false: '' },
    },
    compoundVariants: [
      { device: 'desktop', open: false, class: 'gap-semantic-md' },
      { device: 'desktop', open: true, class: 'gap-semantic-lg' },
      { device: 'mobile', open: false, class: 'gap-semantic-xs' },
      { device: 'mobile', open: true, class: 'gap-semantic-md' },
    ],
    defaultVariants: { device: 'desktop', open: false },
  },
);

/** Label over field. Figma "Input with label", gap `spacing-sm` 6 at both devices. */
export const inputDropdownFieldGroupVariants = defineVariants(
  'flex w-full flex-col items-start gap-semantic-sm',
);

/** Label beside the required marker. Figma "Label wrapper", gap `spacing-xxs` 2. */
export const inputDropdownLabelRowVariants = defineVariants('flex items-center gap-semantic-xxs');

/**
 * The label. 14/20/500 in `text-primary` at both devices.
 *
 * The values are identical; the bound Figma groups are not —
 * `Group/Desktop/Caption-md-Medium` at desktop, `Group/Mobile/Body-md-Medium` at
 * mobile — so each device reads its own ramp token rather than sharing one.
 */
export const inputDropdownLabelVariants = defineVariants('font-medium text-semantic-text-primary', {
  variants: {
    device: { desktop: 'text-desktop-caption-md', mobile: 'text-mobile-body-md' },
  },
  defaultVariants: { device: 'desktop' },
});

/**
 * The required marker.
 *
 * Figma binds `Marketing/Mobile/Caption-lg-Medium` (14/20/500) at both devices and
 * colours it with the primitive `Colors/error/700`. `text-error-secondary` aliases
 * exactly that primitive and is the correct role for a text colour on a text node,
 * so the semantic token is used — the same call already made for Input.
 */
export const inputDropdownRequiredVariants = defineVariants(
  'text-mobile-body-md font-medium text-semantic-text-error-secondary',
);

/**
 * The field.
 *
 * Height is **hug**, not pinned: no Figma variant carries a height, and every
 * measured height is padding + content exactly.
 *
 * The stroke is an `inset-ring`. Figma strokes are inside-aligned — verified here
 * rather than assumed: the border goes 1px → 2px between Default and Focused while
 * Content stays at `x=16` and the frame stays 56 tall. A CSS border would grow the
 * box by 2px on each axis.
 *
 * `Focused` and `Open` are measurably identical in the field: 2px `brand/600`, and
 * the shadow byte-identical across all five states. Figma defines **no ring, no
 * inset ring beyond the stroke, and no offset** for this component.
 *
 * The shadow is `elevation-1`, the lowest level Elevation publishes.
 */
export const inputDropdownFieldVariants = defineVariants(
  [
    'flex w-full items-center overflow-clip rounded-md',
    'bg-semantic-bg-primary',
    'inset-ring inset-ring-semantic-border-primary',
    'shadow-elevation-1',
    'transition',
    // `focus` rather than `focus-visible`: Figma publishes Focused as a field
    // state, and a select shows it on click too — the border is the whole
    // treatment, so suppressing it for pointer users would render a state Figma
    // does not contain.
    'outline-none focus:inset-ring-2 focus:inset-ring-semantic-border-brand-alt',
    'disabled:cursor-not-allowed',
  ],
  {
    variants: {
      device: {
        desktop: 'gap-semantic-md px-semantic-xl',
        mobile: 'gap-semantic-md px-semantic-lg',
      },
      /**
       * What the field is holding, which is what sets the vertical padding.
       *
       * Figma hand-tunes `py` so the field lands on 56 / 44 whichever it holds: a
       * 24/20-tall text line takes 16/12, and a 28/24-tall Tag row takes 14/10. The
       * two Tag values are the only raw ones, and `py-[10px]` was already documented
       * for Input; `py-[14px]` joins the same cause.
       */
      content: { text: '', tags: '' },
      /** Figma's Open state paints the same 2px brand stroke as Focused. */
      open: { true: 'inset-ring-2 inset-ring-semantic-border-brand-alt' },
      disabled: { true: 'bg-semantic-bg-disabled-subtle' },
    },
    compoundVariants: [
      { device: 'desktop', content: 'text', class: 'py-semantic-xl' } /* 16 → 56 */,
      { device: 'desktop', content: 'tags', class: 'py-[14px]' } /*      → 56 */,
      { device: 'mobile', content: 'text', class: 'py-semantic-lg' } /*  12 → 44 */,
      { device: 'mobile', content: 'tags', class: 'py-[10px]' } /*       → 44 */,
    ],
    defaultVariants: { device: 'desktop', content: 'text', open: false, disabled: false },
  },
);

/**
 * The Tag row inside a multi-select field, in place of the value text.
 *
 * Gap 12 desktop / 8 mobile, measured. `shrink-0` because Figma lets the row keep its
 * width and the field clip, rather than compressing the Tags.
 */
export const inputDropdownTagsVariants = defineVariants('flex shrink-0 items-center', {
  variants: {
    device: { desktop: 'gap-semantic-lg', mobile: 'gap-semantic-md' },
  },
  defaultVariants: { device: 'desktop' },
});

/**
 * The row inside the field. Figma "Content": fills, `min-width: 1px`.
 *
 * The gap differs by device — `spacing-md` 8 at desktop, `spacing-xs` 4 at mobile —
 * and it only shows when a supporting text sits beside the value.
 */
export const inputDropdownContentVariants = defineVariants('flex min-w-px flex-1 items-center', {
  variants: {
    device: { desktop: 'gap-semantic-md', mobile: 'gap-semantic-xs' },
  },
  defaultVariants: { device: 'desktop' },
});

/**
 * The value, the placeholder and the disabled text — one slot, three treatments.
 *
 * Figma renders them as one text node whose ramp, weight, colour and sizing all
 * change: the value is Medium and hugs, the placeholder is Regular, fills and
 * truncates. `Open` shows the *placeholder*, not the value, which is why this is
 * driven by what is displayed rather than by the state.
 */
export const inputDropdownValueVariants = defineVariants('text-left', {
  variants: {
    device: { desktop: 'text-desktop-body-sm', mobile: 'text-mobile-body-md' },
    placeholder: {
      true: 'min-w-px flex-1 truncate font-normal text-semantic-text-placeholder',
      false: 'shrink-0 font-medium text-semantic-text-primary',
    },
    /** Figma binds semantic `text-quaternary` here, not `text-disabled`. */
    disabled: { true: 'text-semantic-text-quaternary' },
  },
  defaultVariants: { device: 'desktop', placeholder: false, disabled: false },
});

/**
 * The supporting text beside the value. Hugs, never truncates.
 *
 * 14/20/400 in `text-secondary` at both devices, from different Figma groups —
 * `Group/Desktop/Caption-md-Regular` and `Group/Mobile/Body-md-Regular`.
 */
export const inputDropdownSupportingVariants = defineVariants(
  'shrink-0 font-normal text-semantic-text-secondary',
  {
    variants: {
      device: { desktop: 'text-desktop-caption-md', mobile: 'text-mobile-body-md' },
    },
    defaultVariants: { device: 'desktop' },
  },
);

/**
 * The chevron box. **16px at both devices** — Figma does not scale it.
 *
 * Not rotated when open: Figma's Open variant draws the same downward chevron, so
 * rotating it would add a visual state the file does not contain.
 */
export const inputDropdownChevronVariants = defineVariants(
  'inline-flex size-semantic-xl shrink-0 items-center justify-center overflow-clip text-semantic-fg-quinary *:size-full',
);

/**
 * The hint line.
 *
 * `text-secondary` — not the `text-quaternary` Input and Textarea use. It never
 * recolours, because this component has no error state to recolour for.
 */
export const inputDropdownHintVariants = defineVariants(
  'w-full font-normal text-semantic-text-secondary',
  {
    variants: {
      device: { desktop: 'text-desktop-caption-md', mobile: 'text-mobile-body-sm' },
    },
    defaultVariants: { device: 'desktop' },
  },
);

/* -------------------------------------------------------------------------- */
/* Menu                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The menu.
 *
 * A sibling in the root's column, matching Figma, which places it in flow rather
 * than as an overlay — so opening grows the component instead of floating over the
 * page.
 *
 * `max-height` is a **maximum**, not a fixed height: the menu hugs its content
 * below it. Desktop content lands at exactly 320 (`8 + 5×56 + 4×6 + 8`), which is
 * why Figma left desktop `overflow-clip` and only gave mobile `overflow-y-auto`.
 * Both scroll here — a menu that silently clips its sixth option is a defect, not
 * a measurement.
 *
 * The stroke is an `inset-ring` for the same reason as the field: Figma's items
 * measure 304 inside a 320 menu with `p-8`, which leaves no room for a border box.
 *
 * The shadow is `shadow-elevation-4` from the Elevation foundation — the exact
 * two-layer effect Figma binds here, so no arbitrary value and no exception. No
 * `shadow-<color>` utility sits beside it: that would set `--tw-shadow-color` and
 * repaint both layers.
 */
export const inputDropdownMenuVariants = defineVariants(
  [
    'flex w-full flex-col items-start overflow-x-clip overflow-y-auto rounded-md',
    'bg-semantic-bg-primary p-semantic-md',
    'inset-ring inset-ring-semantic-border-secondary',
    'shadow-elevation-4',
  ],
  {
    variants: {
      device: {
        // max-h-80 is 320px and max-h-64 is 256px on the primitive scale; semantic
        // spacing stops at 11xl 160px, so both are documented exceptions.
        desktop: 'max-h-80 gap-semantic-sm',
        mobile: 'max-h-64 gap-semantic-md',
      },
    },
    defaultVariants: { device: 'desktop' },
  },
);

/**
 * A menu item.
 *
 * Figma's item set varies four things at once between its resting and emphasised
 * treatments, and only on desktop: radius `sm` 6 → `xl` 12, weight 400 → 500,
 * background none → filled, and the row gap. Mobile holds `radius-md` 8 and
 * weight 400 throughout. Reproduced as measured, per the recorded decision.
 *
 * `active` covers both pointer hover and keyboard highlight. Figma publishes
 * `state=hover` but never places it in a menu and defines no keyboard-active
 * treatment, so one visual state serves both — which is also the only way a single
 * row can be highlighted at a time.
 *
 * `selected` and `disabled` are declared after `active` so they win on ordering,
 * matching Figma, where a disabled row keeps its own surface.
 */
export const inputDropdownMenuItemVariants = defineVariants(
  ['flex w-full items-center gap-semantic-lg text-left', 'transition-colors'],
  {
    variants: {
      device: { desktop: 'p-semantic-xl', mobile: 'rounded-md p-semantic-lg' },
      active: { true: 'bg-semantic-bg-active' },
      /** Figma binds `Colors/brand/25`, for which no semantic token exists. */
      selected: { true: 'bg-brand-25' },
      disabled: {
        true: 'cursor-not-allowed bg-semantic-bg-disabled-subtle',
        false: 'cursor-pointer',
      },
    },
    compoundVariants: [
      // Desktop radius is the resting `radius-sm` 6 and the emphasised
      // `radius-xl` 12; mobile is `radius-md` 8 in every state.
      { device: 'desktop', active: false, selected: false, disabled: false, class: 'rounded-sm' },
      { device: 'desktop', active: true, class: 'rounded-xl' },
      { device: 'desktop', selected: true, class: 'rounded-xl' },
      { device: 'desktop', disabled: true, class: 'rounded-xl' },
    ],
    defaultVariants: { device: 'desktop', active: false, selected: false, disabled: false },
  },
);

/**
 * Figma "Text and supporting text": fills, gap `spacing-md` 8.
 *
 * Multi-select puts a Checkbox in front of the text and widens the desktop gap to
 * `spacing-lg` 12; mobile keeps 8. That is the only measured difference between the
 * two types at this slot.
 */
export const inputDropdownMenuItemContentVariants = defineVariants(
  'flex min-w-px flex-1 items-center gap-semantic-md',
  {
    variants: {
      device: { desktop: '', mobile: '' },
      type: { default: '', multiSelect: '' },
    },
    compoundVariants: [{ device: 'desktop', type: 'multiSelect', class: 'gap-semantic-lg' }],
    defaultVariants: { device: 'desktop', type: 'default' },
  },
);

/** The label beside its supporting text. Gap `spacing-md` 8 desktop, `spacing-xs` 4 mobile. */
export const inputDropdownMenuItemTextVariants = defineVariants(
  'flex min-w-px flex-1 items-center',
  {
    variants: {
      device: { desktop: 'gap-semantic-md', mobile: 'gap-semantic-xs' },
    },
    defaultVariants: { device: 'desktop' },
  },
);

/**
 * The item label.
 *
 * Weight tracks the emphasised treatment, and the two devices disagree about
 * hover: desktop goes Medium on hover, mobile stays Regular. Both are reproduced
 * as measured.
 */
export const inputDropdownMenuItemLabelVariants = defineVariants(
  'shrink-0 truncate text-semantic-text-primary',
  {
    variants: {
      device: { desktop: 'text-desktop-body-sm', mobile: 'text-mobile-body-md' },
      emphasised: { true: 'font-medium', false: 'font-normal' },
      disabled: { true: 'text-semantic-text-quaternary' },
    },
    defaultVariants: { device: 'desktop', emphasised: false, disabled: false },
  },
);

/**
 * The item supporting text.
 *
 * Mobile is 12/**18**, which only `--text-mobile-banner-body-lg` carries — the
 * value is exact, the token name belongs to a banner. Desktop is 14/20 from
 * `Marketing/Desktop/Caption-md-Regular`, a second Figma group with values
 * identical to the `Group/…` one the hint uses.
 */
export const inputDropdownMenuItemSupportingVariants = defineVariants(
  'shrink-0 font-normal text-semantic-text-secondary',
  {
    variants: {
      device: { desktop: 'text-desktop-caption-md', mobile: 'text-mobile-banner-body-lg' },
      disabled: { true: 'text-semantic-text-quaternary' },
    },
    defaultVariants: { device: 'desktop', disabled: false },
  },
);

/** The selected tick. 20px desktop, 16px mobile — this one Figma does scale. */
export const inputDropdownMenuItemTickVariants = defineVariants(
  'inline-flex shrink-0 items-center justify-center text-semantic-fg-brand-primary *:size-full',
  {
    variants: {
      device: { desktop: 'size-semantic-2xl', mobile: 'size-semantic-xl' },
    },
    defaultVariants: { device: 'desktop' },
  },
);

export type InputDropdownVariantProps = VariantProps<typeof inputDropdownFieldVariants>;
