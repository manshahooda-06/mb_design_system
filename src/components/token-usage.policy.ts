/**
 * The token-consumption rule every component is held to.
 *
 * **The rule.** A component styles itself from semantic tokens. Where a semantic
 * foundation does not exist yet, it may use the corresponding primitive. Today
 * that exemption covers exactly typography and radius. Any other primitive — a
 * colour, a spacing step — is a violation, as is a hardcoded arbitrary value.
 *
 * **Why it is enforced rather than documented.** "Use semantic tokens" is the kind
 * of rule that holds for three components and then quietly stops, because
 * `text-gray-500` is always the fastest way to finish. By the time the drift is
 * visible it is spread across every component and a theme change no longer works.
 *
 * **Why the exemption expires by itself.** The allowlist is derived from which
 * semantic collections exist, not from a constant someone has to remember to edit.
 * The day `--radius-semantic-*` is generated, radius leaves the allowlist and every
 * component still using `rounded-md` fails — which is the migration prompt, arriving
 * exactly when the migration becomes possible. See {@link deriveAllowlist}.
 *
 * This module is validation tooling, not shipped code: it is unreachable from the
 * package entry point and excluded from the type build.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** A family of design tokens, identified by the CSS variable namespace it uses. */
export type TokenCategory = 'color' | 'spacing' | 'container' | 'radius' | 'typography';

/**
 * CSS variable namespace to token category.
 *
 * Longest prefix wins, so `--font-weight-` is tested before `--font-`.
 */
const VAR_NAMESPACES: [prefix: string, category: TokenCategory][] = [
  ['--font-weight-', 'typography'],
  ['--container-', 'container'],
  ['--tracking-', 'typography'],
  ['--leading-', 'typography'],
  ['--spacing-', 'spacing'],
  ['--radius-', 'radius'],
  ['--color-', 'color'],
  ['--font-', 'typography'],
  ['--text-', 'typography'],
];

/**
 * Tailwind utility prefix to the token categories it can read.
 *
 * This encodes *Tailwind's* namespace mapping, not Mozaic's token names — the
 * token names themselves are read from the generated stylesheets, so nothing here
 * needs updating when a token is added or renamed.
 *
 * `text-` appears twice because it genuinely is two utilities: `text-primary` is a
 * colour and `text-desktop-body-md` is a type style. Which one a class means is
 * decided by membership, not by the prefix.
 */
const UTILITY_PREFIXES: [prefix: string, categories: TokenCategory[]][] = [
  ['drop-shadow', ['color']],
  ['inset-ring', ['color']],
  ['inset-shadow', ['color']],
  ['ring-offset', ['color']],
  ['placeholder', ['color']],
  ['decoration', ['color']],
  ['scroll-m', ['spacing']],
  ['scroll-p', ['spacing']],
  ['tracking', ['typography']],
  ['leading', ['typography']],
  ['rounded', ['radius']],
  ['divide', ['color']],
  ['accent', ['color']],
  ['stroke', ['color']],
  ['shadow', ['color']],
  ['indent', ['spacing']],
  ['outline', ['color']],
  ['min-w', ['spacing', 'container']],
  // Positional utilities read the spacing namespace too. Without these, a class like
  // `left-semantic-2xl` resolves to nothing and is reported as an unknown token even
  // though Tailwind emits it — verified against the built stylesheet. `inset-ring` and
  // `inset-shadow` are longer and so still win the prefix match, which is what the
  // length sort below exists for. `inset` is already listed further down.
  ['top', ['spacing']],
  ['right', ['spacing']],
  ['bottom', ['spacing']],
  ['left', ['spacing']],
  ['max-w', ['spacing', 'container']],
  ['min-h', ['spacing']],
  ['max-h', ['spacing']],
  ['basis', ['spacing', 'container']],
  ['caret', ['color']],
  ['space', ['spacing']],
  ['inset', ['spacing']],
  ['fill', ['color']],
  ['from', ['color']],
  ['ring', ['color']],
  ['font', ['typography']],
  ['text', ['color', 'typography']],
  // `border-<n>` reads `--border-width-*`, a namespace of its own that has no
  // export yet — so only the colour reading is checkable today.
  ['border', ['color']],
  ['via', ['color']],
  ['gap', ['spacing']],
  ['size', ['spacing', 'container']],
  ['bg', ['color']],
  ['to', ['color']],
  ['w', ['spacing', 'container']],
  ['h', ['spacing']],
  ['p', ['spacing']],
  ['m', ['spacing']],
];

