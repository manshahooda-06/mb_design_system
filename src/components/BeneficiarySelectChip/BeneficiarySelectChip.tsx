import { forwardRef, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '@utils/cn';
import {
  beneficiarySelectChipAvatarVariants,
  beneficiarySelectChipNameVariants,
  beneficiarySelectChipVariants,
} from './BeneficiarySelectChip.variants';
import { BENEFICIARY_SELECT_CHIP_DEVICES } from './constants';
import type { BaseComponentProps, SlotClassNames } from '@/types';

export type BeneficiarySelectChipDevice = (typeof BENEFICIARY_SELECT_CHIP_DEVICES)[number];

export type BeneficiarySelectChipSlot = 'root' | 'avatar' | 'name';

interface BeneficiarySelectChipOwnProps extends Omit<BaseComponentProps, 'children'> {
  /** Figma's `Device` axis. */
  device?: BeneficiarySelectChipDevice;

  /**
   * Figma's `State` axis, as a boolean.
   *
   * `State` is a genuine published axis with exactly two values, and selection is the
   * caller's to own — so it arrives as a boolean rather than as `state="selected"`,
   * matching `checked` on Radio and Checkbox.
   *
   * **Visual only.** Figma publishes no interaction for any of the 4 variants, so the
   * chip renders an inert element and does not claim a role or set `aria-pressed`. A
   * caller who makes it selectable owns those semantics.
   */
  selected?: boolean;

  /** Figma's `benifName`. Truncates to one line once the chip reaches its cap. */
  name: ReactNode;

  /**
   * The avatar. Figma nests `Avatar_user`, so this is Mozaic's own Avatar.
   *
   * **Both of its axes follow this chip's props**, and neither is applied for you —
   * the chip does not resize or restyle what it is handed:
   *
   * - size: `xs` (24) on mobile, `sm` (32) on desktop. The avatar is what sets the
   *   chip's height, so a different size changes the chip's geometry.
   * - background: `grey` when unselected, `white` when selected. Figma flips it.
   *
   * ```tsx
   * <Avatar
   *   size={device === 'mobile' ? 'xs' : 'sm'}
   *   background={selected ? 'white' : 'grey'}
   *   name="Aarav Sharma"
   * />
   * ```
   */
  avatar?: ReactNode;

  classNames?: SlotClassNames<BeneficiarySelectChipSlot>;
}

export type BeneficiarySelectChipProps = BeneficiarySelectChipOwnProps &
  Omit<ComponentPropsWithRef<'span'>, keyof BeneficiarySelectChipOwnProps | 'children'>;

/**
 * A beneficiary shown as a selectable pill.
 *
 * Figma `Beneficiary Select Chip` — node `2180:33533`, **4 variants**: `Device`(2) ×
 * `State`(2). All 4 are implemented.
 *
 * **Deliberately independent of BeneficiarySelector.** The two share the idea of an
 * avatar beside a name, and share no values: the avatar is 24/32 here against 40/48
 * there, the gaps differ, and their selection languages genuinely diverge — this chip
 * tints its surface and recolours the name, while the selector keeps a white surface
 * and changes the name's *weight*. A shared primitive would be two divergent variant
 * tables behind one wrapper, which is the same reasoning Radio and Checkbox use for
 * staying apart.
 *
 * **The chip is inert**, because Figma draws a chip rather than a control and publishes
 * no hover, focus, pressed or disabled state. A caller who needs it selectable wraps it
 * in their own `button`, which keeps the role, the handler and `aria-pressed` where they
 * can be got right — and in a flex row of chips that button simply becomes the flex
 * item, so nothing about the layout shifts.
 *
 * `asChild` is deliberately **not** offered. The chip always renders an avatar and a
 * name, and `Slot` merges props onto exactly one caller-supplied element — two children
 * have no correct interpretation, which is why `Slot` throws rather than guessing. See
 * the note in `@utils/slot`.
 *
 * Nothing here is stateful, so the module needs no `'use client'` and renders on the
 * server.
 *
 * @example
 * <BeneficiarySelectChip
 *   name="Aarav Sharma"
 *   avatar={<Avatar size="xs" background="grey" name="Aarav Sharma" />}
 * />
 *
 * @example
 * // Selectable: the caller owns the element, the role and the ARIA.
 * <button type="button" aria-pressed={picked === 'aarav'} onClick={() => pick('aarav')}>
 *   <BeneficiarySelectChip
 *     selected={picked === 'aarav'}
 *     name="Aarav Sharma"
 *     avatar={<Avatar size="xs" background="white" name="Aarav Sharma" />}
 *   />
 * </button>
 */
export const BeneficiarySelectChip = forwardRef<HTMLSpanElement, BeneficiarySelectChipProps>(
  function BeneficiarySelectChip(
    { device = 'mobile', selected = false, name, avatar, className, classNames, ...rest },
    ref,
  ) {
    return (
      <span
        ref={ref}
        className={cn(
          beneficiarySelectChipVariants({ device, selected }),
          className,
          classNames?.root,
        )}
        {...rest}
      >
        {avatar != null && (
          <span
            className={cn(beneficiarySelectChipAvatarVariants(), classNames?.avatar)}
            aria-hidden
          >
            {avatar}
          </span>
        )}
        <span
          className={cn(beneficiarySelectChipNameVariants({ device, selected }), classNames?.name)}
        >
          {name}
        </span>
      </span>
    );
  },
);

BeneficiarySelectChip.displayName = 'BeneficiarySelectChip';
