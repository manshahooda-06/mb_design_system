import { defineVariants, type VariantProps } from '@utils/variants';

/**
 * Styling for Radio, declared as data.
 *
 * Measured from Figma `Checkbox` (node 1097:63652), `Type=Radio` only — **32
 * published variants**: `Checked`(2) × `Size`(2) × `Text`(2) × `State`(4), which is 8
 * cells with all four states each. `Indeterminate` is a live axis on all 32 and is
 * always `False`; a radio has no mixed state.
 *
 * Figma's `State` axis is not a prop. Hover and focus are CSS and `Disabled` arrives
 * as `disabled`, so 8 rendered prop combinations × 4 CSS states cover the 32.
 *
 * See the note below on why none of this is shared with Checkbox.
 *
 * Two measured behaviours that look like omissions:
 *
 * - **`State=Hover` is a complete no-op**, in all 8 cells, selected and unselected.
 *   So no hover rule appears anywhere in this file.
 * - **The dot is not a constant proportion of the circle** — Figma insets it 31.25%
 *   at `sm` and 30% at `md`, so it is sized absolutely (6 and 8) rather than by
 *   percentage. Both land on the semantic spacing scale.
 *
 * Figma binds **no shadow** to any of the 32, so no elevation token is consumed. The
 * only effect in the set is the focus ring, whose geometry `focusRing` reproduces
 * exactly; it is spelled out with `peer-focus-visible:` because the ring paints on
 * the circle while focus lands on the input.
 *
 * **Zero documented exceptions.** Every value is a semantic token or an allowlisted
 * radius primitive — the first component in the library to need nothing from
 * `DOCUMENTED_EXCEPTIONS`.
 */

/**
 * **Intentionally not shared with Checkbox. Please do not merge them.**
 *
 * Radio and Checkbox agree on several measured values today — circle/box sizes, the
 * three fills, the border colour, the focus ring and the entire label row — and it is
 * tempting to lift that into a shared surface. It was considered and rejected: the
 * library extracts only on **proven structural reuse across components**, never
 * because values happen to match at one point in time.
 *
 * They are different controls with different semantics, and they already diverge:
 *
 * | | Radio | Checkbox |
 * | --- | --- | --- |
 * | Radius | `rounded-full` always | 2 at `sm`, 4 at `md` |
 * | Indicator | its own 6/8 filled circle | a caller-supplied 12/14 glyph |
 * | Indeterminate | none | 8 published variants |
 * | Exceptions | 0 | 1 (`size-[14px]`) |
 * | Selection | mutually exclusive within a `name` group | independent |
 *
 * A shared module would couple two components that will keep evolving apart, and the
 * first Figma change to either would force an awkward split. `Radio.test.tsx` asserts
 * that neither file imports the other, and `Checkbox.variants.ts` carries the mirror
 * of this note.
 */

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The row: control, then label and supporting text. Only rendered when labelled —
 * Figma's `Text=False` root is the bare circle with no wrapper and no offset.
 *
 * `items-start`, measured: Figma puts the `Input` frame at y=0 in a 40/50-tall row.
 * The circle's optical alignment is handled by {@link radioControlVariants} instead,
 * because centring the row would follow the *block* where Figma follows the *first
 * line*.
 */
// `font-sans` is stated, not inherited: `embed.css` ships no preflight, so in a host app
// this text would render in whatever family that app uses. See docs/Components.md.
export const radioRootVariants = defineVariants('flex w-full items-start font-sans', {
  variants: {
    size: {
      sm: 'gap-semantic-md' /* 8 */,
      md: 'gap-semantic-lg' /* 12 */,
    },
  },
  defaultVariants: { size: 'sm' },
});

/* -------------------------------------------------------------------------- */
/* Control                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Figma's `Input` frame — a `<label>`, so clicking the circle selects natively.
 *
 * Its only job is the 2px top offset. Figma sizes it 16×18 at `sm` and 20×22 at `md`
 * with the circle at y=2, and that 2 is `(line-height − box) / 2` in both sizes:
 * (20−16)/2 and (24−20)/2. The circle is optically centred on the **first line of
 * text**, not on the block — with two lines those differ by 13px at `md`.
 *
 * Applied only when there is a label, matching Figma: with `Text=False` the root is
 * exactly 16×16 or 20×20 and has no wrapper at all.
 */
export const radioControlVariants = defineVariants('inline-flex shrink-0', {
  variants: {
    labelled: {
      true: 'pt-semantic-xxs' /* 2 — centres the circle on the first line */,
      false: '',
    },
  },
  defaultVariants: { labelled: false },
});

/**
 * The native input: present, focusable, form-associated, group-forming — and
 * invisible.
 *
 * `sr-only` rather than `opacity-0` or `appearance-none`. An `<input>` cannot have
 * children, and the dot has to live inside the circle, so the circle is a separate
 * element. `sr-only` is absolutely positioned and contributes nothing to the
 * wrapper's size, so the wrapper measures exactly the circle.
 *
 * `peer` is what lets the circle read `:focus-visible` off the input, so the input
 * must stay *before* the circle in the DOM.
 */
export const radioInputVariants = defineVariants('peer sr-only disabled:cursor-not-allowed');

