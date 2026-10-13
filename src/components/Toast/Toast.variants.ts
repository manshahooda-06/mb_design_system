import { defineVariants } from '@utils/variants';

/**
 * Styling for Toast, declared as data.
 *
 * Measured from Figma `Toast` (node `2181:829`) — **2 published variants** on a single
 * `State` axis valued `Mobile | Desktop`. Both are implemented.
 *
 * | | mobile | desktop |
 * | --- | --- | --- |
 * | width | 328 | 480 |
 * | height | 40 | 56 |
 * | radius | 8 | 12 |
 * | padding | 12 / 8 | 16 |
 * | inner padding | 2 | — |
 * | gap | 8 | 8 |
 * | icons | 16 | 24 |
 * | type | 12/20 | 16/24 |
 * | shadow | `elevation-2` | Figma's `Web`, 4 layers |
 *
 * **The height is not pinned, and the arithmetic is why.** Figma's frames are 40 and 56
 * tall, and both fall out of the padding exactly: `8 + (2 + 20 + 2) + 8 = 40` and
 * `16 + 24 + 16 = 56`. Nothing here declares a height, because Figma does not either —
 * it is the padding plus one line of text.
 *
 * **The 1px stroke is not reproduced, and it makes no visual difference.** Figma draws a
 * 1px border bound to `text-primary (900)` — the same `#252D38` as the fill — so it is
 * invisible by construction. It also cannot be a border box: the height arithmetic above
 * closes exactly on the padding, so a border would push 40 to 42 and 56 to 58. Drawing it
 * as a ring instead would mean substituting a same-valued token of another role for the
 * colour, which this library refuses on principle — there is no border- or ring-role
 * token at gray/900, only `screen-mockup-border`, whose role is something else entirely.
 * So the stroke is documented rather than drawn.
 *
 * **No state axis beyond `State`.** Figma publishes no hover, focus, pressed, disabled,
 * entering, leaving or timed treatment, and no interaction of any kind. This is the toast
 * as drawn, not a toast-management system: there is no `open`, `duration`, `position`,
 * `onClose` or animation here, because none of it is in the design.
 */

/* -------------------------------------------------------------------------- */
/* Root                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The bar.
 *
 * `font-sans` because this is a text-bearing root: with no preflight in `embed.css` a
 * host application's family would otherwise be inherited straight through.
 *
 * The width is pinned because Figma pins it and because the layout depends on it: the
 * leading content flexes into the free space and the trailing content stays intrinsic,
 * which only means anything inside a definite width. `className` overrides it for a
 * caller who needs the bar to track a container instead.
 *
 * `justify-between` is Figma's own and is belt-and-braces: the leading content already
 * takes the free space through `flex-1`, so there is none left to distribute.
 */
export const toastVariants = defineVariants(
  ['relative flex items-center justify-between font-sans', 'bg-semantic-bg-primary-solid'],
  {
    variants: {
      state: {
        mobile: [
          // 328 is on no spacing step at all; see the token policy.
          'w-[328px] rounded-md px-semantic-lg py-semantic-md',
          // Figma binds the effect style `shadow/elevation-2`, which this token carries
          // exactly: the same two layers, #0000000d at (0,4) blur 10 and #0000000a at
          // (0,1) blur 4.
          'shadow-elevation-2',
        ],
        desktop: [
          // `w-120` is the 480px primitive spacing step — the semantic scale stops at
          // 11xl 160, so this is as close to a token as 480 gets. See the token policy.
          'w-120 rounded-xl p-semantic-xl',
          // Figma's `Web` effect style: four layers, where every elevation token has two.
          '[box-shadow:0px_8px_44px_0px_#00000008,0px_6px_4px_0px_#00000005,0px_4px_18px_0px_#00000005,0px_0px_10px_0px_#00000005]',
        ],
      },
    },
    defaultVariants: { state: 'mobile' },
  },
);

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Figma's leading `Container` — the pre-icon beside the primary text.
 *
 * Takes the free space and is allowed to shrink below its text, which is what
 * `min-w-semantic-none` buys: a flex child defaults to `min-width: auto` and would
 * otherwise push the trailing content out of the bar rather than wrapping its own text.
 *
 * The 2px inner padding is mobile-only. Figma gives the desktop containers none, because
 * there the 24px line height already fills the 24px content box on its own.
 */
export const toastContentVariants = defineVariants(
  'flex min-w-semantic-none flex-1 items-center gap-semantic-md',
  {
    variants: {
      state: {
        mobile: 'py-semantic-xxs' /* 2 */,
        desktop: '',
      },
    },
    defaultVariants: { state: 'mobile' },
  },
);

/**
 * Figma's trailing `Container` — the post text beside the post icon.
 *
 * Intrinsic rather than flexible: it keeps its natural width so the primary text is what
 * gives way when the bar runs out of room.
 */
export const toastPostVariants = defineVariants('flex shrink-0 items-center gap-semantic-md', {
  variants: {
    state: {
      mobile: 'py-semantic-xxs' /* 2 */,
      desktop: '',
    },
  },
  defaultVariants: { state: 'mobile' },
});

/**
 * Figma's `left icon` and `post icon` boxes.
 *
 * One table for both, because Figma sizes them identically at both states — 16 on mobile,
 * 24 on desktop. The glyph is caller-supplied and reaches its colour as `currentColor`
 * from the root's white text, so a caller's icon needs neither a size nor a fill.
 */
export const toastIconVariants = defineVariants(
  'inline-flex shrink-0 items-center justify-center *:size-full',
  {
    variants: {
      state: {
        mobile: 'size-semantic-xl' /* 16 */,
        desktop: 'size-semantic-3xl' /* 24 */,
      },
    },
    defaultVariants: { state: 'mobile' },
  },
);

/**
 * Figma's `Primary Text`.
 *
 * Fills the space the trailing content leaves and wraps rather than truncating — Figma
 * sets `word-break: break-word` and no ellipsis, so long copy grows the bar's height
 * instead of being cut. Nothing here pins a line count.
 */
export const toastPrimaryTextVariants = defineVariants(
  'min-w-semantic-none flex-1 font-medium break-words text-semantic-text-white',
  {
    variants: {
      state: {
        mobile: 'text-mobile-body-sm' /* 12/20 exact */,
        desktop: 'text-desktop-body-sm' /* 16/24 exact */,
      },
    },
    defaultVariants: { state: 'mobile' },
  },
);

/**
 * Figma's `Post Text`.
 *
 * Same type step and colour as the primary text, and deliberately unwrapped: Figma sets
 * `white-space: nowrap` here, which is what keeps a two-word action on one line while
 * the primary text is the part that reflows.
 */
export const toastPostTextVariants = defineVariants(
  'shrink-0 font-medium whitespace-nowrap text-semantic-text-white',
  {
    variants: {
      state: {
        mobile: 'text-mobile-body-sm' /* 12/20 exact */,
        desktop: 'text-desktop-body-sm' /* 16/24 exact */,
      },
    },
    defaultVariants: { state: 'mobile' },
  },
);
