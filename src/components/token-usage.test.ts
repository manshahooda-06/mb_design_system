/**
 * Enforces the token-consumption rule across every component.
 *
 * Two halves, and both matter:
 *
 * 1. **Synthetic fixtures** prove the rule itself is correct — that it catches a
 *    forbidden primitive, permits an exempt one, and expires the exemption when a
 *    semantic collection appears. These do not depend on any component existing,
 *    so the rule is verified from the day the framework lands rather than from the
 *    day the first component happens to break it.
 * 2. **A scan of the real sources** applies it. This is vacuous while there are no
 *    components; the fixtures are what keep it honest until then.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DOCUMENTED_EXCEPTIONS,
  EXCEPTION_GROUPS,
  buildTokenIndex,
  classifyClass,
  deriveAllowlist,
  findViolations,
  flattenExceptions,
  semanticCategories,
  type TokenIndex,
} from './token-usage.policy';

const SRC = resolve(process.cwd(), 'src');
const index = buildTokenIndex(SRC);
const allowlist = deriveAllowlist(index);

/** The same index with a semantic radius collection added, for expiry tests. */
function withSemanticRadius(): TokenIndex {
  return {
    primitives: index.primitives,
    semantics: { ...index.semantics, radius: new Set(['semantic-button']) },
  };
}

describe('the token index reflects what is actually generated', () => {
  it('reads primitive names out of the generated stylesheets', () => {
    expect(index.primitives.color.has('brand-600')).toBe(true);
    expect(index.primitives.spacing.has('4')).toBe(true);
    expect(index.primitives.radius.has('md')).toBe(true);
    expect(index.primitives.typography.has('medium')).toBe(true);
  });

  it('detects which categories have a semantic collection', () => {
    expect([...semanticCategories(index)].sort()).toEqual(['color', 'container', 'spacing']);
  });

  it('recognises Container as semantic despite its unqualified names', () => {
    // Container predates the `-semantic-` convention. A name-based check would
    // call these primitives and forbid components from using them.
    expect(index.semantics.container.has('desktop')).toBe(true);
    expect(index.semantics.spacing.has('container-padding-mobile')).toBe(true);
    expect(index.primitives.container.size).toBe(0);
  });
});

describe('the allowlist derives from the semantic collections that exist', () => {
  it('exempts typography and radius today', () => {
    expect([...allowlist].sort()).toEqual(['radius', 'typography']);
  });

  it('never exempts a category that has a semantic collection', () => {
    for (const category of semanticCategories(index)) {
      expect(allowlist.has(category)).toBe(false);
    }
  });

  it('expires an exemption as soon as the semantic collection appears', () => {
    // The migration prompt: this is what happens the day semantic radius lands.
    const future = deriveAllowlist(withSemanticRadius());
    expect(future.has('radius')).toBe(false);
    expect(future.has('typography')).toBe(true);
  });
});

describe('classifying a class name', () => {
  const verdict = (cls: string, list = allowlist) => classifyClass(cls, index, list);

  it.each([
    'bg-semantic-bg-primary',
    'text-semantic-text-primary',
    'p-semantic-md',
    'ring-semantic-focus-ring',
    'hover:bg-semantic-bg-primary-hover',
  ])('permits the semantic token %s', (cls) => {
    expect(verdict(cls).kind).toBe('semantic');
  });

  it('permits an unqualified semantic token from the Container collection', () => {
    expect(verdict('max-w-desktop').kind).toBe('semantic');
    expect(verdict('p-container-padding-mobile').kind).toBe('semantic');
  });

  it.each([
    ['text-brand-700', 'color'],
    ['bg-brand-600', 'color'],
    ['p-4', 'spacing'],
    ['gap-2', 'spacing'],
    ['w-8', 'spacing'],
  ])('rejects the primitive %s', (cls, category) => {
    expect(verdict(cls)).toEqual({ kind: 'primitive', category, allowed: false });
  });

  it.each([
    ['rounded-md', 'radius'],
    ['rounded-full', 'radius'],
    ['font-medium', 'typography'],
    ['text-desktop-body-md', 'typography'],
  ])('permits %s while %s has no semantic collection', (cls, category) => {
    expect(verdict(cls)).toEqual({ kind: 'primitive', category, allowed: true });
  });

  it('rejects the same class once that category gains a semantic collection', () => {
    const future = withSemanticRadius();
    expect(classifyClass('rounded-md', future, deriveAllowlist(future))).toEqual({
      kind: 'primitive',
      category: 'radius',
      allowed: false,
    });
  });

  it.each(['px-4', 'mt-8', 'gap-x-2', 'space-y-4', '-mt-4'])(
    'resolves the axis segment in %s',
    (cls) => {
      expect(verdict(cls)).toMatchObject({ kind: 'primitive', category: 'spacing' });
    },
  );

  it('strips variant prefixes before classifying', () => {
    expect(verdict('dark:hover:text-brand-700')).toMatchObject({ kind: 'primitive' });
  });

  it.each(['flex', 'items-center', 'inline-flex', 'ring-2', 'w-full', 'select-none'])(
    'ignores the non-token utility %s',
    (cls) => {
      expect(verdict(cls).kind).toBe('ignored');
    },
  );

  it.each(['p-[13px]', 'bg-[#ffffff]', 'text-[color:var(--x)]'])(
    'rejects the arbitrary value %s',
    (cls) => {
      expect(verdict(cls).kind).toBe('arbitrary');
    },
  );
});

