/**
 * The `No Gender` relationship illustration.
 *
 * Figma `Avatar_user` → `Relationship=No Gender, Size=xl` — node `1816:10691`. Taken from
 * that variant's `avatar` layer, exported at 48 into a `0 0 48 48` viewBox; the artwork
 * is resolution-independent, so this one export serves all five Avatar sizes.
 *
 * Decorative by construction: the Avatar labels itself from `name`, so the drawing is
 * `aria-hidden` and carries no accessible name of its own.
 */
export function AvatarNoGender() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="size-full" aria-hidden focusable="false">
      <g>
        <g>
          <path
            d="M25.2224 49.0165C34.64 49.0045 42.122 47.0173 43.196 45.7441C44.4248 44.2861 39.926 36.1021 38.6132 34.3621C38.6132 34.3621 37.334 32.3113 30.2456 31.1377C29.6144 33.0097 27.4448 34.2925 24.638 34.3429C21.878 34.3909 19.118 33.1333 18.4088 31.2901C11.5196 32.3701 9.36323 34.3669 8.76323 35.7529C8.48603 36.3889 5.01802 42.5641 5.00002 44.9869C4.97962 47.8225 17.4488 49.0249 25.2224 49.0165Z"
            fill="#FCD9B8"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M15.809 18.8013C15.7594 15.9432 15.8598 13.0363 17.8314 10.8463C19.5119 9.20081 21.7772 8.1884 24.1998 8.0001C26.5936 8.1407 28.8381 9.13794 30.4691 10.7855C32.3936 12.966 32.6644 15.9706 32.5894 18.8001C32.4 23.5433 28.8484 29.6001 24.1998 29.6001C19.5512 29.6001 15.9793 23.5672 15.809 18.8013Z"
            fill="#F5F7F8"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
