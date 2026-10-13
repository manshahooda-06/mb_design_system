import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { SlotClassNames } from '@/types';

/**
 * Figma's `Device` axis — three published viewports, not a size scale.
 *
 * They disagree on padding, both icon ramps, the content gap and the type step, so
 * nothing is shared between them beyond the fill, the stroke, the radius and the shadow.
 *
 * Kept as a discrete axis rather than the frontend repo's fluid `autoScale` type: that
 * curve reproduces Figma's Mobile and 1920 steps exactly but resolves to 17.55/24.73 at
 * 1280 where Figma publishes 16/24, and Figma wins on visual values.
 */
export type SearchBarDevice = 'mobile' | 'desktop-1280' | 'desktop-1920';

/** Figma's `type` axis on `_Search animating text` — which word the window shows. */
export type SearchBarType = 'doctor' | 'hospital' | 'symptom' | 'speciality';

export type SearchBarSlot =
  | 'root'
  | 'content'
  | 'searchIcon'
  | 'field'
  | 'input'
  | 'placeholder'
  | 'staticText'
  | 'animatingText'
  | 'clearIcon';

export interface SearchBarOwnProps {
  /** Figma's `Device` axis. */
  device?: SearchBarDevice;
  /**
   * Figma's `type` axis — which of the four words the animated window shows.
   *
   * While `animate` is on this is the word the cycle **starts** from; with `animate` off
   * it pins the window to that word, which is how Figma's twelve published variants are
   * reproduced exactly.
   *
   * Reaches only the animated half of the placeholder. It cannot affect the static
   * "Search by", and it has no effect once the field is filled, because Filled replaces
   * the placeholder entirely.
   */
  type?: SearchBarType;
  /**
   * Figma's `showAnimatedText` boolean — whether the animated half renders at all.
   *
   * The static "Search by" is independent of it and stays either way, exactly as Figma's
   * `showAnimatedText=false` draws it.
   */
  showAnimatedText?: boolean;
  /**
   * Whether the animated half cycles through the four words.
   *
   * Named `animate` rather than the frontend repo's `disabled` (`AnimatedRotatingText`)
   * because `disabled` on a component that owns an `<input>` would read as the field
   * being disabled — a state Figma does not publish.
   */
  animate?: boolean;
  /**
   * How long each word is held, in milliseconds. Matches `AnimatedRotatingText`'s prop
   * name. **An implementation default, not a Figma value** — see `constants.ts`.
   */
  intervalMs?: number;
  /** The search text, controlled. Leave unset to let the component hold its own. */
  value?: string;
  /**
   * Figma's `filledText` property — the text the Filled variant is authored with.
   *
   * It seeds the uncontrolled value, so `<SearchBar filledText="Cardi" />` renders
   * Figma's Filled state directly. Ignored when `value` is supplied.
   */
  filledText?: string;
  /** Called with the new text on every edit, and with `''` on clear. */
  onValueChange?: (value: string) => void;
  /** Called after the clear button empties the field. */
  onClear?: () => void;
  /** Figma's `search-01`, 20 / 24 / 28 in `brand/600`. Decorative. */
  searchIcon?: ReactNode;
  /** Figma's `cancel-01`, 16 / 20 / 24. Rendered only while the field is filled. */
  clearIcon?: ReactNode;
  /** Accessible name for the clear button. Defaults to `ARIA_LABELS.CLEAR_SEARCH`. */
  clearLabel?: string;
  /** Escape hatch per slot; `className` targets the container. */
  classNames?: SlotClassNames<SearchBarSlot>;
}

export type SearchBarProps = SearchBarOwnProps &
  Omit<ComponentPropsWithoutRef<'input'>, keyof SearchBarOwnProps | 'children'>;
