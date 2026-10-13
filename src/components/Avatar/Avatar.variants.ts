import { defineVariants, type VariantProps } from '@utils/variants';

/**
 * Styling for Avatar, declared as data.
 *
 * Measured from Figma `Avatar_user` (node 1816:9346, 70 variants):
 * `Relationship`(14) × `Size`(5). The relationship axis is **not** reproduced as
 * variants — 3 of 3 sampled illustrations are geometrically identical and differ only
 * in artwork, so relationship is asset content that arrives through `illustration`.
 * `Initials (Name)` is the one relationship whose layout differs, and it is a content
 * mode here rather than a relationship.
 *
 * **Two size ramps, and neither is a ratio.** The avatar steps 24/32/36/40/48 while the
 * status badge steps 8/10/12/14/16 — a linear +2 that only *looks* like avatar ÷ 3.
 * That ratio holds at xs, md and xl by arithmetic accident and breaks at sm (0.3125)
 * and lg (0.35); implementing `size-1/3` from two measurements would have been wrong
 * by 0.67px and 1.33px. Both ramps are per-size tables for that reason.
 *
 * Figma binds **no shadow, no border and no focus treatment** anywhere in the 70, so
 * none appears here. Avatar is not interactive: it has no hover, focus or pressed
 * state in the file, and adding one would invent a control the design does not draw.
 */

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The avatar box.
 *
 * **Deliberately not clipped.** Figma puts `overflow-clip` on the background layer,
 * not the root, because the status badge sits flush in the bottom-right corner — a
 * circle clipping the root would slice the badge diagonally in half.
 *
 * 36 is the one size absent from the semantic spacing scale, the same gap Checkbox hit
 * at 36 and 44. It joins the existing "No Sizing foundation" cause rather than opening
 * a new one.
 */
// `font-sans` is stated rather than inherited: `embed.css` ships no preflight, so in a host
// app the initials would render in whatever family that app uses. See SearchBar's root.
export const avatarRootVariants = defineVariants(
  'relative inline-block shrink-0 align-middle font-sans',
  {
    variants: {
      size: {
        xs: 'size-semantic-3xl' /* 24 */,
        sm: 'size-semantic-4xl' /* 32 */,
        md: 'size-[36px]',
        lg: 'size-semantic-5xl' /* 40 */,
        xl: 'size-semantic-6xl' /* 48 */,
      },
    },
    defaultVariants: { size: 'md' },
  },
);

/**
 * Figma's `_Background`, which is a slot rather than a component.
 *
 * The whole of it is two fills and a radius with no children — no border, no shadow,
 * no gradient, no padding. A private component wrapping that would be more indirection
 * than the thing it wraps.
 *
 * This layer also carries the clipping, so a caller's illustration or photo is cut to
 * the circle without the badge being cut with it.
 */
export const avatarContentVariants = defineVariants(
  'absolute inset-semantic-none flex items-center justify-center overflow-clip rounded-full',
  {
    variants: {
      background: {
        // Figma binds base/white and gray/50. `bg-secondary` is the neutral surface at
        // gray/50 — deliberately not `bg-disabled-subtle`, which is the same value with
        // the wrong meaning: an avatar with a grey backdrop is not disabled.
        white: 'bg-semantic-bg-primary',
        grey: 'bg-semantic-bg-secondary',
      },
    },
    defaultVariants: { background: 'white' },
  },
);

/**
 * The initials.
 *
 * Typography is a per-size table because Figma's is: `md` and `lg` genuinely share
 * 16/24, so nothing derives it from the box size.
 *
 * Figma authors all five from the **Marketing** ramp, which the typography foundation
 * does not publish. Mapped per the project's substitution rule — exact match first,
 * else closest by size → weight → line height → family, never a Banner token:
 *
 * | size | Figma | token | |
 * | ---- | ----- | ----- | - |
 * | xs   | 12/18 | `text-mobile-body-sm` 12/20  | substitution: the only exact 12/18 is a Banner token |
 * | sm   | 14/20 | `text-mobile-body-md`        | exact |
 * | md   | 16/24 | `text-desktop-body-sm`       | exact |
 * | lg   | 16/24 | `text-desktop-body-sm`       | exact |
 * | xl   | 18/28 | `text-desktop-body-md` 20/28 | substitution: no 18px token exists |
 *
 * Both substitutions are **temporary until the Marketing ramp is added to the
 * typography foundation**. They cost no documented exception, which is the point of
 * the rule.
 *
 * Centred rather than placed at Figma's authored box: `xl` centres exactly (28×28 at
 * 10,10 in a 48) while `md` is off by 1px horizontally (25×24 at 5,6 in a 36), so the
 * offset is authoring drift and centring is the intent.
 */