describe('documented exceptions', () => {
  it('contains exactly the agreed entries, grouped by cause, and no more', () => {
    // The audit trail, and the only enumeration of the list outside the policy.
    // Adding an exception must break this test, so a cause gets written down rather
    // than an entry slipped in.
    //
    // Asserted at the group level rather than as a flat list of 64 strings: the flat
    // map is derived now, so enumerating it here would reinstate the second source of
    // truth the grouping exists to remove. This shape carries strictly more — which
    // gap each class belongs to, not just that it was agreed.
    expect(Object.fromEntries(EXCEPTION_GROUPS.map((g) => [g.cause, g.classes]))).toEqual({
      'No Sizing foundation — pinned control heights': [
        'h-[44px]',
        'h-[56px]',
        'h-[120px]',
        'h-[132px]',
      ],
      'No Sizing foundation — glyph and control sizes': [
        'size-[10px]',
        'size-[14px]',
        'size-[18px]',
        'size-[36px]',
      ],
      'Semantic spacing stops at 160px': ['max-h-80', 'max-h-64'],
      'No semantic border token at error/600': [
        'inset-ring-error-600',
        'focus-within:inset-ring-error-600',
        'focus:inset-ring-error-600',
      ],
      'No semantic background token at brand/25': ['bg-brand-25'],
      'Tailwind cannot order the shadow slot ahead of the ring slots': [
        'focus:shadow-[var(--shadow-elevation-1),0_0_0_2px_var(--color-semantic-bg-primary),0_0_0_4px_var(--color-semantic-focus-ring)]',
      ],
      'Figma hardcodes Input and Textarea padding': ['px-[14px]', 'py-[10px]', 'py-[14px]'],
      'Spacing scale has no 3, 5, 7, 9 or 10 step': [
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
      'No radius token at 3px': ['rounded-[3px]'],
      'No spacing or sizing step at 28px': ['size-[28px]', 'h-[28px]'],
      'No semantic border token at gray/50': ['inset-ring-gray-light-50'],
      'No spacing step at 112px': ['px-[112px]'],
      'No Sizing foundation — Beneficiary chip width caps': ['max-w-[132px]', 'max-w-[200px]'],
      'No Sizing foundation — Modal desktop card and illustration': ['w-[400px]', 'size-[120px]'],
      'No semantic token for black, at any opacity': ['bg-base-black/60'],
      'No elevation token for Figma’s single-layer Drop shadow/Normal': [
        '[box-shadow:0px_2px_8px_0px_#0000000a]',
      ],
      'No Sizing foundation — Toast bar widths': ['w-[328px]', 'w-120'],
      'No elevation token for Figma’s four-layer Web shadow': [
        '[box-shadow:0px_8px_44px_0px_#00000008,0px_6px_4px_0px_#00000005,0px_4px_18px_0px_#00000005,0px_0px_10px_0px_#00000005]',
      ],
      'No Sizing foundation — Upload Module card sizes': ['size-[100px]', 'size-[240px]'],
      'No elevation token for the Upload Module action shadow': [
        '[box-shadow:0px_1px_2px_0px_#0000000a,0px_4px_5px_0px_#00000014]',
        '[box-shadow:0px_1.333px_2.667px_0px_#0000000a,0px_5.333px_6.667px_0px_#00000014]',
        '[box-shadow:0px_2px_4px_0px_#0000000a,0px_8px_10px_0px_#00000014]',
      ],
      'No Sizing foundation — Upload Module md action glyph': ['size-[21.333px]'],
      'Figma pins the Upload Module delete offsets off-scale': [
        '-top-[13px]',
        '-right-[11px]',
        '-top-[17px]',
        '-right-[17px]',
        '-top-[25px]',
        '-right-[25px]',
      ],
      'No Sizing foundation — TopNavigationBar boxes': [
        'w-[180px]',
        'h-[60px]',
        'w-[172px]',
        'w-[44px]',
        'h-[20px]',
        'max-w-[360px]',
      ],
      'No border-width export, and no white border token': ['ring-[1.5px]'],
      'No shadow foundation for the uui-shadows collection': [
        '[filter:drop-shadow(0_2px_1px_#171b220a)_drop-shadow(0_4px_3px_#171b2208)_drop-shadow(0_12px_8px_#171b2214)]',
        '[filter:drop-shadow(0_1px_1px_#171b220d)]',
      ],
    });
  });

  it('assigns every class to exactly one group', () => {
    // 64 classes are 25 gaps, and a flat map of 64 near-identical reasons would hide
    // that. Two groups claiming one class is the failure that matters: the class
    // would report whichever cause flattened last, which may not be the one that
    // would repay it.
    const all = EXCEPTION_GROUPS.flatMap((g) => g.classes);
    expect(new Set(all).size, 'a class appears in more than one group').toBe(all.length);

    // And nothing reaches the scanner that no group declares.
    for (const cls of Object.keys(DOCUMENTED_EXCEPTIONS)) {
      const owners = EXCEPTION_GROUPS.filter((g) => g.classes.includes(cls));
      expect(
        owners.map((g) => g.cause),
        cls,
      ).toHaveLength(1);
    }
    expect(Object.keys(DOCUMENTED_EXCEPTIONS)).toHaveLength(all.length);
  });

  it('is 25 causes across 64 classes — the ratio is what matters', () => {
    // Both numbers are asserted so neither can drift unnoticed: a new class must
    // join an existing cause or declare a new one.
    expect(EXCEPTION_GROUPS).toHaveLength(25);
    expect(Object.keys(DOCUMENTED_EXCEPTIONS)).toHaveLength(64);
  });

  it('gives every group a distinct cause, a reason and at least one class', () => {
    const causes = EXCEPTION_GROUPS.map((g) => g.cause);
    expect(new Set(causes).size).toBe(causes.length);

    for (const { cause, reason, classes } of EXCEPTION_GROUPS) {
      expect(cause.length, cause).toBeGreaterThan(10);
      // Asserted per group, not only through the flattened map: a group with no
      // classes contributes no entries there, so an empty group would carry an
      // unexamined reason and the flat pass would never look at it.
      expect(reason, cause).toMatch(/Figma|token/);
      expect(reason.length, cause).toBeGreaterThan(20);
      expect(classes.length, cause).toBeGreaterThan(0);
    }
  });

  it('gives every exception a reason naming what repays it', () => {
    for (const [cls, reason] of Object.entries(DOCUMENTED_EXCEPTIONS)) {
      expect(reason, cls).toMatch(/Figma|token/);
      expect(reason.length, cls).toBeGreaterThan(20);
    }
  });

  it('flattens deterministically', () => {
    // Key order is group order, then class order within a group. It has to be
    // stable: the scanner reports in this order, and `Object.keys` order is what a
    // reader compares against the policy file.
    const once = flattenExceptions(EXCEPTION_GROUPS);
    const twice = flattenExceptions(EXCEPTION_GROUPS);

    expect(Object.keys(twice)).toEqual(Object.keys(once));
    expect(twice).toEqual(once);
    expect(Object.keys(once)).toEqual(EXCEPTION_GROUPS.flatMap((g) => g.classes));
    expect(Object.keys(DOCUMENTED_EXCEPTIONS)).toEqual(Object.keys(once));
  });

  it('refuses to flatten a class claimed by two groups', () => {
    // The negative control for the derivation. `Object.fromEntries` would resolve
    // this silently in favour of the last group, so the check has to be its own.
    const clashing = [
      {
        cause: 'First cause',
        reason: 'A reason long enough to name a Figma gap.',
        classes: ['p-4'],
      },
      { cause: 'Second cause', reason: 'Another reason naming a missing token.', classes: ['p-4'] },
    ];
    expect(() => flattenExceptions(clashing)).toThrow(/claimed by two groups/);
    expect(() => flattenExceptions(clashing)).toThrow(/First cause.*Second cause/s);
  });

  it('derives DOCUMENTED_EXCEPTIONS rather than maintaining it by hand', () => {
    // Structural, because no runtime check can tell a derived map from a hand-written
    // one that happens to agree today. What can be checked is that the class list is
    // written down exactly once in the policy: the moment someone pastes a literal
    // map back in, a class string appears twice and this fails.
    const source = readFileSync(join(SRC, 'components', 'token-usage.policy.ts'), 'utf8');

    expect(source).toMatch(
      /export const DOCUMENTED_EXCEPTIONS: Record<string, string> = flattenExceptions\(\s*EXCEPTION_GROUPS,?\s*\);/,
    );

    for (const cls of Object.keys(DOCUMENTED_EXCEPTIONS)) {
      // Quoted, so `inset-ring-error-600` does not count its own variant-prefixed
      // siblings. Prettier writes these as single-quoted literals.
      const occurrences = source.split(`'${cls}'`).length - 1;
      expect(occurrences, `${cls} is written down more than once`).toBe(1);
    }
  });

  it('sees arbitrary values containing commas', () => {
    // These once slipped through: the candidate pattern excluded commas, so the
    // whole token was skipped as "not a class" instead of being rejected.
    const found = findViolations(`const c = 'transition-[box-shadow,filter]';`, index, allowlist);
    expect(found.map((v) => v.reason)).toEqual(['arbitrary-value']);
  });

  it('still rejects an undocumented arbitrary value of the same shape', () => {
    // The exception list is exact, not a pattern — `h-[48px]` is not exempt.
    const found = findViolations(`const c = 'h-[48px]';`, index, allowlist);
    expect(found.map((v) => v.reference)).toEqual(['h-[48px]']);
  });
});

describe('finding violations in a source file', () => {
  const scan = (source: string) => findViolations(source, index, allowlist);

  it('reports a forbidden primitive with an actionable suggestion', () => {
    const [violation] = scan(`const c = 'text-brand-700 p-4';`);
    expect(violation).toMatchObject({ reference: 'text-brand-700', reason: 'forbidden-primitive' });
    expect(violation?.suggestion).toContain('semantic');
  });

  it('reports every distinct violation once', () => {
    const found = scan(`const a = 'p-4'; const b = 'p-4 gap-2';`);
    expect(found.map((v) => v.reference)).toEqual(['p-4', 'gap-2']);
  });

  it('does not flag class names that appear in comments', () => {
    // The Tailwind source-scanning incident in reverse: prose must not be parsed
    // as code, or every doc comment becomes a false positive.
    expect(scan(`/** Do not write text-brand-700 here. */\nconst c = 'flex';`)).toEqual([]);
    expect(scan(`// avoid p-4\nconst c = 'flex';`)).toEqual([]);
  });

  it('flags a primitive reached through a CSS variable', () => {
    const [violation] = scan(`const s = { color: 'var(--color-brand-600)' };`);
    expect(violation).toMatchObject({ reference: 'var(--color-brand-600)', category: 'color' });
  });

  it('permits a semantic CSS variable', () => {
    expect(scan(`const s = { color: 'var(--color-semantic-text-primary)' };`)).toEqual([]);
  });

  it('permits an exempt primitive reached through a CSS variable', () => {
    expect(scan(`const s = { borderRadius: 'var(--radius-md)' };`)).toEqual([]);
  });

  it('finds nothing in a component written to the rule', () => {
    const source = `
      export const buttonVariants = defineVariants(
        'inline-flex items-center justify-center rounded-md font-medium',
        { variants: { variant: { primary: 'bg-semantic-bg-brand-solid text-semantic-text-primary' } } },
      );
    `;
    expect(scan(source)).toEqual([]);
  });
});

/* -------------------------------------------------------------------------- */
/* The rule, applied to the real component sources                            */
/* -------------------------------------------------------------------------- */

/**
 * Shipped source the token rule applies to: excludes tests and stories.
 *
 * Covers `assets/` as well as `components/`. An asset carries class names too — the
 * Avatar illustrations set `size-full` — so scanning only `components/` would leave a
 * hole where a hardcoded `bg-gray-500` could ship unnoticed simply by living in a file
 * one directory across. The rule is about what ships, not about where it sits.
 */
function componentSources(): string[] {
  const found: string[] = [];

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(tsx|ts)$/.test(entry.name) && !/\.(test|stories|policy)\./.test(entry.name)) {
        found.push(path);
      }
    }
  };

  for (const root of [join(SRC, 'components'), join(SRC, 'assets')]) {
    if (existsSync(root)) walk(root);
  }
  return found;
}

describe('every component obeys the token rule', () => {
  const sources = componentSources();

  it('scans component source, excluding tests and stories', () => {
    // Guards the scanner itself: a glob that silently matches nothing would make
    // every assertion below pass regardless of what the components contain.
    for (const path of sources) {
      expect(path).not.toMatch(/\.(test|stories)\./);
    }
  });

  it.each(sources.length > 0 ? sources : [null])('%s uses only permitted tokens', (path) => {
    if (path === null) return; // No components yet — the fixtures above carry the rule.

    const violations = findViolations(readFileSync(path, 'utf8'), index, allowlist);
    const described = violations.map((v) => `  ${v.reference} — ${v.suggestion}`).join('\n');
    expect(violations, `${relative(SRC, path)}\n${described}`).toEqual([]);
  });
});