/** The box sides and axes Tailwind fuses onto a prefix: `px-4`, `mt-8`. */
const FUSED_SIDES = ['x', 'y', 't', 'r', 'b', 'l', 's', 'e'];

/** Prefixes that fuse a side rather than separating it with a dash. */
const FUSES_SIDE = new Set(['p', 'm']);

/** Sides written as their own segment: `gap-x-2`, `rounded-tl-md`, `inset-y-0`. */
const DASHED_SIDE = /^(x|y|t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee)-/;

/**
 * Every utility prefix, longest first.
 *
 * Sorted rather than hand-ordered so `min-w` cannot be shadowed by `m`, and so
 * adding a prefix does not require reasoning about where in the list it belongs.
 */
const PREFIXES: [prefix: string, categories: TokenCategory[]][] = UTILITY_PREFIXES.flatMap(
  ([prefix, categories]) =>
    FUSES_SIDE.has(prefix)
      ? [
          [prefix, categories] as [string, TokenCategory[]],
          ...FUSED_SIDES.map((side) => [prefix + side, categories] as [string, TokenCategory[]]),
        ]
      : [[prefix, categories] as [string, TokenCategory[]]],
).sort(([a], [b]) => b.length - a.length);

/** Every token name the design system currently emits, grouped by layer and category. */
export interface TokenIndex {
  /** Primitive token names per category, e.g. `spacing` → `{'4', '0-5', …}`. */
  primitives: Record<TokenCategory, Set<string>>;
  /** Semantic token names per category, e.g. `color` → `{'semantic-bg-primary', …}`. */
  semantics: Record<TokenCategory, Set<string>>;
}

const CATEGORIES: TokenCategory[] = ['color', 'spacing', 'container', 'radius', 'typography'];

function emptySets(): Record<TokenCategory, Set<string>> {
  return Object.fromEntries(CATEGORIES.map((c) => [c, new Set<string>()])) as Record<
    TokenCategory,
    Set<string>
  >;
}

function categoryOf(varName: string): TokenCategory | undefined {
  return VAR_NAMESPACES.find(([prefix]) => varName.startsWith(prefix))?.[1];
}

/**
 * Reads every generated stylesheet and records which token names exist.
 *
 * Deliberately reads the CSS rather than importing the TypeScript token modules:
 * the CSS is what a class name actually resolves against, so a mismatch between
 * the two layers cannot make this check pass on tokens that do not exist.
 */
export function buildTokenIndex(srcDir: string): TokenIndex {
  const index: TokenIndex = { primitives: emptySets(), semantics: emptySets() };

  for (const [layer, bucket] of [
    ['foundations', index.primitives],
    ['semantic', index.semantics],
  ] as const) {
    const layerDir = join(srcDir, layer);
    for (const entry of readdirSync(layerDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const file = join(layerDir, entry.name, `${entry.name}.css`);
      let css: string;
      try {
        css = readFileSync(file, 'utf8');
      } catch {
        continue; // A foundation whose export has not landed yet.
      }

      for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:/g)) {
        const name = match[1];
        if (!name) continue;
        const category = categoryOf(name);
        if (!category) continue;
        bucket[category].add(name.replace(/^--[a-z]+(-weight)?-/, ''));
      }
    }
  }

  return index;
}

/**
 * Which categories have a semantic collection.
 *
 * Derived from the directory a token was declared in rather than from its name.
 * That distinction is load-bearing: the Container collection predates the
 * `-semantic-` qualifier convention and emits `--container-desktop` and
 * `--spacing-container-padding-*`, so a name-based test would classify three
 * semantic tokens as primitives and forbid components from using them.
 */
export function semanticCategories(index: TokenIndex): Set<TokenCategory> {
  return new Set(CATEGORIES.filter((c) => index.semantics[c].size > 0));
}

/**
 * Which primitive categories a component may still use.
 *
 * A category is exempt exactly while it has no semantic collection. Nothing here
 * names typography or radius: they are exempt today because
 * `src/semantic/typography` and `src/semantic/radius` do not exist, and they stop
 * being exempt the moment those are generated.
 */
export function deriveAllowlist(index: TokenIndex): Set<TokenCategory> {
  const semantic = semanticCategories(index);
  return new Set(CATEGORIES.filter((c) => !semantic.has(c)));
}

