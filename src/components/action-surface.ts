/**
 * The `variant` × `tone` surface shared by every action control.
 *
 * Button and IconButton draw from the same Figma token families and must react
 * to `variant` and `tone` identically — an outlined destructive icon button has
 * to be the same colour as an outlined destructive button. Only their box
 * differs: one is padded to its label, the other is square.
 *
 * So the colour, focus and disabled rules live here and are spread into both CVA
 * configs, while each component keeps its own base, sizes and layout. Extracted
 * when the second consumer arrived, not in anticipation of one.
 *
 * Every entry is keyed solely on `variant` and `tone`, which is what makes it
 * portable: a component adopting this surface only has to declare those two
 * axes with the same option names.
 */

/** The emphasis axis: filled, outlined, ghost. */
export type ActionVariant = 'primary' | 'secondary' | 'tertiary';

/** The intent axis. Figma's own word for the brand tone is `color`. */
export type ActionTone = 'default' | 'color' | 'error';

/**
 * Structural classes every action control shares.
 *
 * **No `border`.** Figma strokes are inside-aligned: a Secondary button with a
 * 1px stroke is exactly the same 155x40 frame as a Primary without one. A CSS
 * `border` is laid out *outside* the content box (CSS Box Model §8), so it adds
 * 2px of height that Figma never has. Outlined variants use `inset-ring`
 * instead — `box-shadow: inset 0 0 0 1px`, which paints inside the border box
 * and contributes nothing to layout. That reproduces Figma's stroke exactly and
 * lets height fall out of padding + line-height alone.
 *
 * `shadow-elevation-1` composes into the same box-shadow chain as the inset ring
 * and the focus ring, so all three coexist. It is the lowest level the Elevation
 * foundation publishes, and Elevation is the only shadow foundation.
 *
 * `overflow-clip` matches Figma's own `overflow-clip` on the button frame, and
 * stops a long label escaping its container.
 */
export const actionSurfaceBase = [
  'inline-flex items-center justify-center',
  'overflow-clip',
  'shadow-elevation-1',
  'transition-colors',
  // Tailwind v4's preflight dropped the `cursor: pointer` that v3 applied to
  // buttons, so without this every control renders with an arrow.
  'cursor-pointer',
  'disabled:cursor-not-allowed aria-disabled:cursor-not-allowed',
];

/**
 * One entry per rule. Typed structurally rather than against a CVA schema so it
 * can be spread into any config declaring `variant` and `tone`.
 */
type SurfaceRule = {
  variant?: ActionVariant | ActionVariant[];
  tone?: ActionTone;
  loading?: boolean;
  class: string | string[];
};

/**
 * Colour, focus and disabled, keyed by both axes.
 *
 * Colour depends on emphasis *and* intent, so it cannot live in either axis
 * alone — hence compound rules rather than a flat variant map.
 *
 * There are eight colour rules, not nine: Figma defines no `primary` + `color`,
 * because `button-primary-bg` already resolves to `brand-600` and the two would
 * render identically. Components make that pair unrepresentable in their props.
 *
 * Hover classes are emitted even where the Figma hover token currently resolves
 * to its resting value — five do. Emitting them anyway means a future Figma
 * change where they diverge is picked up with no code change.
 */
export const actionSurfaceCompounds: SurfaceRule[] = [
  /* Focus ring follows tone, not variant: a destructive action gets the error
     ring whether it is filled, outlined or ghost. The ring strings are inlined
     rather than imported from `@utils/a11y` so this module stays a pure data
     table; the offset colour matches the default page surface either way. */
  {
    tone: 'default',
    class:
      'outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus-ring ' +
      'focus-visible:ring-offset-2 focus-visible:ring-offset-semantic-bg-primary',
  },
  {
    tone: 'color',
    class:
      'outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus-ring ' +
      'focus-visible:ring-offset-2 focus-visible:ring-offset-semantic-bg-primary',
  },
  {
    tone: 'error',
    class:
      'outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus-ring-error ' +
      'focus-visible:ring-offset-2 focus-visible:ring-offset-semantic-bg-primary',
  },

  /* Disabled. Filled and outlined take the disabled surface; a ghost control has
     no surface to grey out, so only its foreground changes. */
  {
    variant: ['primary', 'secondary'],
    class: [
      'disabled:bg-semantic-bg-disabled disabled:text-semantic-fg-disabled',
      'disabled:inset-ring-semantic-border-disabled',
      'aria-disabled:bg-semantic-bg-disabled aria-disabled:text-semantic-fg-disabled',
      'aria-disabled:inset-ring-semantic-border-disabled',
    ],
  },
  {
    variant: 'tertiary',
    class: 'disabled:text-semantic-fg-disabled aria-disabled:text-semantic-fg-disabled',
  },

  /* primary — filled */
  {
    variant: 'primary',
    tone: 'default',
    class: [
      'bg-semantic-button-primary-bg text-semantic-button-primary-fg',
      'hover:bg-semantic-button-primary-bg-hover hover:text-semantic-button-primary-fg-hover',
    ],
  },
  {
    variant: 'primary',
    tone: 'error',
    class: [
      'bg-semantic-button-primary-error-bg text-semantic-button-primary-error-fg',
      'hover:bg-semantic-button-primary-error-bg-hover',
      'hover:text-semantic-button-primary-error-fg-hover',
    ],
  },

  /* secondary — outlined */
  {
    variant: 'secondary',
    tone: 'default',
    class: [
      'bg-semantic-button-secondary-bg text-semantic-button-secondary-fg',
      'inset-ring inset-ring-semantic-button-secondary-border',
      'hover:bg-semantic-button-secondary-bg-hover',
      'hover:text-semantic-button-secondary-fg-hover',
      'hover:inset-ring-semantic-button-secondary-border-hover',
    ],
  },
  {
    variant: 'secondary',
    tone: 'color',
    class: [
      'bg-semantic-button-secondary-color-bg text-semantic-button-secondary-color-fg',
      'inset-ring inset-ring-semantic-button-secondary-color-border',
      'hover:bg-semantic-button-secondary-color-bg-hover',
      'hover:text-semantic-button-secondary-color-fg-hover',
      'hover:inset-ring-semantic-button-secondary-color-border-hover',
    ],
  },
  {
    variant: 'secondary',
    tone: 'error',
    class: [
      'bg-semantic-button-secondary-error-bg text-semantic-button-secondary-error-fg',
      'inset-ring inset-ring-semantic-button-secondary-error-border',
      'hover:bg-semantic-button-secondary-error-bg-hover',
      'hover:text-semantic-button-secondary-error-fg-hover',
      'hover:inset-ring-semantic-button-secondary-error-border-hover',
    ],
  },

  /* tertiary — ghost. Figma emits only `tertiary-*-bg-hover` and no resting
     `bg` token, which is what makes the transparent rest state explicit. */
  {
    variant: 'tertiary',
    tone: 'default',
    class: [
      'text-semantic-button-tertiary-fg',
      'hover:bg-semantic-button-tertiary-bg-hover',
      'hover:text-semantic-button-tertiary-fg-hover',
    ],
  },
  {
    variant: 'tertiary',
    tone: 'color',
    class: [
      'text-semantic-button-tertiary-color-fg',
      'hover:bg-semantic-button-tertiary-color-bg-hover',
      'hover:text-semantic-button-tertiary-color-fg-hover',
    ],
  },
  {
    variant: 'tertiary',
    tone: 'error',
    class: [
      'text-semantic-button-tertiary-error-fg',
      'hover:bg-semantic-button-tertiary-error-bg-hover',
      'hover:text-semantic-button-tertiary-error-fg-hover',
    ],
  },
];

