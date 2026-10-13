/**
 * Fidelity guard: proves the generated token layers still match the Figma
 * export byte for byte, and that the CSS layer stays in sync with TypeScript.
 *
 * If this fails after a re-export, the generator — not these files — is what
 * needs fixing.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { colorTokens } from './index';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

const GROUP_RENAME: Record<string, string> = {
  'gray-light mode': 'gray-light',
  'gray-dark mode': 'gray-dark',
  'gray-dark mode alpha': 'gray-dark-alpha',
};
const TOKEN_RENAME: Record<string, string> = { 'off white': 'off-white' };

type FigmaColor = {
  $value: { hex: string; alpha?: number; components: [number, number, number] };
};

/** Re-derive the expected values straight from the Figma export. */
function fromFigma(): Record<string, string> {
  const raw = JSON.parse(read('../../../figma/exports/primitives/colors.json')) as {
    Colors: Record<string, Record<string, FigmaColor>>;
  };

  const out: Record<string, string> = {};
  for (const [group, steps] of Object.entries(raw.Colors)) {
    for (const [step, token] of Object.entries(steps)) {
      const { hex, alpha = 1, components } = token.$value;
      const name = `${GROUP_RENAME[group] ?? group}-${TOKEN_RENAME[step] ?? step}`;
      if (alpha === 1) {
        out[name] = hex.toLowerCase();
      } else {
        const [r, g, b] = components.map((c) => Math.round(c * 255));
        out[name] = `rgb(${r} ${g} ${b} / ${Number(alpha.toFixed(4))})`;
      }
    }
  }
  return out;
}

/** Parse the generated Tailwind @theme block back into a plain map. */
function fromCss(): Record<string, string> {
  const css = read('../../foundations/colors/colors.css');
  return Object.fromEntries(
    [...css.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]!.trim()]),
  );
}

describe('color token fidelity', () => {
  it('matches the Figma export exactly', () => {
    expect(colorTokens).toEqual(fromFigma());
  });

  it('keeps the CSS layer identical to the TypeScript layer', () => {
    expect(fromCss()).toEqual(colorTokens);
  });

  it('declares the theme block as static so no token is tree-shaken away', () => {
    expect(read('../../foundations/colors/colors.css')).toContain('@theme static {');
  });
});