export type Verdict =
  /** Not a design-token utility — `flex`, `items-center`, `ring-2`. */
  | { kind: 'ignored' }
  /** Reads a semantic token. Always permitted. */
  | { kind: 'semantic' }
  /** Reads a primitive token. Permitted only while the category is exempt. */
  | { kind: 'primitive'; category: TokenCategory; allowed: boolean }
  /** Names a semantic token that does not exist — a typo or a renamed token. */
  | { kind: 'unknown' }
  /** A hardcoded value, e.g. `p-[13px]` or `bg-[#fff]`. Never permitted. */
  | { kind: 'arbitrary' };

/**
 * Strips Tailwind variant prefixes and modifiers down to the base utility.
 *
 * Colons inside square brackets are not variant separators —
 * `text-[color:var(--x)]` is one utility, not a `text-[color` variant of
 * `var(--x)]` — so the scan for the last separator stops at the first bracket.
 */
/** Drops `hover:`, `peer-checked:` and friends, plus a leading `!` or `-`. */
function stripVariants(className: string): string {
  const bracket = className.indexOf('[');
  const searchable = bracket === -1 ? className : className.slice(0, bracket);
  const lastColon = searchable.lastIndexOf(':');
  return className
    .slice(lastColon + 1)
    .replace(/^!/, '')
    .replace(/^-/, '');
}

function baseUtility(className: string): string {
  return stripVariants(className).split('/')[0] ?? '';
}

/**
 * Decides what a single class name reads from the token layer.
 *
 * Anything unrecognised is `ignored` rather than a violation: this scans real
 * source files, and treating every unknown string as a breach would make the rule
 * unusable. The check is deliberately sound on what it does flag rather than
 * exhaustive over what it might.
 */
export function classifyClass(
  className: string,
  index: TokenIndex,
  allowlist: Set<TokenCategory>,
): Verdict {
  const base = baseUtility(className);
  if (!base) return { kind: 'ignored' };
  if (base.includes('[')) return { kind: 'arbitrary' };

  // A bare `n/m` is a **fraction**, not an opacity modifier, and `baseUtility` cannot
  // tell them apart — it drops everything after the slash, which turns `size-4/5` into
  // spacing step 4 and reports a violation for a class that references no token at all.
  // A proportion is unrepresentable in the token layer by construction: tokens are
  // absolute lengths, and `4/5` means four-fifths of whatever the parent happens to be.
  // So it is ignored rather than exempted — an exception would imply a gap a foundation
  // could one day close, and no foundation can publish "80% of my parent".
  //
  // Sound because the opacity modifier never follows a bare integer: it attaches to a
  // named token (`bg-semantic-bg-brand-solid/50`), so the two forms cannot collide.
  if (/-\d+\/\d+$/.test(stripVariants(className))) return { kind: 'ignored' };

  for (const [prefix, categories] of PREFIXES) {
    if (!base.startsWith(`${prefix}-`)) continue;

    const remainder = base.slice(prefix.length + 1);
    // `gap-x-2`, `rounded-tl-md`, `inset-y-0`: the side is its own segment.
    const dashed = DASHED_SIDE.exec(remainder);
    const candidates = dashed ? [remainder, remainder.slice(dashed[0].length)] : [remainder];

    for (const category of categories) {
      for (const candidate of candidates) {
        // Semantic first: a name can only belong to one layer, and the semantic
        // layer is the one components are meant to reach.
        if (index.semantics[category].has(candidate)) return { kind: 'semantic' };
        if (index.primitives[category].has(candidate)) {
          return { kind: 'primitive', category, allowed: allowlist.has(category) };
        }
      }
    }
  }

  // A class that looks semantic but matched nothing is a dangling reference: it
  // produces no CSS at all, so the element silently renders unstyled. Tailwind
  // does not warn, and it looks correct in review — exactly the failure mode the
  // token layer's own dangling-`var()` check exists to prevent.
  if (/(^|-)semantic-/.test(base)) return { kind: 'unknown' };

  return { kind: 'ignored' };
}

/**
 * Classes exempted by an explicit, recorded decision — never by convenience.
 *
 * Grouped **by cause**, not by class. Eleven causes force thirty-three classes open,
 * and that ratio is the point: eleven of them are one fact about Tag's padding, not
 * eleven separate concessions. Reading a flat map of thirty-three near-identical reasons
 * hides how few real gaps there are and how few fixes would close them.
 *
 * Two kinds of thing force this open. Figma pins geometry to values no token backs,
 * and binds a handful of colours to primitives where the matching semantic token
 * does not exist. Rounding the first to the nearest token would visibly deviate from
 * the design; substituting a same-valued semantic token for the second would claim a
 * meaning the design system has not agreed.
 *
 * Every group names what would repay it. This array is the **only** place an
 * exception is declared: {@link DOCUMENTED_EXCEPTIONS} is derived from it, so the two
 * cannot disagree. `token-usage.test.ts` asserts this grouping cause by cause, which
 * is what forces a cause to be written down rather than an entry slipped in.
 */

