/**
 * The `Father` relationship illustration.
 *
 * Figma `Avatar_user` → `Relationship=Father, Size=xl` — node `1816:9638`.
 *
 * **Taken from the vector asset Figma itself references, not from an export of the
 * node.** Both sources are geometrically equivalent — the node export writes each
 * closing segment explicitly where the asset relies on `Z`, which is cosmetic — but the
 * asset is the shorter path to what the file actually declares, so it is the source of
 * record here. Structure, paint order, stroke colours and widths are byte-for-byte what
 * Figma emits.
 *
 * The lenses looked like solid discs for an unrelated reason, fixed across all thirteen:
 * the root `<svg>` must carry `fill="none"`. Figma puts it there and it cascades to every
 * path that declares no fill of its own — the spectacle rims among them. Drop it and SVG
 * falls back to its default of black, so every stroke-only shape fills in solid. That is
 * why this illustration and Mother were the conspicuous ones: their unfilled shapes are
 * large.
 *
 * Placed with a translate rather than by rewriting coordinates, so every path stays
 * exactly as Figma emitted it. The offset is Figma's own placement of the artwork inside
 * the 48-square frame — node `1816:9641` sits at (2.6, 4.6) — confirmed both from the
 * frame's inset percentages and by differencing all path origins against the previous
 * export. Scale is 1: the asset's width equals its viewBox width.
 *
 * The artwork is resolution-independent, so this one export serves all five Avatar sizes.
 *
 * Decorative by construction: the Avatar labels itself from `name`, so the drawing is
 * `aria-hidden` and carries no accessible name of its own.
 */
