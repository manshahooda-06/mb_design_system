/**
 * The Verified status badge.
 *
 * Figma `_Icon Status` → `State=Verified` — node `1816:10700`.
 *
 * **Verified is not a coloured dot.** Online and Offline are two concentric discs — a
 * white outer ring with a coloured inner disc — but Verified is a scalloped seal with a
 * tick cut into it, and it carries no white ring at all.
 *
 * The tick is part of this asset because Figma draws it (node `1816:10702`). Avatar owns
 * the whole badge: `status` selects a state and nothing about its artwork is reachable
 * from props.
 *
 * Exported as the composed symbol rather than its two vectors separately. Figma builds
 * the seal from a rosette rotated 22.5°, expressed in the design context as a `hypot()`
 * container query; exporting the composed node bakes that rotation into the path and
 * removes any need to reproduce the maths. The 10-square viewBox is the component's own
 * size in Figma, and an SVG root clips exactly where Figma's `overflow-clip` does.
 *
 * The seal takes `currentColor` so it themes with the rest of the status set, which is
 * token-driven — Figma binds brand-blue/600, the value behind `bg-brand-solid`. The tick
 * stays literal white: Figma binds base/white, a primitive that does not flip with mode,
 * and a white tick is correct on a blue seal either way.
 *
 * Decorative: the Avatar labels itself from `name` and the badge wrapper is `aria-hidden`,
 * so this carries no accessible name of its own.
 */
export function AvatarVerifiedBadge() {
  return (
    <svg viewBox="0 0 10 10" fill="none" className="size-full" aria-hidden focusable="false">
      <path
        d="M7.72237 1.7708C7.81734 2.0005 7.99965 2.18307 8.2292 2.27839L9.03413 2.61181C9.26384 2.70696 9.44635 2.88947 9.5415 3.11918C9.63665 3.34889 9.63665 3.607 9.5415 3.83671L9.20833 4.64106C9.11313 4.87088 9.113 5.12924 9.20863 5.35895L9.54122 6.16306C9.58839 6.27684 9.61268 6.39879 9.6127 6.52195C9.61272 6.64512 9.58847 6.76708 9.54134 6.88087C9.4942 6.99466 9.42511 7.09805 9.33801 7.18512C9.2509 7.2722 9.14749 7.34126 9.03369 7.38836L8.22934 7.72153C7.99964 7.81651 7.81706 7.99881 7.72174 8.22836L7.38833 9.03329C7.29318 9.26301 7.11067 9.44551 6.88096 9.54066C6.65124 9.63581 6.39314 9.63582 6.16343 9.54066L5.35907 9.20749C5.12935 9.11257 4.87134 9.11277 4.64177 9.20803L3.83684 9.54096C3.60725 9.63589 3.34937 9.63581 3.11984 9.54074C2.89032 9.44567 2.70791 9.26338 2.6127 9.03391L2.27918 8.22874C2.18421 7.99904 2.0019 7.81647 1.77235 7.72114L0.967421 7.38773C0.737807 7.29262 0.555355 7.11023 0.460169 6.88065C0.364983 6.65107 0.364854 6.39308 0.45981 6.16341L0.792984 5.35905C0.8879 5.12933 0.887707 4.87132 0.792445 4.64175L0.459749 3.83624C0.41258 3.72246 0.388291 3.60051 0.388272 3.47734C0.388252 3.35418 0.412501 3.23222 0.459634 3.11843C0.506767 3.00464 0.57586 2.90125 0.662965 2.81418C0.75007 2.7271 0.853479 2.65804 0.967283 2.61094L1.77164 2.27777C2.00113 2.18288 2.1836 2.0008 2.27899 1.77151L2.6124 0.966585C2.70755 0.736871 2.89006 0.554364 3.11978 0.459214C3.34949 0.364063 3.60759 0.364063 3.83731 0.459214L4.64166 0.792388C4.87138 0.887304 5.12939 0.88711 5.35897 0.791848L6.16424 0.45973C6.39392 0.364633 6.65197 0.364653 6.88164 0.459784C7.11131 0.554916 7.29379 0.737371 7.38895 0.967025L7.72247 1.77219L7.72237 1.7708Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.95829 3.68914C7.02509 3.58421 7.04747 3.45705 7.02051 3.33562C6.99356 3.21419 6.91946 3.10844 6.81454 3.04164C6.70961 2.97484 6.58245 2.95245 6.46102 2.97941C6.33959 3.00637 6.23384 3.08046 6.16704 3.18539L4.33141 6.06976L3.49141 5.01976C3.41375 4.92263 3.30069 4.86032 3.17709 4.84655C3.05349 4.83278 2.92949 4.86867 2.83235 4.94633C2.73522 5.02398 2.67291 5.13705 2.65914 5.26065C2.64536 5.38424 2.68125 5.50825 2.75891 5.60539L4.00891 7.16789C4.0555 7.22619 4.11533 7.27253 4.18344 7.30305C4.25154 7.33357 4.32595 7.34739 4.40047 7.34335C4.47499 7.33932 4.54747 7.31755 4.61188 7.27985C4.67629 7.24216 4.73077 7.18963 4.77079 7.12664L6.95829 3.68914Z"
        fill="white"
      />
    </svg>
  );
}
