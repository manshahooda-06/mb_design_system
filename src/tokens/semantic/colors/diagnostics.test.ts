/**
 * Generator correctness for the diagnostics report.
 *
 * Asserts the report is internally consistent, correctly structured, and agrees
 * with what was emitted — properties of the *generator*, which hold whatever the
 * Figma data happens to contain. This suite must always be green.
 *
 * Whether the data itself is complete is a separate question, asserted by
 * `tokens.verify.test.ts` and run by `pnpm verify:tokens`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { semanticColors } from './index';

type Diagnostics = {
  resolved: number;
  unresolved: number;
  totalTokensPerMode: number;
  emitted: number;
  withheld: number;
  modes: string[];
  missingPrimitiveGroups: string[];
  deprecatedPrimitiveGroups: string[];
  unresolvedAliases: {
    semanticToken: string;
    reference: string;
    mode: string;
    rootCause: string;
  }[];
  failuresByRootCause: { rootCause: string; suggestion: string; affectedTokens: string[] }[];
  withheldTokens: { token: string; rootCauses: string[]; failedModes: string[] }[];
};

const report = JSON.parse(
  readFileSync(resolve(process.cwd(), 'diagnostics/semantic-colors.json'), 'utf8'),
) as Diagnostics;

describe('semantic colour diagnostics report', () => {
  it('is internally consistent', () => {
    expect(report.emitted + report.withheld).toBe(report.totalTokensPerMode);
    expect(report.resolved).toBe(report.emitted);
    expect(report.unresolvedAliases).toHaveLength(report.unresolved);
    expect(report.modes).toEqual(['light', 'dark']);
  });

  it('agrees with what was actually emitted', () => {
    expect(Object.keys(semanticColors)).toHaveLength(report.emitted);
  });

  it('separates approved-but-missing from deprecated primitive groups', () => {
    // The two lists answer different questions: one is fixed by re-exporting
    // primitives, the other needs a design decision in Figma.
    expect(Array.isArray(report.missingPrimitiveGroups)).toBe(true);
    expect(Array.isArray(report.deprecatedPrimitiveGroups)).toBe(true);
    for (const group of report.missingPrimitiveGroups) {
      expect(report.deprecatedPrimitiveGroups, `${group} cannot be both`).not.toContain(group);
    }
  });

  it('names a token, a reference, a mode and a root cause for every unresolved alias', () => {
    const declared = new Set(report.failuresByRootCause.map((g) => g.rootCause));
    for (const entry of report.unresolvedAliases) {
      expect(entry.semanticToken, JSON.stringify(entry)).toBeTruthy();
      expect(entry.reference, JSON.stringify(entry)).toBeTruthy();
      expect(['light', 'dark']).toContain(entry.mode);
      // Every failure must map to a declared root cause, so none can escape the
      // grouped view that readers actually act on.
      expect(declared, JSON.stringify(entry)).toContain(entry.rootCause);
    }
  });

  it('withholds unresolved tokens rather than emitting them', () => {
    const withheld = new Set(report.withheldTokens.map((t) => t.token));
    expect(withheld.size).toBe(report.withheld);
    for (const token of withheld) {
      expect(semanticColors, `${token} was emitted despite an unresolved alias`).not.toHaveProperty(
        token,
      );
    }
  });
});