export const avatarInitialsVariants = defineVariants(
  'font-semibold text-semantic-text-quaternary select-none uppercase',
  {
    variants: {
      size: {
        xs: 'text-mobile-body-sm' /* 12/20 for Figma 12/18 */,
        sm: 'text-mobile-body-md' /* 14/20 exact */,
        md: 'text-desktop-body-sm' /* 16/24 exact */,
        lg: 'text-desktop-body-sm' /* 16/24 exact */,
        xl: 'text-desktop-body-md' /* 20/28 for Figma 18/28 */,
      },
    },
    defaultVariants: { size: 'md' },
  },
);

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Figma's `_Icon Status`, also a slot rather than a component.
 *
 * Online and Offline are a coloured disc inside a white ring, which is CSS. **Verified
 * is not** — it is a scalloped seal with a tick cut into it and no ring, so it ships as
 * a bundled asset rather than as two nested boxes. See {@link avatarStatusSealVariants}.
 *
 * This box is Figma's `icon` frame: a positioning box on the measured ramp, flush to
 * the corner at `avatar − badge` in every size. Pinning both to `semantic-none` reproduces that
 * without a per-size offset table.
 *
 * The frame carries **no padding**. Figma insets the status component inside it by a
 * tenth per side, but that inset cannot be padding: a percentage padding resolves
 * against the *containing block's* width, never the element's own, so `p-[10%]` here
 * would have resolved against the avatar root and come out roughly 3× too large. The
 * inset is expressed on the child instead, as `size-4/5`, which resolves against this
 * box and is therefore exact at every size.
 */
export const avatarStatusVariants = defineVariants(
  'absolute right-semantic-none bottom-semantic-none flex items-center justify-center',
  {
    variants: {
      size: {
        xs: 'size-semantic-md' /* 8 */,
        sm: 'size-[10px]',
        md: 'size-semantic-lg' /* 12 */,
        lg: 'size-[14px]',
        xl: 'size-semantic-xl' /* 16 */,
      },
    },
    defaultVariants: { size: 'md' },
  },
);

/**
 * The white ring around the coloured dot — Figma's `_Icon Status` at Online or Offline.
 *
 * **Verified does not use this.** It has no white ring in Figma; see
 * {@link avatarStatusSealVariants}.
 *
 * Measured (node 1816:10706): the component is two concentric `Base` ellipses, 10×10
 * with an 8×8 at (1,1). The outer disc is the ring, which reads as the page surface
 * punched around the indicator — the same role `bg-primary` plays in the shared focus
 * ring's gap.
 *
 * `inset` is Figma's placement of that component inside the `icon` frame: 80% of the
 * frame at every size **except `xs`, which is placed at full size** (node 1816:9558 —
 * an 8 holding an 8, against node 1816:9584's 10 holding an 8). That is measured, not
 * an oversight.
 *
 * Sized rather than padded so the fraction resolves against the frame. See
 * `avatarStatusVariants`.
 */
export const avatarStatusRingVariants = defineVariants(
  'flex items-center justify-center rounded-full bg-semantic-bg-primary',
  {
    variants: { inset: { true: 'size-4/5', false: 'size-full' } },
    defaultVariants: { inset: true },
  },
);

/**
 * The coloured disc inside the ring — Online and Offline only.
 *
 * Measured (node 1816:10706): Online and Offline are geometrically identical and differ
 * only in fill, so both are a bare disc at 80% of the ring, matching the 8-in-10 the
 * `_Icon Status` component draws. Sized for the same reason the ring is: a percentage
 * padding on the ring would have resolved against the frame rather than the ring, so the
 * two insets would not have composed.
 *
 * **Verified is deliberately not a variant here.** It is a different shape, not a
 * different fill — see {@link avatarStatusSealVariants}.
 *
 * A bare box: no layout utilities, because it has no children. The tick used to sit
 * inside it and moved out with the Verified redesign, so the centring and `*:size-full`
 * it carried are gone with it. `flex` went too — the dot is a flex item of the ring, so
 * it is blockified regardless and `size-4/5` applies either way.
 */
export const avatarStatusDotVariants = defineVariants('size-4/5 rounded-full', {
  variants: {
    status: {
      online: 'bg-semantic-bg-success-solid',
      offline: 'bg-semantic-fg-disabled-subtle',
    },
  },
  defaultVariants: { status: 'offline' },
});

/**
 * The Verified seal — Figma's `_Icon Status` at `State=Verified`.
 *
 * Verified takes its own slot because it is a **different shape, not a different fill**.
 * Measured (node 1816:10700): where Online and Offline are two concentric ellipses, this
 * is a scalloped seal with a tick cut into it, drawn from two vectors and carrying **no
 * white ring**. So there is no ring element here and no 80% dot inside one — the seal
 * fills the `_Icon Status` box directly, which is where the ring would otherwise sit.
 *
 * `inset` therefore repeats the ring's rule rather than the dot's: 80% of the `icon`
 * frame, except `xs` at full size.
 *
 * The colour lives here rather than in the asset so the seal themes with the rest of the
 * status set. `text-` because the artwork paints with `currentColor`; Figma binds
 * brand-blue/600, which is the value behind `bg-brand-solid`.
 *
 * No `*:size-full`: the only child is {@link AvatarVerifiedBadge}, which sets `size-full`
 * on its own root. That utility existed for a caller-supplied glyph, and there is no
 * longer any way to supply one.
 */
export const avatarStatusSealVariants = defineVariants(
  'flex items-center justify-center text-semantic-bg-brand-solid',
  {
    variants: { inset: { true: 'size-4/5', false: 'size-full' } },
    defaultVariants: { inset: true },
  },
);

export type AvatarVariantProps = VariantProps<typeof avatarRootVariants>;
