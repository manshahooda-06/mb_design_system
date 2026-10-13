/**
 * Derives up to two initials from a name.
 *
 * First letter of the first word plus the first letter of the last — so "Olivia Rhye"
 * gives "OR", matching the string Figma hardcodes into its `Initials (Name)` variant. A
 * single word gives one letter rather than two, because "Ol" reads as a truncation
 * where "O" reads as an initial.
 *
 * Split with `Array.from` rather than `[0]` so an astral character — an emoji, or a
 * script outside the BMP — yields a whole character instead of half a surrogate pair,
 * which would render as a replacement glyph.
 *
 * Casing is deliberately not applied here: the initials are uppercased in CSS so the
 * accessible name keeps whatever the caller passed.
 *
 * Lives apart from `Avatar.tsx` because a module exporting both a component and a
 * helper defeats React Fast Refresh — the same reason `composeRefs` is not inside
 * `Slot`.
 */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = Array.from(words[0] ?? '')[0] ?? '';
  if (words.length === 1) return first;
  const last = Array.from(words[words.length - 1] ?? '')[0] ?? '';
  return first + last;
}
