import type { ReactNode } from 'react';
import type { BaseComponentProps, SlotClassNames } from '@/types';
import type { TOOLTIP_ARROW_POSITIONS } from './constants';

/**
 * Figma's `Arrow` axis — where the arrow attaches, or `none` for a plain bubble.
 *
 * **The matrix is asymmetric, and reproduced as published.** Figma has three
 * bottom positions but only one top, and the side positions carry no vertical
 * qualifier. `top-left`, `top-right` and any `*-center` for the sides are absent
 * from the component set, so they are absent here.
 */
export type TooltipArrowPosition = (typeof TOOLTIP_ARROW_POSITIONS)[number];

/**
 * Figma's layers, in its own names: `Content` is the bubble, `Text and supporting
 * text` the stacked pair, `Tooltip` the arrow.
 */
export type TooltipSlot = 'root' | 'content' | 'group' | 'label' | 'supportingText' | 'arrow';

export interface TooltipOwnProps extends Omit<BaseComponentProps, 'children'> {
  /** Figma's `Arrow` axis. */
  arrowPosition?: TooltipArrowPosition;

  /**
   * Figma's `Text` layer — the tooltip's own copy.
   *
   * Required, because a tooltip with nothing to say has no reason to render. Named
   * for the existing `label` + `supportingText` pairing on `InputDropdownOption`
   * rather than Figma's bare "Text".
   */
  label: ReactNode;

  /**
   * Figma's `Supporting text` layer.
   *
   * **Presence is the variant.** Figma publishes `Supporting text` as a boolean,
   * but a boolean plus a separate string can express "true with nothing to show",
   * which Figma cannot. Deriving it here follows Avatar, where Figma's
   * `Initials (Name)` is likewise derived from `name`.
   *
   * Supplying it changes more than one line: padding goes from `12/8` to 12 all
   * round, and the label stops being centred and starts wrapping. Both are
   * measured, not stylistic.
   */
  supportingText?: ReactNode;

  classNames?: SlotClassNames<TooltipSlot>;
}
