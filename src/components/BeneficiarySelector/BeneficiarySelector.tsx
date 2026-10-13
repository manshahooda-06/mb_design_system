'use client';

import { forwardRef, useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '@utils/cn';
import { Radio } from '../Radio';
import {
  beneficiarySelectorAvatarVariants,
  beneficiarySelectorBadgeVariants,
  beneficiarySelectorContentVariants,
  beneficiarySelectorControlVariants,
  beneficiarySelectorLeftSectionVariants,
  beneficiarySelectorMetaItemVariants,
  beneficiarySelectorMetaVariants,
  beneficiarySelectorNameVariants,
  beneficiarySelectorVariants,
} from './BeneficiarySelector.variants';
import { BENEFICIARY_SELECTOR_DEVICES, META_SEPARATOR } from './constants';
import type { BaseComponentProps, SlotClassNames } from '@/types';

export type BeneficiarySelectorDevice = (typeof BENEFICIARY_SELECTOR_DEVICES)[number];

export type BeneficiarySelectorSlot =
  'root' | 'leftSection' | 'avatar' | 'content' | 'name' | 'meta' | 'badge' | 'control';

interface BeneficiarySelectorOwnProps extends Omit<BaseComponentProps, 'children'> {
  /** Figma's `Device` axis. */
  device?: BeneficiarySelectorDevice;

  /**
   * Figma's `State` axis, as a boolean, and the checked state of the nested Radio.
   *
   * Two values on a published axis, owned by the caller — so a boolean rather than
   * `state="selected"`, matching `checked` on Radio and Checkbox.
   */
  selected?: boolean;

  /** Figma's `benifName`. Truncates to one line. */
  name: ReactNode;

  /**
   * Figma's `relation` — the `Self` in `Self | 22 F`. Presence replaces `relationShow`.
   *
   * **Presence also controls the separator**, which is Figma's own wiring rather than a
   * choice made here: the `|` sits inside the same `relationShow` gate as the relation
   * itself. One consequence is reproduced rather than corrected — a relation with no
   * age and no gender renders a trailing `Self |`. See the note on the component.
   */
  relation?: ReactNode;

  /** Figma's `age`. Presence replaces `ageShow`. */
  age?: ReactNode;

  /** Figma's `gender`. Presence replaces `genderShow`. */
  gender?: ReactNode;

  /**
   * Figma's `badgeShow`, as content.
   *
   * Figma publishes the boolean but **not** the text — "Sponsored" is typed into the
   * component. Taking a node instead keeps product copy out of the design system while
   * drawing exactly what Figma draws.
   */
  badge?: ReactNode;

  /**
   * The avatar. Figma nests `Avatar_user`, so this is Mozaic's own Avatar.
   *
   * Size follows the device — `lg` (40) on mobile, `xl` (48) on desktop — and is not
   * applied for you. Unlike the chip, the background does **not** flip with selection:
   * Figma keeps it `grey` in all four variants.
   *
   * ```tsx
   * <Avatar size={device === 'mobile' ? 'lg' : 'xl'} background="grey" name="Aarav Sharma" />
   * ```
   */
  avatar?: ReactNode;

  /**
   * Groups this selector's Radio with its siblings.
   *
   * Passed straight through, so wrapping a list of selectors in a `RadioGroup` makes
   * them mutually exclusive with no extra wiring.
   */
  value?: string;

  /** Fires when the nested Radio becomes checked. */
  onSelectedChange?: (selected: boolean) => void;

  classNames?: SlotClassNames<BeneficiarySelectorSlot>;
}

export type BeneficiarySelectorProps = BeneficiarySelectorOwnProps &
  Omit<ComponentPropsWithRef<'div'>, keyof BeneficiarySelectorOwnProps | 'children'>;

/**
 * A beneficiary shown as a selectable card.
 *
 * Figma `Beneficiary Selector` — node `2180:33550`, **4 variants**: `Device`(2) ×
 * `State`(2). All 4 are implemented.
 *
 * **Deliberately independent of BeneficiarySelectChip.** They share the idea of an
 * avatar beside a name and share no values — 40/48 against 24/32, different gaps, and
 * genuinely different selection languages: this card keeps a white surface and changes
 * the name's *weight*, where the chip tints its surface and recolours the name.
 *
 * **The control is Mozaic's Radio at `md`, on both devices — a deliberate 4px
 * deviation on desktop.** Figma draws 20 on mobile and 24 on desktop, but the 24 comes
 * from a node outside the canonical `Checkbox` set, and that set publishes `Size` as
 * `sm` and `md` only — all 78 of its variants. Adding an `lg` would invent a size in a
 * shared component; re-implementing the control privately would duplicate Radio's
 * checked, unchecked, dot and focus-ring behaviour. So Radio is reused unchanged and
 * the difference is recorded here. Everything else about the control matches exactly:
 * `border-semantic-border-primary` unchecked, `bg-semantic-bg-brand-solid` checked, and
 * an 8px dot.
 *
 * The Radio is labelled by the name through `aria-labelledby` rather than by nesting,
 * because Radio renders its own `<label>` around its input and labels cannot nest.
 *
 * `useId` is what makes that association work, and it is a hook — so this module does
 * carry `'use client'`, unlike the chip.
 *
 * @example
 * <RadioGroup name="beneficiary" value={picked} onValueChange={setPicked}>
 *   {people.map((person) => (
 *     <BeneficiarySelector
 *       key={person.id}
 *       value={person.id}
 *       selected={picked === person.id}
 *       name={person.name}
 *       relation={person.relation}
 *       age={person.age}
 *       gender={person.gender}
 *       badge={person.sponsored ? 'Sponsored' : undefined}
 *       avatar={<Avatar size="lg" background="grey" name={person.name} />}
 *     />
 *   ))}
 * </RadioGroup>
 */
export const BeneficiarySelector = forwardRef<HTMLDivElement, BeneficiarySelectorProps>(
  function BeneficiarySelector(
    {
      device = 'mobile',
      selected = false,
      name,
      relation,
      age,
      gender,
      badge,
      avatar,
      value,
      onSelectedChange,
      className,
      classNames,
      ...rest
    },
    ref,
  ) {
    const nameId = useId();

    // Figma gates the whole row behind `selfGenderShow`; deriving it from whether there
    // is anything to put in it makes "shown but empty" unrepresentable.
    const hasMeta = relation != null || age != null || gender != null;

    return (
      <div
        ref={ref}
        className={cn(
          beneficiarySelectorVariants({ device, selected }),
          className,
          classNames?.root,
        )}
        {...rest}
      >
        <div
          className={cn(
            beneficiarySelectorLeftSectionVariants({ device }),
            classNames?.leftSection,
          )}
        >
          {avatar != null && (
            <span
              className={cn(beneficiarySelectorAvatarVariants(), classNames?.avatar)}
              aria-hidden
            >
              {avatar}
            </span>
          )}

          <div className={cn(beneficiarySelectorContentVariants({ device }), classNames?.content)}>
            <span
              id={nameId}
              className={cn(
                beneficiarySelectorNameVariants({ device, selected }),
                classNames?.name,
              )}
            >
              {name}
            </span>

            {hasMeta && (
              <span className={cn(beneficiarySelectorMetaVariants({ device }), classNames?.meta)}>
                {relation != null && (
                  <>
                    <span className={beneficiarySelectorMetaItemVariants()}>{relation}</span>
                    {/*
                     * Figma puts the separator inside the same gate as the relation, so
                     * it follows the relation rather than sitting between two present
                     * values. Reproduced rather than corrected.
                     */}
                    <span className={beneficiarySelectorMetaItemVariants()} aria-hidden>
                      {META_SEPARATOR}
                    </span>
                  </>
                )}
                {age != null && (
                  <span className={beneficiarySelectorMetaItemVariants()}>{age}</span>
                )}
                {gender != null && (
                  <span className={beneficiarySelectorMetaItemVariants()}>{gender}</span>
                )}
              </span>
            )}
          </div>
        </div>

        <Radio
          size="md"
          value={value}
          checked={selected}
          onCheckedChange={onSelectedChange}
          aria-labelledby={nameId}
          className={cn(beneficiarySelectorControlVariants(), classNames?.control)}
        />

        {badge != null && (
          <span className={cn(beneficiarySelectorBadgeVariants({ device }), classNames?.badge)}>
            {badge}
          </span>
        )}
      </div>
    );
  },
);

BeneficiarySelector.displayName = 'BeneficiarySelector';
