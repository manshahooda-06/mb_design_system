/**
 * Fidelity guard for the semantic colour collection.
 *
 * Re-derives every token from both mode exports and resolves each alias against
 * the real primitives export, asserting the chain
 * semantic token -> (primitive | other semantic token) -> value holds in both modes.
 *
 * If this fails after a re-export, the generator — not the generated files — is
 * what needs fixing.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { semanticColors, semanticColorsResolved, semanticColorsSource } from './index';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

const STATUS_MARKS = /\u2705|\u274c|\u26a0\ufe0f?|\u{1F4CC}/gu;
const GROUP_RENAME: Record<string, string> = {
  'gray-light mode': 'gray-light',
  'gray-dark mode': 'gray-dark',
  'gray-dark mode alpha': 'gray-dark-alpha',
};
const TOKEN_RENAME: Record<string, string> = { 'off white': 'off-white' };

/** Mirrors the generator's normalization, reimplemented independently. */
function normalize(segment: string): string {
  return segment
    .replace(STATUS_MARKS, '')
    .replace(/\s*\([^)]*\)\s*/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

type Leaf = {
  $type: string;
  $value: string | { hex: string; alpha?: number; components: [number, number, number] };
  $extensions?: { 'com.figma.aliasData'?: { targetVariableName: string } };
};

function flatten(node: unknown, path: string[] = []): [string[], Leaf][] {
  if (node && typeof node === 'object') {
    if ('$value' in node) return [[path, node as Leaf]];
    return Object.entries(node).flatMap(([k, v]) => flatten(v, [...path, k]));
  }
  return [];
}

function loadMode(rel: string): Record<string, Leaf> {
  const raw = JSON.parse(read(rel)) as Record<string, unknown>;
  const out: Record<string, Leaf> = {};
  for (const collection of Object.keys(raw).filter((k) => !k.startsWith('$'))) {
    for (const [p, leaf] of flatten(raw[collection])) out[[collection, ...p].join('.')] = leaf;
  }
  return out;
}

const light = loadMode('../../../../figma/exports/semantic/colors-light.json');
const dark = loadMode('../../../../figma/exports/semantic/colors-dark.json');
const primitives = JSON.parse(read('../../../../figma/exports/primitives/colors.json')) as {
  Colors: Record<string, Record<string, { $value: { hex: string; alpha?: number } }>>;
};

const dtcgRef = (v: Leaf['$value']) =>
  typeof v === 'string' && v.startsWith('{') && v.endsWith('}') ? v.slice(1, -1) : null;

const keyByPath = Object.fromEntries(
  Object.keys(light).map((p) => [p, normalize(p.split('.').at(-1)!)]),
);

/**
 * Independently compute what a token should resolve to, or null if unresolvable.
 *
 * `withheldKeys` models the generator's cascade: a token referencing another
 * token can only resolve if that target is itself emitted, otherwise its var()
 * would point at a variable that does not exist.
 */
function expected(
  path: string,
  mode: 'light' | 'dark',
  withheldKeys = new Set<string>(),
): string | null {
  const leaf = (mode === 'light' ? light : dark)[path]!;
  const ref = dtcgRef(leaf.$value);
  if (ref !== null) {
    const target = keyByPath[ref];
    if (!target || withheldKeys.has(target)) return null;
    return `var(--color-semantic-${target})`;
  }
  const alias = leaf.$extensions?.['com.figma.aliasData'];
  if (alias) {
    const [collection, group, step] = alias.targetVariableName.split('/');
    if (collection !== 'Colors' || !group || !step) return null;
    if (!primitives.Colors[group]?.[step]) return null;
    return `var(--color-${GROUP_RENAME[group] ?? group}-${TOKEN_RENAME[step] ?? step})`;
  }
  const v = leaf.$value as { hex: string; alpha?: number; components: [number, number, number] };
  if ((v.alpha ?? 1) === 1) return v.hex.toLowerCase();
  const [r, g, b] = v.components.map((c) => Math.round(c * 255));
  return `rgb(${r} ${g} ${b} / ${Number((v.alpha ?? 1).toFixed(4))})`;
}

/** Withhold to a fixpoint, independently of the generator. */
const withheldKeys = new Set<string>();
for (;;) {
  const before = withheldKeys.size;
  for (const p of Object.keys(light)) {
    if (expected(p, 'light', withheldKeys) === null || expected(p, 'dark', withheldKeys) === null) {
      withheldKeys.add(keyByPath[p]!);
    }
  }
  if (withheldKeys.size === before) break;
}

const emittable = Object.keys(light).filter((p) => !withheldKeys.has(keyByPath[p]!));

describe('semantic colour fidelity', () => {
  it('exports the same token set in both modes', () => {
    expect(Object.keys(light)).toHaveLength(395);
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });

  it('emits exactly the tokens resolvable in both modes', () => {
    expect(Object.keys(semanticColors)).toHaveLength(emittable.length);
    expect(Object.keys(semanticColors).sort()).toEqual(emittable.map((p) => keyByPath[p]!).sort());
  });

  it('matches the Figma export exactly, per mode', () => {
    for (const path of emittable) {
      const key = keyByPath[path]! as keyof typeof semanticColors;
      expect(semanticColorsResolved.light[key], `${key} light`).toBe(
        expected(path, 'light', withheldKeys),
      );
      expect(semanticColorsResolved.dark[key], `${key} dark`).toBe(
        expected(path, 'dark', withheldKeys),
      );
    }
  });

  it('derives every key mechanically from its Figma leaf name', () => {
    for (const [key, source] of Object.entries(semanticColorsSource)) {
      expect(normalize(source.figmaPath.split('.').at(-1)!)).toBe(key);
    }
  });
});

describe('semantic colour alias preservation', () => {
  it('never degrades an alias to a literal', () => {
    for (const [key, source] of Object.entries(semanticColorsSource)) {
      for (const mode of ['light', 'dark'] as const) {
        if (source[mode].kind === 'literal') continue;
        expect(
          semanticColorsResolved[mode][key as keyof typeof semanticColors],
          `${key} ${mode}`,
        ).toMatch(/^var\(--color-/);
      }
    }
  });

  it('emits a literal only where Figma exported a literal', () => {
    for (const [key, source] of Object.entries(semanticColorsSource)) {
      for (const mode of ['light', 'dark'] as const) {
        const value = semanticColorsResolved[mode][key as keyof typeof semanticColors];
        if (!value.startsWith('var(')) expect(source[mode].kind, `${key} ${mode}`).toBe('literal');
      }
    }
  });

  it('preserves both alias mechanisms', () => {
    const kinds = new Set(
      Object.values(semanticColorsSource).flatMap((s) => [s.light.kind, s.dark.kind]),
    );
    expect(kinds).toContain('primitive-alias');
    expect(kinds).toContain('semantic-alias');
  });

  it('points semantic-alias tokens at another emitted semantic token', () => {
    for (const [key, source] of Object.entries(semanticColorsSource)) {
      for (const mode of ['light', 'dark'] as const) {
        if (source[mode].kind !== 'semantic-alias') continue;
        const value = semanticColorsResolved[mode][key as keyof typeof semanticColors];
        const target = /^var\(--color-semantic-(.+)\)$/.exec(value)?.[1];
        expect(target, `${key} ${mode}`).toBeDefined();
        expect(semanticColors, `${key} ${mode} -> ${target}`).toHaveProperty(target!);
      }
    }
  });

  it('points primitive-alias tokens at a primitive that exists', () => {
    for (const [key, source] of Object.entries(semanticColorsSource)) {
      for (const mode of ['light', 'dark'] as const) {
        if (source[mode].kind !== 'primitive-alias') continue;
        const [, group, step] = source[mode].aliasOf!.split('/');
        expect(primitives.Colors[group!]?.[step!], `${key} ${mode}`).toBeDefined();
      }
    }
  });
});

describe('semantic colour CSS generation', () => {
  const css = read('../../../semantic/colors/colors.css');
  const block = (start: RegExp) => {
    const from = css.search(start);
    const body = css.slice(from, css.indexOf('\n}', from));
    return Object.fromEntries(
      [...body.matchAll(/(--color-semantic-[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [
        m[1],
        m[2]!.trim(),
      ]),
    );
  };

  it('declares light mode inside @theme static', () => {
    expect(css).toContain('@theme static {');
    const vars = block(/@theme static \{/);
    for (const [key, source] of Object.entries(semanticColorsSource)) {
      expect(vars[source.cssVar], key).toBe(
        semanticColorsResolved.light[key as keyof typeof semanticColors],
      );
    }
  });

  it('overrides dark mode under .dark, with full parity', () => {
    const vars = block(/^\.dark \{/m);
    expect(Object.keys(vars)).toHaveLength(Object.keys(semanticColorsSource).length);
    for (const [key, source] of Object.entries(semanticColorsSource)) {
      expect(vars[source.cssVar], key).toBe(
        semanticColorsResolved.dark[key as keyof typeof semanticColors],
      );
    }
  });

  it('uses a class selector rather than prefers-color-scheme', () => {
    // Match an actual @media rule, not the banner prose that mentions it.
    expect(css).not.toMatch(/@media[^{]*prefers-color-scheme/);
    expect(css).toContain('.dark {');
  });
});
