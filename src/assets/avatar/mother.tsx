/**
 * The `Mother` relationship illustration.
 *
 * Figma `Avatar_user` → `Relationship=Mother, Size=xl` — node `1816:9760`.
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
 * the 48-square frame — node `1816:9763` sits at (5.6, 4.6) — confirmed both from the
 * frame's inset percentages and by differencing all path origins against the previous
 * export. Scale is 1: the asset's width equals its viewBox width.
 *
 * The artwork is resolution-independent, so this one export serves all five Avatar sizes.
 *
 * Decorative by construction: the Avatar labels itself from `name`, so the drawing is
 * `aria-hidden` and carries no accessible name of its own.
 */
export function AvatarMother() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="size-full" aria-hidden focusable="false">
      <g transform="translate(5.6 4.6)">
        <g>
          <path
            d="M18.3635 23.1795C22.4751 23.1795 25.8083 18.7632 25.8083 13.3155C25.8083 7.86777 22.4751 3.45151 18.3635 3.45151C14.2518 3.45151 10.9187 7.86777 10.9187 13.3155C10.9187 18.7632 14.2518 23.1795 18.3635 23.1795Z"
            fill="white"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
          />
          <path
            d="M32.0655 20.8805C31.3298 22.6805 30.1573 24.2687 28.6538 25.5018C27.4838 26.5872 25.9727 27.2321 24.3795 27.3258H24.3518C24.1672 27.3172 23.9838 27.2898 23.8046 27.2442C22.9271 26.9774 22.1741 26.4053 21.6819 25.6314C21.2023 24.8196 21.0151 23.868 21.1514 22.935C22.9962 21.4925 24.3953 19.5576 25.1871 17.3538C25.8783 15.2531 25.9586 12.9992 25.4186 10.8546C25.307 10.4358 24.0566 5.99577 21.8954 5.86857C20.7086 5.79297 20.5598 8.26856 18.029 10.5906C15.1742 13.2066 12.8078 13.599 11.7062 13.617H11.6978C11.531 13.6266 11.1507 13.5894 11.1327 13.5894H11.1134C11.0862 13.5832 11.0579 13.5832 11.0306 13.5894C10.6874 13.5894 10.9106 15.9894 11.5322 17.619C12.3277 19.656 13.6445 21.4483 15.3506 22.8162C15.4068 24.1333 14.9676 25.4237 14.1194 26.433C13.6381 26.9872 13.0266 27.4132 12.3398 27.6726C12.3302 27.6726 12.3206 27.6809 12.311 27.6809C11.8369 27.8517 11.3463 27.9724 10.847 28.041C9.83746 28.1604 8.81408 28.0688 7.84175 27.772C6.86943 27.4751 5.96936 26.9795 5.19864 26.3166C5.15957 26.2723 5.11617 26.2321 5.06906 26.1965C2.54906 23.9537 2.34506 20.5446 2.24186 19.323C1.76186 14.1726 5.48185 8.52897 9.27865 5.09337C11.5683 3.03417 14.7327 0.180579 19.0779 0.413379C21.5816 0.648654 23.944 1.6803 25.8182 3.35695C31.0262 7.42615 34.3275 15.1469 32.0655 20.8805Z"
            fill="#BFC8D2"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
          />
          <path
            d="M21.3575 22.7531C21.11 23.7136 21.2223 24.7315 21.6731 25.6151C22.1653 26.389 22.9184 26.9611 23.7959 27.2279C21.9773 29.0205 20.5312 31.1551 19.5407 33.5087C19.2155 34.3283 18.7895 35.5871 18.1223 35.6051C17.4551 35.6231 16.9631 34.4207 16.4999 33.4535C15.4697 31.3226 14.1838 29.3251 12.6707 27.5051C12.5507 27.5411 12.4391 27.5963 12.3107 27.6419C12.9973 27.3818 13.6091 26.9559 14.0915 26.4023C14.9308 25.3579 15.333 24.0289 15.2135 22.6943C13.4969 21.397 12.2026 19.6209 11.4935 17.5895C11.0637 16.2893 10.8937 14.9173 10.9931 13.5515C10.9708 12.6554 11.1817 11.7689 11.6051 10.9787C12.8651 9.12834 15.4151 10.5251 18.3455 8.4899C20.3663 7.0871 20.6723 5.77428 21.8591 5.84988C24.0191 5.96988 25.2707 10.4099 25.3823 10.8359C25.9271 12.98 25.8467 15.2353 25.1507 17.3351C24.4471 19.4751 23.1276 21.3598 21.3575 22.7531V22.7531Z"
            fill="#FDEDC4"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M11.5119 17.6291C9.5739 16.7447 8.8419 15.0563 9.2955 14.1287C9.49542 13.8505 9.75452 13.6202 10.0541 13.4542C10.3538 13.2882 10.6865 13.1907 11.0283 13.1687C10.9843 13.8182 10.9907 14.4701 11.0475 15.1187C11.112 15.9697 11.2677 16.8113 11.5119 17.6291Z"
            fill="#FDEDC4"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M0.495144 40.6179C-0.330456 37.8279 4.46355 30.2715 5.07555 29.6235C7.21755 27.3351 12.5384 27.1347 12.6692 27.0891C14.2187 28.8835 15.5078 30.8871 16.4983 33.0411C16.8967 33.9171 17.3695 34.9827 17.9911 34.9611C18.5011 34.9515 18.7328 34.2219 19.9844 31.9983C20.5507 30.9305 21.1873 29.9014 21.89 28.9179C22.4587 28.1563 23.0948 27.4474 23.7908 26.7999C23.8472 26.8095 23.942 26.8179 24.05 26.8359C25.2761 26.8522 26.4871 27.1102 27.6134 27.5952C28.7398 28.0801 29.7594 28.7824 30.6139 29.6619C31.2715 30.2811 36.0836 37.7847 35.0276 40.7643C34.3604 42.6519 27.5875 43.9551 17.7271 43.9551C8.60235 43.9527 1.06994 42.5691 0.495144 40.6179Z"
            fill="#D0BEFC"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M25.2624 17.0469C27.1908 16.1529 27.924 14.4669 27.456 13.5381C27.0852 12.7905 25.9824 12.6177 25.7232 12.5781C25.7754 13.2276 25.7722 13.8804 25.7136 14.5293C25.6535 15.3822 25.5022 16.2262 25.2624 17.0469V17.0469Z"
            fill="#FDEDC4"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M21.37 22.7312C21.37 22.7312 19.1848 25.1312 15.25 22.7312"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
          />
          <path
            d="M16.2905 19.6872C17.5541 20.6472 18.7097 21.2856 20.5625 19.6656"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.4812 17.3499C17.5899 17.4962 17.7314 17.6149 17.8942 17.6967C18.057 17.7786 18.2367 17.8212 18.419 17.8212C18.6012 17.8212 18.7809 17.7786 18.9437 17.6967C19.1066 17.6149 19.248 17.4962 19.3568 17.3499"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.3303 14.8295C15.706 14.8295 16.0107 14.5249 16.0107 14.1491C16.0107 13.7733 15.706 13.4687 15.3303 13.4687C14.9545 13.4687 14.6499 13.7733 14.6499 14.1491C14.6499 14.5249 14.9545 14.8295 15.3303 14.8295Z"
            fill="#252D38"
          />
          <path
            d="M21.799 14.8295C22.1748 14.8295 22.4794 14.5249 22.4794 14.1491C22.4794 13.7733 22.1748 13.4687 21.799 13.4687C21.4232 13.4687 21.1186 13.7733 21.1186 14.1491C21.1186 14.5249 21.4232 14.8295 21.799 14.8295Z"
            fill="#252D38"
          />
          <path
            d="M15.4281 17.2048C16.8934 17.2048 18.0813 16.0169 18.0813 14.5516C18.0813 13.0863 16.8934 11.8984 15.4281 11.8984C13.9627 11.8984 12.7749 13.0863 12.7749 14.5516C12.7749 16.0169 13.9627 17.2048 15.4281 17.2048Z"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M21.3062 17.2048C22.7716 17.2048 23.9594 16.0169 23.9594 14.5516C23.9594 13.0863 22.7716 11.8984 21.3062 11.8984C19.8409 11.8984 18.653 13.0863 18.653 14.5516C18.653 16.0169 19.8409 17.2048 21.3062 17.2048Z"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M17.4716 12.8523C17.7685 12.7847 18.072 12.7509 18.3765 12.7516C18.6773 12.7521 18.9771 12.7859 19.2704 12.8523"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M23.6967 13.4062L25.4907 12.9718"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <path
            d="M13.0395 13.4062L11.1999 12.9718"
            stroke="#252D38"
            strokeWidth="0.8"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
          <g>
            <path
              d="M15.7389 10.5397C14.8144 10.4807 13.8917 10.681 13.0749 11.1181Z"
              fill="white"
            />
            <path
              d="M15.7389 10.5397C14.8144 10.4807 13.8917 10.681 13.0749 11.1181"
              stroke="#252D38"
              strokeWidth="0.8"
              strokeMiterlimit="10"
              strokeLinecap="round"
            />
          </g>
          <g>
            <path
              d="M20.5561 10.5396C21.4802 10.481 22.4024 10.6813 23.2189 11.118Z"
              fill="white"
            />
            <path
              d="M20.5561 10.5396C21.4802 10.481 22.4024 10.6813 23.2189 11.118"
              stroke="#252D38"
              strokeWidth="0.8"
              strokeMiterlimit="10"
              strokeLinecap="round"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}
