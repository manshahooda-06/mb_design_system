/**
 * Structural conformance for the component layer.
 *
 * Checks the shape a component must have rather than what it renders, so a
 * component that skips its stories, forgets its barrel entry, or names its
 * variants file something else fails here instead of being noticed in review —
 * or not noticed at all.
 *
 * These were vacuous until the first component landed. The generator is what makes
 * them cheap to satisfy: scaffolded components conform by construction, and this
 * catches the ones edited afterwards.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DOCUMENTED_EXCEPTIONS } from './token-usage.policy';

const COMPONENTS = resolve(process.cwd(), 'src', 'components');

/** Directories that hold a component, identified by their entry file. */
function componentNames(): string[] {
  return readdirSync(COMPONENTS, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(COMPONENTS, e.name, `${e.name}.tsx`)))
    .map((e) => e.name)
    .sort();
}

const names = componentNames();
const read = (...parts: string[]) => readFileSync(join(COMPONENTS, ...parts), 'utf8');

describe('the components barrel', () => {
  it('exists', () => {
    expect(existsSync(join(COMPONENTS, 'index.ts'))).toBe(true);
  });

  it('exports exactly the components that exist', () => {
    // Regenerated from disk by the generator, so a drift here means someone
    // hand-edited it or added a directory without scaffolding it.
    const barrel = read('index.ts');
    const exported = [...barrel.matchAll(/export \* from '\.\/([A-Za-z0-9]+)'/g)]
      .map((m) => m[1])
      .sort();
    expect(exported).toEqual(names);
  });

  it('is reachable from the package entry point', () => {
    const entry = readFileSync(resolve(process.cwd(), 'src', 'index.ts'), 'utf8');
    expect(entry).toContain("export * from './components'");
  });
});

describe('Tailwind source registration', () => {
  // `mozaic.css` is the shared partial both published stylesheets import, so the source
  // registration is asserted once and holds for `styles.css` and `embed.css` alike.
  const entry = readFileSync(resolve(process.cwd(), 'src', 'mozaic.css'), 'utf8');

  it('is imported by both published stylesheets', () => {
    // Otherwise these globs would be declared somewhere nothing ships from.
    for (const stylesheet of ['index.css', 'embed.css']) {
      const css = readFileSync(resolve(process.cwd(), 'src', stylesheet), 'utf8');
      expect(css, stylesheet).toMatch(/@import\s+'\.\/mozaic\.css'/);
    }
  });

  it('keeps the preflight out of the embeddable stylesheet', () => {
    // The preflight rewrites the *host* page — `html { font-family; line-height }` and a
    // global reset — so an app that already has one must be able to opt out.
    const standalone = readFileSync(resolve(process.cwd(), 'src', 'index.css'), 'utf8');
    const embed = readFileSync(resolve(process.cwd(), 'src', 'embed.css'), 'utf8');
    expect(standalone).toMatch(/@import\s+'tailwindcss'/);
    expect(embed).not.toMatch(/@import\s+'tailwindcss'\s*(source\(none\))?;/);
    expect(embed).toMatch(/tailwindcss\/theme\.css/);
    expect(embed).toMatch(/tailwindcss\/utilities\.css/);
  });

  it('emits the embeddable stylesheet unlayered', () => {
    // Load-bearing, and not obvious. Tailwind v3 — which the consuming frontend app runs
    // — emits its preflight as plain *unlayered* rules, and unlayered author declarations
    // beat every layered one regardless of import order. Putting these utilities in
    // `layer(utilities)` therefore lets `input { font-size: 100%; font-family: inherit }`
    // win over `text-mobile-body-md`, and the field renders in the host's default face at
    // 16px instead of Figma's 14/20. Measured in a browser against a v3 preflight, not
    // theorised. Unlayered, a class beats an element selector and Figma's values hold.
    // Comments stripped first: the file *explains* why `layer(utilities)` is wrong, and
    // prose naming the thing must not read as the thing.
    const embed = readFileSync(resolve(process.cwd(), 'src', 'embed.css'), 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    );
    expect(embed).not.toMatch(/layer\(\s*(theme|utilities|base)\s*\)/);
    // And the imports are still there — otherwise this would pass on an empty file.
    expect(embed).toMatch(/@import\s+'tailwindcss\/theme\.css'\s*;/);
    expect(embed).toMatch(/@import\s+'tailwindcss\/utilities\.css'\s+source\(none\)\s*;/);
  });

  it('scans .ts as well as .tsx under components', () => {
    // Every component declares its classes in `<Name>.variants.ts`. A `*.tsx`-only
    // glob scans the render functions and misses all of the styling, so the
    // component ships with none of its own utilities and renders unstyled — while
    // still passing every unit test, because jsdom does not apply CSS.
    expect(entry).toMatch(/@source\s+'\.\/components\/\*\*\/\*\.\{ts,tsx\}'/);
  });

  it('excludes tests, stories and tooling from the shipped stylesheet', () => {
    for (const excluded of ['test', 'stories', 'policy']) {
      expect(entry).toMatch(new RegExp(`@source not[^\\n]*${excluded}`));
    }
  });

  it('registers the module the shared focus ring lives in', () => {
    // focusRing is a plain string constant outside components/, so nothing else
    // would tell Tailwind those classes are used.
    expect(entry).toMatch(/@source\s+'\.\/utils\/a11y\.ts'/);
  });

  it('keeps story files available to Storybook only', () => {
    const storybookCss = readFileSync(
      resolve(process.cwd(), '.storybook', 'storybook.css'),
      'utf8',
    );
    expect(storybookCss).toMatch(/@source\s+'\.\.\/src\/\*\*\/\*\.stories\.tsx'/);
  });
});

