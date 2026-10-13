/**
 * TopNavigationBar's measured geometry, hoisted so the variants and the tests read the
 * same numbers.
 *
 * Read from Figma `Mobile Top Navigation Bar` (node `2180:49648`, 360 × 64) and
 * `Desktop Top Navigation Bar` (node `2180:49909`, 1920 × 92). Nothing here is
 * estimated — the two bars close their own arithmetic:
 *
 * - mobile: `64` is pinned on the frame, and `16 + 24 + 16` gaps sit inside it
 * - desktop: `16 + 60 + 16 = 92`, so the height is padding plus the tallest child
 *   rather than a pinned frame
 */

/** Figma's two published bars. */
export const TOP_NAVIGATION_BAR_DEVICES = ['mobile', 'desktop'] as const;

export const TOP_NAVIGATION_BAR_CONSTANTS = {
  ARIA: {
    /**
     * The landmark. `<header>` is only a banner landmark when it is not nested inside
     * another sectioning element, so the role is stated rather than relied upon.
     */
    ROLE: 'banner',
    /** Figma draws a `<nav>` region for neither bar, so none is invented. */
  },

  /**
   * Icon boxes, per device.
   *
   * Every one lands on a spacing token: 16 is `semantic-xl`, 20 is `semantic-2xl`,
   * 24 is `semantic-3xl`. Only 28 and 36 do not, and both already have documented
   * exceptions from SearchBar and Avatar.
   */
  ICON: {
    /** Mobile heading glyph — Figma's `circle` at 16. */
    MOBILE_HEADING: 16,
    /** Desktop heading glyphs — Figma draws one on each side at 20. */
    DESKTOP_HEADING: 20,
    /** Mobile left action and right slots. */
    MOBILE_ACTION: 24,
    /** Desktop search glyph. Matches SearchBar's 1920 glyph, hence the same exception. */
    DESKTOP_SEARCH: 28,
    /** Desktop wallet and cart glyphs, and the Avatar box beside them. */
    DESKTOP_ACTION: 36,
    /** The chevron after the account name. */
    ACCOUNT_END: 16,
  },

  /**
   * The MediBuddy logo's two boxes.
   *
   * Figma nests a `172 × 44` artwork centred inside a `180 × 60` frame, and the outer
   * frame is what sets the bar's 60px content height. Both are off every scale.
   */
  LOGO: { BOX_WIDTH: 180, BOX_HEIGHT: 60, ARTWORK_WIDTH: 172, ARTWORK_HEIGHT: 44 },

  /**
   * The mobile action button — Figma's `Buttons/Button`, hidden by default.
   *
   * **Not Mozaic's Button.** Figma pins 44 × 20 with zero padding, `radius-xs` and
   * bare brand text; Button's smallest size is `px-semantic-lg py-semantic-md` on
   * 14/20, which is 36 tall, and it has no text-only variant. Reproduced here rather
   * than bent out of Button.
   */
  ACTION_BUTTON: { WIDTH: 44, HEIGHT: 20 },

  /** The middle slot's cap. Figma pins `max-w-[360px]` on desktop only. */
  MIDDLE_SLOT_MAX_WIDTH: 360,

  /**
   * Desktop horizontal padding.
   *
   * 112 sits between `semantic-9xl` (96) and `semantic-10xl` (128) and is on no
   * primitive step either, which is why it is a documented exception.
   */
  DESKTOP_PADDING_X: 112,

  /**
   * The two badges on the desktop action items.
   *
   * The wallet's badge sits *beside* its glyph and overlaps it by one `semantic-xl`;
   * the cart's is absolutely placed over the glyph's top-right. Figma authors the
   * wallet badge's radius as `14998.5px`, which is a fully-rounded pill by any other
   * name and is reproduced as `rounded-full`.
   */
  BADGE: { WALLET_OVERLAP: 16, CART_LEFT: 20, CART_TOP: -4, RING_WIDTH: 1.5 },

  TEXT: {
    /** Figma's placeholder copy, used as the story and test fixtures. */
    HEADING_PLACEHOLDER: 'Title Placeholder',
    SUBHEADING_PLACEHOLDER: 'This is the subtitle placeholder, replace with subtitle',
    SEARCH_PLACEHOLDER: 'Search Empty State Placeholder',
    ACTION_LABEL: 'MERGE',
    ACCOUNT_NAME: 'MediBuddy Benefits',
    ACCOUNT_DESCRIPTION: 'Corporate Sponsored Account',
  },
} as const;
