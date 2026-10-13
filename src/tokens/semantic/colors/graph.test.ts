/**
 * Regression guards for the semantic colour alias graph.
 *
 * These assert structural properties of the *emitted* output rather than any
 * particular token, so they keep holding as Figma changes: no cycles, no
 * reference to something that was not emitted, every chain terminating in a
 * concrete value, and full light/dark parity.
 *
 * The generator enforces the same invariants at generation time (see
 * `scripts/generate-semantic-color-tokens.py`, passes 2–5). Checking them again
 * here means a regression in the generator surfaces as a failing test rather
 * than as a colour that silently renders as nothing in the browser.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  semanticColors,
  semanticColorsResolved,
  semanticColorsSource,
  type ColorMode,
  type SemanticColorToken,
} from './index';
import { colorTokens } from '@tokens/colors';

const MODES: ColorMode[] = ['light', 'dark'];
const TOKENS = Object.keys(semanticColors) as SemanticColorToken[];
const SEMANTIC_PREFIX = '--color-semantic-';

type Diagnostics = {
  emitted: number;
  withheld: number;
  totalTokensPerMode: number;
  cycles: { mode: string; cycle: string[] }[];
  summary: { byRootCause: Record<string, number>; rootCauseCount: number; cycles: number };
  failuresByRootCause: {
    rootCause: string;
    title: string;
    suggestion: string;
    affectedTokenCount: number;
    affectedTokens: string[];
    references: { reference: string; modes: string[]; affectedTokens: string[] }[];
  }[];
  withheldTokens: { token: string; rootCauses: string[]; failedModes: string[] }[];
};

const report = JSON.parse(
  readFileSync(resolve(process.cwd(), 'diagnostics/semantic-colors.json'), 'utf8'),
) as Diagnostics;

/** The semantic token a value points at, or null if it is not a semantic reference. */
function semanticTarget(value: string): SemanticColorToken | null {
  const match = /^var\(--color-semantic-([a-z0-9-]+)\)$/.exec(value);
  return match ? (match[1] as SemanticColorToken) : null;
}

describe('alias cycle detection', () => {
  it('emits no cycle in either mode', () => {
    // Each token has at most one outgoing reference per mode, so the graph is
    // functional: walking forward from every node either terminates or repeats.
    for (const mode of MODES) {
      for (const start of TOKENS) {
        const seen = new Set<string>([start]);
        let node = semanticTarget(semanticColorsResolved[mode][start]);
        while (node) {
          expect(seen.has(node), `${mode}: cycle reached ${node} from ${start}`).toBe(false);
          seen.add(node);
          node = semanticTarget(semanticColorsResolved[mode][node]);
        }
      }
    }
  });

  it('reports any cycle the generator found, with its full path', () => {
    // No cycles exist in the current export; if one appears, the report must
    // name every token in it and close the loop, not merely count it.
    expect(report.summary.cycles).toBe(report.cycles.length);
    for (const { cycle } of report.cycles) {
      expect(cycle.length).toBeGreaterThanOrEqual(2);
      expect(cycle.at(0), 'a cycle must close on itself').toBe(cycle.at(-1));
    }
  });

  it('withholds every token that participates in a cycle', () => {
    const inCycle = new Set(report.cycles.flatMap((c) => c.cycle));
    for (const token of inCycle) {
      expect(semanticColors, `${token} is in a cycle but was emitted`).not.toHaveProperty(token);
    }
  });
});