/**
 * Loading keeps the control's own colour — it is not a disabled control.
 *
 * Measured from Figma (node 4450:2079): a loading primary renders at
 * `brand/700`, the hover shade, with a white label. The greyed surface was
 * wrong: `loading` sets `aria-disabled` for semantics, and the disabled colours
 * key off that same attribute, so the fill was being overwritten.
 *
 * These rules are scoped to `aria-disabled:` too, so they land in the same
 * tailwind-merge group as the disabled colours and win by coming after them.
 * Spread *after* `actionSurfaceCompounds` for that ordering to hold.
 */
export const actionLoadingCompounds: SurfaceRule[] = [
  {
    variant: 'primary',
    tone: 'default',
    loading: true,
    class:
      'aria-disabled:bg-semantic-button-primary-bg-hover ' +
      'aria-disabled:text-semantic-button-primary-fg',
  },
  {
    variant: 'primary',
    tone: 'error',
    loading: true,
    class:
      'aria-disabled:bg-semantic-button-primary-error-bg-hover ' +
      'aria-disabled:text-semantic-button-primary-error-fg',
  },
  {
    variant: 'secondary',
    tone: 'default',
    loading: true,
    class:
      'aria-disabled:bg-semantic-button-secondary-bg-hover ' +
      'aria-disabled:text-semantic-button-secondary-fg ' +
      'aria-disabled:inset-ring-semantic-button-secondary-border',
  },
  {
    variant: 'secondary',
    tone: 'color',
    loading: true,
    class:
      'aria-disabled:bg-semantic-button-secondary-color-bg-hover ' +
      'aria-disabled:text-semantic-button-secondary-color-fg ' +
      'aria-disabled:inset-ring-semantic-button-secondary-color-border',
  },
  {
    variant: 'secondary',
    tone: 'error',
    loading: true,
    class:
      'aria-disabled:bg-semantic-button-secondary-error-bg-hover ' +
      'aria-disabled:text-semantic-button-secondary-error-fg ' +
      'aria-disabled:inset-ring-semantic-button-secondary-error-border',
  },
  {
    variant: 'tertiary',
    tone: 'default',
    loading: true,
    class:
      'aria-disabled:bg-semantic-button-tertiary-bg-hover ' +
      'aria-disabled:text-semantic-button-tertiary-fg',
  },
  {
    variant: 'tertiary',
    tone: 'color',
    loading: true,
    class:
      'aria-disabled:bg-semantic-button-tertiary-color-bg-hover ' +
      'aria-disabled:text-semantic-button-tertiary-color-fg',
  },
  {
    variant: 'tertiary',
    tone: 'error',
    loading: true,
    class:
      'aria-disabled:bg-semantic-button-tertiary-error-bg-hover ' +
      'aria-disabled:text-semantic-button-tertiary-error-fg',
  },
];

/** The loading axis, for a config spreading {@link actionLoadingCompounds}. */
export const actionLoadingAxis = { true: '' };

/** The three emphases, as an empty variant map for a CVA config to build on. */
export const actionVariantAxis = { primary: '', secondary: '', tertiary: '' };

/** The three tones, likewise. Colour arrives via {@link actionSurfaceCompounds}. */
export const actionToneAxis = { default: '', color: '', error: '' };
