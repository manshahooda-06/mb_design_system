/**
 * Every role and label Avatar applies.
 *
 * Hoisted rather than inlined, following the frontend repo's component convention
 * (`HOSPITAL_DOCTOR_SEARCH_CONSTANTS`): anything a screen reader reads lives in one place.
 *
 * There is no `IMAGES` block here, and deliberately so. The frontend repo sources artwork
 * from remote CDN URLs, but Figma publishes all thirteen relationship illustrations and
 * the Verified seal **inside** `Avatar_user`, which makes them design-system content. They
 * stay bundled in `@assets/avatar` with their geometry and `fill="none"` root intact.
 */
export const AVATAR_CONSTANTS = {
  ROLES: {
    /**
     * Applied only when `name` is given, so an avatar standing alone for a person is
     * announced. Without a name the avatar is decorative and carries no role at all.
     */
    IMAGE: 'img',
  },
} as const;