describe('Elevation is the only shadow foundation', () => {
  /**
   * Every shadow a component applies must come from the Elevation scale.
   *
   * One rule rather than a `not.toContain` in each component's own tests: a
   * per-component check only catches the shadows someone remembered to write a
   * check for, and says nothing about the next component.
   *
   * `inset-ring` is deliberately not covered. It is a ring, not an elevation —
   * Figma's inside-aligned strokes — and it shares the box-shadow property only as
   * an implementation detail.
   */
  const ELEVATION_TOKENS = [
    ...readFileSync(
      resolve(process.cwd(), 'src', 'foundations', 'elevation', 'elevation.css'),
      'utf8',
    ).matchAll(/--shadow-(elevation-[a-z0-9-]+)\s*:/g),
  ].map((m) => m[1]);

  /**
   * Every shipped source a shadow could hide in: the component layer and the shared
   * helpers it draws from. `utils` is included because a shadow helper landing there
   * would otherwise reach every component unchecked.
   */
  function shippedSources(): string[] {
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (/\.tsx?$/.test(entry.name) && !/\.(test|stories|policy)\./.test(entry.name)) {
          found.push(path);
        }
      }
    };
    walk(COMPONENTS);
    walk(resolve(process.cwd(), 'src', 'utils'));
    return found;
  }

  it('reads the token list from the generated foundation, not a hardcoded copy', () => {
    expect(ELEVATION_TOKENS).toHaveLength(8);
    expect(ELEVATION_TOKENS).toContain('elevation-1');
    expect(ELEVATION_TOKENS).toContain('elevation-4-up');
  });

  /**
   * Finds every shadow a source applies that is not on the Elevation scale.
   *
   * Two passes, because a shadow can arrive by two different routes:
   *
   * 1. **Utilities** — `shadow-*`, including arbitrary lists. Each must resolve to
   *    an Elevation token, reached through `var()` when it is a list. This also
   *    catches Tailwind's `drop-shadow-*` utility, which reads as a `shadow-`
   *    match and belongs to no elevation token.
   * 2. **Arbitrary properties** — `[filter:drop-shadow(…)]` and `[box-shadow:…]`
   *    set the CSS directly, so pass 1 cannot see them: `drop-shadow(` has no
   *    hyphen after `shadow` and never matches its pattern. Tooltip is the first
   *    component to need one, and finding that gap is why this pass exists.
   *
   * Shared by the rule and its negative control below, so the control proves the
   * behaviour of the rule rather than of a copy that can drift from it.
   */
  function scanShadows(source: string): string[] {
    const offenders: string[] = [];

    for (const match of source.matchAll(/[\w:-]*\bshadow-[\w[\]().,#/-]*/g)) {
      const cls = match[0];
      const bare = cls.replace(/^[a-z-]+:/g, '');
      if (bare.startsWith('inset-ring')) continue;
      // An arbitrary list is allowed only if every shadow it names is an
      // elevation token reached through var().
      if (bare.startsWith('shadow-[')) {
        const sources = [...bare.matchAll(/var\(--shadow-([a-z0-9-]+)\)/g)].map((m) => m[1]);
        const literal = /shadow-\[\s*[0-9-]/.test(bare);
        if (
          literal ||
          sources.length === 0 ||
          sources.some((s) => !ELEVATION_TOKENS.includes(s!))
        ) {
          offenders.push(cls);
        }
        continue;
      }
      const token = bare.replace(/^shadow-/, '');
      if (!ELEVATION_TOKENS.includes(token)) offenders.push(cls);
    }

    /*
     * A shadow set as an arbitrary property escapes the utility scale entirely, so
     * it is allowed only when the exact class is a written-down exception in the
     * token policy. Keying the allowance to that list rather than to a component
     * name means a new filter shadow cannot be added without declaring a cause and
     * a repayment, and the two lists cannot disagree about what was agreed.
     */
    for (const match of source.matchAll(
      /\[(?:-webkit-)?(?:backdrop-)?(?:filter|box-shadow):[^\]]*\]/g,
    )) {
      const cls = match[0];
      const declaresShadow =
        cls.includes('drop-shadow(') || /^\[(?:-webkit-)?box-shadow:/.test(cls);
      if (!declaresShadow) continue;
      if (Object.hasOwn(DOCUMENTED_EXCEPTIONS, cls)) continue;
      offenders.push(cls);
    }

    return offenders;
  }

  it.each(shippedSources())('%s applies only Elevation shadows', (path) => {
    const source = readFileSync(path, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

    expect(scanShadows(source), `${relative(COMPONENTS, path)} uses non-Elevation shadows`).toEqual(
      [],
    );
  });

  it('rejects a shadow that is not on the Elevation scale', () => {
    // Proves the rule above is not vacuous.
    // Tailwind's own scale, a colour utility, and a literal arbitrary list.
    expect(scanShadows(`'shadow-md'`)).toEqual(['shadow-md']);
    expect(scanShadows(`'shadow-semantic-bg-primary'`)).toEqual(['shadow-semantic-bg-primary']);
    expect(scanShadows(`'shadow-[0_1px_2px_0_#000]'`)).toEqual(['shadow-[0_1px_2px_0_#000]']);
    expect(scanShadows(`'shadow-elevation-1'`)).toEqual([]);
    expect(scanShadows(`'focus:shadow-[var(--shadow-elevation-1),0_0_0_2px_red]'`)).toEqual([]);
    expect(scanShadows(`'inset-ring-semantic-border-primary'`)).toEqual([]);
  });

  it('rejects a filter shadow that no documented exception covers', () => {
    // The gap this pass closes: none of these is a `shadow-` utility, so the
    // utility scan alone reported them as clean.
    const undocumented = '[filter:drop-shadow(0_1px_2px_#0000000a)]';
    expect(scanShadows(`'${undocumented}'`)).toEqual([undocumented]);

    const asBoxShadow = '[box-shadow:0_1px_2px_#0000000a]';
    expect(scanShadows(`'${asBoxShadow}'`)).toEqual([asBoxShadow]);

    // Tailwind's drop-shadow utility, arbitrary and named, was already caught by
    // pass 1 — asserted so that stays true.
    expect(scanShadows(`'drop-shadow-lg'`)).toEqual(['drop-shadow-lg']);
    expect(scanShadows(`'drop-shadow-[0_1px_1px_#000]'`)).toEqual(['drop-shadow-[0_1px_1px_#000]']);

    // A filter that is not a shadow is none of this rule's business.
    expect(scanShadows(`'[filter:blur(4px)]'`)).toEqual([]);
  });

  it('allows exactly the filter shadow the token policy documents', () => {
    // Tooltip's shadow: Figma binds `uui-shadows/shadow-lg`, which is not in the
    // Shadows section the elevation foundation is transcribed from, and it has to be
    // a filter so it traces the bubble and its arrow as one silhouette. The
    // allowance is asserted from both ends — the class is documented, and it is
    // actually reached — so it cannot quietly become either dead or over-broad.
    const tooltipShadow =
      '[filter:drop-shadow(0_2px_1px_#171b220a)_drop-shadow(0_4px_3px_#171b2208)_drop-shadow(0_12px_8px_#171b2214)]';

    expect(Object.hasOwn(DOCUMENTED_EXCEPTIONS, tooltipShadow)).toBe(true);
    expect(scanShadows(`'${tooltipShadow}'`)).toEqual([]);

    // And it is the Tooltip source that uses it, not something else inheriting the
    // allowance by accident.
    const variants = readFileSync(join(COMPONENTS, 'Tooltip', 'Tooltip.variants.ts'), 'utf8');
    expect(variants).toContain(tooltipShadow);

    const users = shippedSources().filter((path) =>
      readFileSync(path, 'utf8').includes(tooltipShadow),
    );
    expect(users.map((p) => relative(COMPONENTS, p))).toEqual(['Tooltip/Tooltip.variants.ts']);
  });
});

describe.each(names.length > 0 ? names : [null])('%s', (name) => {
  if (name === null) {
    it('no components yet', () => {
      expect(names).toEqual([]);
    });
    return;
  }

  it.each([`${name}.tsx`, `${name}.variants.ts`, `${name}.test.tsx`, `${name}.stories.tsx`])(
    'has %s',
    (file) => {
      expect(existsSync(join(COMPONENTS, name, file))).toBe(true);
    },
  );

  it('exports the component and its props type from its own barrel', () => {
    const barrel = read(name, 'index.ts');
    expect(barrel).toContain(`export { ${name} }`);
    expect(barrel).toContain(`export type { ${name}Props }`);
  });

  it('declares its styling in the variants file, not inline', () => {
    // The variant definition is the single place classes are decided; a class
    // string in the component file is styling that no test or review can see.
    //
    // A multi-node component exports one definition per anatomical slot —
    // Input has root, control, element, hint and more — so the requirement is
    // at least one `<camel>…Variants` export, not exactly `<camel>Variants`.
    const camel = name[0]?.toLowerCase() + name.slice(1);
    const source = read(name, `${name}.variants.ts`);
    expect(source).toMatch(new RegExp(`export const ${camel}\\w*Variants`));
  });

  it('routes its classes through the variant definition', () => {
    expect(read(name, `${name}.tsx`)).toMatch(/Variants\(\{/);
  });

  it('titles its stories under Components/', () => {
    expect(read(name, `${name}.stories.tsx`)).toContain(`title: 'Components/${name}'`);
  });
});

/**
 * The React client boundary has to survive bundling.
 *
 * Source `'use client'` directives are stripped when Rollup merges modules into a chunk, so
 * the *source* having them proves nothing about the *package*. Without the directive on the
 * built file, a Next App Router consumer importing any hook-using component gets
 * "you're importing a component that needs useState". This asserts the build config still
 * re-declares it, and that the source directives are present on the modules that need them.
 */
describe('the client boundary', () => {
  const CLIENT_MODULES = [
    'Avatar/Avatar.tsx',
    // useId, for the aria-labelledby that ties the nested Radio to the name.
    'BeneficiarySelector/BeneficiarySelector.tsx',
    'Checkbox/Checkbox.tsx',
    'Input/Input.tsx',
    'InputDropdown/InputDropdown.tsx',
    'OtpInput/OtpInput.tsx',
    'Radio/Radio.tsx',
    'Radio/RadioGroup.tsx',
    'Radio/radio-context.ts',
    'SearchBar/SearchBar.tsx',
    'SearchBar/components/SearchBarPlaceholder.tsx',
    'Textarea/Textarea.tsx',
    'Toggle/Toggle.tsx',
  ];

  /** Type-only React imports and no hooks, so these stay server-safe in source. */
  const SERVER_SAFE = [
    'Button/Button.tsx',
    'IconButton/IconButton.tsx',
    'Tag/Tag.tsx',
    // The chip is inert: Figma draws no control, so it holds no state.
    'BeneficiarySelectChip/BeneficiarySelectChip.tsx',
    // Callbacks are the caller's; nothing here is stateful, so no hooks are needed.
    'UploadModule/UploadModule.tsx',
    // Toast renders what Figma draws; timing, placement and dismissal are the caller's.
    'Toast/Toast.tsx',
    // A rule is one element and three axes — nothing to hold.
    'Divider/Divider.tsx',
    // The sheet draws; mounting, focus and dismissal stay with whatever shows it.
    'BottomSheet/BottomSheet.tsx',
    // The modal draws; the parent owns visibility and `onClose` only reports the press.
    'Modal/Modal.tsx',
    // Tooltip renders what Figma draws and owns no visibility or placement state, so
    // it needs no hooks — see the note in Tooltip.tsx on why the trigger is the
    // caller's. If it ever gains one, it moves to CLIENT_MODULES.
    'Tooltip/Tooltip.tsx',
    'Tooltip/components/TooltipArrow.tsx',
    // TopNavigationBar publishes no behaviour Figma does not draw — no menu, sticky or
    // scroll handling — so it holds no state and needs no hooks either.
    'TopNavigationBar/TopNavigationBar.tsx',
    'TopNavigationBar/components/NavigationMiddleSlot.tsx',
    'TopNavigationBar/components/NavigationActionItem.tsx',
    'TopNavigationBar/components/NavigationAccount.tsx',
    'TopNavigationBar/assets/mb-logo.tsx',
  ];

  it.each(CLIENT_MODULES)('%s declares the directive on line 1', (file) => {
    const source = readFileSync(join(COMPONENTS, file), 'utf8');
    expect(source.split('\n')[0]).toBe("'use client';");
  });

  it.each(SERVER_SAFE)('%s stays server-safe: no directive, no hooks', (file) => {
    const source = readFileSync(join(COMPONENTS, file), 'utf8');
    expect(source.startsWith("'use client'")).toBe(false);
    // Hooks are what force a client boundary. `forwardRef` is a value import but runs
    // fine on the server, so the test is for hook calls rather than for value imports.
    const hooks = source.match(/\buse[A-Z][A-Za-z]*\(/g) ?? [];
    expect(hooks, `${file} calls hooks`).toEqual([]);
  });

  it('re-declares the boundary on the built bundle', () => {
    // The build config must carry it, because the source directives do not survive.
    const config = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');
    expect(config).toMatch(/banner:\s*"'use client';"/);
  });
});