/* -------------------------------------------------------------------------- */
/* Circle                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The painted circle.
 *
 * A real CSS `border`, as Figma declares, and the box is a fixed size so the border
 * costs no layout — `border-box` keeps the outer size at 16/20 either way.
 *
 * The width follows Figma exactly rather than staying 1px and going transparent:
 * selected drops the stroke entirely (`border-0`), and **disabled brings it back**
 * whether selected or not. Measured in all 16 `Text=False` cells.
 *
 * `text-*` sets the dot's colour, which the dot picks up through `bg-current` — so
 * `fg-white` when selected and `fg-disabled-subtle` when disabled reach the dot
 * without it needing a colour axis of its own.
 *
 * The focus ring is `focusRing`'s geometry — 2px `bg-primary` then 4px `focus-ring`,
 * measured off Figma as a 2px gap and 2px of visible blue — restated with
 * `peer-focus-visible:` because focus lands on the input and the ring paints here.
 */
export const radioCircleVariants = defineVariants(
  [
    'pointer-events-none inline-flex shrink-0 items-center justify-center',
    // Every Radio variant is a full circle; unlike Checkbox the radius does not
    // move with size.
    'rounded-full overflow-clip transition',
    // Figma draws no hover treatment in any of the 8 cells, so there is none here.
    'peer-focus-visible:ring-2 peer-focus-visible:ring-semantic-focus-ring',
    'peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-semantic-bg-primary',
  ],
  {
    variants: {
      size: {
        sm: 'size-semantic-xl' /* 16 */,
        md: 'size-semantic-2xl' /* 20 */,
      },
      selected: {
        // No stroke at all when selected — Figma drops it, so the width goes to 0.
        true: 'border-0 bg-semantic-bg-brand-solid text-semantic-fg-white',
        false: 'border border-semantic-border-primary bg-semantic-bg-primary',
      },
      disabled: { true: '', false: '' },
    },
    compoundVariants: [
      // Disabled collapses the selected axis for the surface but keeps the dot,
      // greyed — and brings the 1px stroke back, which Figma draws on every disabled
      // variant whether selected or not. Declared here so it wins over `selected`.
      {
        disabled: true,
        class: [
          'border border-semantic-border-primary',
          'bg-semantic-bg-disabled-subtle',
          'text-semantic-fg-disabled-subtle',
        ],
      },
    ],
    defaultVariants: { size: 'sm', selected: false, disabled: false },
  },
);

/**
 * The dot.
 *
 * 6 at `sm` and 8 at `md`, both on the semantic spacing scale. Figma expresses these
 * as a 31.25% and a 30% inset of the circle — not the same ratio — so absolute sizes
 * are the faithful reading as well as the tokenised one.
 *
 * `bg-current` takes the colour the circle sets, which is what makes the disabled dot
 * automatic: white on brand when selected, `fg-disabled-subtle` when not.
 *
 * Centred by the flex parent rather than Figma's absolute inset. With a single child
 * the two are equivalent, and flex centring needs no `relative`.
 */
export const radioDotVariants = defineVariants('pointer-events-none rounded-full bg-current', {
  variants: {
    size: {
      sm: 'size-semantic-sm' /* 6 */,
      md: 'size-semantic-md' /* 8 */,
    },
  },
  defaultVariants: { size: 'sm' },
});

/* -------------------------------------------------------------------------- */
/* Text                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Figma's "Text and supporting text" frame.
 *
 * The label/supporting gap is 0 at `sm` and 2 at `md` — measured, and one of the few
 * places the size axis is not proportional. `min-w-semantic-none` does the job of
 * Tailwind's idiomatic `min-w-0`; the `0` spelling is a spacing primitive the token
 * rule forbids, and the semantic scale publishes a `none` step.
 */
export const radioTextVariants = defineVariants(
  'flex min-w-semantic-none flex-1 flex-col items-start',
  {
    variants: {
      size: {
        sm: 'gap-semantic-none' /* 0 */,
        md: 'gap-semantic-xxs' /* 2 */,
      },
    },
    defaultVariants: { size: 'sm' },
  },
);

/**
 * The label. 14/20 at `sm`, 16/24 at `md`, weight 500 in both.
 *
 * Figma's size axis crosses type scales — `sm` binds the Mobile ramp and `md` the
 * Desktop one — so these token names look mismatched and are correct. Figma's
 * variable groups are `Group/Mobile/Body-md` and `Group/Desktop/Body-sm`.
 *
 * `cursor-pointer` because it is a real `<label>`: clicking it selects the radio.
 */
export const radioLabelVariants = defineVariants(
  'cursor-pointer font-medium break-words text-semantic-text-primary',
  {
    variants: {
      size: {
        sm: 'text-mobile-body-md' /* 14/20 */,
        md: 'text-desktop-body-sm' /* 16/24 */,
      },
    },
    defaultVariants: { size: 'sm' },
  },
);

/**
 * The supporting line. Same metrics as the label at weight 400.
 *
 * Deliberately **not** dimmed when disabled: Figma leaves both text colours untouched
 * across all four states, verified by sampling rendered pixels rather than by reading
 * bindings. Recorded as a Figma inconsistency and reproduced as drawn.
 *
 * Outside the `<label>`, so it does not join the accessible name — it is wired up
 * with `aria-describedby` instead.
 */
export const radioSupportingTextVariants = defineVariants(
  'font-regular break-words text-semantic-text-secondary',
  {
    variants: {
      size: {
        sm: 'text-mobile-body-md' /* 14/20 */,
        md: 'text-desktop-body-sm' /* 16/24 */,
      },
    },
    defaultVariants: { size: 'sm' },
  },
);

export type RadioVariantProps = VariantProps<typeof radioCircleVariants>;