export function AvatarFather() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="size-full" aria-hidden focusable="false">
      <g transform="translate(2.6 4.6)">
        <g>
          <path
            d="M26.187 16.4359C25.4128 18.4712 25.292 20.6972 25.8414 22.8043C26.4006 24.8959 26.7618 24.8383 29.8782 25.8307C28.815 28.6399 24.465 31.6975 21.5778 31.7443C18.9762 31.7851 11.7042 28.4659 10.4034 26.1187C11.8662 25.9843 16.257 25.3087 17.0838 23.2135C17.7072 21.222 17.6259 19.0765 16.8534 17.1379L26.187 16.4359Z"
            fill="#FDEDC4"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M22.0324 44.0622C32.1052 44.0502 40.1068 41.925 41.2564 40.5618C42.5764 39.0018 37.7596 30.2491 36.3544 28.3891C36.3544 28.3891 34.9876 26.1955 27.406 24.9391C26.7328 26.9407 24.406 28.3135 21.406 28.3675C18.4504 28.4203 15.4984 27.0775 14.7436 25.0987C7.37441 26.2483 5.068 28.3902 4.4236 29.8686C4.1272 30.5502 0.419207 37.1562 0.400007 39.7446C0.389207 42.7854 13.72 44.073 22.0324 44.0622Z"
            fill="white"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M29.5479 10.6374C29.7183 10.647 31.4751 10.7574 31.9635 11.8086C32.4771 12.9126 31.5495 14.9694 29.1627 15.9558C29.6607 14.2293 29.7919 12.4177 29.5479 10.6374V10.6374Z"
            fill="#FDEDC4"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M13.3311 10.5343C13.1607 10.5439 11.4051 10.6543 10.9155 11.7055C10.4019 12.8095 11.3307 14.8675 13.7163 15.8527C13.2185 14.1261 13.0869 12.3146 13.3299 10.5343H13.3311Z"
            fill="#FDEDC4"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M12.9333 12.0448C12.9404 15.1216 14.0022 18.103 15.9417 20.4916C16.9245 21.6088 18.7437 23.6751 21.4053 23.6859C24.1473 23.6979 26.0277 21.526 26.9817 20.416C28.8617 18.0312 29.8816 15.0815 29.8761 12.0448C30.0885 9.01839 30.3357 5.51076 27.8517 2.91156C26.9993 2.08422 25.9899 1.43605 24.8829 1.00529C23.7759 0.574531 22.5938 0.369925 21.4065 0.403567C20.1196 0.475476 18.8609 0.808661 17.7071 1.38282C16.5532 1.95697 15.5283 2.76009 14.6949 3.74319C12.5793 6.38319 12.7701 9.41319 12.9333 12.0448Z"
            fill="#FDEDC4"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <g>
            <path
              d="M19.2373 8.13468C18.3318 8.07747 17.4284 8.27406 16.6285 8.70231Z"
              fill="white"
            />
            <path
              d="M19.2373 8.13468C18.3318 8.07747 17.4284 8.27406 16.6285 8.70231"
              stroke="#70829B"
              strokeWidth="0.8"
              strokeMiterlimit="10"
              strokeLinecap="round"
            />
          </g>
          <g>
            <path d="M23.941 8.13472C24.8465 8.07738 25.75 8.27398 26.5498 8.70235Z" fill="white" />
            <path
              d="M23.941 8.13472C24.8465 8.07738 25.75 8.27398 26.5498 8.70235"
              stroke="#70829B"
              strokeWidth="0.8"
              strokeMiterlimit="10"
              strokeLinecap="round"
            />
          </g>
          <path
            d="M18.2789 12.0163C18.6467 12.0163 18.9449 11.7181 18.9449 11.3503C18.9449 10.9825 18.6467 10.6843 18.2789 10.6843C17.9111 10.6843 17.6129 10.9825 17.6129 11.3503C17.6129 11.7181 17.9111 12.0163 18.2789 12.0163Z"
            fill="#252D38"
          />
          <path
            d="M24.607 12.0163C24.9748 12.0163 25.273 11.7181 25.273 11.3503C25.273 10.9825 24.9748 10.6843 24.607 10.6843C24.2392 10.6843 23.941 10.9825 23.941 11.3503C23.941 11.7181 24.2392 12.0163 24.607 12.0163Z"
            fill="#252D38"
          />
          <path
            d="M20.5284 16.2672C20.6614 16.3943 20.8197 16.4921 20.9929 16.5541C21.1662 16.6161 21.3505 16.641 21.534 16.6272C21.8195 16.5961 22.086 16.4692 22.29 16.2672"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M19.1598 18.3155C19.4921 18.6316 19.887 18.8744 20.319 19.0284C20.751 19.1824 21.2105 19.2441 21.6678 19.2095C22.3785 19.1321 23.0423 18.8171 23.5518 18.3155"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M13.562 10.555C13.1444 10.7314 12.6092 10.3294 12.5036 10.249C11.2196 9.28301 11.3228 6.71019 12.1244 4.91859C12.6044 3.83859 13.658 2.33741 14.4308 2.53661C15.0548 2.69621 15.3608 3.925 15.3008 4.843C15.2384 5.7958 14.8208 5.8954 14.3936 7.1494C13.7588 9.0226 14.1944 10.2862 13.562 10.555Z"
            fill="#70829B"
          />
          <path
            d="M29.738 10.555C30.1556 10.7314 30.6896 10.3294 30.7964 10.249C32.0804 9.28301 31.9771 6.71019 31.1755 4.91859C30.6955 3.83859 29.6419 2.33741 28.8679 2.53661C28.2451 2.69621 27.9392 3.925 27.998 4.843C28.0604 5.7958 28.478 5.8954 28.9052 7.1494C29.54 9.0226 29.1044 10.2862 29.738 10.555Z"
            fill="#70829B"
          />
          <path
            d="M19.9097 17.0646C20.4031 17.1611 20.9015 17.2304 21.4025 17.2722C22.1993 17.2722 22.3481 17.0598 22.9721 17.0646C23.8973 17.0706 24.9017 17.5446 24.8789 17.859C24.8477 18.3078 22.7657 18.5502 21.3461 18.5586C19.7729 18.5682 17.6261 18.2958 17.6033 17.859C17.5853 17.523 18.7937 17.001 19.9097 17.0646Z"
            fill="#70829B"
          />
          <path
            d="M8.12205 26.8508L5.25645 42.5025C15.8883 44.7299 26.8756 44.6365 37.468 42.2288L34.1596 26.8508L29.8805 25.4313C29.5474 27.4313 28.5233 29.2512 26.9864 30.5738C25.4496 31.8964 23.4974 32.6379 21.4701 32.6692C19.4427 32.7005 17.4686 32.0195 15.8917 30.7449C14.3148 29.4703 13.235 27.6829 12.8405 25.694L8.12205 26.8508Z"
            fill="#D0BEFC"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
          />
          <path
            d="M17.9299 15.748C19.6842 15.748 21.1063 14.3259 21.1063 12.5716C21.1063 10.8174 19.6842 9.39524 17.9299 9.39524C16.1756 9.39524 14.7535 10.8174 14.7535 12.5716C14.7535 14.3259 16.1756 15.748 17.9299 15.748Z"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M24.9612 15.7528C26.7154 15.7528 28.1376 14.3307 28.1376 12.5764C28.1376 10.8221 26.7154 9.4 24.9612 9.4C23.2069 9.4 21.7848 10.8221 21.7848 12.5764C21.7848 14.3307 23.2069 15.7528 24.9612 15.7528Z"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M20.3595 10.5382C21.068 10.3767 21.8037 10.3767 22.5123 10.5382"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M27.8219 11.2039L29.9687 10.6843"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M15.0615 11.2039L12.8595 10.6843"
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
