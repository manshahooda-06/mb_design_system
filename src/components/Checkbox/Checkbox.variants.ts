import { defineVariants, type VariantProps } from '@utils/variants';

/**
 * Styling for Checkbox, declared as data.
 *
 * Measured from Figma `Checkbox` (node 1097:63652). That set publishes **72**
 * variants across six axes, of which **40 are `Type=Checkbox`** and implemented
 * here: 24 with `Text=False` (unchecked, checked and indeterminate × 2 sizes × 4
 * states) and 16 with `Text=True` (no indeterminate variant is published with a
 * label). The other 32 are `Type=Radio` — a different control with a different
 * interaction model, not a variant of this one. See docs/Components.md.
 *
 * Figma's `State` axis is not a prop. Hover and focus are CSS and `Disabled`
 * arrives as `disabled`, so 12 rendered prop combinations × 4 CSS states cover the
 * published 40.
 *
 * The native input carries semantics, form participation and keyboard behaviour; the
 * box beside it does all the painting. Only the **focus ring** is driven off the
 * input with `peer-focus-visible:`, because `:focus-visible` is genuinely a CSS state
 * and the box is a direct sibling of the input, which is what `peer-*` requires.
 * Everything else is a variant axis: the component tracks `checked` itself, so an
 * uncontrolled checkbox repaints without a `peer` selector having to reach a
 * grandchild — which it cannot do.
 *
 * Two measured behaviours that look like omissions:
 *
 * - **`State=Hover` is a complete no-op**, in every one of the 18 cells, checked and
 *   unchecked alike. So no hover rule appears anywhere in this file.
 * - **Radius varies with size** — 2 at `sm`, 4 at `md` — while the box only grows
 *   16 → 20.
 *
 * Figma binds **no shadow** to any of the 72, so no elevation token is consumed. The
 * only effect in the set is the focus ring, which `focusRing`'s geometry reproduces
 * exactly; it is spelled out with `peer-focus-visible:` here because the ring paints
 * on the box while focus lands on the input.
 */

/**
 * **Intentionally not shared with Radio. Please do not merge them.**
 *
 * Checkbox and Radio agree on several measured values today — box/circle sizes, the
 * three fills, the border colour, the focus ring and the entire label row — and it is
 * tempting to lift that into a shared surface. It was considered and rejected: the
 * library extracts only on **proven structural reuse across components**, never
 * because values happen to match at one point in time.
 *
 * They are different controls with different semantics, and they already diverge:
 *
 * | | Checkbox | Radio |
 * | --- | --- | --- |
 * | Radius | 2 at `sm`, 4 at `md` | `rounded-full` always |
 * | Indicator | a caller-supplied 12/14 glyph | its own 6/8 filled circle |
 * | Indeterminate | 8 published variants | none |
 * | Exceptions | 1 (`size-[14px]`) | 0 |
 * | Selection | independent | mutually exclusive within a `name` group |
 *
 * A shared module would couple two components that will keep evolving apart, and the
 * first Figma change to either would force an awkward split. `Checkbox.test.tsx`
 * asserts that neither file imports the other, and `Radio.variants.ts` carries the
 * mirror of this note.
 *
 * The same reasoning, with its own six differences, keeps `TagCheckbox` separate —
 * see `TagCheckbox.tsx`.
 */

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The row: control, then label and supporting text. Only rendered when labelled —
 * Figma's `Text=False` root is the bare box with no wrapper and no offset.
 *
 * `items-start`, measured: Figma puts the `Input` frame at y=0 in a 40/50-tall row.
 * The control's own optical alignment is handled by {@link checkboxControlVariants}
 * rather than by centring the row, because centring would follow the *block* and
 * Figma follows the *first line*.
 */
