/**
 * Design-data validation for semantic colours. Run by `pnpm verify:tokens`.
 *
 * **Not part of `pnpm test`.** These assertions describe whether the *Figma data*
 * is complete, not whether the generator is correct. The two fail for different
 * reasons and belong to different owners:
 *
 *   pnpm test          engineering — the generator must be correct. Always green.
 *   pnpm verify:tokens design — the token set must be complete. Red while Figma
 *                      still has unresolved aliases.
 *
 * A permanently failing test inside the normal suite trains people to ignore it
 * and hides a real regression behind an expected failure. Splitting them keeps
 * the implementation green while still blocking incomplete design data from
 * shipping, because CI runs both.
 *
 * **This suite is red today**, and goes green with no code change once Figma is
 * corrected. To fix, in Figma:
 *   - add the approved groups under `missingPrimitiveGroups`
 *   - repoint the tokens under `deprecatedPrimitiveGroups` at approved families
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type Diagnostics = {
  resolved: number;
  unresolved: number;
  withheld: number;
  emitted: number;
  totalTokensPerMode: number;
  modes: string[];
  summary: { byRootCause: Record<string, number>; rootCauseCount: number; cycles: number };
  failuresByRootCause: {
    rootCause: string;
    suggestion: string;
    affectedTokenCount: number;
    affectedTokens: string[];
    references: { reference: string; modes: string[]; affectedTokens: string[] }[];
  }[];
  missingPrimitiveGroups: string[];
  deprecatedPrimitiveGroups: string[];
  cycles: { mode: string; cycle: string[] }[];
  withheldTokens: { token: string; rootCauses: string[]; failedModes: string[] }[];
};

const report = JSON.parse(
  readFileSync(resolve(process.cwd(), 'diagnostics/semantic-colors.json'), 'utf8'),
) as Diagnostics;

/** A readable failure message listing the action that fixes each root cause. */
function actions(): string {
  return [
    `${report.unresolved} unresolved alias(es) across ${report.withheld} withheld token(s).`,
    ...report.failuresByRootCause.map(
      (g) => `[${g.rootCause}] ${g.affectedTokenCount} tokens — ${g.suggestion}`,
    ),
    'Full report: diagnostics/semantic-colors.json',
  ].join('\n  ');
}

describe('token completeness', () => {
  it('has no unresolved aliases', () => {
    expect(report.unresolved, actions()).toBe(0);
  });

  it('withholds no token', () => {
    const list = report.withheldTokens.map((t) => `${t.token} (${t.rootCauses.join(', ')})`);
    expect(report.withheld, `Withheld:\n  ${list.slice(0, 12).join('\n  ')}`).toBe(0);
  });

  it('emits every token the export contains', () => {
    expect(report.emitted, actions()).toBe(report.totalTokensPerMode);
  });
});

describe('primitive coverage', () => {
  it('references no primitive group missing from the primitives export', () => {
    expect(
      report.missingPrimitiveGroups,
      'These groups are approved (✅) in Figma but absent from the primitives export. ' +
        'Re-export the primitives collection including them.',
    ).toEqual([]);
  });

  it('references no primitive group Figma marks deprecated', () => {
    expect(
      report.deprecatedPrimitiveGroups,
      'Semantic colours still point at groups Figma marks ❌. Repoint them at the ' +
        'approved equivalent — e.g. green❌ becomes Green ✅ — or restore the groups.',
    ).toEqual([]);
  });
});

describe('alias integrity of the design data', () => {
  it('contains no alias cycle', () => {
    const described = report.cycles.map((c) => `${c.mode}: ${c.cycle.join(' -> ')}`);
    expect(report.cycles, `Cycles found:\n  ${described.join('\n  ')}`).toEqual([]);
  });

  it('contains no dangling DTCG reference', () => {
    const group = report.failuresByRootCause.find(
      (g) => g.rootCause === 'dtcg-reference-not-found',
    );
    expect(
      group?.affectedTokens ?? [],
      'These tokens reference a token that does not exist in the export — it was ' +
        'renamed or deleted while the referring token kept the old name.',
    ).toEqual([]);
  });

  it('has no upstream-unresolved alias left over', () => {
    // These are never independently broken, so once the causes above are fixed
    // this reaches zero on its own. It is asserted last for that reason.
    const group = report.failuresByRootCause.find(
      (g) => g.rootCause === 'upstream-alias-unresolved',
    );
    expect(
      group?.affectedTokens ?? [],
      'These depend on a token that is itself unresolved. Fix the other root ' +
        'causes first; these recover automatically.',
    ).toEqual([]);
  });
});

describe('mode parity of the design data', () => {
  it('defines both modes for every token', () => {
    expect(report.modes).toEqual(['light', 'dark']);
    const asymmetric = report.withheldTokens.filter((t) => t.failedModes.length === 1);
    expect(
      asymmetric.map((t) => `${t.token} (fails only in ${t.failedModes[0]})`),
      'A token resolving in one mode only would leave the other silently inheriting ' +
        'the wrong colour. Create the missing counterpart in Figma.',
    ).toEqual([]);
  });

  it('reports no mode-asymmetry failure', () => {
    const group = report.failuresByRootCause.find((g) => g.rootCause === 'mode-asymmetry');
    expect(group?.affectedTokens ?? []).toEqual([]);
  });
});