/** One gap in the token layer, and every class it forces open. */
export interface ExceptionGroup {
  /** The gap itself, in a few words — what would have to change to close it. */
  cause: string;
  /** Shown to whoever hits the violation. Names the component and the repayment. */
  reason: string;
  /** Every class this one cause forces. A class may appear in exactly one group. */
  classes: string[];
}

export const EXCEPTION_GROUPS: ExceptionGroup[] = [
  {
    cause: 'No Sizing foundation — pinned control heights',
    reason:
      'Input and Textarea control height — Figma pins the frame and the padding ' +
      'provably does not sum to it; no token exists. Repaid by a Sizing foundation.',
    classes: ['h-[44px]', 'h-[56px]', 'h-[120px]', 'h-[132px]'],
  },
  {
    cause: 'No Sizing foundation — glyph and control sizes',
    reason:
      'Tag checkbox, tick and close glyph, and the Avatar box and status badge — ' +
      'Figma pins 10, 14, 18 and 36, none of which is a step on any scale. 12 and 16 ' +
      'come from spacing tokens; these cannot. Avatar reuses 10 and 14 for its badge ' +
      'ramp, which is why only 36 is new. Repaid by a Sizing foundation.',
    classes: ['size-[10px]', 'size-[14px]', 'size-[18px]', 'size-[36px]'],
  },
  {
    cause: 'Semantic spacing stops at 160px',
    reason:
      'InputDropdown menu max height — 320px and 256px are exact primitive spacing ' +
      'tokens, but the semantic scale ends at 11xl 160px so neither is reachable ' +
      'through a semantic token. Repaid by extending the semantic spacing scale.',
    classes: ['max-h-80', 'max-h-64'],
  },
  {
    cause: 'No semantic border token at error/600',
    reason:
      'Input, Textarea and OtpInput error stroke — Figma binds Colors/error/600 and ' +
      'no border-* semantic token resolves to it. fg-error-primary is deliberately ' +
      'not substituted: same value, different meaning. Repaid by a semantic border ' +
      'token at error/600.',
    classes: [
      'inset-ring-error-600',
      'focus-within:inset-ring-error-600',
      'focus:inset-ring-error-600',
    ],
  },
  {
    cause: 'No semantic background token at brand/25',
    reason:
      'InputDropdown selected menu row — Figma binds Colors/brand/25, the only ' +
      'colour in that component with no semantic alias of any role. Repaid by a ' +
      'semantic background token at brand/25.',
    classes: ['bg-brand-25'],
  },
  {
    cause: 'Tailwind cannot order the shadow slot ahead of the ring slots',
    reason:
      'OtpInput focused cell — every value in the list reads a token, but the order ' +
      'cannot come from utilities: Tailwind places the shadow slot behind the ring ' +
      'slots where Figma paints it in front. Repaid if that ordering becomes ' +
      'configurable.',
    classes: [
      'focus:shadow-[var(--shadow-elevation-1),0_0_0_2px_var(--color-semantic-bg-primary),0_0_0_4px_var(--color-semantic-focus-ring)]',
    ],
  },
  {
    cause: 'Figma hardcodes Input and Textarea padding',
    reason:
      'Input sm and Textarea horizontal padding, Input sm vertical padding, and ' +
      "InputDropdown multi-select's vertical padding around a Tag row — hardcoded in " +
      'Figma while sibling variants bind spacing tokens for the same properties. ' +
      'Repaid when Figma binds these to the scale.',
    classes: ['px-[14px]', 'py-[10px]', 'py-[14px]'],
  },
  {
    cause: 'Spacing scale has no 3, 5, 7, 9 or 10 step',
    reason:
      "Tag's padding and gaps — Figma's 72 variants reduce to two systematic tables, " +
      'a left inset per size x leading element and a right inset per size x action, ' +
      'plus one vertical padding and two gaps. Twenty-one measured values, of which ' +
      'these five steps are absent from both the primitive and the semantic spacing ' +
      'scale. Not eleven decisions: one gap in the scale, surfaced eleven times. ' +
      'Repaid by odd steps on the spacing scale, or by Figma moving Tag onto it.',
    classes: [
      'pl-[5px]',
      'pl-[7px]',
      'pl-[9px]',
      'pl-[10px]',
      'pr-[3px]',
      'pr-[9px]',
      'pr-[10px]',
      'py-[3px]',
      'gap-[3px]',
      'gap-[5px]',
      'px-[5px]',
    ],
  },
  {
    cause: 'No radius token at 3px',
    reason:
      "Tag's count pill — 3px sits between radius-xxs 2 and radius-xs 4. Repaid by a " +
      '3px radius token, or by Figma moving the pill onto the scale.',
    classes: ['rounded-[3px]'],
  },
  {
    cause: 'No spacing or sizing step at 28px',
    reason:
      "SearchBar's Desktop - 1920 search glyph and the animated placeholder window it " +
      'sits beside — Figma pins both at 28, which is `spacing-7`, and the scale runs 6 ' +
      '(24px) straight to 8 (32px) with no 7 step, so no token carries it. The window is ' +
      "28 because that is the line height of the device's type step, so it tracks the " +
      'type ramp rather than a spacing decision. Modal pins 28 too, on both desktop glyph ' +
      'boxes — the header icon and the close — and reaches it through this same entry. ' +
      'Repaid by odd steps on the spacing scale, or by a Sizing foundation.',
    classes: ['size-[28px]', 'h-[28px]'],
  },
  {
    cause: 'No semantic border token at gray/50',
    reason:
      "SearchBar's container stroke — Figma binds Gray (Light mode)/50 and no border-* " +
      'semantic token resolves to it; the three that exist are gray/300, /200 and /100. ' +
      'A same-valued token of another role is deliberately not substituted, exactly as ' +
      'for error/600. Repaid by a semantic border token at gray/50.',
    classes: ['inset-ring-gray-light-50'],
  },
  {
    cause: 'No spacing step at 112px',
    reason:
      "TopNavigationBar's desktop horizontal padding — Figma pins 112, which sits between " +
      'semantic-9xl 96 and semantic-10xl 128 and is on no primitive step either. Repaid by ' +
      'extending the spacing scale, or by Figma moving the bar onto it.',
    classes: ['px-[112px]'],
  },
  {
    cause: 'No Sizing foundation — Beneficiary chip width caps',
    reason:
      "BeneficiarySelectChip's width caps — Figma writes max-width rather than a fixed " +
      'size, so the chip hugs its content and truncates at 132 on mobile and 200 on ' +
      'desktop. Neither is a step on the spacing or container scale. Recorded as a cap ' +
      'rather than dropped because it is what decides when the name truncates. Repaid by ' +
      'a Sizing foundation.',
    classes: ['max-w-[132px]', 'max-w-[200px]'],
  },
  {
    cause: 'No Sizing foundation — Modal desktop card and illustration',
    reason:
      "Modal's desktop card width and the illustration above an `icon+text` heading — " +
      'Figma pins 400 and 120, and neither is a step on the spacing scale: 400 is 25rem, ' +
      'between the 24rem and 30rem primitives, and 120 is on no scale at all. Their ' +
      'mobile counterparts need no exception — 328 is already documented for Toast and 80 ' +
      'is `semantic-8xl` — which is what makes these two the desktop column alone. Repaid ' +
      'by a Sizing foundation.',
    classes: ['w-[400px]', 'size-[120px]'],
  },
  {
    cause: 'No semantic token for black, at any opacity',
    reason:
      "BottomSheet's scrim — Figma fills it with rgba(0,0,0,0.6), and no semantic token " +
      'resolves to black: `bg-overlay` is the semantically right name carrying the wrong ' +
      'value (gray-light-900, and opaque), and the only three tokens that do reach ' +
      '`base-black` are `social-icon-fg-apple`, `-github` and `-angellist`, whose role is ' +
      'something else entirely. Tinting `bg-overlay` to 60% would be a different colour, ' +
      'not a near miss, so the primitive is reached directly with an opacity modifier ' +
      'rather than substituted. Repaid by a semantic overlay token at black, or by Figma ' +
      'binding the scrim to the overlay variable it already has. Modal draws the same scrim, ' +
      'at the same value, and reaches it through this same entry.',
    classes: ['bg-base-black/60'],
  },
  {
    cause: 'No elevation token for Figma’s single-layer Drop shadow/Normal',
    reason:
      "BottomSheet's card — Figma binds the effect style `Drop shadow/Normal`, one layer " +
      'at `0 2px 8px #0000000A`. Every one of the eight elevation tokens is two layers, ' +
      'and the nearest, elevation-1, pairs that same offset with a 4px blur and adds a ' +
      'second layer beneath it, so it is a visibly tighter shadow rather than the same ' +
      'one. Repaid by a shadow foundation covering the effect styles outside the ' +
      'Elevation section — the third component to need one, after Tooltip and Toast.',
    classes: ['[box-shadow:0px_2px_8px_0px_#0000000a]'],
  },
  {
    cause: 'No Sizing foundation — Toast bar widths',
    reason:
      "Toast's pinned frame widths — Figma writes 328 on mobile and 480 on desktop, and " +
      'the layout needs both: the leading content flexes and the trailing content stays ' +
      'intrinsic, which only means anything inside a definite width. 480 is the ' +
      '`spacing-120` primitive exactly, so it is reached through that step rather than an ' +
      'arbitrary value, but the semantic scale stops at 11xl 160 and cannot carry it — the ' +
      "same wall InputDropdown's menu height hit. 328 is on no step at all, primitive or " +
      "semantic. Modal's mobile card is 328 too and reaches it through this same entry. " +
      'Repaid by a Sizing foundation, or by extending the semantic scale.',
    classes: ['w-[328px]', 'w-120'],
  },
  {
    cause: 'No elevation token for Figma’s four-layer Web shadow',
    reason:
      "Toast's desktop shadow — Figma binds the effect style `Web`, which is four layers " +
      '(#00000008 at (0,8) blur 44, then #00000005 at (0,6) blur 4, (0,4) blur 18 and ' +
      '(0,0) blur 10). Every one of the eight elevation tokens is two layers, so none can ' +
      'carry it and no combination of them reproduces it. The mobile variant needs no ' +
      'exception at all by contrast: Figma binds `shadow/elevation-2` there, and this ' +
      "library's token of that name carries those two layers exactly. Written as an " +
      'arbitrary box-shadow rather than a filter because the bar is an opaque rectangle, ' +
      'where the two render identically. Repaid by a shadow foundation covering the effect ' +
      'styles outside the Elevation section.',
    classes: [
      '[box-shadow:0px_8px_44px_0px_#00000008,0px_6px_4px_0px_#00000005,0px_4px_18px_0px_#00000005,0px_0px_10px_0px_#00000005]',
    ],
  },
  {
    cause: 'No Sizing foundation — Upload Module card sizes',
    reason:
      "UploadModule's sm and lg frames — Figma pins 100 and 240, and the primitive " +
      'spacing scale skips both steps (24 straight to 32, and 56 straight to 64), so ' +
      'neither is reachable through any token. The md frame is absent from this list ' +
      'because 160 is semantic-11xl exactly and uses it. Rounding either to a ' +
      'neighbouring step would resize the card, so the measured value is kept. Repaid ' +
      'by a Sizing foundation.',
    classes: ['size-[100px]', 'size-[240px]'],
  },
  {
    cause: 'No elevation token for the Upload Module action shadow',
    reason:
      "UploadModule's view and delete affordances — Figma draws a two-layer shadow on " +
      'each white circle and binds it to no effect style: the variable export for the ' +
      'node lists colours, typography and radii only. No elevation token carries it ' +
      'either, and the near miss is instructive rather than usable — elevation-2 shares ' +
      "sm's offsets and first alpha but blurs 4 and 10 against Figma's 2 and 5, and " +
      'halves the second alpha. Substituting it would visibly soften the affordance. ' +
      'There are three values because Figma scales one 24px design by 1.333 and 2, so ' +
      'the offsets and blurs scale with the circle. Written as an arbitrary box-shadow ' +
      'rather than a filter because each circle is solid and fully round, where the two ' +
      "render identically, and box-shadow is the property an element's shadow belongs " +
      'in. Repaid by a shadow foundation covering the effects Figma leaves unbound.',
    classes: [
      '[box-shadow:0px_1px_2px_0px_#0000000a,0px_4px_5px_0px_#00000014]',
      '[box-shadow:0px_1.333px_2.667px_0px_#0000000a,0px_5.333px_6.667px_0px_#00000014]',
      '[box-shadow:0px_2px_4px_0px_#0000000a,0px_8px_10px_0px_#00000014]',
    ],
  },
  {
    cause: 'No Sizing foundation — Upload Module md action glyph',
    reason:
      "UploadModule's md action glyph — Figma scales its 24px affordance by 1.333, " +
      'which puts the glyph at 21.333 and on no scale. The glyph is exactly two thirds ' +
      'of the circle at all three sizes, and the other two land on tokens (16 and 32), ' +
      'so this one value is the arithmetic remainder of a scale factor rather than a ' +
      'design decision. Kept at the measured value because rounding it to 20 or 24 ' +
      'would change the glyph against its circle. Repaid by Figma placing the md ' +
      'affordance on the scale, or by a Sizing foundation.',
    classes: ['size-[21.333px]'],
  },
  {
    cause: 'Figma pins the Upload Module delete offsets off-scale',
    reason:
      "UploadModule's delete affordance — Figma hangs it across the card's top-right " +
      'corner at offsets that are neither on the spacing scale nor consistent with each ' +
      'other: sm sits at top -13 right -11, putting its centre 1px inside the corner, ' +
      'while md (-17, -17) and lg (-25, -25) put theirs 1px outside. Reproduced as ' +
      'drawn rather than reconciled to a single corner-centred rule, which would move ' +
      "sm by 2px. Repaid by Figma agreeing with itself on the corner's placement.",
    classes: [
      '-top-[13px]',
      '-right-[11px]',
      '-top-[17px]',
      '-right-[17px]',
      '-top-[25px]',
      '-right-[25px]',
    ],
  },
  {
    cause: 'No Sizing foundation — TopNavigationBar boxes',
    reason:
      "TopNavigationBar's logo boxes, mobile action button and middle-slot cap — Figma pins " +
      '180x60 for the logo frame, 172 wide for the artwork inside it, 44x20 for the MERGE ' +
      'button and 360 as the heading cap. None is a step on any scale, and the logo frame is ' +
      "what sets the desktop bar's 60px content height. The artwork's 44px height is absent " +
      'here because the pinned-control-heights group already claims it. Repaid by a Sizing ' +
      'foundation.',
    classes: ['w-[180px]', 'h-[60px]', 'w-[172px]', 'w-[44px]', 'h-[20px]', 'max-w-[360px]'],
  },
  {
    cause: 'No border-width export, and no white border token',
    reason:
      "TopNavigationBar's badge ring — Figma draws a 1.5px white stroke, and the badge's own " +
      'box proves it cannot be a border: 8+41+8 = 57 and 4+17+4 = 25 are text plus padding ' +
      'exactly, so a border box would push them to 60x23 and 28x23. A ring paints outside ' +
      'the box instead. The width has no token because border-width has no Figma export, and ' +
      'no border-* or ring-* semantic token carries white — fg-white is the only one, and it ' +
      'is used for the colour. Repaid by a border-width export plus a white border token.',
    classes: ['ring-[1.5px]'],
  },
  {
    cause: 'No shadow foundation for the uui-shadows collection',
    reason:
      "Tooltip's shadow — Figma binds the effect style `uui-shadows/shadow-lg`, which " +
      'is not in the Shadows section the elevation foundation is transcribed from: that ' +
      'section holds exactly 8 styles, all two-layer, pure black and spread 0, while ' +
      'shadow-lg is three layers of #171b22 with negative spreads. Adding it to ' +
      'elevation.json would contradict that file’s own transcription record, so no ' +
      'elevation token can carry it. It is also a filter rather than a box-shadow, ' +
      'because Figma binds it to the wrapper holding the bubble and the arrow so the ' +
      'shadow traces both as one silhouette. Repaid by a shadow foundation covering the ' +
      'uui-shadows collection — a condition now met: the TopNavigationBar MERGE button ' +
      'needs shadow-xs, making this the second member of the collection in the library.',
    classes: [
      '[filter:drop-shadow(0_2px_1px_#171b220a)_drop-shadow(0_4px_3px_#171b2208)_drop-shadow(0_12px_8px_#171b2214)]',
      '[filter:drop-shadow(0_1px_1px_#171b220d)]',
    ],
  },
];

