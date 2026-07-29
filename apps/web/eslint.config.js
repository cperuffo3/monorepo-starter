/**
 * ESLint configuration for web application.
 * Uses flat config format (ESLint 9+).
 *
 * Architectural boundaries (eslint-plugin-boundaries) enforce the layer
 * taxonomy documented in .documentation/devdocs/organization.md:
 *
 *   ui                → generic primitives (shadcn/ui); no app knowledge
 *   shared-components → app-specific reusables (components/common, layout)
 *   feature           → self-contained slices; may not import other features
 *   hooks/lib/config  → shared foundations; may not import UI or features
 */
import eslint from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import checkFile from 'eslint-plugin-check-file';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tailwindCanonicalClasses from 'eslint-plugin-tailwind-canonical-classes';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaVersion: 2020,
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'tailwind-canonical-classes': tailwindCanonicalClasses,
      boundaries,
      'check-file': checkFile,
    },
    settings: {
      'import/resolver': {
        typescript: {
          // Not tsconfig.json: its `references` field makes unrs-resolver
          // treat it as a solution file and ignore its `paths` mapping.
          project: './tsconfig.eslint.json',
        },
      },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'ui', pattern: 'src/components/ui' },
        { type: 'shared-components', pattern: 'src/components' },
        { type: 'features-barrel', pattern: 'src/features/index.ts', mode: 'file' },
        { type: 'feature', pattern: 'src/features/*', capture: ['featureName'] },
        { type: 'hooks', pattern: 'src/hooks' },
        { type: 'lib', pattern: 'src/lib' },
        { type: 'config', pattern: 'src/config' },
        { type: 'providers', pattern: 'src/providers' },
        { type: 'styles', pattern: 'src/styles' },
        { type: 'app', pattern: 'src/*', mode: 'full' },
      ],
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/../../..*'],
              message:
                'Use the @/* alias instead of deeply nested relative imports (../../ or deeper)',
            },
          ],
        },
      ],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          message:
            '{{from.element.type}} code may not import {{to.element.type}} code (see .documentation/devdocs/organization.md)',
          policies: [
            {
              from: { element: { type: 'ui' } },
              allow: { to: { element: { type: ['ui', 'lib', 'hooks'] } } },
            },
            {
              from: { element: { type: 'shared-components' } },
              allow: {
                to: {
                  element: {
                    type: ['ui', 'shared-components', 'lib', 'hooks', 'config'],
                  },
                },
              },
            },
            {
              from: { element: { type: 'feature' } },
              allow: {
                to: [
                  {
                    element: {
                      type: ['ui', 'shared-components', 'lib', 'hooks', 'config'],
                    },
                  },
                  {
                    element: {
                      type: 'feature',
                      captured: { featureName: '{{from.element.captured.featureName}}' },
                    },
                  },
                ],
              },
            },
            {
              from: { element: { type: 'features-barrel' } },
              allow: { to: { element: { type: 'feature' } } },
            },
            {
              from: { element: { type: 'hooks' } },
              allow: { to: { element: { type: ['hooks', 'lib', 'config'] } } },
            },
            {
              from: { element: { type: 'lib' } },
              allow: { to: { element: { type: ['lib', 'config'] } } },
            },
            {
              from: { element: { type: 'config' } },
              allow: { to: { element: { type: 'config' } } },
            },
            {
              from: { element: { type: 'providers' } },
              allow: {
                to: {
                  element: {
                    type: ['ui', 'shared-components', 'lib', 'hooks', 'config'],
                  },
                },
              },
            },
            {
              from: { element: { type: 'app' } },
              allow: {
                to: {
                  element: {
                    type: [
                      'ui',
                      'shared-components',
                      'feature',
                      'features-barrel',
                      'hooks',
                      'lib',
                      'config',
                      'providers',
                      'styles',
                      'app',
                    ],
                  },
                },
              },
            },
            // Barrel enforcement (formerly boundaries/entry-point, deprecated in v7).
            // Policies are last-match-wins, so this must stay last: it adds a
            // disallow on top of whatever the layer policies above allowed.
            {
              to: { element: { type: 'feature' } },
              disallow: { to: { element: { fileInternalPath: '!index.ts' } } },
              message: 'Import features through their barrel (index.ts), not internal files',
            },
          ],
        },
      ],
      'check-file/filename-naming-convention': [
        'error',
        { 'src/**/*.{ts,tsx}': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': ['error', { 'src/**/': 'KEBAB_CASE' }],
      'tailwind-canonical-classes/tailwind-canonical-classes': [
        'warn',
        {
          cssPath: './src/index.css',
        },
      ],
    },
  },
  {
    // Config files run in Node, not the browser — give them Node globals
    // (e.g. __dirname) so no-undef doesn't flag them.
    files: ['*.config.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // main.tsx is the app entry point (createRoot render) — it has no exports
    // and fast refresh doesn't apply to it, so the only-export-components rule
    // (stricter since react-refresh v0.5) would flag the lazy() route wrapper.
    files: ['src/main.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // shadcn/ui primitives are vendored code managed by the shadcn CLI and
    // regenerated on `npx shadcn@latest add`. Relax the project's stricter
    // stylistic/compiler lints for them so component updates stay drop-in.
    // Hand-written files in this folder (theme-toggle, the barrel) stay strict.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    ignores: ['src/components/ui/theme-toggle.tsx', 'src/components/ui/index.ts'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/purity': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'tailwind-canonical-classes/tailwind-canonical-classes': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'vite.config.d.ts'],
  },
);
