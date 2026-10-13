'use client';
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import type { SlotClassNames } from '@/types';
import { AvatarVerifiedBadge, avatarIllustrations, type AvatarRelationship } from '@assets/avatar';
import { cn } from '@utils/cn';
import { AVATAR_CONSTANTS } from './constants';
import { getInitials } from './get-initials';
import {
  avatarContentVariants,
  avatarInitialsVariants,
  avatarRootVariants,
  avatarStatusDotVariants,
  avatarStatusRingVariants,
  avatarStatusSealVariants,
  avatarStatusVariants,
} from './Avatar.variants';

/** Figma's `Size` axis. Boxes are 24 / 32 / 36 / 40 / 48. */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Figma's `_Background` axis. */
export type AvatarBackground = 'white' | 'grey';

/** Figma's `_Icon Status` axis. Omit the prop for no badge. */
export type AvatarStatus = 'online' | 'offline' | 'verified';

type AvatarSlot = 'root' | 'content' | 'initials' | 'status' | 'statusRing' | 'statusDot';

interface AvatarOwnProps {
  size?: AvatarSize;
  background?: AvatarBackground;
  /**
   * The person's name. Used to derive initials when nothing is drawn above them, and as
   * the avatar's accessible name.
   */
  name?: string;
  /**
   * A built-in relationship illustration — the **primary way** to give an Avatar its
   * artwork. Figma publishes thirteen of these inside `Avatar_user`, so they are design
   * system content; they live in `@assets/avatar` and can also be imported directly.
   */
  relationship?: AvatarRelationship;
  /**
   * Custom artwork, for the cases the thirteen do not cover. Takes a node like every
   * other glyph in this library, and loses to `relationship` when both are given.
   */
  illustration?: ReactNode;
  /**
   * Figma's status badge, and the only public control over it. Omitted renders no badge,
   * matching `showIcon=false`.
   *
   * Each state is drawn entirely by the component: `online` and `offline` are a coloured
   * disc inside a white ring, `verified` is the built-in seal with its own white tick.
   * **None of them takes caller artwork** — the badge is design language, not content,
   * so there is no glyph prop to disagree with Figma through.
   */
  status?: AvatarStatus;
  classNames?: SlotClassNames<AvatarSlot>;
}

export type AvatarProps = AvatarOwnProps &
  Omit<ComponentPropsWithoutRef<'span'>, keyof AvatarOwnProps | 'children'>;

/**
 * A person's avatar.
 *
 * Measured from Figma `Avatar_user` (node 1816:9346) — 70 variants,
 * `Relationship`(14) × `Size`(5).
 *
 * **The thirteen relationships ship with the component.** Figma publishes them inside
 * `Avatar_user`, which makes them design-system content rather than something each
 * consumer supplies; `relationship` is the primary API and `illustration` remains for
 * artwork the thirteen do not cover. Figma's `Initials (Name)` is filed as a
 * fourteenth relationship, but it is a content mode — here it is derived from `name`.
 *
 * Content resolves **relationship → illustration → initials → background only**. There
 * is no `src`: `Avatar_user` publishes no photo variant, and photo avatars are a
 * separate Figma set (`doc image`) with its own size scale and a `Shape` axis.
 *
 * Two ramps, both measured tables rather than ratios — the avatar steps 24/32/36/40/48
 * and the badge steps 8/10/12/14/16.
 *
 * The status badge is drawn entirely by the component — `status` is its whole API, and
 * the Verified seal and its tick are owned here rather than injected.
 *
 * ```tsx
 * <Avatar relationship="father" size="lg" background="grey" />
 * <Avatar name="Olivia Rhye" size="md" status="online" />
 * <Avatar relationship="mother" size="xl" status="verified" />
 * <Avatar illustration={<CustomArtwork />} size="xl" />
 * ```
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  {
    size = 'md',
    background = 'white',
    name,
    relationship,
    illustration,
    status,
    className,
    classNames,
    ...rest
  },
  ref,
) {
  const initials = name === undefined ? '' : getInitials(name);
  const Illustration = relationship === undefined ? undefined : avatarIllustrations[relationship];
  const artwork = Illustration !== undefined ? <Illustration /> : (illustration ?? null);
  const hasInitials = artwork === null && initials !== '';

  return (
    <span
      ref={ref}
      // Labelled from `name` when there is one, so an avatar standing alone for a
      // person is announced. Pass `aria-hidden` when it sits beside that same name and
      // would otherwise be read twice.
      {...(name !== undefined ? { role: AVATAR_CONSTANTS.ROLES.IMAGE, 'aria-label': name } : {})}
      {...rest}
      className={cn(avatarRootVariants({ size }), classNames?.root, className)}
    >
      <span className={cn(avatarContentVariants({ background }), classNames?.content)}>
        {artwork}
        {hasInitials && (
          <span className={cn(avatarInitialsVariants({ size }), classNames?.initials)} aria-hidden>
            {initials}
          </span>
        )}
      </span>

      {status !== undefined && (
        <span className={cn(avatarStatusVariants({ size }), classNames?.status)} aria-hidden>
          {status === 'verified' ? (
            // Verified is a different shape, not a different fill: a scalloped seal with
            // no white ring, so it replaces the ring rather than sitting inside one.
            <span
              className={cn(
                avatarStatusSealVariants({ inset: size !== 'xs' }),
                classNames?.statusDot,
              )}
            >
              <AvatarVerifiedBadge />
            </span>
          ) : (
            <span
              // `xs` is the one size Figma does not inset — measured, not an omission.
              className={cn(
                avatarStatusRingVariants({ inset: size !== 'xs' }),
                classNames?.statusRing,
              )}
            >
              <span className={cn(avatarStatusDotVariants({ status }), classNames?.statusDot)} />
            </span>
          )}
        </span>
      )}
    </span>
  );
});

Avatar.displayName = 'Avatar';