/**
 * Collapses the groups into the class → reason lookup the scanner wants.
 *
 * Deterministic by construction: keys are inserted in group order, then in class
 * order within a group, so the same input always produces the same object with the
 * same key order.
 *
 * Throws on a class claimed by two groups rather than leaving that to a test.
 * `Object.fromEntries` would silently keep whichever group flattened last, so a class
 * could report a cause that would not actually repay it and nothing would say so.
 * Failing on import means it cannot get that far.
 */
export function flattenExceptions(groups: readonly ExceptionGroup[]): Record<string, string> {
  const flat: Record<string, string> = {};
  const claimedBy = new Map<string, string>();

  for (const { cause, reason, classes } of groups) {
    for (const cls of classes) {
      const already = claimedBy.get(cls);
      if (already !== undefined) {
        throw new Error(
          `Documented exception \`${cls}\` is claimed by two groups: "${already}" and ` +
            `"${cause}". A class belongs to exactly one cause — pick the one that would ` +
            `actually repay it.`,
        );
      }
      claimedBy.set(cls, cause);
      flat[cls] = reason;
    }
  }

  return flat;
}

/**
 * The flat lookup the scanner uses. **Derived — never write this by hand.**
 *
 * It exists because the scanner wants O(1) lookup by class name, not because the
 * class list lives here: that list lives in {@link EXCEPTION_GROUPS}, once.
 */
