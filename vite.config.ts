/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import dts from 'unplugin-dts/vite';

const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      tsconfigPath: './tsconfig.app.json',
      // `*.policy.ts` is validation tooling for the component token rule: it runs
      // under Vitest, is unreachable from the entry point, and must not ship types.
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.{ts,tsx}', 'src/**/*.policy.ts'],
    }),
  ],
  resolve: {
    alias: {
      '@': resolvePath('./src'),
      '@assets': resolvePath('./src/assets'),
      '@foundations': resolvePath('./src/foundations'),
      '@tokens': resolvePath('./src/tokens'),
      '@themes': resolvePath('./src/themes'),
      '@components': resolvePath('./src/components'),
      '@icons': resolvePath('./src/icons'),
      '@hooks': resolvePath('./src/hooks'),
      '@utils': resolvePath('./src/utils'),
      '@types': resolvePath('./src/types'),
      '@styles': resolvePath('./src/styles'),
    },
  },
  build: {
    lib: {
      entry: {
        index: resolvePath('./src/index.ts'),
        // Two stylesheets, same tokens and utilities: `styles` carries Tailwind's
        // preflight for standalone use, `embed` omits it for apps that already have a
        // reset. See the comments in each entry file.
        styles: resolvePath('./src/index.css'),
        embed: resolvePath('./src/embed.css'),
      },
      formats: ['es'],
    },
    cssCodeSplit: true,
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        // The motion layer the frontend repo already ships. External so a consuming app
        // resolves one copy rather than getting a second bundled inside this package.
        'framer-motion',
      ],
      output: {
        // `[name]` is the entry name, so each CSS entry keeps its own file rather than
        // both collapsing onto one hardcoded filename.
        assetFileNames: '[name].css',
        /*
         * Re-declare the React client boundary on the bundle.
         *
         * The `'use client'` directives in source do **not** survive bundling — Rollup
         * strips module-level directives when it merges modules into a chunk, so the built
         * `index.js` carried none and a Next App Router consumer still hit
         * "you're importing a component that needs useState" on Checkbox, Input,
         * InputDropdown, OtpInput, Radio, Textarea and Toggle. Verified by grepping the
         * built file, not assumed.
         *
         * Because the library emits one chunk, this marks the whole package as client
         * code. That is coarser than the source, where Button, IconButton and Tag are
         * deliberately server-safe: they use type-only React imports and no hooks. The
         * trade is deliberate — a library that cannot be imported at all is worse than one
         * whose three static components also ship to the client, and these are interactive
         * UI primitives rather than content.
         *
         * Recovering the granularity means `preserveModules` plus a per-chunk banner, which
         * changes the published file layout. Recorded in docs/Component-Architecture.md
         * rather than done here.
         */
        banner: "'use client';",
      },
    },
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    css: true,
    setupFiles: ['./vitest.setup.ts'],
    // Design-data validation lives in *.verify.test.ts and runs separately via
    // `pnpm verify:tokens`. It fails while Figma has unresolved aliases, which is
    // a data problem, not a generator regression — see vitest.verify.config.ts.
    exclude: ['**/node_modules/**', '**/dist/**', 'src/**/*.verify.test.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.stories.{ts,tsx}', 'src/**/index.ts'],
    },
  },
});
