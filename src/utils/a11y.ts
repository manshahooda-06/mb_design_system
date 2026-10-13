/**
 * Shared accessibility helpers.
 *
 * Small on purpose. Each entry exists because more than one component needs it
 * and getting it wrong is a real defect rather than a style preference — not
 * because an `a11y` module ought to have things in it.
 *
 * Notably absent: a visually-hidden helper. Tailwind already ships `sr-only`,
 * and a second implementation would be one more thing to keep correct.
 */

/**
 * The focus indicator every interactive component applies.
 *
 * Shared because a focus ring that varies per component is a focus ring users
 * stop recognising, and because `outline-none` without a replacement indicator is
 * the single most common accessibility regression in a component library. Keeping
 * the removal and the replacement in one string means they cannot be separated.
 *
 * `focus-visible` rather than `focus`: a ring on every mouse click is noise, which
 * is what drives teams to remove it altogether.
 *
 * The offset colour must match the surface behind the component, or the ring's gap
 * shows through as a halo of the wrong colour. `bg-primary` is the default page
 * surface; components on a different surface override the offset colour.
 */
export const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus-ring ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-semantic-bg-primary';

/** The focus indicator for a component in an invalid state. */
export const focusRingError =
  'outline-none focus-visible:ring-2 focus-visible:ring-semantic-focus-ring-error ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-semantic-bg-primary';

/**
 * Renders an ARIA attribute only when it is true.
 *
 * `aria-invalid={false}` and `aria-invalid="false"` are *not* the same as omitting
 * the attribute for several state attributes, and React stringifies `false` rather
 * than dropping it. Returning `undefined` drops it.
 *
 * @example
 * <input aria-invalid={ariaAttr(hasError)} aria-required={ariaAttr(required)} />
 */
export function ariaAttr(condition: boolean | undefined): true | undefined {
  return condition ? true : undefined;
}

/**
 * Renders a data attribute only when it is true, for state-driven styling.
 *
 * Lets a component expose its state to CSS (`data-[loading]:opacity-50`) without
 * pushing state into `className`, which keeps the variant definition the only
 * place classes are decided.
 */
export function dataAttr(condition: boolean | undefined): '' | undefined {
  return condition ? '' : undefined;
}

/**
 * Joins ids for `aria-describedby` and `aria-labelledby`, dropping absent ones.
 *
 * These attributes take a space-separated list, and a stray `undefined` in the
 * string points at an element that does not exist — which assistive technology
 * skips silently, so the description is simply never announced and nothing warns.
 * Returns `undefined` when nothing is left, so the attribute is omitted entirely.
 *
 * @example
 * <input aria-describedby={composeIds(hintId, hasError ? errorId : undefined)} />
 */
export function composeIds(...ids: (string | false | null | undefined)[]): string | undefined {
  const present = ids.filter((id): id is string => Boolean(id));
  return present.length > 0 ? present.join(' ') : undefined;
}
