/**
 * Namespace-collision guard for the semantic token layer.
 *
 * Tailwind's `--spacing-*` and `--container-*` namespaces both feed `w-*`,
 * `min-w-*`, `max-w-*` and `basis-*`, and spacing wins. So a semantic token
 * emitted as a bare `--spacing-md` silently redefines `max-w-md` from 28rem to
 * 8px — 44 utilities across four families, for the eleven t-shirt names Tailwind
 * also ships as container sizes.
 *
 * The fix is structural, not a lint rule: every semantic token is qualified
 * `--<namespace>-semantic-<token>`, which Tailwind has no value named after. This
 * suite pins that convention so the collision cannot be reintroduced by a future
 * collection dropping the qualifier.
 */
import { describe, expect, it } from 'vitest';
import { semanticSpacingSource } from './index';
import { containerSource } from '@tokens/semantic/container';

/** The qualifier every semantic collection inserts into its variable names. */
const QUALIFIER = 'semantic';

/**
 * Tailwind v4's built-in `--container-*` names. Any of these appearing bare in
 * `--spacing-*` shadows the size utilities that read the container namespace.
 */
const TAILWIND_CONTAINER_NAMES = [
  '3xs',
  '2xs',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
];

/** Namespaces where an unqualified name can shadow another namespace's values. */
const OVERLOADED = ['spacing', 'container'];

const allSemanticVars = [
  ...Object.values(semanticSpacingSource).map((s) => s.cssVar),
  ...Object.values(containerSource).map((s) => s.cssVar),
];

describe('semantic token namespace safety', () => {
  it('qualifies every semantic spacing variable with the shared marker', () => {
    for (const [key, source] of Object.entries(semanticSpacingSource)) {
      expect(source.cssVar, key).toBe(`--spacing-${QUALIFIER}-${key}`);
    }
  });

  it('never emits a bare t-shirt name into an overloaded namespace', () => {
    // This is the assertion that would have caught the original bug.
    const shadowing = allSemanticVars.filter((cssVar) =>
      OVERLOADED.some((ns) =>
        TAILWIND_CONTAINER_NAMES.some((name) => cssVar === `--${ns}-${name}`),
      ),
    );
    expect(
      shadowing,
      `These shadow a Tailwind value in the same namespace and will silently change ` +
        `what w-*, min-w-*, max-w-* and basis-* mean. Qualify them with ` +
        `css.semantic_name() in the generator.`,
    ).toEqual([]);
  });

  it('leaves every Tailwind container size name unclaimed by semantic spacing', () => {
    const claimed = TAILWIND_CONTAINER_NAMES.filter(
      (name) => `--spacing-${name}` in Object.fromEntries(allSemanticVars.map((v) => [v, true])),
    );
    expect(claimed).toEqual([]);
  });

  it('keeps semantic tokens inside a Tailwind namespace so they still yield utilities', () => {
    // The qualifier must not push tokens out of the namespace entirely — that
    // would cost us utility generation, which is the point of theming.
    for (const cssVar of allSemanticVars) {
      const namespace = cssVar.replace(/^--/, '').split('-')[0];
      expect(
        ['spacing', 'container', 'color', 'radius', 'text', 'shadow', 'font'],
        cssVar,
      ).toContain(namespace);
    }
  });
});
