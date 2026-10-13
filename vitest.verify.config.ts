import { mergeConfig, type ViteUserConfig } from 'vitest/config';
// The `.ts` extension is required: tsconfig.node.json uses `module: nodenext`,
// under which a relative import without an extension does not resolve.
import base from './vite.config.ts';

/**
 * Design-data validation, run by `pnpm verify:tokens`.
 *
 * Separate from `pnpm test` on purpose. The two suites answer different questions
 * and fail for different reasons:
 *
 *   pnpm test           Is the generator correct? Owned by engineering. Always green.
 *   pnpm verify:tokens  Is the design data complete? Owned by design. Red while
 *                       Figma still has unresolved aliases, missing primitive
 *                       groups or deprecated references.
 *
 * Keeping them together meant a permanently red `pnpm test`, which trains people
 * to ignore it and hides a real generator regression behind an expected failure.
 * CI runs both as separate jobs so each failure points at the right owner.
 *
 * The base config is merged in for its path aliases, which the verify suite needs
 * to import `@tokens/*`.
 */
const config = mergeConfig(base, {
  test: {
    name: 'verify-tokens',
    include: ['src/**/*.verify.test.ts'],
  },
} satisfies ViteUserConfig) as ViteUserConfig;

// `mergeConfig` concatenates arrays, so the base config's exclusion of
// `*.verify.test.ts` would survive the merge and exclude the very files this
// config exists to run. Replace it outright rather than appending to it.
config.test!.exclude = ['**/node_modules/**', '**/dist/**'];

export default config;