// `font-sans` is stated, not inherited: `embed.css` ships no preflight, so in a host app
// this text would render in whatever family that app uses. See docs/Components.md.
export const checkboxRootVariants = defineVariants('flex w-full items-start font-sans', {
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
 * Figma's `Input` frame — a `<label>`, so clicking the box toggles natively.
 *
 * Its only job is the 2px top offset, which is why it exists at all. Figma sizes it
 * 16×18 at `sm` and 20×22 at `md` with the box at y=2, and that 2 is
 * `(line-height − box) / 2` in both sizes: (20−16)/2 and (24−20)/2. The control is
 * optically centred on the **first line of text**, not on the text block — with two
 * lines those differ by 13px at `md`.
 *
 * The offset is applied only when there is a label, matching Figma: with
 * `Text=False` the root is exactly 16×16 or 20×20 with no wrapper at all.
 *
 * `relative` is not needed for the offset but is what scopes the visually hidden
 * input, which is absolutely positioned.
 */
export const checkboxControlVariants = defineVariants('inline-flex shrink-0', {
  variants: {
    labelled: {
      true: 'pt-semantic-xxs' /* 2 — centres the box on the first line */,
      false: '',
    },
  },
  defaultVariants: { labelled: false },
});

/**
 * The native input: present, focusable, form-associated — and invisible.
 *
 * `sr-only` rather than `opacity-0` or `appearance-none`. `appearance-none` would
 * let the input *be* the box, but an `<input>` cannot have children and the glyph is
 * a caller-supplied node, so the box has to be a separate element. `sr-only` is
 * absolutely positioned, so it contributes nothing to the wrapper's size — the
 * wrapper measures exactly the box.
 *
 * `peer` is what lets the box read the input's state. The input must therefore stay
 * *before* the box in the DOM.
 */
export const checkboxInputVariants = defineVariants('peer sr-only disabled:cursor-not-allowed');

/* -------------------------------------------------------------------------- */
/* Box                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The painted box.
 *
 * A real CSS `border`, not `inset-ring`. Figma declares `border border-solid` here,
 * and unlike Tag or Toggle the box is a fixed size, so the border costs no layout:
 * `border-box` keeps the outer size at 16/20 either way.
 *
 * **The width follows Figma exactly rather than staying 1px and going transparent.**
 * Figma drops the stroke entirely on checked and indeterminate, so those states get
 * `border-0`; unchecked and disabled keep the 1px stroke. Both spellings render
 * identically — the glyph is flex-centred, so it lands on Figma's 2px/3px inset
 * whether the border is 1px or 0 (verified in the browser) — but only `border-0`
 * also *measures* the way Figma declares it.
 *
 * `text-*` sets the glyph colour, which the glyph inherits through `currentColor` —
 * so `fg-white` when filled and `fg-disabled-subtle` when disabled reach the icon
 * without the icon needing its own variant.
 *
 * The focus ring is `focusRing`'s geometry — 2px `bg-primary` then 4px `focus-ring`,
 * measured off Figma as a 2px gap and 2px of visible blue — restated with
 * `peer-focus-visible:` because focus lands on the input and the ring paints here.
 */
export const checkboxBoxVariants = defineVariants(
  [
    'pointer-events-none inline-flex shrink-0 items-center justify-center',
    'overflow-clip transition',
    // Figma draws no hover treatment in any of the 18 cells, so there is none here.
    'peer-focus-visible:ring-2 peer-focus-visible:ring-semantic-focus-ring',
    'peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-semantic-bg-primary',
  ],
  {
    variants: {
      size: {
        // Radius is not proportional to the box — 2 against 16, then 4 against 20.
        sm: 'size-semantic-xl rounded-xxs' /* 16 · 2 */,
        md: 'size-semantic-2xl rounded-xs' /* 20 · 4 */,
      },
      /**
       * Checked and indeterminate paint identically — Figma only ever publishes
       * `Indeterminate=True` alongside `Checked=True`, and the two differ by glyph
       * alone. So one axis, not two.
       */
      filled: {
        // No stroke at all when filled — Figma drops it, so the width goes to 0.
        true: 'border-0 bg-semantic-bg-brand-solid text-semantic-fg-white',
        false: 'border border-semantic-border-primary bg-semantic-bg-primary',
      },
      disabled: { true: '', false: '' },
    },
    compoundVariants: [
      // Disabled collapses the filled axis for the surface but keeps the glyph,
      // greyed — and brings the 1px stroke back, which Figma draws on every disabled
      // variant whether checked or not. Declared here so it wins over `filled`.
      {
        disabled: true,
        class: [
          'border border-semantic-border-primary',
          'bg-semantic-bg-disabled-subtle',
          'text-semantic-fg-disabled-subtle',
        ],
      },
    ],
    defaultVariants: { size: 'sm', filled: false, disabled: false },
  },
);

/**
 * The glyph box — `tick-02` when checked, `remove-01` when indeterminate.
 *
 * 12 at `sm` and 14 at `md`, which Figma expresses as a 12.5% and 15% inset of the
 * box. 12 is `spacing-semantic-lg`; **14 lands on no step of any scale**, and
 * `size-[14px]` is already in `DOCUMENTED_EXCEPTIONS` for Tag's glyph ramp, so
 * reusing it here adds nothing to the list.
 *
 * `*:size-full` stretches a caller's `<svg>` to fill the box, so the glyph is sized
 * by the design system rather than by whatever viewBox the caller passes.
 */
export const checkboxIconVariants = defineVariants('pointer-events-none *:size-full', {
  variants: {
    size: {
      sm: 'size-semantic-lg' /* 12 */,
      md: 'size-[14px]',
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
export const checkboxTextVariants = defineVariants(
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
 * `cursor-pointer` because it is a real `<label>`: clicking it toggles the input.
 */
export const checkboxLabelVariants = defineVariants(
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
 * Deliberately **not** dimmed when disabled: Figma leaves both text colours
 * untouched across all four states, verified by sampling rendered pixels rather than
 * by reading bindings. Recorded as a Figma inconsistency and reproduced as drawn.
 *
 * Not inside the `<label>`, so it does not join the accessible name — it is wired up
 * with `aria-describedby` instead.
 */
export const checkboxSupportingTextVariants = defineVariants(
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

export type CheckboxVariantProps = VariantProps<typeof checkboxBoxVariants>;
