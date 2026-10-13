/**
 * The relationship illustrations, as design-system assets.
 *
 * These live outside `components/` because they are **artwork, not implementation**:
 * Figma publishes them inside `Avatar_user`, so a consumer cannot be expected to supply
 * them, but nothing about them is component logic. Keeping them here keeps Avatar itself
 * to five files and lets a consumer import a single drawing directly, without reaching
 * into a component's internals.
 *
 * Each is exported individually as a component, and collected into
 * {@link avatarIllustrations} for Avatar's `relationship` prop to look up.
 *
 * Figma's own layer ids and clip paths are stripped from every one. The ids are layer
 * names carrying no meaning, and keeping them would put repeated `id` attributes in the
 * document as soon as two avatars render together; the clip is redundant because
 * Avatar's content slot already clips to the circle.
 *
 * The colours are literal fills rather than tokens. They are illustration artwork, not
 * themeable surfaces, and they do not respond to colour mode in Figma either.
 */
import type { ComponentType } from 'react';

import { AvatarSelfSpouseMale } from './self-spouse-male';
import { AvatarSelfSpouseFemale } from './self-spouse-female';
import { AvatarFather } from './father';
import { AvatarMother } from './mother';
import { AvatarSon } from './son';
import { AvatarDaughter } from './daughter';
import { AvatarBrother } from './brother';
import { AvatarSister } from './sister';
import { AvatarSonInLaw } from './son-in-law';
import { AvatarDaughterInLaw } from './daughter-in-law';
import { AvatarOtherMale } from './other-male';
import { AvatarOtherFemale } from './other-female';
import { AvatarNoGender } from './no-gender';

export { AvatarSelfSpouseMale } from './self-spouse-male';
export { AvatarSelfSpouseFemale } from './self-spouse-female';
export { AvatarFather } from './father';
export { AvatarMother } from './mother';
export { AvatarSon } from './son';
export { AvatarDaughter } from './daughter';
export { AvatarBrother } from './brother';
export { AvatarSister } from './sister';
export { AvatarSonInLaw } from './son-in-law';
export { AvatarDaughterInLaw } from './daughter-in-law';
export { AvatarOtherMale } from './other-male';
export { AvatarOtherFemale } from './other-female';
export { AvatarNoGender } from './no-gender';

/**
 * The Verified status badge — an Avatar asset, but **not** a relationship, so it is
 * deliberately absent from {@link AVATAR_RELATIONSHIPS} and {@link avatarIllustrations}.
 */
export { AvatarVerifiedBadge } from './verified-badge';

/**
 * Every relationship Figma publishes, in the order the file lists them.
 *
 * Thirteen, not fourteen: the `Relationship` axis includes `Initials (Name)`, which is a
 * content mode rather than a drawing, and Avatar derives it from `name`.
 */
export const AVATAR_RELATIONSHIPS = [
  'self-spouse-male',
  'self-spouse-female',
  'father',
  'mother',
  'son',
  'daughter',
  'brother',
  'sister',
  'son-in-law',
  'daughter-in-law',
  'other-male',
  'other-female',
  'no-gender',
] as const;

/**
 * A built-in relationship illustration.
 *
 * Named after Figma's own variants, normalised to kebab-case — which is not the set most
 * people guess. Figma draws **one** illustration for both self and spouse, so
 * `self-spouse-male` and `self-spouse-female` are single variants rather than four;
 * `other-male` and `other-female` are two drawings rather than one neutral `other`, and
 * `no-gender` is the neutral one; `son-in-law` and `daughter-in-law` exist and are easy
 * to miss; and there are **no grandparents anywhere in the set**.
 */
export type AvatarRelationship = (typeof AVATAR_RELATIONSHIPS)[number];

/**
 * Relationship to artwork, for Avatar's `relationship` prop.
 *
 * Components rather than elements, so nothing is constructed until one is rendered.
 * Note that this map references all thirteen, so a bundler cannot drop the unused ones:
 * importing Avatar pulls in every illustration whether or not any is used.
 */
export const avatarIllustrations: Record<AvatarRelationship, ComponentType> = {
  'self-spouse-male': AvatarSelfSpouseMale,
  'self-spouse-female': AvatarSelfSpouseFemale,
  father: AvatarFather,
  mother: AvatarMother,
  son: AvatarSon,
  daughter: AvatarDaughter,
  brother: AvatarBrother,
  sister: AvatarSister,
  'son-in-law': AvatarSonInLaw,
  'daughter-in-law': AvatarDaughterInLaw,
  'other-male': AvatarOtherMale,
  'other-female': AvatarOtherFemale,
  'no-gender': AvatarNoGender,
};
