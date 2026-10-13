/**
 * Fidelity guard: re-derives every elevation token straight from the Figma export
 * and fails if the generated CSS or TypeScript has drifted from it.
 *
 * If this fails after a re-export, the generator — not the generated files — is
 * what needs fixing.
 *
 * This export is transcribed from Dev Mode rather than produced by the variable
 * export, because Figma effect styles are not variables. That makes the guard
 * more important here than elsewhere, not less: it is the only thing tying the
 * generated stylesheet to the recorded measurements.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { elevation, elevationSource, elevationVar } from './index';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

const PREFIX = 'shadow-';

interface Layer {
  color: string;
  offsetX: string;
  offsetY: string;
  blur: string;
  spread: string;
}
type Leaf = { $type: string; $value: Layer[] };
type Export = Record<string, Leaf | Record<string, unknown>>;

const raw = JSON.parse(read('../../../figma/exports/primitives/elevation.json')) as Export;

const figma = Object.entries(raw)
  .filter(([key]) => !key.startsWith('$'))
  .map(([figmaName, node]) => {
    const leaf = node as Leaf;
    return {
      key: figmaName.slice(PREFIX.length),
      figmaName,
      type: leaf.$type,
      layers: leaf.$value,
    };
  });

const render = (layers: Layer[]) =>
  layers.map((l) => `${l.offsetX} ${l.offsetY} ${l.blur} ${l.spread} ${l.color}`).join(', ');

const css = read('../../foundations/elevation/elevation.css');

describe('elevation token fidelity', () => {
  it('covers every token in the export', () => {
    expect(figma).toHaveLength(8);
    expect(Object.keys(elevation)).toHaveLength(figma.length);
  });

  it('matches the Figma export exactly, layer for layer', () => {
    const expected = Object.fromEntries(figma.map((t) => [t.key, render(t.layers)]));
    expect(elevation).toEqual(expected);
  });

  it('declares every token in the generated stylesheet', () => {
    for (const { key } of figma) {
      expect(css).toContain(`--shadow-${key}: ${elevation[key as keyof typeof elevation]};`);
    }
  });

  it('records the Figma name and layer count for every token', () => {
    for (const { key, figmaName, layers } of figma) {
      const source = elevationSource[key as keyof typeof elevationSource];
      expect(source.figmaName).toBe(figmaName);
      expect(source.layers).toBe(layers.length);
    }
  });

  it('publishes the four levels in both directions and nothing else', () => {
    expect(Object.keys(elevation).sort()).toEqual([
      'elevation-1',
      'elevation-1-up',
      'elevation-2',
      'elevation-2-up',
      'elevation-3',
      'elevation-3-up',
      'elevation-4',
      'elevation-4-up',
    ]);
  });

  describe('properties that hold across the whole scale', () => {
    it('gives every token exactly two layers', () => {
      for (const { layers } of figma) expect(layers).toHaveLength(2);
    });

    it('never offsets horizontally and never spreads', () => {
      for (const { layers } of figma) {
        for (const layer of layers) {
          expect(layer.offsetX).toBe('0px');
          expect(layer.spread).toBe('0px');
        }
      }
    });

    it('uses pure black with an alpha for every layer', () => {
      for (const { layers } of figma) {
        for (const layer of layers) {
          // Eight-digit hex, pure black, alpha last — as Figma reports it.
          expect(layer.color).toMatch(/^#000000[0-9a-f]{2}$/);
        }
      }
    });

    it('keeps pixels rather than converting to rem, unlike the scalar foundations', () => {
      // A shadow that rescaled with the root font size would change how high the
      // surface looks, which is the thing this scale exists to hold fixed.
      for (const value of Object.values(elevation)) {
        expect(value).not.toContain('rem');
        expect(value).toContain('px');
      }
    });

    it('points `-up` tokens upwards and the rest downwards', () => {
      for (const { key, layers } of figma) {
        const ys = layers.map((l) => parseFloat(l.offsetY));
        if (key.endsWith('-up')) for (const y of ys) expect(y).toBeLessThan(0);
        else for (const y of ys) expect(y).toBeGreaterThan(0);
      }
    });

    it('orders layers front first — the tight layer before the wide one', () => {
      for (const { layers } of figma) {
        const [front, back] = layers as [Layer, Layer];
        expect(Math.abs(parseFloat(front.offsetY))).toBeLessThan(
          Math.abs(parseFloat(back.offsetY)),
        );
        expect(parseFloat(front.blur)).toBeLessThanOrEqual(parseFloat(back.blur));
      }
    });

    it('grows monotonically in reach from level 1 to level 4', () => {
      for (const direction of ['', '-up']) {
        const reach = [1, 2, 3, 4].map((level) => {
          const t = figma.find((x) => x.key === `elevation-${level}${direction}`);
          const back = t?.layers[1] as Layer;
          return Math.abs(parseFloat(back.offsetY)) + parseFloat(back.blur);
        });
        expect(reach).toEqual([...reach].sort((a, b) => a - b));
      }
    });

    it('keeps every `-up` level fainter than its downward twin', () => {
      const alpha = (hex: string) => parseInt(hex.slice(7, 9), 16);
      for (const level of [1, 2, 3, 4]) {
        const down = figma.find((x) => x.key === `elevation-${level}`);
        const up = figma.find((x) => x.key === `elevation-${level}-up`);
        for (const i of [0, 1]) {
          expect(alpha((up?.layers[i] as Layer).color)).toBeLessThan(
            alpha((down?.layers[i] as Layer).color),
          );
        }
      }
    });
  });

  it('exposes the right custom property name', () => {
    expect(elevationVar('elevation-4')).toBe('--shadow-elevation-4');
  });

  it('is reachable from the foundations entry point', () => {
    expect(read('../../foundations/foundations.css')).toContain(
      "@import './elevation/elevation.css'",
    );
  });
});
