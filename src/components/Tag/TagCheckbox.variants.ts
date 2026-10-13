import { defineVariants, type VariantProps } from '@utils/variants';

/**
 * Styling for the checkbox inside a Tag, declared as data.
 *
 * Measured from Figma `_Tag checkbox` (node 3308:406033, 24 variants):
 * `Checked` × `Size` × `State` (Default, Hover, Focused, `Disbaled` — Figma's
 * spelling, corrected here).
 *
 * This is **not** the design system's Checkbox. It is private to Tag: `_`-prefixed
 * in Figma, sized 14/16/18 against a 4px radius, and reachable only through Tag's
 * `selectable` prop.
 *
 * `Checkbox` now exists and this stayed separate on measured evidence — a different
 * size scale, a constant radius, a brand stroke when checked, a hover that darkens,
 * `inset-ring` instead of a border, and no indeterminate state. See `TagCheckbox.tsx`
 * for the full comparison and `Checkbox.test.tsx` for the tests that pin it.
 *
 * The state model is real, which is why this is its own file rather than 24 more
 * rows in Tag's table — but note that Tag's own published variants only ever
 * instantiate `Checked=False, State=Default`, so everything below is reachable
 * through our API and through no Figma variant.
 */
export const tagCheckboxVariants = defineVariants(
  [
    'inline-flex shrink-0 items-center justify-center overflow-clip rounded-xs',
    // Inside-aligned stroke, like every other stroke in the library. The box is a
    // fixed size, so a CSS border would also work here — `inset-ring` keeps the
    // technique uniform and survives the box becoming content-sized later.
    'inset-ring inset-ring-semantic-border-primary',
    'bg-semantic-bg-primary',
    'transition-colors',
    // Figma draws the focus ring as `0 0 0 2px bg-primary, 0 0 0 4px focus-ring` —
    // exactly what `focusRing` emits. Reused rather than restated.
    'outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus-ring',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-semantic-bg-primary',
    'disabled:cursor-not-allowed',
  ],
  {
    variants: {
      size: {
        // 16 is `spacing-semantic-xl`; 14 and 18 land on no step of any scale.
        sm: 'size-[14px]',
        md: 'size-semantic-xl',
        lg: 'size-[18px]',
      },
      checked: {
        // Figma binds Colors/brand/600 to both fill and stroke, and brand/700 on
        // hover. `bg-brand-solid` and `border-brand-alt` alias exactly those.
        true: [
          'bg-semantic-bg-brand-solid inset-ring-semantic-border-brand-alt',
          'text-semantic-fg-white',
          // Hover moves both fill and stroke to brand/700. `bg-brand-solid-hover`
          // aliases it for the fill; no `border-*` token resolves to brand/700, so
          // the stroke reads `utility-brand-700` — the semantic layer's own escape
          // hatch for a value with no role token — rather than the raw primitive.
          'hover:bg-semantic-bg-brand-solid-hover',
          'hover:inset-ring-semantic-utility-brand-700',
        ],
        // Unchecked hover is byte-identical to unchecked Default in all 6 Figma
        // variants, so there is deliberately no hover rule here.
        false: '',
      },
      disabled: {
        // Disabled keeps the resting stroke and greys the surface, checked or not.
        // Declared last so it wins over `checked`.
        true: [
          'bg-semantic-bg-disabled-subtle inset-ring-semantic-border-primary',
          'text-semantic-fg-disabled-subtle',
          'hover:bg-semantic-bg-disabled-subtle',
          'hover:inset-ring-semantic-border-primary',
        ],
      },
    },
    defaultVariants: { size: 'sm', checked: false, disabled: false },
  },
);

/**
 * The tick box. 10/12/14 — it scales with the checkbox but not proportionally.
 *
 * Centred by the flex parent rather than Figma's absolute transform: with a single
 * child the two are equivalent, and flex centring does not need `relative`.
 */
export const tagCheckboxTickVariants = defineVariants('*:size-full', {
  variants: {
    size: { sm: 'size-[10px]', md: 'size-semantic-lg', lg: 'size-[14px]' },
  },
  defaultVariants: { size: 'sm' },
});

export type TagCheckboxVariantProps = VariantProps<typeof tagCheckboxVariants>;
