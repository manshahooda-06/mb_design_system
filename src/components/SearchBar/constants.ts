import type { SearchBarType } from './types';

/**
 * Every string, id and motion value SearchBar uses.
 *
 * Hoisted rather than inlined, following the frontend repo's component convention
 * (`HOSPITAL_DOCTOR_SEARCH_CONSTANTS`): copy that reaches a screen reader or a
 * translator lives in one place, not scattered through JSX.
 */
export const SEARCH_BAR_CONSTANTS = {
  ARIA_LABELS: {
    CLEAR_SEARCH: 'Clear search',
  },

  TEXT: {
    /**
     * The unchanging half of the placeholder.
     *
     * Figma draws it identically in all twelve `_Search animating text` variants and no
     * property reaches it, which is why it is a constant rather than a prop.
     */
    STATIC: 'Search by',
  },

  /**
   * The animated half, in Figma's stack order — the order the offsets index into.
   *
   * The quotes are Figma's own typographic single quotes (U+2018 / U+2019), not
   * apostrophes, and not decoration this component added.
   */
  WORDS: [
    ['doctor', '‘Doctor’'],
    ['hospital', '‘Hospital’'],
    ['symptom', '‘Symptom’'],
    ['speciality', '‘Speciality’'],
  ],

  MOTION: {
    /**
     * How long each word is held before the next slides up, in milliseconds.
     *
     * **An implementation default, not a Figma value.** Figma publishes four static
     * frames and specifies no duration, easing or dwell, and `src/foundations/motion` is
     * an empty stub. The frontend repo's `AnimatedRotatingText` defaults to 3000; this is
     * faster because the word is one of two halves of a placeholder rather than a
     * standalone headline.
     */
    INTERVAL_MS: 2000,

    /** Seconds of travel. Also an implementation default — see {@link INTERVAL_MS}. */
    DURATION_S: 0.5,

    /**
     * How far the stack moves per step, in pixels, per device.
     *
     * **Measured from Figma**, unlike the two values above: one line height plus the 4px
     * stack gap, which is exactly the offset each `type` variant applies as a negative
     * `top` — 0 / −24 / −48 / −72 at Mobile, and so on.
     */
    PITCH: {
      mobile: 24,
      'desktop-1280': 28,
      'desktop-1920': 32,
    },
  },
} as const;

/**
 * Figma's `type` values in stack order — the order the offsets index into.
 *
 * Lives here rather than beside the component that uses it: a module exporting a component
 * plus a helper breaks Fast Refresh, which is why Avatar's `get-initials.ts` is a separate
 * file too.
 */
export const SEARCH_BAR_TYPES = SEARCH_BAR_CONSTANTS.WORDS.map(([type]) => type) as SearchBarType[];

/** The word a `type` shows, for composing an accessible name. */
export function wordForType(type: SearchBarType): string | undefined {
  return SEARCH_BAR_CONSTANTS.WORDS.find(([key]) => key === type)?.[1];
}
