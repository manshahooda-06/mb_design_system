/**
 * Guards the font-family chain end to end.
 *
 * Every link broke at once and none of them failed loudly: the foundation
 * declared `--font-body: 'Lexend Deca'`, nothing applied it, no webfont was ever
 * loaded, and Tailwind's system stack won on every element. It looked correct on
 * any machine with Lexend Deca installed locally, which is why it survived four
 * foundations and two components.
 *
 * These assertions are cheap and each one covers a link that was actually
 * broken, rather than a hypothetical.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (...parts: string[]) => readFileSync(resolve(process.cwd(), ...parts), 'utf8');

/**
 * The webfont import and the `--font-sans` binding live in the shared partial, not in
 * either entry point, so both published stylesheets carry them — `styles.css` standalone
 * and `embed.css` for embedding into an app that has its own reset.
 */
const entry = read('src', 'mozaic.css');

describe('the typography foundation declares the family', () => {
  it('names Lexend Deca', () => {
    expect(read('src', 'foundations', 'typography', 'typography.css')).toMatch(
      /--font-body:\s*'Lexend Deca'/,
    );
  });
});

describe('the webfont is actually loaded', () => {
  it('imports the self-hosted package from the stylesheet entry', () => {
    // Naming a family does not load one. Without this the token resolved to a
    // face the browser did not have.
    expect(entry).toMatch(/@import\s+'@fontsource-variable\/lexend-deca'/);
  });

  it('declares the font package as a runtime dependency, not a dev one', () => {
    const pkg = JSON.parse(read('package.json')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.['@fontsource-variable/lexend-deca']).toBeDefined();
    expect(pkg.devDependencies?.['@fontsource-variable/lexend-deca']).toBeUndefined();
  });

  it('covers every weight the foundation declares', () => {
    const declared = [
      ...read('src', 'foundations', 'typography', 'typography.css').matchAll(
        /--font-weight-[a-z]+:\s*(\d+)/g,
      ),
    ].map((m) => Number(m[1]));
    expect(declared.length).toBeGreaterThan(0);

    const axis = /font-weight:\s*(\d+)\s+(\d+)/.exec(
      read('node_modules', '@fontsource-variable', 'lexend-deca', 'index.css'),
    );
    const [, low, high] = axis!.map(Number);
    for (const weight of declared) {
      expect(weight).toBeGreaterThanOrEqual(low!);
      expect(weight).toBeLessThanOrEqual(high!);
    }
  });
});

describe('the family is applied, not merely declared', () => {
  it('binds Tailwind’s default font to the foundation token', () => {
    // Tailwind's preflight sets `html { font-family: var(--default-font-family) }`,
    // which resolves to `--font-sans`. Leaving that at Tailwind's built-in system
    // stack is what made every component render in the wrong face.
    expect(entry).toMatch(/--font-sans:[^;]*var\(--font-body\)/);
  });

  it('asks for the served family name before the Figma one', () => {
    // The variable webfont is published as 'Lexend Deca Variable'; Figma names
    // the family 'Lexend Deca'. Requesting only the Figma name matches a locally
    // installed copy and ignores the one we ship — correct on a designer's
    // machine, broken everywhere else.
    const stack = /--font-sans:\s*([^;]+);/.exec(entry)?.[1] ?? '';
    const served = stack.indexOf('Lexend Deca Variable');
    const figma = stack.indexOf('var(--font-body)');
    expect(served).toBeGreaterThanOrEqual(0);
    expect(served).toBeLessThan(figma);
  });

  it('matches the family name the installed package actually publishes', () => {
    // Guards against the package renaming its family on a major bump.
    const published = /font-family:\s*'([^']+)'/.exec(
      read('node_modules', '@fontsource-variable', 'lexend-deca', 'index.css'),
    )?.[1];
    expect(published).toBe('Lexend Deca Variable');
    expect(entry).toContain(published!);
  });
});

/**
 * Which components state the family, and why it is not "all of them".
 *
 * Inheriting works while Mozaic owns the page: its preflight puts Lexend Deca on `html`.
 * `embed.css` deliberately ships no preflight, so a component dropped into a host app
 * inherits whatever that app uses — measured as Georgia in a host-app simulation, which also
 * moved every text width (Tag's label 32.6px → 29.3px, Toggle's 100.6px → 90.8px) because
 * the metrics differ. Figma specifies the family as much as the size, so a component that
 * renders text states it at its **root** and its children inherit from there.
 *
 * The dividing line is whether the component renders text of its own, which the type ramp
 * settles: a component with no `text-mobile-*`/`text-desktop-*` token draws no text.
 * IconButton draws a caller-supplied glyph and names itself through `aria-label`, so it gets
 * no family — that would be dead styling. `action-surface.ts` is shared by both Button and
 * IconButton, so the family belongs on Button's root rather than in there.
 */
const TEXT_BEARING: [file: string, rootExport: string][] = [
  ['Avatar/Avatar.variants.ts', 'avatarRootVariants'],
  ['Button/Button.variants.ts', 'buttonVariants'],
  ['Checkbox/Checkbox.variants.ts', 'checkboxRootVariants'],
  ['Input/Input.variants.ts', 'inputRootVariants'],
  ['InputDropdown/InputDropdown.variants.ts', 'inputDropdownRootVariants'],
  ['OtpInput/OtpInput.variants.ts', 'otpInputRootVariants'],
  ['Radio/Radio.variants.ts', 'radioRootVariants'],
  ['SearchBar/SearchBar.variants.ts', 'searchBarRootVariants'],
  ['Tag/Tag.variants.ts', 'tagRootVariants'],
  ['Textarea/Textarea.variants.ts', 'textareaRootVariants'],
  ['Toggle/Toggle.variants.ts', 'toggleRootVariants'],
];

/** No type-ramp token anywhere, so nothing to set a family for. */
const TEXT_FREE = ['IconButton/IconButton.variants.ts'];

describe('text-bearing component roots state the family', () => {
  it.each(TEXT_BEARING)('%s declares font-sans on %s', (file, exportName) => {
    const source = read('src', 'components', file);
    const start = source.indexOf(`export const ${exportName}`);
    expect(start, `${exportName} not found`).toBeGreaterThanOrEqual(0);
    const next = source.indexOf('export const', start + 1);
    const block = source.slice(start, next === -1 ? undefined : next);
    expect(block).toMatch(/font-sans/);
  });

  it.each(TEXT_FREE)('%s sets no family, because it renders no text', (file) => {
    expect(read('src', 'components', file)).not.toMatch(
      /["'\s](font-(body|display|sans|serif|mono))["'\s]/,
    );
  });

  it('keeps the family out of the shared action surface', () => {
    // Shared by Button *and* IconButton — putting it here would give IconButton a family
    // it has no text to use.
    expect(read('src', 'components', 'action-surface.ts')).not.toMatch(
      /["'\s](font-(body|display|sans|serif|mono))["'\s]/,
    );
  });

  it('divides the two lists by whether a type-ramp token is used', () => {
    // Guards the rule itself rather than the current membership: if a component gains or
    // loses text, the list it belongs to changes with it.
    const usesRamp = (file: string) =>
      /text-(mobile|desktop)-[a-z0-9-]+/.test(read('src', 'components', file));
    for (const [file] of TEXT_BEARING) expect(usesRamp(file), file).toBe(true);
    for (const file of TEXT_FREE) expect(usesRamp(file), file).toBe(false);
  });
});