export const DOCUMENTED_EXCEPTIONS: Record<string, string> = flattenExceptions(EXCEPTION_GROUPS);

export interface Violation {
  /** The offending class name or `var()` reference, exactly as written. */
  reference: string;
  reason: 'forbidden-primitive' | 'arbitrary-value' | 'unknown-token';
  category?: TokenCategory;
  /** What to do about it. */
  suggestion: string;
}

/** Removes comments so prose in JSDoc is never mistaken for a class list. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|\s)\/\/[^\n]*/g, ' ');
}

/**
 * Finds every token-rule violation in one component source file.
 *
 * Scans string and template literals for class names, and the whole file for
 * `var(--…)` references, which is how an inline style would reach a token.
 */
export function findViolations(
  source: string,
  index: TokenIndex,
  allowlist: Set<TokenCategory>,
): Violation[] {
  const code = stripComments(source);
  const violations: Violation[] = [];
  const seen = new Set<string>();

  const add = (violation: Violation) => {
    if (seen.has(violation.reference)) return;
    seen.add(violation.reference);
    violations.push(violation);
  };

  for (const match of code.matchAll(/['"`]([^'"`]*)['"`]/g)) {
    for (const candidate of (match[1] ?? '').split(/\s+/)) {
      // Commas are permitted so arbitrary values such as
      // `transition-[box-shadow,filter]` are seen and rejected rather than
      // silently skipped for not looking like a class. Parentheses are *not*:
      // they would make `var(--color-semantic-…)` parse as a class name, and
      // `var()` references are handled by their own scan below.
      if (!candidate || !/^[!-]?[a-z][a-z0-9:[\]/.#,_-]*$/.test(candidate)) continue;
      if (candidate in DOCUMENTED_EXCEPTIONS) continue;

      const verdict = classifyClass(candidate, index, allowlist);
      if (verdict.kind === 'arbitrary') {
        add({
          reference: candidate,
          reason: 'arbitrary-value',
          suggestion:
            'Arbitrary values bypass the token layer entirely and cannot be themed. ' +
            'Use the token that matches, or add one in Figma if none does.',
        });
      } else if (verdict.kind === 'unknown') {
        add({
          reference: candidate,
          reason: 'unknown-token',
          suggestion:
            'No token of this name exists, so this class produces no CSS and the ' +
            'element renders unstyled. Check the spelling against the generated ' +
            'stylesheet, or the token may have been renamed.',
        });
      } else if (verdict.kind === 'primitive' && !verdict.allowed) {
        add({
          reference: candidate,
          reason: 'forbidden-primitive',
          category: verdict.category,
          suggestion:
            `${verdict.category} has a semantic collection, so components must use it. ` +
            `Replace with the matching \`${verdict.category === 'color' ? 'bg-semantic-…/text-semantic-…' : `${verdict.category}-semantic-…`}\` token.`,
        });
      }
    }
  }

  for (const match of code.matchAll(/var\(\s*(--[a-z0-9-]+)/g)) {
    const varName = match[1];
    if (!varName) continue;
    const category = categoryOf(varName);
    if (!category || allowlist.has(category)) continue;
    // Membership, not name shape — see `semanticCategories` on why Container
    // cannot be recognised by looking for `-semantic-`.
    const tokenName = varName.replace(/^--[a-z]+(-weight)?-/, '');
    if (index.semantics[category].has(tokenName)) continue;
    if (!index.primitives[category].has(tokenName)) continue;
    add({
      reference: `var(${varName})`,
      reason: 'forbidden-primitive',
      category,
      suggestion: `Reference the semantic ${category} token instead of the primitive.`,
    });
  }

  return violations;
}