describe('multi-level alias chains', () => {
  it('terminates every chain in a primitive or a literal', () => {
    for (const mode of MODES) {
      for (const start of TOKENS) {
        let value = semanticColorsResolved[mode][start];
        let hops = 0;
        let next = semanticTarget(value);
        while (next) {
          value = semanticColorsResolved[mode][next];
          next = semanticTarget(value);
          hops += 1;
          expect(hops, `${mode}: ${start} exceeded a sane chain length`).toBeLessThan(
            TOKENS.length,
          );
        }
        // Whatever it ends on must be a primitive reference or a literal colour.
        expect(value, `${mode}: ${start} chain ends at ${value}`).toMatch(
          /^(var\(--color-(?!semantic-)[a-z0-9-]+\)|#[0-9a-f]{6}|rgb\([^)]+\))$/,
        );
      }
    }
  });

  it('never flattens a chain into the value it resolves to', () => {
    // A semantic alias must stay a reference to the next link, not be replaced
    // by the primitive at the end of the chain.
    for (const [key, source] of Object.entries(semanticColorsSource)) {
      for (const mode of MODES) {
        if (source[mode].kind !== 'semantic-alias') continue;
        expect(
          semanticTarget(semanticColorsResolved[mode][key as SemanticColorToken]),
          `${key} ${mode} was flattened`,
        ).not.toBeNull();
      }
    }
  });
});

describe('every token resolves to exactly one terminal', () => {
  const TERMINAL = /^(var\(--color-(?!semantic-)[a-z0-9-]+\)|#[0-9a-f]{6}|rgb\([^)]+\))$/;

  it('records a terminal that is a primitive reference or a literal', () => {
    for (const token of TOKENS) {
      for (const mode of MODES) {
        const { terminal } = semanticColorsSource[token][mode];
        expect(terminal, `${token} ${mode} -> ${terminal}`).toMatch(TERMINAL);
      }
    }
  });

  it('reaches that same terminal by walking the chain independently', () => {
    // The generator resolves the terminal during emission; this walks the emitted
    // graph from scratch and must land on the identical value. Two independent
    // computations agreeing is the actual guarantee.
    for (const token of TOKENS) {
      for (const mode of MODES) {
        let value = semanticColorsResolved[mode][token];
        let hops = 0;
        for (let next = semanticTarget(value); next; next = semanticTarget(value)) {
          value = semanticColorsResolved[mode][next];
          hops += 1;
          expect(hops, `${token} ${mode}: walk did not terminate`).toBeLessThan(TOKENS.length);
        }
        expect(value, `${token} ${mode} terminal`).toBe(semanticColorsSource[token][mode].terminal);
        expect(hops, `${token} ${mode} hops`).toBe(semanticColorsSource[token][mode].hops);
      }
    }
  });

  it('resolves to exactly one terminal, never a set of them', () => {
    // Out-degree is at most one per mode, so a token cannot fan out to two
    // terminals. Asserting it directly means a future generator change that
    // introduced branching would fail here rather than silently pick a winner.
    for (const token of TOKENS) {
      for (const mode of MODES) {
        const value = semanticColorsResolved[mode][token];
        const references = value.match(/var\(--[a-z0-9-]+\)/g) ?? [];
        expect(
          references.length,
          `${token} ${mode} emits ${references.length} references`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  it('gives a literal token a terminal equal to its own value', () => {
    for (const token of TOKENS) {
      for (const mode of MODES) {
        const source = semanticColorsSource[token][mode];
        if (source.kind !== 'literal') continue;
        expect(source.hops, `${token} ${mode}`).toBe(0);
        expect(source.terminal).toBe(semanticColorsResolved[mode][token]);
      }
    }
  });
});

describe('emitted references always resolve', () => {
  it('points every semantic reference at an emitted token', () => {
    for (const mode of MODES) {
      for (const token of TOKENS) {
        const target = semanticTarget(semanticColorsResolved[mode][token]);
        if (target) {
          expect(semanticColors, `${token} ${mode} -> ${target}`).toHaveProperty(target);
        }
      }
    }
  });

  it('points every primitive reference at a token the colours foundation exports', () => {
    for (const mode of MODES) {
      for (const token of TOKENS) {
        const value = semanticColorsResolved[mode][token];
        const match = /^var\(--color-((?!semantic-)[a-z0-9-]+)\)$/.exec(value);
        if (match) expect(colorTokens, `${token} ${mode}`).toHaveProperty(match[1]!);
      }
    }
  });

  it('declares every emitted variable exactly once in the stylesheet', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/semantic/colors/colors.css'), 'utf8');
    const declared = [...css.matchAll(/(--color-semantic-[a-z0-9-]+)\s*:/g)].map((m) => m[1]!);
    // Once in @theme for light, once under .dark — so exactly twice each.
    const counts = new Map<string, number>();
    for (const name of declared) counts.set(name, (counts.get(name) ?? 0) + 1);
    for (const token of TOKENS) {
      expect(counts.get(`${SEMANTIC_PREFIX}${token}`), `${token} declaration count`).toBe(2);
    }
  });

  it('references nothing in CSS that the stylesheet does not declare', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/semantic/colors/colors.css'), 'utf8');
    const declared = new Set(
      [...css.matchAll(/(--color-semantic-[a-z0-9-]+)\s*:/g)].map((m) => m[1]!),
    );
    const referenced = [...css.matchAll(/var\((--color-semantic-[a-z0-9-]+)\)/g)].map((m) => m[1]!);
    for (const name of referenced) {
      expect(declared.has(name), `${name} is referenced but never declared`).toBe(true);
    }
  });
});

describe('missing primitive propagation', () => {
  // These assert the generator's *rule*, not that the current data breaks it, so
  // they keep passing once Figma is corrected and nothing is withheld at all.
  it('withholds every token whose alias target is absent from the primitives export', () => {
    const causes = ['missing-primitive', 'deprecated-primitive'];
    const directlyBroken = report.withheldTokens.filter((t) =>
      t.rootCauses.some((c) => causes.includes(c)),
    );
    for (const { token } of directlyBroken) {
      expect(semanticColors, `${token} should be withheld`).not.toHaveProperty(token);
    }
  });

  it('propagates a withholding to everything that references it', () => {
    const withheld = new Set(report.withheldTokens.map((t) => t.token));
    const cascaded = report.withheldTokens.filter((t) =>
      t.rootCauses.includes('upstream-alias-unresolved'),
    );
    for (const { token } of cascaded) {
      expect(withheld.has(token)).toBe(true);
      expect(semanticColors, `${token} cascaded but was emitted`).not.toHaveProperty(token);
    }
  });

  it('leaves no emitted token depending on a withheld one', () => {
    const withheld = new Set(report.withheldTokens.map((t) => t.token));
    for (const mode of MODES) {
      for (const token of TOKENS) {
        const target = semanticTarget(semanticColorsResolved[mode][token]);
        if (target) expect(withheld.has(target), `${token} ${mode} -> ${target}`).toBe(false);
      }
    }
  });
});

describe('light and dark parity', () => {
  it('emits a value for both modes of every token', () => {
    for (const token of TOKENS) {
      for (const mode of MODES) {
        expect(semanticColorsResolved[mode][token], `${token} ${mode}`).toBeTruthy();
      }
    }
    expect(Object.keys(semanticColorsResolved.light)).toEqual(
      Object.keys(semanticColorsResolved.dark),
    );
  });

  it('withholds a token that resolves in only one mode', () => {
    // Emitting one mode only would leave the other silently inheriting the
    // wrong colour, so mode-asymmetry is itself a withholding cause.
    for (const entry of report.withheldTokens) {
      expect(semanticColors, `${entry.token}`).not.toHaveProperty(entry.token);
      if (entry.failedModes.length === 1) {
        expect(entry.rootCauses, `${entry.token} failed only in ${entry.failedModes[0]}`).toContain(
          'mode-asymmetry',
        );
      }
    }
  });

  it('accounts for every exported token as either emitted or withheld', () => {
    expect(report.emitted + report.withheld).toBe(report.totalTokensPerMode);
    expect(report.emitted).toBe(TOKENS.length);
  });
});

describe('diagnostics are grouped and actionable', () => {
  it('groups every failure under a root cause carrying a suggestion', () => {
    expect(report.failuresByRootCause.length).toBe(report.summary.rootCauseCount);
    for (const group of report.failuresByRootCause) {
      expect(group.title, group.rootCause).toBeTruthy();
      expect(group.suggestion.length, `${group.rootCause} suggestion`).toBeGreaterThan(30);
      expect(group.affectedTokens.length).toBe(group.affectedTokenCount);
      expect(group.references.length).toBeGreaterThan(0);
    }
  });

  it('gives every withheld token at least one root cause', () => {
    expect(report.withheldTokens).toHaveLength(report.withheld);
    for (const entry of report.withheldTokens) {
      expect(entry.rootCauses.length, entry.token).toBeGreaterThan(0);
      expect(entry.failedModes.length, entry.token).toBeGreaterThan(0);
    }
  });

  it('cross-references the grouped view against the withheld list', () => {
    const grouped = new Set(report.failuresByRootCause.flatMap((g) => g.affectedTokens));
    for (const entry of report.withheldTokens) {
      expect(grouped.has(entry.token), `${entry.token} missing from grouped view`).toBe(true);
    }
  });
});
